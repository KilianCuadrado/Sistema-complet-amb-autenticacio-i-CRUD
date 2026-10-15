import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import pokemonTeamsRoutes from "./routes/pokemons_teams.js";
import pokeapiRoutes from "./routes/pokeapi.js";
import viewRoutes from "./routes/views.js";
import { attachUser } from "./middleware/auth.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

// API
app.use("/", authRoutes); // /register, /login, /logout
app.use("/users", usersRoutes);
app.use("/pokemonsTeams", pokemonTeamsRoutes);
app.use("/pokeapi", pokeapiRoutes);

// Vistes (/, /protected, /profile, /teams...)
app.use("/", viewRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3000, () => {
    console.log(
      `Server listening on http://localhost:${process.env.PORT || 3000}`,
    );
  });
}

export default app;
