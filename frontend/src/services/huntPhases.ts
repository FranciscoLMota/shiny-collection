
import type {
  HuntPhase,
  CreateHuntPhaseInput,
} from "../types/huntPhases";

export async function getHuntPhases(
  huntId: number
): Promise<HuntPhase[]> {
  const response = await fetch(`/api/hunts/${huntId}/phases`);

  if (!response.ok) {
    throw new Error("Unable to load hunt phases");
  }

  const result: { data: HuntPhase[] } = await response.json();
  return result.data;
}

export async function createHuntPhase(
  huntId: number,
  data: CreateHuntPhaseInput
): Promise<HuntPhase> {
  const response = await fetch(`/api/hunts/${huntId}/phases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "Unable to record phase");
  }

  const result: { data: HuntPhase } = await response.json();
  return result.data;
}
