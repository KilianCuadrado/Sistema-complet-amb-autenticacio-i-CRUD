import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getItems,
  getNatures,
  getPokemon,
  getPokemonNames,
} from "../services/pokeapi.js";

const router = express.Router();

router.use(requireAuth);

router.get("/pokemon", async (_req, res) => {
  try {
    res.json(await getPokemonNames());
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get("/pokemon/:name", async (req, res) => {
  try {
    res.json(await getPokemon(req.params.name));
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/natures", async (_req, res) => {
  try {
    res.json(await getNatures());
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get("/items", async (_req, res) => {
  try {
    res.json(await getItems());
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

export default router;
