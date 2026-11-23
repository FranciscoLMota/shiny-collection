
import type { Request, Response } from "express";
import { HuntStatus } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const statuses = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
] as const;

const huntInclude = {
  dexEntry: {
    include: {
      species: true,
    },
  },
} as const;

function validId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validStatus(value: unknown): value is HuntStatus {
  return typeof value === "string" &&
    statuses.includes(value as HuntStatus);
}

export async function getHunts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const status = req.query.status;

    if (status !== undefined && !validStatus(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const hunts = await prisma.hunt.findMany({
      where: status ? { status: status as HuntStatus } : {},
      include: huntInclude,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    res.json({ data: hunts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load hunts" });
  }
}

export async function createHunt(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      dexEntryId,
      game,
      method,
      notes,
      status = "PLANNED",
    } = req.body ?? {};

    const entryId = validId(dexEntryId);

    if (!entryId || !validStatus(status)) {
      res.status(400).json({ error: "Invalid hunt data" });
      return;
    }

    if ([game, method, notes].some(
      (value) => value != null && typeof value !== "string"
    )) {
      res.status(400).json({ error: "Invalid text fields" });
      return;
    }

    const entry = await prisma.dexEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      res.status(404).json({ error: "Pokémon not found" });
      return;
    }

    const hunt = await prisma.hunt.create({
      data: {
        dexEntryId: entryId,
        game: game || null,
        method: method || null,
        notes: notes || null,
        status,
        startedAt: status === "ACTIVE" ? new Date() : null,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
      include: huntInclude,
    });

    res.status(201).json({ data: hunt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create hunt" });
  }
}

export async function updateHunt(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = validId(req.params.id);

    if (!id) {
      res.status(400).json({ error: "Invalid hunt ID" });
      return;
    }

    const body = req.body ?? {};
    const allowed = ["game", "method", "notes", "status"];

    if (
      !Object.keys(body).length ||
      Object.keys(body).some((key) => !allowed.includes(key))
    ) {
      res.status(400).json({ error: "Invalid update fields" });
      return;
    }

    const existing = await prisma.hunt.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Hunt not found" });
      return;
    }

    const data: {
      game?: string | null;
      method?: string | null;
      notes?: string | null;
      status?: HuntStatus;
      startedAt?: Date | null;
      completedAt?: Date | null;
    } = {};

    for (const field of ["game", "method", "notes"] as const) {
      if (field in body) {
        if (body[field] !== null &&
            typeof body[field] !== "string") {
          res.status(400).json({ error: `Invalid ${field}` });
          return;
        }
        data[field] = body[field] || null;
      }
    }

    if ("status" in body) {
      if (!validStatus(body.status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      data.status = body.status;

      if (body.status === "ACTIVE" && !existing.startedAt) {
        data.startedAt = new Date();
      }

      if (body.status === "COMPLETED") {
        data.completedAt =
          existing.completedAt ?? new Date();
      } else {
        data.completedAt = null;
      }
    }

    const hunt = await prisma.hunt.update({
      where: { id },
      data,
      include: huntInclude,
    });

    res.json({ data: hunt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to update hunt" });
  }
}

export async function addEncounters(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = validId(req.params.id);
    const amount = req.body?.amount;

    if (!id || !Number.isSafeInteger(amount) ||
        amount < 1 || amount > 10000) {
      res.status(400).json({ error: "Invalid encounter amount" });
      return;
    }

    const hunt = await prisma.hunt.findUnique({
      where: { id },
    });

    if (!hunt) {
      res.status(404).json({ error: "Hunt not found" });
      return;
    }

    if (hunt.status !== "ACTIVE") {
      res.status(409).json({
        error: "Only active hunts can record encounters",
      });
      return;
    }

    const result = await prisma.hunt.updateMany({
      where: {
        id,
        status: "ACTIVE",
        encounters: { lte: 2147483647 - amount },
      },
      data: {
        encounters: { increment: amount },
      },
    });

    if (result.count === 0) {
      res.status(409).json({
        error: "Hunt changed status or encounter limit reached",
      });
      return;
    }

    const updated = await prisma.hunt.findUnique({
      where: { id },
      include: huntInclude,
    });

    res.json({ data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to add encounters" });
  }
}

export async function deleteHunt(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = validId(req.params.id);

    if (!id) {
      res.status(400).json({ error: "Invalid hunt ID" });
      return;
    }

    const result = await prisma.hunt.deleteMany({
      where: { id },
    });

    if (!result.count) {
      res.status(404).json({ error: "Hunt not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to delete hunt" });
  }
}

export async function completeHunt(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = validId(req.params.id);
    const addToCollection = req.body?.addToCollection;

    if (!id || typeof addToCollection !== "boolean") {
      res.status(400).json({ error: "Invalid completion data" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const hunt = await tx.hunt.findUnique({
        where: { id },
      });

      if (!hunt) return null;
      if (hunt.status === "COMPLETED") {
        return { conflict: true };
      }

      const updated = await tx.hunt.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: huntInclude,
      });

      if (addToCollection) {
        await tx.ownedPokemon.create({
          data: {
            dexEntryId: hunt.dexEntryId,
            gameOrigin: hunt.game,
            obtainedAt: new Date(),
            isInHome: false,
          },
        });
      }

      return { hunt: updated };
    });

    if (!result) {
      res.status(404).json({ error: "Hunt not found" });
      return;
    }

    if ("conflict" in result) {
      res.status(409).json({ error: "Hunt already completed" });
      return;
    }

    res.json({ data: result.hunt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to complete hunt" });
  }
}
