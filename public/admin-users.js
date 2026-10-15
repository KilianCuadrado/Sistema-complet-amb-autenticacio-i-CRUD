const usersContainer = document.querySelector("#users");
const message = document.querySelector("#message");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? "error" : "success";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error ?? "Error de la petició");
  return data;
}

function userForm(user) {
  const form = document.createElement("form");
  form.className = "user-row";
  form.innerHTML = `
    <h2>${user.username} <span class="small">#${user.id}</span></h2>
    <label>Nom d'usuari <input name="username" value="${user.username}" required minlength="3" maxlength="30" pattern="[a-zA-Z0-9_-]+"></label>
    <label>Nova contrasenya <input name="password" type="password" minlength="6" placeholder="Sense canvis"></label>
    <label>Rol
      <select name="role">
        <option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
        <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
      </select>
    </label>
    <button type="submit">Guardar canvis</button>
    <button type="button" data-delete="${user.id}">Eliminar</button>
  `;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    if (!body.password) delete body.password;
    try {
      await request(`/users/${user.id}`, { method: "PUT", body: JSON.stringify(body) });
      showMessage(`Usuari ${body.username} actualitzat.`);
      await loadUsers();
    } catch (error) {
      showMessage(error.message, true);
    }
  });
  form.querySelector("[data-delete]").addEventListener("click", async () => {
    if (!window.confirm(`Eliminar ${user.username} i els seus equips?`)) return;
    try {
      await request(`/users/${user.id}`, { method: "DELETE" });
      showMessage(`Usuari ${user.username} eliminat.`);
      await loadUsers();
    } catch (error) {
      showMessage(error.message, true);
    }
  });
  return form;
}

async function loadUsers() {
  try {
    const users = await request("/users");
    usersContainer.replaceChildren(...users.map(userForm));
  } catch (error) {
    showMessage(error.message, true);
  }
}

document.querySelector("#new-user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const body = Object.fromEntries(new FormData(form));
    await request("/users", { method: "POST", body: JSON.stringify(body) });
    form.reset();
    showMessage("Usuari creat.");
    await loadUsers();
  } catch (error) {
    showMessage(error.message, true);
  }
});

loadUsers();
