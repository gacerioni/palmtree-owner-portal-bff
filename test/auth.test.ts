import jwt from "jsonwebtoken";
import { issueSession, verifySession } from "../src/auth";

describe("owner session tokens", () => {
  const session = { ownerId: "own_123", vins: ["50EA1TEA0RA000001"], region: "NA" as const };

  it("round-trips a session", () => {
    const token = issueSession(session);
    expect(verifySession(token)).toEqual(session);
  });

  it("rejects a tampered token", () => {
    const token = issueSession(session);
    const [h, p, s] = token.split(".");
    const tampered = `${h}.${Buffer.from(JSON.stringify({ sub: "own_999", vins: ["X"], region: "NA" })).toString("base64url")}.${s}`;
    expect(() => verifySession(tampered)).toThrow();
  });

  it("rejects a token signed with another key", () => {
    const forged = jwt.sign({ sub: "own_999", vins: ["X"], region: "NA" }, "attacker-key", { issuer: "owner-portal-bff" });
    expect(() => verifySession(forged)).toThrow();
  });

  it("rejects an unsigned alg=none token", () => {
    const unsigned = jwt.sign({ sub: "own_999", vins: ["X"], region: "NA" }, "", { algorithm: "none", issuer: "owner-portal-bff" });
    expect(() => verifySession(unsigned)).toThrow();
  });

  it("rejects garbage", () => {
    expect(() => verifySession("not-a-token")).toThrow();
  });
});
