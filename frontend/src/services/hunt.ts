
import type {
  Hunt,
  HuntStatus,
  CreateHuntInput,
} from "../types/hunt";

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Hunt request failed");
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}

export async function getHunts(): Promise<Hunt[]> {
  const result = await request<{ data: Hunt[] }>("/api/hunts");
  return result.data;
}

export async function createHunt(
  data: CreateHuntInput
): Promise<Hunt> {
  const result = await request<{ data: Hunt }>(
    "/api/hunts",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  return result.data;
}

export async function updateHunt(
  id: number,
  data: {
    status?: HuntStatus;
    encounters?: number;
    game?: string | null;
    method?: string | null;
    notes?: string | null;
  }
): Promise<Hunt> {
  const result = await request<{ data: Hunt }>(
    `/api/hunts/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return result.data;
}

export async function addEncounters(
  id: number,
  amount: number
): Promise<Hunt> {
  const result = await request<{ data: Hunt }>(
    `/api/hunts/${id}/encounters`,
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    }
  );

  return result.data;
}

export async function completeHunt(
  id: number,
  addToCollection: boolean
): Promise<Hunt> {
  const result = await request<{ data: Hunt }>(
    `/api/hunts/${id}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ addToCollection }),
    }
  );

  return result.data;
}

export async function deleteHunt(id: number): Promise<void> {
  await request<void>(`/api/hunts/${id}`, {
    method: "DELETE",
  });
}
