
import { prisma } from "../lib/prisma.js";

const API = "https://pokeapi.co/api/v2";
const REGIONS = ["alola", "galar", "hisui", "paldea"];
const LIMIT = Number(process.env.IMPORT_LIMIT ?? 2000);

type NamedResource = {
  name: string;
  url: string;
};

type SpeciesResponse = {
  id: number;
  name: string;
  generation: NamedResource;
  genera: Array<{ genus: string; language: NamedResource }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: NamedResource;
  }>;
  color: NamedResource | null;
  habitat: NamedResource | null;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  evolution_chain: { url: string } | null;
  varieties: Array<{
    is_default: boolean;
    pokemon: NamedResource;
  }>;
};

type PokemonResponse = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{
    slot: number;
    type: NamedResource;
  }>;
  abilities: Array<{
    is_hidden: boolean;
    ability: NamedResource;
  }>;
  stats: Array<{
    base_stat: number;
    stat: NamedResource;
  }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
      ["official-artwork"]?: {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  };
};

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resourceId(url: string): number {
  const id = Number(url.match(/\/(\d+)\/?$/)?.[1]);
  if (!Number.isInteger(id)) {
    throw new Error(`Invalid resource ID: ${url}`);
  }
  return id;
}

async function fetchJson<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 1000)
      );
    }
  }

  throw new Error(`Failed to fetch ${url}`);
}

function getStat(pokemon: PokemonResponse, name: string) {
  return pokemon.stats.find((stat) => stat.stat.name === name)
    ?.base_stat ?? null;
}

async function importSpecies(id: number) {
  const species = await fetchJson<SpeciesResponse>(
    `${API}/pokemon-species/${id}/`
  );

  const genus = species.genera.find(
    (entry) => entry.language.name === "en"
  )?.genus;

  const description = species.flavor_text_entries.find(
    (entry) => entry.language.name === "en"
  )?.flavor_text.replace(/\s+/g, " ").trim();

  await prisma.pokemonSpecies.upsert({
    where: { nationalDexNumber: species.id },
    update: {
      name: titleCase(species.name),
      generation: resourceId(species.generation.url),
      genus,
      description,
      color: species.color?.name ?? null,
      habitat: species.habitat?.name ?? null,
      isBaby: species.is_baby,
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
      evolutionChainId: species.evolution_chain
        ? resourceId(species.evolution_chain.url)
        : null,
    },
    create: {
      nationalDexNumber: species.id,
      name: titleCase(species.name),
      generation: resourceId(species.generation.url),
      genus,
      description,
      color: species.color?.name ?? null,
      habitat: species.habitat?.name ?? null,
      isBaby: species.is_baby,
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
      evolutionChainId: species.evolution_chain
        ? resourceId(species.evolution_chain.url)
        : null,
    },
  });

  const savedSpecies = await prisma.pokemonSpecies.findUniqueOrThrow({
    where: { nationalDexNumber: species.id },
  });

  const varieties = species.varieties.filter((variety) =>
    variety.is_default ||
    REGIONS.some((region) =>
      variety.pokemon.name.endsWith(`-${region}`)
    )
  );

  for (const variety of varieties) {
    const pokemon = await fetchJson<PokemonResponse>(
      variety.pokemon.url
    );

    const region = REGIONS.find((value) =>
      variety.pokemon.name.endsWith(`-${value}`)
    );

    const formKey = region ?? "standard";

    const types = [...pokemon.types].sort(
      (a, b) => a.slot - b.slot
    );

    const regularAbilities = pokemon.abilities
      .filter((entry) => !entry.is_hidden)
      .map((entry) => entry.ability.name);

    const hiddenAbility = pokemon.abilities.find(
      (entry) => entry.is_hidden
    )?.ability.name;

    const data = {
      displayName: region
        ? `${titleCase(region)} ${titleCase(species.name)}`
        : titleCase(species.name),
      pokeApiPokemonId: pokemon.id,
      region: region ?? null,
      primaryType: types[0].type.name,
      secondaryType: types[1]?.type.name ?? null,
      abilities: regularAbilities,
      hiddenAbility: hiddenAbility ?? null,
      height: pokemon.height,
      weight: pokemon.weight,
      hp: getStat(pokemon, "hp"),
      attack: getStat(pokemon, "attack"),
      defense: getStat(pokemon, "defense"),
      specialAttack: getStat(pokemon, "special-attack"),
      specialDefense: getStat(pokemon, "special-defense"),
      speed: getStat(pokemon, "speed"),
      spriteDefault: pokemon.sprites.front_default,
      spriteShiny: pokemon.sprites.front_shiny,
      artworkDefault:
        pokemon.sprites.other?.["official-artwork"]?.front_default
        ?? null,
      artworkShiny:
        pokemon.sprites.other?.["official-artwork"]?.front_shiny
        ?? null,
    };

    await prisma.dexEntry.upsert({
      where: {
        speciesId_formKey: {
          speciesId: savedSpecies.id,
          formKey,
        },
      },
      update: data,
      create: {
        speciesId: savedSpecies.id,
        formKey,
        ...data,
      },
    });
  }

  console.log(
    `#${String(id).padStart(4, "0")} ${species.name} (${varieties.length} entries)`
  );
}

async function main() {
  if (!Number.isInteger(LIMIT) || LIMIT < 1) {
    throw new Error("IMPORT_LIMIT must be a positive integer");
  }

  const listing = await fetchJson<{
    results: NamedResource[];
  }>(`${API}/pokemon-species?limit=${LIMIT}`);

  let imported = 0;
  let failed = 0;

  for (const entry of listing.results) {
    try {
      await importSpecies(resourceId(entry.url));
      imported++;
    } catch (error) {
      failed++;
      console.error(`Failed: ${entry.name}`, error);
    }
  }

  console.log(`Finished: ${imported} species, ${failed} failures`);

  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
