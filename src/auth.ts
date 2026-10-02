import jwt from "jsonwebtoken";

export interface OwnerSession {
  ownerId: string;
  vins: string[];
  region: "NA" | "EU" | "ME";
}

const SECRET = process.env.SESSION_SIGNING_KEY ?? "dev-only-not-for-prod";
const TTL_SECONDS = 60 * 60 * 12;

export function issueSession(session: OwnerSession): string {
  return jwt.sign({ sub: session.ownerId, vins: session.vins, region: session.region }, SECRET, {
    algorithm: "HS256",
    expiresIn: TTL_SECONDS,
    issuer: "owner-portal-bff",
  });
}

export function verifySession(token: string): OwnerSession {
  const payload = jwt.verify(token, SECRET, {
    algorithms: ["HS256"],
    issuer: "owner-portal-bff",
  }) as jwt.JwtPayload;
  if (typeof payload.sub !== "string" || !Array.isArray(payload.vins)) {
    throw new Error("malformed session token");
  }
  return { ownerId: payload.sub, vins: payload.vins as string[], region: payload.region };
}
