import { applyPrefs, estimateRangeKm } from "../src/vehicles";

describe("vehicle summary", () => {
  it("layers owner prefs over fleet state", () => {
    const out = applyPrefs(
      { vin: "V1", batterySoc: 80, rangeKm: 500, softwareVersion: "3.2.1", lastSeenAt: "2026-01-01T00:00:00Z" },
      { nickname: "Blue Air", units: "mi" }
    );
    expect(out.nickname).toBe("Blue Air");
    expect(out.units).toBe("mi");
    expect(out.rangeKm).toBe(500);
  });

  it("estimates range from soc", () => {
    expect(estimateRangeKm(50, 800)).toBe(400);
    expect(() => estimateRangeKm(101, 800)).toThrow(RangeError);
  });
});
