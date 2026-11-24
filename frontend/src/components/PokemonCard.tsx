
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { DexEntry } from "../types/pokemon";
import { LocateFixed, Sparkles } from "lucide-react";
import Button from "./Button";
import { GraphicMark } from "./GraphicMark";
import DexBarcode from "./DexBarcode";
import FigureLabel from "./FigureLabel";

interface PokemonCardProps {
  pokemon: DexEntry;
  onClick: (id: number) => void;
  entranceDelay?: number;
  onQuickAdd?: (dexEntryId: number) => Promise<void>;
  onQuickHunt?: (dexEntryId: number) => Promise<void>;
}

function TypeBadge({ type }: { type: string }) {
  return <span className="type-label">{type}</span>;
}

type CardStyle = CSSProperties & {
  "--pointer-x": string;
  "--pointer-y": string;
  "--rotate-x": string;
  "--rotate-y": string;
};

interface CardSparkle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

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
  entranceDelay = 0,
  onQuickAdd,
  onQuickHunt,
}: PokemonCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [sparkles, setSparkles] = useState<CardSparkle[]>([]);

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

  function handleMouseEnter() {
    setIsHovered(true);
    if (!isObtained) return;

    setSparkles(
      Array.from({ length: 6 }, (_, id) => ({
        id,
        left: 8 + Math.random() * 84,
        top: 8 + Math.random() * 84,
        size: 12 + Math.round(Math.random() * 8),
        delay: Math.round(Math.random() * 700),
        duration: 900 + Math.round(Math.random() * 700),
      }))
    );
  }

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

    const rotateY = (x - 0.5) * 22;
    const rotateX = (0.5 - y) * 22;

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
    <div
      className="pokemon-card-enter group relative [perspective:1000px]"
      style={{ animationDelay: `${entranceDelay}ms` }}
    >
      <article
        ref={cardRef}
        onClick={() => onClick(pokemon.id)}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={defaultStyle}
        className={`
          pokemon-tilt-card specimen-card isolate flex h-full cursor-pointer flex-col
          ${shinyTransition ? "pokemon-shiny-transition" : ""}
          ${isObtained
            ? "specimen-recorded"
            : ""
          }
        `}
      >
        {isObtained && (
          <>
            <div className="pokemon-holo pointer-events-none absolute inset-0 z-0" />
            <div className="pokemon-holo-glare pointer-events-none absolute inset-0 z-0" />
          </>
        )}

        {isObtained && isHovered && (
          <div
            aria-hidden="true"
            className="pokemon-sparkle-layer pointer-events-none absolute inset-0 z-10"
          >
            {sparkles.map((sparkle) => (
              <span
                key={sparkle.id}
                className="pokemon-sparkle absolute"
                style={{
                  left: `${sparkle.left}%`,
                  top: `${sparkle.top}%`,
                  width: `${sparkle.size}px`,
                  height: `${sparkle.size}px`,
                  animationDelay: `${sparkle.delay}ms`,
                  animationDuration: `${sparkle.duration}ms`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative flex flex-wrap items-center justify-between gap-1 text-muted">
          <span className="font-mono text-micro uppercase tracking-widest">#{dexNumber}</span>
          {pokemon.region && (
            <span className="font-mono text-micro uppercase tracking-widest text-ink">
              {pokemon.region}
            </span>
          )}
          <div className="pt-1">
            {isObtained ? (
              <span className="status text-ink"><Sparkles size={12} strokeWidth={1.5} aria-hidden="true" /></span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant="accent"
                    type="button"
                    disabled={isAdding || !onQuickAdd}
                    onClick={handleQuickAdd}
                    aria-label={`Add ${pokemon.displayName} to collection`}
                    className={isAdding ? "" : "btn-icon"}
                  >
                    {isAdding ? "Adding..." : <span className="text-base leading-none">+</span>}
                  </Button>
                  {onQuickHunt && (
                    <Button
                      variant="icon"
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
                    >
                      <LocateFixed size={16} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  )}
                </div>
                {addError && (
                  <p role="alert" className="mt-2 font-body text-xs text-danger">
                    {addError}
                  </p>
                )}
                {huntError && (
                  <p role="alert" className="mt-2 font-body text-xs text-danger">
                    {huntError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="orbital-frame relative my-3 flex h-28 items-center justify-center">
          <GraphicMark variant="target" className="orbital-target" />
          <FigureLabel
            number={3}
            subject="Dex"
            className="absolute right-1 bottom-1 z-10 bg-canvas/80 px-1 py-0.5 text-ink"
          />
          {image ? (
            <img
              src={image}
              alt={`${isObtained ? "Shiny " : ""}${pokemon.displayName}`}
              loading="lazy"
              className={`
                  relative h-24 w-24 object-contain
                  [image-rendering:pixelated]
                  transition-transform duration-200 motion-reduce:transition-none
                  ${isHovered ? "motion-safe:scale-105" : ""}
                `}
            />
          ) : (
            <span className="font-body text-sm text-muted">
              No image available
            </span>
          )}
        </div>
        <h3 className="mb-2 flex min-w-0 items-center justify-between gap-2 font-display text-base font-semibold">
          <button type="button" className="min-w-0 flex-1 truncate text-left">
            {pokemon.displayName}
          </button>
          {isObtained && (
            <span className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-ink">
              x{Math.max(collection?.ownedCount ?? 0, 1)}
            </span>
          )}
        </h3>

        <div className="relative mt-auto flex items-end justify-between gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <TypeBadge type={pokemon.primaryType} />
            {pokemon.secondaryType && (
              <TypeBadge type={pokemon.secondaryType} />
            )}
          </div>
          <DexBarcode
            nationalDexNumber={pokemon.species.nationalDexNumber}
          />
        </div>

      </article>
    </div>
  );
}
