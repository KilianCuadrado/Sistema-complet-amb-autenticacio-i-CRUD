import { readJson, writeJson } from "../storage.js";
import { getItems, getNatures, getPokemon } from "./pokeapi.js";

const file = "./db/pokemon_teams.json";
const usersFile = "./db/users.json";

export const STATS = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];
export const MAX_EV_PER_STAT = 252;
export const MAX_TOTAL_EVS = 510;
export const MAX_TEAMS = 10;

export class ValidationError extends Error {}

export const readTeams = () => readJson(file, "pokemon_teams");
export const writeTeams = (teams) => writeJson(file, "pokemon_teams", teams);

export const isOwner = (team, user) => team.owner_id === user.id;
export const canView = (team, user) =>
  team.status === "public" || isOwner(team, user) || user.role === "admin";

// Afegeix el nom del propietari per mostrar-lo
export function withOwner(teams) {
  const users = readJson(usersFile, "users");
  return teams.map((team) => ({
    ...team,
    owner: users.find((user) => user.id === team.owner_id)?.username ?? "?",
  }));
}

export function visibleTeams(user) {
  return withOwner(readTeams().filter((team) => canView(team, user)));
}

export function publicTeams() {
  return withOwner(readTeams().filter((team) => team.status === "public"));
}

function validateEvs(evs = {}, label) {
  if (typeof evs !== "object" || Array.isArray(evs))
    throw new ValidationError(`${label}: EVs invàlids`);
  const result = {};
  let total = 0;
  for (const stat of STATS) {
    const value = Number(evs[stat] ?? 0);
    if (!Number.isInteger(value) || value < 0 || value > MAX_EV_PER_STAT)
      throw new ValidationError(
        `${label}: cada EV ha d'estar entre 0 i ${MAX_EV_PER_STAT}`,
      );
    result[stat] = value;
    total += value;
  }
  if (total > MAX_TOTAL_EVS)
    throw new ValidationError(
      `${label}: el total d'EVs no pot passar de ${MAX_TOTAL_EVS}`,
    );
  return result;
}

// Valida un Pokémon contra PokéAPI i completa les seves dades
async function buildPokemon(input, index) {
  const label = `Pokémon ${index + 1}`;
  if (!input || typeof input !== "object" || typeof input.name !== "string")
    throw new ValidationError(`${label}: falta el nom`);

  let data;
  try {
    data = await getPokemon(input.name);
  } catch (error) {
    throw new ValidationError(error.message);
  }
  const name = data.name;

  if (!data.abilities.includes(input.ability))
    throw new ValidationError(
      `${name}: l'habilitat ha de ser una de: ${data.abilities.join(", ")}`,
    );

  const moves = Array.isArray(input.moves) ? input.moves.filter(Boolean) : [];
  if (moves.length < 1 || moves.length > 4)
    throw new ValidationError(`${name}: ha de tenir entre 1 i 4 moviments`);
  if (new Set(moves).size !== moves.length)
    throw new ValidationError(`${name}: no es poden repetir moviments`);
  const invalid = moves.find((move) => !data.moves.includes(move));
  if (invalid)
    throw new ValidationError(`${name}: no pot aprendre el moviment ${invalid}`);

  if (!(await getNatures()).includes(input.nature))
    throw new ValidationError(`${name}: naturalesa invàlida`);

  const item = input.item || "";
  if (item && !(await getItems()).includes(item))
    throw new ValidationError(`${name}: objecte invàlid (${item})`);

  return {
    name,
    pokemon_id: data.pokemon_id,
    types: data.types,
    image: data.image,
    ability: input.ability,
    moves,
    nature: input.nature,
    item,
    evs: validateEvs(input.evs, name),
  };
}

// Valida tot l'equip. `current` és l'equip existent en cas d'edició.
export async function buildTeam(body = {}, user, current = null) {
  const teams = readTeams();
  const team_name =
    body.team_name !== undefined ? body.team_name : current?.team_name;
  const status = body.status !== undefined ? body.status : current?.status ?? "private";

  if (typeof team_name !== "string" || !team_name.trim() || team_name.trim().length > 50)
    throw new ValidationError("El nom de l'equip és obligatori (màx. 50 caràcters)");
  if (!["public", "private"].includes(status))
    throw new ValidationError("L'estat ha de ser public o private");

  const ownerId = current?.owner_id ?? user.id;
  const ownTeams = teams.filter(
    (team) => team.owner_id === ownerId && team.id !== current?.id,
  );
  if (ownTeams.some((team) => team.team_name.toLowerCase() === team_name.trim().toLowerCase()))
    throw new ValidationError("Ja tens un equip amb aquest nom");
  if (!current && ownTeams.length >= MAX_TEAMS)
    throw new ValidationError(`Només pots tenir ${MAX_TEAMS} equips`);

  let pokemons = current?.pokemons;
  if (body.pokemons !== undefined || !current) {
    if (!Array.isArray(body.pokemons) || body.pokemons.length < 1 || body.pokemons.length > 6)
      throw new ValidationError("Un equip ha de tenir entre 1 i 6 Pokémon");
    pokemons = await Promise.all(body.pokemons.map(buildPokemon));
    const names = pokemons.map((pokemon) => pokemon.name);
    if (new Set(names).size !== names.length)
      throw new ValidationError("No es poden repetir Pokémon a l'equip");
  }

  return { team_name: team_name.trim(), status, pokemons };
}
