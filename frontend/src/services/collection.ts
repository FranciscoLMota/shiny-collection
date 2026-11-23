
import type { OwnedPokemon } from "../types/pokemon";

export interface OwnedPokemonInput {
  dexEntryId: number;
  nickname?: string | null;
  gameOrigin?: string | null;
  obtainedAt?: string | null;
  isInHome?: boolean;
  notes?: string | null;
}

export interface CollectionSummary {
  required: number;
  obtained: number;
  inHome: number;
  specimens: number;
  obtainedPercent: number;
  homePercent: number;
}

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Collection request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function addOwnedPokemon(
  data: OwnedPokemonInput
): Promise<OwnedPokemon> {
  const result = await request<{ data: OwnedPokemon }>(
    "/api/collection",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  return result.data;
}

export async function updateOwnedPokemon(
  id: number,
  data: Partial<Omit<OwnedPokemonInput, "dexEntryId">>
): Promise<OwnedPokemon> {
  const result = await request<{ data: OwnedPokemon }>(
    `/api/collection/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return result.data;
}

export async function deleteOwnedPokemon(
  id: number
): Promise<void> {
  await request<void>(`/api/collection/${id}`, {
    method: "DELETE",
  });
}

export async function getCollectionSummary():
  Promise<CollectionSummary> {
  const result = await request<{ data: CollectionSummary }>(
    "/api/collection/summary"
  );

  return result.data;
}

export async function quickAddPokemon(dexEntryId: number) {
  const response = await fetch("/api/collection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dexEntryId,
      isInHome: false,
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "Failed to add Pokémon");
  }

  return response.json();
}