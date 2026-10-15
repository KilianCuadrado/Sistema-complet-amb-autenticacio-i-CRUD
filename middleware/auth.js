import jwt from "jsonwebtoken";
import { readJson } from "../storage.js";

const usersFile = "./db/users.json";
const secret = process.env.JWT_SECRET || "pokemon-crud-jwt-secret-2026";

export function attachUser(req, _res, next) {
  req.session = {};
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, secret);
      const user = readJson(usersFile, "users").find((item) => item.id === payload.id);
      if (user) req.session.user = { id: user.id, username: user.username, role: user.role || "user" };
    } catch {
      req.session = {};
    }
  }
  next();
}

// Per a l'API: retorna 401 en JSON
export function requireAuth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: "Autenticació requerida" });
  next();
}

// Per a les vistes EJS: redirigeix al login
export function requirePage(req, res, next) {
  if (!req.session?.user) return res.redirect("/login");
  next();
}

export function requireAdmin(req, res, next) {
  if (req.session?.user?.role !== "admin") return res.status(403).json({ error: "Permisos insuficients" });
  next();
}

export { secret };
