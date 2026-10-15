import express from "express";
import { requirePage } from "../middleware/auth.js";
import { STATS, canView, isOwner, readTeams, visibleTeams, withOwner } from "../services/teams.js";

const router = express.Router();

router.get("/", (req, res) =>
  res.render("index", { user: req.session.user ?? null }),
);

router.get("/protected", requirePage, (req, res) => {
  const user = req.session.user;
  const myTeams = user.role === "admin"
    ? withOwner(readTeams())
    : readTeams().filter((team) => isOwner(team, user));
  res.render("protected", { user, myTeams });
});

router.get("/profile", requirePage, (req, res) => {
  const user = req.session.user;
  const teamCount = readTeams().filter((team) => isOwner(team, user)).length;
  res.render("profile", { user, teamCount });
});

router.get("/admin/users", requirePage, (req, res) => {
  if (req.session.user.role !== "admin") return res.redirect("/protected");
  res.render("admin_users", { user: req.session.user });
});

router.get("/teams", requirePage, (req, res) => {
  res.render("teams", { user: req.session.user, teams: visibleTeams(req.session.user) });
});

router.get("/teams/new", requirePage, (req, res) => {
  res.render("team_form", { user: req.session.user, team: null, stats: STATS });
});

router.get("/teams/:id", requirePage, (req, res) => {
  const team = readTeams().find((item) => item.id === Number(req.params.id));
  if (!team || !canView(team, req.session.user)) return res.redirect("/teams");
  res.render("team", { user: req.session.user, team: withOwner([team])[0], stats: STATS });
});

router.get("/teams/:id/edit", requirePage, (req, res) => {
  const team = readTeams().find((item) => item.id === Number(req.params.id));
  if (
    !team ||
    (!isOwner(team, req.session.user) && req.session.user.role !== "admin")
  )
    return res.redirect("/protected");
  res.render("team_form", { user: req.session.user, team, stats: STATS });
});

export default router;
