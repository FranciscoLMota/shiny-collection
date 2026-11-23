
import type { DexEntry } from "./pokemon";

export type HuntStatus =
  | "PLANNED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED";

export interface Hunt {
  id: number;
  dexEntryId: number;
  game: string | null;
  method: string | null;
  status: HuntStatus;
  encounters: number;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  dexEntry: DexEntry;
}

export interface CreateHuntInput {
  dexEntryId: number;
  game?: string;
  method?: string;
  notes?: string;
  status?: HuntStatus;
}
