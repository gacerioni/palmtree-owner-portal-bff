import Fastify from "fastify";
import { issueSession, verifySession } from "./auth";
import { applyPrefs, fetchSummary } from "./vehicles";

export function buildServer() {
  const app = Fastify({ logger: false });

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
    const summary = await fetchSummary(req.params.vin);
    return applyPrefs(summary, { units: session.region === "NA" ? "mi" : "km" });
  });

  return app;
}

if (require.main === module) {
  buildServer().listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });
}
