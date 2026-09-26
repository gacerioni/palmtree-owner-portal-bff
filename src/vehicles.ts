import axios from "axios";
import merge from "lodash/merge";
import pick from "lodash/pick";

const FLEET_API = process.env.FLEET_API_URL;
export const DEMO_VIN = "50EA1TEA0RA000001";

export interface VehicleSummary {
  vin: string;
  nickname?: string;
  batterySoc: number;
  rangeKm: number;
  softwareVersion: string;
  lastSeenAt: string;
  odometerKm?: number;
  nextServiceAt?: string;
  chargingHistory?: { chargedAt: string; location: string; energyKwh: number }[];
}

const DEMO_VEHICLE: VehicleSummary = {
  vin: DEMO_VIN,
  nickname: "My Verde",
  batterySoc: 78,
  rangeKm: 527,
  odometerKm: 18420,
  softwareVersion: "3.2.1",
  lastSeenAt: "2026-09-26T09:12:00Z",
  nextServiceAt: "2027-03-15T00:00:00Z",
  chargingHistory: [
    { chargedAt: "2026-09-24T18:30:00Z", location: "Home charging", energyKwh: 42.8 },
    { chargedAt: "2026-09-20T13:15:00Z", location: "Coastal Highway", energyKwh: 36.4 },
    { chargedAt: "2026-09-16T21:05:00Z", location: "Home charging", energyKwh: 48.2 },
  ],
};

/** Owner-editable preferences that get layered over the fleet state. */
export interface OwnerPrefs {
  nickname?: string;
  units?: "km" | "mi";
}

export function applyPrefs(summary: VehicleSummary, prefs: OwnerPrefs): VehicleSummary & OwnerPrefs {
  return merge({}, summary, pick(prefs, ["nickname", "units"]));
}

export async function fetchSummary(vin: string): Promise<VehicleSummary> {
  if (!FLEET_API) return { ...DEMO_VEHICLE, vin };
  const res = await axios.get(`${FLEET_API}/vehicles/${encodeURIComponent(vin)}/summary`, { timeout: 3000 });
  return res.data as VehicleSummary;
}

export function estimateRangeKm(socPercent: number, ratedRangeKm: number): number {
  if (socPercent < 0 || socPercent > 100) throw new RangeError("soc out of range");
  return Math.round((socPercent / 100) * ratedRangeKm);
}
