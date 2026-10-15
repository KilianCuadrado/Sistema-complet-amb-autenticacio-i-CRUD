# Sistema complet amb autenticació i CRUD

Aplicació Node.js/Express per gestionar equips Pokémon amb autenticació JWT. Les dades es guarden als fitxers JSON de `db/` i tota la informació dels Pokémon (tipus, imatge, **habilitats**, **moviments**, naturaleses i objectes) s'obté i es valida amb [PokéAPI](https://pokeapi.co/).

## Execució

```bash
npm install
npm start        # http://localhost:3000
```

Usuaris d'exemple:

| Usuari | Contrasenya | Rol |
| --- | --- | --- |
| `Kilian` | `Kilian123` | admin |
| `Kilian2` | 123456 | user |

Variable opcional: `JWT_SECRET` (si no es defineix s'usa una clau per defecte).

## Estructura

```
index.js               Configuració d'Express i muntatge de rutes
storage.js             Lectura/escriptura dels JSON
middleware/auth.js     attachUser, requireAuth, requirePage, requireAdmin
services/pokeapi.js    Peticions a PokéAPI amb memòria cau
services/teams.js      Validació i regles de negoci dels equips
routes/auth.js         /register, /login, /logout
routes/users.js        CRUD d'usuaris
routes/pokemons_teams.js  CRUD d'equips
routes/pokeapi.js      Dades de PokéAPI per al formulari
routes/views.js        Pàgines EJS
views/                 Plantilles EJS
db/                    Dades d'exemple
requests.http          Proves amb REST Client
```

## Rutes

### Vistes (EJS)

| Ruta | Accés | Descripció |
| --- | --- | --- |
| `/` | públic | Inici |
| `/login` | públic | Formulari d'inici de sessió |
| `/register` | públic | Formulari de registre (en crear el compte es neteja i redirigeix a `/login`) |
| `/protected` | autenticat | Zona privada amb els meus equips |
| `/profile` | autenticat | Dades de l'usuari |
| `/teams` | autenticat | Equips públics i els propis |
| `/teams/new` | autenticat | Crear equip |
| `/teams/:id` | autenticat | Detall d'un equip |
| `/teams/:id/edit` | propietari | Editar equip |

### API

| Mètode | Ruta | Accés | Funció |
| --- | --- | --- | --- |
| POST | `/register` | públic | Registre (bcrypt) |
| POST | `/login` | públic | Login, JWT d'1 hora en cookie |
| POST | `/logout` | públic | Elimina la cookie |
| GET | `/users`, `/users/:id` | autenticat | Llistar / veure usuaris |
| POST | `/users` | admin | Crear usuari |
| PUT | `/users/:id` | el mateix usuari o admin | Modificar (només admin canvia rols) |
| DELETE | `/users/:id` | admin | Eliminar usuari i els seus equips |
| GET | `/pokemonsTeams`, `/pokemonsTeams/:id` | autenticat | Equips visibles |
| POST | `/pokemonsTeams` | autenticat | Crear equip |
| PUT | `/pokemonsTeams/:id` | propietari | Modificar equip |
| DELETE | `/pokemonsTeams/:id` | propietari o admin | Eliminar equip |
| GET | `/pokeapi/pokemon` | autenticat | Llista de noms de Pokémon |
| GET | `/pokeapi/pokemon/:name` | autenticat | Tipus, imatge, habilitats i moviments |
| GET | `/pokeapi/natures` | autenticat | Naturaleses |
| GET | `/pokeapi/items` | autenticat | Objectes equipables |

Les rutes API retornen `401` sense sessió; les vistes redirigeixen a `/login`.

## Crear un equip

El client només envia el nom i la configuració; el servidor afegeix `pokemon_id`, `types` i `image` des de PokéAPI.

```json
{
  "team_name": "Equip prova",
  "status": "public",
  "pokemons": [
    {
      "name": "pikachu",
      "ability": "static",
      "moves": ["thunderbolt", "quick-attack"],
      "nature": "timid",
      "item": "light-ball",
      "evs": { "hp": 0, "attack": 0, "defense": 4, "special-attack": 252, "special-defense": 0, "speed": 252 }
    }
  ]
}
```

## Seguretat

- Contrasenyes xifrades amb bcrypt; mai es retornen per l'API.
- JWT amb caducitat d'1 hora en cookie `httpOnly`, `sameSite=lax` i `secure` en producció.
- `attachUser` carrega l'usuari a `req.session.user`; `requireAuth` protegeix l'API i `requirePage` les vistes.

## Regles de negoci

- **Rols**: l'admin pot crear/eliminar usuaris, canviar rols i eliminar qualsevol equip.
- **Visibilitat**: els equips `private` només els veu el propietari (i l'admin).
- **Equips**: d'1 a 6 Pokémon, sense repetir Pokémon; màxim 10 equips per usuari; no es pot repetir el nom d'equip per al mateix usuari.
- **Validació amb PokéAPI**: el Pokémon ha d'existir, l'habilitat ha de ser seva, 1–4 moviments que pugui aprendre (sense repetir), naturalesa vàlida i objecte equipable.
- **EVs**: cada estadística entre 0 i 252, total màxim 510.
- **Integritat**: en eliminar un usuari s'eliminen els seus equips.

## Proves

Obre `requests.http` amb l'extensió REST Client de VS Code i executa les peticions en ordre (inclou casos d'error: 400, 401, 403, 409).
