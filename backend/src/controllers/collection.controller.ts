
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createOwnedPokemon(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { dexEntryId, nickname, gameOrigin, obtainedAt,
      isInHome, notes } = req.body ?? {};

    const entryId = parseId(dexEntryId);
    if (!entryId) {
      res.status(400).json({ error: "Invalid dexEntryId" });
      return;
    }

    if (isInHome !== undefined && typeof isInHome !== "boolean") {
      res.status(400).json({ error: "isInHome must be boolean" });
      return;
    }

    const date = parseDate(obtainedAt);
    if (obtainedAt !== undefined && date === undefined) {
      res.status(400).json({ error: "Invalid obtainedAt date" });
      return;
    }

    for (const value of [nickname, gameOrigin, notes]) {
      if (value !== undefined && value !== null &&
          typeof value !== "string") {
        res.status(400).json({ error: "Invalid text field" });
        return;
      }
    }

    const entry = await prisma.dexEntry.findUnique({
      where: { id: entryId },
      select: { id: true },
    });

    if (!entry) {
      res.status(404).json({ error: "Dex entry not found" });
      return;
    }

    const owned = await prisma.ownedPokemon.create({
      data: {
        dexEntryId: entryId,
        nickname: nickname || null,
        gameOrigin: gameOrigin || null,
        obtainedAt: date ?? null,
        isInHome: isInHome ?? false,
        notes: notes || null,
      },
    });

    res.status(201).json({ data: owned });
  } catch (error) {
    console.error("Create collection entry failed:", error);
    res.status(500).json({ error: "Unable to add Pokémon" });
  }
}

export async function updateOwnedPokemon(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid collection ID" });
      return;
    }

    const body = req.body ?? {};
    const allowed = [
      "nickname", "gameOrigin", "obtainedAt", "isInHome", "notes",
    ];

    if (
      Object.keys(body).length === 0 ||
      Object.keys(body).some((key) => !allowed.includes(key))
    ) {
      res.status(400).json({ error: "Invalid update fields" });
      return;
    }

    const data: {
      nickname?: string | null;
      gameOrigin?: string | null;
      obtainedAt?: Date | null;
      isInHome?: boolean;
      notes?: string | null;
    } = {};

    for (const field of ["nickname", "gameOrigin", "notes"] as const) {
      if (field in body) {
        if (body[field] !== null &&
            typeof body[field] !== "string") {
          res.status(400).json({ error: `Invalid ${field}` });
          return;
        }
        data[field] = body[field] || null;
      }
    }

    if ("isInHome" in body) {
      if (typeof body.isInHome !== "boolean") {
        res.status(400).json({ error: "Invalid isInHome" });
        return;
      }
      data.isInHome = body.isInHome;
    }

    if ("obtainedAt" in body) {
      const date = parseDate(body.obtainedAt);
      if (date === undefined) {
        res.status(400).json({ error: "Invalid obtainedAt" });
        return;
      }
      data.obtainedAt = date;
    }

    const existing = await prisma.ownedPokemon.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Owned Pokémon not found" });
      return;
    }

    const updated = await prisma.ownedPokemon.update({
      where: { id },
      data,
    });

    res.json({ data: updated });
  } catch (error) {
    console.error("Update collection entry failed:", error);
    res.status(500).json({ error: "Unable to update Pokémon" });
  }
}

export async function deleteOwnedPokemon(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid collection ID" });
      return;
    }

    const result = await prisma.ownedPokemon.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Owned Pokémon not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete collection entry failed:", error);
    res.status(500).json({ error: "Unable to remove Pokémon" });
  }
}

export async function getCollectionSummary(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const [required, obtained, inHome, specimens] =
      await Promise.all([
        prisma.dexEntry.count({
          where: { isRequired: true },
        }),
        prisma.dexEntry.count({
          where: {
            isRequired: true,
            ownedPokemon: { some: {} },
          },
        }),
        prisma.dexEntry.count({
          where: {
            isRequired: true,
            ownedPokemon: { some: { isInHome: true } },
          },
        }),
        prisma.ownedPokemon.count(),
      ]);

    res.json({
      data: {
        required,
        obtained,
        inHome,
        specimens,
        obtainedPercent: required
          ? Math.round((obtained / required) * 10000) / 100
          : 0,
        homePercent: required
          ? Math.round((inHome / required) * 10000) / 100
          : 0,
      },
    });
  } catch (error) {
    console.error("Collection summary failed:", error);
    res.status(500).json({ error: "Unable to load summary" });
  }
}
