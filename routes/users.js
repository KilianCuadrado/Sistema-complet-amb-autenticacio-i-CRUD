import express from "express";
import bcrypt from "bcrypt";
import { readJson, writeJson } from "../storage.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateCredentials } from "./auth.js";

const router = express.Router();
const file = "./db/users.json";
const teamsFile = "./db/pokemon_teams.json";
const safe = ({ password, pasword, ...user }) => user;
const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

router.use(requireAuth);

router.get("/", (_req, res) => res.json(readJson(file, "users").map(safe)));

router.get("/:id", (req, res) => {
  const user = readJson(file, "users").find(
    (item) => item.id === Number(req.params.id),
  );
  return user
    ? res.json(safe(user))
    : res.status(404).json({ error: "Usuari no trobat" });
});

router.post("/", requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const error = validateCredentials(body);
  if (error) return res.status(400).json({ error });
  const users = readJson(file, "users");
  if (users.some((user) => sameName(user.username, body.username)))
    return res.status(409).json({ error: "L'usuari ja existeix" });
  const user = {
    id: users.length ? Math.max(...users.map((item) => item.id)) + 1 : 1,
    username: body.username,
    password: await bcrypt.hash(body.password, 12),
    role: body.role === "admin" ? "admin" : "user",
  };
  users.push(user);
  writeJson(file, "users", users);
  res.status(201).json(safe(user));
});

router.put("/:id", async (req, res) => {
  const body = req.body ?? {};
  const id = Number(req.params.id);
  const me = req.session.user;
  if (me.id !== id && me.role !== "admin")
    return res.status(403).json({ error: "Només pots modificar el teu usuari" });
  if (body.role !== undefined && me.role !== "admin")
    return res.status(403).json({ error: "Només un admin pot canviar rols" });
  if (body.role !== undefined && !["user", "admin"].includes(body.role))
    return res.status(400).json({ error: "El rol ha de ser user o admin" });

  const users = readJson(file, "users");
  const user = users.find((item) => item.id === id);
  if (!user) return res.status(404).json({ error: "Usuari no trobat" });

  if (body.username !== undefined) {
    if (
      typeof body.username !== "string" ||
      !/^[a-zA-Z0-9_-]{3,30}$/.test(body.username)
    )
      return res.status(400).json({ error: "Nom d'usuari invàlid" });
    if (users.some((item) => item.id !== id && sameName(item.username, body.username)))
      return res.status(409).json({ error: "L'usuari ja existeix" });
    user.username = body.username;
  }
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6)
      return res
        .status(400)
        .json({ error: "La contrasenya ha de tenir almenys 6 caràcters" });
    user.password = await bcrypt.hash(body.password, 12);
  }
  if (body.role !== undefined) user.role = body.role;

  writeJson(file, "users", users);
  res.json(safe(user));
});

router.delete("/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const users = readJson(file, "users");
  const filtered = users.filter((user) => user.id !== id);
  if (filtered.length === users.length)
    return res.status(404).json({ error: "Usuari no trobat" });
  writeJson(file, "users", filtered);
  // Regla d'integritat: s'eliminen també els equips de l'usuari
  const teams = readJson(teamsFile, "pokemon_teams");
  writeJson(
    teamsFile,
    "pokemon_teams",
    teams.filter((team) => team.owner_id !== id),
  );
  res.status(204).end();
});

export default router;
