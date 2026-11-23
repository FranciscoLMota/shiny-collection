
import { useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { DexEntry } from "../types/pokemon";

interface PokemonCardProps {
  pokemon: DexEntry;
  onClick: (id: number) => void;
}

const typeColors: Record<string, string> = {
  normal: "bg-[#77776d]",
  fire: "bg-[#c45b3c]",
  water: "bg-[#487bb5]",
  electric: "bg-[#b99b35]",
  grass: "bg-[#4f9458]",
  ice: "bg-[#5a9ea9]",
  fighting: "bg-[#a85b45]",
  poison: "bg-[#8553a0]",
  ground: "bg-[#a17d4b]",
  flying: "bg-[#718eb4]",
  psychic: "bg-[#b85b85]",
  bug: "bg-[#7d923b]",
  rock: "bg-[#8d8063]",
  ghost: "bg-[#675b93]",
  dragon: "bg-[#6555a5]",
  dark: "bg-[#55515a]",
  steel: "bg-[#738b91]",
  fairy: "bg-[#ae779f]",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-semibold text-white ${typeColors[type.toLowerCase()] ?? "bg-surface-hover"
        }`}
    >
      {type}
    </span>
  );
}


type CardStyle = CSSProperties & {
  "--pointer-x": string;
  "--pointer-y": string;
  "--rotate-x": string;
  "--rotate-y": string;
};

const defaultStyle: CardStyle = {
  "--pointer-x": "50%",
  "--pointer-y": "50%",
  "--rotate-x": "0deg",
  "--rotate-y": "0deg",
};

export default function PokemonCard({
  pokemon,
  onClick,
}: PokemonCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const dexNumber = String(
    pokemon.species.nationalDexNumber
  ).padStart(4, "0");

  const sprite =
    pokemon.spriteShiny ??
    pokemon.artworkShiny ??
    pokemon.spriteDefault;

  const collection = pokemon.collection;
  const isObtained = collection?.isObtained ?? false;
  const isInHome = collection?.isInHome ?? false;

  const image = isObtained
    ? pokemon.spriteShiny ??
    pokemon.artworkShiny ??
    pokemon.spriteDefault ??
    pokemon.artworkDefault
    : pokemon.spriteDefault ??
    pokemon.artworkDefault;

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * 12;
    const rotateX = (0.5 - y) * 12;

    card.style.setProperty("--pointer-x", `${x * 100}%`);
    card.style.setProperty("--pointer-y", `${y * 100}%`);
    card.style.setProperty("--rotate-x", `${rotateX}deg`);
    card.style.setProperty("--rotate-y", `${rotateY}deg`);
  }

  function handleMouseLeave() {
    setIsHovered(false);

    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--pointer-x", "50%");
    card.style.setProperty("--pointer-y", "50%");
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
  }



  return (
    <div className="group relative [perspective:1000px]">
      <article
        ref={cardRef}

        onClick={() => onClick(pokemon.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={defaultStyle}
        className={`
          pokemon-tilt-card relative isolate h-full overflow-hidden
          rounded-xl border p-4
          ${isObtained
            ? "border-zinc-100 bg-zinc-700"
            : "border-border bg-surface"
          }
        `}
      >
        {isObtained && (
          <>
            <div className="pokemon-holo pointer-events-none absolute inset-0 z-0" />
            <div className="pokemon-holo-glare pointer-events-none absolute inset-0 z-0" />
          </>
        )}

        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-mono">#{dexNumber}</span>
          {pokemon.region && (
            <span className="capitalize text-gold">
              {pokemon.region}
            </span>
          )}
        </div>

        <div className="flex h-36 items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={`${isObtained ? "Shiny " : ""}${pokemon.displayName}`}
              loading="lazy"
              className={`
                  h-28 w-28 object-contain
                  [image-rendering:pixelated]
                  transition-transform duration-300
                  ${isHovered ? "scale-110" : ""}
                `}
            />
          ) : (
            <span className="text-sm text-muted">
              No image available
            </span>
          )}
        </div>
        <h3 className="mb-3 truncate font-display text-base font-semibold">
          {pokemon.displayName}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <TypeBadge type={pokemon.primaryType} />
          {pokemon.secondaryType && (
            <TypeBadge type={pokemon.secondaryType} />
          )}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          {isInHome ? (
            <span className="text-xs font-medium text-success">
              ✓ In Pokémon HOME
            </span>
          ) : isObtained ? (
            <span className="text-xs font-medium text-gold">
              ✦ Obtained
            </span>
          ) : (
            <span className="text-xs text-muted">
              Not collected
            </span>
          )}

          {(collection?.ownedCount ?? 0) > 1 && (
            <span className="ml-2 text-xs text-muted">
              ×{collection?.ownedCount}
            </span>
          )}

        </div>
      </article>
    </div >
  );
}
