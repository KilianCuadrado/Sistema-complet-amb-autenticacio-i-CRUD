const API = "https://pokeapi.co/api/v2";
const cache = new Map();

// Fa la petició a PokéAPI i guarda el resultat en memòria
async function get(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(`${API}/${path}`);
  if (!response.ok) throw new Error(`No trobat a PokéAPI: ${path}`);
  const data = await response.json();
  cache.set(path, data);
  return data;
}

export async function getPokemon(name) {
  if (typeof name !== "string" || !name.trim())
    throw new Error("Nom de Pokémon invàlid");
  const clean = name.toLowerCase().trim();
  let pokemon;
  try {
    pokemon = await get(`pokemon/${encodeURIComponent(clean)}`);
  } catch {
    throw new Error(`Pokémon no trobat: ${name}`);
  }
  return {
    name: pokemon.name,
    pokemon_id: String(pokemon.id).padStart(3, "0"),
    types: pokemon.types.map((type) => type.type.name),
    image: pokemon.sprites.front_default,
    abilities: pokemon.abilities.map((item) => item.ability.name),
    moves: pokemon.moves.map((item) => item.move.name).sort(),
  };
}

export async function getPokemonNames() {
  const data = await get("pokemon?limit=2000");
  return data.results.map((item) => item.name);
}

export async function getNatures() {
  const data = await get("nature?limit=100");
  return data.results.map((item) => item.name).sort();
}

// Objectes que un Pokémon pot portar equipats
export async function getItems() {
  const data = await get("item-attribute/holdable");
  return data.items.map((item) => item.name).sort();
}
