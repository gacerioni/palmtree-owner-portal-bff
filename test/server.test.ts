import { buildServer } from "../src/server";
import { DEMO_VIN } from "../src/vehicles";

describe("portal routes", () => {
  it("reports configured version and color from /healthz", async () => {
    const previousVersion = process.env.APP_VERSION;
    const previousColor = process.env.APP_COLOR;
    process.env.APP_VERSION = "5.4.0-canary";
    process.env.APP_COLOR = "blue";
    const app = buildServer();
    try {
      const response = await app.inject("/healthz");
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "ok", version: "5.4.0-canary", color: "blue" });
    } finally {
      await app.close();
      if (previousVersion === undefined) delete process.env.APP_VERSION;
      else process.env.APP_VERSION = previousVersion;
      if (previousColor === undefined) delete process.env.APP_COLOR;
      else process.env.APP_COLOR = previousColor;
    }
  });

  it("serves both pages and the demo vehicle through the existing session flow", async () => {
    const app = buildServer();
    try {
      expect((await app.inject("/")).body).toContain("The journey,");
      expect((await app.inject("/owner")).body).toContain("Welcome ");
      const session = await app.inject({
        method: "POST",
        url: "/session",
        payload: { ownerId: "owner_demo", vins: [DEMO_VIN], region: "NA" },
      });
      const { token } = session.json();
      const vehicle = await app.inject({
        url: `/vehicles/${DEMO_VIN}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(vehicle.statusCode).toBe(200);
      expect(vehicle.json()).toMatchObject({ vin: DEMO_VIN, batterySoc: 78, odometerKm: 18420, units: "mi" });
      expect(vehicle.json().chargingHistory).toHaveLength(3);
    } finally {
      await app.close();
    }
  });
});
