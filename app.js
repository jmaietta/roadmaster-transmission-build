(() => {
  "use strict";

  const prefix = "roadmaster-1994-4l60e:";
  const panel = document.getElementById("guide-nav");
  const menuToggle = document.getElementById("menu-toggle");
  const menuClose = document.getElementById("menu-close");
  const scrim = document.getElementById("nav-scrim");
  const checkboxes = [...document.querySelectorAll('input[type="checkbox"][data-key]')];
  const fields = [...document.querySelectorAll("[data-record]")];
  const cells = [...document.querySelectorAll("[data-record-cell]")];
  const sections = [...document.querySelectorAll(".chapter[data-title]")];
  const navLinks = [...document.querySelectorAll(".guide-list a")];
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const progressCount = document.getElementById("progress-count");
  const previousLink = document.getElementById("previous-chapter");
  const nextLink = document.getElementById("next-chapter");
  const currentLabel = document.getElementById("current-chapter");

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
  }

  function updateProgress() {
    const complete = checkboxes.filter((box) => box.checked).length;
    const percent = checkboxes.length ? Math.round((complete / checkboxes.length) * 100) : 0;
    progressBar.style.width = percent + "%";
    progressText.textContent = percent + "%";
    progressCount.textContent = complete + " of " + checkboxes.length + " complete";
  }

  function openMenu() {
    panel.classList.add("open");
    scrim.hidden = false;
    document.body.classList.add("nav-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    if (menuClose) menuClose.focus();
  }

  function closeMenu(restoreFocus) {
    panel.classList.remove("open");
    scrim.hidden = true;
    document.body.classList.remove("nav-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    if (restoreFocus && menuToggle) menuToggle.focus();
  }

  function setActiveSection(section) {
    const index = sections.indexOf(section);
    if (index < 0) return;

    navLinks.forEach((link) => {
      const active = link.hash === "#" + section.id;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });

    const number = section.dataset.number || String(index + 1).padStart(2, "0");
    currentLabel.textContent = number + " · " + section.dataset.title;
    const previous = sections[index - 1];
    const next = sections[index + 1];
    previousLink.classList.toggle("disabled", !previous);
    nextLink.classList.toggle("disabled", !next);
    previousLink.href = previous ? "#" + previous.id : "#top";
    nextLink.href = next ? "#" + next.id : "#top";
  }

  checkboxes.forEach((box) => {
    box.checked = safeGet(prefix + "check:" + box.dataset.key) === "1";
    box.addEventListener("change", () => {
      safeSet(prefix + "check:" + box.dataset.key, box.checked ? "1" : "0");
      updateProgress();
    });
  });

  fields.forEach((field) => {
    const key = prefix + "record:" + field.dataset.record;
    field.value = safeGet(key) || "";
    field.addEventListener("input", () => safeSet(key, field.value));
  });

  cells.forEach((cell) => {
    const key = prefix + "cell:" + cell.dataset.recordCell;
    cell.textContent = safeGet(key) || "";
    cell.addEventListener("input", () => safeSet(key, cell.textContent.trim()));
  });

  if (menuToggle) menuToggle.addEventListener("click", openMenu);
  if (menuClose) menuClose.addEventListener("click", () => closeMenu(true));
  if (scrim) scrim.addEventListener("click", () => closeMenu(false));
  navLinks.forEach((link) => link.addEventListener("click", () => closeMenu(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("open")) closeMenu(true);
  });

  const printButton = document.getElementById("print-plan");
  if (printButton) printButton.addEventListener("click", () => window.print());

  const resetButton = document.getElementById("reset-progress");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!window.confirm("Clear all saved checklist progress? Build-sheet entries will be retained.")) return;
      checkboxes.forEach((box) => {
        box.checked = false;
        safeRemove(prefix + "check:" + box.dataset.key);
      });
      updateProgress();
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, .1, .25] });
    sections.forEach((section) => observer.observe(section));
  }

  updateProgress();
  if (sections[0]) setActiveSection(sections[0]);
})();
