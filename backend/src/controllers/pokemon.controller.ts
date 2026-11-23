
import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export async function getPokemon(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      search,
      generation,
      type,
      region,
      collection,
      page = "1",
      limit = "30",
    } = req.query;

    // Validate pagination
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      res.status(400).json({
        error: "Invalid pagination parameters",
      });
      return;
    }

    // Build dynamic filters
    const where: Prisma.DexEntryWhereInput = {};

    // Search by name or National Dex number
    if (typeof search === "string" && search.trim()) {
      const term = search.trim();
      const dexNumber = Number(term);

      where.OR = [
        {
          displayName: {
            contains: term,
            mode: "insensitive",
          },
        },
        {
          species: {
            is: {
              name: {
                contains: term,
                mode: "insensitive",
              },
            },
          },
        },
      ];

      if (
        /^\d+$/.test(term) &&
        Number.isSafeInteger(dexNumber)
      ) {
        where.OR.push({
          species: {
            is: {
              nationalDexNumber: dexNumber,
            },
          },
        });
      }
    }

    // Filter by generation
    if (typeof generation === "string" && generation) {
      const gen = Number(generation);

      if (!Number.isInteger(gen) || gen < 1) {
        res.status(400).json({
          error: "Invalid generation",
        });
        return;
      }

      where.species = {
        is: {
          generation: gen,
        },
      };
    }

    // Filter by Pokémon type
    if (typeof type === "string" && type) {
      const pokemonType = type.toLowerCase();

      where.AND = [
        {
          OR: [
            { primaryType: pokemonType },
            { secondaryType: pokemonType },
          ],
        },
      ];
    }

    // Filter by regional form
    if (typeof region === "string" && region) {
      where.region =
        region.toLowerCase() === "standard"
          ? null
          : region.toLowerCase();
    }

    // Filter by collection status
    if (collection !== undefined && collection !== "") {
      if (typeof collection !== "string") {
        res.status(400).json({
          error: "Invalid collection filter",
        });
        return;
      }

      switch (collection) {
        case "missing":
          where.ownedPokemon = {
            none: {},
          };
          break;

        case "obtained":
          where.ownedPokemon = {
            some: {},
          };
          break;

        case "home":
          where.ownedPokemon = {
            some: {
              isInHome: true,
            },
          };
          break;

        case "not-in-home":
          where.AND = [
            ...(Array.isArray(where.AND)
              ? where.AND
              : where.AND
                ? [where.AND]
                : []),
            {
              ownedPokemon: {
                some: {},
              },
            },
            {
              ownedPokemon: {
                none: {
                  isInHome: true,
                },
              },
            },
          ];
          break;

        default:
          res.status(400).json({
            error: "Invalid collection filter",
          });
          return;
      }
    }

    // Fetch Pokémon with collection information
    const [total, entries] = await prisma.$transaction([
      prisma.dexEntry.count({
        where,
      }),

      prisma.dexEntry.findMany({
        where,

        include: {
          // Species information
          species: true,

          // Count all owned shiny specimens
          _count: {
            select: {
              ownedPokemon: true,
            },
          },

          // Check whether at least one specimen is in HOME
          ownedPokemon: {
            where: {
              isInHome: true,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },

        orderBy: [
          {
            species: {
              nationalDexNumber: "asc",
            },
          },
          {
            formKey: "asc",
          },
        ],

        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Transform collection information for the frontend
    const data = entries.map((entry) => {
      const {
        _count,
        ownedPokemon,
        ...pokemon
      } = entry;

      const ownedCount = _count.ownedPokemon;

      return {
        ...pokemon,

        collection: {
          // Number of individual shinies owned
          ownedCount,

          // At least one shiny specimen exists
          isObtained: ownedCount > 0,

          // At least one shiny specimen is deposited in HOME
          isInHome: ownedPokemon.length > 0,
        },
      };
    });

    // Return paginated results
    res.json({
      data,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve Pokémon:", error);

    res.status(500).json({
      error: "Failed to retrieve Pokémon",
    });
  }
}

export async function getPokemonById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid Pokémon entry ID" });
      return;
    }

    const entry = await prisma.dexEntry.findUnique({
      where: { id },
      include: {
        species: true,
        ownedPokemon: true,
        hunts: true,
      },
    });

    if (!entry) {
      res.status(404).json({ error: "Pokémon not found" });
      return;
    }

    res.json({ data: entry });
  } catch (error) {
    console.error("Failed to retrieve Pokémon:", error);
    res.status(500).json({
      error: "Failed to retrieve Pokémon",
    });
  }
}
