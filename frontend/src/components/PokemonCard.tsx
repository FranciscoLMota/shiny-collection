
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { DexEntry } from "../types/pokemon";
import { LocateFixed, Sparkles } from "lucide-react";
import Button from "./Button";

interface PokemonCardProps {
  pokemon: DexEntry;
  onClick: (id: number) => void;
  onQuickAdd?: (dexEntryId: number) => Promise<void>;
  onQuickHunt?: (dexEntryId: number) => Promise<void>;
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
      className={`rounded-md px-2.5 py-1 font-body text-xs font-medium text-white ${
        typeColors[type.toLowerCase()] ?? "bg-surface-hover"
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

// Pokédex entry card with collection, hunt, and hover actions.
export default function PokemonCard({
  pokemon,
  onClick,
  onQuickAdd,
  onQuickHunt,
}: PokemonCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const dexNumber = String(
    pokemon.species.nationalDexNumber
  ).padStart(4, "0");

  const collection = pokemon.collection;
  const isObtained = collection?.isObtained ?? false;
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isCreatingHunt, setIsCreatingHunt] = useState(false);
  const [huntCreated, setHuntCreated] = useState(false);
  const [huntError, setHuntError] = useState<string | null>(null);
  const previousObtained = useRef(isObtained);
  const [shinyTransition, setShinyTransition] = useState(false);

  useEffect(() => {
    if (!previousObtained.current && isObtained) {
      setShinyTransition(true);
      const timeout = window.setTimeout(
        () => setShinyTransition(false),
        850
      );
      previousObtained.current = isObtained;
      return () => window.clearTimeout(timeout);
    }

    previousObtained.current = isObtained;
  }, [isObtained]);

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

  async function handleQuickAdd(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (isAdding || isObtained || !onQuickAdd) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await onQuickAdd(pokemon.id);
    } catch (error) {
      setAddError(
        error instanceof Error
          ? error.message
          : "Unable to add Pokémon"
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function handleQuickHunt(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (isCreatingHunt || huntCreated || isObtained || !onQuickHunt) return;

    setIsCreatingHunt(true);
    setHuntError(null);

    try {
      await onQuickHunt(pokemon.id);
      setHuntCreated(true);
    } catch (error) {
      setHuntError(
        error instanceof Error ? error.message : "Unable to create hunt"
      );
    } finally {
      setIsCreatingHunt(false);
    }
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
          ${shinyTransition ? "pokemon-shiny-transition" : ""}
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

        <div className="flex items-center justify-between text-muted">
          <span className="font-mono text-micro uppercase tracking-widest">#{dexNumber}</span>
          {pokemon.region && (
            <span className="font-mono text-micro uppercase tracking-widest text-gold">
              {pokemon.region}
            </span>
          )}
          <div className="pt-1">
            {isObtained ? (
              <Sparkles size={16} color="#ffffff" aria-hidden="true" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant="accent"
                    type="button"
                    disabled={isAdding || !onQuickAdd}
                    onClick={handleQuickAdd}
                    className="
            flex min-w-0 flex-1 items-center justify-center gap-2
            rounded-lg border border-gold/40
            bg-gold/10 px-3 py-2
            font-body text-xs font-medium text-gold
            transition-all duration-200
            hover:border-gold hover:bg-gold hover:text-obsidian
            disabled:cursor-not-allowed disabled:opacity-50
          "
                  >
                    {isAdding ? "Adding..." : <span className="text-base leading-none">+</span>}
                  </Button>
                  {onQuickHunt && (
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={isCreatingHunt || huntCreated}
                      onClick={handleQuickHunt}
                      aria-label={
                        huntCreated
                          ? "Hunt created"
                          : isCreatingHunt
                            ? "Creating hunt"
                            : `Create a hunt for ${pokemon.displayName}`
                      }
                      title={
                        huntCreated
                          ? "Hunt created"
                          : isCreatingHunt
                            ? "Creating hunt..."
                            : "Add hunt"
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-success/40 bg-success/10 text-success transition-colors hover:border-success hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LocateFixed size={16} aria-hidden="true" />
                    </Button>
                  )}
                </div>
                {addError && (
                  <p role="alert" className="mt-2 font-body text-xs text-red-400">
                    {addError}
                  </p>
                )}
                {huntError && (
                  <p role="alert" className="mt-2 font-body text-xs text-red-400">
                    {huntError}
                  </p>
                )}
              </>
            )}
          </div>
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
            <span className="font-body text-sm text-muted">
              No image available
            </span>
          )}
        </div>
        <h3 className="mb-3 flex min-w-0 items-center gap-2 font-display text-base font-semibold">
          <span className="truncate">{pokemon.displayName}</span>
          {isObtained && (
            <span className="shrink-0 font-body text-xs font-medium text-gold">
              x{Math.max(collection?.ownedCount ?? 0, 1)}
            </span>
          )}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <TypeBadge type={pokemon.primaryType} />
          {pokemon.secondaryType && (
            <TypeBadge type={pokemon.secondaryType} />
          )}
        </div>

      </article>
    </div>
  );
}
