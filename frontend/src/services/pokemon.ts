
import type {
  PokemonDetailResponse,
  PokemonListResponse,
} from "../types/pokemon";

export interface PokemonFilters {
  search?: string;
  generation?: number;
  type?: string;
  region?: string;
  collection?: "missing" | "obtained" | "home" | "not-in-home" | "";
  page?: number;
  limit?: number;
}

export async function getPokemon(
  filters: PokemonFilters = {},
  signal?: AbortSignal
): Promise<PokemonListResponse> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const response = await fetch(
    `/api/pokemon?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Pokémon");
  }

  return response.json();
}

export async function getPokemonById(
  id: number,
  signal?: AbortSignal
): Promise<PokemonDetailResponse> {
  const response = await fetch(`/api/pokemon/${id}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Pokémon details");
  }

  return response.json();
}
