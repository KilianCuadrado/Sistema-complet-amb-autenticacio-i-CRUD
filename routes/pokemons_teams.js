import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  ValidationError,
  buildTeam,
  canView,
  isOwner,
  readTeams,
  visibleTeams,
  withOwner,
  writeTeams,
} from "../services/teams.js";

const router = express.Router();

function handleError(res, error) {
  if (error instanceof ValidationError)
    return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Error intern" });
}

router.use(requireAuth);

router.get("/", (req, res) => res.json(visibleTeams(req.session.user)));

router.get("/:id", (req, res) => {
  const team = readTeams().find((item) => item.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: "Equip no trobat" });
  if (!canView(team, req.session.user))
    return res.status(403).json({ error: "Aquest equip és privat" });
  res.json(withOwner([team])[0]);
});

router.post("/", async (req, res) => {
  try {
    const data = await buildTeam(req.body ?? {}, req.session.user);
    const teams = readTeams();
    const team = {
      id: teams.length ? Math.max(...teams.map((item) => item.id)) + 1 : 1,
      owner_id: req.session.user.id,
      ...data,
    };
    teams.push(team);
    writeTeams(teams);
    res.status(201).json(team);
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/:id", async (req, res) => {
  const current = readTeams().find((item) => item.id === Number(req.params.id));
  if (!current) return res.status(404).json({ error: "Equip no trobat" });
  if (!isOwner(current, req.session.user))
    return res
      .status(403)
      .json({ error: "Només el propietari pot editar l'equip" });
  try {
    const data = await buildTeam(req.body ?? {}, req.session.user, current);
    // Es torna a llegir per no perdre canvis fets mentre es consultava PokéAPI
    const teams = readTeams();
    const team = teams.find((item) => item.id === current.id);
    if (!team) return res.status(404).json({ error: "Equip no trobat" });
    Object.assign(team, data);
    writeTeams(teams);
    res.json(team);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/:id", (req, res) => {
  const teams = readTeams();
  const team = teams.find((item) => item.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: "Equip no trobat" });
  if (!isOwner(team, req.session.user) && req.session.user.role !== "admin")
    return res
      .status(403)
      .json({ error: "Només el propietari o un admin pot eliminar l'equip" });
  writeTeams(teams.filter((item) => item.id !== team.id));
  res.status(204).end();
});

export default router;
