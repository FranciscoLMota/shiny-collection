
export interface PokemonSpecies {
  id: number;
  nationalDexNumber: number;
  name: string;
  generation: number;
  genus: string | null;
  description: string | null;
  color: string | null;
  habitat: string | null;
  isBaby: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  evolutionChainId: number | null;
}

export interface OwnedPokemon {
  id: number;
  dexEntryId: number;
  nickname: string | null;
  gameOrigin: string | null;
  obtainedAt: string | null;
  isInHome: boolean;
  notes: string | null;
}

export interface Hunt {
  id: number;
  dexEntryId: number;
  game: string | null;
  method: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "PAUSED";
  encounters: number;
}

export interface DexEntry {
  id: number;
  speciesId: number;
  pokeApiPokemonId: number | null;
  formKey: string;
  displayName: string;
  region: string | null;
  isRequired: boolean;

  primaryType: string;
  secondaryType: string | null;
  abilities: string[];
  hiddenAbility: string | null;

  height: number | null;
  weight: number | null;

  hp: number | null;
  attack: number | null;
  defense: number | null;
  specialAttack: number | null;
  specialDefense: number | null;
  speed: number | null;

  spriteDefault: string | null;
  spriteShiny: string | null;
  artworkDefault: string | null;
  artworkShiny: string | null;

  species: PokemonSpecies;
  ownedPokemon?: OwnedPokemon[];
  hunts?: Hunt[];
  collection?: {
    ownedCount: number;
    isObtained: boolean;
    isInHome: boolean;
  };
}

export interface PokemonListResponse {
  data: DexEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PokemonDetailResponse {
  data: DexEntry;
}
