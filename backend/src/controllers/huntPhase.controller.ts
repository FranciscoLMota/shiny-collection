
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const phaseInclude = {
  dexEntry: {
    include: { species: true },
  },
  ownedPokemon: true,
} as const;

export async function getHuntPhases(
  req: Request,
  res: Response
): Promise<void> {
  const huntId = parseId(req.params.id);

  if (!huntId) {
    res.status(400).json({ error: "Invalid hunt ID" });
    return;
  }

  try {
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      select: { id: true },
    });

    if (!hunt) {
      res.status(404).json({ error: "Hunt not found" });
      return;
    }

    const phases = await prisma.huntPhase.findMany({
      where: { huntId },
      include: phaseInclude,
      orderBy: { phaseNumber: "asc" },
    });

    res.json({ data: phases });
  } catch (error) {
    console.error("Failed to load phases:", error);
    res.status(500).json({ error: "Unable to load phases" });
  }
}

export async function createHuntPhase(
  req: Request,
  res: Response
): Promise<void> {
  const huntId = parseId(req.params.id);
  const dexEntryId = parseId(req.body?.dexEntryId);
  const addToCollection = req.body?.addToCollection ?? true;
  const notes = req.body?.notes ?? null;

  if (!huntId || !dexEntryId ||
      typeof addToCollection !== "boolean" ||
      (notes !== null && typeof notes !== "string")) {
    res.status(400).json({ error: "Invalid phase data" });
    return;
  }

  try {
    const phase = await prisma.$transaction(async (tx) => {
      // Serialize phase creation for the same hunt.
      await tx.$queryRaw`
        SELECT id FROM "Hunt"
        WHERE id = ${huntId}
        FOR UPDATE
      `;

      const hunt = await tx.hunt.findUnique({
        where: { id: huntId },
      });

      if (!hunt) {
        throw new Error("HUNT_NOT_FOUND");
      }

      if (hunt.status !== "ACTIVE") {
        throw new Error("HUNT_NOT_ACTIVE");
      }

      if (hunt.dexEntryId === dexEntryId) {
        throw new Error("TARGET_POKEMON");
      }

      const foundPokemon = await tx.dexEntry.findUnique({
        where: { id: dexEntryId },
      });

      if (!foundPokemon) {
        throw new Error("POKEMON_NOT_FOUND");
      }

      const previous = await tx.huntPhase.findFirst({
        where: { huntId },
        orderBy: { phaseNumber: "desc" },
      });

      const phaseNumber = (previous?.phaseNumber ?? 0) + 1;
      const encounters =
        hunt.encounters - (previous?.totalEncounters ?? 0);

      if (encounters < 0) {
        throw new Error("INVALID_ENCOUNTERS");
      }

      const owned = addToCollection
        ? await tx.ownedPokemon.create({
            data: {
              dexEntryId,
              gameOrigin: hunt.game,
              obtainedAt: new Date(),
              isInHome: false,
            },
          })
        : null;

      return tx.huntPhase.create({
        data: {
          huntId,
          dexEntryId,
          phaseNumber,
          encounters,
          totalEncounters: hunt.encounters,
          notes,
          ownedPokemonId: owned?.id,
        },
        include: phaseInclude,
      });
    });

    res.status(201).json({ data: phase });
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, [number, string]> = {
        HUNT_NOT_FOUND: [404, "Hunt not found"],
        HUNT_NOT_ACTIVE: [409, "Only active hunts can record phases"],
        TARGET_POKEMON: [400, "Use Complete Hunt for your target shiny"],
        POKEMON_NOT_FOUND: [404, "Pokémon not found"],
        INVALID_ENCOUNTERS: [409, "Encounter totals are inconsistent"],
      };

      const known = errors[error.message];
      if (known) {
        res.status(known[0]).json({ error: known[1] });
        return;
      }
    }

    console.error("Failed to record phase:", error);
    res.status(500).json({ error: "Unable to record phase" });
  }
}
