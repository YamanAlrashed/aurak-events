const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET env variable is not set");

function readToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

// ── Core auth ─────────────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: { message: "No token provided", code: "UNAUTHORIZED" } });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: { message, code: "UNAUTHORIZED" } });
  }
}

// Attaches req.user if a valid token is sent, but never blocks the request.
// Used for public event registration (students logged in OR prospective-student guests).
function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (_) { /* treat as guest */ }
  }
  next();
}

// ── RBAC ──────────────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: { message: "Not authenticated", code: "UNAUTHORIZED" } });
  if (req.user.role !== "admin") return res.status(403).json({ error: { message: "Admin access required", code: "FORBIDDEN" } });
  next();
}

function requireStudent(req, res, next) {
  if (!req.user) return res.status(401).json({ error: { message: "Not authenticated", code: "UNAUTHORIZED" } });
  if (req.user.role !== "student") return res.status(403).json({ error: { message: "Student access required", code: "FORBIDDEN" } });
  next();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

module.exports = { authenticate, optionalAuth, requireAdmin, requireStudent, signToken };
