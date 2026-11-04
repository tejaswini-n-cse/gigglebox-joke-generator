const categorySelect = document.querySelector("#category");
const jokeText = document.querySelector("#joke-text");
const jokeCategory = document.querySelector("#joke-category");
const feedback = document.querySelector("#feedback");
const favoritesList = document.querySelector("#favorite-list");
const favoriteCount = document.querySelector("#favorite-count");
const FAVORITES_KEY = "gigglebox-favorites";
let currentJoke = null;
let favorites = loadFavorites();

document.querySelector("#new-joke").addEventListener("click", getJoke);
document.querySelector("#copy-joke").addEventListener("click", copyJoke);
document.querySelector("#save-joke").addEventListener("click", saveFavorite);
document.querySelector("#clear-favorites").addEventListener("click", clearFavorites);
renderFavorites();

async function getJoke() {
  feedback.textContent = "Finding a joke…";
  const category = categorySelect.value;
  const url = `https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?safe-mode`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not reach JokeAPI. Please try again.");
    const data = await response.json();
    if (data.error) throw new Error(data.message || "No joke found for this category.");
    currentJoke = {
      id: data.id,
      category: data.category,
      text: data.type === "twopart" ? `${data.setup}\n\n${data.delivery}` : data.joke
    };
    jokeText.textContent = currentJoke.text;
    jokeCategory.textContent = currentJoke.category.toUpperCase();
    feedback.textContent = "";
  } catch (error) {
    feedback.textContent = error.message;
  }
}

async function copyJoke() {
  if (!currentJoke) return feedback.textContent = "Get a joke first!";
  try {
    await navigator.clipboard.writeText(currentJoke.text);
    feedback.textContent = "Copied to clipboard!";
  } catch {
    feedback.textContent = "Clipboard access is unavailable in this browser.";
  }
}

function saveFavorite() {
  if (!currentJoke) return feedback.textContent = "Get a joke first!";
  if (favorites.some(item => item.id === currentJoke.id)) {
    feedback.textContent = "This joke is already in your favourites.";
    return;
  }
  favorites.unshift(currentJoke);
  persistFavorites();
  renderFavorites();
  feedback.textContent = "Saved to your favourites!";
}

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; }
  catch { return []; }
}
function persistFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}
function renderFavorites() {
  favoriteCount.textContent = favorites.length;
  if (!favorites.length) {
    favoritesList.innerHTML = '<p class="empty">No favourites yet. Save a joke you love!</p>';
    return;
  }
  favoritesList.innerHTML = favorites.map((item, index) => `
    <article class="favorite-item">
      <p>${escapeHTML(item.text).replace(/\n/g, "<br>")}<br><small>${escapeHTML(item.category)}</small></p>
      <button class="remove-favorite" data-index="${index}" aria-label="Remove favourite">×</button>
    </article>`).join("");
  favoritesList.querySelectorAll(".remove-favorite").forEach(button => {
    button.addEventListener("click", () => {
      favorites.splice(Number(button.dataset.index), 1);
      persistFavorites();
      renderFavorites();
    });
  });
}
function clearFavorites() {
  if (!favorites.length) return;
  if (confirm("Remove all saved favourites?")) {
    favorites = [];
    persistFavorites();
    renderFavorites();
  }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}