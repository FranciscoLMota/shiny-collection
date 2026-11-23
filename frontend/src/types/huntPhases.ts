
import type { DexEntry, OwnedPokemon } from "./pokemon";

export interface HuntPhase {
  id: number;
  huntId: number;
  dexEntryId: number;
  phaseNumber: number;
  encounters: number;
  totalEncounters: number;
  foundAt: string;
  notes: string | null;
  ownedPokemonId: number | null;
  dexEntry: DexEntry;
  ownedPokemon: OwnedPokemon | null;
}

export interface CreateHuntPhaseInput {
  dexEntryId: number;
  addToCollection: boolean;
  notes?: string;
}
