import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { issueSession, verifySession } from "./auth";
import { applyPrefs, DEMO_VIN, fetchSummary } from "./vehicles";

export function buildServer() {
  const app = Fastify({ logger: false });

  app.get("/healthz", async () => ({
    status: "ok",
    version: process.env.APP_VERSION ?? (require("../package.json") as { version: string }).version,
    color: process.env.APP_COLOR ?? "stable",
  }));

  app.post<{ Body: { ownerId: string; vins: string[]; region: "NA" | "EU" | "ME" } }>("/session", async (req) => {
    return { token: issueSession(req.body) };
  });

  app.get<{ Params: { vin: string }; Headers: { authorization?: string } }>("/vehicles/:vin", async (req, reply) => {
    const auth = req.headers.authorization ?? "";
    const token = auth.replace(/^Bearer /, "");
    let session;
    try {
      session = verifySession(token);
    } catch {
      return reply.code(401).send({ error: "invalid session" });
    }
    if (!session.vins.includes(req.params.vin)) {
      return reply.code(403).send({ error: "vehicle not linked to owner" });
    }
    if (!process.env.FLEET_API_URL && req.params.vin !== DEMO_VIN) {
      return reply.code(404).send({ error: "demo vehicle not found" });
    }
    const summary = await fetchSummary(req.params.vin);
    return applyPrefs(summary, { units: session.region === "NA" ? "mi" : "km" });
  });

  app.register(fastifyStatic, {
    root: path.join(__dirname, "../public"),
    prefix: "/",
  });
  app.get("/owner", (_req, reply) => reply.sendFile("owner.html"));

  return app;
}

if (require.main === module) {
  buildServer().listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });
}
