import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { readJson, writeJson } from "../storage.js";
import { secret } from "../middleware/auth.js";

const router = express.Router();
const file = "./db/users.json";
const publicUser = ({ password, pasword, ...user }) => user;
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 1000,
};

export function validateCredentials(body = {}) {
  if (
    typeof body.username !== "string" ||
    !/^[a-zA-Z0-9_-]{3,30}$/.test(body.username)
  )
    return "El nom d'usuari ha de tenir entre 3 i 30 caràcters (lletres, números, _ o -)";
  if (typeof body.password !== "string" || body.password.length < 6)
    return "La contrasenya ha de tenir almenys 6 caràcters";
  return null;
}

// Vistes
router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/protected");
  res.render("login", { user: null, registered: req.query.registered === "1" });
});

router.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/protected");
  res.render("register", { user: null });
});

// API
router.post("/register", async (req, res) => {
  const body = req.body ?? {};
  const error = validateCredentials(body);
  if (error) return res.status(400).json({ error });
  const users = readJson(file, "users");
  if (
    users.some(
      (user) => user.username.toLowerCase() === body.username.toLowerCase(),
    )
  ) {
    return res.status(409).json({ error: "L'usuari ja existeix" });
  }
  const user = {
    id: users.length ? Math.max(...users.map((item) => item.id)) + 1 : 1,
    username: body.username,
    password: await bcrypt.hash(body.password, 12),
    role: "user",
  };
  users.push(user);
  writeJson(file, "users", users);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const body = req.body ?? {};
  const error = validateCredentials(body);
  if (error) return res.status(400).json({ error });
  const user = readJson(file, "users").find(
    (item) => item.username.toLowerCase() === body.username.toLowerCase(),
  );
  const valid =
    user &&
    (await bcrypt.compare(body.password, user.password || user.pasword || ""));
  if (!valid) return res.status(401).json({ error: "Credencials incorrectes" });
  const token = jwt.sign({ id: user.id, username: user.username }, secret, {
    expiresIn: "1h",
  });
  res.cookie("token", token, cookieOptions).json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
  });
  // Formulari HTML → redirigeix; client API (Postman, fetch) → JSON
  if (req.accepts(["json", "html"]) === "html") return res.redirect("/login");
  res.json({ message: "Sessió tancada" });
});

export default router;
