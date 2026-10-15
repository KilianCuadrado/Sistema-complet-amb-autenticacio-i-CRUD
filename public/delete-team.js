document.querySelectorAll("[data-delete]").forEach((button) => {
  button.onclick = async () => {
    if (!confirm("Segur que vols eliminar l'equip?")) return;
    const response = await fetch(`/pokemonsTeams/${button.dataset.delete}`, {
      method: "DELETE",
    });
    if (response.ok) return (location.href = "/protected");
    alert((await response.json()).error);
  };
});
