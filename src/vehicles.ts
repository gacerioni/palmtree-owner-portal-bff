import axios from "axios";
import merge from "lodash/merge";
import pick from "lodash/pick";

const FLEET_API = process.env.FLEET_API_URL ?? "http://fleet-state.internal";

export interface VehicleSummary {
  vin: string;
  nickname?: string;
  batterySoc: number;
  rangeKm: number;
  softwareVersion: string;
  lastSeenAt: string;
}

/** Owner-editable preferences that get layered over the fleet state. */
export interface OwnerPrefs {
  nickname?: string;
  units?: "km" | "mi";
}

export function applyPrefs(summary: VehicleSummary, prefs: OwnerPrefs): VehicleSummary & OwnerPrefs {
  return merge({}, summary, pick(prefs, ["nickname", "units"]));
}

export async function fetchSummary(vin: string): Promise<VehicleSummary> {
  const res = await axios.get(`${FLEET_API}/vehicles/${encodeURIComponent(vin)}/summary`, { timeout: 3000 });
  return res.data as VehicleSummary;
}

export function estimateRangeKm(socPercent: number, ratedRangeKm: number): number {
  if (socPercent < 0 || socPercent > 100) throw new RangeError("soc out of range");
  return Math.round((socPercent / 100) * ratedRangeKm);
}
