import { Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthedRequest extends Request {
  user?: { userId: string; role: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  try {
    const token = header.split(" ")[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// For machine-to-machine callers (the print service), not logged-in users --
// a static shared secret sent as a Bearer token, rather than a JWT, since
// there's no session/expiry/claims to speak of. timingSafeEqual (over a hash
// of both sides) avoids leaking the secret's length or contents through
// response-time differences on a naive string comparison.
export function requirePrintServiceApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.PRINT_SERVICE_API_KEY;
  if (!expected) {
    console.error("[print-events] PRINT_SERVICE_API_KEY is not configured");
    return res.status(503).json({ error: "Print event intake is not configured" });
  }
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  const provided = header.slice("Bearer ".length);
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(providedHash, expectedHash)) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

// Attaches req.user if a valid token is present, but does not block the request otherwise.
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(header.split(" ")[1]);
    } catch {
      // ignore invalid token, continue as guest
    }
  }
  next();
}
