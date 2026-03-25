(() => {
  const KEY = "theme"; 

  function getTheme() {
    const t = (localStorage.getItem(KEY) || "").toLowerCase();
    return (t === "light" || t === "dark") ? t : "dark";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme === "dark" ? "theme-dark" : "theme-light");

    document.documentElement.style.colorScheme = theme;

    localStorage.setItem(KEY, theme);

    document.querySelectorAll("#btnTheme, #btnTema, [data-theme-toggle]").forEach((btn) => {
      const icon = btn.querySelector("i");
      if (icon) icon.className = theme === "dark" ? "bi bi-moon" : "bi bi-sun";
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    });
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || getTheme();
    setTheme(cur === "dark" ? "light" : "dark");
  }

  function init() {
    setTheme(getTheme());

    const buttons = document.querySelectorAll("#btnTheme, #btnTema, [data-theme-toggle]");
    if (!buttons.length) {
      console.warn("[theme] botão de tema não encontrado");
      return;
    }

    buttons.forEach((btn) => btn.addEventListener("click", toggleTheme));
    console.log("[theme] ok:", getTheme());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

