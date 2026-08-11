/* ---------------- Data & constants ---------------- */

const HEALTH_TYPES = [
  { key: "Sjuk", label: "Sjuk", color: "#E8C34D" },
  { key: "Skadad", label: "Skadad", color: "#E15554" },
];
const HEALTH_KEYS = HEALTH_TYPES.map((t) => t.key);

const DEFAULT_TRAINING_TYPES = [
  { key: "BJJ", label: "BJJ", color: "#B06AE0", defaultMinutes: 90, defaultKcalBurned: 600, category: "kampsport" },
  { key: "SW", label: "SW", color: "#E85D9E", defaultMinutes: 90, defaultKcalBurned: 600, category: "kampsport" },
  { key: "Gym", label: "Gym", color: "#4CAF7D", defaultMinutes: 60, defaultKcalBurned: 250, category: "gym" },
  { key: "Cykel", label: "Cykel", color: "#5B7FBF", defaultMinutes: "", defaultKcalBurned: "", category: "kondition" },
  { key: "Motionscykel", label: "Motionscykel", color: "#C9A227", defaultMinutes: "", defaultKcalBurned: "", category: "kondition" },
  { key: "Löpning", label: "Löpning", color: "#E8834A", defaultMinutes: "", defaultKcalBurned: "", category: "kondition" },
  { key: "Ovrigt", label: "Övrigt", color: "#8A8E99", defaultMinutes: "", defaultKcalBurned: "", category: null },
];
const TYPE_COLOR_PALETTE = ["#B06AE0", "#E85D9E", "#4CAF7D", "#5B7FBF", "#C9A227", "#E8834A", "#4FC3D9", "#8A8E99", "#6EE7B7", "#F5A65B"];

function loadTrainingTypes() {
  try {
    const raw = localStorage.getItem("training_types_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((t) => {
          if (t.category !== undefined) return t;
          const def = DEFAULT_TRAINING_TYPES.find((d) => d.key === t.key);
          return { ...t, category: def ? def.category : null };
        });
      }
    }
  } catch (e) { /* fall through to defaults */ }
  return DEFAULT_TRAINING_TYPES.map((t) => ({ ...t }));
}
function saveTrainingTypes() {
  try { localStorage.setItem("training_types_v1", JSON.stringify(trainingTypes)); } catch (e) { /* ignore */ }
}

let trainingTypes = loadTrainingTypes();
let TYPES = {};
let TYPE_KEYS = [];
let TRAINING_KEYS = [];
let DEFAULT_MINUTES = {};
let DEFAULT_KCAL_BURNED = {};

function rebuildTypes() {
  TYPES = {};
  DEFAULT_MINUTES = {};
  DEFAULT_KCAL_BURNED = {};
  trainingTypes.forEach((t) => {
    TYPES[t.key] = { label: t.label, color: t.color };
    DEFAULT_MINUTES[t.key] = t.defaultMinutes || "";
    DEFAULT_KCAL_BURNED[t.key] = t.defaultKcalBurned || "";
  });
  HEALTH_TYPES.forEach((t) => {
    TYPES[t.key] = { label: t.label, color: t.color };
    DEFAULT_MINUTES[t.key] = 0;
    DEFAULT_KCAL_BURNED[t.key] = "";
  });
  TRAINING_KEYS = trainingTypes.map((t) => t.key);
  TYPE_KEYS = TRAINING_KEYS.concat(HEALTH_KEYS);
}
rebuildTypes();

// Safe lookup — falls back gracefully if a type was deleted but old entries still reference it.
function typeMeta(key) {
  return TYPES[key] || { label: key, color: "#6B6F7A" };
}
const WEIGHT_COLOR = "#2DD4BF";

const TAB_COLOR_DEFAULTS = { vikt: "#8080FF", traning: "#8080FF", kalorier: "#8080FF", stats: "#8080FF" };
function loadTabColors() {
  try {
    const raw = localStorage.getItem("tab_colors_v1");
    if (raw) return { ...TAB_COLOR_DEFAULTS, ...JSON.parse(raw) };
  } catch (e) { /* fall through */ }
  return { ...TAB_COLOR_DEFAULTS };
}
function saveTabColors() {
  try { localStorage.setItem("tab_colors_v1", JSON.stringify(tabColors)); } catch (e) { /* ignore */ }
}
let tabColors = loadTabColors();

function loadNavGlowColors() {
  try {
    const raw = localStorage.getItem("nav_glow_colors_v1");
    if (raw) return { ...TAB_COLOR_DEFAULTS, ...JSON.parse(raw) };
  } catch (e) { /* fall through */ }
  return { ...TAB_COLOR_DEFAULTS };
}
function saveNavGlowColors() {
  try { localStorage.setItem("nav_glow_colors_v1", JSON.stringify(navGlowColors)); } catch (e) { /* ignore */ }
}
let navGlowColors = loadNavGlowColors();

function loadThemeMode() {
  try { return localStorage.getItem("theme_v1") || "dark"; } catch (e) { return "dark"; }
}
function saveThemeMode() {
  try { localStorage.setItem("theme_v1", themeMode); } catch (e) { /* ignore */ }
}

// ---- Tonad bakgrundsfärg ----
// Man väljer valfri färg på ett vanligt färghjul, men vi struntar helt i
// mättnad/ljushet från det valet - bara nyansen (hue) tas med vidare. Den
// nyansen läggs sedan på appens egna, redan beprövade mörka/ljusa nivåer
// (samma mättnad/ljushet som standardtemat alltid haft, bara med bytt
// nyans) så bakgrunden aldrig kan bli olöslig kontrastmässigt - även om man
// klickar på skrikande röd i hjulet blir resultatet en dov vinröd ton,
// aldrig ren röd.
function hexToHue(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
// Mättnad/ljushet-nivåer plockade rakt av från appens befintliga standardtema
// (samma tal som #0F1115/#14161C/... resp. #F4F5F7/#E4E6EB/... redan har) -
// bg2/card-bg i ljust läge hålls medvetet vita (ingen ton) så korten
// fortsätter poppa mot den tonade sidbakgrunden, precis som idag.
const BG_TINT_RECIPE = {
  dark: {
    "--bg": [16.7, 7.1], "--bg2": [16.7, 9.4], "--card-bg": [17.9, 11.0],
    "--border": [15.5, 13.9], "--border2": [14.6, 17.5], "--input-bg": [16.7, 7.1],
  },
  light: {
    "--bg": [15.8, 96.3], "--border": [14.9, 90.8],
    "--border2": [11.4, 86.3], "--input-bg": [15.4, 94.9],
  },
};
function loadBgAccentHex() {
  try { return localStorage.getItem("bg_accent_hex_v1") || null; } catch (e) { return null; }
}
function saveBgAccentHex() {
  try {
    if (bgAccentHex) localStorage.setItem("bg_accent_hex_v1", bgAccentHex);
    else localStorage.removeItem("bg_accent_hex_v1");
  } catch (e) { /* ignore */ }
}
let bgAccentHex = loadBgAccentHex();
function applyBgTint() {
  const root = document.documentElement;
  const allVars = ["--bg", "--bg2", "--card-bg", "--border", "--border2", "--input-bg"];
  let resolvedBg = themeMode === "light" ? "#F4F5F7" : "#0F1115";
  if (!bgAccentHex) {
    allVars.forEach((v) => root.style.removeProperty(v));
  } else {
    const hue = hexToHue(bgAccentHex);
    const recipe = themeMode === "light" ? BG_TINT_RECIPE.light : BG_TINT_RECIPE.dark;
    allVars.forEach((v) => {
      if (recipe[v]) {
        const hex = hslToHex(hue, recipe[v][0], recipe[v][1]);
        root.style.setProperty(v, hex);
        if (v === "--bg") resolvedBg = hex;
      } else {
        root.style.removeProperty(v);
      }
    });
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolvedBg);
}
function applyTheme() {
  if (themeMode === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  applyBgTint();
}
let themeMode = loadThemeMode();
applyTheme();

function loadHaptics() {
  try {
    const raw = localStorage.getItem("haptics_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveHaptics() {
  try { localStorage.setItem("haptics_v1", String(hapticsEnabled)); } catch (e) { /* ignore */ }
}
let hapticsEnabled = loadHaptics();
function vibrate(pattern) {
  if (!hapticsEnabled) return;
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern || 15); } catch (e) { /* ignore */ }
  }
}

function loadSoundEffects() {
  try {
    const raw = localStorage.getItem("sound_effects_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveSoundEffects() {
  try { localStorage.setItem("sound_effects_v1", String(soundEffectsEnabled)); } catch (e) { /* ignore */ }
}
let soundEffectsEnabled = loadSoundEffects();
let sharedAudioCtx = null;
// Kort, generad klocksplinga (inga ljudfiler behövs) som spelas upp när en
// grattis-popup visas - level-up får en extra fjärde, högre ton så den
// känns lite större än en vanlig prestation.
function playCelebrationChime(kind) {
  if (!soundEffectsEnabled) return;
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sharedAudioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const notes = kind === "platinum"
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0]
      : kind === "levelup" ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      const dur = 0.22;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  } catch (e) { /* ignore - ljud stöds inte/blockeras */ }
}
const MONTHS_SV = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const MONTHS_SV_FULL = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const WEEKDAYS_SV = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
function fmtDateWithWeekday(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${WEEKDAYS_SV[d.getDay()]}, ${d.getDate()} ${MONTHS_SV[d.getMonth()]}`;
}

const ACTIVITY_LEVELS = [
  { key: "stillasittande", label: "Stillasittande", desc: "Lite eller ingen träning", factor: 1.2 },
  { key: "latt", label: "Lätt aktiv", desc: "Träning 1-3 dagar/vecka", factor: 1.375 },
  { key: "mattlig", label: "Måttligt aktiv", desc: "Träning 3-5 dagar/vecka", factor: 1.55 },
  { key: "aktiv", label: "Mycket aktiv", desc: "Träning 6-7 dagar/vecka", factor: 1.725 },
  { key: "extrem", label: "Extremt aktiv", desc: "Hård träning + fysiskt jobb", factor: 1.9 },
];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
// Låter Enter i valfritt av angivna input-fält trigga samma knapp som ett
// klick skulle göra - används för alla "lägg till eget"-fält (övningar,
// pass, submissions, etc) så man slipper alltid trycka på plus-knappen.
function wireEnterSubmit(inputIds, btn) {
  if (!btn) return;
  inputIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); btn.click(); } });
  });
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function getISOWeek(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNum = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function fmtMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} tim`;
  return `${h}t ${m}min`;
}

function fmtDateShort(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_SV[d.getMonth()]}`;
}
function fmtDateShortWithYear(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_SV[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadArr(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveArr(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error("Kunde inte spara", e);
  }
}

let weightEntries = loadArr("weight_entries").sort((a, b) => a.date.localeCompare(b.date));
let workoutEntries = loadArr("workout_entries").sort((a, b) => b.date.localeCompare(a.date));
// Nyckeln för löpning bytte namn från "Jogging" till "Löpning" (för att vara
// konsekvent med övriga typer, där nyckel === etikett). Migrera ev. gamla
// loggade pass så statistik/prestationer inte tappar bort dem.
(() => {
  let migrated = false;
  workoutEntries.forEach((e) => { if (e.type === "Jogging") { e.type = "Löpning"; migrated = true; } });
  if (migrated) saveArr("workout_entries", workoutEntries);
})();

function persistWeights() { saveArr("weight_entries", weightEntries); }
function persistWorkouts() { saveArr("workout_entries", workoutEntries); }

/* ---------------- App state ---------------- */

let activeTab = "vikt";
function loadActivityLevel() {
  try { return localStorage.getItem("activity_level_v1") || "mattlig"; } catch (e) { return "mattlig"; }
}
function saveActivityLevel() {
  try { localStorage.setItem("activity_level_v1", calorieState.activity); } catch (e) { /* ignore */ }
}
let calorieState = { weight: "", activity: loadActivityLevel() };

function loadProfile() {
  try {
    const raw = localStorage.getItem("profile_v1");
    if (raw) return { name: "", age: "38", height: "182", gender: "man", ...JSON.parse(raw) };
  } catch (e) { /* fall through */ }
  return { name: "", age: "38", height: "182", gender: "man" };
}
function saveProfile() {
  try { localStorage.setItem("profile_v1", JSON.stringify(profile)); } catch (e) { /* ignore */ }
}
let profile = loadProfile();
// Läser en uppladdad bildfil, beskär den till kvadrat (center-crop) och
// skalar ner till maxSize px innan den sparas som JPEG-data-URL. Håller
// profilbilden liten (oftast under ~40 kB) så den inte gör backup/molnsynk
// tung, och undviker att spara hela originalfoton (kan vara flera MB).
function resizeImageFileToDataUrl(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Kunde inte läsa filen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Kunde inte tolka bilden"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- Ramar/glow (profilbild & flikikoner, låses upp med level) ---------------- */
// Samma katalog driver både profilbildens ram och flikarnas glow-effekt, så
// de låses upp i takt med varandra. Bara rörliga effekter finns kvar (inga
// statiska färger) - den första (Komet - guld) är gratis från level 1, resten
// låses upp var 5:e level därefter.
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
// Ordning: enkla enfärgade kometer först (starter-känsla), sen pulserande
// röd som första "mekanik-uppgraderingen", sen dina favoriter eld/frost som
// ett tema-par i mitten, distinkta mekaniker (sonar/glitter/prickar), sen
// dubbelkomet som en vidareutveckling av kometerna, och till sist RGB-ringen
// + norrsken som storfinal - de mest "premium" och lika varandra (fulla,
// roterande regnbågsringar), så de känns som toppen att nå.
const PROFILE_FRAMES = {
  cometGold: { label: "Komet — guld", type: "comet", color: "#FFD24C" },
  cometGreen: { label: "Komet — grön", type: "comet", color: "#34D97B" },
  pulseRed: { label: "Pulserande röd", type: "pulse", color: "#E24B4A" },
  cometPurple: { label: "Komet — lila", type: "comet", color: "#9B6BFF" },
  cometPink: { label: "Komet — rosa", type: "comet", color: "#FF3DB0" },
  fireRing: { label: "Eld-ring", type: "fire" },
  frostRing: { label: "Frost-ring", type: "frost" },
  sonarRainbow: { label: "Sonar-puls", type: "sonarRainbow" },
  glitterRainbow: { label: "Glitter-ring", type: "glitter", color: "#FF2EC4" },
  chaseDotsRainbow: { label: "Jagande prickar — 3", type: "chaseRainbow" },
  chaseDotsRainbow5: { label: "Jagande prickar — 5", type: "chaseRainbow5" },
  dualComet: { label: "Dubbelkomet", type: "dualComet", color: "#FF4D4D" },
  dualCometRainbow: { label: "Dubbelkomet — RGB", type: "dualCometRainbow" },
  rainbow: { label: "RGB-ring", type: "rainbow" },
  cometJaktLilaRosa: { label: "Komet-jakt — lila/rosa", type: "jaktChase", color: "#FF3DB0", color2: "#9B6BFF" },
  diamantJakt: { label: "Diamant-jakt", type: "jaktChase", color: "#96D2FF", color2: "#DCF0FF" },
  silverGuldDiamant: { label: "Silver → guld → diamant", type: "fullShift" },
  eldringJakt: { label: "Eldring-jakt", type: "jaktChase", color: "#E24B4A", color2: "#EF9F27" },
  frostringJakt: { label: "Frostring-jakt", type: "jaktChase", color: "#2DE0FF", color2: "#C8F0FF" },
  eldFrostCombo: { label: "Eld (långsam) + Frost (snabb)", type: "eldFrostCombo" },
  allaMinaRamar: { label: "Alla animationer", type: "cycleAll" },
};
// Nivå 1-50 är de befintliga effekterna, de fem första bara 1 steg isär så de
// känns som ett tidigt matchande set (pulserande röd flyttad hit istället för
// att bryta av mitt i, den passade inte lika bra bland eld/frost-paret).
// Nivå 55+ är de nya "premium"-ramarna, var 5:e nivå, med "alla mina ramar"
// som absolut sista/mest prestigefyllda.
const PROFILE_FRAME_UNLOCK_LEVEL = {
  cometGold: 1, cometGreen: 2, pulseRed: 3, cometPurple: 4, cometPink: 5,
  fireRing: 10, frostRing: 15, sonarRainbow: 20, glitterRainbow: 25,
  chaseDotsRainbow: 30, chaseDotsRainbow5: 35, dualComet: 40, dualCometRainbow: 45, rainbow: 50,
  cometJaktLilaRosa: 55, diamantJakt: 60, silverGuldDiamant: 65,
  eldringJakt: 70, frostringJakt: 75, eldFrostCombo: 80, allaMinaRamar: 85,
};
// Migrering av äldre/borttagna nycklar till sina närmaste nya motsvarigheter,
// så ingen tappar sitt val bara för att katalogen ändrats.
const PROFILE_FRAME_KEY_MIGRATIONS = {
  comet: "cometGold", gold: "cometGold", orange: "cometGold", cyan: "frostRing", pink: "cometPink",
  sonarGreen: "sonarRainbow", glitterGold: "glitterRainbow", chaseDots: "chaseDotsRainbow",
  cometCyan: "frostRing", dashRing: "glitterRainbow", glitchTail: "cometGold",
  white: "cometGold", yellow: "cometGold", blue: "frostRing", green: "cometGreen", red: "pulseRed", purple: "cometPurple",
  aurora: "rainbow",
};
// null/ogiltigt val faller alltid tillbaka på "cometGold" - den är alltid upplåst.
function resolveProfileFrame() {
  const key = PROFILE_FRAME_KEY_MIGRATIONS[profile.frame] || profile.frame;
  if (!key || !PROFILE_FRAMES[key]) return "cometGold";
  // Om man t.ex. nollställt sin nivå men fortfarande har en ram vald som
  // krävde en högre nivå (sparad i profil.frame sen tidigare), ska den
  // sluta visas - annars ser man en "upplåst" ram man inte längre kvalar
  // för. Faller tillbaka till första/enklaste ramen istället.
  const currentLevel = computeLevelInfo(totalXp()).level;
  const requiredLevel = PROFILE_FRAME_UNLOCK_LEVEL[key] || 1;
  if (currentLevel < requiredLevel && !debugForceUnlockCosmetics) return "cometGold";
  return key;
}
// Bygger style/klass för ramen/glowen runt en bild eller flikikon.
// `padding` avgör hur tjock ringen är (samma enhet som bildens storlek).
// `shape` är "circle" (standard, t.ex. profilbild/flikikoner) eller "octagon"
// (för bälte-badgen, som ska följa den åttkantiga formen i själva konstverket
// istället för en cirkel runt hela bildrutan).
function profileFrameWrapStyle(frameKey, padding, shape) {
  const f = PROFILE_FRAMES[frameKey] || PROFILE_FRAMES.cometGold;
  const isOctagon = shape === "octagon";
  const shapeClass = isOctagon ? " frame-shape-octagon" : "";
  const base = `padding:${padding}px;${isOctagon ? "" : "border-radius:50%;"}display:inline-flex;align-items:center;justify-content:center;flex-shrink:0`;
  if (f.type === "rainbow") return { className: "avatar-frame-rainbow" + shapeClass, style: base };
  if (f.type === "dualCometRainbow") return { className: "avatar-frame-dualcomet-rainbow" + shapeClass, style: base };
  if (f.type === "comet") {
    return { className: "avatar-frame-comet" + shapeClass, style: `${base};--comet-c:${hexToRgba(f.color, 0.9)};--comet-c-soft:${hexToRgba(f.color, 0.15)};--comet-glow:${hexToRgba(f.color, 0.35)}` };
  }
  if (f.type === "dualComet") {
    return { className: "avatar-frame-dualcomet" + shapeClass, style: `${base};--comet-c:${hexToRgba(f.color, 0.9)};--comet-c2:${hexToRgba(f.color, 0.6)};--comet-glow:${hexToRgba(f.color, 0.35)}` };
  }
  if (f.type === "fire") return { className: "avatar-frame-fire" + shapeClass, style: base };
  if (f.type === "frost") return { className: "avatar-frame-frost" + shapeClass, style: base };
  if (f.type === "pulse") return { className: "avatar-frame-pulse" + shapeClass, style: `${base};background:${f.color};--pulse-c:${hexToRgba(f.color, isOctagon ? 0.85 : 0.6)}` };
  if (f.type === "sonarRainbow") return { className: "avatar-frame-sonar-rainbow" + shapeClass, style: base };
  if (f.type === "glitter") return { className: "avatar-frame-glitter" + shapeClass, style: `${base};--glitter-c:${f.color}` };
  if (f.type === "chaseRainbow") return { className: "avatar-frame-chase-rainbow" + shapeClass, style: base };
  if (f.type === "chaseRainbow5") return { className: "avatar-frame-chase-rainbow5" + shapeClass, style: base };
  if (f.type === "jaktChase") {
    return { className: "avatar-frame-jaktchase" + shapeClass, style: `${base};--jakt-c1:${hexToRgba(f.color, 0.9)};--jakt-c2:${hexToRgba(f.color2 || f.color, 0.5)}` };
  }
  if (f.type === "fullShift") return { className: "avatar-frame-fullshift" + shapeClass, style: base };
  if (f.type === "eldFrostCombo") return { className: "avatar-frame-eldfrostcombo" + shapeClass, style: base };
  if (f.type === "cycleAll") return { className: "avatar-frame-cycleall" + shapeClass, style: base };
  return { className: "" + (isOctagon ? "frame-shape-octagon" : ""), style: `${base};background:${f.color};${isOctagon ? `filter:drop-shadow(0 0 5px ${f.glow})` : `box-shadow:0 0 10px ${f.glow}`}` };
}
// Representativ hex-färg för en ram/effekt, används t.ex. för att tona
// text/etiketter i samma anda som effekten (rainbow/fire/frost har ingen
// enskild färg annars).
function frameAccentColor(frameKey) {
  const f = PROFILE_FRAMES[frameKey];
  if (!f) return "#8080FF";
  if (f.color) return f.color;
  if (f.type === "rainbow" || f.type === "dualCometRainbow" || f.type === "sonarRainbow" || f.type === "chaseRainbow" || f.type === "chaseRainbow5" || f.type === "cycleAll") return "#FF3DB0";
  if (f.type === "fire" || f.type === "eldFrostCombo") return "#E24B4A";
  if (f.type === "frost") return "#2DE0FF";
  if (f.type === "fullShift") return "#EF9F27";
  return "#8080FF";
}
// Färdig <div><img></div>-HTML för profilbilden med aktuell ram, i valfri
// storlek. Returnerar null om ingen bild är uppladdad (anroparen visar då
// sin egen platshållare istället).
function profileAvatarHTML(size, padding) {
  if (!profile.avatar) return null;
  const frameKey = resolveProfileFrame();
  const frame = profileFrameWrapStyle(frameKey, padding);
  const cycleAttrs = frameKey === "allaMinaRamar" ? ` data-cycle-all="1" data-cycle-padding="${padding}" data-cycle-shape="circle"` : "";
  return `<div class="${frame.className}" style="${frame.style}"${cycleAttrs}><img src="${profile.avatar}" alt="Profilbild" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block" /></div>`;
}
// De 10 animerade "special"-effekterna - delas mellan profilramen och
// Flikfärgens glow-väljare. De vanliga solida färgerna väljs som vanligt via
// färgrutan i Flikfärg, inte via denna lista.
const FRAME_EFFECT_KEYS = [
  "cometGold", "cometGreen", "cometPurple", "cometPink",
  "pulseRed", "fireRing", "frostRing",
  "sonarRainbow", "glitterRainbow", "chaseDotsRainbow", "chaseDotsRainbow5",
  "dualComet", "dualCometRainbow", "rainbow",
  "cometJaktLilaRosa", "diamantJakt", "silverGuldDiamant", "eldringJakt", "frostringJakt", "eldFrostCombo", "allaMinaRamar",
];
// "Alla animationer" - cyklar genom ett fritt urval av tidigare upplåsta ramar
// (inget min/max - allt från 1 till alla). profile.cycleFrameKeys sparar
// urvalet; null/tom lista = alla upplåsta (utom cykel-ramen själv) som
// standard. Elementen hittas via MutationObserver istället för att ropas
// upp manuellt vid varje render-ställe - av.avatar-frame-cycleall kan dyka
// upp i profilbilden, bälte-badgen, m.fl. olika vyer.
const cycleAllTracked = new Map();
function getCycleAllFrameKeys() {
  const currentLevel = computeLevelInfo(totalXp()).level;
  const unlockedKeys = Object.keys(PROFILE_FRAMES).filter((k) =>
    k !== "allaMinaRamar" && (currentLevel >= (PROFILE_FRAME_UNLOCK_LEVEL[k] || 1) || debugForceUnlockCosmetics));
  if (Array.isArray(profile.cycleFrameKeys) && profile.cycleFrameKeys.length) {
    const chosen = profile.cycleFrameKeys.filter((k) => unlockedKeys.includes(k));
    if (chosen.length) return chosen;
  }
  return unlockedKeys.length ? unlockedKeys : ["cometGold"];
}
function initCycleAllFrames() {
  const keys = getCycleAllFrameKeys();
  // Städa bort spårning av element som inte längre finns kvar i DOM:en
  // (t.ex. en modal som stängdes) så deras interval inte fortsätter i onödan.
  cycleAllTracked.forEach((entry, el) => {
    if (!document.contains(el)) {
      clearInterval(entry.intervalId);
      cycleAllTracked.delete(el);
    }
  });
  document.querySelectorAll("[data-cycle-all]").forEach((el) => {
    if (cycleAllTracked.has(el)) return;
    const padding = parseInt(el.dataset.cyclePadding || "3", 10);
    const shape = el.dataset.cycleShape === "octagon" ? "octagon" : undefined;
    const tickMs = 2200;
    // Index räknas fram från verklig klocktid (inte en lokal räknare) så att
    // öppna/stänga profilmenyn, byta krona osv - som skapar ett helt nytt
    // DOM-element för avataren - INTE gör att cykeln hoppar tillbaka till
    // första ramen. Alla element som cyklar visar alltid "rätt" ram för
    // stunden, oavsett när de skapades.
    const applyFrame = () => {
      const idx = Math.floor(Date.now() / tickMs) % keys.length;
      const swatch = profileFrameWrapStyle(keys[idx], padding, shape);
      el.className = swatch.className;
      el.setAttribute("style", swatch.style);
    };
    applyFrame();
    const intervalId = setInterval(applyFrame, tickMs);
    cycleAllTracked.set(el, { intervalId });
  });
}
// Anropas när användaren ändrar sitt urval i kryssruteväljaren - då räcker
// det inte att bara vänta på MutationObservern (ingen DOM ändras), vi vill
// se den nya listan direkt.
function refreshCycleAllFrames() {
  cycleAllTracked.forEach((entry) => clearInterval(entry.intervalId));
  cycleAllTracked.clear();
  initCycleAllFrames();
}
let cycleAllObserverTimer = null;
const cycleAllObserver = new MutationObserver(() => {
  clearTimeout(cycleAllObserverTimer);
  cycleAllObserverTimer = setTimeout(initCycleAllFrames, 60);
});
cycleAllObserver.observe(document.body, { childList: true, subtree: true });

let calorieLog = loadArr("calorie_log");
function persistCalorieLog() { saveArr("calorie_log", calorieLog); }
function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}
let workoutFormState = { type: TRAINING_KEYS[0] || HEALTH_KEYS[0], minutes: DEFAULT_MINUTES[TRAINING_KEYS[0]] || "", date: todayISO(), customLabel: "", note: "", editingId: null, distance: "", ratings: {}, gymSplit: null, submissions: [] };
const DISTANCE_TYPES = ["Löpning", "Motionscykel", "Cykel"];
let weightChartInstance = null;
let statsWeightChartInstance = null;
let statsBarChartInstance = null;
let statsCalorieChartInstance = null;

function loadShowCalorieStats() {
  try {
    const raw = localStorage.getItem("show_calorie_stats_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowCalorieStats() {
  try { localStorage.setItem("show_calorie_stats_v1", String(showCalorieStats)); } catch (e) { /* ignore */ }
}
let showCalorieStats = loadShowCalorieStats();

function loadShowSubmissionStats() {
  try {
    const raw = localStorage.getItem("show_submission_stats_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowSubmissionStats() {
  try { localStorage.setItem("show_submission_stats_v1", String(showSubmissionStats)); } catch (e) { /* ignore */ }
}
let showSubmissionStats = loadShowSubmissionStats();

function loadShowDistributionStats() {
  try {
    const raw = localStorage.getItem("show_distribution_stats_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowDistributionStats() {
  try { localStorage.setItem("show_distribution_stats_v1", String(showDistributionStats)); } catch (e) { /* ignore */ }
}
let showDistributionStats = loadShowDistributionStats();

function loadShowCalorieHistoryList() {
  try {
    const raw = localStorage.getItem("show_calorie_history_list_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowCalorieHistoryList() {
  try { localStorage.setItem("show_calorie_history_list_v1", String(showCalorieHistoryList)); } catch (e) { /* ignore */ }
}
let showCalorieHistoryList = loadShowCalorieHistoryList();

function loadShowWeightHistory() {
  try {
    const raw = localStorage.getItem("show_weight_history_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowWeightHistory() {
  try { localStorage.setItem("show_weight_history_v1", String(showWeightHistory)); } catch (e) { /* ignore */ }
}
let showWeightHistory = loadShowWeightHistory();

function loadShowWorkoutHistory() {
  try {
    const raw = localStorage.getItem("show_workout_history_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowWorkoutHistory() {
  try { localStorage.setItem("show_workout_history_v1", String(showWorkoutHistory)); } catch (e) { /* ignore */ }
}
let showWorkoutHistory = loadShowWorkoutHistory();

function loadShowBodyMeasurementHistory() {
  try {
    const raw = localStorage.getItem("show_bm_history_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowBodyMeasurementHistory() {
  try { localStorage.setItem("show_bm_history_v1", String(showBodyMeasurementHistory)); } catch (e) { /* ignore */ }
}
let showBodyMeasurementHistory = loadShowBodyMeasurementHistory();

function loadShowCompareCard() {
  try {
    const raw = localStorage.getItem("show_compare_card_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowCompareCard() {
  try { localStorage.setItem("show_compare_card_v1", String(showCompareCard)); } catch (e) { /* ignore */ }
}
let showCompareCard = loadShowCompareCard();

function loadShowWeeklyChallenge() {
  try {
    const raw = localStorage.getItem("show_weekly_challenge_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowWeeklyChallenge() {
  try { localStorage.setItem("show_weekly_challenge_v1", String(showWeeklyChallenge)); } catch (e) { /* ignore */ }
}
let showWeeklyChallenge = loadShowWeeklyChallenge();

function loadShowMonthlyBarChart() {
  try {
    const raw = localStorage.getItem("show_monthly_bar_chart_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowMonthlyBarChart() {
  try { localStorage.setItem("show_monthly_bar_chart_v1", String(showMonthlyBarChart)); } catch (e) { /* ignore */ }
}
let showMonthlyBarChart = loadShowMonthlyBarChart();

function loadMonthRecapLastSeen() {
  try { return localStorage.getItem("month_recap_last_seen_v1") || null; } catch (e) { return null; }
}
function saveMonthRecapLastSeen() {
  try { localStorage.setItem("month_recap_last_seen_v1", monthRecapLastSeen); } catch (e) { /* ignore */ }
}
let monthRecapLastSeen = loadMonthRecapLastSeen();

function lastCompletedMonthKey() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}
function monthKeyLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_SV[m - 1]} ${y}`;
}
function monthKeyLabelFull(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_SV_FULL[m - 1]} ${y}`;
}
function checkMonthRecapAutoShow() {
  const key = lastCompletedMonthKey();
  if (monthRecapLastSeen === key) return;
  monthRecapLastSeen = key;
  saveMonthRecapLastSeen();
  celebrationQueue.push({ type: "monthrecap", monthKey: key });
  if (!document.getElementById("celebrationOverlay")) showNextCelebration();
}

function loadNavIconStyle() {
  try { return localStorage.getItem("nav_icon_style_v1") || "emblem"; } catch (e) { return "emblem"; }
}
function saveNavIconStyle() {
  try { localStorage.setItem("nav_icon_style_v1", navIconStyle); } catch (e) { /* ignore */ }
}
let navIconStyle = loadNavIconStyle();

function loadNavIconSize() {
  try { return localStorage.getItem("nav_icon_size_v1") || "small"; } catch (e) { return "small"; }
}
function saveNavIconSize() {
  try { localStorage.setItem("nav_icon_size_v1", navIconSize); } catch (e) { /* ignore */ }
}
let navIconSize = loadNavIconSize();

function loadLeaderboardSize() {
  try {
    const raw = parseInt(localStorage.getItem("leaderboard_size_v1"), 10);
    return [10, 15, 20, 30, 50].includes(raw) ? raw : 15;
  } catch (e) { return 15; }
}
function saveLeaderboardSize() {
  try { localStorage.setItem("leaderboard_size_v1", String(leaderboardSize)); } catch (e) { /* ignore */ }
}
let leaderboardSize = loadLeaderboardSize();
function loadLeaderboardGenderFilter() {
  try {
    const raw = localStorage.getItem("leaderboard_gender_filter_v1");
    return raw === "man" || raw === "kvinna" ? raw : "all";
  } catch (e) { return "all"; }
}
function saveLeaderboardGenderFilter() {
  try { localStorage.setItem("leaderboard_gender_filter_v1", leaderboardGenderFilter); } catch (e) { /* ignore */ }
}
let leaderboardGenderFilter = loadLeaderboardGenderFilter();

function loadShowNavLabels() {
  try { const raw = localStorage.getItem("show_nav_labels_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveShowNavLabels() {
  try { localStorage.setItem("show_nav_labels_v1", String(showNavLabels)); } catch (e) { /* ignore */ }
}
let showNavLabels = loadShowNavLabels();

function loadNavBadgeColor() {
  try { return localStorage.getItem("nav_badge_color_v1") || "#FFFFFF"; } catch (e) { return "#FFFFFF"; }
}
function saveNavBadgeColor() {
  try { localStorage.setItem("nav_badge_color_v1", navBadgeColor); } catch (e) { /* ignore */ }
}
let navBadgeColor = loadNavBadgeColor();

function loadShowWeightStats() {
  try {
    const raw = localStorage.getItem("show_weight_stats_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowWeightStats() {
  try { localStorage.setItem("show_weight_stats_v1", String(showWeightStats)); } catch (e) { /* ignore */ }
}
let showWeightStats = loadShowWeightStats();
let calorieStatsMode = "month"; // "month" | "week"
let calorieStatsAnchor = todayISO();

function toLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOf(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0=Monday
  d.setDate(d.getDate() - dow);
  return toLocalISO(d);
}
function shiftMonth(dateStr, delta) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return toLocalISO(d);
}

const content = document.getElementById("content");
const tabbar = document.getElementById("tabbar");

/* ---------------- Icons (inline SVG) ---------------- */

const ICONS = {
  scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="m3 7 3 8a2 2 0 0 0 2 1.3h.5a2 2 0 0 0 2-1.3l3-8"/><path d="m13 7 3 8a2 2 0 0 0 2 1.3h.5a2 2 0 0 0 2-1.3l3-8"/><path d="M7 21h10"/><path d="M5.5 7h5"/><path d="M13.5 7h5"/></svg>`,
  dumbbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 4H3a2 2 0 0 0 0 4h2"/><path d="M19 4h2a2 2 0 0 1 0 4h-2"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`,
  calendarCheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 20 2-10 5 4.5L12 6l3 8.5 5-4.5 2 10Z"/><path d="M4 20h16"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>`,
  medal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="16" r="5.5"/><path d="M8.5 11 6 3"/><path d="M15.5 11 18 3"/></svg>`,
  award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/></svg>`,
  gem: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20"/><path d="M12 3 8 9l4 12 4-12Z"/></svg>`,
  compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6Z"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l3 5-9 13L3 8Z"/><path d="M3 8h18"/></svg>`,
  mountain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 6-14 4 8 3-5 5 11Z"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m6.5 6.5 2 2"/><path d="m15.5 15.5 2 2"/><path d="m6.5 17.5 2-2"/><path d="m15.5 8.5 2-2"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 4 3 3-3 3"/><path d="M2 7h4a5 5 0 0 1 4 2l1.5 2"/><path d="m18 20 3-3-3-3"/><path d="M2 17h4a5 5 0 0 0 4-2l1.5-2"/><path d="M14 7h4"/><path d="M14 17h4"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4.2 0-7.5-3.6-7.5-8.2 0-3.6 2.1-6.1 5.1-6.1 1 0 1.6.5 2.1.5.5 0 1.2-.5 2.3-.5 1.7 0 3.1.8 4 2.1-2.6 1.4-3 5.1-.4 6.9-.6 2.7-2.8 5.3-5.6 5.3Z"/><path d="M12 6.7c0-2 1.2-3.3 3-3.7-.2 2-1.3 3.3-3 3.7Z"/></svg>`,
  volcano: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 6-14 4 8 3-5 5 11Z"/><circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  comet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="7" r="3"/><path d="M14 10 3 21"/><path d="M14 10 7 13"/><path d="M14 10 10 17"/></svg>`,
  puzzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4a2 2 0 1 1 4 0v1h3a2 2 0 0 1 2 2v3h1a2 2 0 1 1 0 4h-1v3a2 2 0 0 1-2 2h-3v-1a2 2 0 1 0-4 0v1H6a2 2 0 0 1-2-2v-3H3a2 2 0 1 1 0-4h1V7a2 2 0 0 1 2-2h3Z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-8-4.5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6.5-8 11-8 11Z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/></svg>`,
  snowflake: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m4.9 4.9 14.2 14.2"/><path d="m19.1 4.9-14.2 14.2"/><path d="M2 12h20"/></svg>`,
  run: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2a4 4 0 0 1 4-4h1"/><path d="M20 8v2a4 4 0 0 1-4 4h-1"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/></svg>`,
  runner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14.5" cy="4.5" r="1.6" fill="currentColor" stroke="none"/><path d="M12.5 8 L8.5 10.5 L9.5 14.5 L6.5 18 L4.5 21"/><path d="M8.5 10.5 L13 12.5 L16.5 9.5"/><path d="M9.5 14.5 L13.5 16.5 L12.5 21"/><path d="M16.5 9.5 L19.5 11.5"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13"/><path d="M3 12h18"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>`,
  belt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5 10 11"/><path d="M10 11 4 19"/><path d="M22 5 14 11"/><path d="M14 11 20 19"/><rect x="9" y="8.3" width="6" height="5.4" rx="1.2"/><path d="M4 16.5 6 18"/></svg>`,
  flower: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><path d="M12 2a3 3 0 0 1 0 6"/><path d="M12 22a3 3 0 0 0 0-6"/><path d="M2 12a3 3 0 0 1 6 0"/><path d="M22 12a3 3 0 0 0-6 0"/></svg>`,
  rabbit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4c-1 2-1 5 0 7"/><path d="M16 4c1 2 1 5 0 7"/><circle cx="12" cy="14" r="6"/></svg>`,
  hourglass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12"/><path d="M6 21h12"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9"/><path d="M17 3c0 5-5 6-5 9s5 4 5 9"/></svg>`,
  battery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 10v4"/><path d="M6 10v4"/></svg>`,
  bed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 18v2"/><path d="M21 18v2"/><path d="M3 13h18"/><path d="M7 9V7a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/></svg>`,
  wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 16h14a3 3 0 1 1-3 3"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  userCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5"/></svg>`,
  ring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>`,
};

/* ---------------- Undo toast ---------------- */

let undoTimer = null;
function showUndoToast(message, undoFn) {
  const existing = document.getElementById("undoToast");
  if (existing) existing.remove();
  if (undoTimer) clearTimeout(undoTimer);
  const toast = document.createElement("div");
  toast.className = "undo-toast";
  toast.id = "undoToast";
  toast.innerHTML = `<span>${message}</span><button id="undoBtn">Ångra</button>`;
  document.body.appendChild(toast);
  document.getElementById("undoBtn").addEventListener("click", () => {
    toast.remove();
    if (undoTimer) clearTimeout(undoTimer);
    undoFn();
  });
  undoTimer = setTimeout(() => toast.remove(), 5000);
}

function showInfoToast(message) {
  const existing = document.getElementById("undoToast");
  if (existing) existing.remove();
  if (undoTimer) clearTimeout(undoTimer);
  const toast = document.createElement("div");
  toast.className = "undo-toast";
  toast.id = "undoToast";
  toast.innerHTML = `<span>${message}</span><button id="infoToastCloseBtn">Stäng</button>`;
  document.body.appendChild(toast);
  document.getElementById("infoToastCloseBtn").addEventListener("click", () => {
    toast.remove();
    if (undoTimer) clearTimeout(undoTimer);
  });
  undoTimer = setTimeout(() => toast.remove(), 4000);
}

function showXpBump(amount) {
  const existing = document.getElementById("xpBumpToast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "xpBumpToast";
  el.className = "xp-bump-toast";
  el.style.color = tabColors.stats;
  el.textContent = `+${amount} XP`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

/* ---------------- Quick presets (editable in settings) ---------------- */

const DEFAULT_QUICK_PRESETS = {
  eaten: [
    { id: "qe1", label: "Frukost", kcal: 300 },
    { id: "qe2", label: "Lunch", kcal: 600 },
    { id: "qe3", label: "Middag", kcal: 600 },
    { id: "qe4", label: "Kvällsmat", kcal: 500 },
  ],
  burned: [
    { id: "qb1", label: "BJJ/SW", kcal: 600 },
    { id: "qb2", label: "Gym", kcal: 250 },
  ],
};
function loadQuickPresets() {
  try {
    const raw = localStorage.getItem("quick_presets_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.eaten) && Array.isArray(parsed.burned)) {
        parsed.burned.forEach((p) => { if (p.color === "#4A90D9") delete p.color; });
        return parsed;
      }
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_QUICK_PRESETS));
}
function saveQuickPresets() {
  try { localStorage.setItem("quick_presets_v1", JSON.stringify(quickPresets)); } catch (e) { /* ignore */ }
}
let quickPresets = loadQuickPresets();

/* ---------------- Advanced menu (BJJ/SW post-session ratings) ---------------- */

const DEFAULT_ADVANCED_QUESTIONS = [
  { id: "trotthet", title: "Trötthet", desc: "Hur fysiskt krävande passet var i helhet", enabled: true },
  { id: "teknik", title: "Teknik", desc: "Hur mycket lärde du dig/förbättrade tekniken under passet", enabled: true },
  { id: "sparring", title: "Sparring", desc: "Hur upplevdes sparringen i helhet", enabled: true },
];
function loadAdvancedMenuEnabled() {
  try { const raw = localStorage.getItem("advanced_menu_enabled_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveAdvancedMenuEnabled() {
  try { localStorage.setItem("advanced_menu_enabled_v1", String(advancedMenuEnabled)); } catch (e) { /* ignore */ }
}
function loadAdvancedQuestions() {
  try {
    const raw = localStorage.getItem("advanced_questions_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_ADVANCED_QUESTIONS));
}
function saveAdvancedQuestions() {
  try { localStorage.setItem("advanced_questions_v1", JSON.stringify(advancedQuestions)); } catch (e) { /* ignore */ }
}
let advancedMenuEnabled = loadAdvancedMenuEnabled();
let tabOrderSectionOpen = false;

let settingsListExpanded = {};
function cardChevronHeaderHTML(toggleId, label, expanded, marginBottom) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;${marginBottom ? `margin-bottom:${marginBottom};` : ""}" id="${toggleId}">
      <span class="card-label" style="margin-bottom:0">${label}</span>
      <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${expanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
    </div>
  `;
}
function collapsibleListHeaderHTML(listId, label, count) {
  const expanded = !!settingsListExpanded[listId];
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:2px 0" data-list-toggle="${listId}">
      <span style="font-size:13px;font-weight:600;color:var(--muted)">${label}${count !== undefined ? ` <span style="color:var(--muted2);font-weight:400">(${count})</span>` : ""}</span>
      <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${expanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
    </div>
  `;
}
const SETTINGS_LIST_RENDERERS = {};
function wireCollapsibleListToggles(root) {
  root.querySelectorAll("[data-list-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.listToggle;
      settingsListExpanded[id] = !settingsListExpanded[id];
      const renderFn = SETTINGS_LIST_RENDERERS[id];
      if (renderFn) renderFn();
      if (id === "gymSplitsList") renderGymSplitsDefaultControls();
    });
  });
}
let colorsSectionOpen = false;
let trainingAdvancedSectionOpen = false;
function loadKampsportAdvancedSectionOpen() {
  try { const raw = localStorage.getItem("kampsport_advanced_open_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveKampsportAdvancedSectionOpen() {
  try { localStorage.setItem("kampsport_advanced_open_v1", String(kampsportAdvancedSectionOpen)); } catch (e) { /* ignore */ }
}
let kampsportAdvancedSectionOpen = loadKampsportAdvancedSectionOpen();
let viktAdvancedSectionOpen = false;
let presetsSectionOpen = false;

const DEFAULT_MACRO_SETTINGS = {
  protein: { enabled: true,
    green: { mode: "perkg", value: 1.8 },
    blue: { mode: "perkg", value: 1.5 },
    orange: { mode: "perkg", value: 1.0 } },
  fat: { enabled: false,
    green: { mode: "perkg", value: 1 },
    blue: { mode: "perkg", value: 0.8 },
    orange: { mode: "perkg", value: 0.5 } },
  carbs: { enabled: false,
    green: { mode: "perkg", value: 4 },
    blue: { mode: "perkg", value: 3 },
    orange: { mode: "perkg", value: 2 } },
};
function normalizeMacroSetting(key, s) {
  const def = DEFAULT_MACRO_SETTINGS[key];
  s = s || {};
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : def.enabled,
    green: { ...def.green, ...(s.green || {}) },
    blue: { ...def.blue, ...(s.blue || {}) },
    orange: { ...def.orange, ...(s.orange || {}) },
  };
}
function loadMacroSettings() {
  try {
    const raw = localStorage.getItem("macro_settings_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { protein: normalizeMacroSetting("protein", parsed.protein),
          fat: normalizeMacroSetting("fat", parsed.fat),
          carbs: normalizeMacroSetting("carbs", parsed.carbs) };
      }
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_MACRO_SETTINGS));
}
function saveMacroSettings() {
  try { localStorage.setItem("macro_settings_v1", JSON.stringify(macroSettings)); } catch (e) { /* ignore */ }
}
let macroSettings = loadMacroSettings();
function macroColorFor(macroKey, grams, bodyweightKg) {
  const setting = macroSettings[macroKey];
  if (!setting || !setting.enabled) return "var(--text)";
  const levelValue = (level) => (level.mode === "perkg" ? (bodyweightKg ? grams / bodyweightKg : null) : grams);
  const greenVal = levelValue(setting.green);
  const blueVal = levelValue(setting.blue);
  const orangeVal = levelValue(setting.orange);
  if (greenVal != null && greenVal >= setting.green.value) return "#4CAF7D";
  if (blueVal != null && blueVal >= setting.blue.value) return "#4A90D9";
  if (orangeVal != null && orangeVal >= setting.orange.value) return "#E8834A";
  return "#E15554";
}
let backupSectionOpen = false;
let authFormMode = "login"; // "login" | "signup"
let authFormError = "";
let authFormBusy = false;
let profilePasswordSectionOpen = false;
let debugSectionOpen = false;
let debugUnlockedThisSession = false;
const DEBUG_PIN_HASH = "5a4a0c923c9a9f9edb8a8f6aa3f6212708ad91b6895f3e5fa606710570b1f1f4";
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
let profileModalReturnsToSettings = false;

function loadBeltSectionOpen() {
  try { return localStorage.getItem("belt_section_open_v1") !== "false"; } catch (e) { return true; }
}
function saveBeltSectionOpen() {
  try { localStorage.setItem("belt_section_open_v1", String(beltSectionOpen)); } catch (e) { /* ignore */ }
}
let beltSectionOpen = loadBeltSectionOpen();
let editingBeltName = null;

function loadProfileFramePickerExpanded() {
  try { return localStorage.getItem("profile_frame_picker_expanded_v1") !== "false"; } catch (e) { return true; }
}
function saveProfileFramePickerExpanded() {
  try { localStorage.setItem("profile_frame_picker_expanded_v1", String(profileFramePickerExpanded)); } catch (e) { /* ignore */ }
}
let profileFramePickerExpanded = loadProfileFramePickerExpanded();

function loadBeltBadgeFrameEnabled() {
  try { return localStorage.getItem("belt_badge_frame_enabled_v1") !== "false"; } catch (e) { return true; }
}
function saveBeltBadgeFrameEnabled() {
  try { localStorage.setItem("belt_badge_frame_enabled_v1", String(beltBadgeFrameEnabled)); } catch (e) { /* ignore */ }
}
let beltBadgeFrameEnabled = loadBeltBadgeFrameEnabled();

function highestActiveBeltName(beltDates) {
  const dates = beltDates || profile.beltDates;
  const tiers = BELT_TIERS.slice(0, 5);
  let highest = null;
  tiers.forEach((tier) => {
    if (dates && dates[tier.name]) highest = tier.name;
  });
  return highest;
}
let advancedQuestions = loadAdvancedQuestions();

/* ---------------- Submissions menu (BJJ/SW) ---------------- */

const DEFAULT_SUBMISSION_TYPES = [
  // Chokes
  { id: "anaconda", label: "Anaconda", enabled: true, category: "chokes" },
  { id: "arm_triangle", label: "Arm Triangle", enabled: true, category: "chokes" },
  { id: "bow_and_arrow", label: "Bow and Arrow", enabled: true, category: "chokes" },
  { id: "clock_choke", label: "Clock Choke", enabled: true, category: "chokes" },
  { id: "darce", label: "D'Arce", enabled: true, category: "chokes" },
  { id: "ezekiel", label: "Ezekiel", enabled: true, category: "chokes" },
  { id: "guillotine", label: "Guillotine", enabled: true, category: "chokes" },
  { id: "north_south", label: "North-South", enabled: true, category: "chokes" },
  { id: "paper_cutter", label: "Paper Cutter", enabled: true, category: "chokes" },
  { id: "peruvian_necktie", label: "Peruvian Necktie", enabled: true, category: "chokes" },
  { id: "rnc", label: "RNC", enabled: true, category: "chokes" },
  { id: "triangle", label: "Triangle", enabled: true, category: "chokes" },
  { id: "scissors_choke", label: "Scissors", enabled: true, category: "chokes" },
  // Armlås
  { id: "americana", label: "Americana", enabled: true, category: "armlocks" },
  { id: "armbar", label: "Armbar", enabled: true, category: "armlocks" },
  { id: "baratoplata", label: "Baratoplata", enabled: true, category: "armlocks" },
  { id: "bicep_slicer", label: "Bicep Slicer", enabled: true, category: "armlocks" },
  { id: "kimura", label: "Kimura", enabled: true, category: "armlocks" },
  { id: "mir_lock", label: "Mir Lock", enabled: true, category: "armlocks" },
  { id: "omoplata", label: "Omoplata", enabled: true, category: "armlocks" },
  { id: "straight_armlock", label: "Straight Armlock", enabled: true, category: "armlocks" },
  { id: "tarikoplata", label: "Tarikoplata", enabled: true, category: "armlocks" },
  { id: "wrist_lock", label: "Wrist Lock", enabled: true, category: "armlocks" },
  { id: "scarf_hold_armlock", label: "Scarf Hold", enabled: true, category: "armlocks" },
  // Ben- och fotledsvarianter
  { id: "aoki_lock", label: "Aoki Lock", enabled: true, category: "leglocks" },
  { id: "banana_split", label: "Banana Split", enabled: true, category: "leglocks" },
  { id: "calf_slicer", label: "Calf Slicer", enabled: true, category: "leglocks" },
  { id: "estima_lock", label: "Estima Lock", enabled: true, category: "leglocks" },
  { id: "heel_hook_inside", label: "Heel Hook (Inside)", enabled: true, category: "leglocks" },
  { id: "heel_hook_outside", label: "Heel Hook (Outside)", enabled: true, category: "leglocks" },
  { id: "kneebar", label: "Kneebar", enabled: true, category: "leglocks" },
  { id: "mikey_lock", label: "Mikey Lock", enabled: true, category: "leglocks" },
  { id: "straight_ankle_lock", label: "Straight Ankle Lock", enabled: true, category: "leglocks" },
  { id: "toe_hold", label: "Toe Hold", enabled: true, category: "leglocks" },
  // Övriga
  { id: "twister", label: "Twister", enabled: true, category: null },
];
const SUBMISSION_MIGRATIONS = {
  armbar: { category: "armlocks" },
  tarikoplata: { category: "armlocks" },
  scarf_hold_armlock: { category: "armlocks", label: "Scarf Hold" },
  // "Choke" borttaget ur namnet på alla utom Clock Choke (2026) - kortare namn i menyn.
  anaconda: { label: "Anaconda" },
  arm_triangle: { label: "Arm Triangle" },
  bow_and_arrow: { label: "Bow and Arrow" },
  darce: { label: "D'Arce" },
  ezekiel: { label: "Ezekiel" },
  guillotine: { label: "Guillotine" },
  north_south: { label: "North-South" },
  paper_cutter: { label: "Paper Cutter" },
  triangle: { label: "Triangle" },
  scissors_choke: { label: "Scissors" },
};
// Submissions som helt tagits bort (t.ex. dubbletter). Filtreras bort ur
// sparade listor - historiska pass som redan loggat dem påverkas inte.
const RETIRED_SUBMISSION_IDS = new Set(["figure_four_ankle_lock"]);
function migrateSubmissionTypesList(list) {
  const withCategory = list
    .filter((s) => s && !RETIRED_SUBMISSION_IDS.has(s.id))
    .map((s) => {
      if (SUBMISSION_MIGRATIONS[s.id]) return { ...s, ...SUBMISSION_MIGRATIONS[s.id] };
      if (s.category !== undefined) return s;
      const def = DEFAULT_SUBMISSION_TYPES.find((d) => d.id === s.id);
      return { ...s, category: def ? def.category : null };
    });
  const existingIds = new Set(withCategory.map((s) => s.id));
  const newDefaults = DEFAULT_SUBMISSION_TYPES.filter((d) => !existingIds.has(d.id)).map((d) => ({ ...d }));
  return [...withCategory, ...newDefaults];
}
const SUBMISSION_CATEGORY_LABELS = { chokes: "Stryp", armlocks: "Armlås", leglocks: "Ben- och fotledsvarianter" };
const SUBMISSION_CATEGORY_ORDER = ["chokes", "armlocks", "leglocks", null];
function groupSubmissionsByCategory(list) {
  const byAlpha = (a, b) => a.label.localeCompare(b.label, "sv");
  return SUBMISSION_CATEGORY_ORDER
    .map((cat) => ({
      label: cat ? SUBMISSION_CATEGORY_LABELS[cat] : "Övriga",
      items: list.filter((s) => (s.category || null) === cat).sort(byAlpha),
    }))
    .filter((g) => g.items.length);
}
function loadSubmissionsMenuEnabled() {
  try { const raw = localStorage.getItem("submissions_menu_enabled_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveSubmissionsMenuEnabled() {
  try { localStorage.setItem("submissions_menu_enabled_v1", String(submissionsMenuEnabled)); } catch (e) { /* ignore */ }
}
function loadSubmissionTypes() {
  try {
    const raw = localStorage.getItem("submission_types_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return migrateSubmissionTypesList(parsed);
      }
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_SUBMISSION_TYPES));
}
function saveSubmissionTypes() {
  try { localStorage.setItem("submission_types_v1", JSON.stringify(submissionTypes)); } catch (e) { /* ignore */ }
}
let submissionsMenuEnabled = loadSubmissionsMenuEnabled();
let submissionTypes = loadSubmissionTypes();

/* ---------------- Gym split menu (choose which body parts trained) ---------------- */

const DEFAULT_GYM_SPLITS = [
  { id: "pass1", text: "Bröst, Triceps, Axlar", enabled: true },
  { id: "pass2", text: "Rygg, Biceps", enabled: true },
  { id: "pass3", text: "Ben", enabled: true },
];
function loadGymMenuEnabled() {
  try { const raw = localStorage.getItem("gym_menu_enabled_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveGymMenuEnabled() {
  try { localStorage.setItem("gym_menu_enabled_v1", String(gymMenuEnabled)); } catch (e) { /* ignore */ }
}
function loadGymSplits() {
  try {
    const raw = localStorage.getItem("gym_splits_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_GYM_SPLITS));
}
function saveGymSplits() {
  try { localStorage.setItem("gym_splits_v1", JSON.stringify(gymSplits)); } catch (e) { /* ignore */ }
}
let gymMenuEnabled = loadGymMenuEnabled();
function loadKonditionMenuEnabled() {
  try { const raw = localStorage.getItem("kondition_menu_enabled_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveKonditionMenuEnabled() {
  try { localStorage.setItem("kondition_menu_enabled_v1", String(konditionMenuEnabled)); } catch (e) { /* ignore */ }
}
let konditionMenuEnabled = loadKonditionMenuEnabled();

/* ---------------- Personbästa (PB) ---------------- */

// Rimlighetstak per övning (kg), så ingen kan logga skämtvärden (typ "2000
// kg bänkpress") som sedan dyker upp i topplistan. Satt en bit under
// svenska rekordnivåer men över vad en amatör realistiskt lyfter - är man
// verkligen så stark får man höra av sig så läggs det in manuellt istället.
// Gäller bara de fem standardövningarna; egna tillagda övningar har inget
// tak (vi känner inte till rimliga värden för dem).
// Chins loggas som antal repetitioner, övriga standardövningar i kg.
const PB_EXERCISE_CAPS = {
  squat: 300,
  bench: 180,
  deadlift: 320,
  ohp: 150,
  pullup: 30,
};
const PB_CAP_CONTACT_EMAIL = "mattiasoman88@gmail.com";
const DEFAULT_PB_EXERCISES = [
  { id: "squat", label: "Knäböj", enabled: true, unit: "kg" },
  { id: "bench", label: "Bänkpress", enabled: true, unit: "kg" },
  { id: "deadlift", label: "Marklyft", enabled: true, unit: "kg" },
  { id: "ohp", label: "Militärpress", enabled: true, unit: "kg" },
  { id: "pullup", label: "Chins", enabled: true, unit: "reps" },
];
// Äldre sparad data (lokalt eller i molnet) har inget unit-fält - anta kg
// för allt utom Chins, som alltid ska räknas i antal repetitioner.
function migratePbExercisesList(list) {
  return list.map((p) => {
    if (p.id === "pullup") return { ...p, unit: "reps" };
    if (p.unit === "kg" || p.unit === "reps") return p;
    return { ...p, unit: "kg" };
  });
}
function loadPbExercises() {
  try {
    const raw = localStorage.getItem("pb_exercises_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return migratePbExercisesList(parsed);
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_PB_EXERCISES));
}
function savePbExercises() {
  try { localStorage.setItem("pb_exercises_v1", JSON.stringify(pbExercises)); } catch (e) { /* ignore */ }
}
function loadPbLog() {
  try {
    const raw = localStorage.getItem("pb_log_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  return [];
}
function persistPbLog() {
  try { localStorage.setItem("pb_log_v1", JSON.stringify(pbLog)); } catch (e) { /* ignore */ }
}
function loadShowPbCard() {
  try {
    const raw = localStorage.getItem("show_pb_card_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowPbCard() {
  try { localStorage.setItem("show_pb_card_v1", String(showPbCard)); } catch (e) { /* ignore */ }
}
let pbExercises = loadPbExercises();
let pbLog = loadPbLog();
let showPbCard = loadShowPbCard();

// Synlighet i topplistan: "hidden" (default, med helt utanför alla
// jämförelser), "anonymous" (räknas med och syns i listan, men utan namn),
// "visible" (räknas med och syns med profilnamnet). Sparas i en egen
// Supabase-tabell (inte i JSON-klumpen) eftersom serverfunktionerna som
// räknar ut rankningar behöver kunna läsa alla användares val.
function loadLeaderboardVisibility() {
  try {
    const raw = localStorage.getItem("leaderboard_visibility_v1");
    return raw === "anonymous" || raw === "visible" ? raw : "hidden";
  } catch (e) { return "hidden"; }
}
function saveLeaderboardVisibility() {
  try { localStorage.setItem("leaderboard_visibility_v1", leaderboardVisibility); } catch (e) { /* ignore */ }
}
let leaderboardVisibility = loadLeaderboardVisibility();
// Cache för hämtade rank-badges (nyckel -> {rank,total} eller null), så vi
// inte behöver fråga servern på nytt varje gång kortet ritas om.
let pbRankCache = {};

// Global upplåsningsstatistik för prestationer (som Steam/PSN-trofésprocent).
// achievementUnlockStatsCache: undefined = inte hämtad än, null = hämtning
// misslyckades, objekt = {achievement_id: antal användare som låst upp den}.
let achievementUnlockStatsCache;
let achievementUnlockStatsTotalUsers = 0;
let achievementUnlockStatsFetchPromise = null;

// Sökbarhet för Vänner-funktionen (opt-in, likt Topplistan). Styr om ens
// profilnamn dyker upp i andras sökningar - påverkar inte redan godkända
// vänskaper. Sparas i social_profile-tabellen (inte JSON-klumpen).
function loadSocialSearchable() {
  try { return localStorage.getItem("social_searchable_v1") === "true"; } catch (e) { return false; }
}
function saveSocialSearchable() {
  try { localStorage.setItem("social_searchable_v1", String(socialSearchable)); } catch (e) { /* ignore */ }
}
let socialSearchable = loadSocialSearchable();
let friendsSectionOpen = false;
let friendSearchQuery = "";
let friendSearchResults = [];
let friendSearchLoading = false;
let incomingFriendRequests = [];
let outgoingFriendRequests = [];
let friendList = [];
let friendsDataLoaded = false;
// Egna, privata grupperingar av vänner (t.ex. "BJJ") - bara synliga för en
// själv, inte delade med vännerna. Sparas i JSON-klumpen (app_state), inte
// social_profile, eftersom det inte är något andra ska kunna se.
function loadFriendGroups() {
  try { const raw = localStorage.getItem("friend_groups_v1"); const list = raw ? JSON.parse(raw) : []; return Array.isArray(list) ? list : []; } catch (e) { return []; }
}
function saveFriendGroups() {
  try { localStorage.setItem("friend_groups_v1", JSON.stringify(friendGroups)); } catch (e) { /* ignore */ }
}
let friendGroups = loadFriendGroups();
function loadFriendGroupOf() {
  try { const raw = localStorage.getItem("friend_group_of_v1"); const obj = raw ? JSON.parse(raw) : {}; return obj && typeof obj === "object" ? obj : {}; } catch (e) { return {}; }
}
function saveFriendGroupOf() {
  try { localStorage.setItem("friend_group_of_v1", JSON.stringify(friendGroupOf)); } catch (e) { /* ignore */ }
}
let friendGroupOf = loadFriendGroupOf();
// De rader (övningar/distanser) som senast ritades i Personbästa-kortet,
// sparade så loadPbRanks() vet vilka rader den ska hämta rank åt.
let lastPbRows = [];

function loadShowPbHistory() {
  try {
    const raw = localStorage.getItem("show_pb_history_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowPbHistory() {
  try { localStorage.setItem("show_pb_history_v1", String(showPbHistory)); } catch (e) { /* ignore */ }
}
let showPbHistory = loadShowPbHistory();
let pbSectionExpanded = true;
let evaluationSectionExpanded = true;
let submissionsSectionExpanded = true;
let pbFormOpenExerciseId = null;
function pbBestFor(exerciseId) {
  const vals = pbLog.filter((p) => p.exerciseId === exerciseId).map((p) => p.value);
  return vals.length ? Math.max(...vals) : null;
}
function pbBestEntryFor(exerciseId) {
  const entries = pbLog.filter((p) => p.exerciseId === exerciseId);
  if (!entries.length) return null;
  return entries.reduce((best, e) => (e.value > best.value ? e : best), entries[0]);
}

const DEFAULT_KONDITION_PB_DISTANCES = [
  { id: "5k", label: "5 km", enabled: true },
  { id: "10k", label: "10 km", enabled: true },
  { id: "halvmara", label: "Halvmaraton", enabled: true },
  { id: "maraton", label: "Maraton", enabled: true },
];
// Kortaste rimliga tid (minuter) per distans + träningstyp, så man inte kan
// mata in orimligt snabba (uppenbart felaktiga) tider. Satt en bit under
// elit-/världsrekordnivå. Gäller bara standarddistanserna ihop med de tre
// kondition-typer som finns som standard - egna tillagda distanser/typer
// har ingen spärr (precis som styrke-taken ovan bara gäller standardövningar).
const KONDITION_PB_MIN_MINUTES = {
  "5k": { Jogging: 12, Cykel: 4, Motionscykel: 6 },
  "10k": { Jogging: 26, Cykel: 8, Motionscykel: 12 },
  halvmara: { Jogging: 57, Cykel: 18, Motionscykel: 25 },
  maraton: { Jogging: 120, Cykel: 36, Motionscykel: 51 },
};
function loadKonditionPbDistances() {
  try {
    const raw = localStorage.getItem("kondition_pb_distances_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_KONDITION_PB_DISTANCES));
}
function saveKonditionPbDistances() {
  try { localStorage.setItem("kondition_pb_distances_v1", JSON.stringify(konditionPbDistances)); } catch (e) { /* ignore */ }
}
function loadKonditionPbLog() {
  try {
    const raw = localStorage.getItem("kondition_pb_log_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  return [];
}
function persistKonditionPbLog() {
  try { localStorage.setItem("kondition_pb_log_v1", JSON.stringify(konditionPbLog)); } catch (e) { /* ignore */ }
}
let konditionPbDistances = loadKonditionPbDistances();
let konditionPbLog = loadKonditionPbLog();
let konditionPbSectionExpanded = true;
let konditionPbFormOpenId = null;
function konditionPbBestFor(distanceId, type) {
  const vals = konditionPbLog.filter((p) => p.distanceId === distanceId && (!type || p.type === type)).map((p) => p.minutes);
  return vals.length ? Math.min(...vals) : null;
}
function konditionPbBestEntryFor(distanceId, type) {
  const entries = konditionPbLog.filter((p) => p.distanceId === distanceId && (!type || p.type === type));
  if (!entries.length) return null;
  return entries.reduce((best, e) => (e.minutes < best.minutes ? e : best), entries[0]);
}
function fmtMinSec(totalMinutes) {
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/* ---------------- Kroppsmått ---------------- */

const DEFAULT_BODY_MEASUREMENT_TYPES = [
  { id: "waist", label: "Midja", enabled: true },
  { id: "chest", label: "Bröst", enabled: true },
  { id: "arms", label: "Armar", enabled: true },
  { id: "thighs", label: "Lår", enabled: true },
  { id: "hips", label: "Höft", enabled: true },
];
function loadBodyMeasurementsEnabled() {
  try { const raw = localStorage.getItem("body_measurements_enabled_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveBodyMeasurementsEnabled() {
  try { localStorage.setItem("body_measurements_enabled_v1", String(bodyMeasurementsEnabled)); } catch (e) { /* ignore */ }
}
function loadBodyMeasurementTypes() {
  try {
    const raw = localStorage.getItem("body_measurement_types_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(DEFAULT_BODY_MEASUREMENT_TYPES));
}
function saveBodyMeasurementTypes() {
  try { localStorage.setItem("body_measurement_types_v1", JSON.stringify(bodyMeasurementTypes)); } catch (e) { /* ignore */ }
}
function loadBodyMeasurements() {
  try {
    const raw = localStorage.getItem("body_measurements_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  return [];
}
function persistBodyMeasurements() {
  try { localStorage.setItem("body_measurements_v1", JSON.stringify(bodyMeasurements)); } catch (e) { /* ignore */ }
}
let bodyMeasurementsEnabled = loadBodyMeasurementsEnabled();
let bodyMeasurementTypes = loadBodyMeasurementTypes();
let bodyMeasurements = loadBodyMeasurements();
let activeBodyMeasurementTab = (bodyMeasurementTypes.find((t) => t.enabled) || {}).id || null;
let bodyMeasurementsExpanded = true;
let gymSplits = loadGymSplits();

/* ---------------- Gympass — övningar och pågående pass ---------------- */

const DEFAULT_GYM_EXERCISES = {
  pass1: [
    { id: "ex_hantelpress", name: "Hantelpress", enabled: true },
    { id: "ex_cablecross", name: "Cable Cross Flyes", enabled: true },
    { id: "ex_flies", name: "Maskin-Flyes", enabled: true },
    { id: "ex_bakaxlar", name: "Baksida axlar", enabled: true },
    { id: "ex_hantellyft_sida", name: "Hantellyft åt sidan", enabled: true },
    { id: "ex_pushdown_stang", name: "Pushdowns Stång", enabled: true },
    { id: "ex_pushdown_rep", name: "Pushdowns Rep", enabled: true },
    { id: "ex_cablecross_sidolyft", name: "Cable Cross Sidolyft", enabled: true },
  ],
  pass2: [
    { id: "ex_roddmaskin", name: "Roddmaskin", enabled: true },
    { id: "ex_latsdrag_stang", name: "Latsdrag Stång", enabled: true },
    { id: "ex_latsdrag_v", name: "Latsdrag V-grepp", enabled: true },
    { id: "ex_rodd", name: "Rodd", enabled: true },
    { id: "ex_pullover_cc", name: "Cable Cross Pullover", enabled: true },
    { id: "ex_stangcurl", name: "Cable Cross Stångcurl", enabled: true },
    { id: "ex_bicepscurl_cc", name: "Cable Cross Bicepscurl", enabled: true },
    { id: "ex_hantelcurl", name: "Hantelcurl", enabled: true },
    { id: "ex_hammercurl", name: "Hammercurl", enabled: true },
  ],
  pass3: [
    { id: "ex_knaboj", name: "Knäböj", enabled: true },
    { id: "ex_benbojmaskin", name: "Benböj maskin", enabled: true },
    { id: "ex_benspark", name: "Benspark", enabled: true },
    { id: "ex_bencurl", name: "Bencurl", enabled: true },
    { id: "ex_vadpress", name: "Vadpress", enabled: true },
  ],
};
function normalizeGymExercise(ex) {
  return { defaultSets: 3, defaultReps: 12, ...ex };
}
function loadGymExercises() {
  let data;
  try {
    const raw = localStorage.getItem("gym_exercises_v1");
    if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") data = parsed; }
  } catch (e) { /* fall through */ }
  if (!data) data = JSON.parse(JSON.stringify(DEFAULT_GYM_EXERCISES));
  Object.keys(data).forEach((splitId) => { data[splitId] = data[splitId].map(normalizeGymExercise); });
  return data;
}
function saveGymExercises() {
  try { localStorage.setItem("gym_exercises_v1", JSON.stringify(gymExercises)); } catch (e) { /* ignore */ }
}
let gymExercises = loadGymExercises();
const GYM_TEMPLATES = {
  helkropp: {
    label: "Helkropp A/B",
    splits: [
      { text: "Helkropp A", exercises: ["Knäböj eller Benböj i maskin", "Bänkpress eller Hantelpress", "Kabelrodd", "Axelpress", "Bicepscurl"] },
      { text: "Helkropp B", exercises: ["Marklyft", "Latsdrag brett", "Cable Lateral raises", "Benspark eller Bencurl", "Cable Pushdowns"] },
    ],
  },
  ppl: {
    label: "Push/Pull/Legs (PPL)",
    splits: [
      { text: "Push", exercises: ["Bänkpress eller Hantelpress", "Cable Flies", "Cable Lateral raises", "Cable Pushdowns"] },
      { text: "Pull", exercises: ["Marklyft", "Latsdrag brett", "Latsdrag tätt", "Kabelrodd", "Bicepscurl"] },
      { text: "Legs", exercises: ["Knäböj eller Benböj i maskin", "Benspark", "Bencurl", "Vadpress"] },
    ],
  },
  halvkropp: {
    label: "Halvkropp (Överkropp/Underkropp)",
    splits: [
      { text: "Överkropp", exercises: ["Bänkpress eller Hantelpress", "Kabelrodd", "Axelpress", "Latsdrag brett", "Bicepscurl", "Cable Pushdowns"] },
      { text: "Underkropp", exercises: ["Knäböj eller Benböj i maskin", "Marklyft", "Benspark", "Bencurl", "Vadpress"] },
    ],
  },
};
function addGymTemplateSplits(templateKey) {
  const template = GYM_TEMPLATES[templateKey];
  if (!template) return [];
  const existingIds = gymSplits.filter((g) => g.id.startsWith("tpl_" + templateKey + "_")).map((g) => g.id);
  if (existingIds.length) return existingIds;
  const addedIds = [];
  template.splits.forEach((split) => {
    const id = "tpl_" + templateKey + "_" + uid();
    gymSplits.push({ id, text: split.text, enabled: true });
    gymExercises[id] = split.exercises.map((name) => normalizeGymExercise({ id: "ex_" + uid(), name, enabled: true }));
    addedIds.push(id);
  });
  saveGymSplits();
  saveGymExercises();
  return addedIds;
}
// En personlig "standard" som användaren själv sparar - ett ögonblicks-
// snapshot av gymSplits+gymExercises man kan återställa till senare, t.ex.
// efter att ha testat en mall (Halvkropp/Helkropp/PPL) eller råkat ändra
// något. Skiljer sig från DEFAULT_GYM_EXERCISES (fabriksdefault) genom att
// det är användarens EGNA pass, inte apparens.
function loadGymSplitsDefault() {
  try { const raw = localStorage.getItem("gym_splits_default_v1"); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveGymSplitsDefaultToStorage() {
  try {
    if (gymSplitsDefault) localStorage.setItem("gym_splits_default_v1", JSON.stringify(gymSplitsDefault));
    else localStorage.removeItem("gym_splits_default_v1");
  } catch (e) { /* ignore */ }
}
let gymSplitsDefault = loadGymSplitsDefault();
function saveCurrentGymSplitsAsDefault() {
  gymSplitsDefault = {
    splits: JSON.parse(JSON.stringify(gymSplits)),
    exercises: JSON.parse(JSON.stringify(gymExercises)),
  };
  saveGymSplitsDefaultToStorage();
  scheduleCloudPush();
}
function restoreGymSplitsDefault() {
  if (!gymSplitsDefault) return;
  gymSplits = JSON.parse(JSON.stringify(gymSplitsDefault.splits));
  gymExercises = JSON.parse(JSON.stringify(gymSplitsDefault.exercises));
  saveGymSplits();
  saveGymExercises();
  scheduleCloudPush();
}
// Engångsfix: användaren råkade av misstag ta bort sina tre ursprungliga
// gympass (Bröst/Triceps/Axlar, Rygg/Biceps, Ben - samma som
// DEFAULT_GYM_SPLITS/DEFAULT_GYM_EXERCISES, som från början byggdes just
// utifrån dessa). Lägger tillbaka de som saknas (rör inte ev. andra pass
// som redan finns), och sparar dem som "standard" om ingen standard redan
// är sparad, så Återställ-knappen hittar dem igen framöver. Körs bara en
// gång (flaggan nedan) - vill man ta bort dem igen senare får man göra det
// manuellt utan att den här funktionen lägger tillbaka dem på nytt.
function restoreOriginalGymSplitsOnce() {
  try {
    if (localStorage.getItem("gym_splits_original_restored_v1") === "true") return;
    localStorage.setItem("gym_splits_original_restored_v1", "true");
    const existingIds = new Set(gymSplits.map((g) => g.id));
    let changed = false;
    DEFAULT_GYM_SPLITS.forEach((split) => {
      if (!existingIds.has(split.id)) {
        gymSplits.push({ ...split });
        gymExercises[split.id] = (DEFAULT_GYM_EXERCISES[split.id] || []).map((ex) => normalizeGymExercise({ ...ex }));
        changed = true;
      }
    });
    if (changed) {
      saveGymSplits();
      saveGymExercises();
    }
    if (!gymSplitsDefault) {
      gymSplitsDefault = {
        splits: JSON.parse(JSON.stringify(DEFAULT_GYM_SPLITS)),
        exercises: JSON.parse(JSON.stringify(DEFAULT_GYM_EXERCISES)),
      };
      saveGymSplitsDefaultToStorage();
    }
  } catch (e) { /* ignore */ }
}
restoreOriginalGymSplitsOnce();
// Engångsfix: namnbyten/tillägg i Bröst/Triceps/Axlar, Rygg/Biceps och Ben
// enligt önskemål (döpte om ett par Cable Cross-övningar, lade till Cable
// Cross Sidolyft samt Knäböj överst i Ben). Matchar bara övningar med de
// gamla exakta namnen - rör inget om användaren redan bytt namn på dem
// själv till något annat. Uppdaterar även en ev. redan sparad "standard"
// (gymSplitsDefault) så Återställ-knappen ger samma, uppdaterade namn.
function applyGymExerciseNameEditsOnce() {
  try {
    if (localStorage.getItem("gym_exercise_edits_2026_08_v1") === "true") return;
    localStorage.setItem("gym_exercise_edits_2026_08_v1", "true");
    const renameIn = (exObj, splitId, oldName, newName) => {
      const list = exObj && exObj[splitId];
      if (!list) return;
      const ex = list.find((e) => e.name === oldName);
      if (ex) ex.name = newName;
    };
    const addIfMissing = (exObj, splitId, name, atStart) => {
      if (!exObj) return;
      if (!exObj[splitId]) exObj[splitId] = [];
      if (exObj[splitId].some((e) => e.name === name)) return;
      const ex = normalizeGymExercise({ id: "ex_" + uid(), name, enabled: true });
      if (atStart) exObj[splitId].unshift(ex); else exObj[splitId].push(ex);
    };
    [gymExercises, gymSplitsDefault && gymSplitsDefault.exercises].forEach((exObj) => {
      if (!exObj) return;
      renameIn(exObj, "pass1", "Cable Cross", "Cable Cross Flyes");
      renameIn(exObj, "pass1", "Flies", "Maskin-Flyes");
      addIfMissing(exObj, "pass1", "Cable Cross Sidolyft", false);
      renameIn(exObj, "pass2", "Latsdrag V", "Latsdrag V-grepp");
      renameIn(exObj, "pass2", "Pullover CC", "Cable Cross Pullover");
      renameIn(exObj, "pass2", "Stångcurl", "Cable Cross Stångcurl");
      renameIn(exObj, "pass2", "Bicepscurl CC", "Cable Cross Bicepscurl");
      addIfMissing(exObj, "pass3", "Knäböj", true);
    });
    saveGymExercises();
    if (gymSplitsDefault) saveGymSplitsDefaultToStorage();
  } catch (e) { /* ignore */ }
}
applyGymExerciseNameEditsOnce();
function nextGymSplitHint() {
  const enabledSplits = gymSplits.filter((g) => g.enabled);
  if (enabledSplits.length < 2) return null;
  const lastEntry = [...workoutEntries]
    .filter((e) => e.type === "Gym" && e.gymSplit)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!lastEntry) return null;
  const lastIdx = enabledSplits.findIndex((g) => g.id === lastEntry.gymSplit);
  if (lastIdx === -1) return null;
  const nextSplit = enabledSplits[(lastIdx + 1) % enabledSplits.length];
  return { lastText: enabledSplits[lastIdx].text, nextText: nextSplit.text };
}
function exercisesForSplit(splitId) {
  return gymExercises[splitId] || [];
}

function loadActiveGymSession() {
  try {
    const raw = localStorage.getItem("active_gym_session_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  return null;
}
function saveActiveGymSession() {
  try {
    if (activeGymSession) localStorage.setItem("active_gym_session_v1", JSON.stringify(activeGymSession));
    else localStorage.removeItem("active_gym_session_v1");
  } catch (e) { /* ignore */ }
}
let activeGymSession = loadActiveGymSession();
let gymSessionViewOpen = false;

function loadGymSessionHistory() {
  try {
    const raw = localStorage.getItem("gym_session_history_v1");
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveGymSessionHistory() {
  try { localStorage.setItem("gym_session_history_v1", JSON.stringify(gymSessionHistory)); } catch (e) { /* ignore */ }
}
let gymSessionHistory = loadGymSessionHistory();

function lastSessionForSplit(splitId) {
  for (let i = gymSessionHistory.length - 1; i >= 0; i--) {
    if (gymSessionHistory[i].splitId === splitId) return gymSessionHistory[i];
  }
  return null;
}
function bestSetForExercise(exerciseName) {
  let best = null;
  gymSessionHistory.forEach((session) => {
    const ex = session.exercises.find((e) => e.name === exerciseName);
    if (!ex) return;
    ex.sets.forEach((s) => {
      if (s && s.weight != null && (!best || s.weight > best.weight)) best = { weight: s.weight, reps: s.reps };
    });
  });
  return best;
}

function startGymSession(splitId) {
  const exercises = exercisesForSplit(splitId).filter((e) => e.enabled).map((e) => {
    const setCount = e.defaultSets || 3;
    const reps = e.defaultReps != null ? e.defaultReps : 12;
    return {
      exerciseId: e.id,
      name: e.name,
      sets: Array.from({ length: setCount }, () => ({ weight: null, reps })),
    };
  });
  activeGymSession = {
    id: uid(),
    splitId,
    date: todayISO(),
    startedAt: new Date().toISOString(),
    exercises,
  };
  saveActiveGymSession();
  gymSessionViewOpen = true;
}

function finishGymSession(minutes) {
  if (!activeGymSession) return;
  const splitLabel = (gymSplits.find((g) => g.id === activeGymSession.splitId) || {}).text || "";
  const totalVolume = activeGymSession.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + (set.weight != null && set.reps != null ? set.weight * set.reps : 0), 0), 0);
  const summaryLines = activeGymSession.exercises.map((ex) => {
    const sets = ex.sets.map((s) => (s.weight != null ? `${s.weight}kg×${s.reps != null ? s.reps : "?"}` : "–")).join(", ");
    return `${ex.name}: ${sets}`;
  });
  if (totalVolume > 0) summaryLines.push(`Totalvikt lyft: ${Math.round(totalVolume).toLocaleString("sv-SE")} kg`);
  workoutEntries.unshift({
    id: uid(),
    date: activeGymSession.date,
    type: "Gym",
    minutes,
    gymSplit: activeGymSession.splitId,
    note: summaryLines.join("\n"),
  });
  persistWorkouts();
  gymSessionHistory.push({
    id: activeGymSession.id,
    splitId: activeGymSession.splitId,
    date: activeGymSession.date,
    totalVolume,
    exercises: activeGymSession.exercises.map((ex) => ({ name: ex.name, sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })) })),
  });
  saveGymSessionHistory();
  activeGymSession = null;
  saveActiveGymSession();
  gymSessionViewOpen = false;
  vibrate();
  checkAchievements();
  checkWeeklyChallenges();
  awardLogXpForDate("training", workoutEntries[0].date);
  markWeeklyMiscFlag("workoutEditedWeek");
  return totalVolume;
}

// Avbryter ett pausat/pågående gympass helt utan att logga det - används från
// bekräftelsemodalen nedan, inte från "Avsluta pass"-flödet (som alltid loggar).
function discardActiveGymSession() {
  activeGymSession = null;
  saveActiveGymSession();
  gymSessionViewOpen = false;
}
function openCancelGymSessionModal() {
  pushModalHistoryIfNeeded();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="cancelGymSessionOverlay">
      <div class="modal-sheet">
        <h2 style="text-align:center">Avbryta pågående pass?</h2>
        <p style="text-align:center">Är du säker på att du vill avbryta pågående pass utan att det loggas?</p>
        <div class="row">
          <button class="modal-btn secondary" id="cancelGymSessionBackBtn" style="flex:1">Nej, fortsätt</button>
          <button class="modal-btn primary" id="cancelGymSessionConfirmBtn" style="flex:1">Ja, avbryt</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("cancelGymSessionBackBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; handleModalClosedByUser(); });
  document.getElementById("cancelGymSessionOverlay").addEventListener("click", (e) => {
    if (e.target.id === "cancelGymSessionOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
  document.getElementById("cancelGymSessionConfirmBtn").addEventListener("click", () => {
    discardActiveGymSession();
    modalRoot.innerHTML = "";
    handleModalClosedByUser();
    if (activeTab === "traning") renderTraning();
  });
}

/* ---------------- Nav ---------------- */

const EMBLEM_ICON_VIKT = "badges/EMBLEM_ICON_VIKT.png";
const EMBLEM_ICON_TRANING = "badges/EMBLEM_ICON_TRANING.png";
const EMBLEM_ICON_KALORIER = "badges/EMBLEM_ICON_KALORIER.png";
const EMBLEM_ICON_STATS = "badges/EMBLEM_ICON_STATS.png";
const APP_ICON_IMG = "badges/APP_ICON_IMG.png";
const CELEBRATION_IMG_LEVELUP = "badges/CELEBRATION_IMG_LEVELUP.png";
const CELEBRATION_IMG_MONTHRECAP = "badges/CELEBRATION_IMG_MONTHRECAP.png";
const CELEBRATION_IMG_WEEKLYBONUS = "badges/CELEBRATION_IMG_WEEKLYBONUS.png";
const CELEBRATION_IMG_WEEKLYCHALLENGE = "badges/CELEBRATION_IMG_WEEKLYCHALLENGE.png";
// EMBLEM_ICON_TRANING_RUN_GREEN behålls som fallback-ikon (används när
// levelTheme är "run" och man inte valt en egen ikon, se längre ner) även om
// den inte längre är ett eget val i väljaren.
const EMBLEM_ICON_TRANING_RUN_GREEN = "badges/EMBLEM_ICON_TRANING_RUN_GREEN.png";
// Ny bildomgång (augusti), ersätter alla tidigare extra-ikoner - namngivna
// efter numret användaren gav dem så länge, byts till beskrivande namn när
// det är bestämt vilka som ska vara kvar permanent.
const EMBLEM_ICON_TRANING_02 = "badges/EMBLEM_ICON_TRANING_02.png";
const EMBLEM_ICON_TRANING_03 = "badges/EMBLEM_ICON_TRANING_03.png";
const EMBLEM_ICON_TRANING_04 = "badges/EMBLEM_ICON_TRANING_04.png";
const EMBLEM_ICON_TRANING_05 = "badges/EMBLEM_ICON_TRANING_05.png";
const EMBLEM_ICON_TRANING_06 = "badges/EMBLEM_ICON_TRANING_06.png";
const EMBLEM_ICON_TRANING_07 = "badges/EMBLEM_ICON_TRANING_07.png";
const EMBLEM_ICON_TRANING_08 = "badges/EMBLEM_ICON_TRANING_08.png";
const EMBLEM_ICON_TRANING_09 = "badges/EMBLEM_ICON_TRANING_09.png";
const EMBLEM_ICON_TRANING_10 = "badges/EMBLEM_ICON_TRANING_10.png";
const EMBLEM_ICON_TRANING_11 = "badges/EMBLEM_ICON_TRANING_11.png";
const EMBLEM_ICON_TRANING_12 = "badges/EMBLEM_ICON_TRANING_12.png";
// Val av Träningsflikens ikon, fristående från levelTheme. null = auto
// (samma beteende som tidigare: grön löparikon om temat är "run", annars
// grön hantel). Bara de 12 bilderna som ska finnas kvar: standard-hanteln +
// de 11 nya.
const TRAINING_TAB_ICON_CHOICES = {
  gym: EMBLEM_ICON_TRANING,
  training2: EMBLEM_ICON_TRANING_02,
  training3: EMBLEM_ICON_TRANING_03,
  training4: EMBLEM_ICON_TRANING_04,
  training5: EMBLEM_ICON_TRANING_05,
  training6: EMBLEM_ICON_TRANING_06,
  training7: EMBLEM_ICON_TRANING_07,
  training8: EMBLEM_ICON_TRANING_08,
  training9: EMBLEM_ICON_TRANING_09,
  training10: EMBLEM_ICON_TRANING_10,
  training11: EMBLEM_ICON_TRANING_11,
  training12: EMBLEM_ICON_TRANING_12,
};
// gym (grön hantel) är alltid upplåst - det är grund-ikonen. Resten låses
// upp var 5:e nivå från och med level 5, i samma takt som
// profilram/flikfärg-effekterna.
const TRAINING_TAB_ICON_UNLOCK_LEVEL = {
  gym: 1,
  training2: 5,
  training3: 10,
  training4: 15,
  training5: 20,
  training6: 25,
  training7: 30,
  training8: 35,
  training9: 40,
  training10: 45,
  training11: 50,
  training12: 55,
};
function loadTrainingTabIcon() {
  try {
    const v = localStorage.getItem("training_tab_icon_v1") || null;
    // Migrering: nyckeln "run" byttes till "runBlue" när grön/blå löpare
    // blev separata val.
    return v === "run" ? "runBlue" : v;
  } catch (e) { return null; }
}
function saveTrainingTabIcon() {
  try {
    if (trainingTabIcon) localStorage.setItem("training_tab_icon_v1", trainingTabIcon);
    else localStorage.removeItem("training_tab_icon_v1");
  } catch (e) { /* ignore */ }
}
let trainingTabIcon = loadTrainingTabIcon(); // null | "gym" | "gymOrange" | "runBlue" | "runGreen" | "man" | "weight" | "womanman" | "mma" | "sw" | "bjj"
const TAB_DEFS = {
  vikt: { label: "Vikt", icon: "scale", emblemImage: EMBLEM_ICON_VIKT, imgSizeSmall: 19, imgSizeMedium: 27, imgSizeLarge: 42 },
  traning: { label: "Träning", icon: "dumbbell", emblemImage: EMBLEM_ICON_TRANING, imgSizeSmall: 15, imgSizeMedium: 22, imgSizeLarge: 34 },
  kalorier: { label: "Kalorier", icon: "flame", emblemImage: EMBLEM_ICON_KALORIER, imgSizeSmall: 19, imgSizeMedium: 27, imgSizeLarge: 42 },
  stats: { label: "Statistik", icon: "chart", emblemImage: EMBLEM_ICON_STATS, imgSizeSmall: 18, imgSizeMedium: 25, imgSizeLarge: 39 },
};
const DEFAULT_TAB_ORDER = ["vikt", "traning", "kalorier", "stats"];

function loadTabOrder() {
  try {
    const raw = localStorage.getItem("tab_order_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_TAB_ORDER.length &&
          DEFAULT_TAB_ORDER.every((k) => parsed.includes(k))) {
        return parsed;
      }
    }
  } catch (e) { /* fall through */ }
  return [...DEFAULT_TAB_ORDER];
}
function saveTabOrder() {
  try { localStorage.setItem("tab_order_v1", JSON.stringify(tabOrder)); } catch (e) { /* ignore */ }
}
let tabOrder = loadTabOrder();
function rebuildTabs() {
  TABS = tabOrder.map((key) => ({ key, ...TAB_DEFS[key] }));
}
let TABS = [];
rebuildTabs();

// Delad av renderNav() och renderTabOrderList() så Träningsflikens ikon
// visas konsekvent överallt: manuellt val om satt, annars auto (grön
// löpare vid tema Löpare, annars grön hantel) - precis som ursprungsläget.
function resolveTabEmblem(t) {
  if (t.key !== "traning") return t.emblemImage;
  return TRAINING_TAB_ICON_CHOICES[trainingTabIcon] || (levelTheme === "run" ? EMBLEM_ICON_TRANING_RUN_GREEN : EMBLEM_ICON_TRANING);
}

function renderNav() {
  const isLarge = navIconSize === "large";
  const isTiny = navIconSize === "tiny";
  const badgeSize = isTiny ? 16 : isLarge ? 34 : 22;
  tabbar.className = "tabbar" + (isLarge ? " icon-size-large" : isTiny ? " icon-size-tiny" : "");
  tabbar.innerHTML = TABS.map((t) => {
    const isActive = activeTab === t.key;
    const color = navGlowColors[t.key];
    const isEffect = FRAME_EFFECT_KEYS.includes(color);
    const emblemSrc = resolveTabEmblem(t);
    const outerSize = badgeSize + 6;
    const innerSize = outerSize - 2;
    let iconHTML;
    if (isActive && isEffect) {
      const frame = profileFrameWrapStyle(color, 1);
      const cycleAttrs = color === "allaMinaRamar" ? ` data-cycle-all="1" data-cycle-padding="1" data-cycle-shape="circle"` : "";
      iconHTML = `<div class="${frame.className}" style="width:${outerSize}px;height:${outerSize}px;${frame.style}"${cycleAttrs}><img src="${emblemSrc}" alt="${t.label}" style="width:${innerSize}px;height:${innerSize}px;object-fit:contain;display:block" /></div>`;
    } else {
      iconHTML = `<img src="${emblemSrc}" alt="${t.label}" style="width:${outerSize}px;height:${outerSize}px;object-fit:contain;display:block;flex-shrink:0;${isActive ? `filter:drop-shadow(0 0 4px ${color});` : "opacity:0.65;"}" />`;
    }
    const textColor = isEffect ? frameAccentColor(color) : color;
    return `
      <button data-tab="${t.key}" class="${isActive ? "active" : ""}" style="${isActive ? `color:${textColor}` : ""}">
        ${iconHTML}
        ${showNavLabels ? `<span>${t.label}</span>` : ""}
      </button>
    `;
  }).join("");
  tabbar.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(key) {
  if (key === activeTab) return;
  navigateTabHistory(key);
  if (activeTab === "stats") {
    achievementsExpanded = false;
    hideUnlockedAchievements = false;
  }
  activeTab = key;
  content.style.transition = "opacity .12s ease";
  content.style.opacity = "0";
  setTimeout(() => {
    try {
      render();
    } finally {
      requestAnimationFrame(() => { content.style.opacity = "1"; });
    }
  }, 90);
}

function render() {
  renderNav();
  try {
    if (activeTab === "vikt") renderVikt();
    else if (activeTab === "traning") renderTraning();
    else if (activeTab === "stats") renderStats();
    else if (activeTab === "kalorier") renderKalorier();
  } catch (err) {
    console.error("Renderingsfel i fliken", activeTab, err);
    content.innerHTML = `<div class="card"><div class="empty">Något gick fel när fliken skulle visas. Stäng appen helt och öppna den igen. (${err.message || err})</div></div>`;
  }
}

/* ---------------- Swipe between tabs ---------------- */

let swipeStartX = 0;
let swipeStartY = 0;
let swiping = false;

content.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  swipeStartX = t.clientX;
  swipeStartY = t.clientY;
  swiping = true;
}, { passive: true });

content.addEventListener("touchend", (e) => {
  if (!swiping) return;
  swiping = false;
  const t = e.changedTouches[0];
  const dx = t.clientX - swipeStartX;
  const dy = t.clientY - swipeStartY;
  const horizontalEnough = Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4;
  if (!horizontalEnough) return;
  const idx = TABS.findIndex((tb) => tb.key === activeTab);
  if (dx < 0 && idx < TABS.length - 1) switchTab(TABS[idx + 1].key);
  else if (dx > 0 && idx > 0) switchTab(TABS[idx - 1].key);
}, { passive: true });

/* ---------------- VIKT TAB ---------------- */

const WEIGHT_PERIOD_OPTIONS = [
  { key: "30d", label: "30 dagar", days: 30 },
  { key: "3m", label: "3 månader", days: 90 },
  { key: "6m", label: "6 månader", days: 182 },
  { key: "9m", label: "9 månader", days: 274 },
  { key: "12m", label: "12 månader", days: 365 },
  { key: "all", label: "Allt", days: null },
];
function loadWeightChartPeriod() {
  try { return localStorage.getItem("weight_chart_period_v1") || "3m"; } catch (e) { return "3m"; }
}
function saveWeightChartPeriod() {
  try { localStorage.setItem("weight_chart_period_v1", weightChartPeriod); } catch (e) { /* ignore */ }
}
let weightChartPeriod = loadWeightChartPeriod();

function bodyMeasurementsCardHTML() {
  if (!bodyMeasurementsEnabled) return "";
  const enabledTypes = bodyMeasurementTypes.filter((t) => t.enabled);
  if (!enabledTypes.length) return "";
  if (!activeBodyMeasurementTab || !enabledTypes.some((t) => t.id === activeBodyMeasurementTab)) {
    activeBodyMeasurementTab = enabledTypes[0].id;
  }
  const activeType = enabledTypes.find((t) => t.id === activeBodyMeasurementTab);
  const activeEntries = bodyMeasurements.filter((m) => m.typeId === activeBodyMeasurementTab).sort((a, b) => a.date.localeCompare(b.date));
  const allSorted = [...bodyMeasurements].sort((a, b) => b.date.localeCompare(a.date));
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="bmSectionToggle">
        <div class="card-label" style="margin-bottom:0">Kroppsmått</div>
        <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${bodyMeasurementsExpanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
      </div>
      ${bodyMeasurementsExpanded ? `
      <div class="row" style="flex-wrap:wrap;gap:8px;margin:10px 0">
        ${enabledTypes.map((t) => `<button class="chip" data-bm-type="${t.id}" style="${t.id === activeBodyMeasurementTab ? `border-color:${tabColors.vikt};background:${tabColors.vikt}26;color:${tabColors.vikt}` : ""}">${escapeHtml(t.label)}</button>`).join("")}
      </div>
      <div class="row">
        <input type="date" id="bmDate" value="${todayISO()}" />
        <input type="number" inputmode="decimal" step="0.1" placeholder="cm" id="bmValue" enterkeyhint="go" style="max-width:90px" />
        <button class="btn-primary" id="bmSubmit" style="background:${tabColors.vikt}">${ICONS.plus}</button>
      </div>
      ${activeEntries.length > 1 ? `
        <div class="chart-wrap" style="margin-top:14px"><canvas id="bmChart"></canvas></div>
      ` : activeEntries.length === 1 ? `
        <p style="margin-top:10px">Logga ${activeType.label.toLowerCase()} en gång till för att se en graf.</p>
      ` : `
        <p style="margin-top:10px">Inga mätningar av ${activeType.label.toLowerCase()} än.</p>
      `}
      ` : ""}
    </div>

    <div class="card">
      ${cardChevronHeaderHTML("showBodyMeasurementHistoryToggle", "Kroppsmått — historik", showBodyMeasurementHistory, showBodyMeasurementHistory ? "10px" : null)}
      ${showBodyMeasurementHistory ? `
        <div class="history-scroll">
          ${allSorted.length === 0 ? `<div class="empty">Inga mätningar än</div>` : ""}
          ${allSorted.map((m) => {
            const typeLabel = (bodyMeasurementTypes.find((t) => t.id === m.typeId) || {}).label || "?";
            return `
            <div class="list-row">
              <span style="font-size:13px;color:var(--muted);flex:1">${fmtDateWithWeekday(m.date)}</span>
              <span style="font-size:13px;color:var(--muted);min-width:70px">${escapeHtml(typeLabel)}</span>
              <span style="font-size:14px;font-weight:600">${m.value} cm</span>
              <button class="delete-btn" data-del-bm="${m.id}">${ICONS.trash}</button>
            </div>
          `;
          }).join("")}
        </div>
      ` : ""}
    </div>
  `;
}
function renderBodyMeasurementsCard() {
  const wrap = document.getElementById("bodyMeasurementsCardWrap");
  if (!wrap) return;
  wrap.innerHTML = bodyMeasurementsCardHTML();
  wireBodyMeasurementsCardEvents();
}
let bodyMeasurementChartInstance = null;
function wireBodyMeasurementsCardEvents() {
  if (!bodyMeasurementsEnabled) return;
  const bmToggle = document.getElementById("bmSectionToggle");
  if (bmToggle) {
    bmToggle.addEventListener("click", () => {
      bodyMeasurementsExpanded = !bodyMeasurementsExpanded;
      renderBodyMeasurementsCard();
    });
  }
  document.querySelectorAll("[data-bm-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeBodyMeasurementTab = btn.dataset.bmType;
      renderBodyMeasurementsCard();
    });
  });
  const submitBtn = document.getElementById("bmSubmit");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const date = document.getElementById("bmDate").value;
      const raw = document.getElementById("bmValue").value;
      const num = parseFloat(String(raw).replace(",", "."));
      if (!date || isNaN(num) || num <= 0) return;
      bodyMeasurements = bodyMeasurements.filter((m) => !(m.date === date && m.typeId === activeBodyMeasurementTab));
      bodyMeasurements.push({ id: uid(), date, typeId: activeBodyMeasurementTab, value: num });
      persistBodyMeasurements();
      vibrate();
      document.getElementById("bmValue").value = "";
      renderBodyMeasurementsCard();
    });
    const bmValueInput = document.getElementById("bmValue");
    if (bmValueInput) {
      bmValueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submitBtn.click(); }
      });
    }
  }
  const historyToggle = document.getElementById("showBodyMeasurementHistoryToggle");
  if (historyToggle) {
    historyToggle.addEventListener("click", () => {
      showBodyMeasurementHistory = !showBodyMeasurementHistory;
      saveShowBodyMeasurementHistory();
      renderBodyMeasurementsCard();
    });
  }
  document.querySelectorAll("[data-del-bm]").forEach((btn) => {
    btn.addEventListener("click", () => {
      bodyMeasurements = bodyMeasurements.filter((m) => m.id !== btn.dataset.delBm);
      persistBodyMeasurements();
      renderBodyMeasurementsCard();
    });
  });
  const chartCanvas = document.getElementById("bmChart");
  if (chartCanvas) {
    const activeEntries = bodyMeasurements.filter((m) => m.typeId === activeBodyMeasurementTab).sort((a, b) => a.date.localeCompare(b.date));
    if (bodyMeasurementChartInstance) bodyMeasurementChartInstance.destroy();
    bodyMeasurementChartInstance = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: activeEntries.map((m) => fmtDateShort(m.date)),
        datasets: [{
          data: activeEntries.map((m) => m.value),
          borderColor: tabColors.vikt,
          backgroundColor: `${tabColors.vikt}26`,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        ...chartBaseOptions(),
        plugins: { ...chartBaseOptions().plugins, legend: { display: false } },
      },
    });
  }
}

function weightHistoryCardHTML() {
  const cutoff = periodCutoffISO(weightHistoryPeriod);
  const filtered = cutoff ? weightEntries.filter((e) => e.date >= cutoff) : weightEntries;
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showWeightHistoryToggle", "Historik", showWeightHistory, showWeightHistory ? "10px" : null)}
      ${showWeightHistory ? `
        <div class="filter-row">
          <select class="filter-select" id="weightHistoryPeriodSelect" style="flex:1">
            ${periodSelectOptionsHTML(weightHistoryPeriod)}
          </select>
        </div>
        <div class="history-scroll">
          ${filtered.length === 0 ? `<div class="empty">${weightEntries.length === 0 ? "Inga inlägg än" : "Inga inlägg i vald period"}</div>` : ""}
          ${[...filtered].reverse().map((e) => `
            <div class="list-row">
              <span style="font-size:13px;color:var(--muted);flex:1">${fmtDateWithWeekday(e.date)}</span>
              <span style="font-size:14px;font-weight:600">${e.value} kg</span>
              <button class="delete-btn" data-edit-weight="${e.id}">${ICONS.pencil}</button>
              <button class="delete-btn" data-del-weight="${e.id}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}
function renderWeightHistoryCard() {
  const wrap = document.getElementById("weightHistoryCardWrap");
  if (!wrap) return;
  wrap.innerHTML = weightHistoryCardHTML();
  wireWeightHistoryCardEvents();
}
function wireWeightHistoryCardEvents() {
  const toggle = document.getElementById("showWeightHistoryToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showWeightHistory = !showWeightHistory;
      saveShowWeightHistory();
      renderWeightHistoryCard();
    });
  }
  const periodSelect = document.getElementById("weightHistoryPeriodSelect");
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      weightHistoryPeriod = e.target.value;
      renderWeightHistoryCard();
    });
  }
  content.querySelectorAll("[data-edit-weight]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = weightEntries.find((e) => e.id === btn.dataset.editWeight);
      if (!entry) return;
      document.getElementById("weightDate").value = entry.date;
      document.getElementById("weightValue").value = entry.value;
      document.getElementById("weightValue").focus();
    });
  });
  content.querySelectorAll("[data-del-weight]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const removed = weightEntries.find((e) => e.id === btn.dataset.delWeight);
      weightEntries = weightEntries.filter((e) => e.id !== btn.dataset.delWeight);
      persistWeights();
      vibrate(10);
      renderVikt();
      if (removed) {
        showUndoToast(`${removed.value} kg borttagen`, () => {
          weightEntries.push(removed);
          weightEntries.sort((a, b) => a.date.localeCompare(b.date));
          persistWeights();
          if (activeTab === "vikt") renderVikt();
        });
      }
    });
  });
}

function renderVikt() {
  const todayEntry = weightEntries.find((e) => e.date === todayISO());
  const latest = weightEntries[weightEntries.length - 1];
  const prev = weightEntries[weightEntries.length - 2];
  const diff = latest && prev ? +(latest.value - prev.value).toFixed(1) : null;

  const periodDef = WEIGHT_PERIOD_OPTIONS.find((p) => p.key === weightChartPeriod) || WEIGHT_PERIOD_OPTIONS[1];
  let periodEntries;
  if (periodDef.days === null) {
    periodEntries = weightEntries;
  } else {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDef.days);
    const cutoffISO = toLocalISO(cutoff);
    periodEntries = weightEntries.filter((e) => e.date >= cutoffISO);
  }


  content.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="card-label" style="margin-bottom:0">${todayEntry ? "Uppdatera dagens vikt" : "Logga dagens vikt"}</div>
        <button id="manageWeightBtn" style="background:none;border:none;color:${tabColors.vikt};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px">Hantera</button>
      </div>
      <div class="row">
        <input type="date" id="weightDate" value="${todayISO()}" />
        <input type="number" inputmode="decimal" step="0.1" placeholder="kg" id="weightValue" enterkeyhint="go" style="max-width:90px" />
        <button class="btn-primary" id="weightSubmit" style="background:${tabColors.vikt}">${ICONS.plus}</button>
      </div>
    </div>

    ${latest ? `
    <div class="card weight-hero">
      <div>
        <div class="value" style="color:${tabColors.vikt}">${latest.value} kg</div>
        <div class="sub">Senast loggad ${fmtDateShort(latest.date)}</div>
      </div>
      ${diff !== null ? `
        <div class="diff" style="color:${diff > 0 ? "#E8834A" : diff < 0 ? "#4CAF7D" : "var(--muted)"}">
          ${diff > 0 ? ICONS.up : diff < 0 ? ICONS.down : ICONS.minus}
          <span style="width:16px;height:16px;display:inline-flex"></span>
          ${Math.abs(diff)} kg
        </div>` : ""}
    </div>` : ""}

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="card-label" style="margin-bottom:0">Viktutveckling</div>
        <button id="weightPeriodBtn" style="background:none;border:none;color:${tabColors.vikt};display:flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit;padding:4px"><span class="icon-14" style="display:flex">${ICONS.pencil}</span><span style="font-size:12.5px;font-weight:600">${periodDef.label}</span></button>
      </div>
      <div id="weightPeriodPicker" class="theme-row" style="display:none;margin-bottom:10px;flex-wrap:wrap">
        ${WEIGHT_PERIOD_OPTIONS.map((p) => `<button class="theme-btn" data-weight-period="${p.key}" style="${weightChartPeriod === p.key ? `border-color:${tabColors.vikt};color:${tabColors.vikt}` : ""}">${p.label}</button>`).join("")}
      </div>
      ${periodEntries.length > 1
        ? `<div class="chart-wrap"><canvas id="weightChart"></canvas></div>`
        : `<div class="empty">Logga vikt några dagar för att se en graf</div>`}
    </div>

    <div id="weightHistoryCardWrap">${weightHistoryCardHTML()}</div>

    <div id="bodyMeasurementsCardWrap">${bodyMeasurementsCardHTML()}</div>

    <div class="disclaimer">Copyright 2026 Mattias Öman</div>
  `;

  document.getElementById("manageWeightBtn").addEventListener("click", openManageWeightModal);
  document.getElementById("weightSubmit").addEventListener("click", () => {
    if (!requireAuth("Du behöver ett konto för att logga vikt.")) return;
    const date = document.getElementById("weightDate").value;
    const raw = document.getElementById("weightValue").value;
    const num = parseFloat(String(raw).replace(",", "."));
    if (!date || isNaN(num) || num <= 0) return;
    weightEntries = weightEntries.filter((e) => e.date !== date);
    weightEntries.push({ id: uid(), date, value: num });
    weightEntries.sort((a, b) => a.date.localeCompare(b.date));
    persistWeights();
    vibrate();
    checkAchievements();
    checkWeeklyChallenges();
    awardLogXpForDate("weight", date);
    renderVikt();
  });
  document.getElementById("weightValue").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("weightSubmit").click();
    }
  });
  wireWeightHistoryCardEvents();
  wireBodyMeasurementsCardEvents();

  const weightPeriodBtn = document.getElementById("weightPeriodBtn");
  const weightPeriodPicker = document.getElementById("weightPeriodPicker");
  if (weightPeriodBtn && weightPeriodPicker) {
    weightPeriodBtn.addEventListener("click", () => {
      weightPeriodPicker.style.display = weightPeriodPicker.style.display === "none" ? "flex" : "none";
    });
  }
  document.querySelectorAll("[data-weight-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      weightChartPeriod = btn.dataset.weightPeriod;
      saveWeightChartPeriod();
      renderVikt();
    });
  });

  if (periodEntries.length > 1) {
    const ctx = document.getElementById("weightChart");
    if (weightChartInstance) weightChartInstance.destroy();
    weightChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: periodEntries.map((e) => fmtDateShort(e.date)),
        datasets: [{
          data: periodEntries.map((e) => e.value),
          borderColor: tabColors.vikt,
          backgroundColor: tabColors.vikt,
          tension: 0.3,
          pointRadius: 2.5,
          borderWidth: 2.5,
        }],
      },
      options: chartBaseOptions(),
    });
  }
}

/* ---------------- TRÄNING TAB ---------------- */

let workoutFilterState = { type: "all", search: "", period: "all" };
const WORKOUT_PERIOD_DAYS = { week: 7, month: 30, "3months": 90, "6months": 182, "9months": 274, "12months": 365 };
let weightHistoryPeriod = "all";
let calorieHistoryPeriod = "all";
function periodCutoffISO(periodKey) {
  return periodKey === "all" ? null : addDays(todayISO(), -WORKOUT_PERIOD_DAYS[periodKey]);
}
function periodSelectOptionsHTML(selected) {
  return `
    <option value="week" ${selected === "week" ? "selected" : ""}>Senaste veckan</option>
    <option value="month" ${selected === "month" ? "selected" : ""}>Senaste månaden</option>
    <option value="3months" ${selected === "3months" ? "selected" : ""}>Senaste 3 månaderna</option>
    <option value="6months" ${selected === "6months" ? "selected" : ""}>Senaste 6 månaderna</option>
    <option value="9months" ${selected === "9months" ? "selected" : ""}>Senaste 9 månaderna</option>
    <option value="12months" ${selected === "12months" ? "selected" : ""}>Senaste 12 månaderna</option>
    <option value="all" ${selected === "all" ? "selected" : ""}>Alla</option>
  `;
}

function computeStreak() {
  const trainingDates = new Set(
    workoutEntries.filter((e) => e.type !== "Sjuk" && e.type !== "Skadad").map((e) => e.date)
  );
  let streak = 0;
  let cursor = todayISO();
  if (!trainingDates.has(cursor)) cursor = addDays(cursor, -1);
  while (trainingDates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computeLongestStreakInYear(year) {
  const trainingDates = new Set(
    workoutEntries
      .filter((e) => e.type !== "Sjuk" && e.type !== "Skadad" && e.date.slice(0, 4) === String(year))
      .map((e) => e.date)
  );
  const sorted = [...trainingDates].sort();
  let longest = 0, current = 0, prevDate = null;
  for (const d of sorted) {
    current = prevDate && addDays(prevDate, 1) === d ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevDate = d;
  }
  return longest;
}

function longestConsecutiveRun(dates) {
  const sorted = [...new Set(dates)].sort();
  let longest = 0, current = 0, prevDate = null;
  for (const d of sorted) {
    current = prevDate && addDays(prevDate, 1) === d ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevDate = d;
  }
  return longest;
}
function longestConsecutiveRunSince(dates, sinceDate) {
  // Same as longestConsecutiveRun, but only considers dates strictly after sinceDate, and also
  // returns the end-date of the longest run so it can be used as the next reset point.
  const sorted = [...new Set(dates)].filter((d) => !sinceDate || d > sinceDate).sort();
  let longest = 0, current = 0, prevDate = null, endDate = null;
  for (const d of sorted) {
    current = prevDate && addDays(prevDate, 1) === d ? current + 1 : 1;
    if (current > longest) { longest = current; endDate = d; }
    prevDate = d;
  }
  return { length: longest, endDate };
}

function isTraining(e) { return e.type !== "Sjuk" && e.type !== "Skadad"; }
// Summan av alla loggade träningsminuter totalt - används av de timbaserade
// prestationerna (10 timmar ... 2000 timmar, Lucky 777) så uträkningen bara
// behöver skrivas på ett ställe.
function totalTrainingMinutes() {
  return workoutEntries.filter(isTraining).reduce((s, e) => s + e.minutes, 0);
}
function typeCategory(typeKey) {
  const t = trainingTypes.find((x) => x.key === typeKey);
  return t ? t.category : null;
}
function isCardio(e) { return typeCategory(e.type) === "kondition"; }
function isMartialArts(e) { return typeCategory(e.type) === "kampsport"; }
function isGymType(e) { return typeCategory(e.type) === "gym"; }

function totalMinutes(filterFn) {
  return workoutEntries.filter(filterFn).reduce((s, e) => s + e.minutes, 0);
}
function maxMinutesInAnyWeek(filterFn) {
  const sums = {};
  workoutEntries.filter(filterFn).forEach((e) => { const wk = getISOWeek(e.date); sums[wk] = (sums[wk] || 0) + e.minutes; });
  return Math.max(0, ...Object.values(sums));
}
function maxMinutesInAnyMonth(filterFn) {
  const sums = {};
  workoutEntries.filter(filterFn).forEach((e) => { const mo = e.date.slice(0, 7); sums[mo] = (sums[mo] || 0) + e.minutes; });
  return Math.max(0, ...Object.values(sums));
}
function maxSessionsInAnyMonthByType(filterFn) {
  return maxSessionsInAnyMonth(workoutEntries.filter(filterFn));
}

function maxSessionsInAnyWeek(entries) {
  const counts = {};
  entries.forEach((e) => { const wk = getISOWeek(e.date); counts[wk] = (counts[wk] || 0) + 1; });
  return Math.max(0, ...Object.values(counts));
}
function maxSessionsInAnyMonth(entries) {
  const counts = {};
  entries.forEach((e) => { const mo = e.date.slice(0, 7); counts[mo] = (counts[mo] || 0) + 1; });
  return Math.max(0, ...Object.values(counts));
}
function gymSplitTextIncludes(entry, keyword) {
  if (!entry.gymSplit) return false;
  const split = gymSplits.find((g) => g.id === entry.gymSplit);
  return !!(split && split.text.toLowerCase().includes(keyword));
}
function trippelhotSessionCount() {
  return workoutEntries.filter((e) => {
    const subs = e.submissions || [];
    if (subs.length < 3) return false;
    const cats = new Set(subs.map((id) => (submissionTypes.find((s) => s.id === id) || {}).category));
    return cats.has("armlocks") && cats.has("chokes") && cats.has("leglocks");
  }).length;
}
function comboSessionCount(category) {
  return workoutEntries.filter((e) => {
    const subs = e.submissions || [];
    if (subs.length < 2) return false;
    const inCategory = new Set(subs.filter((id) => (submissionTypes.find((s) => s.id === id) || {}).category === category));
    return inCategory.size >= 2;
  }).length;
}
function countFullBodyWeeks() {
  const weeks = {};
  workoutEntries.filter((e) => e.type === "Gym" && e.gymSplit).forEach((e) => {
    const monday = mondayOf(e.date);
    if (!weeks[monday]) weeks[monday] = new Set();
    const split = gymSplits.find((g) => g.id === e.gymSplit);
    if (!split) return;
    const text = split.text.toLowerCase();
    if (text.includes("bröst")) weeks[monday].add("brost");
    if (text.includes("rygg")) weeks[monday].add("rygg");
    if (text.includes("ben")) weeks[monday].add("ben");
  });
  return Object.values(weeks).filter((s) => s.size >= 3).length;
}
function hasFullBodyWeek() {
  return countFullBodyWeeks() >= 1;
}
function longestConsecutiveWeeksWithMin(entries, minPerWeek) {
  // Returns the longest-ever run of consecutive ISO weeks that each have >= minPerWeek sessions.
  const counts = {};
  entries.forEach((e) => {
    const monday = mondayOf(e.date);
    counts[monday] = (counts[monday] || 0) + 1;
  });
  const qualifyingMondays = Object.keys(counts).filter((m) => counts[m] >= minPerWeek);
  return longestConsecutiveRunStep(qualifyingMondays, 7);
}
function longestConsecutiveWeeksWithMinSince(entries, minPerWeek, sinceMonday) {
  // Same as longestConsecutiveWeeksWithMin, but only counts weeks strictly after sinceMonday
  // (a "YYYY-MM-DD" Monday string, or null/undefined to consider all weeks). Used to let a streak
  // achievement re-qualify with a fresh run of the same length, instead of requiring an
  // ever-longer all-time record.
  const counts = {};
  entries.forEach((e) => {
    const monday = mondayOf(e.date);
    if (sinceMonday && monday <= sinceMonday) return;
    counts[monday] = (counts[monday] || 0) + 1;
  });
  const qualifyingMondays = Object.keys(counts).filter((m) => counts[m] >= minPerWeek);
  return longestConsecutiveRunEndStep(qualifyingMondays, 7);
}
function hasConsecutiveWeeksWithMin(entries, weeksNeeded, minPerWeek) {
  return longestConsecutiveWeeksWithMin(entries, minPerWeek) >= weeksNeeded;
}
function maxSessionsInAnyTwoConsecutiveMonths(entries) {
  const counts = {};
  entries.forEach((e) => { const mo = e.date.slice(0, 7); counts[mo] = (counts[mo] || 0) + 1; });
  const months = Object.keys(counts).sort();
  let best = 0;
  for (const mo of months) {
    const [y, m] = mo.split("-").map(Number);
    const nextDate = new Date(y, m, 1); // first day of next month
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    const combined = (counts[mo] || 0) + (counts[nextKey] || 0);
    best = Math.max(best, combined);
  }
  return best;
}
function countDoubleSessionDaysInYear(year) {
  const counts = {};
  workoutEntries.filter((e) => isTraining(e) && e.date.slice(0, 4) === String(year)).forEach((e) => {
    counts[e.date] = (counts[e.date] || 0) + 1;
  });
  return Object.values(counts).filter((c) => c >= 2).length;
}
function maxDoubleSessionDaysInMonth() {
  const set = doubleSessionDatesSet();
  const counts = {};
  [...set].forEach((d) => { const mo = d.slice(0, 7); counts[mo] = (counts[mo] || 0) + 1; });
  return Math.max(0, ...Object.values(counts));
}
function countWeeksWithAllThreeCategories(minEach) {
  const weekly = {};
  workoutEntries.filter(isTraining).forEach((e) => {
    const wk = getISOWeek(e.date);
    const cat = typeCategory(e.type);
    if (!cat) return;
    if (!weekly[wk]) weekly[wk] = { kampsport: 0, gym: 0, kondition: 0 };
    weekly[wk][cat]++;
  });
  return Object.values(weekly).filter((c) => c.kampsport >= minEach && c.gym >= minEach && c.kondition >= minEach).length;
}
function hasAllThreeCategoriesInAnyWeek(minEach) {
  return countWeeksWithAllThreeCategories(minEach) >= 1;
}
function countMonthsWithAllThreeCategories(minEach) {
  const monthly = {};
  workoutEntries.filter(isTraining).forEach((e) => {
    const mo = e.date.slice(0, 7);
    const cat = typeCategory(e.type);
    if (!cat) return;
    if (!monthly[mo]) monthly[mo] = { kampsport: 0, gym: 0, kondition: 0 };
    monthly[mo][cat]++;
  });
  return Object.values(monthly).filter((c) => c.kampsport >= minEach && c.gym >= minEach && c.kondition >= minEach).length;
}
function hasAllThreeCategoriesInAnyMonth(minEach) {
  return countMonthsWithAllThreeCategories(minEach) >= 1;
}
function parsedSpeedKmh(e) {
  if (!e.note) return null;
  const m = e.note.match(/Snitt ([\d.]+) km\/h/);
  return m ? parseFloat(m[1]) : null;
}
function trainingCountInYear(year) {
  return workoutEntries.filter((e) => isTraining(e) && e.date.slice(0, 4) === String(year)).length;
}

function trainingCountInYearByTypes(year, types) {
  return workoutEntries.filter((e) => types.includes(e.type) && e.date.slice(0, 4) === String(year)).length;
}
function trainingCountInYearByCategory(year, category) {
  return workoutEntries.filter((e) => typeCategory(e.type) === category && e.date.slice(0, 4) === String(year)).length;
}

function countDoubleSessionDaysAllTime() {
  const counts = {};
  workoutEntries.filter(isTraining).forEach((e) => { counts[e.date] = (counts[e.date] || 0) + 1; });
  return Object.values(counts).filter((c) => c >= 2).length;
}

function doubleSessionDatesSet() {
  const counts = {};
  workoutEntries.filter(isTraining).forEach((e) => { counts[e.date] = (counts[e.date] || 0) + 1; });
  return new Set(Object.keys(counts).filter((d) => counts[d] >= 2));
}

function countWeekendDoubleSessions() {
  const set = doubleSessionDatesSet();
  return [...set].filter((d) => {
    const dow = new Date(d + "T00:00:00").getDay();
    return dow === 0 || dow === 6; // Sunday or Saturday
  }).length;
}
function hasWeekendDoubleSession() {
  return countWeekendDoubleSessions() >= 1;
}

function countConsecutiveDoubleDayPairs() {
  const set = doubleSessionDatesSet();
  return [...set].filter((d) => set.has(addDays(d, 1))).length;
}
function hasConsecutiveDoubleDays() {
  return countConsecutiveDoubleDayPairs() >= 1;
}

function maxDoubleSessionDaysInWeek() {
  const set = doubleSessionDatesSet();
  const counts = {};
  [...set].forEach((d) => { const wk = getISOWeek(d); counts[wk] = (counts[wk] || 0) + 1; });
  return Math.max(0, ...Object.values(counts));
}

function maxSessionsInSeason(startMonth, endMonth) {
  // Counts sessions whose month falls within [startMonth, endMonth] (1-12) of the same year, for every year present in data.
  const counts = {};
  workoutEntries.filter(isTraining).forEach((e) => {
    const year = +e.date.slice(0, 4);
    const month = +e.date.slice(5, 7);
    if (month >= startMonth && month <= endMonth) {
      counts[year] = (counts[year] || 0) + 1;
    }
  });
  return Math.max(0, ...Object.values(counts));
}

function maxSessionsInWinterSeason() {
  // Winter = Dec of year Y through Feb of year Y+1, grouped by the December's year.
  const counts = {};
  workoutEntries.filter(isTraining).forEach((e) => {
    const year = +e.date.slice(0, 4);
    const month = +e.date.slice(5, 7);
    const day = e.date.slice(8, 10);
    if (month === 12) counts[year] = (counts[year] || 0) + 1;
    else if (month === 1 || month === 2) counts[year - 1] = (counts[year - 1] || 0) + 1;
  });
  return Math.max(0, ...Object.values(counts));
}

function trainedBothWeekendDays() {
  const dateSet = new Set(workoutEntries.filter(isTraining).map((e) => e.date));
  for (const d of dateSet) {
    const dt = new Date(d + "T00:00:00");
    if (dt.getDay() === 6 && dateSet.has(addDays(d, 1))) return true; // Saturday -> Sunday
  }
  return false;
}

function countBothWeekendDays() {
  const dateSet = new Set(workoutEntries.filter(isTraining).map((e) => e.date));
  let count = 0;
  for (const d of dateSet) {
    const dt = new Date(d + "T00:00:00");
    if (dt.getDay() === 6 && dateSet.has(addDays(d, 1))) count++;
  }
  return count;
}

function longestLooseRun(dates, maxGapDays) {
  const sorted = [...new Set(dates)].sort();
  let longest = 0, current = 0, prevDate = null;
  for (const d of sorted) {
    if (prevDate) {
      const gapDays = Math.round((new Date(d) - new Date(prevDate)) / 86400000);
      current = gapDays <= maxGapDays + 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prevDate = d;
  }
  return longest;
}
function longestLooseRunSince(dates, maxGapDays, sinceDate) {
  const sorted = [...new Set(dates)].filter((d) => !sinceDate || d > sinceDate).sort();
  let longest = 0, current = 0, prevDate = null, endDate = null;
  for (const d of sorted) {
    if (prevDate) {
      const gapDays = Math.round((new Date(d) - new Date(prevDate)) / 86400000);
      current = gapDays <= maxGapDays + 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    if (current > longest) { longest = current; endDate = d; }
    prevDate = d;
  }
  return { length: longest, endDate };
}

function allTrainingTypesUsed() {
  const usedTypes = new Set(workoutEntries.filter(isTraining).map((e) => e.type));
  return TRAINING_KEYS.length > 0 && TRAINING_KEYS.every((k) => usedTypes.has(k));
}

function longestConsecutiveRunStep(dates, stepDays) {
  const sorted = [...new Set(dates)].sort();
  let longest = 0, current = 0, prevDate = null;
  for (const d of sorted) {
    current = prevDate && addDays(prevDate, stepDays) === d ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevDate = d;
  }
  return longest;
}
function longestConsecutiveRunEndStep(dates, stepDays) {
  // Like longestConsecutiveRunStep, but also returns the end-date of the (first) longest run,
  // so callers can mark exactly those dates as "used up" for a reset-based re-qualification.
  const sorted = [...new Set(dates)].sort();
  let longest = 0, current = 0, prevDate = null, endDate = null;
  for (const d of sorted) {
    current = prevDate && addDays(prevDate, stepDays) === d ? current + 1 : 1;
    if (current > longest) {
      longest = current;
      endDate = d;
    }
    prevDate = d;
  }
  return { length: longest, endDate };
}

function isMidsummerEve(dateStr) {
  // Swedish midsummer eve: the Friday between June 19 and June 25 (inclusive).
  const d = new Date(dateStr + "T00:00:00");
  if (d.getMonth() !== 5) return false; // June = 5
  const day = d.getDate();
  return day >= 19 && day <= 25 && d.getDay() === 5; // Friday
}

function computeEasterSunday(year) {
  // Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isEasterEve(dateStr) {
  // Swedish påskafton: the Saturday before Easter Sunday.
  const d = new Date(dateStr + "T00:00:00");
  const easterSunday = computeEasterSunday(d.getFullYear());
  const easterEve = new Date(easterSunday);
  easterEve.setDate(easterEve.getDate() - 1);
  return d.getFullYear() === easterEve.getFullYear() && d.getMonth() === easterEve.getMonth() && d.getDate() === easterEve.getDate();
}

/* ---------------- XP / Level system ---------------- */

function xpForLevel(level) { return Math.min(level, 40) * 100; } // xp needed to go from `level` to `level+1`; cost stops growing after level 40

function computeLevelInfo(totalXp) {
  let level = 1;
  let xpUsed = 0;
  while (xpUsed + xpForLevel(level) <= totalXp) {
    xpUsed += xpForLevel(level);
    level++;
  }
  return { level, xpIntoLevel: totalXp - xpUsed, xpForNext: xpForLevel(level), totalXp };
}

const BELT_TIER_IMG_1 = "badges/BELT_TIER_IMG_1.png";
const BELT_TIER_IMG_10 = "badges/BELT_TIER_IMG_10.png";
const BELT_TIER_IMG_20 = "badges/BELT_TIER_IMG_20.png";
const BELT_TIER_IMG_30 = "badges/BELT_TIER_IMG_30.png";
const BELT_TIER_IMG_40 = "badges/BELT_TIER_IMG_40.png";
const BELT_TIER_IMG_50 = "badges/BELT_TIER_IMG_50.png";
const BELT_TIER_IMG_60 = "badges/BELT_TIER_IMG_60.png";
const BELT_TIER_IMG_70 = "badges/BELT_TIER_IMG_70.png";
const BELT_TIER_IMG_80 = "badges/BELT_TIER_IMG_80.png";
const BELT_TIER_IMG_90 = "badges/BELT_TIER_IMG_90.png";

const BELT_PROFILE_IMG_WHITE = "badges/BELT_PROFILE_IMG_WHITE.png";
const BELT_PROFILE_IMG_BLUE = "badges/BELT_PROFILE_IMG_BLUE.png";
const BELT_PROFILE_IMG_BROWN = "badges/BELT_PROFILE_IMG_BROWN.png";
const BELT_PROFILE_IMG_PURPLE = "badges/BELT_PROFILE_IMG_PURPLE.png";
const BELT_PROFILE_IMG_BLACK = "badges/BELT_PROFILE_IMG_BLACK.png";

const PROFILE_BELT_IMAGES = {
  "Vitt bälte": BELT_PROFILE_IMG_WHITE,
  "Blått bälte": BELT_PROFILE_IMG_BLUE,
  "Lila bälte": BELT_PROFILE_IMG_PURPLE,
  "Brunt bälte": BELT_PROFILE_IMG_BROWN,
  "Svart bälte": BELT_PROFILE_IMG_BLACK,
};

const BELT_TIERS = [
  { name: "Vitt bälte", min: 1, color: "#F2F2F2", borderColor: "var(--border2)", image: BELT_TIER_IMG_1 },
  { name: "Blått bälte", min: 10, color: "#3B82F6", image: BELT_TIER_IMG_10 },
  { name: "Lila bälte", min: 20, color: "#A855F7", image: BELT_TIER_IMG_20 },
  { name: "Brunt bälte", min: 30, color: "#8B5A2B", image: BELT_TIER_IMG_30 },
  { name: "Svart bälte", min: 40, color: "#DC2626", barColor: "#E15554", image: BELT_TIER_IMG_40 },
  { name: "Svart/rött bälte", min: 50, color: "#DC2626", image: BELT_TIER_IMG_50 },
  { name: "Rött bälte", min: 60, color: "#DC2626", image: BELT_TIER_IMG_60 },
  { name: "Lotus-bälte", min: 70, color: "#F5D033", image: BELT_TIER_IMG_70 },
  { name: "Livsträd-bälte", min: 80, color: "#C084FC", image: BELT_TIER_IMG_80 },
  { name: "Oändlighetsbälte", min: 90, color: "#FDE047", stripeEvery: 2, unlimitedStripes: true, image: BELT_TIER_IMG_90 },
];


const FITNESS_TIER_IMG_1 = "badges/FITNESS_TIER_IMG_1.png";
const FITNESS_TIER_IMG_2 = "badges/FITNESS_TIER_IMG_2.png";
const FITNESS_TIER_IMG_3 = "badges/FITNESS_TIER_IMG_3.png";
const FITNESS_TIER_IMG_4 = "badges/FITNESS_TIER_IMG_4.png";
const FITNESS_TIER_IMG_5 = "badges/FITNESS_TIER_IMG_5.png";
const FITNESS_TIER_IMG_6 = "badges/FITNESS_TIER_IMG_6.png";
const FITNESS_TIER_IMG_7 = "badges/FITNESS_TIER_IMG_7.png";
const FITNESS_TIER_IMG_8 = "badges/FITNESS_TIER_IMG_8.png";
const FITNESS_TIER_IMG_9 = "badges/FITNESS_TIER_IMG_9.png";
const FITNESS_TIER_IMG_10 = "badges/FITNESS_TIER_IMG_10.png";

const FITNESS_TIERS = [
  { name: "Nybörjare", min: 1, color: "#9CA3AF", image: FITNESS_TIER_IMG_1 },
  { name: "Motionär", min: 10, color: "#84CC16", image: FITNESS_TIER_IMG_2 },
  { name: "Atlet", min: 20, color: "#3B82F6", image: FITNESS_TIER_IMG_3 },
  { name: "Träningsentusiast", min: 30, color: "#A78BFA", image: FITNESS_TIER_IMG_4 },
  { name: "Veteran", min: 40, color: "#B45309", image: FITNESS_TIER_IMG_5 },
  { name: "Elit", min: 50, color: "#FBBF24", image: FITNESS_TIER_IMG_6 },
  { name: "Mästare", min: 60, color: "#2DD4BF", image: FITNESS_TIER_IMG_7 },
  { name: "Champion", min: 70, color: "#EF4444", image: FITNESS_TIER_IMG_8 },
  { name: "Legend", min: 80, color: "#A855F7", image: FITNESS_TIER_IMG_9 },
  { name: "Ikon", min: 90, color: "#FDE047", image: FITNESS_TIER_IMG_10 },
];


const GYM_TIER_IMG_1 = "badges/GYM_TIER_IMG_1.png";
const GYM_TIER_IMG_10 = "badges/GYM_TIER_IMG_10.png";
const GYM_TIER_IMG_20 = "badges/GYM_TIER_IMG_20.png";
const GYM_TIER_IMG_30 = "badges/GYM_TIER_IMG_30.png";
const GYM_TIER_IMG_40 = "badges/GYM_TIER_IMG_40.png";
const GYM_TIER_IMG_50 = "badges/GYM_TIER_IMG_50.png";
const GYM_TIER_IMG_60 = "badges/GYM_TIER_IMG_60.png";
const GYM_TIER_IMG_70 = "badges/GYM_TIER_IMG_70.png";
const GYM_TIER_IMG_80 = "badges/GYM_TIER_IMG_80.png";
const GYM_TIER_IMG_90 = "badges/GYM_TIER_IMG_90.png";

const GYM_TIERS = [
  { name: "Nykomling", min: 1, color: "#9CA3AF", image: GYM_TIER_IMG_1 },
  { name: "Uthållig", min: 10, color: "#4ADE80", image: GYM_TIER_IMG_10 },
  { name: "Kraftfull", min: 20, color: "#3B82F6", image: GYM_TIER_IMG_20 },
  { name: "Styrkebyggare", min: 30, color: "#A78BFA", image: GYM_TIER_IMG_30 },
  { name: "Järnarm", min: 40, color: "#FBBF24", image: GYM_TIER_IMG_40 },
  { name: "Kroppsbyggare", min: 50, color: "#F59E0B", image: GYM_TIER_IMG_50 },
  { name: "Tungviktare", min: 60, color: "#DC2626", image: GYM_TIER_IMG_60 },
  { name: "Mästare", min: 70, color: "#22D3EE", image: GYM_TIER_IMG_70 },
  { name: "Lejonhjärta", min: 80, color: "#A855F7", image: GYM_TIER_IMG_80 },
  { name: "Styrkekung", min: 90, color: "#FDE047", image: GYM_TIER_IMG_90 },
];

const RUN_TIER_IMG_1 = "badges/RUN_TIER_IMG_1.png";
const RUN_TIER_IMG_11 = "badges/RUN_TIER_IMG_11.png";
const RUN_TIER_IMG_21 = "badges/RUN_TIER_IMG_21.png";
const RUN_TIER_IMG_31 = "badges/RUN_TIER_IMG_31.png";
const RUN_TIER_IMG_41 = "badges/RUN_TIER_IMG_41.png";
const RUN_TIER_IMG_51 = "badges/RUN_TIER_IMG_51.png";
const RUN_TIER_IMG_61 = "badges/RUN_TIER_IMG_61.png";
const RUN_TIER_IMG_71 = "badges/RUN_TIER_IMG_71.png";
const RUN_TIER_IMG_81 = "badges/RUN_TIER_IMG_81.png";
const RUN_TIER_IMG_91 = "badges/RUN_TIER_IMG_91.png";

const RUN_TIERS = [
  { name: "Nybörjare", min: 1, color: "#9CA3AF", image: RUN_TIER_IMG_1 },
  { name: "Motionär", min: 11, color: "#4ADE80", image: RUN_TIER_IMG_11 },
  { name: "Aktiv", min: 21, color: "#3B82F6", image: RUN_TIER_IMG_21 },
  { name: "Träningsentusiast", min: 31, color: "#A78BFA", image: RUN_TIER_IMG_31 },
  { name: "Atlet", min: 41, color: "#B45309", image: RUN_TIER_IMG_41 },
  { name: "Elitatlet", min: 51, color: "#DC2626", image: RUN_TIER_IMG_51 },
  { name: "Toppform", min: 61, color: "#FBBF24", image: RUN_TIER_IMG_61 },
  { name: "Prestationsexpert", min: 71, color: "#2DD4BF", image: RUN_TIER_IMG_71 },
  { name: "Fitnessikon", min: 81, color: "#FDE047", image: RUN_TIER_IMG_81 },
  { name: "Fitnesslegend 👑", min: 91, color: "#FACC15", image: RUN_TIER_IMG_91 },
];

const LEVEL_THEMES = { belt: BELT_TIERS, fitness: FITNESS_TIERS, gym: GYM_TIERS, run: RUN_TIERS };

function loadLevelTheme() {
  try { return localStorage.getItem("level_theme_v1") || "belt"; } catch (e) { return "belt"; }
}
function saveLevelTheme() {
  try { localStorage.setItem("level_theme_v1", levelTheme); } catch (e) { /* ignore */ }
}
let levelTheme = loadLevelTheme();

function activeTierSet() {
  return LEVEL_THEMES[levelTheme] || BELT_TIERS;
}

function getBeltForLevel(level) {
  const tiers = activeTierSet();
  let belt = tiers[0];
  for (const tier of tiers) {
    if (level >= tier.min) belt = tier;
  }
  return belt;
}

function getBeltTierSpan(belt) {
  const tiers = activeTierSet();
  const idx = tiers.indexOf(belt);
  const next = tiers[idx + 1];
  return next ? next.min - belt.min : 10;
}

function loadUnlockedAchievements() {
  try {
    const raw = localStorage.getItem("unlocked_achievements_v1");
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveUnlockedAchievements() {
  try { localStorage.setItem("unlocked_achievements_v1", JSON.stringify(unlockedAchievements)); } catch (e) { /* ignore */ }
}
let unlockedAchievements = loadUnlockedAchievements();

function loadUnlockedAchievementDates() {
  try {
    const raw = localStorage.getItem("unlocked_achievement_dates_v1");
    if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") return parsed; }
  } catch (e) { /* fall through */ }
  return {};
}
function saveUnlockedAchievementDates() {
  try { localStorage.setItem("unlocked_achievement_dates_v1", JSON.stringify(unlockedAchievementDates)); } catch (e) { /* ignore */ }
}
let unlockedAchievementDates = loadUnlockedAchievementDates();

function loadDebugXpOverride() {
  try {
    const raw = localStorage.getItem("debug_xp_bonus_v1");
    return raw === null ? 0 : parseInt(raw, 10);
  } catch (e) { return 0; }
}
function saveDebugXpOverride() {
  try { localStorage.setItem("debug_xp_bonus_v1", String(debugXpOverride)); } catch (e) { /* ignore */ }
}
let debugXpOverride = loadDebugXpOverride();

// Debug-flagga: visar alla flikikoner och profilram/flik-sken som upplåsta
// oavsett nuvarande level, utan att röra riktig XP/level/bälte. Bara till för
// att kunna förhandsgranska hur alla val ser ut.
function loadDebugForceUnlockCosmetics() {
  try { return localStorage.getItem("debug_force_unlock_cosmetics_v1") === "1"; } catch (e) { return false; }
}
function saveDebugForceUnlockCosmetics() {
  try { localStorage.setItem("debug_force_unlock_cosmetics_v1", debugForceUnlockCosmetics ? "1" : "0"); } catch (e) { /* ignore */ }
}
let debugForceUnlockCosmetics = loadDebugForceUnlockCosmetics();

function loadLogXp() {
  try { return parseInt(localStorage.getItem("log_xp_v1"), 10) || 0; } catch (e) { return 0; }
}
function saveLogXp() {
  try { localStorage.setItem("log_xp_v1", String(logXp)); } catch (e) { /* ignore */ }
}
let logXp = loadLogXp();

function loadXpAwardedDates() {
  try {
    const raw = localStorage.getItem("xp_awarded_dates_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { weight: parsed.weight || [], calorie: parsed.calorie || [], training: parsed.training || [] };
      }
    }
  } catch (e) { /* fall through */ }
  return { weight: [], calorie: [], training: [] };
}
function saveXpAwardedDates() {
  try { localStorage.setItem("xp_awarded_dates_v1", JSON.stringify(xpAwardedDates)); } catch (e) { /* ignore */ }
}
let xpAwardedDates = loadXpAwardedDates();

function xpNeededForLevel(level) {
  let xp = 0;
  for (let l = 1; l < level; l++) xp += xpForLevel(l);
  return xp;
}

function achievementXp() {
  return ACHIEVEMENTS.filter((a) => unlockedAchievements.includes(a.id)).reduce((s, a) => s + a.xp, 0);
}

function totalXp() {
  return achievementXp() + logXp + weeklyChallengeXp + bingoXp + prestigeXp + debugXpOverride;
}

function baseLogXpForCategory(category) {
  const level = computeLevelInfo(totalXp()).level;
  const table = {
    training: [25, 50, 75, 100],
    weight: [10, 20, 30, 40],
    calorie: [10, 20, 30, 40],
  }[category];
  if (level >= 60) return table[3];
  if (level >= 40) return table[2];
  if (level >= 20) return table[1];
  return table[0];
}

function trainingStreakLengthEndingAt(date) {
  const trainingDateSet = new Set(workoutEntries.filter(isTraining).map((e) => e.date));
  let len = 0;
  let d = date;
  while (trainingDateSet.has(d)) {
    len++;
    d = addDays(d, -1);
  }
  return len;
}

function awardLogXpForDate(category, date) {
  if (xpAwardedDates[category].includes(date)) return; // already awarded for this date
  const levelBefore = computeLevelInfo(totalXp()).level;
  const base = baseLogXpForCategory(category);
  let amount = base;
  if (category === "training") {
    const streakLen = trainingStreakLengthEndingAt(date);
    const increment = base / 5;
    const bonus = Math.min((streakLen - 1) * increment, base);
    amount = base + bonus;
  }
  logXp += amount;
  xpAwardedDates[category].push(date);
  saveLogXp();
  saveXpAwardedDates();
  showXpBump(amount);
  const levelAfter = computeLevelInfo(totalXp()).level;
  if (levelAfter > levelBefore) {
    celebrationQueue.push({ type: "levelup", level: levelAfter });
    if (!document.getElementById("celebrationOverlay")) showNextCelebration();
  }
}

const TRAINING_BADGE_IMG_1 = "badges/TRAINING_BADGE_IMG_1.png";
const TRAINING_BADGE_IMG_2 = "badges/TRAINING_BADGE_IMG_2.png";
const TRAINING_BADGE_IMG_3 = "badges/TRAINING_BADGE_IMG_3.png";
const TRAINING_BADGE_IMG_4 = "badges/TRAINING_BADGE_IMG_4.png";
const TRAINING_BADGE_IMG_5 = "badges/TRAINING_BADGE_IMG_5.png";
const TRAINING_BADGE_IMG_6 = "badges/TRAINING_BADGE_IMG_6.png";
const TRAINING_BADGE_IMG_7 = "badges/TRAINING_BADGE_IMG_7.png";
const TRAINING_BADGE_IMG_8 = "badges/TRAINING_BADGE_IMG_8.png";
const TRAINING_BADGE_IMG_9 = "badges/TRAINING_BADGE_IMG_9.png";
const TRAINING_BADGE_IMG_10 = "badges/TRAINING_BADGE_IMG_10.png";
const TRAINING_BADGE_IMG_11 = "badges/TRAINING_BADGE_IMG_11.png";
const TRAINING_BADGE_IMG_12 = "badges/TRAINING_BADGE_IMG_12.png";



const DUBBELPASS_BADGE_IMG_1 = "badges/DUBBELPASS_BADGE_IMG_1.png";
const DUBBELPASS_BADGE_IMG_2 = "badges/DUBBELPASS_BADGE_IMG_2.png";
const DUBBELPASS_BADGE_IMG_3 = "badges/DUBBELPASS_BADGE_IMG_3.png";
const DUBBELPASS_BADGE_IMG_4 = "badges/DUBBELPASS_BADGE_IMG_4.png";
const DUBBELPASS_BADGE_IMG_5 = "badges/DUBBELPASS_BADGE_IMG_5.png";
const DUBBELPASS_BADGE_IMG_6 = "badges/DUBBELPASS_BADGE_IMG_6.png";
const DUBBELPASS_BADGE_IMG_7 = "badges/DUBBELPASS_BADGE_IMG_7.png";
const DUBBELPASS_BADGE_IMG_8 = "badges/DUBBELPASS_BADGE_IMG_8.png";
const DUBBELPASS_BADGE_IMG_9 = "badges/DUBBELPASS_BADGE_IMG_9.png";
const DUBBELPASS_BADGE_IMG_10 = "badges/DUBBELPASS_BADGE_IMG_10.png";
const DUBBELPASS_BADGE_IMG_11 = "badges/DUBBELPASS_BADGE_IMG_11.png";
const DUBBELPASS_BADGE_IMG_12 = "badges/DUBBELPASS_BADGE_IMG_12.png";
const STREAK_BADGE_IMG_1 = "badges/STREAK_BADGE_IMG_1.png";
const STREAK_BADGE_IMG_2 = "badges/STREAK_BADGE_IMG_2.png";
const STREAK_BADGE_IMG_3 = "badges/STREAK_BADGE_IMG_3.png";
const STREAK_BADGE_IMG_4 = "badges/STREAK_BADGE_IMG_4.png";
const STREAK_BADGE_IMG_5 = "badges/STREAK_BADGE_IMG_5.png";
const STREAK_BADGE_IMG_6 = "badges/STREAK_BADGE_IMG_6.png";
const STREAK_BADGE_IMG_7 = "badges/STREAK_BADGE_IMG_7.png";
const STREAK_BADGE_IMG_8 = "badges/STREAK_BADGE_IMG_8.png";
const STREAK_BADGE_IMG_9 = "badges/STREAK_BADGE_IMG_9.png";
const STREAK_BADGE_IMG_10 = "badges/STREAK_BADGE_IMG_10.png";
const TRANINGSTID_BADGE_IMG_1 = "badges/TRANINGSTID_BADGE_IMG_1.png";
const TRANINGSTID_BADGE_IMG_2 = "badges/TRANINGSTID_BADGE_IMG_2.png";
const TRANINGSTID_BADGE_IMG_3 = "badges/TRANINGSTID_BADGE_IMG_3.png";
const TRANINGSTID_BADGE_IMG_4 = "badges/TRANINGSTID_BADGE_IMG_4.png";
const TRANINGSTID_BADGE_IMG_5 = "badges/TRANINGSTID_BADGE_IMG_5.png";
const TRANINGSTID_BADGE_IMG_6 = "badges/TRANINGSTID_BADGE_IMG_6.png";
const TRANINGSTID_BADGE_IMG_7 = "badges/TRANINGSTID_BADGE_IMG_7.png";
const TRANINGSTID_BADGE_IMG_8 = "badges/TRANINGSTID_BADGE_IMG_8.png";
const TRANINGSTID_BADGE_IMG_9 = "badges/TRANINGSTID_BADGE_IMG_9.png";
const TRANINGSTID_BADGE_IMG_10 = "badges/TRANINGSTID_BADGE_IMG_10.png";
const TRANINGSTID_BADGE_IMG_11 = "badges/TRANINGSTID_BADGE_IMG_11.png";
const TRANINGSTID_BADGE_IMG_12 = "badges/TRANINGSTID_BADGE_IMG_12.png";
const TRANINGSTID_BADGE_IMG_13 = "badges/TRANINGSTID_BADGE_IMG_13.png";
const TRANINGSTID_BADGE_IMG_14 = "badges/TRANINGSTID_BADGE_IMG_14.png";
const TRANINGSTID_BADGE_IMG_15 = "badges/TRANINGSTID_BADGE_IMG_15.png";
const TRANINGSTID_BADGE_IMG_16 = "badges/TRANINGSTID_BADGE_IMG_16.png";
const TRANINGSTID_BADGE_IMG_17 = "badges/TRANINGSTID_BADGE_IMG_17.png";
const TRANINGSTID_BADGE_IMG_18 = "badges/TRANINGSTID_BADGE_IMG_18.png";

const KONDITION_BADGE_IMG_1 = "badges/KONDITION_BADGE_IMG_1.png";
const KONDITION_BADGE_IMG_2 = "badges/KONDITION_BADGE_IMG_2.png";
const KONDITION_BADGE_IMG_3 = "badges/KONDITION_BADGE_IMG_3.png";
const KONDITION_BADGE_IMG_4 = "badges/KONDITION_BADGE_IMG_4.png";
const KONDITION_BADGE_IMG_5 = "badges/KONDITION_BADGE_IMG_5.png";
const KONDITION_BADGE_IMG_6 = "badges/KONDITION_BADGE_IMG_6.png";
const KONDITION_BADGE_IMG_7 = "badges/KONDITION_BADGE_IMG_7.png";
const KONDITION_BADGE_IMG_8 = "badges/KONDITION_BADGE_IMG_8.png";
const KONDITION_BADGE_IMG_9 = "badges/KONDITION_BADGE_IMG_9.png";
const KONDITION_BADGE_IMG_10 = "badges/KONDITION_BADGE_IMG_10.png";
const KONDITION_BADGE_IMG_11 = "badges/KONDITION_BADGE_IMG_11.png";
const KONDITION_BADGE_IMG_12 = "badges/KONDITION_BADGE_IMG_12.png";
const KONDITION_BADGE_IMG_13 = "badges/KONDITION_BADGE_IMG_13.png";
const KONDITION_BADGE_IMG_14 = "badges/KONDITION_BADGE_IMG_14.png";
const KONDITION_BADGE_IMG_15 = "badges/KONDITION_BADGE_IMG_15.png";
const ARSPASS_BADGE_IMG_1 = "badges/ARSPASS_BADGE_IMG_1.png";
const ARSPASS_BADGE_IMG_2 = "badges/ARSPASS_BADGE_IMG_2.png";
const ARSPASS_BADGE_IMG_3 = "badges/ARSPASS_BADGE_IMG_3.png";
const ARSPASS_BADGE_IMG_4 = "badges/ARSPASS_BADGE_IMG_4.png";
const ARSPASS_BADGE_IMG_5 = "badges/ARSPASS_BADGE_IMG_5.png";
const ARSPASS_BADGE_IMG_6 = "badges/ARSPASS_BADGE_IMG_6.png";
const ARSPASS_BADGE_IMG_7 = "badges/ARSPASS_BADGE_IMG_7.png";
const ARSPASS_BADGE_IMG_8 = "badges/ARSPASS_BADGE_IMG_8.png";
const ARSPASS_BADGE_IMG_9 = "badges/ARSPASS_BADGE_IMG_9.png";
const ARSPASS_BADGE_IMG_10 = "badges/ARSPASS_BADGE_IMG_10.png";
const ARSPASS_BADGE_IMG_11 = "badges/ARSPASS_BADGE_IMG_11.png";
const SUBMISSION_BADGE_IMG_1 = "badges/SUBMISSION_BADGE_IMG_1.png";
const SUBMISSION_BADGE_IMG_2 = "badges/SUBMISSION_BADGE_IMG_2.png";
const SUBMISSION_BADGE_IMG_3 = "badges/SUBMISSION_BADGE_IMG_3.png";
const SUBMISSION_BADGE_IMG_4 = "badges/SUBMISSION_BADGE_IMG_4.png";
const SUBMISSION_BADGE_IMG_5 = "badges/SUBMISSION_BADGE_IMG_5.png";
const SUBMISSION_BADGE_IMG_6 = "badges/SUBMISSION_BADGE_IMG_6.png";
const SUBMISSION_BADGE_IMG_7 = "badges/SUBMISSION_BADGE_IMG_7.png";
const SUBMISSION_BADGE_IMG_8 = "badges/SUBMISSION_BADGE_IMG_8.png";
const SUBMISSION_BADGE_IMG_9 = "badges/SUBMISSION_BADGE_IMG_9.png";
const SUBMISSION_BADGE_IMG_10 = "badges/SUBMISSION_BADGE_IMG_10.png";
const SUBMISSION_BADGE_IMG_11 = "badges/SUBMISSION_BADGE_IMG_11.png";
const SUBMISSION_BADGE_IMG_12 = "badges/SUBMISSION_BADGE_IMG_12.png";
const SUBMISSION_BADGE_IMG_13 = "badges/SUBMISSION_BADGE_IMG_13.png";
const SUBMISSION_BADGE_IMG_14 = "badges/SUBMISSION_BADGE_IMG_14.png";
const SUBMISSION_BADGE_IMG_15 = "badges/SUBMISSION_BADGE_IMG_15.png";
const MANADSMAL_BADGE_IMG_1 = "badges/MANADSMAL_BADGE_IMG_1.png";
const MANADSMAL_BADGE_IMG_2 = "badges/MANADSMAL_BADGE_IMG_2.png";
const MANADSMAL_BADGE_IMG_3 = "badges/MANADSMAL_BADGE_IMG_3.png";
const MANADSMAL_BADGE_IMG_4 = "badges/MANADSMAL_BADGE_IMG_4.png";
const MANADSMAL_BADGE_IMG_5 = "badges/MANADSMAL_BADGE_IMG_5.png";
const MANADSMAL_BADGE_IMG_6 = "badges/MANADSMAL_BADGE_IMG_6.png";
const MANADSMAL_BADGE_IMG_7 = "badges/MANADSMAL_BADGE_IMG_7.png";
const MANADSMAL_BADGE_IMG_8 = "badges/MANADSMAL_BADGE_IMG_8.png";
const MANADSMAL_BADGE_IMG_9 = "badges/MANADSMAL_BADGE_IMG_9.png";
const MANADSMAL_BADGE_IMG_10 = "badges/MANADSMAL_BADGE_IMG_10.png";
const MANADSMAL_BADGE_IMG_11 = "badges/MANADSMAL_BADGE_IMG_11.png";
const MANADSMAL_BADGE_IMG_12 = "badges/MANADSMAL_BADGE_IMG_12.png";
const MANADSMAL_BADGE_IMG_13 = "badges/MANADSMAL_BADGE_IMG_13.png";
const MANADSMAL_BADGE_IMG_14 = "badges/MANADSMAL_BADGE_IMG_14.png";
const MANADSMAL_BADGE_IMG_15 = "badges/MANADSMAL_BADGE_IMG_15.png";
const MANADSMAL_BADGE_IMG_16 = "badges/MANADSMAL_BADGE_IMG_16.png";
const MANADSMAL_BADGE_IMG_17 = "badges/MANADSMAL_BADGE_IMG_17.png";
const MANADSMAL_BADGE_IMG_18 = "badges/MANADSMAL_BADGE_IMG_18.png";
const MANADSMAL_BADGE_IMG_19 = "badges/MANADSMAL_BADGE_IMG_19.png";
const MANADSMAL_BADGE_IMG_20 = "badges/MANADSMAL_BADGE_IMG_20.png";
const MANADSMAL_BADGE_IMG_21 = "badges/MANADSMAL_BADGE_IMG_21.png";
const MANADSMAL_BADGE_IMG_22 = "badges/MANADSMAL_BADGE_IMG_22.png";
const MANADSMAL_BADGE_IMG_23 = "badges/MANADSMAL_BADGE_IMG_23.png";
const MANADSMAL_BADGE_IMG_24 = "badges/MANADSMAL_BADGE_IMG_24.png";
const OVRIGA_BADGE_IMG_1 = "badges/OVRIGA_BADGE_IMG_1.png";
const OVRIGA_BADGE_IMG_2 = "badges/OVRIGA_BADGE_IMG_2.png";
const OVRIGA_BADGE_IMG_3 = "badges/OVRIGA_BADGE_IMG_3.png";
const OVRIGA_BADGE_IMG_4 = "badges/OVRIGA_BADGE_IMG_4.png";
const OVRIGA_BADGE_IMG_5 = "badges/OVRIGA_BADGE_IMG_5.png";
const OVRIGA_BADGE_IMG_6 = "badges/OVRIGA_BADGE_IMG_6.png";
const OVRIGA_BADGE_IMG_7 = "badges/OVRIGA_BADGE_IMG_7.png";
const OVRIGA_BADGE_IMG_8 = "badges/OVRIGA_BADGE_IMG_8.png";
const OVRIGA_BADGE_IMG_9 = "badges/OVRIGA_BADGE_IMG_9.png";
const OVRIGA_BADGE_IMG_10 = "badges/OVRIGA_BADGE_IMG_10.png";
const OVRIGA_BADGE_IMG_11 = "badges/OVRIGA_BADGE_IMG_11.png";
const OVRIGA_BADGE_IMG_12 = "badges/OVRIGA_BADGE_IMG_12.png";
const OVRIGA_BADGE_IMG_13 = "badges/OVRIGA_BADGE_IMG_13.png";
const OVRIGA_BADGE_IMG_14 = "badges/OVRIGA_BADGE_IMG_14.png";
const OVRIGA_BADGE_IMG_15 = "badges/OVRIGA_BADGE_IMG_15.png";
const OVRIGA_BADGE_IMG_16 = "badges/OVRIGA_BADGE_IMG_16.png";
const OVRIGA_BADGE_IMG_17 = "badges/OVRIGA_BADGE_IMG_17.png";
const OVRIGA_BADGE_IMG_18 = "badges/OVRIGA_BADGE_IMG_18.png";
const BADGE_IMG_BINGO_LINE = "badges/BADGE_IMG_BINGO_LINE.png";
const BADGE_IMG_BINGO_CORNERS = "badges/BADGE_IMG_BINGO_CORNERS.png";
const BADGE_IMG_BINGO_X = "badges/BADGE_IMG_BINGO_X.png";
const BADGE_IMG_BINGO_2LINES = "badges/BADGE_IMG_BINGO_2LINES.png";
const BADGE_IMG_BINGO_3LINES = "badges/BADGE_IMG_BINGO_3LINES.png";
const BADGE_IMG_BINGO_FULL = "badges/BADGE_IMG_BINGO_FULL.png";
const BADGE_IMG_BINGO_2LINES_5 = "badges/BADGE_IMG_BINGO_2LINES_5.png";
const BADGE_IMG_BINGO_CORNERS_5 = "badges/BADGE_IMG_BINGO_CORNERS_5.png";
const BADGE_IMG_BINGO_X_5 = "badges/BADGE_IMG_BINGO_X_5.png";
const BADGE_IMG_BINGO_FULL_5 = "badges/BADGE_IMG_BINGO_FULL_5.png";
const BADGE_IMG_BINGO_3LINES_5 = "badges/BADGE_IMG_BINGO_3LINES_5.png";
const BADGE_IMG_BINGO_CORNERS_10 = "badges/BADGE_IMG_BINGO_CORNERS_10.png";
const BADGE_IMG_BINGO_X_10 = "badges/BADGE_IMG_BINGO_X_10.png";
const BADGE_IMG_BINGO_FULL_10 = "badges/BADGE_IMG_BINGO_FULL_10.png";
const BADGE_IMG_WEIGHT_FIRST = "badges/BADGE_IMG_WEIGHT_FIRST.png";
const BADGE_IMG_WEIGHT_WEEK = "badges/BADGE_IMG_WEIGHT_WEEK.png";
const BADGE_IMG_WEIGHT_MONTH = "badges/BADGE_IMG_WEIGHT_MONTH.png";
const BADGE_IMG_WEIGHT_90DAYS = "badges/BADGE_IMG_WEIGHT_90DAYS.png";
const BADGE_IMG_WEIGHT_6MONTHS = "badges/BADGE_IMG_WEIGHT_6MONTHS.png";
const BADGE_IMG_WEIGHT_9MONTHS = "badges/BADGE_IMG_WEIGHT_9MONTHS.png";
const BADGE_IMG_WEIGHT_YEAR = "badges/BADGE_IMG_WEIGHT_YEAR.png";
const BADGE_IMG_WEIGHT_50 = "badges/BADGE_IMG_WEIGHT_50.png";
const BADGE_IMG_WEIGHT_100 = "badges/BADGE_IMG_WEIGHT_100.png";
const BADGE_IMG_WEIGHT_150 = "badges/BADGE_IMG_WEIGHT_150.png";
const BADGE_IMG_WEIGHT_500 = "badges/BADGE_IMG_WEIGHT_500.png";
const BADGE_IMG_WEIGHT_WEEKLY_3MONTHS = "badges/BADGE_IMG_WEIGHT_WEEKLY_3MONTHS.png";
const BADGE_IMG_WEIGHT_WEEKLY_6MONTHS = "badges/BADGE_IMG_WEIGHT_WEEKLY_6MONTHS.png";
const BADGE_IMG_WEIGHT_WEEKLY_9MONTHS = "badges/BADGE_IMG_WEIGHT_WEEKLY_9MONTHS.png";
const BADGE_IMG_WEIGHT_WEEKLY_12MONTHS = "badges/BADGE_IMG_WEIGHT_WEEKLY_12MONTHS.png";
const BADGE_IMG_NYARSLOFTET = "badges/BADGE_IMG_NYARSLOFTET.png";
const BADGE_IMG_PIONJAREN = "badges/BADGE_IMG_PIONJAREN.png";
const BADGE_IMG_MATTIAS_BIRTHDAY = "badges/BADGE_IMG_MATTIAS_BIRTHDAY.png";
const BADGE_IMG_LUNA_BIRTHDAY = "badges/BADGE_IMG_LUNA_BIRTHDAY.png";
const BADGE_IMG_NUM_OF_BEAST = "badges/BADGE_IMG_NUM_OF_BEAST.png";
const BADGE_IMG_LO_BIRTHDAY = "badges/BADGE_IMG_LO_BIRTHDAY.png";
const BADGE_IMG_LUCKY777 = "badges/BADGE_IMG_LUCKY777.png";
const BADGE_IMG_BLACK_BELT_DAY = "badges/BADGE_IMG_BLACK_BELT_DAY.png";
const BADGE_IMG_PLATINUM_100 = "badges/BADGE_IMG_PLATINUM_100.png";
const BADGE_IMG_NEWGAMEPLUS = "badges/BADGE_IMG_NEWGAMEPLUS.png";
const NGP_IMG_IRON_CENTURY = "badges/NGP_IRON_CENTURY.png";
const NGP_IMG_COMBAT_CENTURY = "badges/NGP_COMBAT_CENTURY.png";
const NGP_IMG_CARDIO_CENTURY = "badges/NGP_CARDIO_CENTURY.png";
const NGP_IMG_100 = "badges/NGP_100.png";
const NGP_IMG_500_CLUB = "badges/NGP_500_CLUB.png";
const NGP_IMG_TIME_LORD = "badges/NGP_TIME_LORD.png";
const NGP_IMG_NO_WEEKS_OFF = "badges/NGP_NO_WEEKS_OFF.png";
const NGP_IMG_LONG_GAME = "badges/NGP_LONG_GAME.png";
const NGP_IMG_HYBRID_ATHLETE = "badges/NGP_HYBRID_ATHLETE.png";
const NGP_IMG_TRIPLE_CENTURY = "badges/NGP_TRIPLE_CENTURY.png";
const NGP_IMG_SUBMISSION_MASTER = "badges/NGP_SUBMISSION_MASTER.png";
const NGP_IMG_BINGO_MASTER = "badges/NGP_BINGO_MASTER.png";
const NGP_IMG_250 = "badges/NGP_250.png";
const NGP_IMG_PERFECT_MONTH = "badges/NGP_PERFECT_MONTH.png";
const NGP_IMG_PERFECT_QUARTER = "badges/NGP_PERFECT_QUARTER.png";
const NGP_IMG_EXPLORER = "badges/NGP_EXPLORER.png";
const NGP_IMG_GRAND_SLAM = "badges/NGP_GRAND_SLAM.png";
const NGP_IMG_UNSTOPPABLE = "badges/NGP_UNSTOPPABLE.png";
const NGP_IMG_PERFECT_YEAR = "badges/NGP_PERFECT_YEAR.png";
const NGP_IMG_COMPLETIONIST = "badges/NGP_COMPLETIONIST.png";
const EMBLEM_CROWN_WINGS_GOLD = "badges/EMBLEM_CROWN_WINGS_GOLD.png";
const EMBLEM_CROWN_WINGS_DIAMOND = "badges/EMBLEM_CROWN_WINGS_DIAMOND.png";
const BADGE_IMG_JULHJALTEN = "badges/BADGE_IMG_JULHJALTEN.png";
const BADGE_IMG_MIDSOMMARKRIGAREN = "badges/BADGE_IMG_MIDSOMMARKRIGAREN.png";
const BADGE_IMG_AVSLUTA_STARKT = "badges/BADGE_IMG_AVSLUTA_STARKT.png";
const BADGE_IMG_PASKHAREN = "badges/BADGE_IMG_PASKHAREN.png";
const BADGE_IMG_BEAST_MODE = "badges/BADGE_IMG_BEAST_MODE.png";
const BADGE_IMG_DATUMJAGAREN = "badges/BADGE_IMG_DATUMJAGAREN.png";
const BADGE_IMG_BLIXTSNABB = "badges/BADGE_IMG_BLIXTSNABB.png";
const BADGE_IMG_TRIPPELPASSET = "badges/BADGE_IMG_TRIPPELPASSET.png";
const BADGE_IMG_BINGO_RING = "badges/BADGE_IMG_BINGO_RING.png";
const BADGE_IMG_WEIGHT_250 = "badges/BADGE_IMG_WEIGHT_250.png";
const ACHIEVEMENTS = [
  // Viktprestationer
  { id: "weight_first", title: "Första invägningen", desc: "Loggat din första vikt.", icon: "scale", xp: 25, badgeImage: BADGE_IMG_WEIGHT_FIRST,
    check: () => weightEntries.length >= 1,
    progress: () => ({ current: weightEntries.length, target: 1 }) },
  { id: "weight_week", title: "Vägt dig 7 dagar", desc: "Loggat vikt 7 dagar i följd.", icon: "calendar", xp: 100, badgeImage: BADGE_IMG_WEIGHT_WEEK, prestige: true,
    check: () => longestConsecutiveRun(weightEntries.map((e) => e.date)) >= 7,
    progress: () => ({ current: longestConsecutiveRun(weightEntries.map((e) => e.date)), target: 7 }) },
  { id: "weight_month", title: "30 dagar", desc: "Loggat vikt 30 dagar i följd.", icon: "calendarCheck", xp: 1100, badgeImage: BADGE_IMG_WEIGHT_MONTH, prestige: true,
    check: () => longestConsecutiveRun(weightEntries.map((e) => e.date)) >= 30,
    progress: () => ({ current: longestConsecutiveRun(weightEntries.map((e) => e.date)), target: 30 }) },
  { id: "weight_90days", title: "90 dagar", desc: "Loggat vikt 90 dagar i följd.", icon: "clock", xp: 1700, badgeImage: BADGE_IMG_WEIGHT_90DAYS, prestige: true,
    check: () => longestConsecutiveRun(weightEntries.map((e) => e.date)) >= 90,
    progress: () => ({ current: longestConsecutiveRun(weightEntries.map((e) => e.date)), target: 90 }) },
  { id: "weight_6months", title: "6 månader", desc: "Loggat vikt 182 dagar i följd.", icon: "medal", xp: 2100, badgeImage: BADGE_IMG_WEIGHT_6MONTHS, prestige: true,
    check: () => longestConsecutiveRun(weightEntries.map((e) => e.date)) >= 182,
    progress: () => ({ current: longestConsecutiveRun(weightEntries.map((e) => e.date)), target: 182 }) },
  { id: "weight_9months", title: "9 månader", desc: "Loggat vikt 274 dagar i följd.", icon: "award", xp: 4400, badgeImage: BADGE_IMG_WEIGHT_9MONTHS, prestige: true,
    check: () => longestConsecutiveRun(weightEntries.map((e) => e.date)) >= 274,
    progress: () => ({ current: longestConsecutiveRun(weightEntries.map((e) => e.date)), target: 274 }) },
  { id: "weight_year", title: "12 månader", desc: "Loggat vikt 365 dagar i följd.", icon: "crown", xp: 15000, badgeImage: BADGE_IMG_WEIGHT_YEAR, prestige: true,
    check: () => longestConsecutiveRun(weightEntries.map((e) => e.date)) >= 365,
    progress: () => ({ current: longestConsecutiveRun(weightEntries.map((e) => e.date)), target: 365 }) },
  { id: "weight_50", title: "50 invägningar", desc: "Loggat vikt totalt 50 gånger.", icon: "gem", xp: 150, badgeImage: BADGE_IMG_WEIGHT_50, prestige: true,
    check: () => weightEntries.length >= 50,
    progress: () => ({ current: weightEntries.length, target: 50 }) },
  { id: "weight_100", title: "100 invägningar", desc: "Loggat vikt totalt 100 gånger.", icon: "flame", xp: 3100, badgeImage: BADGE_IMG_WEIGHT_100, prestige: true,
    check: () => weightEntries.length >= 100,
    progress: () => ({ current: weightEntries.length, target: 100 }) },
  { id: "weight_150", title: "150 invägningar", desc: "Loggat vikt totalt 150 gånger.", icon: "trophy", xp: 3800, badgeImage: BADGE_IMG_WEIGHT_150, prestige: true,
    check: () => weightEntries.length >= 150,
    progress: () => ({ current: weightEntries.length, target: 150 }) },
  { id: "weight_250", title: "250 invägningar", desc: "Loggat vikt totalt 250 gånger.", icon: "star", xp: 5000, badgeImage: BADGE_IMG_WEIGHT_250, prestige: true,
    check: () => weightEntries.length >= 250,
    progress: () => ({ current: weightEntries.length, target: 250 }) },
  { id: "weight_500", title: "500 invägningar", desc: "Loggat vikt totalt 500 gånger.", icon: "diamond", xp: 10000, badgeImage: BADGE_IMG_WEIGHT_500, prestige: true,
    check: () => weightEntries.length >= 500,
    progress: () => ({ current: weightEntries.length, target: 500 }) },
  { id: "weight_weekly_3months", title: "Varje vecka i 3 månader", desc: "Loggat vikt minst en gång i veckan, i 3 månader (13 veckor) i följd.", icon: "target", xp: 600, badgeImage: BADGE_IMG_WEIGHT_WEEKLY_3MONTHS, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(weightEntries, 13, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(weightEntries, 1), target: 13 }) },
  { id: "weight_weekly_6months", title: "Varje vecka i 6 månader", desc: "Loggat vikt minst en gång i veckan, i 6 månader (26 veckor) i följd.", icon: "compass", xp: 1200, badgeImage: BADGE_IMG_WEIGHT_WEEKLY_6MONTHS, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(weightEntries, 26, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(weightEntries, 1), target: 26 }) },
  { id: "weight_weekly_9months", title: "Varje vecka i 9 månader", desc: "Loggat vikt minst en gång i veckan, i 9 månader (39 veckor) i följd.", icon: "hourglass", xp: 2000, badgeImage: BADGE_IMG_WEIGHT_WEEKLY_9MONTHS, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(weightEntries, 39, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(weightEntries, 1), target: 39 }) },
  { id: "weight_weekly_12months", title: "Varje vecka i 12 månader", desc: "Loggat vikt minst en gång i veckan, i 12 månader (52 veckor) i följd.", icon: "mountain", xp: 2800, badgeImage: BADGE_IMG_WEIGHT_WEEKLY_12MONTHS, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(weightEntries, 52, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(weightEntries, 1), target: 52 }) },

  // Träningsprestationer (totalt genom tiderna)
  { id: "first_pass", title: "Första Steget", desc: "Alla resor börjar med ett första steg, träna ett pass.", icon: "star", xp: 50, badgeImage: TRAINING_BADGE_IMG_1,
    check: () => workoutEntries.some(isTraining) },
  { id: "triple_ten", title: "10 + 10 + 10", desc: "Tränat 10 kampsportspass, 10 styrkepass och 10 konditionspass.", icon: "puzzle", xp: 1250, badgeImage: TRAINING_BADGE_IMG_5, prestige: true,
    check: () => workoutEntries.filter(isMartialArts).length >= 10 && workoutEntries.filter(isGymType).length >= 10 && workoutEntries.filter(isCardio).length >= 10,
    progress: () => ({ parts: [
      { label: "Kampsport", current: workoutEntries.filter(isMartialArts).length, target: 10 },
      { label: "Styrka", current: workoutEntries.filter(isGymType).length, target: 10 },
      { label: "Kondition", current: workoutEntries.filter(isCardio).length, target: 10 },
    ] }) },
  { id: "double_combo_20", title: "20 kampsport + 20 styrka", desc: "Tränat 20 kampsportspass och 20 styrkepass.", icon: "layers", xp: 950, badgeImage: TRAINING_BADGE_IMG_3, prestige: true,
    check: () => workoutEntries.filter(isMartialArts).length >= 20 && workoutEntries.filter(isGymType).length >= 20,
    progress: () => ({ parts: [
      { label: "Kampsport", current: workoutEntries.filter(isMartialArts).length, target: 20 },
      { label: "Styrka", current: workoutEntries.filter(isGymType).length, target: 20 },
    ] }) },
  { id: "double_combo_30", title: "30 kampsport + 30 styrka", desc: "Tränat 30 kampsportspass och 30 styrkepass.", icon: "compass", xp: 1900, badgeImage: TRAINING_BADGE_IMG_7, prestige: true,
    check: () => workoutEntries.filter(isMartialArts).length >= 30 && workoutEntries.filter(isGymType).length >= 30,
    progress: () => ({ parts: [
      { label: "Kampsport", current: workoutEntries.filter(isMartialArts).length, target: 30 },
      { label: "Styrka", current: workoutEntries.filter(isGymType).length, target: 30 },
    ] }) },
  { id: "total_25", title: "25 pass", desc: "Loggat 25 träningspass totalt.", icon: "flame", xp: 550, badgeImage: TRAINING_BADGE_IMG_2, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 25,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 25 }) },
  { id: "total_50", title: "50 pass", desc: "Loggat 50 träningspass totalt.", icon: "award", xp: 1100, badgeImage: TRAINING_BADGE_IMG_4, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 50,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 50 }) },
  { id: "total_75", title: "75 pass", desc: "Loggat 75 träningspass totalt.", icon: "medal", xp: 1700, badgeImage: TRAINING_BADGE_IMG_6, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 75,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 75 }) },
  { id: "total_100", title: "100 pass", desc: "Loggat 100 träningspass totalt.", icon: "trophy", xp: 2100, badgeImage: TRAINING_BADGE_IMG_8, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 100,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 100 }) },
  { id: "total_250", title: "250 pass", desc: "Loggat 250 träningspass totalt.", icon: "crown", xp: 4400, badgeImage: TRAINING_BADGE_IMG_9, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 250,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 250 }) },
  { id: "total_500", title: "500 pass", desc: "Loggat 500 träningspass totalt.", icon: "diamond", xp: 6800, badgeImage: TRAINING_BADGE_IMG_10, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 500,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 500 }) },
  { id: "total_750", title: "750 pass", desc: "Loggat 750 träningspass totalt.", icon: "gem", xp: 9600, badgeImage: TRAINING_BADGE_IMG_11, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 750,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 750 }) },
  { id: "total_1000", title: "1000 pass", desc: "Loggat 1000 träningspass totalt.", icon: "rocket", xp: 15000, badgeImage: TRAINING_BADGE_IMG_12, prestige: true,
    check: () => workoutEntries.filter(isTraining).length >= 1000,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 1000 }) },

  // Pass under ett och samma år
  { id: "year_25", title: "25 pass", desc: "Tränat 25 pass under ett år.", icon: "flame", xp: 200, badgeImage: ARSPASS_BADGE_IMG_1, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 25,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 25 }) },
  { id: "year_50", title: "50 pass", desc: "Tränat 50 pass under ett år.", icon: "medal", xp: 1100, badgeImage: ARSPASS_BADGE_IMG_2, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 50,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 50 }) },
  { id: "year_100", title: "100 pass", desc: "Tränat 100 pass under ett år.", icon: "award", xp: 2100, badgeImage: ARSPASS_BADGE_IMG_5, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 100,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 100 }) },
  { id: "year_150", title: "150 pass", desc: "Tränat 150 pass under ett år.", icon: "gem", xp: 3100, badgeImage: ARSPASS_BADGE_IMG_6, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 150,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 150 }) },
  { id: "year_200", title: "200 pass", desc: "Tränat 200 pass under ett år.", icon: "compass", xp: 5000, badgeImage: ARSPASS_BADGE_IMG_8, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 200,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 200 }) },
  { id: "year_250", title: "250 pass", desc: "Tränat 250 pass under ett år.", icon: "diamond", xp: 7500, badgeImage: ARSPASS_BADGE_IMG_9, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 250,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 250 }) },
  { id: "year_300", title: "300 pass", desc: "Tränat 300 pass under ett år.", icon: "mountain", xp: 15000, badgeImage: ARSPASS_BADGE_IMG_11, prestige: true, check: () => trainingCountInYear(new Date().getFullYear()) >= 300,
    progress: () => ({ current: trainingCountInYear(new Date().getFullYear()), target: 300 }) },
  { id: "year_gym_50", title: "50 styrkepass", desc: "Tränat 50 styrkepass under ett år.", icon: "dumbbell", xp: 1600, badgeImage: ARSPASS_BADGE_IMG_3, prestige: true, check: () => trainingCountInYearByCategory(new Date().getFullYear(), "gym") >= 50,
    progress: () => ({ current: trainingCountInYearByCategory(new Date().getFullYear(), "gym"), target: 50 }) },
  { id: "year_combo_25", title: "25 + 25", desc: "Tränat minst 25 kampsportspass samt 25 styrkepass under samma år.", icon: "puzzle", xp: 1800, badgeImage: ARSPASS_BADGE_IMG_4, prestige: true,
    check: () => { const y = new Date().getFullYear(); return trainingCountInYearByCategory(y, "kampsport") >= 25 && trainingCountInYearByCategory(y, "gym") >= 25; },
    progress: () => { const y = new Date().getFullYear(); return { parts: [
      { label: "Kampsport", current: trainingCountInYearByCategory(y, "kampsport"), target: 25 },
      { label: "Styrka", current: trainingCountInYearByCategory(y, "gym"), target: 25 },
    ] }; } },
  { id: "year_combo_50", title: "50 + 50", desc: "Tränat minst 50 kampsportspass samt 50 styrkepass under samma år.", icon: "layers", xp: 4200, badgeImage: ARSPASS_BADGE_IMG_7, prestige: true,
    check: () => { const y = new Date().getFullYear(); return trainingCountInYearByCategory(y, "kampsport") >= 50 && trainingCountInYearByCategory(y, "gym") >= 50; },
    progress: () => { const y = new Date().getFullYear(); return { parts: [
      { label: "Kampsport", current: trainingCountInYearByCategory(y, "kampsport"), target: 50 },
      { label: "Styrka", current: trainingCountInYearByCategory(y, "gym"), target: 50 },
    ] }; } },
  { id: "year_combo_100", title: "100 + 100", desc: "Tränat minst 100 kampsportspass samt 100 styrkepass under samma år.", icon: "trophy", xp: 10000, badgeImage: ARSPASS_BADGE_IMG_10, prestige: true,
    check: () => { const y = new Date().getFullYear(); return trainingCountInYearByCategory(y, "kampsport") >= 100 && trainingCountInYearByCategory(y, "gym") >= 100; },
    progress: () => { const y = new Date().getFullYear(); return { parts: [
      { label: "Kampsport", current: trainingCountInYearByCategory(y, "kampsport"), target: 100 },
      { label: "Styrka", current: trainingCountInYearByCategory(y, "gym"), target: 100 },
    ] }; } },

  // Dubbelpass (två pass samma dag)
  { id: "double_day", title: "Dubbelagenten", desc: "Genomför två träningspass samma dag.", icon: "zap", xp: 100, badgeImage: DUBBELPASS_BADGE_IMG_1, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 1,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 1 }) },
  { id: "double_day_5", title: "5 dubbelpass", desc: "Tränat två pass samma dag vid 5 tillfällen.", icon: "flame", xp: 550, badgeImage: DUBBELPASS_BADGE_IMG_4, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 5,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 5 }) },
  { id: "double_day_10", title: "10 dubbelpass", desc: "Tränat två pass samma dag vid 10 tillfällen.", icon: "wind", xp: 900, badgeImage: DUBBELPASS_BADGE_IMG_5, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 10,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 10 }) },
  { id: "double_day_weekend", title: "Helgdubblett", desc: "Tränat två pass samma dag en lördag eller söndag.", icon: "award", xp: 400, badgeImage: DUBBELPASS_BADGE_IMG_6, prestige: true,
    check: () => hasWeekendDoubleSession(),
    progress: () => ({ current: countWeekendDoubleSessions(), target: 1 }) },
  { id: "double_day_2inweek", title: "2 dubbelpass samma vecka", desc: "Tränat dubbelpass vid två tillfällen under samma vecka.", icon: "hourglass", xp: 200, badgeImage: DUBBELPASS_BADGE_IMG_2, prestige: true,
    check: () => maxDoubleSessionDaysInWeek() >= 2,
    progress: () => ({ current: maxDoubleSessionDaysInWeek(), target: 2 }) },
  { id: "double_day_5inmonth", title: "5 dubbelpass på en månad", desc: "Tränat dubbelpass vid fem tillfällen under samma månad.", icon: "calendar", xp: 400, badgeImage: DUBBELPASS_BADGE_IMG_3, prestige: true,
    check: () => maxDoubleSessionDaysInMonth() >= 5,
    progress: () => ({ current: maxDoubleSessionDaysInMonth(), target: 5 }) },
  { id: "double_day_25", title: "25 dubbelpass", desc: "Tränat två pass samma dag vid 25 tillfällen.", icon: "rocket", xp: 1300, badgeImage: DUBBELPASS_BADGE_IMG_7, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 25,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 25 }) },
  { id: "double_day_streak2", title: "Dubbelt upp", desc: "Tränat två dubbelpass två dagar i rad.", icon: "layers", xp: 1800, badgeImage: DUBBELPASS_BADGE_IMG_8, prestige: true,
    check: () => hasConsecutiveDoubleDays(),
    progress: () => ({ current: countConsecutiveDoubleDayPairs(), target: 1 }) },
  { id: "double_day_3inweek", title: "Trippeldubblett", desc: "Tränat dubbelpass vid tre tillfällen under samma vecka.", icon: "target", xp: 2100, badgeImage: DUBBELPASS_BADGE_IMG_9, prestige: true,
    check: () => maxDoubleSessionDaysInWeek() >= 3,
    progress: () => ({ current: maxDoubleSessionDaysInWeek(), target: 3 }) },
  { id: "double_day_50", title: "50 dubbelpass", desc: "Tränat två pass samma dag vid 50 tillfällen.", icon: "diamond", xp: 3100, badgeImage: DUBBELPASS_BADGE_IMG_10, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 50,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 50 }) },
  { id: "double_day_75", title: "75 dubbelpass", desc: "Tränat två pass samma dag vid 75 tillfällen.", icon: "gem", xp: 4700, badgeImage: DUBBELPASS_BADGE_IMG_11, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 75,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 75 }) },
  { id: "double_day_100", title: "100 dubbelpass", desc: "Tränat två pass samma dag vid 100 tillfällen.", icon: "crown", xp: 15000, badgeImage: DUBBELPASS_BADGE_IMG_12, prestige: true,
    check: () => countDoubleSessionDaysAllTime() >= 100,
    progress: () => ({ current: countDoubleSessionDaysAllTime(), target: 100 }) },

  // Streaks
  { id: "streak_3", title: "3 dagar", desc: "Tränat 3 dagar i följd.", icon: "flame", xp: 100, badgeImage: STREAK_BADGE_IMG_1, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 3,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 3 }) },
  { id: "streak_5", title: "5 dagar", desc: "Tränat 5 dagar i följd.", icon: "zap", xp: 200, badgeImage: STREAK_BADGE_IMG_2, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 5,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 5 }) },
  { id: "streak_7", title: "7 dagar", desc: "Tränat 7 dagar i följd.", icon: "sun", xp: 550, badgeImage: STREAK_BADGE_IMG_3, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 7,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 7 }) },
  { id: "streak_10", title: "10 dagar", desc: "Tränat 10 dagar i följd.", icon: "rocket", xp: 1150, badgeImage: STREAK_BADGE_IMG_4, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 10,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 10 }) },
  { id: "streak_15", title: "15 dagar", desc: "Tränat 15 dagar i följd.", icon: "wind", xp: 1500, badgeImage: STREAK_BADGE_IMG_5, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 15,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 15 }) },
  { id: "streak_20", title: "20 dagar", desc: "Tränat 20 dagar i följd.", icon: "volcano", xp: 2100, badgeImage: STREAK_BADGE_IMG_6, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 20,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 20 }) },
  { id: "streak_25", title: "25 dagar", desc: "Tränat 25 dagar i följd.", icon: "mountain", xp: 3100, badgeImage: STREAK_BADGE_IMG_7, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 25,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 25 }) },
  { id: "streak_30", title: "30 dagar", desc: "Tränat 30 dagar i följd.", icon: "comet", xp: 4400, badgeImage: STREAK_BADGE_IMG_8, prestige: true,
    check: () => longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)) >= 30,
    progress: () => ({ current: longestConsecutiveRun(workoutEntries.filter(isTraining).map((e) => e.date)), target: 30 }) },
  { id: "streak_35", title: "35 dagar", desc: "Tränat 35 dagar med max 2 dagars uppehåll mellan varje pass.", icon: "sparkles", xp: 5400, badgeImage: STREAK_BADGE_IMG_9, prestige: true,
    check: () => longestLooseRun(workoutEntries.filter(isTraining).map((e) => e.date), 2) >= 35,
    progress: () => ({ current: longestLooseRun(workoutEntries.filter(isTraining).map((e) => e.date), 2), target: 35 }) },
  { id: "streak_40", title: "40 dagar", desc: "Tränat 40 dagar med max 3 dagars uppehåll mellan varje pass.", icon: "star", xp: 15000, badgeImage: STREAK_BADGE_IMG_10, prestige: true,
    check: () => longestLooseRun(workoutEntries.filter(isTraining).map((e) => e.date), 3) >= 40,
    progress: () => ({ current: longestLooseRun(workoutEntries.filter(isTraining).map((e) => e.date), 3), target: 40 }) },

  // Vecko- och månadsmål
  { id: "week_3", title: "3 pass på en vecka", desc: "3 träningspass under samma vecka.", icon: "run", xp: 50, badgeImage: MANADSMAL_BADGE_IMG_1, prestige: true,
    check: () => maxSessionsInAnyWeek(workoutEntries.filter(isTraining)) >= 3,
    progress: () => ({ current: maxSessionsInAnyWeek(workoutEntries.filter(isTraining)), target: 3 }) },
  { id: "week_5", title: "5 pass på en vecka", desc: "5 träningspass under samma vecka.", icon: "calendar", xp: 300, badgeImage: MANADSMAL_BADGE_IMG_6, prestige: true,
    check: () => maxSessionsInAnyWeek(workoutEntries.filter(isTraining)) >= 5,
    progress: () => ({ current: maxSessionsInAnyWeek(workoutEntries.filter(isTraining)), target: 5 }) },
  { id: "week_7", title: "7 pass på en vecka", desc: "7 träningspass under samma vecka.", icon: "flame", xp: 550, badgeImage: MANADSMAL_BADGE_IMG_10, prestige: true,
    check: () => maxSessionsInAnyWeek(workoutEntries.filter(isTraining)) >= 7,
    progress: () => ({ current: maxSessionsInAnyWeek(workoutEntries.filter(isTraining)), target: 7 }) },
  { id: "week_10", title: "10 pass på en vecka", desc: "10 träningspass under samma vecka.", icon: "target", xp: 1100, badgeImage: MANADSMAL_BADGE_IMG_16, prestige: true,
    check: () => maxSessionsInAnyWeek(workoutEntries.filter(isTraining)) >= 10,
    progress: () => ({ current: maxSessionsInAnyWeek(workoutEntries.filter(isTraining)), target: 10 }) },
  { id: "week_15", title: "Konsekvent i 3 veckor", desc: "Tränat minst 3 pass i veckan, 3 veckor i följd.", icon: "rocket", xp: 1800, badgeImage: MANADSMAL_BADGE_IMG_18, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isTraining), 3, 3),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isTraining), 3), target: 3 }) },
  { id: "month_15", title: "15 pass på en månad", desc: "15 träningspass under samma månad.", icon: "hourglass", xp: 800, badgeImage: MANADSMAL_BADGE_IMG_11, prestige: true,
    check: () => maxSessionsInAnyMonth(workoutEntries.filter(isTraining)) >= 15,
    progress: () => ({ current: maxSessionsInAnyMonth(workoutEntries.filter(isTraining)), target: 15 }) },
  { id: "month_20", title: "20 pass på en månad", desc: "20 träningspass under samma månad.", icon: "wind", xp: 900, badgeImage: MANADSMAL_BADGE_IMG_13, prestige: true,
    check: () => maxSessionsInAnyMonth(workoutEntries.filter(isTraining)) >= 20,
    progress: () => ({ current: maxSessionsInAnyMonth(workoutEntries.filter(isTraining)), target: 20 }) },
  { id: "month_25", title: "25 pass på en månad", desc: "25 träningspass under samma månad.", icon: "star", xp: 1100, badgeImage: MANADSMAL_BADGE_IMG_17, prestige: true,
    check: () => maxSessionsInAnyMonth(workoutEntries.filter(isTraining)) >= 25,
    progress: () => ({ current: maxSessionsInAnyMonth(workoutEntries.filter(isTraining)), target: 25 }) },
  { id: "month_30", title: "30 pass på en månad", desc: "30 träningspass under samma månad.", icon: "trophy", xp: 3400, badgeImage: MANADSMAL_BADGE_IMG_24, prestige: true,
    check: () => maxSessionsInAnyMonth(workoutEntries.filter(isTraining)) >= 30,
    progress: () => ({ current: maxSessionsInAnyMonth(workoutEntries.filter(isTraining)), target: 30 }) },
  { id: "month_35", title: "35 pass på två månader", desc: "35 träningspass under två kalendermånader ihopräknat.", icon: "gem", xp: 3100, badgeImage: MANADSMAL_BADGE_IMG_23, prestige: true,
    check: () => maxSessionsInAnyTwoConsecutiveMonths(workoutEntries.filter(isTraining)) >= 35,
    progress: () => ({ current: maxSessionsInAnyTwoConsecutiveMonths(workoutEntries.filter(isTraining)), target: 35 }) },
  { id: "month_40", title: "Högintensiv i 3 veckor", desc: "Tränat minst 5 pass i veckan, 3 veckor i följd.", icon: "crown", xp: 2400, badgeImage: MANADSMAL_BADGE_IMG_20, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isTraining), 3, 5),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isTraining), 5), target: 3 }) },
  { id: "month_martial_15", title: "15 kampsportspass på en månad", desc: "Tränat minst 15 kampsportspass under samma månad.", icon: "zap", xp: 2100, badgeImage: MANADSMAL_BADGE_IMG_19, prestige: true,
    check: () => maxSessionsInAnyMonthByType(isMartialArts) >= 15,
    progress: () => ({ current: maxSessionsInAnyMonthByType(isMartialArts), target: 15 }) },
  { id: "month_martial_25", title: "2 kampsportspass 3 veckor i rad", desc: "Tränat minst 2 kampsportspass per vecka, 3 veckor i följd.", icon: "medal", xp: 900, badgeImage: MANADSMAL_BADGE_IMG_5, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isMartialArts), 3, 2),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isMartialArts), 2), target: 3 }) },
  { id: "martial_3x3weeks", title: "3 kampsportspass 3 veckor i rad", desc: "Tränat minst 3 kampsportspass per vecka, 3 veckor i följd.", icon: "medal", xp: 2200, badgeImage: MANADSMAL_BADGE_IMG_9, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isMartialArts), 3, 3),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isMartialArts), 3), target: 3 }) },
  { id: "martial_3x4weeks", title: "3 kampsportspass 4 veckor i rad", desc: "Tränat minst 3 kampsportspass per vecka, 4 veckor i följd.", icon: "medal", xp: 3400, badgeImage: MANADSMAL_BADGE_IMG_14, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isMartialArts), 4, 3),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isMartialArts), 3), target: 4 }) },
  { id: "gym_3x4weeks", title: "3 styrkepass 4 veckor i rad", desc: "Tränat minst 3 styrkepass per vecka, 4 veckor i följd.", icon: "dumbbell", xp: 3400, badgeImage: MANADSMAL_BADGE_IMG_15, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isGymType), 4, 3),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isGymType), 3), target: 4 }) },
  { id: "month_gym_10", title: "10 styrkepass på en månad", desc: "Tränat minst 10 styrkepass (t.ex. gym) under samma månad.", icon: "dumbbell", xp: 900, badgeImage: MANADSMAL_BADGE_IMG_12, prestige: true,
    check: () => maxSessionsInAnyMonthByType(isGymType) >= 10,
    progress: () => ({ current: maxSessionsInAnyMonthByType(isGymType), target: 10 }) },
  { id: "month_gym_20", title: "20 styrkepass på en månad", desc: "Tränat minst 20 styrkepass (t.ex. gym) under samma månad.", icon: "mountain", xp: 2800, badgeImage: MANADSMAL_BADGE_IMG_21, prestige: true,
    check: () => maxSessionsInAnyMonthByType(isGymType) >= 20,
    progress: () => ({ current: maxSessionsInAnyMonthByType(isGymType), target: 20 }) },
  { id: "month_martial_gym_combo", title: "10 kampsport + 10 styrka", desc: "Tränat minst 10 kampsportspass och 10 styrkepass under samma månad.", icon: "puzzle", xp: 2900, badgeImage: MANADSMAL_BADGE_IMG_22,
    check: () => {
      const now = new Date();
      const counts = {};
      workoutEntries.filter((e) => isMartialArts(e) || isGymType(e)).forEach((e) => {
        const mo = e.date.slice(0, 7);
        if (!counts[mo]) counts[mo] = { martial: 0, gym: 0 };
        if (isMartialArts(e)) counts[mo].martial++; else counts[mo].gym++;
      });
      return Object.values(counts).some((c) => c.martial >= 10 && c.gym >= 10);
    } },
  { id: "helkropp", title: "Helkropp", desc: "Tränat alla tre gympass (Bröst/Triceps/Axlar, Rygg/Biceps och Ben) under samma vecka.", icon: "puzzle", xp: 100, badgeImage: MANADSMAL_BADGE_IMG_2, prestige: true,
    check: () => hasFullBodyWeek(),
    progress: () => ({ current: countFullBodyWeeks(), target: 1 }) },
  { id: "bingo_line", title: "Första raden", desc: "Fått en rad i Submission-bingo.", icon: "target", xp: 25, badgeImage: BADGE_IMG_BINGO_LINE, prestige: true,
    check: () => bingoLifetimeStats.anyLine, progress: () => ({ current: bingoLifetimeStats.anyLine ? 1 : 0, target: 1 }) },
  { id: "bingo_corners", title: "Fyra hörn", desc: "Fått alla fyra hörn i Submission-bingo.", icon: "puzzle", xp: 25, badgeImage: BADGE_IMG_BINGO_CORNERS, prestige: true,
    check: () => bingoLifetimeStats.anyCorners, progress: () => ({ current: bingoLifetimeStats.anyCorners ? 1 : 0, target: 1 }) },
  { id: "bingo_x", title: "Kryss", desc: "Fått ett kryss (X) i Submission-bingo.", icon: "sparkles", xp: 75, badgeImage: BADGE_IMG_BINGO_X, prestige: true,
    check: () => bingoLifetimeStats.anyX, progress: () => ({ current: bingoLifetimeStats.anyX ? 1 : 0, target: 1 }) },
  { id: "bingo_ring", title: "Ringen", desc: "Fått alla rutor i ytterkanten av Submission-bingo-brickan.", icon: "ring", xp: 100, badgeImage: BADGE_IMG_BINGO_RING, prestige: true,
    check: () => bingoLifetimeStats.anyRing, progress: () => ({ current: bingoLifetimeStats.anyRing ? 1 : 0, target: 1 }) },
  { id: "bingo_full", title: "Full bricka!", desc: "Klarat en hel Submission-bingo-bricka.", icon: "star", xp: 600, badgeImage: BADGE_IMG_BINGO_FULL, prestige: true,
    check: () => bingoLifetimeStats.fullCount >= 1, progress: () => ({ current: bingoLifetimeStats.fullCount, target: 1 }) },
  { id: "bingo_full_5", title: "5 fulla brickor", desc: "Klarat 5 hela Submission-bingo-brickor.", icon: "snowflake", xp: 7500, badgeImage: BADGE_IMG_BINGO_FULL_5, prestige: true,
    check: () => bingoLifetimeStats.fullCount >= 5, progress: () => ({ current: bingoLifetimeStats.fullCount, target: 5 }) },
  { id: "bingo_full_10", title: "10 fulla brickor", desc: "Klarat 10 hela Submission-bingo-brickor.", icon: "flower", xp: 15000, badgeImage: BADGE_IMG_BINGO_FULL_10, prestige: true,
    check: () => bingoLifetimeStats.fullCount >= 10, progress: () => ({ current: bingoLifetimeStats.fullCount, target: 10 }) },
  { id: "bingo_2lines", title: "2 rader", desc: "Fått minst 2 rader i samma Submission-bingo-bricka.", icon: "layers", xp: 75, badgeImage: BADGE_IMG_BINGO_2LINES, prestige: true,
    check: () => (bingoLifetimeStats.lines2Count || 0) >= 1, progress: () => ({ current: bingoLifetimeStats.lines2Count || 0, target: 1 }) },
  { id: "bingo_3lines", title: "3 rader", desc: "Fått minst 3 rader i samma Submission-bingo-bricka.", icon: "gem", xp: 175, badgeImage: BADGE_IMG_BINGO_3LINES, prestige: true,
    check: () => (bingoLifetimeStats.lines3Count || 0) >= 1, progress: () => ({ current: bingoLifetimeStats.lines3Count || 0, target: 1 }) },
  { id: "bingo_2lines_5", title: "2 rader, 5 gånger", desc: "Fått minst 2 rader i en bricka, 5 gånger totalt.", icon: "compass", xp: 250, badgeImage: BADGE_IMG_BINGO_2LINES_5, prestige: true,
    check: () => (bingoLifetimeStats.lines2Count || 0) >= 5, progress: () => ({ current: bingoLifetimeStats.lines2Count || 0, target: 5 }) },
  { id: "bingo_3lines_5", title: "3 rader, 5 gånger", desc: "Fått minst 3 rader i en bricka, 5 gånger totalt.", icon: "diamond", xp: 450, badgeImage: BADGE_IMG_BINGO_3LINES_5, prestige: true,
    check: () => (bingoLifetimeStats.lines3Count || 0) >= 5, progress: () => ({ current: bingoLifetimeStats.lines3Count || 0, target: 5 }) },
  { id: "bingo_corners_5", title: "Fyra hörn, 5 gånger", desc: "Fått alla fyra hörn, 5 gånger totalt.", icon: "award", xp: 100, badgeImage: BADGE_IMG_BINGO_CORNERS_5, prestige: true,
    check: () => (bingoLifetimeStats.cornersCount || 0) >= 5, progress: () => ({ current: bingoLifetimeStats.cornersCount || 0, target: 5 }) },
  { id: "bingo_corners_10", title: "Fyra hörn, 10 gånger", desc: "Fått alla fyra hörn, 10 gånger totalt.", icon: "crown", xp: 200, badgeImage: BADGE_IMG_BINGO_CORNERS_10, prestige: true,
    check: () => (bingoLifetimeStats.cornersCount || 0) >= 10, progress: () => ({ current: bingoLifetimeStats.cornersCount || 0, target: 10 }) },
  { id: "bingo_x_5", title: "Kryss, 5 gånger", desc: "Fått ett kryss (X), 5 gånger totalt.", icon: "comet", xp: 250, badgeImage: BADGE_IMG_BINGO_X_5, prestige: true,
    check: () => (bingoLifetimeStats.xCount || 0) >= 5, progress: () => ({ current: bingoLifetimeStats.xCount || 0, target: 5 }) },
  { id: "bingo_x_10", title: "Kryss, 10 gånger", desc: "Fått ett kryss (X), 10 gånger totalt.", icon: "rocket", xp: 450, badgeImage: BADGE_IMG_BINGO_X_10, prestige: true,
    check: () => (bingoLifetimeStats.xCount || 0) >= 10, progress: () => ({ current: bingoLifetimeStats.xCount || 0, target: 10 }) },
  { id: "month_cardio_5", title: "5 konditionspass på en månad", desc: "Tränat minst 5 konditionspass under samma månad.", icon: "battery", xp: 150, badgeImage: MANADSMAL_BADGE_IMG_3, prestige: true,
    check: () => maxSessionsInAnyMonthByType(isCardio) >= 5,
    progress: () => ({ current: maxSessionsInAnyMonthByType(isCardio), target: 5 }) },
  { id: "month_cardio_10", title: "10 konditionspass på en månad", desc: "Tränat minst 10 konditionspass under samma månad.", icon: "comet", xp: 350, badgeImage: MANADSMAL_BADGE_IMG_7, prestige: true,
    check: () => maxSessionsInAnyMonthByType(isCardio) >= 10,
    progress: () => ({ current: maxSessionsInAnyMonthByType(isCardio), target: 10 }) },
  { id: "week_all_three", title: "Kondition, kampsport och styrka i samma vecka", desc: "Tränat minst ett pass kondition, kampsport och styrka under samma vecka.", icon: "sparkles", xp: 200, badgeImage: MANADSMAL_BADGE_IMG_4, prestige: true,
    check: () => hasAllThreeCategoriesInAnyWeek(1),
    progress: () => ({ current: countWeeksWithAllThreeCategories(1), target: 1 }) },
  { id: "month_all_three", title: "3 av varje under en månad", desc: "Tränat minst 3 pass kondition, kampsport och styrka under samma månad.", icon: "layers", xp: 450, badgeImage: MANADSMAL_BADGE_IMG_8, prestige: true,
    check: () => hasAllThreeCategoriesInAnyMonth(3),
    progress: () => ({ current: countMonthsWithAllThreeCategories(3), target: 1 }) },

  // Övriga prestationer
  { id: "variety", title: "Mångsidig", desc: "Provat minst 4 olika träningstyper.", icon: "shuffle", xp: 150, badgeImage: OVRIGA_BADGE_IMG_2, prestige: true,
    check: () => new Set(workoutEntries.filter(isTraining).map((e) => e.type)).size >= 4,
    progress: () => ({ current: new Set(workoutEntries.filter(isTraining).map((e) => e.type)).size, target: 4 }) },
  { id: "allround", title: "Allround-atlet", desc: "Logga minst ett pass för varje träningskategori.", icon: "puzzle", xp: 1100, badgeImage: OVRIGA_BADGE_IMG_12, prestige: true,
    check: () => allTrainingTypesUsed() },
  { id: "hours_10", title: "10 timmar", desc: "Samla 10 timmars träning totalt.", icon: "clock", xp: 100, badgeImage: TRANINGSTID_BADGE_IMG_1, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 600,
    progress: () => ({ current: totalTrainingMinutes(), target: 600 }) },
  { id: "hours_25", title: "25 timmar", desc: "Samla 25 timmars träning totalt.", icon: "hourglass", xp: 900, badgeImage: TRANINGSTID_BADGE_IMG_4, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 1500,
    progress: () => ({ current: totalTrainingMinutes(), target: 1500 }) },
  { id: "hours_50", title: "50 timmar", desc: "Samla 50 timmars träning totalt.", icon: "battery", xp: 1300, badgeImage: TRANINGSTID_BADGE_IMG_6, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 3000,
    progress: () => ({ current: totalTrainingMinutes(), target: 3000 }) },
  { id: "hours_100", title: "100 timmar", desc: "Samla 100 timmars träning totalt.", icon: "heart", xp: 2500, badgeImage: TRANINGSTID_BADGE_IMG_12, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 6000,
    progress: () => ({ current: totalTrainingMinutes(), target: 6000 }) },
  { id: "hours_250", title: "250 timmar", desc: "Samla 250 timmars träning totalt.", icon: "flame", xp: 4700, badgeImage: TRANINGSTID_BADGE_IMG_13, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 15000,
    progress: () => ({ current: totalTrainingMinutes(), target: 15000 }) },
  { id: "hours_500", title: "500 timmar", desc: "Samla 500 timmars träning totalt.", icon: "gem", xp: 6800, badgeImage: TRANINGSTID_BADGE_IMG_14, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 30000,
    progress: () => ({ current: totalTrainingMinutes(), target: 30000 }) },
  { id: "hours_750", title: "750 timmar", desc: "Samla 750 timmars träning totalt.", icon: "diamond", xp: 9400, badgeImage: TRANINGSTID_BADGE_IMG_15, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 45000,
    progress: () => ({ current: totalTrainingMinutes(), target: 45000 }) },
  { id: "hours_1000", title: "1000 timmar", desc: "Samla 1000 timmars träning totalt.", icon: "crown", xp: 9600, badgeImage: TRANINGSTID_BADGE_IMG_16, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 60000,
    progress: () => ({ current: totalTrainingMinutes(), target: 60000 }) },
  { id: "hours_1500", title: "1500 timmar", desc: "Samla 1500 timmars träning totalt.", icon: "sparkles", xp: 10800, badgeImage: TRANINGSTID_BADGE_IMG_17, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 90000,
    progress: () => ({ current: totalTrainingMinutes(), target: 90000 }) },
  { id: "hours_2000", title: "2000 timmar", desc: "Samla 2000 timmars träning totalt.", icon: "trophy", xp: 15000, badgeImage: TRANINGSTID_BADGE_IMG_18, prestige: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 120000,
    progress: () => ({ current: totalTrainingMinutes(), target: 120000 }) },
  { id: "hours_week_5", title: "5 timmar på en vecka", desc: "Loggat minst 5 timmars träning under samma vecka.", icon: "target", xp: 450, badgeImage: TRANINGSTID_BADGE_IMG_2, prestige: true,
    check: () => maxMinutesInAnyWeek(isTraining) >= 300,
    progress: () => ({ current: maxMinutesInAnyWeek(isTraining), target: 300 }) },
  { id: "hours_week_10", title: "10 timmar på en vecka", desc: "Loggat minst 10 timmars träning under samma vecka.", icon: "rocket", xp: 1250, badgeImage: TRANINGSTID_BADGE_IMG_5, prestige: true,
    check: () => maxMinutesInAnyWeek(isTraining) >= 600,
    progress: () => ({ current: maxMinutesInAnyWeek(isTraining), target: 600 }) },
  { id: "hours_month_25", title: "25 timmar på en månad", desc: "Loggat minst 25 timmars träning under samma månad.", icon: "calendar", xp: 2100, badgeImage: TRANINGSTID_BADGE_IMG_9, prestige: true,
    check: () => maxMinutesInAnyMonth(isTraining) >= 1500,
    progress: () => ({ current: maxMinutesInAnyMonth(isTraining), target: 1500 }) },
  { id: "hours_cardio_5", title: "5 timmar kondition", desc: "Samla 5 timmars konditionsträning totalt.", icon: "run", xp: 550, badgeImage: TRANINGSTID_BADGE_IMG_3, prestige: true,
    check: () => totalMinutes(isCardio) >= 300,
    progress: () => ({ current: totalMinutes(isCardio), target: 300 }) },
  { id: "hours_gym_25", title: "25 timmar styrka", desc: "Samla 25 timmars styrketräning totalt.", icon: "dumbbell", xp: 1700, badgeImage: TRANINGSTID_BADGE_IMG_7, prestige: true,
    check: () => totalMinutes(isGymType) >= 1500,
    progress: () => ({ current: totalMinutes(isGymType), target: 1500 }) },
  { id: "hours_martial_25", title: "25 timmar kampsport", desc: "Samla 25 timmars kampsportsträning totalt.", icon: "zap", xp: 1700, badgeImage: TRANINGSTID_BADGE_IMG_8, prestige: true,
    check: () => totalMinutes(isMartialArts) >= 1500,
    progress: () => ({ current: totalMinutes(isMartialArts), target: 1500 }) },
  { id: "hours_martial_50", title: "50 timmar kampsport", desc: "Samla 50 timmars kampsportsträning totalt.", icon: "mountain", xp: 2200, badgeImage: TRANINGSTID_BADGE_IMG_10, prestige: true,
    check: () => totalMinutes(isMartialArts) >= 3000,
    progress: () => ({ current: totalMinutes(isMartialArts), target: 3000 }) },
  { id: "hours_gym_50", title: "50 timmar styrka", desc: "Samla 50 timmars styrketräning totalt.", icon: "puzzle", xp: 2200, badgeImage: TRANINGSTID_BADGE_IMG_11, prestige: true,
    check: () => totalMinutes(isGymType) >= 3000,
    progress: () => ({ current: totalMinutes(isGymType), target: 3000 }) },
  { id: "calorie_week", title: "Kalorier i en vecka", desc: "Loggat kalorier 7 dagar i följd.", icon: "apple", xp: 150, badgeImage: OVRIGA_BADGE_IMG_3, prestige: true,
    check: () => longestConsecutiveRun(calorieLog.map((e) => e.date)) >= 7,
    progress: () => ({ current: longestConsecutiveRun(calorieLog.map((e) => e.date)), target: 7 }) },
  { id: "weekend_warrior", title: "Helgkrigaren", desc: "Tränat både lördag och söndag samma helg.", icon: "award", xp: 150, badgeImage: OVRIGA_BADGE_IMG_5, prestige: true,
    check: () => trainedBothWeekendDays(),
    progress: () => ({ current: countBothWeekendDays(), target: 1 }) },
  { id: "weekend_warrior_10", title: "Helgkrigaren²", desc: "Tränat både lördag och söndag samma helg vid minst 10 tillfällen.", icon: "medal", xp: 1800, badgeImage: OVRIGA_BADGE_IMG_14, prestige: true,
    check: () => countBothWeekendDays() >= 10,
    progress: () => ({ current: countBothWeekendDays(), target: 10 }) },
  { id: "fredagsmys", title: "Fredagsmys", desc: "Tränat 10 fredagar.", icon: "bed", xp: 300, badgeImage: OVRIGA_BADGE_IMG_13, prestige: true,
    check: () => workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 5).length >= 10,
    progress: () => ({ current: workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 5).length, target: 10 }) },
  { id: "advanced_evaluation", title: "Avancerad utvärdering", desc: "Utvärderat ett BJJ- eller SW-pass med avancerad meny (1–10).", icon: "star", xp: 50, badgeImage: OVRIGA_BADGE_IMG_1,
    check: () => workoutEntries.some((e) => (e.type === "BJJ" || e.type === "SW") && e.note && /\d+\/10/.test(e.note)) },
  { id: "summer_warrior", title: "Sommarkrigaren", desc: "30 pass under juni–augusti.", icon: "sun", xp: 2100, badgeImage: OVRIGA_BADGE_IMG_15, prestige: true,
    check: () => maxSessionsInSeason(6, 8) >= 30,
    progress: () => ({ current: maxSessionsInSeason(6, 8), target: 30 }) },
  { id: "winter_warrior", title: "Vinterkrigaren", desc: "30 pass under december–februari.", icon: "snowflake", xp: 2100, badgeImage: OVRIGA_BADGE_IMG_16, prestige: true,
    check: () => maxSessionsInWinterSeason() >= 30,
    progress: () => ({ current: maxSessionsInWinterSeason(), target: 30 }) },
  { id: "extreme_consistency", title: "Extrem konsekvens", desc: "Tränat minst en gång varje vecka i ett helt år.", icon: "calendarCheck", xp: 6800, badgeImage: OVRIGA_BADGE_IMG_18, prestige: true,
    check: () => longestConsecutiveRunStep(workoutEntries.filter(isTraining).map((e) => mondayOf(e.date)), 7) >= 52,
    progress: () => ({ current: longestConsecutiveRunStep(workoutEntries.filter(isTraining).map((e) => mondayOf(e.date)), 7), target: 52 }) },
  { id: "marathon_trainer", title: "Maratontränaren", desc: "100 pass utan att missa mer än tre dagar i rad.", icon: "run", xp: 4400, badgeImage: OVRIGA_BADGE_IMG_17, prestige: true,
    check: () => longestLooseRun(workoutEntries.filter(isTraining).map((e) => e.date), 3) >= 100,
    progress: () => ({ current: longestLooseRun(workoutEntries.filter(isTraining).map((e) => e.date), 3), target: 100 }) },
  { id: "variety_2", title: "Mångsidig²", desc: "Tränat minst 4 olika träningstyper, minst 5 gånger var.", icon: "layers", xp: 350, badgeImage: OVRIGA_BADGE_IMG_9,
    check: () => {
      const counts = {};
      workoutEntries.filter(isTraining).forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
      return Object.values(counts).filter((c) => c >= 5).length >= 4;
    } },
  { id: "calorie_30", title: "30 kaloriloggningar", desc: "Loggat kalorier totalt 30 gånger.", icon: "battery", xp: 150, badgeImage: OVRIGA_BADGE_IMG_4, prestige: true,
    check: () => calorieLog.length >= 30,
    progress: () => ({ current: calorieLog.length, target: 30 }) },
  { id: "fredagsmys_2", title: "Fredagsmys²", desc: "Tränat 20 fredagar.", icon: "sparkles", xp: 700, badgeImage: OVRIGA_BADGE_IMG_10, prestige: true,
    check: () => workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 5).length >= 20,
    progress: () => ({ current: workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 5).length, target: 20 }) },
  { id: "fartdaren", title: "Fartdåren", desc: "Sprungit med en snitthastighet över 10 km/h (under 6:00 min/km).", icon: "zap", xp: 300, badgeImage: OVRIGA_BADGE_IMG_7,
    check: () => workoutEntries.some((e) => e.type === "Löpning" && parsedSpeedKmh(e) > 10) },
  { id: "fartcyklisten", title: "Fartcyklisten", desc: "Kört motionscykel med en snitthastighet över 30 km/h (under 2:00 min/km).", icon: "wind", xp: 300, badgeImage: OVRIGA_BADGE_IMG_8,
    check: () => workoutEntries.some((e) => e.type === "Motionscykel" && parsedSpeedKmh(e) > 30) },
  { id: "lordagsgodis", title: "Lördagsgodis", desc: "Tränat 10 lördagar.", icon: "gift", xp: 300, badgeImage: OVRIGA_BADGE_IMG_6, prestige: true,
    check: () => workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 6).length >= 10,
    progress: () => ({ current: workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 6).length, target: 10 }) },
  { id: "lordagsgodis_2", title: "Lördagsgodis²", desc: "Tränat 20 lördagar.", icon: "trophy", xp: 700, badgeImage: OVRIGA_BADGE_IMG_11, prestige: true,
    check: () => workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 6).length >= 20,
    progress: () => ({ current: workoutEntries.filter((e) => isTraining(e) && new Date(e.date + "T00:00:00").getDay() === 6).length, target: 20 }) },

  // Kondition (Cykel, Motionscykel, Löpning)
  { id: "cardio_first", title: "Första konditionspasset", desc: "Loggat ditt första konditionspass (cykel, motionscykel eller löpning).", icon: "run", xp: 50, badgeImage: KONDITION_BADGE_IMG_1,
    check: () => workoutEntries.some(isCardio) },
  { id: "cardio_10", title: "10 konditionspass", desc: "Loggat 10 konditionspass totalt.", icon: "wind", xp: 150, badgeImage: KONDITION_BADGE_IMG_2, prestige: true,
    check: () => workoutEntries.filter(isCardio).length >= 10,
    progress: () => ({ current: workoutEntries.filter(isCardio).length, target: 10 }) },
  { id: "jogging_5", title: "Sprungit 5 gånger", desc: "Tränat löpning 5 gånger totalt.", icon: "target", xp: 350, badgeImage: KONDITION_BADGE_IMG_3, prestige: true,
    check: () => workoutEntries.filter((e) => e.type === "Löpning").length >= 5,
    progress: () => ({ current: workoutEntries.filter((e) => e.type === "Löpning").length, target: 5 }) },
  { id: "cardio_25", title: "25 konditionspass", desc: "Loggat 25 konditionspass totalt.", icon: "flame", xp: 700, badgeImage: KONDITION_BADGE_IMG_4, prestige: true,
    check: () => workoutEntries.filter(isCardio).length >= 25,
    progress: () => ({ current: workoutEntries.filter(isCardio).length, target: 25 }) },
  { id: "loparen", title: "Löparen", desc: "Sprungit 3 gånger under samma vecka.", icon: "zap", xp: 900, badgeImage: KONDITION_BADGE_IMG_5, prestige: true,
    check: () => maxSessionsInAnyWeek(workoutEntries.filter((e) => e.type === "Löpning")) >= 3,
    progress: () => ({ current: maxSessionsInAnyWeek(workoutEntries.filter((e) => e.type === "Löpning")), target: 3 }) },
  { id: "jogging_10", title: "Sprungit 10 gånger", desc: "Tränat löpning 10 gånger totalt.", icon: "mountain", xp: 900, badgeImage: KONDITION_BADGE_IMG_6, prestige: true,
    check: () => workoutEntries.filter((e) => e.type === "Löpning").length >= 10,
    progress: () => ({ current: workoutEntries.filter((e) => e.type === "Löpning").length, target: 10 }) },
  { id: "cyklisten", title: "Cyklisten", desc: "Loggat 25 cykel- eller motionscykelpass totalt.", icon: "compass", xp: 1100, badgeImage: KONDITION_BADGE_IMG_7, prestige: true,
    check: () => workoutEntries.filter((e) => e.type === "Cykel" || e.type === "Motionscykel").length >= 25,
    progress: () => ({ current: workoutEntries.filter((e) => e.type === "Cykel" || e.type === "Motionscykel").length, target: 25 }) },
  { id: "cardio_50", title: "50 konditionspass", desc: "Loggat 50 konditionspass totalt.", icon: "star", xp: 1300, badgeImage: KONDITION_BADGE_IMG_8, prestige: true,
    check: () => workoutEntries.filter(isCardio).length >= 50,
    progress: () => ({ current: workoutEntries.filter(isCardio).length, target: 50 }) },
  { id: "jogging_25", title: "Sprungit 25 gånger", desc: "Tränat löpning 25 gånger totalt.", icon: "comet", xp: 1700, badgeImage: KONDITION_BADGE_IMG_9, prestige: true,
    check: () => workoutEntries.filter((e) => e.type === "Löpning").length >= 25,
    progress: () => ({ current: workoutEntries.filter((e) => e.type === "Löpning").length, target: 25 }) },
  { id: "cardio_streak_3w", title: "Kondition i 3 veckor", desc: "Tränat kondition minst en gång i veckan, 3 veckor i följd.", icon: "rocket", xp: 1700, badgeImage: KONDITION_BADGE_IMG_10, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isCardio), 3, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isCardio), 1), target: 3 }) },
  { id: "cyklisten_50", title: "50 cykelpass", desc: "Loggat 50 cykel- eller motionscykelpass totalt.", icon: "battery", xp: 2100, badgeImage: KONDITION_BADGE_IMG_11, prestige: true,
    check: () => workoutEntries.filter((e) => e.type === "Cykel" || e.type === "Motionscykel").length >= 50,
    progress: () => ({ current: workoutEntries.filter((e) => e.type === "Cykel" || e.type === "Motionscykel").length, target: 50 }) },
  { id: "cardio_streak_4w", title: "Kondition i 4 veckor", desc: "Tränat kondition minst en gång i veckan, 4 veckor i följd.", icon: "volcano", xp: 2500, badgeImage: KONDITION_BADGE_IMG_12, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isCardio), 4, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isCardio), 1), target: 4 }) },
  { id: "cardio_100", title: "100 konditionspass", desc: "Loggat 100 konditionspass totalt.", icon: "medal", xp: 2900, badgeImage: KONDITION_BADGE_IMG_13, prestige: true,
    check: () => workoutEntries.filter(isCardio).length >= 100,
    progress: () => ({ current: workoutEntries.filter(isCardio).length, target: 100 }) },
  { id: "cardio_streak_5w", title: "Kondition i 5 veckor", desc: "Tränat kondition minst en gång i veckan, 5 veckor i följd.", icon: "gem", xp: 2900, badgeImage: KONDITION_BADGE_IMG_14, prestige: true,
    check: () => hasConsecutiveWeeksWithMin(workoutEntries.filter(isCardio), 5, 1),
    progress: () => ({ current: longestConsecutiveWeeksWithMin(workoutEntries.filter(isCardio), 1), target: 5 }) },
  { id: "cardio_150", title: "150 konditionspass", desc: "Loggat 150 konditionspass totalt.", icon: "crown", xp: 5000, badgeImage: KONDITION_BADGE_IMG_15, prestige: true,
    check: () => workoutEntries.filter(isCardio).length >= 150,
    progress: () => ({ current: workoutEntries.filter(isCardio).length, target: 150 }) },

  // Submissions
  { id: "submission_first", title: "Första submission", desc: "Loggat din första submission.", icon: "trophy", xp: 25, badgeImage: SUBMISSION_BADGE_IMG_1,
    check: () => workoutEntries.some((e) => e.submissions && e.submissions.length > 0) },
  { id: "choke_wizard", title: "Choke Wizard", desc: "Fått in alla Chokes på listan.", icon: "wind", xp: 1500, badgeImage: SUBMISSION_BADGE_IMG_12, prestige: true,
    check: () => {
      const enabled = submissionTypes.filter((s) => s.enabled && s.category === "chokes");
      if (!enabled.length) return false;
      const counts = {};
      workoutEntries.forEach((e) => { (e.submissions || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); });
      return enabled.every((s) => (counts[s.id] || 0) >= 1);
    } },
  { id: "armbar_wizard", title: "Armbar Wizard", desc: "Fått in alla Armbars på listan!", icon: "zap", xp: 1500, badgeImage: SUBMISSION_BADGE_IMG_13, prestige: true,
    check: () => {
      const enabled = submissionTypes.filter((s) => s.enabled && s.category === "armlocks");
      if (!enabled.length) return false;
      const counts = {};
      workoutEntries.forEach((e) => { (e.submissions || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); });
      return enabled.every((s) => (counts[s.id] || 0) >= 1);
    } },
  { id: "leglock_lunatic", title: "Leglock Lunatic", desc: "Fått in alla Ben- och fotlås på listan!", icon: "mountain", xp: 1500, badgeImage: SUBMISSION_BADGE_IMG_14, prestige: true,
    check: () => {
      const enabled = submissionTypes.filter((s) => s.enabled && s.category === "leglocks");
      if (!enabled.length) return false;
      const counts = {};
      workoutEntries.forEach((e) => { (e.submissions || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); });
      return enabled.every((s) => (counts[s.id] || 0) >= 1);
    } },
  { id: "twister_twister", title: "Twister Twister", desc: "Fått in Twister!", icon: "sparkles", xp: 500, badgeImage: SUBMISSION_BADGE_IMG_10,
    check: () => workoutEntries.some((e) => e.submissions && e.submissions.includes("twister")) },
  { id: "submission_one_of_each", title: "One to rule them all", desc: "Fått in alla submissions i listan!", icon: "crown", xp: 10000, badgeImage: SUBMISSION_BADGE_IMG_15, prestige: true,
    check: () => {
      const enabled = submissionTypes.filter((s) => s.enabled);
      if (!enabled.length) return false;
      const counts = {};
      workoutEntries.forEach((e) => { (e.submissions || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); });
      return enabled.every((s) => (counts[s.id] || 0) >= 1);
    } },
  { id: "triple_threat", title: "Trippelhot", desc: "Fått in en armbar, ett strypgrepp och ett benlås under samma pass.", icon: "zap", xp: 100, badgeImage: SUBMISSION_BADGE_IMG_5, prestige: true,
    check: () => trippelhotSessionCount() >= 1, progress: () => ({ current: trippelhotSessionCount(), target: 1 }) },
  { id: "triple_threat_3", title: "Trippelhot x3", desc: "Klarat Trippelhot (armbar, strypgrepp och benlås samma pass) 3 olika pass.", icon: "flame", xp: 250, badgeImage: SUBMISSION_BADGE_IMG_9, prestige: true,
    check: () => trippelhotSessionCount() >= 3, progress: () => ({ current: trippelhotSessionCount(), target: 3 }) },
  { id: "triple_threat_5", title: "Trippelhot x5", desc: "Klarat Trippelhot (armbar, strypgrepp och benlås samma pass) 5 olika pass.", icon: "volcano", xp: 500, badgeImage: SUBMISSION_BADGE_IMG_11, prestige: true,
    check: () => trippelhotSessionCount() >= 5, progress: () => ({ current: trippelhotSessionCount(), target: 5 }) },
  { id: "choke_combo", title: "Choke-combo", desc: "Fått in 2 olika chokes under samma pass.", icon: "wind", xp: 50, badgeImage: SUBMISSION_BADGE_IMG_2, prestige: true,
    check: () => comboSessionCount("chokes") >= 1, progress: () => ({ current: comboSessionCount("chokes"), target: 1 }) },
  { id: "choke_combo_5", title: "Choke-combo x5", desc: "Klarat Choke-combo (2 olika chokes samma pass) 5 olika pass.", icon: "hourglass", xp: 250, badgeImage: SUBMISSION_BADGE_IMG_6, prestige: true,
    check: () => comboSessionCount("chokes") >= 5, progress: () => ({ current: comboSessionCount("chokes"), target: 5 }) },
  { id: "armbar_combo", title: "Armbar-combo", desc: "Fått in 2 olika armbars under samma pass.", icon: "battery", xp: 50, badgeImage: SUBMISSION_BADGE_IMG_3, prestige: true,
    check: () => comboSessionCount("armlocks") >= 1, progress: () => ({ current: comboSessionCount("armlocks"), target: 1 }) },
  { id: "armbar_combo_5", title: "Armbar-combo x5", desc: "Klarat Armbar-combo (2 olika armbars samma pass) 5 olika pass.", icon: "bed", xp: 250, badgeImage: SUBMISSION_BADGE_IMG_7, prestige: true,
    check: () => comboSessionCount("armlocks") >= 5, progress: () => ({ current: comboSessionCount("armlocks"), target: 5 }) },
  { id: "leg_combo", title: "Leg-combo", desc: "Fått in 2 olika ben- eller fotlås under samma pass.", icon: "mountain", xp: 50, badgeImage: SUBMISSION_BADGE_IMG_4, prestige: true,
    check: () => comboSessionCount("leglocks") >= 1, progress: () => ({ current: comboSessionCount("leglocks"), target: 1 }) },
  { id: "leg_combo_5", title: "Leg-combo x5", desc: "Klarat Leg-combo (2 olika ben-/fotlås samma pass) 5 olika pass.", icon: "rabbit", xp: 250, badgeImage: SUBMISSION_BADGE_IMG_8, prestige: true,
    check: () => comboSessionCount("leglocks") >= 5, progress: () => ({ current: comboSessionCount("leglocks"), target: 5 }) },

  // Hemliga prestationer
  { id: "julhjalten", title: "Julhjälten", desc: "Träna på julafton.", hint: "En särskild kväll i december...", icon: "gift", xp: 3000, badgeImage: BADGE_IMG_JULHJALTEN, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "12-24") },
  { id: "avsluta_starkt", title: "Avsluta starkt", desc: "Träna 31 december.", hint: "Sista chansen innan klockan slår tolv.", icon: "sparkles", xp: 3000, badgeImage: BADGE_IMG_AVSLUTA_STARKT, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "12-31") },
  { id: "nyarsloftet", title: "Nyårslöftet", desc: "Träna den 1 januari.", hint: "Ett nytt år, ett nytt löfte.", icon: "sun", xp: 3000, badgeImage: BADGE_IMG_NYARSLOFTET, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "01-01") },
  { id: "midsommarkrigaren", title: "Midsommarkrigaren", desc: "Träna på midsommarafton.", hint: "En svensk sommarafton i juni.", icon: "flower", xp: 3000, badgeImage: BADGE_IMG_MIDSOMMARKRIGAREN, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && isMidsummerEve(e.date)) },
  { id: "lucky777", title: "Lucky 777", desc: "Samla 777 timmars träning totalt.", hint: "Turen är på din sida vid ett visst antal.", icon: "gem", xp: 15000, badgeImage: BADGE_IMG_LUCKY777, secret: true, unit: "hours",
    check: () => totalTrainingMinutes() >= 46620,
    progress: () => ({ current: totalTrainingMinutes(), target: 46620 }) },
  { id: "beast_mode", title: "Beast Mode", desc: "Genomför ett pass som varar över 120 min.", hint: "Ett pass som verkligen tar tid.", icon: "mountain", xp: 3000, badgeImage: BADGE_IMG_BEAST_MODE, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.minutes > 120) },
  { id: "blixtsnabb", title: "Blixtsnabb", desc: "Genomför ett träningspass på under 25 minuter.", hint: "Snabbt och effektivt.", icon: "zap", xp: 2000, badgeImage: BADGE_IMG_BLIXTSNABB, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.minutes > 0 && e.minutes < 25) },
  { id: "paskharen", title: "Påskharen", desc: "Träna på påskafton.", hint: "En vårhelg med ägg och harar.", icon: "rabbit", xp: 3000, badgeImage: BADGE_IMG_PASKHAREN, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && isEasterEve(e.date)) },
  { id: "trippelpasset", title: "Trippelpasset", desc: "Logga tre pass samma dag.", hint: "Tre gånger samma dag.", icon: "layers", xp: 5000, badgeImage: BADGE_IMG_TRIPPELPASSET, secret: true,
    check: () => {
      const counts = {};
      workoutEntries.filter(isTraining).forEach((e) => { counts[e.date] = (counts[e.date] || 0) + 1; });
      return Object.values(counts).some((c) => c >= 3);
    } },
  { id: "num_of_beast", title: "Number of the beast", desc: "Loggat 666 pass.", hint: "Ett ökänt tal dyker upp i din logg.", icon: "flame", xp: 12500, badgeImage: BADGE_IMG_NUM_OF_BEAST, secret: true,
    check: () => workoutEntries.filter(isTraining).length >= 666,
    progress: () => ({ current: workoutEntries.filter(isTraining).length, target: 666 }) },
  { id: "mattias_birthday", title: "Mattias Födelsedag!", desc: "Appens grundare fyller år.", hint: "Grundarens stora dag, i april.", icon: "star", xp: 3000, badgeImage: BADGE_IMG_MATTIAS_BIRTHDAY, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "04-26") },
  { id: "lo_birthday", title: "Los Födelsedag!", desc: "Mattias barn Lo fyller år.", hint: "Någon liten i familjen firar, i januari.", icon: "heart", xp: 3000, badgeImage: BADGE_IMG_LO_BIRTHDAY, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "01-07") },
  { id: "luna_birthday", title: "Lunas Födelsedag!", desc: "Mattias barn Luna fyller år.", hint: "Ännu en i familjen firar, i mars.", icon: "medal", xp: 3000, badgeImage: BADGE_IMG_LUNA_BIRTHDAY, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "03-05") },
  { id: "datumjagaren", title: "Datumjägaren", desc: "Träna den 14:e i månaden tre gånger.", hint: "Vissa datum återkommer om man håller ögonen öppna.", icon: "target", xp: 2500, badgeImage: BADGE_IMG_DATUMJAGAREN, secret: true,
    check: () => workoutEntries.filter((e) => isTraining(e) && e.date.slice(8, 10) === "14").length >= 3 },
  { id: "pionjaren", title: "Pionjären", desc: "Skapat ett eget träningspass och tränat det minst 10 gånger.", hint: "Bana din egen väg.", icon: "compass", xp: 5000, badgeImage: BADGE_IMG_PIONJAREN, secret: true,
    check: () => {
      const defaultKeys = DEFAULT_TRAINING_TYPES.map((t) => t.key);
      const customKeys = trainingTypes.filter((t) => !defaultKeys.includes(t.key)).map((t) => t.key);
      if (!customKeys.length) return false;
      const counts = {};
      workoutEntries.forEach((e) => { if (customKeys.includes(e.type)) counts[e.type] = (counts[e.type] || 0) + 1; });
      return Object.values(counts).some((c) => c >= 10);
    } },
  { id: "black_belt_day", title: "Black belt!", desc: "Grundaren av appen fick sitt svarta bälte 13 juli 2019.", hint: "Black belt day, i juli.", icon: "crown", xp: 3000, badgeImage: BADGE_IMG_BLACK_BELT_DAY, secret: true,
    check: () => workoutEntries.some((e) => isTraining(e) && e.date.slice(5) === "07-13") },

  /* ---------------- New Game+-prestationer (efter 100%) ----------------
     Listan/kraven/bilderna kommer från Mattias egen speclista + uppladdade
     badge-bilder. prestige:true som befintliga - samma mål upprepas
     oändligt när man klarar det igen. newGamePlus:true så de INTE räknas
     med i platina-kravet (se isAllAchievementsUnlocked). "Perfect Month/
     Quarter/Year" tolkas som en svit av veckor där alla veckoutmaningar
     klarades (~4/13/52 veckor) - se longestPerfectWeeklyChallengeStreak. */
  { id: "ngp_iron_century", title: "Iron Century", desc: "Genomför 100 styrkepass.", icon: "dumbbell", xp: 10000, badgeImage: NGP_IMG_IRON_CENTURY, prestige: true, newGamePlus: true,
    check: () => workoutEntries.filter(isGymType).length >= 100,
    progress: () => ({ current: workoutEntries.filter(isGymType).length, target: 100 }) },
  { id: "ngp_combat_century", title: "Combat Century", desc: "Genomför 100 kampsportspass.", icon: "belt", xp: 10000, badgeImage: NGP_IMG_COMBAT_CENTURY, prestige: true, newGamePlus: true,
    check: () => workoutEntries.filter(isMartialArts).length >= 100,
    progress: () => ({ current: workoutEntries.filter(isMartialArts).length, target: 100 }) },
  { id: "ngp_cardio_century", title: "Cardio Century", desc: "Genomför 100 konditionspass.", icon: "runner", xp: 10000, badgeImage: NGP_IMG_CARDIO_CENTURY, prestige: true, newGamePlus: true,
    check: () => workoutEntries.filter(isCardio).length >= 100,
    progress: () => ({ current: workoutEntries.filter(isCardio).length, target: 100 }) },
  { id: "ngp_100", title: "NG+ 100", desc: "Genomför 100 träningspass i New Game+.", icon: "diamond", xp: 12000, badgeImage: NGP_IMG_100, prestige: true, newGamePlus: true,
    check: () => ngPlusTrainingEntries().length >= 100,
    progress: () => ({ current: ngPlusTrainingEntries().length, target: 100 }) },
  { id: "ngp_500_club", title: "The 500 Club", desc: "Genomför 500 träningspass i New Game+.", icon: "trophy", xp: 30000, badgeImage: NGP_IMG_500_CLUB, prestige: true, newGamePlus: true,
    check: () => ngPlusTrainingEntries().length >= 500,
    progress: () => ({ current: ngPlusTrainingEntries().length, target: 500 }) },
  { id: "ngp_time_lord", title: "Time Lord", desc: "Samla 10 000 minuters träning i New Game+.", icon: "hourglass", xp: 18000, badgeImage: NGP_IMG_TIME_LORD, prestige: true, newGamePlus: true,
    check: () => ngPlusTrainingMinutes() >= 10000,
    progress: () => ({ current: ngPlusTrainingMinutes(), target: 10000 }) },
  { id: "ngp_no_weeks_off", title: "No Weeks Off", desc: "Träna minst 1 pass varje vecka i 26 veckor i rad.", icon: "calendar", xp: 10000, badgeImage: NGP_IMG_NO_WEEKS_OFF, prestige: true, newGamePlus: true,
    check: () => longestConsecutiveRunStep(workoutEntries.filter(isTraining).map((e) => mondayOf(e.date)), 7) >= 26,
    progress: () => ({ current: longestConsecutiveRunStep(workoutEntries.filter(isTraining).map((e) => mondayOf(e.date)), 7), target: 26 }) },
  { id: "ngp_long_game", title: "The Long Game", desc: "Träna minst 1 pass varje vecka i 52 veckor i rad.", icon: "calendarCheck", xp: 20000, badgeImage: NGP_IMG_LONG_GAME, prestige: true, newGamePlus: true,
    check: () => longestConsecutiveRunStep(workoutEntries.filter(isTraining).map((e) => mondayOf(e.date)), 7) >= 52,
    progress: () => ({ current: longestConsecutiveRunStep(workoutEntries.filter(isTraining).map((e) => mondayOf(e.date)), 7), target: 52 }) },
  { id: "ngp_hybrid_athlete", title: "Hybrid Athlete", desc: "Genomför 50 styrkepass + 50 kampsportspass + 50 konditionspass.", icon: "target", xp: 15000, badgeImage: NGP_IMG_HYBRID_ATHLETE, prestige: true, newGamePlus: true,
    check: () => workoutEntries.filter(isGymType).length >= 50 && workoutEntries.filter(isMartialArts).length >= 50 && workoutEntries.filter(isCardio).length >= 50 },
  { id: "ngp_triple_century", title: "Triple Century", desc: "Genomför 100 styrkepass + 100 kampsportspass + 100 konditionspass.", icon: "crown", xp: 25000, badgeImage: NGP_IMG_TRIPLE_CENTURY, prestige: true, newGamePlus: true,
    check: () => workoutEntries.filter(isGymType).length >= 100 && workoutEntries.filter(isMartialArts).length >= 100 && workoutEntries.filter(isCardio).length >= 100 },
  { id: "ngp_submission_master", title: "Submission Master", desc: "Registrera 300 submissions.", icon: "belt", xp: 15000, badgeImage: NGP_IMG_SUBMISSION_MASTER, prestige: true, newGamePlus: true,
    check: () => totalSubmissionCount() >= 300,
    progress: () => ({ current: totalSubmissionCount(), target: 300 }) },
  { id: "ngp_bingo_master", title: "Bingo Master", desc: "Klara 10 fullständiga Submission Bingo-brickor.", icon: "puzzle", xp: 15000, badgeImage: NGP_IMG_BINGO_MASTER, prestige: true, newGamePlus: true,
    check: () => (bingoLifetimeStats.fullCount || 0) >= 10,
    progress: () => ({ current: bingoLifetimeStats.fullCount || 0, target: 10 }) },
  { id: "ngp_250", title: "NG+ 250", desc: "Genomför 250 träningspass i New Game+.", icon: "gem", xp: 14000, badgeImage: NGP_IMG_250, prestige: true, newGamePlus: true,
    check: () => ngPlusTrainingEntries().length >= 250,
    progress: () => ({ current: ngPlusTrainingEntries().length, target: 250 }) },
  { id: "ngp_perfect_month", title: "Perfect Month", desc: "Klara veckoutmaningen 4 veckor i rad.", icon: "calendar", xp: 8000, badgeImage: NGP_IMG_PERFECT_MONTH, prestige: true, newGamePlus: true,
    check: () => longestPerfectWeeklyChallengeStreak() >= 4,
    progress: () => ({ current: longestPerfectWeeklyChallengeStreak(), target: 4 }) },
  { id: "ngp_perfect_quarter", title: "Perfect Quarter", desc: "Klara veckoutmaningen 13 veckor i rad.", icon: "medal", xp: 16000, badgeImage: NGP_IMG_PERFECT_QUARTER, prestige: true, newGamePlus: true,
    check: () => longestPerfectWeeklyChallengeStreak() >= 13,
    progress: () => ({ current: longestPerfectWeeklyChallengeStreak(), target: 13 }) },
  { id: "ngp_explorer", title: "Explorer", desc: "Genomför minst 10 olika typer av träningspass.", icon: "compass", xp: 6000, badgeImage: NGP_IMG_EXPLORER, prestige: true, newGamePlus: true,
    check: () => new Set(workoutEntries.filter(isTraining).map((e) => e.type)).size >= 10,
    progress: () => ({ current: new Set(workoutEntries.filter(isTraining).map((e) => e.type)).size, target: 10 }) },
  { id: "ngp_grand_slam", title: "The Grand Slam", desc: "Genomför styrka + kampsport + kondition under samma vecka, 10 olika veckor.", icon: "trophy", xp: 14000, badgeImage: NGP_IMG_GRAND_SLAM, prestige: true, newGamePlus: true,
    check: () => weeksWithAllThreeCategories() >= 10,
    progress: () => ({ current: weeksWithAllThreeCategories(), target: 10 }) },
  { id: "ngp_unstoppable", title: "Unstoppable", desc: "Genomför 250 träningspass inom 365 dagar.", icon: "flame", xp: 20000, badgeImage: NGP_IMG_UNSTOPPABLE, prestige: true, newGamePlus: true,
    check: () => maxTrainingCountInAnyYearWindow() >= 250,
    progress: () => ({ current: maxTrainingCountInAnyYearWindow(), target: 250 }) },
  { id: "ngp_perfect_year", title: "Perfect Year", desc: "Klara veckoutmaningen 52 veckor i rad.", icon: "crown", xp: 25000, badgeImage: NGP_IMG_PERFECT_YEAR, prestige: true, newGamePlus: true,
    check: () => longestPerfectWeeklyChallengeStreak() >= 52,
    progress: () => ({ current: longestPerfectWeeklyChallengeStreak(), target: 52 }) },
  { id: "ngp_completionist", title: "NG+ Completionist", desc: "Klara alla övriga New Game+-prestationer.", icon: "diamond", xp: 40000, badgeImage: NGP_IMG_COMPLETIONIST, secret: true, newGamePlus: true,
    check: () => isAllNewGamePlusUnlocked() },

  { id: "platinum_all", title: "New Game+", desc: "Låst upp varenda prestation i appen. Alla.", hint: "Det finns ingenting kvar att hitta.", icon: "crown", xp: 20000, badgeImage: BADGE_IMG_PLATINUM_100, secret: true,
    check: () => isAllAchievementsUnlocked() },
];
// Sant när ALLT annat i ACHIEVEMENTS är upplåst - alltså det absolut sista
// steget innan platina-prestationen ("platinum_all") själv låses upp.
// Utesluter medvetet sig själv (paradox) och alla newGamePlus-flaggade
// prestationer (annars vore platina omöjligt - de är TÄNKTA att komma efter).
// --- Hjälpfunktioner för New Game+ -----------------------------------
// Antal/minuter tränat EFTER att platina nåddes (platinumUnlockedAt är en
// "YYYY-MM-DD"-sträng, direkt jämförbar med e.date).
function ngPlusTrainingEntries() {
  if (!platinumUnlockedAt) return [];
  return workoutEntries.filter((e) => isTraining(e) && e.date >= platinumUnlockedAt);
}
function ngPlusTrainingMinutes() {
  return ngPlusTrainingEntries().reduce((s, e) => s + (Number(e.minutes) || 0), 0);
}
// Längsta sviten av veckor där ALLA veckoutmaningar klarades (completed ===
// total) - används för Perfect Month/Quarter/Year. Tolkning: en "månad" =
// ~4 veckor, "kvartal" = ~13 veckor, "år" = 52 veckor (samma mönster som
// befintliga "Extrem konsekvens"). Justera lätt om du menade något annat
// med "vecko- och månadsmål".
function longestPerfectWeeklyChallengeStreak() {
  const weeks = weeklyChallengeHistory.map((w) => ({ weekStart: w.weekStart, perfect: w.total > 0 && w.completed === w.total }));
  if (weeklyChallengeState.ids && weeklyChallengeState.ids.length) {
    weeks.push({ weekStart: weeklyChallengeState.weekStart, perfect: weeklyChallengeState.completed.length === weeklyChallengeState.ids.length });
  }
  return longestConsecutiveRunStep(weeks.filter((w) => w.perfect).map((w) => w.weekStart), 7);
}
// Flest träningspass inom NÅGOT rullande 365-dagarsfönster (inte bara ett
// kalenderår) - för "Unstoppable".
function maxTrainingCountInAnyYearWindow() {
  const dates = workoutEntries.filter(isTraining).map((e) => e.date).sort();
  let best = 0;
  for (let i = 0; i < dates.length; i++) {
    const windowEnd = addDays(dates[i], 365);
    let count = 0;
    for (let j = i; j < dates.length && dates[j] <= windowEnd; j++) count++;
    best = Math.max(best, count);
  }
  return best;
}
// Antal olika veckor (måndag-till-söndag) där man tränat styrka OCH
// kampsport OCH kondition samma vecka - för "The Grand Slam".
function weeksWithAllThreeCategories() {
  const byWeek = {};
  workoutEntries.filter(isTraining).forEach((e) => {
    const wk = mondayOf(e.date);
    if (!byWeek[wk]) byWeek[wk] = new Set();
    byWeek[wk].add(typeCategory(e.type));
  });
  return Object.values(byWeek).filter((s) => s.has("gym") && s.has("kampsport") && s.has("kondition")).length;
}
function totalSubmissionCount() {
  let total = 0;
  workoutEntries.forEach((e) => { (e.submissions || []).forEach(() => { total++; }); });
  return total;
}
// Sant när alla ÖVRIGA newGamePlus-flaggade prestationer är upplåsta -
// utesluter sig själv (samma paradox-undvikande mönster som platinum_all).
function isAllNewGamePlusUnlocked() {
  return ACHIEVEMENTS.filter((a) => a.newGamePlus && a.id !== "ngp_completionist").every((a) => unlockedAchievements.includes(a.id));
}

function isAllAchievementsUnlocked() {
  return ACHIEVEMENTS.filter((a) => a.id !== "platinum_all" && !a.newGamePlus).every((a) => unlockedAchievements.includes(a.id));
}

/* ---------------- Celebration queue ---------------- */

let celebrationQueue = [];
// Håller referensen till den aktiva Enter-lyssnaren för firande-kort, så vi
// kan städa bort den korrekt när kortet stängs (annars kan gamla lyssnare
// hopa sig när flera kort visas efter varandra).
let celebrationKeyHandler = null;

function checkAchievements() {
  const xpBefore = totalXp();
  const levelBefore = computeLevelInfo(xpBefore).level;
  let anyNew = false;
  let anyBg = false;
  ACHIEVEMENTS.forEach((a) => {
    if (unlockedAchievements.includes(a.id) || bgUnlockedAchievements.includes(a.id)) return;
    if (!a.check()) return;
    if (!kampsportAdvancedSectionOpen && KAMPSPORT_ACHIEVEMENT_IDS.has(a.id)) {
      bgUnlockedAchievements.push(a.id);
      anyBg = true;
      return;
    }
    unlockedAchievements.push(a.id);
    unlockedAchievementDates[a.id] = todayISO();
    anyNew = true;
    celebrationQueue.push({ type: "achievement", achievement: a });
  });
  if (anyBg) saveBgUnlockedAchievements();
  if (anyNew) {
    saveUnlockedAchievements();
    saveUnlockedAchievementDates();
  }
  if (anyNew && !platinumUnlockedAt && isAllAchievementsUnlocked() && unlockedAchievements.includes("platinum_all")) {
    platinumUnlockedAt = todayISO();
    savePlatinumUnlockedAt();
    celebrationQueue.push({ type: "platinum" });
    celebrationQueue.push({ type: "newgameplus_intro" });
  }

  const autoPrestiged = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!a.prestige) return;
    if (isAutoPrestigeEligible(a)) {
      autoPrestigeAchievement(a);
      autoPrestiged.push(a);
    }
  });
  if (autoPrestiged.length === 1) {
    const a = autoPrestiged[0];
    showInfoToast(`🏅 ${a.title} ×${(achievementPrestige[a.id] || 0) + 1} — +${a.xp} XP`);
  } else if (autoPrestiged.length > 1) {
    const totalGained = autoPrestiged.reduce((sum, a) => sum + a.xp, 0);
    showInfoToast(`🏅 ${autoPrestiged.length} prestationer prestigeade automatiskt — +${totalGained} XP`);
  }

  // OBS: den här kollen låg tidigare inuti "if (anyNew)" ovan, vilket gjorde
  // att level-up-firandet (popup + ljud) bara visades om en prestation ÄVEN
  // låstes upp i exakt samma anrop. XP från loggning/veckoutmaningar/bingo
  // kan leda till en level-up helt utan någon samtidig prestation, och då
  // visades ingen firande-popup alls - en riktig bugg, inte bara ett
  // debug-relaterat beteende. Nu körs den oberoende av anyNew.
  const levelAfter = computeLevelInfo(totalXp()).level;
  if (levelAfter > levelBefore) {
    celebrationQueue.push({ type: "levelup", level: levelAfter });
  }
  if (celebrationQueue.length && !document.getElementById("celebrationOverlay")) {
    showNextCelebration();
  }
}
// Kör en funktion som kan ändra XP/level, och visar automatiskt
// level-up-firandet (popup + ljud) om leveln faktiskt gick upp som resultat -
// används av debug-verktygen så man kan testa/höra firandet även när man
// hoppar level direkt utan att en prestation låses upp samtidigt.
function withLevelUpCelebration(fn) {
  const levelBefore = computeLevelInfo(totalXp()).level;
  fn();
  const levelAfter = computeLevelInfo(totalXp()).level;
  if (levelAfter > levelBefore) {
    celebrationQueue.push({ type: "levelup", level: levelAfter });
    if (!document.getElementById("celebrationOverlay")) showNextCelebration();
  }
}

function showNextCelebration() {
  if (!celebrationQueue.length) return;
  const item = celebrationQueue[0];
  const existing = document.getElementById("celebrationOverlay");
  if (existing) existing.remove();
  if (celebrationKeyHandler) { document.removeEventListener("keydown", celebrationKeyHandler); celebrationKeyHandler = null; }

  const overlay = document.createElement("div");
  overlay.id = "celebrationOverlay";
  overlay.className = "celebration-overlay";

  if (item.type === "achievement") {
    const a = item.achievement;
    const hasBadgeImg = !!a.badgeImage;
    const iconHTML = hasBadgeImg
      ? `<img src="${a.badgeImage}" alt="${a.title}" class="achievement-badge-pop" />`
      : a.emoji
      ? `<div class="celebration-icon" style="color:${tabColors.stats};border-color:${tabColors.stats}"><span style="font-size:32px;line-height:1">${a.emoji}</span></div>`
      : `<div class="celebration-icon" style="color:${tabColors.stats};border-color:${tabColors.stats}"><span style="width:34px;height:34px;display:flex">${ICONS[a.icon]}</span></div>`;
    overlay.innerHTML = `
      <div class="celebration-card" style="${hasBadgeImg ? "padding-top:96px" : ""}">
        ${iconHTML}
        <div class="celebration-title" style="${hasBadgeImg ? "margin-top:4px" : ""}">🎉 Grattis!</div>
        <div class="celebration-sub">Du klarade prestationen</div>
        <div class="celebration-achievement">${escapeHtml(a.title)}</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:10px">${escapeHtml(a.desc)}</div>
        ${a.secret ? `<div style="font-size:12px;font-weight:700;color:${tabColors.stats};margin-bottom:6px">🔓 Det här var en hemlig prestation!</div>` : ""}
        <div class="celebration-xp" style="color:${tabColors.stats}">+${a.xp} XP</div>
        <button class="modal-btn primary" id="celebrationNextBtn">Toppen!</button>
      </div>
    `;
  } else if (item.type === "weeklychallenge") {
    const c = item.challenge;
    overlay.innerHTML = `
      <div class="celebration-card">
        <div class="celebration-icon" style="color:${tabColors.traning};border-color:${tabColors.traning}">
          <img src="${CELEBRATION_IMG_WEEKLYCHALLENGE}" alt="" style="width:58px;height:58px;object-fit:contain;display:block" />
        </div>
        <div class="celebration-title">✅ Utmaning klarad!</div>
        <div class="celebration-sub">Veckans utmaning</div>
        <div class="celebration-achievement">${escapeHtml(c.title)}</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:10px">${escapeHtml(c.desc)}</div>
        <div class="celebration-xp" style="color:${tabColors.traning}">+${item.xp} XP</div>
        <button class="modal-btn primary" id="celebrationNextBtn">Toppen!</button>
      </div>
    `;
  } else if (item.type === "weeklybonus") {
    overlay.innerHTML = `
      <div class="celebration-card">
        <div class="celebration-icon" style="color:${tabColors.traning};border-color:${tabColors.traning}">
          <img src="${CELEBRATION_IMG_WEEKLYBONUS}" alt="" style="width:58px;height:58px;object-fit:contain;display:block" />
        </div>
        <div class="celebration-title">🏆 Veckan klarad!</div>
        <div class="celebration-sub">Alla tre utmaningar klara denna vecka</div>
        <div class="celebration-xp" style="color:${tabColors.traning}">+${item.xp} XP bonus</div>
        <button class="modal-btn primary" id="celebrationNextBtn">Grymt!</button>
      </div>
    `;
  } else if (item.type === "monthrecap") {
    overlay.innerHTML = `
      <div class="celebration-card">
        <div class="celebration-icon" style="color:${tabColors.stats};border-color:${tabColors.stats}">
          <img src="${CELEBRATION_IMG_MONTHRECAP}" alt="" style="width:58px;height:58px;object-fit:contain;display:block" />
        </div>
        <div class="celebration-title">📅 Ny sammanfattning!</div>
        <div class="celebration-sub">${monthKeyLabel(item.monthKey)} är sammanställd</div>
        <button class="modal-btn primary" id="celebrationMonthRecapBtn">Visa sammanfattning</button>
        <button class="modal-btn secondary" id="celebrationNextBtn" style="margin-top:8px">Senare</button>
      </div>
    `;
  } else if (item.type === "newgameplus_intro") {
    overlay.className = "celebration-overlay celebration-overlay-platinum";
    overlay.innerHTML = `
      <div class="celebration-card celebration-card-platinum">
        <img src="${BADGE_IMG_NEWGAMEPLUS}" alt="" class="platinum-badge-img" />
        <div class="celebration-title">🎮 New Game+ upplåst!</div>
        <div style="font-size:14px;color:var(--text);line-height:1.5;margin-bottom:16px;position:relative;z-index:1">Du är en av få som tagit dig hela vägen hit — men resan slutar inte här. Nya, tuffare prestationer väntar redan i din lista.</div>
        <button class="modal-btn primary" id="celebrationNextBtn">Visa mina nya prestationer</button>
      </div>
    `;
  } else if (item.type === "platinum") {
    overlay.className = "celebration-overlay celebration-overlay-platinum";
    const pctText = platinumStatsPct !== null ? platinumStatsPct.toLocaleString("sv-SE", { maximumFractionDigits: 1 }) : "…";
    overlay.innerHTML = `
      <div class="celebration-card celebration-card-platinum">
        <div class="platinum-confetti" aria-hidden="true">${Array.from({ length: 24 }).map((_, i) => `<span style="--i:${i}"></span>`).join("")}</div>
        <img src="${BADGE_IMG_PLATINUM_100}" alt="" class="platinum-badge-img" />
        <div class="celebration-title">🏆 100%!</div>
        <div style="font-size:14px;color:var(--text);line-height:1.4;margin-bottom:10px;position:relative;z-index:1">Du har låst upp ALLA prestationer i appen! Endast <b style="color:#EF9F27" id="platinumStatsPctSpan">${pctText}</b>% har låst upp denna prestation!</div>
        <div style="font-size:12.5px;color:var(--muted);line-height:1.4;margin-bottom:14px;position:relative;z-index:1">En permanent markering syns nu på din profil som alla dina vänner kan se! Du kan se det här firandet igen när du vill, från prestationslistan.</div>
        <button class="modal-btn primary" id="celebrationNextBtn">Fantastiskt!</button>
      </div>
    `;
    fetchPlatinumStatsPct();
  } else {
    overlay.innerHTML = `
      <div class="celebration-card" style="padding-top:96px">
        <img src="${CELEBRATION_IMG_LEVELUP}" alt="" class="achievement-badge-pop" />
        <div class="celebration-title">🚀 Level up!</div>
        <div class="celebration-sub">Du är nu</div>
        <div class="celebration-achievement">Level ${item.level}</div>
        <button class="modal-btn primary" id="celebrationNextBtn">Fortsätt</button>
      </div>
    `;
  }
  document.body.appendChild(overlay);
  playCelebrationChime(item.type);
  celebrationKeyHandler = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Prio: huvudknappen (Toppen!/Fantastiskt! osv). Om kortet bara har en
    // annan knapp (t.ex. månadssammanfattningen), använd den istället.
    const btn = document.getElementById("celebrationNextBtn") || document.getElementById("celebrationMonthRecapBtn");
    if (btn) btn.click();
  };
  document.addEventListener("keydown", celebrationKeyHandler);
  const monthRecapBtn = document.getElementById("celebrationMonthRecapBtn");
  if (monthRecapBtn) {
    monthRecapBtn.addEventListener("click", () => {
      celebrationQueue.shift();
      overlay.remove();
      if (celebrationKeyHandler) { document.removeEventListener("keydown", celebrationKeyHandler); celebrationKeyHandler = null; }
      openMonthRecapModal(item.monthKey);
    });
  }
  document.getElementById("celebrationNextBtn").addEventListener("click", () => {
    const wasLevelUp = item.type === "levelup";
    const wasNewGamePlusIntro = item.type === "newgameplus_intro";
    celebrationQueue.shift();
    overlay.remove();
    if (celebrationKeyHandler) { document.removeEventListener("keydown", celebrationKeyHandler); celebrationKeyHandler = null; }
    if (wasNewGamePlusIntro) {
      achievementsExpanded = true;
      hideUnlockedAchievements = false;
      if (activeTab !== "stats") switchTab("stats"); else renderStats();
    }
    // Om Inställningar redan var öppet när man levlade upp visade
    // ikon-väljaren fortfarande gammal låst/upplåst-status. Rendera om den
    // direkt så man slipper stänga och öppna menyn igen.
    if (wasLevelUp && document.getElementById("settingsSearchInput")) {
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openBackupModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
    } else if (wasLevelUp && document.getElementById("profileModalOverlay")) {
      // Samma sak för profilram-väljaren i Profil-menyn.
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openProfileModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
    }
    if (celebrationQueue.length) {
      showNextCelebration();
    } else if (activeTab === "stats") {
      renderStats();
    }
  });
}

function bingoCardHTML() {
  rollBingoCardIfNeeded();
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showSubmissionBingoToggle", "🥋 Submission-bingo", showSubmissionBingo, showSubmissionBingo ? "10px" : null)}
      ${showSubmissionBingo ? (() => {
        if (!bingoCard) return `<p>Ingen bricka ännu.</p>`;
        const stats = computeBingoStats(bingoCard);
        const daysLeft = Math.max(0, Math.round((new Date(bingoCard.endDate) - new Date(todayISO())) / 86400000));
        return `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:20px;font-weight:700">${stats.checkedCount}/${bingoCard.squares.length} rutor</div>
              <div style="font-size:12px;color:var(--muted)">${daysLeft} ${daysLeft === 1 ? "dag" : "dagar"} kvar${stats.xp > 0 ? ` · ${stats.xp} XP hittills` : ""}</div>
            </div>
            <button class="modal-btn secondary" id="openBingoModalBtn" style="width:auto;padding:9px 16px">Se bricka</button>
          </div>
        `;
      })() : ""}
    </div>
  `;
}
function renderBingoCard() {
  const wrap = document.getElementById("bingoCardWrap");
  if (!wrap) return;
  wrap.innerHTML = bingoCardHTML();
  wireBingoCardEvents();
}
function wireBingoCardEvents() {
  const toggle = document.getElementById("showSubmissionBingoToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showSubmissionBingo = !showSubmissionBingo;
      saveShowSubmissionBingo();
      renderBingoCard();
    });
  }
  const openBtn = document.getElementById("openBingoModalBtn");
  if (openBtn) openBtn.addEventListener("click", openBingoModal);
}

function openBingoModal() {
  if (!bingoCard) return;
  pushModalHistoryIfNeeded();
  const render = () => {
    const stats = computeBingoStats(bingoCard);
    const daysLeft = Math.max(0, Math.round((new Date(bingoCard.endDate) - new Date(todayISO())) / 86400000));
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="bingoModalOverlay">
        <div class="modal-sheet">
          <h2>🥋 Submission-bingo</h2>
          <p style="margin-top:-8px;font-size:12.5px;color:var(--muted)">${daysLeft} ${daysLeft === 1 ? "dag" : "dagar"} kvar av den här brickan.</p>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:4px 0 10px">
            ${bingoCard.squares.map((sq, i) => `
              <div style="aspect-ratio:1;border:1px solid var(--border2);border-radius:6px;background:${sq.checked ? `${tabColors.traning}26` : "var(--input-bg)"};${sq.checked ? `border-color:${tabColors.traning};color:${tabColors.traning};font-weight:600;` : ""}${sq.type === "wild" ? "border-style:dashed;" : ""}display:flex;align-items:center;justify-content:center;text-align:center;font-size:9px;line-height:1.15;padding:3px">${escapeHtml(sq.label)}</div>
            `).join("")}
          </div>
          <p style="font-size:11.5px;color:var(--muted);margin-top:-4px">Rutor kryssas i automatiskt när du loggar submissionen under ett träningspass.</p>
          <div class="card" style="background:var(--bg);margin-bottom:0">
            <div class="goal-row"><span class="goal-label">Rader klara</span><span class="goal-value">${stats.lineCount}</span></div>
            <div class="goal-row"><span class="goal-label">Kryss (X)</span><span class="goal-value">${stats.hasX ? "Ja" : "Nej"}</span></div>
            <div class="goal-row"><span class="goal-label">Alla fyra hörn</span><span class="goal-value">${stats.hasCorners ? "Ja" : "Nej"}</span></div>
            <div class="goal-row"><span class="goal-label">Full bricka</span><span class="goal-value">${stats.isFull ? "Ja" : "Nej"}</span></div>
          </div>
          <div class="row" style="margin-top:12px">
            ${!bingoCard.rerollUsed ? `<button class="modal-btn secondary" id="rerollBingoBtn" style="flex:1">🔀 Slumpa ny bricka</button>` : ""}
            ${stats.isFull ? `<button class="modal-btn primary" id="restartBingoBtn" style="flex:1">🔄 Starta ny bricka nu</button>` : ""}
          </div>
          <div class="card" style="background:var(--bg)">
            <div class="card-label" style="margin-bottom:8px">Livstidsstatistik</div>
            <div class="goal-row"><span class="goal-label">Brickor spelade</span><span class="goal-value">${bingoLifetimeStats.cardsPlayed}</span></div>
            <div class="goal-row"><span class="goal-label">Fulla brickor</span><span class="goal-value">${bingoLifetimeStats.fullCount} (${bingoLifetimeStats.cardsPlayed ? Math.round(bingoLifetimeStats.fullCount / bingoLifetimeStats.cardsPlayed * 100) : 0}%)</span></div>
            <div class="goal-row"><span class="goal-label">Rutor klara totalt</span><span class="goal-value">${bingoLifetimeStats.squaresChecked} / ${bingoLifetimeStats.squaresTotal} (${bingoLifetimeStats.squaresTotal ? Math.round(bingoLifetimeStats.squaresChecked / bingoLifetimeStats.squaresTotal * 100) : 0}%)</span></div>
          </div>
          <div class="modal-close" id="bingoModalCloseBtn">Stäng</div>
        </div>
      </div>
    `;
    const rerollBtn = document.getElementById("rerollBingoBtn");
    if (rerollBtn) rerollBtn.addEventListener("click", () => { rerollBingoCard(); render(); renderBingoCard(); });
    const restartBtn = document.getElementById("restartBingoBtn");
    if (restartBtn) restartBtn.addEventListener("click", () => { startNextBingoCardEarly(); render(); renderBingoCard(); });
    document.getElementById("bingoModalCloseBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; });
    document.getElementById("bingoModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "bingoModalOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
    });
  };
  render();
}

function weeklyChallengeCardHTML() {
  rollWeeklyChallengesIfNeeded();
  const amounts = weeklyChallengeXpAmounts();
  const weekEnd = addDays(weeklyChallengeState.weekStart, 6);
  const rows = weeklyChallengeState.ids.map((id) => {
    const c = findWeeklyChallengeById(id);
    if (!c) return "";
    const done = weeklyChallengeState.completed.includes(id);
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;${done ? "" : "border-bottom:1px solid var(--border)"}">
        <span style="width:22px;height:22px;flex-shrink:0;border-radius:50%;border:2px solid ${done ? tabColors.traning : "var(--border2)"};background:${done ? tabColors.traning : "transparent"};display:flex;align-items:center;justify-content:center;color:#fff">
          ${done ? `<span style="width:13px;height:13px;display:flex">${ICONS.check}</span>` : ""}
        </span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:${done ? "var(--muted)" : "var(--text)"};${done ? "text-decoration:line-through" : ""}">${escapeHtml(c.title)}</div>
          <div style="font-size:11.5px;color:var(--muted)">${escapeHtml(c.desc)}</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:${done ? tabColors.traning : "var(--muted)"};flex-shrink:0">${amounts.perChallenge} XP</div>
      </div>
    `;
  }).join("");
  const doneCount = weeklyChallengeState.completed.length;
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;${showWeeklyChallenge ? "margin-bottom:8px;" : ""}" id="showWeeklyChallengeToggle">
        <div class="card-label" style="margin-bottom:0">Veckans utmaning <span style="color:var(--muted2);font-weight:600">${doneCount}/3</span></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--muted2)">till ${fmtDateShort(weekEnd)}</span>
          <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${showWeeklyChallenge ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
        </div>
      </div>
      ${showWeeklyChallenge ? `
        ${rows}
        ${doneCount === 3 ? `
          <div style="text-align:center;font-size:12.5px;font-weight:700;color:${tabColors.traning};margin-top:8px">🏆 Alla klara — +${amounts.bonus} XP bonus intjänad!</div>
          <p style="margin-top:8px;margin-bottom:8px;text-align:center;font-size:12px;color:var(--muted)">Du kan starta nästa omgång direkt — men den nya har bara kvarvarande tid av veckan på sig, innan en helt ny utmaning slumpas på måndag som vanligt.</p>
          <button class="modal-btn secondary" id="startNextChallengeBtn" style="width:auto;padding:10px 18px;margin:0 auto;display:block">🔄 Starta nästa omgång nu</button>
        ` : ""}
        <button class="modal-btn secondary" id="openWeeklyChallengeSummaryBtn" style="width:auto;padding:8px 14px;margin:12px auto 0;display:block;font-size:12.5px">📊 Sammanfattning av veckoutmaningar</button>
      ` : ""}
    </div>
  `;
}
function renderWeeklyChallengeCard() {
  const wrap = document.getElementById("weeklyChallengeCardWrap");
  if (!wrap) return;
  wrap.innerHTML = weeklyChallengeCardHTML();
  wireWeeklyChallengeCardEvents();
}
function wireWeeklyChallengeCardEvents() {
  const toggle = document.getElementById("showWeeklyChallengeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showWeeklyChallenge = !showWeeklyChallenge;
      saveShowWeeklyChallenge();
      renderWeeklyChallengeCard();
    });
  }
  const startNextChallengeBtn = document.getElementById("startNextChallengeBtn");
  if (startNextChallengeBtn) {
    startNextChallengeBtn.addEventListener("click", () => {
      startNextWeeklyChallengeEarly();
      renderWeeklyChallengeCard();
    });
  }
  const summaryBtn = document.getElementById("openWeeklyChallengeSummaryBtn");
  if (summaryBtn) {
    summaryBtn.addEventListener("click", openWeeklyChallengeSummaryModal);
  }
}

function monthlyBarChartCardHTML() {
  const currentYear = new Date().getFullYear();
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showMonthlyBarChartToggle", `Pass per månad, ${currentYear}`, showMonthlyBarChart)}
      ${showMonthlyBarChart ? `
        <div class="chart-wrap" style="margin-top:10px"><canvas id="statsBarChart"></canvas></div>
        <div class="legend">
          ${TYPE_KEYS.map((t) => `<div class="legend-item"><span class="dot" style="background:${TYPES[t].color}"></span>${TYPES[t].label}</div>`).join("")}
        </div>
      ` : ""}
    </div>
  `;
}
function renderMonthlyBarChartCard() {
  const wrap = document.getElementById("monthlyBarChartCardWrap");
  if (!wrap) return;
  wrap.innerHTML = monthlyBarChartCardHTML();
  wireMonthlyBarChartCardEvents();
}
function wireMonthlyBarChartCardEvents() {
  const toggle = document.getElementById("showMonthlyBarChartToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showMonthlyBarChart = !showMonthlyBarChart;
      saveShowMonthlyBarChart();
      renderMonthlyBarChartCard();
    });
  }
  if (!showMonthlyBarChart) return;
  const currentYear = new Date().getFullYear();
  const monthlyChartData = MONTHS_SV.map((label, i) => {
    const key = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    const monthEntries = workoutEntries.filter((e) => e.date.slice(0, 7) === key);
    const row = { label };
    TYPE_KEYS.forEach((t) => (row[t] = 0));
    monthEntries.forEach((e) => (row[e.type] += 1));
    return row;
  });
  const barCtx = document.getElementById("statsBarChart");
  if (!barCtx) return;
  if (statsBarChartInstance) statsBarChartInstance.destroy();
  statsBarChartInstance = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: monthlyChartData.map((r) => r.label),
      datasets: TYPE_KEYS.map((t) => ({
        label: TYPES[t].label,
        data: monthlyChartData.map((r) => r[t]),
        backgroundColor: TYPES[t].color,
      })),
    },
    options: {
      ...chartBaseOptions(),
      plugins: {
        ...chartBaseOptions().plugins,
        legend: { display: false },
        tooltip: {
          ...chartBaseOptions().plugins.tooltip,
          callbacks: { title: () => "" },
        },
      },
      scales: {
        x: { stacked: true, grid: { color: cssVar("--border") }, ticks: { color: cssVar("--muted2"), font: { size: 11 } } },
        y: { stacked: true, grid: { color: cssVar("--border") }, ticks: { color: cssVar("--muted2"), font: { size: 11 }, precision: 0 } },
      },
    },
  });
}

let levelHeroViewIndex = null;
let levelHeroLastCurrentIndex = null;

function levelHeroCardHTML() {
  const info = computeLevelInfo(totalXp());
  const tiers = activeTierSet();
  const currentTier = getBeltForLevel(info.level);
  const currentIndex = tiers.indexOf(currentTier);
  const maxViewIndex = Math.min(tiers.length - 1, currentIndex + 1);
  if (levelHeroViewIndex === null || levelHeroViewIndex > maxViewIndex || levelHeroViewIndex < 0) {
    levelHeroViewIndex = currentIndex;
  } else if (levelHeroLastCurrentIndex !== null && levelHeroViewIndex === levelHeroLastCurrentIndex && currentIndex !== levelHeroLastCurrentIndex) {
    // Man tittade på "nuvarande nivå" och den har hoppat framåt (level-up,
    // även flera bälten på en gång - t.ex. via debug-verktyget) - följ med
    // automatiskt istället för att bli kvar på den gamla nivån tills man
    // klickar sig fram manuellt med pil-knapparna.
    levelHeroViewIndex = currentIndex;
  }
  levelHeroLastCurrentIndex = currentIndex;
  const viewIndex = levelHeroViewIndex;
  const belt = tiers[viewIndex];
  const isViewingCurrent = viewIndex === currentIndex;
  const isPast = viewIndex < currentIndex;
  const isLocked = viewIndex > currentIndex;
  const nextTierMin = tiers[viewIndex + 1] ? tiers[viewIndex + 1].min : null;
  const barColor = isLocked ? "var(--muted2)" : (belt.barColor || belt.color);
  const nameColor = isLocked ? "var(--muted2)" : belt.color;
  const textStyle = `color:${nameColor};padding:2px 12px;border-radius:999px;border:${belt.borderWidth || "1.5px"} solid ${isLocked ? "var(--border2)" : (belt.borderColor || belt.color)};${!isLocked && belt.textStroke ? `-webkit-text-stroke:${belt.textStroke};text-stroke:${belt.textStroke};` : ""}`;
  // Progress through the current belt tier, used for stripe count (like real BJJ belt stripes). Belt theme only, current tier only.
  let stripeCount = 0;
  if (levelTheme === "belt" && isViewingCurrent) {
    if (belt.unlimitedStripes) {
      stripeCount = Math.floor((info.level - belt.min) / belt.stripeEvery);
    } else {
      const beltTierProgress = Math.min(1, ((info.level - belt.min) + info.xpIntoLevel / info.xpForNext) / getBeltTierSpan(belt));
      stripeCount = beltTierProgress >= 0.8 ? 4 : beltTierProgress >= 0.6 ? 3 : beltTierProgress >= 0.4 ? 2 : beltTierProgress >= 0.2 ? 1 : 0;
    }
  }
  const pct = isLocked ? 0 : isViewingCurrent && info.xpForNext > 0 ? Math.min(100, Math.round((info.xpIntoLevel / info.xpForNext) * 100)) : 100;
  const subLabel = isLocked ? "Inte upplåst än" : isPast ? "Tidigare uppnådd nivå" : `${info.xpIntoLevel} / ${info.xpForNext} XP till level ${info.level + 1}`;
  return `
    <div class="card" style="text-align:center">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px">
        ${profileAvatarHTML(40, 3) || ""}
        <div style="font-size:13px;font-weight:600;color:var(--muted)">${profile.name ? escapeHtml(profile.name) : "Din progression"}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;min-height:40px;margin:6px 0 8px">
        ${isViewingCurrent
          ? `<span style="display:inline-flex;align-items:center;font-size:22px;font-weight:800;font-family:inherit;${textStyle}">Level ${info.level}</span>`
          : `<span style="display:inline-flex;align-items:center;font-size:16px;font-weight:800;font-family:inherit;${textStyle}">${escapeHtml(belt.name)} (Lvl ${belt.min}${nextTierMin ? `–${nextTierMin - 1}` : "+"})</span>`}
      </div>
      <div style="height:10px;background:var(--border);border-radius:999px;overflow:hidden;border:1.5px solid #FFFFFF">
        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:999px;transition:width .4s"></div>
      </div>
      <div style="font-size:11px;color:var(--muted2);margin-top:6px">${subLabel}</div>
      <div style="margin-top:6px;display:flex;align-items:center;justify-content:center;gap:14px">
        <button data-level-hero-nav="prev" ${viewIndex <= 0 ? "disabled" : ""} style="background:none;border:none;cursor:pointer;padding:6px;display:flex;${viewIndex <= 0 ? "opacity:0.2" : ""}">
          <span class="icon-20" style="color:var(--muted);display:flex">${ICONS.chevronLeft}</span>
        </button>
        <div style="position:relative;display:inline-flex">
          ${(() => {
            // Badgen får samma rörliga sken som profilbilden/flikarna - men bara
            // om det valda skenet faktiskt är en rörlig effekt (en statisk färg
            // ser inte bra ut runt badgen), upplåst i samma takt som övriga
            // sken (från level 5), på din faktiska aktuella nivå, och bara om
            // inställningen inte är avstängd. Aktivt oavsett vilken badge man
            // bläddrat till (nuvarande ELLER tidigare uppnådd) - bara inte på
            // ännu olåsta/framtida badges, som redan är nedtonade.
            const currentFrameKey = resolveProfileFrame();
            const beltRingActive = !isLocked && beltBadgeFrameEnabled
              && FRAME_EFFECT_KEYS.includes(currentFrameKey)
              && (info.level >= (PROFILE_FRAME_UNLOCK_LEVEL[currentFrameKey] || 1) || debugForceUnlockCosmetics);
            const beltFrame = beltRingActive ? profileFrameWrapStyle(currentFrameKey, 4, "octagon") : null;
            const beltCycleAttrs = beltRingActive && currentFrameKey === "allaMinaRamar" ? ` data-cycle-all="1" data-cycle-padding="4" data-cycle-shape="octagon"` : "";
            if (!belt.image) {
              return `<span style="width:56px;height:56px;display:flex;color:${nameColor};${isLocked ? "opacity:0.45;" : ""}">${ICONS.belt}</span>`;
            }
            const img = `<img src="${belt.image}" alt="${belt.name}" style="height:88px;width:auto;object-fit:contain;${isLocked ? "filter:grayscale(1);opacity:0.45;" : ""}" />`;
            // Samma padding reserveras alltid (även utan aktiv ring) så att
            // badgens storlek inte hoppar till när man växlar mellan en
            // statisk färg och en rörlig effekt.
            return beltFrame
              ? `<div class="${beltFrame.className}" style="${beltFrame.style}"${beltCycleAttrs}>${img}</div>`
              : `<div style="padding:4px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${img}</div>`;
          })()}
          ${stripeCount > 0 ? `<div class="belt-stripe-scroll" style="position:absolute;left:100%;top:50%;transform:translateY(-50%);margin-left:10px;display:flex;flex-wrap:nowrap;gap:3px;max-width:61px;overflow-x:auto">
            ${Array.from({ length: stripeCount }, () => `<span style="width:5px;height:26px;background:#FFFFFF;border:1.5px solid #000000;border-radius:1px;display:inline-block;flex-shrink:0"></span>`).join("")}
          </div>` : ""}
        </div>
        <button data-level-hero-nav="next" ${viewIndex >= maxViewIndex ? "disabled" : ""} style="background:none;border:none;cursor:pointer;padding:6px;display:flex;${viewIndex >= maxViewIndex ? "opacity:0.2" : ""}">
          <span class="icon-20" style="color:var(--muted);display:flex">${ICONS.chevronRight}</span>
        </button>
      </div>
    </div>
  `;
}
function renderLevelHeroCard() {
  const wrap = document.getElementById("levelHeroCardWrap");
  if (!wrap) return;
  wrap.innerHTML = levelHeroCardHTML();
  wireLevelHeroCardEvents();
}
function wireLevelHeroCardEvents() {
  document.querySelectorAll("[data-level-hero-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tiers = activeTierSet();
      const currentIndex = tiers.indexOf(getBeltForLevel(computeLevelInfo(totalXp()).level));
      const maxViewIndex = Math.min(tiers.length - 1, currentIndex + 1);
      if (btn.dataset.levelHeroNav === "prev") levelHeroViewIndex = Math.max(0, levelHeroViewIndex - 1);
      else levelHeroViewIndex = Math.min(maxViewIndex, levelHeroViewIndex + 1);
      renderLevelHeroCard();
    });
  });
}

/* ---------------- Veckans utmaning ---------------- */

function isDateInThisWeek(dateStr) {
  const start = mondayOf(todayISO());
  const end = addDays(start, 6);
  return dateStr >= start && dateStr <= end;
}
function thisWeekTrainingEntries() {
  return workoutEntries.filter((e) => isTraining(e) && isDateInThisWeek(e.date));
}
function thisWeekSubmissionIds() {
  const ids = [];
  thisWeekTrainingEntries().forEach((e) => { (e.submissions || []).forEach((id) => ids.push(id)); });
  return ids;
}

const WEEKLY_CHALLENGE_POOL = {
  submissions: [
    { id: "sub_triple_cat", title: "Alla tre typer", desc: "Få in minst ett armlås, ett stryp och ett benlås denna vecka.",
      check: () => {
        const ids = thisWeekSubmissionIds();
        const cats = new Set(ids.map((id) => (submissionTypes.find((s) => s.id === id) || {}).category));
        return cats.has("chokes") && cats.has("armlocks") && cats.has("leglocks");
      } },
    { id: "sub_kneebar_twister_banana", title: "Kneebar, Twister & Banana Split", desc: "Få in Kneebar, Twister och Banana Split denna vecka.",
      check: () => { const ids = thisWeekSubmissionIds(); return ["kneebar", "twister", "banana_split"].every((id) => ids.includes(id)); } },
    { id: "sub_choke_x2", title: "Stryp-veckan", desc: "Få in minst 2 olika stryp-submissions denna vecka.",
      check: () => { const ids = new Set(thisWeekSubmissionIds().filter((id) => (submissionTypes.find((s) => s.id === id) || {}).category === "chokes")); return ids.size >= 2; } },
    { id: "sub_armlock_x2", title: "Armlås-veckan", desc: "Få in minst 2 olika armlås denna vecka.",
      check: () => { const ids = new Set(thisWeekSubmissionIds().filter((id) => (submissionTypes.find((s) => s.id === id) || {}).category === "armlocks")); return ids.size >= 2; } },
    { id: "sub_leglock_x2", title: "Benlås-veckan", desc: "Få in minst 2 olika ben- och fotledslås denna vecka.",
      check: () => { const ids = new Set(thisWeekSubmissionIds().filter((id) => (submissionTypes.find((s) => s.id === id) || {}).category === "leglocks")); return ids.size >= 2; } },
    { id: "sub_hunter", title: "Submission-jägaren", desc: "Få in minst 3 submissions denna vecka (oavsett typ).",
      check: () => thisWeekSubmissionIds().length >= 3 },
    { id: "sub_rnc_x2", title: "RNC-mästaren", desc: "Få in RNC minst 2 gånger denna vecka.",
      check: () => thisWeekSubmissionIds().filter((id) => id === "rnc").length >= 2 },
    { id: "sub_first_of_week", title: "Kom igång", desc: "Få in minst en submission denna vecka.",
      check: () => thisWeekSubmissionIds().length >= 1 },
    { id: "sub_variety3", title: "Tre olika", desc: "Få in tre olika submissions (inte samma två gånger) denna vecka.",
      check: () => new Set(thisWeekSubmissionIds()).size >= 3 },
    { id: "sub_ankle_focus", title: "Fotledsfokus", desc: "Få in en Straight Ankle Lock eller Heel Hook denna vecka.",
      check: () => thisWeekSubmissionIds().some((id) => ["straight_ankle_lock", "heel_hook_inside", "heel_hook_outside"].includes(id)) },
    { id: "sub_guillotine_hunt", title: "Guillotine-jakt", desc: "Få in en Guillotine Choke denna vecka.",
      check: () => thisWeekSubmissionIds().includes("guillotine") },
    { id: "sub_triangle_hunt", title: "Triangel-jakt", desc: "Få in en Triangle Choke denna vecka.",
      check: () => thisWeekSubmissionIds().includes("triangle") },
    { id: "sub_americana_kimura", title: "Americana eller Kimura", desc: "Få in en Americana eller Kimura denna vecka.",
      check: () => thisWeekSubmissionIds().some((id) => ["americana", "kimura"].includes(id)) },
    { id: "sub_omoplata", title: "Omoplata", desc: "Få in en Omoplata denna vecka.",
      check: () => thisWeekSubmissionIds().includes("omoplata") },
    { id: "sub_three_passes", title: "Tre pass med submissions", desc: "Få in submissions under 3 olika träningspass denna vecka.",
      check: () => thisWeekTrainingEntries().filter((e) => e.submissions && e.submissions.length > 0).length >= 3 },
    { id: "sub_repeat", title: "Dubblett", desc: "Få in samma submission vid två olika tillfällen denna vecka.",
      check: () => { const ids = thisWeekSubmissionIds(); const counts = {}; ids.forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); return Object.values(counts).some((c) => c >= 2); } },
    { id: "sub_beginner_lock", title: "Nybörjarlås", desc: "Få in en Armbar eller Straight Armlock denna vecka.",
      check: () => thisWeekSubmissionIds().some((id) => ["armbar", "straight_armlock"].includes(id)) },
    { id: "sub_darce_anaconda", title: "D'Arce eller Anaconda", desc: "Få in en D'Arce Choke eller Anaconda Choke denna vecka.",
      check: () => thisWeekSubmissionIds().some((id) => ["darce", "anaconda"].includes(id)) },
    { id: "sub_twister_hunt", title: "Twister-jakt", desc: "Få in en Twister denna vecka.",
      check: () => thisWeekSubmissionIds().includes("twister") },
    { id: "sub_scissors", title: "Sax", desc: "Få in en Scissors Choke denna vecka.",
      check: () => thisWeekSubmissionIds().includes("scissors_choke") },
    { id: "sub_five", title: "Fem submissions", desc: "Få in totalt 5 submissions denna vecka, oavsett typ.",
      check: () => thisWeekSubmissionIds().length >= 5 },
    { id: "sub_same_cat_x3", title: "Samma kategori x3", desc: "Få in 3 submissions ur samma kategori denna vecka.",
      check: () => {
        const counts = {};
        thisWeekSubmissionIds().forEach((id) => { const cat = (submissionTypes.find((s) => s.id === id) || {}).category || "ovrigt"; counts[cat] = (counts[cat] || 0) + 1; });
        return Object.values(counts).some((c) => c >= 3);
      } },
    { id: "sub_necktie_northsouth", title: "Peruvian Necktie eller North-South", desc: "Få in en Peruvian Necktie eller North-South Choke denna vecka.",
      check: () => thisWeekSubmissionIds().some((id) => ["peruvian_necktie", "north_south"].includes(id)) },
    { id: "sub_scarf", title: "Scarf Hold", desc: "Få in en Scarf Hold denna vecka.",
      check: () => thisWeekSubmissionIds().includes("scarf_hold_armlock") },
    { id: "sub_two_passes", title: "Två pass med submissions", desc: "Få in submissions på minst 2 olika pass denna vecka.",
      check: () => thisWeekTrainingEntries().filter((e) => e.submissions && e.submissions.length > 0).length >= 2 },
    { id: "sub_weakest_five", title: "Svagaste länken", desc: "Få in en submission bland dina 5 med lägst träffprocent (som det såg ut när veckan startade).",
      check: () => {
        const snapshot = weeklyChallengeState.weakestSubmissionsSnapshot || [];
        return thisWeekSubmissionIds().some((id) => snapshot.includes(id));
      } },
  ],
  training: [
    { id: "tr_3pass", title: "3 pass", desc: "Träna minst 3 pass denna vecka.",
      check: () => thisWeekTrainingEntries().length >= 3 },
    { id: "tr_60cardio", title: "60 min kondition", desc: "Träna minst 60 minuters kondition denna vecka.",
      check: () => thisWeekTrainingEntries().filter(isCardio).reduce((s, e) => s + e.minutes, 0) >= 60 },
    { id: "tr_gym_and_cardio", title: "Styrka + kondition", desc: "Träna minst ett styrkepass och ett konditionspass denna vecka.",
      check: () => { const w = thisWeekTrainingEntries(); return w.some(isGymType) && w.some(isCardio); } },
    { id: "tr_doubleday", title: "Dubbelpass", desc: "Träna två pass samma dag denna vecka.",
      check: () => {
        const counts = {};
        thisWeekTrainingEntries().forEach((e) => { counts[e.date] = (counts[e.date] || 0) + 1; });
        return Object.values(counts).some((c) => c >= 2);
      } },
    { id: "tr_martial_x2", title: "Kampsport x2", desc: "Träna minst 2 kampsportspass denna vecka.",
      check: () => thisWeekTrainingEntries().filter(isMartialArts).length >= 2 },
    { id: "tr_120min", title: "2 timmar totalt", desc: "Samla minst 120 minuters träning denna vecka.",
      check: () => thisWeekTrainingEntries().reduce((s, e) => s + e.minutes, 0) >= 120 },
    { id: "tr_cardio_x2", title: "Kondition x2", desc: "Träna minst 2 konditionspass denna vecka.",
      check: () => thisWeekTrainingEntries().filter(isCardio).length >= 2 },
    { id: "tr_gym_x2", title: "Styrka x2", desc: "Träna minst 2 styrkepass denna vecka.",
      check: () => thisWeekTrainingEntries().filter(isGymType).length >= 2 },
    { id: "tr_early_week", title: "Igång tidigt", desc: "Träna senast tisdag denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => [1, 2].includes(new Date(e.date + "T00:00:00").getDay())) },
    { id: "tr_4pass", title: "4 pass", desc: "Träna minst 4 pass denna vecka.",
      check: () => thisWeekTrainingEntries().length >= 4 },
    { id: "tr_90cardio", title: "90 min kondition", desc: "Träna minst 90 minuters kondition denna vecka.",
      check: () => thisWeekTrainingEntries().filter(isCardio).reduce((s, e) => s + e.minutes, 0) >= 90 },
    { id: "tr_150min", title: "150 min totalt", desc: "Samla minst 150 minuters träning denna vecka.",
      check: () => thisWeekTrainingEntries().reduce((s, e) => s + e.minutes, 0) >= 150 },
    { id: "tr_martial_x3", title: "Kampsport x3", desc: "Träna minst 3 kampsportspass denna vecka.",
      check: () => thisWeekTrainingEntries().filter(isMartialArts).length >= 3 },
    { id: "tr_all_three_cats", title: "Alla tre kategorier", desc: "Träna minst ett pass i kondition, kampsport och styrka denna vecka.",
      check: () => { const w = thisWeekTrainingEntries(); return w.some(isCardio) && w.some(isMartialArts) && w.some(isGymType); } },
    { id: "tr_run", title: "Löprunda", desc: "Logga ett löppass denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.type === "Löpning") },
    { id: "tr_bike", title: "Cykeltur", desc: "Logga ett cykel- eller motionscykelpass denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.type === "Cykel" || e.type === "Motionscykel") },
    { id: "tr_other_type", title: "Egen kategori", desc: "Logga ett träningspass av typen Övrigt denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.type === "Ovrigt") },
    { id: "tr_full_log", title: "Fullständig logg", desc: "Logga ett pass med både kommentar och avancerat betyg denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.note && e.note.trim().length > 0 && e.ratings && Object.keys(e.ratings).length > 0) },
    { id: "tr_distance", title: "Distanspass", desc: "Logga ett träningspass med distans ifyllt denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.note && /\d+([.,]\d+)?\s*km/.test(e.note)) },
    { id: "tr_short", title: "Kort och snabbt", desc: "Logga ett pass under 30 minuter denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.minutes > 0 && e.minutes < 30) },
    { id: "tr_long", title: "Långpass", desc: "Logga ett pass över 60 minuter denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.minutes > 60) },
    { id: "tr_variety2", title: "Blandat", desc: "Träna minst 2 olika träningstyper denna vecka.",
      check: () => new Set(thisWeekTrainingEntries().map((e) => e.type)).size >= 2 },
    { id: "tr_leg_day", title: "Bendagen", desc: "Träna ett benpass denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.type === "Gym" && gymSplitTextIncludes(e, "ben")) },
    { id: "tr_chest_back", title: "Bröst och rygg", desc: "Träna både bröst och rygg denna vecka.",
      check: () => {
        const w = thisWeekTrainingEntries().filter((e) => e.type === "Gym");
        return w.some((e) => gymSplitTextIncludes(e, "bröst")) && w.some((e) => gymSplitTextIncludes(e, "rygg"));
      } },
  ],
  other: [
    { id: "ot_calorie_log", title: "Logga kalorier", desc: "Logga kalorier minst en gång denna vecka.",
      check: () => calorieLog.some((e) => isDateInThisWeek(e.date)) },
    { id: "ot_read_about", title: "Läs om appen", desc: "Öppna \"Om Workout Tracker\" och läs igenom den.",
      check: () => weeklyMisc.aboutOpenedWeek === mondayOf(todayISO()) },
    { id: "ot_evaluate", title: "Utvärdera ett pass", desc: "Utvärdera ett BJJ/SW- eller gympass med avancerad meny denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.ratings && Object.keys(e.ratings).length > 0) },
    { id: "ot_comment", title: "Lämna en kommentar", desc: "Skriv en kommentar på ett träningspass denna vecka.",
      check: () => thisWeekTrainingEntries().some((e) => e.note && e.note.trim().length > 0) },
    { id: "ot_weigh_in", title: "Väg dig", desc: "Logga din vikt denna vecka.",
      check: () => weightEntries.some((e) => isDateInThisWeek(e.date)) },
    { id: "ot_calorie_3days", title: "Kalorier 3 dagar", desc: "Logga kalorier 3 olika dagar denna vecka.",
      check: () => new Set(calorieLog.filter((e) => isDateInThisWeek(e.date)).map((e) => e.date)).size >= 3 },
    { id: "ot_visit_stats", title: "Koll på läget", desc: "Besök Statistik-fliken denna vecka.",
      check: () => weeklyMisc.statsVisitedWeek === mondayOf(todayISO()) },
    { id: "ot_log_submission", title: "Testa en submission", desc: "Logga minst en submission denna vecka.",
      check: () => thisWeekSubmissionIds().length >= 1 },
    { id: "ot_comment_x2", title: "Två kommentarer", desc: "Skriv kommentarer på två olika pass denna vecka.",
      check: () => thisWeekTrainingEntries().filter((e) => e.note && e.note.trim().length > 0).length >= 2 },
    { id: "ot_weight_and_calorie_sameday", title: "Dubbelloggning", desc: "Logga både vikt och kalorier samma dag denna vecka.",
      check: () => {
        const weightDates = new Set(weightEntries.filter((e) => isDateInThisWeek(e.date)).map((e) => e.date));
        return calorieLog.some((e) => isDateInThisWeek(e.date) && weightDates.has(e.date));
      } },
    { id: "ot_year_review", title: "Koll på året", desc: "Öppna Årskrönikan denna vecka.",
      check: () => weeklyMisc.yearReviewOpenedWeek === mondayOf(todayISO()) },
    { id: "ot_create_type", title: "Skapa eget pass", desc: "Skapa ett nytt eget träningspass under \"Hantera\".",
      check: () => weeklyMisc.customTypeCreatedWeek === mondayOf(todayISO()) },
    { id: "ot_create_and_try", title: "Skapa och prova", desc: "Skapa ett nytt eget träningspass och logga minst ett pass med det, samma vecka.",
      check: () => {
        if (weeklyMisc.customTypeCreatedWeek !== mondayOf(todayISO()) || !weeklyMisc.customTypeCreatedKey) return false;
        return thisWeekTrainingEntries().some((e) => e.type === weeklyMisc.customTypeCreatedKey);
      } },
    { id: "ot_update_belt", title: "Uppdatera ett bälte", desc: "Sätt eller ändra ett datum bland dina bälten i profilen.",
      check: () => weeklyMisc.beltDateUpdatedWeek === mondayOf(todayISO()) },
    { id: "ot_new_tab_color", title: "Ny flikfärg", desc: "Byt färg på en flik i inställningarna.",
      check: () => weeklyMisc.tabColorChangedWeek === mondayOf(todayISO()) },
    { id: "ot_set_calorie_goal", title: "Sätt ett kalorimål", desc: "Ställ in eller ändra ditt kalorimål i Kalorier-fliken.",
      check: () => weeklyMisc.calorieGoalSetWeek === mondayOf(todayISO()) },
    { id: "ot_switch_theme", title: "Byt utseende", desc: "Växla mellan mörkt och ljust läge.",
      check: () => weeklyMisc.themeChangedWeek === mondayOf(todayISO()) },
    { id: "ot_explore_achievements", title: "Utforska prestationerna", desc: "Öppna \"Visa alla\" bland prestationerna.",
      check: () => weeklyMisc.achievementsExploredWeek === mondayOf(todayISO()) },
    { id: "ot_backup", title: "Säkerhetskopiera", desc: "Gör en export/säkerhetskopia av din data.",
      check: () => weeklyMisc.backupExportedWeek === mondayOf(todayISO()) },
    { id: "ot_new_preset", title: "Ny snabbknapp", desc: "Lägg till en ny snabbknapp för kalorier.",
      check: () => weeklyMisc.newPresetAddedWeek === mondayOf(todayISO()) },
    { id: "ot_calorie_streak3", title: "Kalorier 3 dagar i rad", desc: "Logga kalorier tre dagar i rad denna vecka.",
      check: () => longestConsecutiveRun(calorieLog.filter((e) => isDateInThisWeek(e.date)).map((e) => e.date)) >= 3 },
    { id: "ot_weigh_in_x2", title: "Väg dig två gånger", desc: "Logga vikt två olika dagar denna vecka.",
      check: () => new Set(weightEntries.filter((e) => isDateInThisWeek(e.date)).map((e) => e.date)).size >= 2 },
    { id: "ot_switch_level_theme", title: "Testa ett nytt tema", desc: "Byt till Fitness-temat (eller tillbaka till Bälte) under Inställningar.",
      check: () => weeklyMisc.levelThemeChangedWeek === mondayOf(todayISO()) },
    { id: "ot_icon_size", title: "Testa ikonstorlek", desc: "Byt mellan mindre och större ikoner i flikraden under Inställningar.",
      check: () => weeklyMisc.iconSizeChangedWeek === mondayOf(todayISO()) },
    { id: "ot_badge_color", title: "Ny bakgrundsfärg", desc: "Byt bakgrundsfärgen bakom flik-bilderna under Inställningar.",
      check: () => weeklyMisc.badgeColorChangedWeek === mondayOf(todayISO()) },
    { id: "ot_edit_pass_other", title: "Redigera ett pass", desc: "Redigera ett redan loggat träningspass denna vecka.",
      check: () => weeklyMisc.workoutEditedWeek === mondayOf(todayISO()) },
    { id: "ot_open_profile", title: "Kolla din profil", desc: "Öppna din profil denna vecka.",
      check: () => weeklyMisc.profileOpenedWeek === mondayOf(todayISO()) },
  ],
};
function markWeeklyMiscFlag(key) {
  const monday = mondayOf(todayISO());
  if (weeklyMisc[key] !== monday) {
    weeklyMisc[key] = monday;
    saveWeeklyMisc();
    checkWeeklyChallenges();
  }
}

function findWeeklyChallengeById(id) {
  for (const cat of Object.keys(WEEKLY_CHALLENGE_POOL)) {
    const found = WEEKLY_CHALLENGE_POOL[cat].find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}

function loadWeeklyMisc() {
  try {
    const raw = localStorage.getItem("weekly_misc_v1");
    if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") return parsed; }
  } catch (e) { /* fall through */ }
  return {
    aboutOpenedWeek: null, statsVisitedWeek: null, yearReviewOpenedWeek: null,
    customTypeCreatedWeek: null, customTypeCreatedKey: null, beltDateUpdatedWeek: null,
    tabColorChangedWeek: null, calorieGoalSetWeek: null, themeChangedWeek: null,
    achievementsExploredWeek: null, backupExportedWeek: null, newPresetAddedWeek: null,
    levelThemeChangedWeek: null, workoutEditedWeek: null, profileOpenedWeek: null,
    iconSizeChangedWeek: null, badgeColorChangedWeek: null,
  };
}
function saveWeeklyMisc() {
  try { localStorage.setItem("weekly_misc_v1", JSON.stringify(weeklyMisc)); } catch (e) { /* ignore */ }
}
let weeklyMisc = loadWeeklyMisc();

function loadWeeklyChallengeState() {
  try {
    const raw = localStorage.getItem("weekly_challenge_state_v1");
    if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") return parsed; }
  } catch (e) { /* fall through */ }
  return { weekStart: null, ids: [], completed: [], bonusAwarded: false };
}
function saveWeeklyChallengeState() {
  try { localStorage.setItem("weekly_challenge_state_v1", JSON.stringify(weeklyChallengeState)); } catch (e) { /* ignore */ }
}
let weeklyChallengeState = loadWeeklyChallengeState();

function loadWeeklyChallengeXp() {
  try { return parseInt(localStorage.getItem("weekly_challenge_xp_v1"), 10) || 0; } catch (e) { return 0; }
}
function saveWeeklyChallengeXp() {
  try { localStorage.setItem("weekly_challenge_xp_v1", String(weeklyChallengeXp)); } catch (e) { /* ignore */ }
}
let weeklyChallengeXp = loadWeeklyChallengeXp();

function loadWeeklyChallengeHistory() {
  try {
    const raw = localStorage.getItem("weekly_challenge_history_v1");
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveWeeklyChallengeHistory() {
  try { localStorage.setItem("weekly_challenge_history_v1", JSON.stringify(weeklyChallengeHistory)); } catch (e) { /* ignore */ }
}
let weeklyChallengeHistory = loadWeeklyChallengeHistory();

/* ---------------- Submission-bingo ---------------- */

function loadSubmissionBingoEnabled() {
  try { const raw = localStorage.getItem("submission_bingo_enabled_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveSubmissionBingoEnabled() {
  try { localStorage.setItem("submission_bingo_enabled_v1", String(submissionBingoEnabled)); } catch (e) { /* ignore */ }
}
let submissionBingoEnabled = loadSubmissionBingoEnabled();

function loadShowSubmissionBingo() {
  try { const raw = localStorage.getItem("show_submission_bingo_v1"); return raw === null ? true : raw === "true"; } catch (e) { return true; }
}
function saveShowSubmissionBingo() {
  try { localStorage.setItem("show_submission_bingo_v1", String(showSubmissionBingo)); } catch (e) { /* ignore */ }
}
let showSubmissionBingo = loadShowSubmissionBingo();

function loadBingoCard() {
  try { const raw = localStorage.getItem("bingo_card_v1"); if (raw) return JSON.parse(raw); } catch (e) { /* fall through */ }
  return null;
}
function saveBingoCard() {
  try {
    if (bingoCard) localStorage.setItem("bingo_card_v1", JSON.stringify(bingoCard));
    else localStorage.removeItem("bingo_card_v1");
  } catch (e) { /* ignore */ }
}
let bingoCard = loadBingoCard();

function loadBingoHistory() {
  try { const raw = localStorage.getItem("bingo_history_v1"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } } catch (e) { /* fall through */ }
  return [];
}
function saveBingoHistory() {
  try { localStorage.setItem("bingo_history_v1", JSON.stringify(bingoHistory)); } catch (e) { /* ignore */ }
}
let bingoHistory = loadBingoHistory();

function loadBingoXp() {
  try { return parseInt(localStorage.getItem("bingo_xp_v1"), 10) || 0; } catch (e) { return 0; }
}
function saveBingoXp() {
  try { localStorage.setItem("bingo_xp_v1", String(bingoXp)); } catch (e) { /* ignore */ }
}
let bingoXp = loadBingoXp();

function loadBingoLifetimeStats() {
  try {
    const raw = localStorage.getItem("bingo_lifetime_stats_v1");
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
  } catch (e) { /* fall through */ }
  return { anyLine: false, anyCorners: false, anyX: false, anyRing: false, fullCount: 0, cardsPlayed: 0, squaresChecked: 0, squaresTotal: 0 };
}
function saveBingoLifetimeStats() {
  try { localStorage.setItem("bingo_lifetime_stats_v1", JSON.stringify(bingoLifetimeStats)); } catch (e) { /* ignore */ }
}
let bingoLifetimeStats = loadBingoLifetimeStats();

const BINGO_WILDCARDS = [
  { key: "wild_any", label: "Valfri submission" },
  { key: "wild_choke", label: "Valfri choke" },
  { key: "wild_leglock", label: "Ett benlås" },
];

function generateBingoSquares() {
  const enabledSubs = submissionTypes.filter((s) => s.enabled);
  const pool = [
    ...BINGO_WILDCARDS.map((w) => ({ type: "wild", key: w.key, label: w.label })),
    ...enabledSubs.map((s) => ({ type: "specific", key: s.id, label: s.label, category: s.category })),
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(25, pool.length)).map((p) => ({ ...p, checked: false }));
}

function startNewBingoCard() {
  const start = todayISO();
  bingoCard = {
    startDate: start,
    endDate: addDays(start, 30),
    squares: generateBingoSquares(),
    rerollUsed: false,
    xpAwarded: 0,
  };
  saveBingoCard();
  bingoLifetimeStats.cardsPlayed += 1;
  bingoLifetimeStats.squaresTotal += bingoCard.squares.length;
  saveBingoLifetimeStats();
}

function rerollBingoCard() {
  if (!bingoCard || bingoCard.rerollUsed) return;
  bingoLifetimeStats.squaresChecked -= bingoCard.squares.filter((s) => s.checked).length;
  bingoCard.squares = generateBingoSquares();
  bingoCard.rerollUsed = true;
  bingoCard.xpAwarded = 0;
  saveBingoCard();
  saveBingoLifetimeStats();
}

function computeBingoStats(card) {
  const grid = card.squares.map((s) => !!s.checked);
  const n = grid.length;
  if (n < 25) return { lineCount: 0, hasX: false, hasCorners: false, hasRing: false, isFull: grid.every((v) => v), xp: 0, checkedCount: grid.filter((v) => v).length };
  const rows = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24]];
  const cols = [[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24]];
  const diag1 = [0,6,12,18,24], diag2 = [4,8,12,16,20];
  const corners = [0,4,20,24];
  const ring = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24];
  const lineCount = [...rows, ...cols].filter((l) => l.every((i) => grid[i])).length;
  const hasX = diag1.every((i) => grid[i]) && diag2.every((i) => grid[i]);
  const hasCorners = corners.every((i) => grid[i]);
  const hasRing = ring.every((i) => grid[i]);
  const isFull = grid.every((v) => v);
  const lineXp = { 0: 0, 1: 75, 2: 150, 3: 225, 4: 300 }[Math.min(lineCount, 4)] || 0;
  const raw = lineXp + (hasX ? 100 : 0) + (hasCorners ? 50 : 0) + (isFull ? 500 : 0);
  return { lineCount, hasX, hasCorners, hasRing, isFull, xp: Math.min(500, raw), checkedCount: grid.filter((v) => v).length };
}

function updateBingoProgress() {
  if (!bingoCard) return;
  const stats = computeBingoStats(bingoCard);
  if (stats.lineCount >= 1) bingoLifetimeStats.anyLine = true;
  if (stats.hasCorners) bingoLifetimeStats.anyCorners = true;
  if (stats.hasX) bingoLifetimeStats.anyX = true;
  if (stats.hasRing) bingoLifetimeStats.anyRing = true;
  if (stats.xp > (bingoCard.xpAwarded || 0)) {
    const delta = stats.xp - (bingoCard.xpAwarded || 0);
    bingoXp += delta;
    saveBingoXp();
    bingoCard.xpAwarded = stats.xp;
    showInfoToast(`🥋 +${delta} XP från Submission-bingo!`);
  }
  saveBingoCard();
  saveBingoLifetimeStats();
  checkAchievements();
}

function checkBingoSquaresForSubmissionIds(submissionIds) {
  if (!submissionBingoEnabled || !bingoCard || !Array.isArray(submissionIds) || !submissionIds.length) return;
  let anyChanged = false;
  submissionIds.forEach((subId) => {
    const subDef = submissionTypes.find((s) => s.id === subId);
    if (!subDef) return;
    let idx = bingoCard.squares.findIndex((sq) => !sq.checked && sq.type === "specific" && sq.key === subId);
    if (idx === -1 && subDef.category === "chokes") {
      idx = bingoCard.squares.findIndex((sq) => !sq.checked && sq.key === "wild_choke");
    }
    if (idx === -1 && subDef.category === "leglocks") {
      idx = bingoCard.squares.findIndex((sq) => !sq.checked && sq.key === "wild_leglock");
    }
    if (idx === -1) {
      idx = bingoCard.squares.findIndex((sq) => !sq.checked && sq.key === "wild_any");
    }
    if (idx !== -1) {
      bingoCard.squares[idx].checked = true;
      bingoLifetimeStats.squaresChecked += 1;
      anyChanged = true;
    }
  });
  if (anyChanged) updateBingoProgress();
}

function archiveBingoCard() {
  if (!bingoCard) return;
  const stats = computeBingoStats(bingoCard);
  bingoHistory.push({ startDate: bingoCard.startDate, endDate: todayISO(), checkedCount: stats.checkedCount, isFull: stats.isFull, lineCount: stats.lineCount, hasCorners: stats.hasCorners, hasX: stats.hasX, xp: bingoCard.xpAwarded || 0 });
  if (stats.isFull) bingoLifetimeStats.fullCount += 1;
  if (stats.lineCount >= 2) bingoLifetimeStats.lines2Count = (bingoLifetimeStats.lines2Count || 0) + 1;
  if (stats.lineCount >= 3) bingoLifetimeStats.lines3Count = (bingoLifetimeStats.lines3Count || 0) + 1;
  if (stats.hasCorners) bingoLifetimeStats.cornersCount = (bingoLifetimeStats.cornersCount || 0) + 1;
  if (stats.hasX) bingoLifetimeStats.xCount = (bingoLifetimeStats.xCount || 0) + 1;
  saveBingoHistory();
  saveBingoLifetimeStats();
  checkAchievements();
}

function startNextBingoCardEarly() {
  archiveBingoCard();
  startNewBingoCard();
}

function rollBingoCardIfNeeded() {
  if (!submissionBingoEnabled) return;
  if (!bingoCard) { startNewBingoCard(); return; }
  if (todayISO() > bingoCard.endDate) {
    archiveBingoCard();
    startNewBingoCard();
  }
}

function weeklyChallengeXpAmounts() {
  const level = computeLevelInfo(totalXp()).level;
  if (level >= 20) return { perChallenge: 30, bonus: 60 };
  if (level >= 10) return { perChallenge: 20, bonus: 40 };
  return { perChallenge: 15, bonus: 30 };
}

function computeWeakestFiveSubmissionIds() {
  const totalMartial = workoutEntries.filter((e) => e.type === "BJJ" || e.type === "SW").length;
  const counts = {};
  workoutEntries.forEach((e) => { (e.submissions || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); });
  return submissionTypes
    .filter((s) => s.enabled)
    .map((s) => ({ id: s.id, pct: totalMartial ? (counts[s.id] || 0) / totalMartial : 0 }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5)
    .map((s) => s.id);
}

function rollWeeklyChallengesIfNeeded() {
  const currentMonday = mondayOf(todayISO());
  if (weeklyChallengeState.weekStart === currentMonday) return;
  if (weeklyChallengeState.weekStart) {
    weeklyChallengeHistory.push({ weekStart: weeklyChallengeState.weekStart, completed: weeklyChallengeState.completed.length, total: weeklyChallengeState.ids.length });
    saveWeeklyChallengeHistory();
  }
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const ids = [
    pickOne(WEEKLY_CHALLENGE_POOL.submissions).id,
    pickOne(WEEKLY_CHALLENGE_POOL.training).id,
    pickOne(WEEKLY_CHALLENGE_POOL.other).id,
  ];
  weeklyChallengeState = { weekStart: currentMonday, ids, completed: [], bonusAwarded: false };
  if (ids.includes("sub_weakest_five")) weeklyChallengeState.weakestSubmissionsSnapshot = computeWeakestFiveSubmissionIds();
  saveWeeklyChallengeState();
}

function startNextWeeklyChallengeEarly() {
  weeklyChallengeHistory.push({ weekStart: weeklyChallengeState.weekStart, completed: weeklyChallengeState.completed.length, total: weeklyChallengeState.ids.length });
  saveWeeklyChallengeHistory();
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const ids = [
    pickOne(WEEKLY_CHALLENGE_POOL.submissions).id,
    pickOne(WEEKLY_CHALLENGE_POOL.training).id,
    pickOne(WEEKLY_CHALLENGE_POOL.other).id,
  ];
  // weekStart stays as-is on purpose: the automatic Monday reroll still fires on schedule,
  // this just gives a fresh set of 3 to chase for whatever's left of the current week.
  weeklyChallengeState = { ...weeklyChallengeState, ids, completed: [], bonusAwarded: false };
  if (ids.includes("sub_weakest_five")) weeklyChallengeState.weakestSubmissionsSnapshot = computeWeakestFiveSubmissionIds();
  saveWeeklyChallengeState();
}

function checkWeeklyChallenges() {
  rollWeeklyChallengesIfNeeded();
  const amounts = weeklyChallengeXpAmounts();
  let anyNew = false;
  weeklyChallengeState.ids.forEach((id) => {
    if (weeklyChallengeState.completed.includes(id)) return;
    const challenge = findWeeklyChallengeById(id);
    if (challenge && challenge.check()) {
      weeklyChallengeState.completed.push(id);
      weeklyChallengeXp += amounts.perChallenge;
      anyNew = true;
      celebrationQueue.push({ type: "weeklychallenge", challenge, xp: amounts.perChallenge });
    }
  });
  if (weeklyChallengeState.completed.length === 3 && !weeklyChallengeState.bonusAwarded) {
    weeklyChallengeState.bonusAwarded = true;
    weeklyChallengeXp += amounts.bonus;
    anyNew = true;
    celebrationQueue.push({ type: "weeklybonus", xp: amounts.bonus });
  }
  if (anyNew) {
    saveWeeklyChallengeState();
    saveWeeklyChallengeXp();
    if (celebrationQueue.length && !document.getElementById("celebrationOverlay")) showNextCelebration();
  }
}

const ACHIEVEMENT_CATEGORIES = [
  { label: "Träningsprestationer", ids: ["first_pass", "triple_ten", "double_combo_20", "double_combo_30", "total_25", "total_50", "total_75", "total_100", "total_250", "total_500", "total_750", "total_1000"] },
  { label: "Träningstid", ids: ["hours_10", "hours_week_5", "hours_25", "hours_week_10", "hours_50", "hours_cardio_5", "hours_100", "hours_month_25", "hours_gym_25", "hours_martial_25", "hours_martial_50", "hours_gym_50", "hours_250", "hours_500", "hours_750", "hours_1000", "hours_1500", "hours_2000"] },
  { label: "Streaks", ids: ["streak_3", "streak_5", "streak_7", "streak_10", "streak_15", "streak_20", "streak_25", "streak_30", "streak_35", "streak_40"] },
  { label: "Vecko- och månadsmål", ids: ["week_3", "week_5", "week_7", "week_10", "week_15", "week_all_three", "month_gym_10", "month_cardio_5", "month_15", "month_20", "month_cardio_10", "month_gym_20", "month_martial_15", "month_25", "month_all_three", "month_martial_gym_combo", "helkropp", "month_30", "month_35", "month_martial_25", "martial_3x3weeks", "martial_3x4weeks", "gym_3x4weeks", "month_40"] },
  { label: "Dubbelpass", ids: ["double_day", "double_day_2inweek", "double_day_5", "double_day_10", "double_day_weekend", "double_day_5inmonth", "double_day_25", "double_day_streak2", "double_day_3inweek", "double_day_50", "double_day_75", "double_day_100"] },
  { label: "Pass under året", ids: ["year_25", "year_50", "year_100", "year_150", "year_200", "year_250", "year_300", "year_gym_50", "year_combo_25", "year_combo_50", "year_combo_100"] },
  { label: "Viktprestationer", ids: ["weight_first", "weight_week", "weight_month", "weight_90days", "weight_6months", "weight_9months", "weight_year", "weight_50", "weight_100", "weight_150", "weight_250", "weight_500", "weight_weekly_3months", "weight_weekly_6months", "weight_weekly_9months", "weight_weekly_12months"] },
  { label: "Kondition", ids: ["cardio_first", "cardio_10", "jogging_5", "cardio_25", "loparen", "jogging_10", "cyklisten", "cardio_50", "jogging_25", "cardio_streak_3w", "cyklisten_50", "cardio_streak_4w", "cardio_100", "cardio_streak_5w", "cardio_150"] },
  { label: "Submissions", ids: ["submission_first", "choke_wizard", "armbar_wizard", "leglock_lunatic", "twister_twister", "choke_combo", "armbar_combo", "leg_combo", "triple_threat", "choke_combo_5", "armbar_combo_5", "leg_combo_5", "triple_threat_3", "triple_threat_5", "submission_one_of_each"] },
  { label: "Submission-bingo", ids: ["bingo_line", "bingo_corners", "bingo_x", "bingo_ring", "bingo_2lines", "bingo_3lines", "bingo_full", "bingo_2lines_5", "bingo_corners_5", "bingo_x_5", "bingo_full_5", "bingo_3lines_5", "bingo_corners_10", "bingo_x_10", "bingo_full_10"] },
  { label: "Övriga", ids: ["variety", "variety_2", "allround", "calorie_week", "calorie_30", "weekend_warrior", "weekend_warrior_10", "fredagsmys", "fredagsmys_2", "lordagsgodis", "lordagsgodis_2", "advanced_evaluation", "summer_warrior", "winter_warrior", "extreme_consistency", "marathon_trainer", "fartdaren", "fartcyklisten"] },
  { label: "New Game+", ids: ["ngp_iron_century", "ngp_combat_century", "ngp_cardio_century", "ngp_100", "ngp_500_club", "ngp_time_lord", "ngp_no_weeks_off", "ngp_long_game", "ngp_hybrid_athlete", "ngp_triple_century", "ngp_submission_master", "ngp_bingo_master", "ngp_250", "ngp_perfect_month", "ngp_perfect_quarter", "ngp_explorer", "ngp_grand_slam", "ngp_unstoppable", "ngp_perfect_year", "ngp_completionist"] },
  { label: "Hemliga", ids: ACHIEVEMENTS.filter((a) => a.secret).map((a) => a.id) },
];

const KAMPSPORT_ACHIEVEMENT_IDS = new Set([
  ...ACHIEVEMENT_CATEGORIES.find((c) => c.label === "Submissions").ids,
  ...ACHIEVEMENT_CATEGORIES.find((c) => c.label === "Submission-bingo").ids,
]);

function loadBgUnlockedAchievements() {
  try {
    const raw = localStorage.getItem("bg_unlocked_achievements_v1");
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveBgUnlockedAchievements() {
  try { localStorage.setItem("bg_unlocked_achievements_v1", JSON.stringify(bgUnlockedAchievements)); } catch (e) { /* ignore */ }
}
let bgUnlockedAchievements = loadBgUnlockedAchievements();

// Datumet du nådde 100% (alla prestationer upplåsta) - null tills dess.
// Styr platina-firandet (visas bara en gång, som en riktig milstolpe), den
// permanenta profilmarkören, och om "se firandet igen"-knappen ska synas.
function loadPlatinumUnlockedAt() {
  try { return localStorage.getItem("platinum_unlocked_at_v1") || null; } catch (e) { return null; }
}
function savePlatinumUnlockedAt() {
  try {
    if (platinumUnlockedAt) localStorage.setItem("platinum_unlocked_at_v1", platinumUnlockedAt);
    else localStorage.removeItem("platinum_unlocked_at_v1");
  } catch (e) { /* ignore */ }
}
let platinumUnlockedAt = loadPlatinumUnlockedAt();

// Hur stor andel av alla appens användare som nått platina - hämtas från
// Supabase (get_platinum_unlock_percentage RPC) och cachas lokalt så
// firande-kortet kan visa en siffra direkt även innan frågan hunnit svara.
function loadPlatinumStatsPct() {
  try {
    const raw = localStorage.getItem("platinum_stats_pct_v1");
    return raw ? Number(raw) : null;
  } catch (e) { return null; }
}
function savePlatinumStatsPct() {
  try {
    if (platinumStatsPct !== null) localStorage.setItem("platinum_stats_pct_v1", String(platinumStatsPct));
  } catch (e) { /* ignore */ }
}
let platinumStatsPct = loadPlatinumStatsPct();
async function fetchPlatinumStatsPct() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.rpc("get_platinum_unlock_percentage");
    if (error || data === null) return;
    platinumStatsPct = Number(data);
    savePlatinumStatsPct();
    const el = document.getElementById("platinumStatsPctSpan");
    if (el) el.textContent = platinumStatsPct.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
  } catch (e) { /* ignore - offline etc. */ }
}

// Bevingad krona - ett eget märke (skilt från ramarna) man kan sätta ovanför
// avataren när man nått platina. profile.crownEmblem: null (av) | "gold" |
// "diamond". Kräver platinumUnlockedAt, annars ignoreras valet.
function crownEmblemImgSrc(key) {
  if (key === "gold") return EMBLEM_CROWN_WINGS_GOLD;
  if (key === "diamond") return EMBLEM_CROWN_WINGS_DIAMOND;
  return null;
}
function crownEmblemOverlayHTML(key, widthPx) {
  if (!platinumUnlockedAt) return "";
  const src = crownEmblemImgSrc(key);
  if (!src) return "";
  return `<img src="${src}" alt="Bevingad krona" style="position:absolute;top:${-Math.round(widthPx * 0.34)}px;left:50%;transform:translateX(-50%);width:${widthPx}px;pointer-events:none" />`;
}
// Samma sak men för en väns emblem - styrs av deras EGET platinum_unlocked_at
// (från Supabase), inte den inloggade användarens.
function crownEmblemOverlayHTMLForFriend(crownEmblem, friendPlatinumUnlockedAt, widthPx) {
  if (!friendPlatinumUnlockedAt) return "";
  const src = crownEmblemImgSrc(crownEmblem);
  if (!src) return "";
  return `<img src="${src}" alt="Bevingad krona" style="position:absolute;top:${-Math.round(widthPx * 0.34)}px;left:50%;transform:translateX(-50%);width:${widthPx}px;pointer-events:none" />`;
}

function loadAchievementPrestige() {
  try {
    const raw = localStorage.getItem("achievement_prestige_v1");
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
  } catch (e) { /* fall through */ }
  return {};
}
function saveAchievementPrestige() {
  try { localStorage.setItem("achievement_prestige_v1", JSON.stringify(achievementPrestige)); } catch (e) { /* ignore */ }
}
let achievementPrestige = loadAchievementPrestige();

function loadPrestigeXp() {
  try { return parseInt(localStorage.getItem("prestige_xp_v1"), 10) || 0; } catch (e) { return 0; }
}
function savePrestigeXp() {
  try { localStorage.setItem("prestige_xp_v1", String(prestigeXp)); } catch (e) { /* ignore */ }
}
let prestigeXp = loadPrestigeXp();

function loadPrestigeBaseline() {
  try {
    const raw = localStorage.getItem("prestige_baseline_v1");
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
  } catch (e) { /* fall through */ }
  return {};
}
function savePrestigeBaseline() {
  try { localStorage.setItem("prestige_baseline_v1", JSON.stringify(prestigeBaseline)); } catch (e) { /* ignore */ }
}
let prestigeBaseline = loadPrestigeBaseline();

function loadPrestigeConsumedIds() {
  try {
    const raw = localStorage.getItem("prestige_consumed_ids_v1");
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
  } catch (e) { /* fall through */ }
  return {};
}
function savePrestigeConsumedIds() {
  try { localStorage.setItem("prestige_consumed_ids_v1", JSON.stringify(prestigeConsumedIds)); } catch (e) { /* ignore */ }
}
let prestigeConsumedIds = loadPrestigeConsumedIds();

function loadPrestigeStreakResetAt() {
  try {
    const raw = localStorage.getItem("prestige_streak_reset_at_v1");
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
  } catch (e) { /* fall through */ }
  return {};
}
function savePrestigeStreakResetAt() {
  try { localStorage.setItem("prestige_streak_reset_at_v1", JSON.stringify(prestigeStreakResetAt)); } catch (e) { /* ignore */ }
}
let prestigeStreakResetAt = loadPrestigeStreakResetAt();

// Achievements below require N consecutive qualifying weeks (a streak). "Longest streak ever"
// can't be reused as a simple growing counter for re-prestige: once you've hit a 5-week streak,
// building a brand-new (but separate, non-longer) 5-week streak later wouldn't register as
// progress against an all-time-record baseline. Instead we track a reset date per achievement —
// weeks up to and including that date don't count — so any fresh qualifying run of the required
// length found after that date re-qualifies, without needing to beat the previous record.
const STREAK_PRESTIGE_CONFIG = {
  // kind "week": N consecutive ISO weeks each with >= minPerWeek qualifying entries.
  weight_weekly_3months: { kind: "week", entries: () => weightEntries, minPerWeek: 1, target: 13 },
  weight_weekly_6months: { kind: "week", entries: () => weightEntries, minPerWeek: 1, target: 26 },
  weight_weekly_9months: { kind: "week", entries: () => weightEntries, minPerWeek: 1, target: 39 },
  weight_weekly_12months: { kind: "week", entries: () => weightEntries, minPerWeek: 1, target: 52 },
  week_15: { kind: "week", entries: () => workoutEntries.filter(isTraining), minPerWeek: 3, target: 3 },
  month_40: { kind: "week", entries: () => workoutEntries.filter(isTraining), minPerWeek: 5, target: 3 },
  month_martial_25: { kind: "week", entries: () => workoutEntries.filter(isMartialArts), minPerWeek: 2, target: 3 },
  martial_3x3weeks: { kind: "week", entries: () => workoutEntries.filter(isMartialArts), minPerWeek: 3, target: 3 },
  martial_3x4weeks: { kind: "week", entries: () => workoutEntries.filter(isMartialArts), minPerWeek: 3, target: 4 },
  gym_3x4weeks: { kind: "week", entries: () => workoutEntries.filter(isGymType), minPerWeek: 3, target: 4 },
  cardio_streak_3w: { kind: "week", entries: () => workoutEntries.filter(isCardio), minPerWeek: 1, target: 3 },
  cardio_streak_4w: { kind: "week", entries: () => workoutEntries.filter(isCardio), minPerWeek: 1, target: 4 },
  cardio_streak_5w: { kind: "week", entries: () => workoutEntries.filter(isCardio), minPerWeek: 1, target: 5 },

  // kind "day": N consecutive calendar days each with >= 1 qualifying entry.
  weight_week: { kind: "day", dates: () => weightEntries.map((e) => e.date), target: 7 },
  weight_month: { kind: "day", dates: () => weightEntries.map((e) => e.date), target: 30 },
  weight_90days: { kind: "day", dates: () => weightEntries.map((e) => e.date), target: 90 },
  weight_6months: { kind: "day", dates: () => weightEntries.map((e) => e.date), target: 182 },
  weight_9months: { kind: "day", dates: () => weightEntries.map((e) => e.date), target: 274 },
  weight_year: { kind: "day", dates: () => weightEntries.map((e) => e.date), target: 365 },
  streak_3: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 3 },
  streak_5: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 5 },
  streak_7: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 7 },
  streak_10: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 10 },
  streak_15: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 15 },
  streak_20: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 20 },
  streak_25: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 25 },
  streak_30: { kind: "day", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), target: 30 },
  calorie_week: { kind: "day", dates: () => calorieLog.map((e) => e.date), target: 7 },

  // kind "loose": N days active allowing gaps of up to `gap` days between sessions.
  streak_35: { kind: "loose", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), gap: 2, target: 35 },
  streak_40: { kind: "loose", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), gap: 3, target: 40 },
  marathon_trainer: { kind: "loose", dates: () => workoutEntries.filter(isTraining).map((e) => e.date), gap: 3, target: 100 },
};

function streakReprestigeResult(id) {
  const cfg = STREAK_PRESTIGE_CONFIG[id];
  if (!cfg) return null;
  const sinceMarker = prestigeStreakResetAt[id] || null;
  if (cfg.kind === "week") return longestConsecutiveWeeksWithMinSince(cfg.entries(), cfg.minPerWeek, sinceMarker);
  if (cfg.kind === "day") return longestConsecutiveRunSince(cfg.dates(), sinceMarker);
  if (cfg.kind === "loose") return longestLooseRunSince(cfg.dates(), cfg.gap, sinceMarker);
  return null;
}

// Achievements below track "have I landed every item in a set at least once" rather than a
// simple numeric threshold. Auto-prestige for these works by snapshotting which workout-entry
// ids have already been "used up" toward the current cycle; after a prestige, every entry that
// exists at that moment is marked consumed, so only entries logged AFTER the prestige can count
// toward completing the set again.
const COLLECTION_PRESTIGE_IDS = new Set(["choke_wizard", "armbar_wizard", "leglock_lunatic", "submission_one_of_each", "allround"]);

function collectionEligibleForReprestige(id) {
  const consumed = new Set(prestigeConsumedIds[id] || []);
  const freshEntries = workoutEntries.filter((e) => !consumed.has(e.id));
  if (id === "choke_wizard" || id === "armbar_wizard" || id === "leglock_lunatic") {
    const category = id === "choke_wizard" ? "chokes" : id === "armbar_wizard" ? "armlocks" : "leglocks";
    const enabled = submissionTypes.filter((s) => s.enabled && s.category === category);
    if (!enabled.length) return false;
    const counts = {};
    freshEntries.forEach((e) => { (e.submissions || []).forEach((sid) => { counts[sid] = (counts[sid] || 0) + 1; }); });
    return enabled.every((s) => (counts[s.id] || 0) >= 1);
  }
  if (id === "submission_one_of_each") {
    const enabled = submissionTypes.filter((s) => s.enabled);
    if (!enabled.length) return false;
    const counts = {};
    freshEntries.forEach((e) => { (e.submissions || []).forEach((sid) => { counts[sid] = (counts[sid] || 0) + 1; }); });
    return enabled.every((s) => (counts[s.id] || 0) >= 1);
  }
  if (id === "allround") {
    const usedTypes = new Set(freshEntries.filter(isTraining).map((e) => e.type));
    return TRAINING_KEYS.length > 0 && TRAINING_KEYS.every((k) => usedTypes.has(k));
  }
  return false;
}

function isAutoPrestigeEligible(a) {
  if (!a.prestige || !unlockedAchievements.includes(a.id)) return false;
  if (COLLECTION_PRESTIGE_IDS.has(a.id)) return collectionEligibleForReprestige(a.id);
  if (STREAK_PRESTIGE_CONFIG[a.id]) {
    const result = streakReprestigeResult(a.id);
    return !!result && result.length >= STREAK_PRESTIGE_CONFIG[a.id].target;
  }
  if (!a.progress) return false;
  const p = a.progress();
  if (p && Array.isArray(p.parts)) {
    const baseline = prestigeBaseline[a.id];
    const baseArr = Array.isArray(baseline) ? baseline : p.parts.map(() => 0);
    return p.parts.every((part, i) => (part.current - (baseArr[i] || 0)) >= part.target);
  }
  if (p && typeof p.current === "number") {
    const baseline = typeof prestigeBaseline[a.id] === "number" ? prestigeBaseline[a.id] : 0;
    return (p.current - baseline) >= p.target;
  }
  return false;
}

function autoPrestigeAchievement(a) {
  achievementPrestige[a.id] = (achievementPrestige[a.id] || 0) + 1;
  saveAchievementPrestige();
  prestigeXp += a.xp;
  savePrestigeXp();
  if (COLLECTION_PRESTIGE_IDS.has(a.id)) {
    prestigeConsumedIds[a.id] = workoutEntries.map((e) => e.id);
    savePrestigeConsumedIds();
  } else if (STREAK_PRESTIGE_CONFIG[a.id]) {
    const result = streakReprestigeResult(a.id);
    if (result && result.endDate) {
      prestigeStreakResetAt[a.id] = result.endDate;
      savePrestigeStreakResetAt();
    }
  } else if (a.progress) {
    const p = a.progress();
    if (p && Array.isArray(p.parts)) {
      prestigeBaseline[a.id] = p.parts.map((part) => part.current);
    } else if (p && typeof p.current === "number") {
      prestigeBaseline[a.id] = p.current;
    }
    savePrestigeBaseline();
  }
}

function mergeBgUnlockedAchievements() {
  if (!bgUnlockedAchievements.length) return null;
  let xpGained = 0;
  const unlockedNow = [];
  bgUnlockedAchievements.forEach((id) => {
    if (unlockedAchievements.includes(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    unlockedAchievements.push(id);
    unlockedAchievementDates[id] = todayISO();
    if (a) { xpGained += a.xp; unlockedNow.push(a); }
  });
  bgUnlockedAchievements = [];
  saveUnlockedAchievements();
  saveUnlockedAchievementDates();
  saveBgUnlockedAchievements();
  if (!unlockedNow.length) return null;
  return { count: unlockedNow.length, xp: xpGained, achievements: unlockedNow };
}

let achievementsExpanded = false;
let hideUnlockedAchievements = false;

function loadCollapsedCategories() {
  try {
    const raw = localStorage.getItem("collapsed_achievement_categories_v1");
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveCollapsedCategories() {
  try { localStorage.setItem("collapsed_achievement_categories_v1", JSON.stringify(collapsedCategories)); } catch (e) { /* ignore */ }
}
let collapsedCategories = loadCollapsedCategories();

// Formaterar en progress-rad som text. Vissa prestationer (t.ex. timbaserade)
// räknar internt i minuter (för exakthet i check()/stapelns fyllnadsprocent),
// men ska visas i hela avrundade timmar för att vara läsbara - därför tar
// den emot achievement-objektet (för a.unit) separat från själva p-delen.
function formatProgressText(unit, p) {
  if (unit === "hours") return `${Math.floor(p.current / 60)}/${Math.round(p.target / 60)}`;
  return `${p.current}/${p.target}`;
}
function progressRatio(p) {
  if (p.parts) {
    return Math.min(...p.parts.map((part) => (part.target > 0 ? Math.min(1, part.current / part.target) : 0)));
  }
  return p.target > 0 ? Math.min(1, p.current / p.target) : 0;
}
function bottleneckPart(p) {
  if (!p.parts) return p;
  return [...p.parts].sort((a, b) => (a.current / a.target) - (b.current / b.target))[0];
}
function nearCompletionList(n) {
  return ACHIEVEMENTS
    .filter((a) => !unlockedAchievements.includes(a.id) && typeof a.progress === "function" && !a.secret)
    .filter((a) => kampsportAdvancedSectionOpen || !KAMPSPORT_ACHIEVEMENT_IDS.has(a.id))
    .map((a) => {
      const p = a.progress();
      const ratio = progressRatio(p);
      return { a, p, ratio };
    })
    .filter((x) => x.ratio > 0 && x.ratio < 1)
    .sort((x, y) => y.ratio - x.ratio)
    .slice(0, n);
}
function nearCompletionBadgeHTML(a, p) {
  // Använd samma ikon/badge-bild som prestationslistan istället för de gamla
  // generiska ikonerna - "nära att slutföras" ska kännas igen som exakt
  // samma prestation, bara nedtonad (dimmad/gråskala) eftersom den ju inte
  // är upplåst än. Samma prioritetsordning som achievementBadgeHTML: egen
  // badge-bild > kategorins tier-bild > emoji/generisk ikon i en ring.
  const family = familyIconFor(a.id);
  const tier = achievementTier(a.xp);
  let iconHTML;
  if (a.badgeImage) {
    iconHTML = `<img src="${a.badgeImage}" alt="${a.title}" style="width:32px;height:32px;object-fit:contain;display:block;opacity:0.35;filter:grayscale(1)" />`;
  } else if (family && family.tierImages) {
    iconHTML = `<img src="${family.tierImages[tier - 1]}" alt="${a.title}" style="width:32px;height:32px;object-fit:contain;display:block;opacity:0.35;filter:grayscale(1)" />`;
  } else {
    const emojiOrIcon = a.emoji
      ? `<span style="font-size:15px;line-height:1">${a.emoji}</span>`
      : `<span style="width:16px;height:16px;display:flex">${ICONS[a.icon]}</span>`;
    iconHTML = `<div class="icon-20" style="color:${tabColors.stats};width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1.5px solid ${tabColors.stats};border-radius:50%">${emojiOrIcon}</div>`;
  }
  const bp = bottleneckPart(p);
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;width:76px;flex-shrink:0">
      <div style="width:34px;height:34px;flex-shrink:0;display:flex;align-items:center;justify-content:center">${iconHTML}</div>
      <div style="font-size:10.5px;font-weight:700;color:var(--text);line-height:1.15">${a.title}</div>
      <div style="width:100%;height:5px;background:var(--border);border-radius:999px;overflow:hidden">
        <div style="height:100%;width:${Math.round((bp.current / bp.target) * 100)}%;background:${tabColors.stats};border-radius:999px"></div>
      </div>
      <div style="font-size:9px;font-weight:700;color:${tabColors.stats}">${bp.label ? `${bp.label} ${formatProgressText(a.unit, bp)}` : formatProgressText(a.unit, bp)}</div>
    </div>
  `;
}
const ACHIEVEMENT_FAMILY_ICONS = {
  "Träningsprestationer": { icon: "dumbbell", color: "#8B7BD8" },
  "Träningstid": { icon: "clock", color: "#4A9FD8" },
  "Dubbelpass": { icon: "layers", color: "#5DBF7A" },
  "Streaks": { icon: "flame", color: "#E8834A" },
  "Vecko- och månadsmål": { icon: "calendar", color: "#5AA8C4" },
  "Pass under året": { icon: "calendarCheck", color: "#4CAF7D" },
  "Viktprestationer": { icon: "scale", color: "#4A90D9" },
  "Kondition": { icon: "runner", color: "#4ADE80" },
  "Övriga": { icon: "compass", color: "#B0A0E8" },
  "Submissions": { icon: "belt", color: "#D4526E" },
  "Submission-bingo": { icon: "puzzle", color: "#9B6FD8" },
  "Hemliga": { icon: "gift", color: "#C9A227" },
};
function familyIconFor(id) {
  const cat = ACHIEVEMENT_CATEGORIES.find((c) => c.ids.includes(id) && c.label !== "Hemliga");
  const secretCat = ACHIEVEMENT_CATEGORIES.find((c) => c.label === "Hemliga" && c.ids.includes(id));
  const use = cat || secretCat;
  return use ? ACHIEVEMENT_FAMILY_ICONS[use.label] : null;
}
const TIER_MEDALS = {
  1: { ring: "#B08D57", bg: "#B08D5722" },
  2: { ring: "#C7CDD6", bg: "#C7CDD622" },
  3: { ring: "#E8B923", bg: "#E8B92322" },
  4: { ring: "#7FE0EF", bg: "#7FE0EF22" },
};
const TIER_NAMES = { 1: "Brons", 2: "Silver", 3: "Guld", 4: "Diamant" };
function achievementTier(xp) {
  if (xp >= 2800) return 4;
  if (xp >= 800) return 3;
  if (xp >= 200) return 2;
  return 1;
}
function achievementBadgeHTML(a) {
  const done = unlockedAchievements.includes(a.id);
  const hidden = a.secret && !done;
  const family = familyIconFor(a.id);
  const tier = achievementTier(a.xp);
  const medal = TIER_MEDALS[tier];
  const iconColor = done ? (family ? family.color : tabColors.stats) : "var(--border2)";
  const ringColor = done ? medal.ring : "var(--border2)";
  const textColor = done ? "var(--text)" : "var(--muted2)";
  const iconName = family ? family.icon : a.icon;
  const prestigeCount = achievementPrestige[a.id] || 0;
  let mainIconHTML;
  if (a.badgeImage) {
    mainIconHTML = `<img src="${a.badgeImage}" alt="${a.title}" style="width:34px;height:34px;object-fit:contain;display:block;${done ? "" : "opacity:0.35;filter:grayscale(1);"}" />`;
  } else if (family && family.tierImages) {
    const img = family.tierImages[tier - 1];
    mainIconHTML = `<img src="${img}" alt="${a.title}" style="width:34px;height:34px;object-fit:contain;display:block;${done ? "" : "opacity:0.35;filter:grayscale(1);"}" />`;
  } else {
    const iconHTML = a.emoji
      ? `<span style="font-size:15px;line-height:1">${a.emoji}</span>`
      : `<span style="width:16px;height:16px;display:flex">${ICONS[iconName]}</span>`;
    const borderStyle = !done ? `1.5px solid ${ringColor}`
      : tier >= 3 ? `3px double ${ringColor}`
      : tier === 2 ? `2.5px solid ${ringColor}`
      : `2px solid ${ringColor}`;
    const glowStyle = done && tier === 4 ? `box-shadow:0 0 7px 2px ${medal.ring}99,0 0 2px 1px #ffffffcc;`
      : done && tier === 3 ? `box-shadow:0 0 5px 1px ${medal.ring}77;`
      : "";
    const bgStyle = done ? `background:${medal.bg};` : "";
    mainIconHTML = `<div class="icon-20" style="color:${iconColor};width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:${borderStyle};border-radius:50%;${bgStyle}${glowStyle}">
      ${iconHTML}
    </div>`;
  }
  return `
    <div data-achievement-id="${a.id}" style="display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;width:76px;flex-shrink:0;${done ? "cursor:pointer" : ""}">
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:34px;height:34px">
        ${mainIconHTML}
        ${prestigeCount > 0 ? `<span style="position:absolute;top:-5px;right:-9px;background:#1A1A1A;color:#FFFFFF;font-size:8.5px;font-weight:800;padding:1.5px 4px;border-radius:999px;border:1px solid #444;line-height:1.3">×${prestigeCount + 1}</span>` : ""}
      </div>
      <div style="font-size:10.5px;font-weight:700;color:${textColor};line-height:1.15">${hidden ? "???" : a.title}</div>
      <div style="font-size:9px;color:var(--muted2);line-height:1.2">${hidden ? (a.hint || "Hemlig prestation") : a.desc}</div>
      <div style="font-size:9px;font-weight:700;color:${done ? tabColors.stats : "var(--muted)"}">${hidden ? "???" : `${a.xp} XP · <span style="color:${medal.ring};font-weight:800;letter-spacing:0.2px">${TIER_NAMES[tier]}</span>`}</div>
    </div>
  `;
}

function wireAchievementsCardEvents() {
  const replayBtn = document.getElementById("replayPlatinumBtn");
  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      celebrationQueue.push({ type: "platinum" });
      if (!document.getElementById("celebrationOverlay")) showNextCelebration();
    });
  }
  const btn = document.getElementById("achievementsExpandBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      achievementsExpanded = !achievementsExpanded;
      if (achievementsExpanded) markWeeklyMiscFlag("achievementsExploredWeek");
      renderAchievementsCard();
    });
  }
  const hideBtn = document.getElementById("achievementsHideUnlockedBtn");
  if (hideBtn) {
    hideBtn.addEventListener("click", () => {
      hideUnlockedAchievements = !hideUnlockedAchievements;
      renderAchievementsCard();
    });
  }
  document.querySelectorAll("[data-category-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      const label = el.dataset.categoryToggle;
      if (collapsedCategories.includes(label)) {
        collapsedCategories = collapsedCategories.filter((l) => l !== label);
      } else {
        collapsedCategories.push(label);
      }
      saveCollapsedCategories();
      renderAchievementsCard();
    });
  });
  document.querySelectorAll("[data-achievement-id]").forEach((el) => {
    const id = el.dataset.achievementId;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    if (unlockedAchievements.includes(id)) {
      el.addEventListener("click", () => { openForgetAchievementModal(id); });
    } else if (!a.secret) {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => { openAchievementProgressModal(id); });
    }
  });
}

function achievementUnlockStatsEnabled() {
  return !!supabaseClient && !!authUser;
}
async function loadAchievementUnlockStats() {
  if (!achievementUnlockStatsEnabled()) return;
  if (achievementUnlockStatsCache !== undefined) return;
  if (achievementUnlockStatsFetchPromise) return achievementUnlockStatsFetchPromise;
  achievementUnlockStatsFetchPromise = (async () => {
    try {
      const { data, error } = await supabaseClient.rpc("get_achievement_unlock_stats");
      if (error) throw error;
      const map = {};
      let total = 0;
      (data || []).forEach((row) => {
        if (row.total_users != null) total = Number(row.total_users);
        if (row.achievement_id) map[row.achievement_id] = Number(row.unlock_count);
      });
      achievementUnlockStatsCache = map;
      achievementUnlockStatsTotalUsers = total;
    } catch (e) {
      achievementUnlockStatsCache = null;
    } finally {
      achievementUnlockStatsFetchPromise = null;
    }
  })();
  return achievementUnlockStatsFetchPromise;
}
function achievementUnlockStatLineText(id) {
  if (!achievementUnlockStatsEnabled()) return "";
  if (achievementUnlockStatsCache === undefined) return "···";
  if (achievementUnlockStatsCache === null || !achievementUnlockStatsTotalUsers) return "";
  const count = achievementUnlockStatsCache[id] || 0;
  const pct = ((count / achievementUnlockStatsTotalUsers) * 100).toFixed(1);
  return `${pct}% av alla användare har låst upp denna`;
}
function refreshAchievementUnlockStatLine(id) {
  const el = document.getElementById("achievementUnlockStatLine");
  if (!el) return;
  const text = achievementUnlockStatLineText(id);
  el.textContent = text;
  el.style.display = text ? "" : "none";
}

// Statistik för prestige-nivå: hur många andra användare har nått MINST den
// prestige-nivå man själv är på just nu (t.ex. "×4"). Cachas per
// achievement+nivå-kombination eftersom det hämtas on-demand via RPC.
let achievementPrestigeStatsCache = {};
async function loadAchievementPrestigeStat(id, prestigeCount) {
  const key = `${id}:${prestigeCount}`;
  if (achievementPrestigeStatsCache[key] !== undefined) return achievementPrestigeStatsCache[key];
  if (!achievementUnlockStatsEnabled()) return null;
  try {
    const { data, error } = await supabaseClient.rpc("get_achievement_prestige_stats", { p_achievement_id: id, p_min_level: prestigeCount });
    if (error) throw error;
    const row = Array.isArray(data) && data.length ? data[0] : null;
    const result = row && row.total_users ? { count: Number(row.count_at_least), total: Number(row.total_users) } : null;
    achievementPrestigeStatsCache[key] = result;
    return result;
  } catch (e) {
    achievementPrestigeStatsCache[key] = null;
    return null;
  }
}
function achievementPrestigeStatLineText(id, prestigeCount) {
  if (!achievementUnlockStatsEnabled()) return "";
  const key = `${id}:${prestigeCount}`;
  const cached = achievementPrestigeStatsCache[key];
  if (cached === undefined) return "···";
  if (!cached) return "";
  const pct = ((cached.count / cached.total) * 100).toFixed(1);
  return `${pct}% har nått minst nivå ${prestigeCount + 1}`;
}
function refreshAchievementPrestigeStatLine(id, prestigeCount) {
  const el = document.getElementById("achievementPrestigeStatLine");
  if (!el) return;
  const text = achievementPrestigeStatLineText(id, prestigeCount);
  el.textContent = text;
  el.style.display = text ? "" : "none";
}

function openAchievementProgressModal(id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  pushModalHistoryIfNeeded();
  const family = familyIconFor(a.id);
  const tier = achievementTier(a.xp);
  const medal = TIER_MEDALS[tier];
  let largeIconHTML;
  if (a.badgeImage) {
    largeIconHTML = `<img src="${a.badgeImage}" alt="${a.title}" style="width:76px;height:76px;object-fit:contain;display:block;opacity:0.35;filter:grayscale(1)" />`;
  } else if (family && family.tierImages) {
    largeIconHTML = `<img src="${family.tierImages[tier - 1]}" alt="${a.title}" style="width:76px;height:76px;object-fit:contain;display:block;opacity:0.35;filter:grayscale(1)" />`;
  } else {
    const iconName = family ? family.icon : a.icon;
    largeIconHTML = a.emoji
      ? `<span style="font-size:38px;line-height:1;opacity:0.35">${a.emoji}</span>`
      : `<div style="color:var(--border2);width:76px;height:76px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:3px solid var(--border2);border-radius:50%"><span style="width:40px;height:40px;display:flex">${ICONS[iconName]}</span></div>`;
  }
  const progress = typeof a.progress === "function" ? a.progress() : null;
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="achievementProgressOverlay">
      <div class="modal-sheet">
        <div style="display:flex;justify-content:center;margin-bottom:6px">${largeIconHTML}</div>
        <h2 style="text-align:center">🔒 ${escapeHtml(a.title)}</h2>
        <p id="achievementUnlockStatLine" style="font-size:11px;color:var(--muted2);text-align:center;${achievementUnlockStatsEnabled() ? "" : "display:none"}">${achievementUnlockStatLineText(a.id)}</p>
        <p>${escapeHtml(a.desc)}</p>
        ${progress && progress.parts ? `
          <div class="card" style="background:var(--bg)">
            ${progress.parts.map((part) => `
              <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:4px">
                  <span>${escapeHtml(part.label)}</span>
                  <span style="color:${tabColors.stats}">${part.current}/${part.target}</span>
                </div>
                <div style="height:8px;background:var(--border);border-radius:999px;overflow:hidden">
                  <div style="height:100%;width:${Math.min(100, Math.round((part.current / part.target) * 100))}%;background:${tabColors.stats};border-radius:999px"></div>
                </div>
              </div>
            `).join("")}
          </div>
        ` : progress ? `
          <div class="card" style="background:var(--bg);text-align:center">
            <div style="font-size:22px;font-weight:800;color:${tabColors.stats}">${formatProgressText(a.unit, progress)}</div>
            <div style="height:8px;background:var(--border);border-radius:999px;overflow:hidden;margin-top:8px">
              <div style="height:100%;width:${Math.min(100, Math.round((progress.current / progress.target) * 100))}%;background:${tabColors.stats};border-radius:999px"></div>
            </div>
          </div>
        ` : ""}
        <p style="font-size:12px;color:var(--muted)">Inte upplåst än — ${a.xp} XP · <span style="color:${medal.ring};font-weight:800;letter-spacing:0.2px">${TIER_NAMES[tier]}</span> när du klarar den.</p>
        <div class="modal-close" id="achievementProgressCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  document.getElementById("achievementProgressCloseBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; });
  document.getElementById("achievementProgressOverlay").addEventListener("click", (e) => {
    if (e.target.id === "achievementProgressOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
  loadAchievementUnlockStats().then(() => refreshAchievementUnlockStatLine(a.id));
}

function openForgetAchievementModal(id, confirming) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  pushModalHistoryIfNeeded();
  const date = unlockedAchievementDates[id];
  const dateText = date ? fmtDateShortWithYear(date) : "okänt datum (upplåst innan detta sparades)";
  const prestigeCount = achievementPrestige[id] || 0;
  const family = familyIconFor(a.id);
  const tier = achievementTier(a.xp);
  const medal = TIER_MEDALS[tier];
  let largeIconHTML;
  if (a.badgeImage) {
    largeIconHTML = `<img src="${a.badgeImage}" alt="${a.title}" style="width:76px;height:76px;object-fit:contain;display:block" />`;
  } else if (family && family.tierImages) {
    largeIconHTML = `<img src="${family.tierImages[tier - 1]}" alt="${a.title}" style="width:76px;height:76px;object-fit:contain;display:block" />`;
  } else {
    const iconColor = family ? family.color : tabColors.stats;
    const ringColor = medal.ring;
    const iconName = family ? family.icon : a.icon;
    const borderStyle = tier >= 3 ? `4px double ${ringColor}` : tier === 2 ? `3.5px solid ${ringColor}` : `3px solid ${ringColor}`;
    const glowStyle = tier === 4 ? `box-shadow:0 0 12px 3px ${medal.ring}99,0 0 3px 1px #ffffffcc;` : tier === 3 ? `box-shadow:0 0 8px 2px ${medal.ring}77;` : "";
    largeIconHTML = a.emoji
      ? `<span style="font-size:38px;line-height:1">${a.emoji}</span>`
      : `<div style="color:${iconColor};width:76px;height:76px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:${borderStyle};border-radius:50%;background:${medal.bg};${glowStyle}"><span style="width:40px;height:40px;display:flex">${ICONS[iconName]}</span></div>`;
  }
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="forgetAchievementOverlay">
      <div class="modal-sheet">
        <div style="display:flex;justify-content:center;position:relative;margin-bottom:6px">
          ${largeIconHTML}
          ${prestigeCount > 0 ? `<span style="position:absolute;top:-6px;right:calc(50% - 50px);background:#1A1A1A;color:#FFFFFF;font-size:11px;font-weight:800;padding:2px 7px;border-radius:999px;border:1.5px solid #444">×${prestigeCount + 1}</span>` : ""}
        </div>
        <h2 style="text-align:center">🔓 ${escapeHtml(a.title)}${prestigeCount > 0 ? ` ×${prestigeCount + 1}` : ""}</h2>
        <p id="achievementUnlockStatLine" style="font-size:11px;color:var(--muted2);text-align:center;${achievementUnlockStatsEnabled() ? "" : "display:none"}">${achievementUnlockStatLineText(a.id)}</p>
        ${prestigeCount > 0 ? `<p id="achievementPrestigeStatLine" style="font-size:11px;color:var(--muted2);text-align:center;${achievementUnlockStatsEnabled() ? "" : "display:none"}">${achievementPrestigeStatLineText(a.id, prestigeCount)}</p>` : ""}
        <p>Upplåst ${dateText} — ${a.xp} XP · <span style="color:${medal.ring};font-weight:800;letter-spacing:0.2px">${TIER_NAMES[tier]}</span>.</p>
        ${confirming ? `
          <p style="font-weight:700">Är du säker på att du vill glömma prestationen?</p>
          <p style="font-size:12px;color:var(--muted)">${prestigeCount > 0 ? `Det går inte att ångra — du går tillbaka en prestige-nivå (till ×${prestigeCount}) och tappar ${a.xp} XP.` : "Det går inte att ångra — prestationen och dess " + a.xp + " XP tas bort permanent."}</p>
          <div class="row">
            <button class="modal-btn secondary" id="forgetAchievementCancelBtn" style="flex:1">Avbryt</button>
            <button class="modal-btn primary" id="forgetAchievementFinalBtn" style="flex:1">Ja, glöm den</button>
          </div>
        ` : `
          ${a.prestige ? `
            <div style="font-size:13px;font-weight:700">🏅 Prestige — börjar om automatiskt</div>
            <p style="font-size:12px;color:var(--muted)">Den här prestationen prestigeas av sig själv så fort du presterar den igen (nuvarande nivå: ×${prestigeCount + 1}). Inget att klicka på — bara fortsätt träna.</p>
          ` : ""}
          <p>Om du fick den av misstag (t.ex. en felloggning) kan du glömma den här. Det tar bort prestationen och dess XP.</p>
          <p style="font-size:12px;color:var(--muted)">Obs: om det som utlöste den fortfarande finns kvar i din logg kan den låsas upp igen automatiskt. Rätta gärna felloggningen först.</p>
          <button class="modal-btn secondary" id="forgetAchievementConfirmBtn" style="width:100%">Glöm prestationen (−${a.xp} XP)</button>
          <div class="modal-close" id="forgetAchievementCloseBtn">Avbryt</div>
        `}
      </div>
    </div>
  `;
  const closeBtn = document.getElementById("forgetAchievementCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => { modalRoot.innerHTML = ""; });
  const cancelBtn = document.getElementById("forgetAchievementCancelBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => { modalRoot.innerHTML = ""; handleModalClosedByUser(); });
  document.getElementById("forgetAchievementOverlay").addEventListener("click", (e) => {
    if (e.target.id === "forgetAchievementOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
  const confirmBtn = document.getElementById("forgetAchievementConfirmBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      openForgetAchievementModal(id, true);
    });
  }
  const finalBtn = document.getElementById("forgetAchievementFinalBtn");
  if (finalBtn) {
    finalBtn.addEventListener("click", () => {
      if (prestigeCount > 0) {
        achievementPrestige[id] = prestigeCount - 1;
        saveAchievementPrestige();
        prestigeXp = Math.max(0, prestigeXp - a.xp);
        savePrestigeXp();
      } else {
        unlockedAchievements = unlockedAchievements.filter((x) => x !== id);
        delete unlockedAchievementDates[id];
        saveUnlockedAchievements();
        saveUnlockedAchievementDates();
      }
      modalRoot.innerHTML = "";
      handleModalClosedByUser();
      if (activeTab === "stats") renderStats();
    });
  }
  loadAchievementUnlockStats().then(() => refreshAchievementUnlockStatLine(a.id));
  if (prestigeCount > 0) {
    loadAchievementPrestigeStat(a.id, prestigeCount).then(() => refreshAchievementPrestigeStatLine(a.id, prestigeCount));
  }
}

function renderAchievementsCard() {
  const wrap = document.getElementById("achievementsCardWrap");
  if (!wrap) return;
  wrap.innerHTML = achievementsCardHTML();
  wireAchievementsCardEvents();
}

function recentlyUnlockedList(limit) {
  const validIds = unlockedAchievements.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
  const withInfo = validIds.map((id, idx) => ({ id, idx, date: unlockedAchievementDates[id] || null }));
  withInfo.sort((a, b) => {
    if (a.date && b.date) {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return b.idx - a.idx; // same date (e.g. a batch unlocked together): later position = unlocked more recently
    }
    if (a.date && !b.date) return -1; // dated ones were unlocked after date-tracking existed, so always newer
    if (!a.date && b.date) return 1;
    return b.idx - a.idx; // both undated: later position in the array = unlocked more recently
  });
  return withInfo.slice(0, limit).map((x) => ACHIEVEMENTS.find((a) => a.id === x.id));
}

function achievementsCardHTML() {
  const visibleAchievements = ACHIEVEMENTS.filter((a) => kampsportAdvancedSectionOpen || !KAMPSPORT_ACHIEVEMENT_IDS.has(a.id));
  const unlockedCount = unlockedAchievements.filter((id) => visibleAchievements.some((a) => a.id === id)).length;
  const recentUnlocked = hideUnlockedAchievements ? recentlyUnlockedList(8) : [];
  const nearCompletion = nearCompletionList(3);
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:17px;font-weight:800;color:var(--text)">Prestationer <span style="color:var(--muted2);font-weight:600;font-size:14px">${unlockedCount}/${visibleAchievements.length}</span></div>
        <div style="display:flex;gap:10px;align-items:center">
          ${achievementsExpanded ? `<button id="achievementsHideUnlockedBtn" style="background:none;border:none;color:${tabColors.stats};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px">${hideUnlockedAchievements ? "Visa upplåsta" : "Dölj upplåsta"}</button>` : ""}
          <button id="achievementsExpandBtn" style="background:none;border:none;color:${tabColors.stats};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px">${achievementsExpanded ? "Dölj" : "Visa alla"}</button>
        </div>
      </div>
      ${platinumUnlockedAt ? `
      <div style="display:flex;align-items:center;gap:10px;background:rgba(239,159,39,0.1);border:1px solid rgba(239,159,39,0.35);border-radius:10px;padding:8px 10px;margin-bottom:10px">
        <span style="font-size:18px;line-height:1">🏆</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;font-weight:700;color:#EF9F27">New Game+ — alla prestationer klara</div>
          <div style="font-size:11px;color:var(--muted2)">${fmtDateWithWeekday(platinumUnlockedAt)}</div>
        </div>
        <button id="replayPlatinumBtn" style="background:none;border:1px solid rgba(239,159,39,0.4);color:#EF9F27;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;padding:5px 9px;border-radius:8px;flex-shrink:0">▶ Se igen</button>
      </div>
      ` : ""}
      ${nearCompletion.length ? `
        <div style="font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:10px">🎯 Nära att slutföras</div>
        <div style="display:flex;flex-wrap:wrap;gap:14px 8px;justify-content:flex-start;margin-bottom:4px">
          ${nearCompletion.map((x) => nearCompletionBadgeHTML(x.a, x.p)).join("")}
        </div>
      ` : ""}
      ${achievementsExpanded
        ? (recentUnlocked.length ? `
            <div style="font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:10px">Senast upplåsta</div>
            <div style="display:flex;flex-wrap:wrap;gap:14px 8px;justify-content:flex-start;margin-bottom:4px">
              ${recentUnlocked.map(achievementBadgeHTML).join("")}
            </div>
          ` : "") +
          ACHIEVEMENT_CATEGORIES.filter((cat) => kampsportAdvancedSectionOpen || (cat.label !== "Submissions" && cat.label !== "Submission-bingo")).map((cat) => {
            let items = cat.ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
            if (!kampsportAdvancedSectionOpen) items = items.filter((a) => !KAMPSPORT_ACHIEVEMENT_IDS.has(a.id));
            const catDone = items.filter((a) => unlockedAchievements.includes(a.id)).length;
            if (hideUnlockedAchievements) items = items.filter((a) => !unlockedAchievements.includes(a.id));
            items = [...items].sort((a, b) => a.xp - b.xp);
            if (!items.length) return "";
            const collapsed = collapsedCategories.includes(cat.label);
            return `
              <div data-category-toggle="${cat.label}" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin:14px 0 10px;${cat === ACHIEVEMENT_CATEGORIES[0] && !recentUnlocked.length ? "margin-top:0" : ""}">
                <div style="font-size:14.5px;font-weight:700;color:var(--text)">${cat.label} <span style="color:var(--muted2);font-weight:600;font-size:12.5px">${catDone}/${items.length}</span></div>
                <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${collapsed ? "0" : "90"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
              </div>
              ${collapsed ? "" : `
                <div style="display:flex;flex-wrap:wrap;gap:14px 8px;justify-content:flex-start">
                  ${items.map(achievementBadgeHTML).join("")}
                </div>
              `}
            `;
          }).join("")
        : `<div style="display:flex;flex-wrap:wrap;gap:14px 8px;justify-content:flex-start">
             ${visibleAchievements.slice(0, 8).map(achievementBadgeHTML).join("")}
           </div>`
      }
    </div>
  `;
}

function personalRecordsCardHTML() {
  const gymRows = pbExercises.filter((p) => p.enabled)
    .map((p) => {
      const e = pbBestEntryFor(p.id);
      return e ? { label: p.label, best: e.value, date: e.date, isTime: false, unit: p.unit === "reps" ? "reps" : "kg", rankKind: "strength", rankKey: `strength|${p.id}`, rankArgs: [p.id] } : null;
    })
    .filter(Boolean);
  const konditionTypesUsed = [...new Set(konditionPbLog.map((e) => e.type).filter(Boolean))];
  const konditionRows = konditionPbDistances.filter((d) => d.enabled).flatMap((d) =>
    konditionTypesUsed.map((type) => {
      const e = konditionPbBestEntryFor(d.id, type);
      return e ? { label: `${d.label} (${typeMeta(type).label})`, best: e.minutes, date: e.date, isTime: true, rankKind: "kondition", rankKey: `kondition|${d.id}|${type}`, rankArgs: [d.id, type] } : null;
    }).filter(Boolean)
  );
  const rows = [...gymRows, ...konditionRows].sort((a, b) => a.label.localeCompare(b.label, "sv"));
  lastPbRows = rows;
  if (!pbExercises.some((p) => p.enabled) && !konditionPbDistances.some((d) => d.enabled)) return "";
  const leaderboardOn = pbLeaderboardEnabled();
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showPbCardToggle", "🏆 Personbästa", showPbCard, showPbCard ? "10px" : null)}
      ${showPbCard ? (rows.length === 0 ? `<div class="empty">Inga personbästa loggade än — kryssa i "Personbästa!" när du loggar ett gym- eller konditionspass.</div>` : `
        ${leaderboardOn ? `<button class="modal-btn secondary" id="openPbLeaderboardBtn" style="width:100%;margin-bottom:10px">🏆 Topplista</button>` : ""}
        ${rows.map((row, i) => `
          <div class="goal-row">
            <span class="goal-label">${escapeHtml(row.label)}</span>
            <span style="text-align:right">
              <span class="goal-value">${row.isTime ? fmtMinSec(row.best) : `${row.best} ${row.unit || "kg"}`}</span>
              <div style="font-size:11px;color:var(--muted2)">${fmtDateShort(row.date)}</div>
              ${leaderboardOn ? `<div id="pbRank-${i}" style="margin-top:2px">${pbRankBadgeHTML(row.rankKey)}</div>` : ""}
            </span>
          </div>
        `).join("")}
      `) : ""}
    </div>

    <div id="pbHistoryCardWrap">${pbHistoryCardHTML()}</div>
  `;
}
// Din egen rank/procent räknas mot alla som loggat en PB, oavsett din
// Topplista-inställning - "Dold" styr bara om du syns i den namngivna
// listan, inte om du får se din egen placering.
function pbLeaderboardEnabled() {
  return !!supabaseClient && !!authUser;
}
// Rank-badgen visar alltid din placering (oavsett hur bra/dålig den är) -
// tryck på den för detaljer (X/Y totalt + procent) som toast.
function pbRankBadgeHTML(rankKey) {
  const cached = pbRankCache[rankKey];
  if (cached === undefined) return `<span style="font-size:10px;color:var(--muted2)">···</span>`;
  if (cached === null) return "";
  const label = cached.rank === 1 ? "🥇 Nr 1" : `Nr ${cached.rank}`;
  return `<button data-pb-rank-info="${escapeHtml(rankKey)}" style="background:none;border:none;padding:0;font-family:inherit;cursor:pointer;font-size:11px;font-weight:700;color:${tabColors.stats};text-decoration:underline">${label}</button>`;
}
function showPbRankInfoToast(cached) {
  if (!cached) return;
  if (cached.total <= 1) {
    showInfoToast("🏆 Du är den enda som loggat det här personbästat ännu.");
    return;
  }
  showInfoToast(`🏆 Du är ${cached.rank}/${cached.total} — bättre än ${cached.percentile}% av alla.`);
}
// Hämtar din placering för varje PB-rad från servern (via en säker
// databasfunktion som bara ger tillbaka din egen rank + totalt antal
// deltagare - aldrig andras data). Räknas mot alla som loggat övningen,
// oavsett Topplista-inställning ("Dold" styr bara den namngivna listan
// nedan). Körs efter varje omritning av kortet.
async function loadPbRanks() {
  if (!pbLeaderboardEnabled()) return;
  const rows = lastPbRows || [];
  await Promise.all(rows.map(async (row, i) => {
    let result = null;
    try {
      const rpcName = row.rankKind === "strength" ? "get_strength_pb_rank" : "get_kondition_pb_rank";
      const rpcArgs = row.rankKind === "strength"
        ? { p_exercise_id: row.rankArgs[0], p_gender: leaderboardGenderFilter }
        : { p_distance_id: row.rankArgs[0], p_type: row.rankArgs[1], p_gender: leaderboardGenderFilter };
      const { data, error } = await supabaseClient.rpc(rpcName, rpcArgs);
      if (error) throw error;
      const r = Array.isArray(data) && data.length ? data[0] : null;
      result = r && r.my_rank != null ? { rank: Number(r.my_rank), total: Number(r.total), percentile: Number(r.percentile) } : null;
    } catch (e) {
      result = null;
    }
    pbRankCache[row.rankKey] = result;
    const el = document.getElementById(`pbRank-${i}`);
    if (el) {
      el.innerHTML = pbRankBadgeHTML(row.rankKey);
      const btn = el.querySelector("[data-pb-rank-info]");
      if (btn) btn.addEventListener("click", () => showPbRankInfoToast(pbRankCache[row.rankKey]));
    }
  }));
}
// Bara Mattias konto - styr om admin-verktygen (se alla + ta bort fuskade
// PB) visas i topplistan. Ren UI-gate; själva borttagningsfunktionerna i
// Supabase kollar auth.uid() mot samma id på riktigt, så det går inte att
// komma runt genom att peta i klientkoden.
const ADMIN_USER_ID = "3b74e3f7-45f0-4686-b304-c731045e73b2";
let pbLeaderboardAdminMode = false;
// Vilken rad (index i lastPbRows) som är vald i Topplista-modalen, samt en
// ihågkommen rankKey så att samma övning/distans föreslås igen nästa gång
// modalen öppnas.
let pbLeaderboardSelectedIndex = 0;
let pbLeaderboardLastRankKey = null;

// En gemensam Topplista-modal för alla PB - istället för att trycka på varje
// övning för sig väljer man övning/distans via chips inne i modalen, och kan
// även justera storlek (topp X) och könsfilter där direkt.
async function openPbLeaderboardModal() {
  const rows = lastPbRows || [];
  if (!rows.length) return;
  pushModalHistoryIfNeeded();
  pbLeaderboardAdminMode = false;
  const remembered = rows.findIndex((r) => r.rankKey === pbLeaderboardLastRankKey);
  pbLeaderboardSelectedIndex = remembered >= 0 ? remembered : 0;
  pbLeaderboardLastRankKey = rows[pbLeaderboardSelectedIndex].rankKey;
  modalRoot.innerHTML = `<div class="modal-overlay" id="pbLeaderboardOverlay"><div class="modal-sheet" style="min-height:85vh;min-height:85dvh">${pbLeaderboardModalBodyHTML()}</div></div>`;
  wirePbLeaderboardModal();
  await renderPbLeaderboardList(lastPbRows[pbLeaderboardSelectedIndex]);
}
function pbLeaderboardModalBodyHTML() {
  const rows = lastPbRows || [];
  const isAdmin = authUser && authUser.id === ADMIN_USER_ID;
  return `
    <h2>🏆 Topplista</h2>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:12px">
      ${rows.map((r, i) => `<button class="chip" data-pblb-row="${i}" style="${i === pbLeaderboardSelectedIndex ? `border-color:${tabColors.stats};background:${tabColors.stats}26;color:${tabColors.stats}` : ""}">${escapeHtml(r.label)}</button>`).join("")}
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span style="font-size:11px;color:var(--muted2);margin-right:2px">Topp</span>
      ${[10, 15, 20, 25, 50].map((n) => `<button class="theme-btn" data-pblb-size="${n}" style="padding:4px 10px;font-size:12px;${leaderboardSize === n ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">${n}</button>`).join("")}
    </div>
    <div style="display:flex;justify-content:center;gap:6px;margin-bottom:10px">
      <button class="theme-btn" data-pblb-gender="all" style="padding:4px 10px;font-size:12px;${leaderboardGenderFilter === "all" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Alla</button>
      <button class="theme-btn" data-pblb-gender="man" style="padding:4px 10px;font-size:12px;${leaderboardGenderFilter === "man" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Män</button>
      <button class="theme-btn" data-pblb-gender="kvinna" style="padding:4px 10px;font-size:12px;${leaderboardGenderFilter === "kvinna" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Kvinnor</button>
    </div>
    <div id="pbLeaderboardSubtext" style="text-align:center;font-size:11px;color:var(--muted2);margin-bottom:10px"></div>
    ${isAdmin ? `<button class="modal-btn secondary" id="pbLeaderboardAdminToggle" style="width:auto;margin:0 auto 10px;display:block;padding:6px 14px;font-size:12px">${pbLeaderboardAdminMode ? "👥 Visa vanlig topplista" : "🛠 Adminvy (alla, inkl. dolda)"}</button>` : ""}
    <div id="pbLeaderboardListWrap"><div class="empty">Hämtar…</div></div>
    ${authUser ? `
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:12px;font-weight:600;text-align:center;margin-bottom:6px">Din synlighet i topplistan</div>
      <div class="theme-row" style="justify-content:center">
        <button class="theme-btn" data-pblb-visibility="hidden" style="padding:4px 10px;font-size:12px;${leaderboardVisibility === "hidden" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🙈 Dold</button>
        <button class="theme-btn" data-pblb-visibility="anonymous" style="padding:4px 10px;font-size:12px;${leaderboardVisibility === "anonymous" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🎭 Anonym</button>
        <button class="theme-btn" data-pblb-visibility="visible" style="padding:4px 10px;font-size:12px;${leaderboardVisibility === "visible" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">👤 Synlig</button>
      </div>
      <p style="margin-top:6px;font-size:11px;color:var(--muted2);text-align:center">
        ${leaderboardVisibility === "hidden" ? "Du syns inte i topplistan för andra." : leaderboardVisibility === "anonymous" ? "Du syns i topplistan, men utan namn." : "Du syns i topplistan med ditt profilnamn."}
      </p>
    </div>
    ` : ""}
    <div class="modal-close" id="pbLeaderboardCloseBtn">Stäng</div>
  `;
}
function wirePbLeaderboardModal() {
  const closeBtn = document.getElementById("pbLeaderboardCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => { modalRoot.innerHTML = ""; });
  const overlay = document.getElementById("pbLeaderboardOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "pbLeaderboardOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
    });
  }
  document.querySelectorAll("[data-pblb-row]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pbLeaderboardSelectedIndex = parseInt(btn.dataset.pblbRow, 10);
      pbLeaderboardLastRankKey = (lastPbRows[pbLeaderboardSelectedIndex] || {}).rankKey || null;
      rerenderPbLeaderboardModal();
    });
  });
  document.querySelectorAll("[data-pblb-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      leaderboardSize = parseInt(btn.dataset.pblbSize, 10);
      saveLeaderboardSize();
      scheduleCloudPush();
      rerenderPbLeaderboardModal();
    });
  });
  document.querySelectorAll("[data-pblb-gender]").forEach((btn) => {
    btn.addEventListener("click", () => {
      leaderboardGenderFilter = btn.dataset.pblbGender;
      saveLeaderboardGenderFilter();
      scheduleCloudPush();
      pbRankCache = {};
      rerenderPbLeaderboardModal();
      loadPbRanks();
    });
  });
  const adminToggleBtn = document.getElementById("pbLeaderboardAdminToggle");
  if (adminToggleBtn) {
    adminToggleBtn.addEventListener("click", () => {
      pbLeaderboardAdminMode = !pbLeaderboardAdminMode;
      rerenderPbLeaderboardModal();
    });
  }
  document.querySelectorAll("[data-pblb-visibility]").forEach((btn) => {
    btn.addEventListener("click", () => {
      leaderboardVisibility = btn.dataset.pblbVisibility;
      saveLeaderboardVisibility();
      pbRankCache = {};
      scheduleCloudPush();
      rerenderPbLeaderboardModal();
      renderPersonalRecordsCard();
      loadPbRanks();
    });
  });
}
function rerenderPbLeaderboardModal() {
  const sheet = document.querySelector("#pbLeaderboardOverlay .modal-sheet");
  if (!sheet) return;
  sheet.innerHTML = pbLeaderboardModalBodyHTML();
  wirePbLeaderboardModal();
  renderPbLeaderboardList(lastPbRows[pbLeaderboardSelectedIndex]);
}
async function renderPbLeaderboardList(row) {
  const listWrap = document.getElementById("pbLeaderboardListWrap");
  const subtext = document.getElementById("pbLeaderboardSubtext");
  if (!listWrap) return;
  listWrap.innerHTML = `<div class="empty">Hämtar…</div>`;
  const genderLabel = leaderboardGenderFilter === "man" ? "Män" : leaderboardGenderFilter === "kvinna" ? "Kvinnor" : "Alla";
  if (subtext) {
    subtext.textContent = pbLeaderboardAdminMode
      ? "Adminvy: alla som loggat, oavsett Topplista-inställning"
      : `Topp ${leaderboardSize} · ${genderLabel} · bara de som valt Anonym eller Synlig i Profil`;
  }
  try {
    if (pbLeaderboardAdminMode) {
      const rpcName = row.rankKind === "strength" ? "admin_get_strength_leaderboard" : "admin_get_kondition_leaderboard";
      const rpcArgs = row.rankKind === "strength"
        ? { p_exercise_id: row.rankArgs[0], p_limit: 50 }
        : { p_distance_id: row.rankArgs[0], p_type: row.rankArgs[1], p_limit: 50 };
      const { data, error } = await supabaseClient.rpc(rpcName, rpcArgs);
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      if (!list.length) { listWrap.innerHTML = `<div class="empty">Ingen data ännu.</div>`; return; }
      listWrap.innerHTML = list.map((r, idx) => `
        <div class="list-row">
          <span style="font-size:13px;font-weight:700;min-width:24px">#${idx + 1}</span>
          <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.email || "?")} <span style="color:var(--muted2)">(${escapeHtml(r.visibility)})</span></span>
          <span style="font-size:14px;font-weight:600">${row.isTime ? fmtMinSec(Number(r.value)) : `${Number(r.value)} ${row.unit || "kg"}`}</span>
          <button class="delete-btn" data-admin-delete-pb="${escapeHtml(r.user_id)}" data-armed="false" style="padding:4px">${ICONS.trash}</button>
        </div>
      `).join("");
      listWrap.querySelectorAll("[data-admin-delete-pb]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (btn.dataset.armed !== "true") {
            btn.dataset.armed = "true";
            btn.style.background = "#E8834A";
            btn.style.color = "#fff";
            btn.title = "Tryck igen för att bekräfta borttagning";
            return;
          }
          btn.disabled = true;
          try {
            const delRpcName = row.rankKind === "strength" ? "admin_delete_strength_pb" : "admin_delete_kondition_pb";
            const delArgs = row.rankKind === "strength"
              ? { p_user_id: btn.dataset.adminDeletePb, p_exercise_id: row.rankArgs[0] }
              : { p_user_id: btn.dataset.adminDeletePb, p_distance_id: row.rankArgs[0], p_type: row.rankArgs[1] };
            const { error: delError } = await supabaseClient.rpc(delRpcName, delArgs);
            if (delError) throw delError;
            pbRankCache = {};
            await renderPbLeaderboardList(row);
            loadPbRanks();
          } catch (e) {
            showInfoToast("Kunde inte ta bort - försök igen.");
            btn.disabled = false;
          }
        });
      });
      return;
    }
    const rpcName = row.rankKind === "strength" ? "get_strength_leaderboard" : "get_kondition_leaderboard";
    const rpcArgs = row.rankKind === "strength"
      ? { p_exercise_id: row.rankArgs[0], p_gender: leaderboardGenderFilter, p_limit: leaderboardSize }
      : { p_distance_id: row.rankArgs[0], p_type: row.rankArgs[1], p_gender: leaderboardGenderFilter, p_limit: leaderboardSize };
    const { data, error } = await supabaseClient.rpc(rpcName, rpcArgs);
    if (error) throw error;
    const list = Array.isArray(data) ? data : [];
    if (!list.length) {
      listWrap.innerHTML = `<div class="empty">Ingen data ännu.</div>`;
      return;
    }
    listWrap.innerHTML = list.map((r) => `
      <div class="list-row" style="${r.is_me ? `background:${tabColors.stats}22;border-radius:8px` : ""}">
        <span style="font-size:13px;font-weight:700;min-width:28px">#${r.rnk}</span>
        <span style="font-size:13px;flex:1">${r.display_name ? escapeHtml(r.display_name) : "Anonym"}${r.is_me ? " (du)" : ""}</span>
        <span style="font-size:14px;font-weight:600">${row.isTime ? fmtMinSec(Number(r.value)) : `${Number(r.value)} ${row.unit || "kg"}`}</span>
      </div>
    `).join("");
  } catch (e) {
    listWrap.innerHTML = `<div class="status-msg err" style="display:block">Kunde inte hämta topplistan.</div>`;
  }
}
/* ---------------- Vänner ---------------- */

// Flera kan heta samma sak (t.ex. "Mattias"), så vi visar en kort ID-stubb
// bredvid namnet i sök/vänlista så man kan skilja dem åt. Inget hemligt -
// bara de första tecknen av det egna user_id:t, samma för alla som ser en
// viss användare.
function shortSocialId(userId) {
  return userId ? String(userId).replace(/-/g, "").slice(0, 6) : "";
}
// Samma ram-katalog som den egna profilbilden (profileAvatarHTML), men tar
// avatar/ram som parametrar istället för att läsa globala profile/authUser -
// så den kan rita en väns bild, inte bara ens egen.
function friendAvatarHTML(avatar, frameKey, size, padding) {
  if (!avatar) {
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--input-bg);border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--muted);flex-shrink:0"><span style="width:${Math.round(size * 0.55)}px;height:${Math.round(size * 0.55)}px;display:flex">${ICONS.userCircle}</span></div>`;
  }
  const key = PROFILE_FRAME_KEY_MIGRATIONS[frameKey] || frameKey;
  const resolvedKey = key && PROFILE_FRAMES[key] ? key : "cometGold";
  const frame = profileFrameWrapStyle(resolvedKey, padding);
  return `<div class="${frame.className}" style="${frame.style};flex-shrink:0"><img src="${avatar}" alt="Profilbild" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block" /></div>`;
}
function friendBeltsSectionHTML(beltDates) {
  const highest = highestActiveBeltName(beltDates);
  if (!highest) return "";
  const tiers = BELT_TIERS.slice(0, 5);
  const highestIdx = tiers.findIndex((t) => t.name === highest);
  const visibleTiers = tiers.slice(0, highestIdx + 1);
  return `
    <div style="margin-top:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">Bälten</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${visibleTiers.map((tier) => {
          const dateVal = beltDates[tier.name];
          const d = dateVal ? new Date(dateVal + "T00:00:00") : null;
          const dateLabel = d ? `${d.getDate()} ${MONTHS_SV[d.getMonth()]} ${d.getFullYear()}` : "";
          return `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:66px">
              <img src="${PROFILE_BELT_IMAGES[tier.name]}" alt="${tier.name}" style="width:56px;height:auto;object-fit:contain;display:block" />
              <span style="font-size:9px;text-align:center;color:var(--muted2);line-height:1.15">${dateLabel}</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
async function openFriendsModal() {
  pushModalHistoryIfNeeded();
  friendSearchQuery = "";
  friendSearchResults = [];
  friendSearchLoading = false;
  friendsDataLoaded = false;
  modalRoot.innerHTML = `<div class="modal-overlay" id="friendsModalOverlay"><div class="modal-sheet" style="min-height:85vh;min-height:85dvh">${friendsModalBodyHTML()}</div></div>`;
  wireFriendsModal();
  await loadFriendsData();
  rerenderFriendsModal();
}
async function loadFriendsData() {
  if (!supabaseClient || !authUser) return;
  try {
    const [incomingRes, outgoingRes, listRes] = await Promise.all([
      supabaseClient.rpc("get_incoming_friend_requests"),
      supabaseClient.rpc("get_outgoing_friend_requests"),
      supabaseClient.rpc("get_friend_list"),
    ]);
    incomingFriendRequests = Array.isArray(incomingRes.data) ? incomingRes.data : [];
    outgoingFriendRequests = Array.isArray(outgoingRes.data) ? outgoingRes.data : [];
    friendList = Array.isArray(listRes.data) ? listRes.data : [];
  } catch (e) { /* visas som tom lista */ }
  friendsDataLoaded = true;
}
function friendSearchResultsHTML() {
  if (friendSearchLoading) return `<div class="empty">Söker…</div>`;
  if (!friendSearchResults.length) return "";
  return friendSearchResults.map((r) => `
    <div class="list-row">
      ${friendAvatarHTML(r.avatar, r.frame, 32, 2)}
      <span style="font-size:13px;flex:1">${escapeHtml(r.display_name || "Okänd")} <span style="font-size:11px;color:var(--muted2)">#${shortSocialId(r.user_id)}</span></span>
      ${r.relationship === "friends" ? `<span style="font-size:11px;color:var(--muted2)">Vänner</span>`
        : r.relationship === "pending_sent" ? `<span style="font-size:11px;color:var(--muted2)">Väntar</span>`
        : r.relationship === "pending_received" ? `<button class="modal-btn primary" data-friend-accept="${escapeHtml(r.user_id)}" style="width:auto;padding:6px 12px;font-size:12px">Godkänn</button>`
        : `<button class="modal-btn secondary" data-friend-add="${escapeHtml(r.user_id)}" style="width:auto;padding:6px 12px;font-size:12px">Lägg till</button>`}
    </div>
  `).join("");
}
function friendRowHTML(f) {
  return `
    <button data-open-friend="${escapeHtml(f.user_id)}" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:none;border:none;padding:8px 0;font-family:inherit;cursor:pointer;text-align:left;border-bottom:1px solid var(--border)">
      <span style="display:flex;align-items:center;gap:10px;min-width:0">
        ${friendAvatarHTML(f.avatar, f.frame, 36, 2)}
        <span style="font-size:14px;font-weight:600;color:var(--text)">${escapeHtml(f.display_name || "Okänd")}${f.platinum_unlocked_at ? ` <span title="New Game+ — alla prestationer klara">🏆</span>` : ""} <span style="font-size:11px;font-weight:400;color:var(--muted2)">#${shortSocialId(f.user_id)}</span></span>
      </span>
      <span style="font-size:12px;color:var(--muted2);flex-shrink:0">Nivå ${f.level}</span>
    </button>
  `;
}
function friendsListSectionHTML() {
  if (friendList.length === 0) return `<div class="empty">Inga vänner ännu — sök efter någon ovan.</div>`;
  if (!friendGroups.length) return friendList.map((f) => friendRowHTML(f)).join("");
  const groupsWithMembers = friendGroups
    .map((g) => ({ group: g, members: friendList.filter((f) => friendGroupOf[f.user_id] === g.id) }))
    .filter((g) => g.members.length);
  const groupedIds = new Set(groupsWithMembers.flatMap((g) => g.members.map((f) => f.user_id)));
  const ungrouped = friendList.filter((f) => !groupedIds.has(f.user_id));
  let html = "";
  groupsWithMembers.forEach((g) => {
    html += `<div style="font-size:12px;font-weight:700;color:var(--muted2);margin:14px 0 4px">${escapeHtml(g.group.name)}</div>`;
    html += g.members.map((f) => friendRowHTML(f)).join("");
  });
  if (ungrouped.length) {
    html += `<div style="font-size:12px;font-weight:700;color:var(--muted2);margin:14px 0 4px">Ogrupperad</div>`;
    html += ungrouped.map((f) => friendRowHTML(f)).join("");
  }
  return html;
}
function friendGroupsManagerHTML() {
  return `
    <div style="margin-top:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">Grupper</div>
      ${friendGroups.length ? `
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          ${friendGroups.map((g) => `
            <span class="chip" style="display:inline-flex;align-items:center;gap:6px">
              ${escapeHtml(g.name)}
              <span data-remove-friend-group="${escapeHtml(g.id)}" style="cursor:pointer;opacity:0.7">✕</span>
            </span>
          `).join("")}
        </div>
      ` : ""}
      <div style="display:flex;gap:8px">
        <input type="text" id="newFriendGroupInput" placeholder="Nytt gruppnamn, t.ex. BJJ" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit" />
        <button class="modal-btn secondary" id="addFriendGroupBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Lägg till</button>
      </div>
    </div>
  `;
}
function addFriendGroup() {
  const input = document.getElementById("newFriendGroupInput");
  const name = input ? input.value.trim() : "";
  if (!name) return;
  friendGroups.push({ id: uid(), name });
  saveFriendGroups();
  scheduleCloudPush();
  rerenderFriendsModal();
}
function removeFriendGroup(groupId) {
  friendGroups = friendGroups.filter((g) => g.id !== groupId);
  saveFriendGroups();
  Object.keys(friendGroupOf).forEach((userId) => {
    if (friendGroupOf[userId] === groupId) delete friendGroupOf[userId];
  });
  saveFriendGroupOf();
  scheduleCloudPush();
  rerenderFriendsModal();
}
function friendsModalBodyHTML() {
  return `
    <div style="display:flex;align-items:center;gap:10px">
      <button id="friendsModalBackBtn" aria-label="Tillbaka" style="background:none;border:none;padding:4px;margin:-4px;cursor:pointer;color:var(--text);display:flex;align-items:center;flex-shrink:0"><span class="icon-20">${ICONS.chevronLeft}</span></button>
      <h2>👥 Vänner</h2>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px">
      <div>
        <div style="font-size:13px;font-weight:600">Sökbar för andra</div>
        <div style="font-size:11px;color:var(--muted2)">Måste vara på för att andra ska hitta dig via sök.</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="socialSearchableToggle" ${socialSearchable ? "checked" : ""} />
        <span class="toggle-slider"></span>
      </label>
    </div>
    <p style="margin-top:6px;font-size:11px;color:var(--muted2);text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">
      <span>Ditt ID: <strong>#${authUser ? shortSocialId(authUser.id) : ""}</strong> — dela det om flera har samma namn som du.</span>
      ${authUser ? `<button id="copySocialIdBtn" style="background:none;border:1px solid var(--border2);border-radius:6px;padding:2px 7px;font-size:10px;color:var(--muted2);cursor:pointer">Kopiera</button>` : ""}
    </p>

    <div style="margin-top:12px;display:flex;gap:8px">
      <input type="text" id="friendSearchInput" placeholder="Sök på namn, ID eller mejl…" value="${escapeHtml(friendSearchQuery)}" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit" />
      <button class="modal-btn primary" id="friendSearchBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Sök</button>
    </div>
    <div id="friendSearchResultsWrap" style="margin-top:6px">${friendSearchResultsHTML()}</div>

    ${!friendsDataLoaded ? `<div class="empty" style="margin-top:14px">Hämtar…</div>` : `
      ${incomingFriendRequests.length ? `
        <div style="margin-top:16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">Inkommande förfrågningar</div>
          ${incomingFriendRequests.map((r) => `
            <div class="list-row">
              ${friendAvatarHTML(r.avatar, r.frame, 32, 2)}
              <span style="font-size:13px;flex:1">${escapeHtml(r.display_name || "Okänd")} <span style="font-size:11px;color:var(--muted2)">#${shortSocialId(r.user_id)}</span></span>
              <button class="modal-btn primary" data-friend-accept="${escapeHtml(r.user_id)}" style="width:auto;padding:6px 12px;font-size:12px">Godkänn</button>
              <button class="delete-btn" data-friend-decline="${escapeHtml(r.user_id)}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${outgoingFriendRequests.length ? `
        <div style="margin-top:16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">Väntar på svar</div>
          ${outgoingFriendRequests.map((r) => `
            <div class="list-row">
              ${friendAvatarHTML(r.avatar, r.frame, 32, 2)}
              <span style="font-size:13px;flex:1">${escapeHtml(r.display_name || "Okänd")} <span style="font-size:11px;color:var(--muted2)">#${shortSocialId(r.user_id)}</span></span>
              <button class="delete-btn" data-friend-cancel="${escapeHtml(r.user_id)}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${friendList.length > 0 ? friendGroupsManagerHTML() : ""}
      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px">Dina vänner ${friendList.length ? `(${friendList.length})` : ""}</div>
        ${friendsListSectionHTML()}
      </div>
    `}
    <div class="modal-close" id="friendsModalCloseBtn">← Tillbaka</div>
  `;
}
function closeFriendsModal() {
  modalRoot.innerHTML = "";
  openProfileModal();
}
function wireFriendsModal() {
  const closeBtn = document.getElementById("friendsModalCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeFriendsModal);
  const backBtn = document.getElementById("friendsModalBackBtn");
  if (backBtn) backBtn.addEventListener("click", closeFriendsModal);
  const overlay = document.getElementById("friendsModalOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "friendsModalOverlay") { closeFriendsModal(); reestablishModalMarkerIfStillOpen(); }
    });
  }
  const searchableToggle = document.getElementById("socialSearchableToggle");
  if (searchableToggle) {
    searchableToggle.addEventListener("change", (e) => {
      socialSearchable = e.target.checked;
      saveSocialSearchable();
      scheduleCloudPush();
    });
  }
  const searchBtn = document.getElementById("friendSearchBtn");
  const searchInput = document.getElementById("friendSearchInput");
  if (searchBtn) searchBtn.addEventListener("click", runFriendSearch);
  wireEnterSubmit(["friendSearchInput"], searchBtn);
  if (searchInput) {
    searchInput.addEventListener("input", (e) => { friendSearchQuery = e.target.value; });
  }
  const copySocialIdBtn = document.getElementById("copySocialIdBtn");
  if (copySocialIdBtn) {
    copySocialIdBtn.addEventListener("click", async () => {
      const id = authUser ? shortSocialId(authUser.id) : "";
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText("#" + id);
        }
        showInfoToast("ID kopierat!");
      } catch (e) {
        showInfoToast("Kunde inte kopiera - ditt ID är #" + id);
      }
    });
  }
  document.querySelectorAll("[data-friend-add]").forEach((btn) => {
    btn.addEventListener("click", () => sendFriendRequestTo(btn.dataset.friendAdd));
  });
  document.querySelectorAll("[data-friend-accept]").forEach((btn) => {
    btn.addEventListener("click", () => respondToFriendRequest(btn.dataset.friendAccept, true));
  });
  document.querySelectorAll("[data-friend-decline]").forEach((btn) => {
    btn.addEventListener("click", () => respondToFriendRequest(btn.dataset.friendDecline, false));
  });
  document.querySelectorAll("[data-friend-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => cancelOrRemoveFriend(btn.dataset.friendCancel));
  });
  document.querySelectorAll("[data-open-friend]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = friendList.find((x) => x.user_id === btn.dataset.openFriend);
      if (f) openFriendProfileModal(f);
    });
  });
  const addGroupBtn = document.getElementById("addFriendGroupBtn");
  if (addGroupBtn) addGroupBtn.addEventListener("click", addFriendGroup);
  wireEnterSubmit(["newFriendGroupInput"], addGroupBtn);
  document.querySelectorAll("[data-remove-friend-group]").forEach((btn) => {
    btn.addEventListener("click", () => removeFriendGroup(btn.dataset.removeFriendGroup));
  });
}
function rerenderFriendsModal() {
  const sheet = document.querySelector("#friendsModalOverlay .modal-sheet");
  if (!sheet) return;
  sheet.innerHTML = friendsModalBodyHTML();
  wireFriendsModal();
}
async function runFriendSearch() {
  const input = document.getElementById("friendSearchInput");
  const query = (input ? input.value : friendSearchQuery).trim();
  friendSearchQuery = query;
  if (query.length < 2) { showInfoToast("Skriv minst 2 tecken för att söka."); return; }
  friendSearchLoading = true;
  const wrap = document.getElementById("friendSearchResultsWrap");
  if (wrap) wrap.innerHTML = friendSearchResultsHTML();
  try {
    const { data, error } = await supabaseClient.rpc("search_social_users", { p_query: query });
    if (error) throw error;
    friendSearchResults = Array.isArray(data) ? data : [];
  } catch (e) {
    friendSearchResults = [];
  }
  friendSearchLoading = false;
  rerenderFriendsModal();
}
async function sendFriendRequestTo(userId) {
  try {
    const { error } = await supabaseClient.rpc("send_or_accept_friend_request", { p_to_user_id: userId });
    if (error) throw error;
    showInfoToast("Vänförfrågan skickad!");
    await loadFriendsData();
    await runFriendSearch();
  } catch (e) {
    showInfoToast("Kunde inte skicka förfrågan.");
  }
}
async function respondToFriendRequest(fromUserId, accept) {
  try {
    const { error } = await supabaseClient.rpc("respond_friend_request", { p_from_user_id: fromUserId, p_accept: accept });
    if (error) throw error;
    await loadFriendsData();
    rerenderFriendsModal();
  } catch (e) {
    showInfoToast("Något gick fel.");
  }
}
async function cancelOrRemoveFriend(otherUserId) {
  try {
    const { error } = await supabaseClient.rpc("remove_friend", { p_other_user_id: otherUserId });
    if (error) throw error;
    await loadFriendsData();
    if (friendSearchResults.length) await runFriendSearch(); else rerenderFriendsModal();
  } catch (e) {
    showInfoToast("Något gick fel.");
  }
}

function friendAchievementBadgeHTML(a) {
  const mainIconHTML = a.badgeImage
    ? `<img src="${a.badgeImage}" alt="${escapeHtml(a.title)}" style="width:34px;height:34px;object-fit:contain;display:block" />`
    : `<span style="width:16px;height:16px;display:flex">${ICONS[a.icon] || ""}</span>`;
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:58px" title="${escapeHtml(a.title)}">
      <div style="width:44px;height:44px;border-radius:50%;border:1.5px solid ${tabColors.stats};display:flex;align-items:center;justify-content:center;background:var(--input-bg)">${mainIconHTML}</div>
      <span style="font-size:9px;text-align:center;color:var(--text);line-height:1.15">${escapeHtml(a.title)}</span>
    </div>
  `;
}
async function openFriendProfileModal(friend) {
  pushModalHistoryIfNeeded();
  const levelInfo = computeLevelInfo(friend.total_xp || 0);
  const unlockedSet = new Set(Array.isArray(friend.unlocked_achievements) ? friend.unlocked_achievements : []);
  const unlockedAchDefs = ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id) && !a.secret);
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="friendProfileOverlay">
      <div class="modal-sheet" style="min-height:85vh;min-height:85dvh">
        <button id="friendProfileBackBtn" aria-label="Tillbaka" style="background:none;border:none;padding:4px;margin:-4px;cursor:pointer;color:var(--text);display:flex;align-items:center;flex-shrink:0"><span class="icon-20">${ICONS.chevronLeft}</span></button>
        <div style="position:relative;display:flex;justify-content:center;margin-bottom:8px">${crownEmblemOverlayHTMLForFriend(friend.crown_emblem, friend.platinum_unlocked_at, 96)}${friendAvatarHTML(friend.avatar, friend.frame, 72, 3)}</div>
        <h2 style="text-align:center">${escapeHtml(friend.display_name || "Okänd")} <span style="font-size:13px;font-weight:400;color:var(--muted2)">#${shortSocialId(friend.user_id)}</span></h2>
        ${friend.platinum_unlocked_at ? `<div style="display:flex;justify-content:center;margin-top:2px"><span style="display:inline-flex;align-items:center;gap:4px;background:rgba(239,159,39,0.12);border:1px solid rgba(239,159,39,0.4);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;color:#EF9F27">🏆 New Game+ — 100%</span></div>` : ""}
        ${friendGroups.length ? `
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px">
          <span style="font-size:12px;color:var(--muted2)">Grupp:</span>
          <select data-friend-group-select style="width:auto">
            <option value="">Ingen grupp</option>
            ${friendGroups.map((g) => `<option value="${escapeHtml(g.id)}" ${friendGroupOf[friend.user_id] === g.id ? "selected" : ""}>${escapeHtml(g.name)}</option>`).join("")}
          </select>
        </div>
        ` : ""}
        <div style="display:flex;justify-content:space-around;text-align:center;margin-top:6px">
          <div>
            <div style="font-size:20px;font-weight:800">${levelInfo.level}</div>
            <div style="font-size:11px;color:var(--muted2)">Level</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:800">${friend.total_sessions || 0}</div>
            <div style="font-size:11px;color:var(--muted2)">Pass</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:800">${friend.current_streak || 0}</div>
            <div style="font-size:11px;color:var(--muted2)">Streak</div>
          </div>
        </div>
        <div style="margin-top:10px">
          <div style="height:8px;border-radius:6px;background:var(--border);overflow:hidden">
            <div style="height:100%;width:${Math.min(100, Math.round((levelInfo.xpIntoLevel / Math.max(1, levelInfo.xpForNext)) * 100))}%;background:${tabColors.stats}"></div>
          </div>
          <div style="font-size:11px;color:var(--muted2);text-align:center;margin-top:4px">${levelInfo.xpIntoLevel} / ${levelInfo.xpForNext} XP till nästa nivå</div>
        </div>
        <div style="margin-top:16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px">Upplåsta prestationer (${unlockedAchDefs.length})</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px 8px">
            ${unlockedAchDefs.length ? unlockedAchDefs.map((a) => friendAchievementBadgeHTML(a)).join("") : `<div class="empty">Inga prestationer upplåsta ännu.</div>`}
          </div>
        </div>
        <div style="margin-top:16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px">Personbästa</div>
          <div id="friendPbListWrap"><div class="empty">Hämtar…</div></div>
        </div>
        ${friendBeltsSectionHTML(friend.belt_dates || {})}
        <button class="delete-btn" data-remove-friend="${escapeHtml(friend.user_id)}" data-armed="false" style="width:auto;margin:14px auto 0;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted2)">${ICONS.trash} Ta bort vän</button>
        <div class="modal-close" id="friendProfileCloseBtn">← Tillbaka</div>
      </div>
    </div>
  `;
  document.getElementById("friendProfileCloseBtn").addEventListener("click", returnToFriendsModal);
  document.getElementById("friendProfileBackBtn").addEventListener("click", returnToFriendsModal);
  document.getElementById("friendProfileOverlay").addEventListener("click", (e) => {
    if (e.target.id === "friendProfileOverlay") { returnToFriendsModal(); reestablishModalMarkerIfStillOpen(); }
  });
  const groupSelect = document.querySelector("[data-friend-group-select]");
  if (groupSelect) {
    groupSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val) friendGroupOf[friend.user_id] = val;
      else delete friendGroupOf[friend.user_id];
      saveFriendGroupOf();
      scheduleCloudPush();
    });
  }
  const removeFriendBtn = document.querySelector("[data-remove-friend]");
  if (removeFriendBtn) {
    removeFriendBtn.addEventListener("click", async () => {
      if (removeFriendBtn.dataset.armed !== "true") {
        removeFriendBtn.dataset.armed = "true";
        removeFriendBtn.style.color = "#E8834A";
        removeFriendBtn.title = "Tryck igen för att bekräfta";
        return;
      }
      await cancelOrRemoveFriend(removeFriendBtn.dataset.removeFriend);
      returnToFriendsModal();
    });
  }
  await renderFriendPbList(friend.user_id);
}
function returnToFriendsModal() {
  modalRoot.innerHTML = `<div class="modal-overlay" id="friendsModalOverlay"><div class="modal-sheet" style="min-height:85vh;min-height:85dvh">${friendsModalBodyHTML()}</div></div>`;
  wireFriendsModal();
}
async function renderFriendPbList(userId) {
  const wrap = document.getElementById("friendPbListWrap");
  if (!wrap) return;
  try {
    const { data, error } = await supabaseClient.rpc("get_friend_pbs", { p_user_id: userId });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) { wrap.innerHTML = `<div class="empty">Inga personbästa loggade än.</div>`; return; }
    wrap.innerHTML = rows.map((r) => {
      if (r.kind === "strength") {
        const exDef = pbExercises.find((p) => p.id === r.exercise_id);
        const label = exDef ? exDef.label : r.exercise_id;
        const unit = exDef && exDef.unit === "reps" ? "reps" : "kg";
        return `<div class="list-row"><span style="font-size:13px;flex:1">${escapeHtml(label)}</span><span style="font-size:13px;font-weight:600">${Number(r.value)} ${unit}</span></div>`;
      }
      const distDef = konditionPbDistances.find((d) => d.id === r.distance_id);
      const distLabel = distDef ? distDef.label : r.distance_id;
      const typeLabel = r.type ? typeMeta(r.type).label : "";
      return `<div class="list-row"><span style="font-size:13px;flex:1">${escapeHtml(distLabel)}${typeLabel ? ` (${escapeHtml(typeLabel)})` : ""}</span><span style="font-size:13px;font-weight:600">${fmtMinSec(Number(r.value))}</span></div>`;
    }).join("");
  } catch (e) {
    wrap.innerHTML = `<div class="status-msg err" style="display:block">Kunde inte hämta personbästa.</div>`;
  }
}

function pbHistoryCardHTML() {
  const gymEntries = pbLog.map((e) => {
    const exDef = pbExercises.find((p) => p.id === e.exerciseId) || {};
    return { ...e, label: exDef.label || "?", display: `${e.value} ${exDef.unit === "reps" ? "reps" : "kg"}`, isKondition: false };
  });
  const konditionEntries = konditionPbLog.map((e) => {
    const distLabel = (konditionPbDistances.find((d) => d.id === e.distanceId) || {}).label || "?";
    const typeLabel = e.type ? ` (${typeMeta(e.type).label})` : "";
    return { ...e, label: `${distLabel}${typeLabel}`, display: fmtMinSec(e.minutes), isKondition: true };
  });
  const all = [...gymEntries, ...konditionEntries].sort((a, b) => b.date.localeCompare(a.date));
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showPbHistoryToggle", "Personbästa — historik", showPbHistory, showPbHistory ? "10px" : null)}
      ${showPbHistory ? `
        <div class="history-scroll">
          ${all.length === 0 ? `<div class="empty">Inga personbästa loggade än</div>` : ""}
          ${all.map((e) => `
            <div class="list-row">
              <span style="font-size:13px;color:var(--muted);flex:1">${fmtDateWithWeekday(e.date)}</span>
              <span style="font-size:13px;color:var(--muted);min-width:90px">${escapeHtml(e.label)}</span>
              <span style="font-size:14px;font-weight:600">${e.display}</span>
              <button class="delete-btn" data-del-pb="${e.id}" data-del-pb-kondition="${e.isKondition}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}
function renderPersonalRecordsCard() {
  const wrap = document.getElementById("personalRecordsCardWrap");
  if (!wrap) return;
  wrap.innerHTML = personalRecordsCardHTML();
  wirePersonalRecordsCardEvents();
  loadPbRanks();
}
function renderPbHistoryCard() {
  const wrap = document.getElementById("pbHistoryCardWrap");
  if (!wrap) return;
  wrap.innerHTML = pbHistoryCardHTML();
  wirePbHistoryCardEvents();
}
function wirePbHistoryCardEvents() {
  const toggle = document.getElementById("showPbHistoryToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showPbHistory = !showPbHistory;
      saveShowPbHistory();
      renderPbHistoryCard();
    });
  }
  document.querySelectorAll("[data-del-pb]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isKondition = btn.dataset.delPbKondition === "true";
      if (isKondition) {
        konditionPbLog = konditionPbLog.filter((e) => e.id !== btn.dataset.delPb);
        persistKonditionPbLog();
      } else {
        pbLog = pbLog.filter((e) => e.id !== btn.dataset.delPb);
        persistPbLog();
      }
      pbRankCache = {};
      renderPbHistoryCard();
      renderPersonalRecordsCard();
    });
  });
}
function wirePersonalRecordsCardEvents() {
  const toggle = document.getElementById("showPbCardToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showPbCard = !showPbCard;
      saveShowPbCard();
      renderPersonalRecordsCard();
    });
  }
  const openLeaderboardBtn = document.getElementById("openPbLeaderboardBtn");
  if (openLeaderboardBtn) {
    openLeaderboardBtn.addEventListener("click", () => openPbLeaderboardModal());
  }
  wirePbHistoryCardEvents();
}

function senastePassenCardHTML() {
  const filterOptions = [...TRAINING_KEYS, ...HEALTH_KEYS];
  const periodCutoffDate = workoutFilterState.period === "all" ? null : addDays(todayISO(), -WORKOUT_PERIOD_DAYS[workoutFilterState.period]);
  const filteredEntries = workoutEntries.filter((e) => {
    if (workoutFilterState.type !== "all" && e.type !== workoutFilterState.type) return false;
    if (periodCutoffDate && e.date < periodCutoffDate) return false;
    if (workoutFilterState.search) {
      const term = workoutFilterState.search.toLowerCase();
      const label = (e.type === "Ovrigt" && e.customLabel ? e.customLabel : typeMeta(e.type).label).toLowerCase();
      const note = (e.note || "").toLowerCase();
      if (!label.includes(term) && !note.includes(term)) return false;
    }
    return true;
  });
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showWorkoutHistoryToggle", "Historik", showWorkoutHistory, showWorkoutHistory ? "10px" : null)}
      ${showWorkoutHistory ? `
        <div class="filter-row">
          <select class="filter-select" id="workoutFilterType">
            <option value="all" ${workoutFilterState.type === "all" ? "selected" : ""}>Alla typer</option>
            ${filterOptions.map((k) => `<option value="${k}" ${workoutFilterState.type === k ? "selected" : ""}>${TYPES[k].label}</option>`).join("")}
          </select>
          <select class="filter-select" id="workoutFilterPeriod">
            ${periodSelectOptionsHTML(workoutFilterState.period)}
          </select>
          <input type="text" class="filter-select" id="workoutFilterSearch" placeholder="Sök kommentar..." value="${escapeHtml(workoutFilterState.search)}" style="flex:1;min-width:120px" />
        </div>
        <div class="history-scroll" style="max-height:420px">
          ${filteredEntries.length === 0 ? `<div class="empty">${workoutEntries.length === 0 ? "Inga pass loggade än" : "Inga pass matchar filtret"}</div>` : ""}
          ${filteredEntries.map((e) => {
            const entryIsHealth = e.type === "Sjuk" || e.type === "Skadad";
            return `
            <div class="workout-item">
              <div class="list-row" style="border-bottom:none;padding:0">
                <span class="dot" style="background:${typeMeta(e.type).color}"></span>
                <span style="font-size:13px;color:var(--muted);white-space:nowrap">${fmtDateWithWeekday(e.date)}</span>
                <span style="font-size:14px;font-weight:600;flex:1">${e.type === "Ovrigt" && e.customLabel ? escapeHtml(e.customLabel) : typeMeta(e.type).label}</span>
                ${!entryIsHealth ? `<span style="font-size:13px;min-width:60px;text-align:right">${fmtMinutes(e.minutes)}</span>` : ""}
                <button class="delete-btn" data-edit-workout="${e.id}">${ICONS.pencil}</button>
                <button class="delete-btn" data-del-workout="${e.id}">${ICONS.trash}</button>
              </div>
              ${e.note ? `<div class="workout-note">${escapeHtml(e.note)}</div>` : ""}
            </div>
          `;
          }).join("")}
        </div>
      ` : ""}
    </div>
  `;
}
function renderSenastePassenCard() {
  const wrap = document.getElementById("senastePassenCardWrap");
  if (!wrap) return;
  wrap.innerHTML = senastePassenCardHTML();
  wireSenastePassenCardEvents();
}
function wireSenastePassenCardEvents() {
  const toggle = document.getElementById("showWorkoutHistoryToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showWorkoutHistory = !showWorkoutHistory;
      saveShowWorkoutHistory();
      renderSenastePassenCard();
    });
  }
  const typeSelect = document.getElementById("workoutFilterType");
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      workoutFilterState.type = e.target.value;
      renderSenastePassenCard();
    });
  }
  const periodSelect = document.getElementById("workoutFilterPeriod");
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      workoutFilterState.period = e.target.value;
      renderSenastePassenCard();
    });
  }
  const searchInput = document.getElementById("workoutFilterSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      workoutFilterState.search = e.target.value;
      renderSenastePassenCard();
    });
  }
  content.querySelectorAll("[data-edit-workout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = workoutEntries.find((e) => e.id === btn.dataset.editWorkout);
      if (!entry) return;
      workoutFormState.type = TYPES[entry.type] ? entry.type : workoutFormState.type;
      workoutFormState.date = entry.date;
      workoutFormState.minutes = entry.minutes || DEFAULT_MINUTES[entry.type] || "";
      workoutFormState.customLabel = entry.customLabel || "";
      workoutFormState.note = entry.note || "";
      workoutFormState.editingId = entry.id;
      renderTraning();
      content.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        const noteEl = document.getElementById("workoutNote");
        if (noteEl) {
          noteEl.focus();
          noteEl.style.transition = "box-shadow .2s ease";
          noteEl.style.boxShadow = `0 0 0 3px ${tabColors.traning}`;
          setTimeout(() => { noteEl.style.boxShadow = ""; }, 1500);
        }
      }, 350);
    });
  });
  content.querySelectorAll("[data-del-workout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const removed = workoutEntries.find((e) => e.id === btn.dataset.delWorkout);
      workoutEntries = workoutEntries.filter((e) => e.id !== btn.dataset.delWorkout);
      persistWorkouts();
      // Ta bort den auto-tillagda "kalorier förbrukade"-posten som skapades
      // när passet loggades, annars blir den kvar övergiven i Kalorier-
      // fliken. Nyare pass har en direkt koppling (autoFromWorkoutId); för
      // äldre poster utan koppling görs en försiktig gissning (samma datum,
      // typ "burned", exakt samma kcal som standardvärdet för passtypen) -
      // bara om det finns EN sådan kandidat, för att aldrig råka ta bort en
      // manuellt tillagd post av misstag.
      let removedCalorie = null;
      if (removed) {
        const linkedIdx = calorieLog.findIndex((c) => c.autoFromWorkoutId === removed.id);
        if (linkedIdx !== -1) {
          removedCalorie = calorieLog[linkedIdx];
          calorieLog.splice(linkedIdx, 1);
        } else {
          const defaultKcal = parseInt(DEFAULT_KCAL_BURNED[removed.type], 10);
          if (!isNaN(defaultKcal) && defaultKcal > 0) {
            const candidates = calorieLog.filter((c) => c.type === "burned" && c.date === removed.date && c.kcal === defaultKcal && !c.autoFromWorkoutId);
            if (candidates.length === 1) {
              removedCalorie = candidates[0];
              calorieLog = calorieLog.filter((c) => c.id !== removedCalorie.id);
            }
          }
        }
        if (removedCalorie) persistCalorieLog();
      }
      vibrate(10);
      renderSenastePassenCard();
      if (activeTab === "kalorier") renderKalorier();
      if (removed) {
        const label = removed.type === "Ovrigt" && removed.customLabel ? removed.customLabel : typeMeta(removed.type).label;
        showUndoToast(`${label} borttaget`, () => {
          workoutEntries.push(removed);
          workoutEntries.sort((a, b) => b.date.localeCompare(a.date));
          persistWorkouts();
          if (removedCalorie) {
            calorieLog.push(removedCalorie);
            persistCalorieLog();
          }
          if (activeTab === "traning") renderSenastePassenCard();
          if (activeTab === "kalorier") renderKalorier();
        });
      }
    });
  });
}

function gymSessionViewHTML() {
  const s = activeGymSession;
  const splitLabel = (gymSplits.find((g) => g.id === s.splitId) || {}).text || "";
  const lastSession = lastSessionForSplit(s.splitId);
  const availableToAdd = exercisesForSplit(s.splitId).filter((e) => e.enabled && !s.exercises.some((ex) => ex.exerciseId === e.id));
  return `
    <div class="card" style="background:${tabColors.traning}1A;border-color:${tabColors.traning}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="card-label" style="margin-bottom:0">🏋️ ${escapeHtml(splitLabel)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">${fmtDateWithWeekday(s.date)}</div>
        </div>
        <button class="modal-btn secondary" id="pauseGymSessionBtn" style="width:auto;padding:9px 16px">⏸️ Pausa</button>
      </div>
    </div>

    ${s.exercises.map((ex, exIdx) => {
      const lastEx = lastSession ? lastSession.exercises.find((le) => le.name === ex.name) : null;
      const best = bestSetForExercise(ex.name);
      return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-weight:700;font-size:14px">${escapeHtml(ex.name)}</div>
          <button class="delete-btn" data-remove-exercise="${exIdx}">${ICONS.trash}</button>
        </div>
        ${lastEx ? `<div style="font-size:11.5px;color:var(--muted2)">Förra gången: ${lastEx.sets.map((s) => (s && s.weight != null ? `${s.weight}kg×${s.reps != null ? s.reps : "?"}` : "–")).join(", ")}</div>` : ""}
        ${best ? `<div style="font-size:11.5px;color:${tabColors.traning};margin-bottom:10px">🏆 Bästa: ${best.weight}kg${best.reps != null ? `×${best.reps}` : ""}</div>` : `<div style="margin-bottom:10px"></div>`}
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;padding-left:44px">
          <span style="flex:1;text-align:center;font-size:10.5px;color:var(--muted2)">Kg</span>
          <span style="flex:1;text-align:center;font-size:10.5px;color:var(--muted2)">Reps</span>
          <span style="width:30px;flex-shrink:0"></span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${ex.sets.map((set, setIdx) => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:var(--muted2);width:36px;flex-shrink:0">Set ${setIdx + 1}</span>
              <input type="number" inputmode="decimal" step="0.5" placeholder="kg" value="${set.weight != null ? set.weight : ""}" data-set-weight="${exIdx}:${setIdx}" enterkeyhint="done" style="flex:1;min-width:0;text-align:center" />
              <input type="number" inputmode="numeric" placeholder="reps" value="${set.reps != null ? set.reps : ""}" data-set-reps="${exIdx}:${setIdx}" enterkeyhint="done" style="flex:1;min-width:0;text-align:center" />
            </div>
          `).join("")}
        </div>
        <button class="chip" data-add-set="${exIdx}" style="margin-top:10px">+ Set</button>
      </div>
    `;
    }).join("")}

    <div class="card">
      <div class="card-label">Lägg till övning</div>
      <div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:10px">
        ${availableToAdd.map((e) => `<button class="chip" data-add-exercise="${e.id}">${escapeHtml(e.name)}</button>`).join("") || `<span style="font-size:12.5px;color:var(--muted)">Alla ordinarie övningar är redan tillagda.</span>`}
      </div>
      <div class="row">
        <input type="text" id="customExerciseInput" placeholder="Egen övning" enterkeyhint="go" style="flex:1;min-width:0" />
        <button class="btn-primary" id="addCustomExerciseBtn" style="background:${tabColors.traning}">${ICONS.plus}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-label">Avsluta passet</div>
      <div class="row" style="align-items:center">
        <input type="number" inputmode="numeric" id="gymSessionMinutes" placeholder="Minuter" value="${DEFAULT_MINUTES.Gym || 60}" style="max-width:100px" />
        <span style="font-size:13px;color:var(--muted)">minuter</span>
      </div>
      <button class="modal-btn primary" id="finishGymSessionBtn" style="width:100%;margin-top:12px">✅ Avsluta pass</button>
    </div>

    <div class="disclaimer">Copyright 2026 Mattias Öman</div>
  `;
}
function wireGymSessionViewEvents() {
  const pauseBtn = document.getElementById("pauseGymSessionBtn");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      gymSessionViewOpen = false;
      renderTraning();
    });
  }
  content.querySelectorAll("[data-set-weight]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [exIdx, setIdx] = input.dataset.setWeight.split(":").map(Number);
      const val = parseFloat(e.target.value.replace(",", "."));
      activeGymSession.exercises[exIdx].sets[setIdx].weight = isNaN(val) ? null : val;
      saveActiveGymSession();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const [exIdx, setIdx] = input.dataset.setWeight.split(":").map(Number);
      const repsInput = content.querySelector(`[data-set-reps="${exIdx}:${setIdx}"]`);
      if (repsInput) repsInput.focus(); else input.blur();
    });
  });
  content.querySelectorAll("[data-set-reps]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [exIdx, setIdx] = input.dataset.setReps.split(":").map(Number);
      const val = parseInt(e.target.value, 10);
      activeGymSession.exercises[exIdx].sets[setIdx].reps = isNaN(val) ? null : val;
      saveActiveGymSession();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const allWeightInputs = [...content.querySelectorAll("[data-set-weight]")];
      const [exIdx, setIdx] = input.dataset.setReps.split(":").map(Number);
      const currentWeightInput = content.querySelector(`[data-set-weight="${exIdx}:${setIdx}"]`);
      const currentPos = allWeightInputs.indexOf(currentWeightInput);
      const next = allWeightInputs[currentPos + 1];
      if (next) next.focus(); else input.blur();
    });
  });
  content.querySelectorAll("[data-add-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exIdx = parseInt(btn.dataset.addSet, 10);
      const ex = activeGymSession.exercises[exIdx];
      const lastReps = ex.sets.length ? ex.sets[ex.sets.length - 1].reps : 12;
      ex.sets.push({ weight: null, reps: lastReps != null ? lastReps : 12 });
      saveActiveGymSession();
      renderTraning();
    });
  });
  content.querySelectorAll("[data-remove-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exIdx = parseInt(btn.dataset.removeExercise, 10);
      activeGymSession.exercises.splice(exIdx, 1);
      saveActiveGymSession();
      renderTraning();
    });
  });
  content.querySelectorAll("[data-add-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exDef = exercisesForSplit(activeGymSession.splitId).find((e) => e.id === btn.dataset.addExercise);
      if (!exDef) return;
      const setCount = exDef.defaultSets || 3;
      const reps = exDef.defaultReps != null ? exDef.defaultReps : 12;
      activeGymSession.exercises.push({ exerciseId: exDef.id, name: exDef.name, sets: Array.from({ length: setCount }, () => ({ weight: null, reps })) });
      saveActiveGymSession();
      renderTraning();
    });
  });
  const addCustomBtn = document.getElementById("addCustomExerciseBtn");
  if (addCustomBtn) {
    addCustomBtn.addEventListener("click", () => {
      const input = document.getElementById("customExerciseInput");
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      activeGymSession.exercises.push({ exerciseId: null, name, sets: [{ weight: null, reps: 12 }, { weight: null, reps: 12 }, { weight: null, reps: 12 }] });
      saveActiveGymSession();
      renderTraning();
    });
    document.getElementById("customExerciseInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addCustomBtn.click(); }
    });
  }
  const finishBtn = document.getElementById("finishGymSessionBtn");
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      const minutesInput = document.getElementById("gymSessionMinutes");
      const minutes = parseInt(minutesInput.value, 10);
      if (isNaN(minutes) || minutes <= 0) { minutesInput.focus(); return; }
      const totalVolume = finishGymSession(minutes);
      renderTraning();
      if (totalVolume > 0) {
        showInfoToast(`💪 Du lyfte totalt ${Math.round(totalVolume).toLocaleString("sv-SE")} kg denna gång!`);
      }
    });
  }
}

function renderTraning() {
  if (gymSessionViewOpen && activeGymSession) {
    content.innerHTML = gymSessionViewHTML();
    wireGymSessionViewEvents();
    return;
  }
  const isHealthType = workoutFormState.type === "Sjuk" || workoutFormState.type === "Skadad";
  const streak = computeStreak();
  content.innerHTML = `
    ${activeGymSession ? `
    <div class="card" style="background:${tabColors.traning}1A;border-color:${tabColors.traning}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-weight:700;font-size:14px">⏸️ Pass pausat</div>
          <div style="font-size:12.5px;color:var(--muted)">${escapeHtml((gymSplits.find((g) => g.id === activeGymSession.splitId) || {}).text || "")}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:stretch;gap:6px">
          <button class="modal-btn primary" id="resumeGymSessionBtn" style="width:auto;padding:9px 16px">▶️ Fortsätt</button>
          <button id="cancelGymSessionBtn" style="background:none;border:none;padding:2px;cursor:pointer;font-size:11px;color:var(--muted2);text-decoration:underline">Avbryt passet</button>
        </div>
      </div>
    </div>
    ` : ""}
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="card-label" style="margin-bottom:0">${workoutFormState.editingId ? "Redigerar pass" : "Träningspass"}</div>
        <div style="display:flex;align-items:center;gap:12px">
          ${streak > 0 ? `<span class="streak-badge">🔥 ${streak} ${streak === 1 ? "dag" : "dagar"}</span>` : ""}
          <button id="manageTypesBtn" style="background:none;border:none;color:${tabColors.traning};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px">Hantera</button>
        </div>
      </div>
      <div class="row" style="flex-wrap:wrap;margin-bottom:12px">
        ${TRAINING_KEYS.map((k) => `
          <button class="chip" data-type="${k}" style="${workoutFormState.type === k
            ? `border-color:${TYPES[k].color};background:${TYPES[k].color}26;color:${TYPES[k].color}`
            : ""}">${TYPES[k].label}</button>
        `).join("")}
      </div>
      <div class="health-divider"></div>
      <div class="row" style="flex-wrap:wrap;margin-bottom:12px">
        ${HEALTH_KEYS.map((k) => `
          <button class="chip" data-type="${k}" style="${workoutFormState.type === k
            ? `border-color:${TYPES[k].color};background:${TYPES[k].color}26;color:${TYPES[k].color}`
            : ""}">${TYPES[k].label}</button>
        `).join("")}
      </div>
      ${workoutFormState.type === "Ovrigt" ? `
      <div class="row" style="margin-bottom:12px">
        <input type="text" placeholder="Vad har du tränat?" id="customLabelInput" value="${workoutFormState.customLabel || ""}" />
      </div>
      ` : ""}
      ${DISTANCE_TYPES.includes(workoutFormState.type) ? `
      <div class="row" style="margin-bottom:12px">
        <input type="number" inputmode="decimal" step="0.01" placeholder="Distans (km), t.ex. 5.2" id="workoutDistance" value="${workoutFormState.distance || ""}" />
      </div>
      ` : ""}
      <div class="row">
        <input type="date" id="workoutDate" value="${workoutFormState.date}" />
        ${!isHealthType ? `<input type="number" inputmode="numeric" placeholder="min" id="workoutMinutes" value="${workoutFormState.minutes}" style="max-width:80px" />` : ""}
        <button class="btn-primary" id="workoutSubmit" style="background:${tabColors.traning}">${ICONS.plus}</button>
      </div>
      <textarea id="workoutNote" placeholder="Kommentar" style="width:100%;margin-top:10px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit;resize:vertical;min-height:44px">${escapeHtml(workoutFormState.note || "")}</textarea>
      <div id="workoutFormError" class="status-msg err" style="display:none;margin-top:10px"></div>
    </div>

    ${advancedMenuEnabled && (workoutFormState.type === "BJJ" || workoutFormState.type === "SW") && advancedQuestions.some((q) => q.enabled) ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="evaluationSectionToggle">
        <div class="card-label" style="margin-bottom:0">Hur kändes passet?</div>
        <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${evaluationSectionExpanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
      </div>
      ${evaluationSectionExpanded ? advancedQuestions.filter((q) => q.enabled).map((q) => `
        <div style="margin-top:12px">
          <div style="font-size:13px;font-weight:700;margin-bottom:2px">${escapeHtml(q.title)}</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${escapeHtml(q.desc)}</div>
          <div class="row" style="flex-wrap:wrap;gap:6px">
            ${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => `
              <button class="chip" data-rating-q="${q.id}" data-rating-val="${n}" style="padding:6px 10px;${workoutFormState.ratings[q.id] === n ? `border-color:${tabColors.traning};background:${tabColors.traning}26;color:${tabColors.traning}` : ""}">${n}</button>
            `).join("")}
          </div>
        </div>
      `).join("") : ""}
    </div>
    ` : ""}

    ${submissionsMenuEnabled && (workoutFormState.type === "BJJ" || workoutFormState.type === "SW") && submissionTypes.some((s) => s.enabled) ? (() => {
      const enabledSubs = submissionTypes.filter((s) => s.enabled);
      const chipHTML = (s) => `<button class="chip" data-submission="${s.id}" style="${workoutFormState.submissions.includes(s.id) ? `border-color:${tabColors.traning};background:${tabColors.traning}26;color:${tabColors.traning}` : ""}">${escapeHtml(s.label)}</button>`;
      const groups = groupSubmissionsByCategory(enabledSubs);
      return `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="submissionsSectionToggle">
            <div class="card-label" style="margin-bottom:0;font-weight:700">Submissions</div>
            <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${submissionsSectionExpanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
          </div>
          ${submissionsSectionExpanded ? `
            <p style="margin-top:8px;font-size:13px;color:var(--muted)">Tryck på de du lyckades med under passet.</p>
            ${groups.map((g, gi) => `
              <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px">${g.label}</div>
              <div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:${gi < groups.length - 1 ? "14px" : "0"}">
                ${g.items.map(chipHTML).join("")}
              </div>
            `).join("")}
          ` : ""}
        </div>
      `;
    })() : ""}

    ${workoutFormState.type === "Gym" && gymSplits.some((g) => g.enabled) ? `
    <div class="card">
      <div class="card-label">Vilket pass?</div>
      ${(() => {
        const hint = nextGymSplitHint();
        return hint ? `<p style="font-size:12.5px;color:var(--muted);margin-top:-6px">Du körde <strong>${escapeHtml(hint.lastText)}</strong> sist — <strong style="color:${tabColors.traning}">${escapeHtml(hint.nextText)}</strong> på tur?</p>` : "";
      })()}
      <div class="row" style="flex-wrap:wrap;gap:8px">
        ${gymSplits.filter((g) => g.enabled).map((g) => `
          <button class="chip" data-gym-split="${g.id}" style="${workoutFormState.gymSplit === g.id ? `border-color:${tabColors.traning};background:${tabColors.traning}26;color:${tabColors.traning}` : ""}">${escapeHtml(g.text)}</button>
        `).join("")}
      </div>
      ${workoutFormState.gymSplit && !activeGymSession ? `
        <button class="modal-btn secondary" id="startGymSessionBtn" style="width:100%;margin-top:12px">▶️ Starta pass — logga varje övning</button>
      ` : ""}
    </div>
    ` : ""}

    ${gymMenuEnabled && workoutFormState.type === "Gym" && pbExercises.some((p) => p.enabled) ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="pbSectionToggle">
        <div class="card-label" style="margin-bottom:0">🏆 Personbästa!</div>
        <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${pbSectionExpanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
      </div>
      ${pbSectionExpanded ? `
        <p style="margin-top:8px;font-size:13px;color:var(--muted)">Tryck på en övning om du slog ett personbästa idag.</p>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:6px">
          ${pbExercises.filter((p) => p.enabled).map((p) => `
            <button class="chip" data-pb-exercise="${p.id}" style="${pbFormOpenExerciseId === p.id ? `border-color:${tabColors.traning};background:${tabColors.traning}26;color:${tabColors.traning}` : ""}">${escapeHtml(p.label)}</button>
          `).join("")}
        </div>
        ${pbFormOpenExerciseId ? (() => {
          const ex = pbExercises.find((p) => p.id === pbFormOpenExerciseId);
          const best = pbBestFor(pbFormOpenExerciseId);
          const isReps = ex.unit === "reps";
          return `
            <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
              <input type="date" id="pbDateInput" value="${workoutFormState.date || todayISO()}" style="flex-shrink:0" />
              <input type="number" inputmode="${isReps ? "numeric" : "decimal"}" step="${isReps ? "1" : "0.5"}" placeholder="${ex.label} — ${isReps ? "antal reps" : "nytt PB (kg)"}" id="pbValueInput" style="flex:1;min-width:0" />
              <button class="modal-btn primary" id="pbSaveBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Spara</button>
            </div>
            <div id="pbValueError" class="status-msg err" style="display:none;margin-top:6px"></div>
            ${best !== null ? `<p style="margin-top:4px">Nuvarande PB: <strong>${best} ${isReps ? "reps" : "kg"}</strong></p>` : ""}
          `;
        })() : ""}
      ` : ""}
    </div>
    ` : ""}

    ${konditionMenuEnabled && isCardio({ type: workoutFormState.type }) && konditionPbDistances.some((d) => d.enabled) ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="konditionPbSectionToggle">
        <div class="card-label" style="margin-bottom:0">🏆 Personbästa!</div>
        <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${konditionPbSectionExpanded ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
      </div>
      ${konditionPbSectionExpanded ? `
        <p style="margin-top:8px;font-size:13px;color:var(--muted)">Tryck på en distans om du sprang/cyklade den snabbare idag.</p>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:6px">
          ${konditionPbDistances.filter((d) => d.enabled).map((d) => `
            <button class="chip" data-kondition-pb="${d.id}" style="${konditionPbFormOpenId === d.id ? `border-color:${tabColors.traning};background:${tabColors.traning}26;color:${tabColors.traning}` : ""}">${escapeHtml(d.label)}</button>
          `).join("")}
        </div>
        ${konditionPbFormOpenId ? (() => {
          const dist = konditionPbDistances.find((d) => d.id === konditionPbFormOpenId);
          const best = konditionPbBestFor(konditionPbFormOpenId, workoutFormState.type);
          return `
            <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
              <input type="date" id="konditionPbDateInput" value="${workoutFormState.date || todayISO()}" style="flex-shrink:0" />
              <input type="number" inputmode="decimal" step="0.1" placeholder="${dist.label} — tid (min)" id="konditionPbValueInput" style="flex:1;min-width:0" />
              <button class="modal-btn primary" id="konditionPbSaveBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Spara</button>
            </div>
            <div id="konditionPbValueError" class="status-msg err" style="display:none;margin-top:6px"></div>
            ${best !== null ? `<p style="margin-top:4px">Nuvarande PB (${escapeHtml(typeMeta(workoutFormState.type).label)}): <strong>${fmtMinSec(best)}</strong></p>` : ""}
          `;
        })() : ""}
      ` : ""}
    </div>
    ` : ""}

    <div id="senastePassenCardWrap">${senastePassenCardHTML()}</div>

    <div id="personalRecordsCardWrap">${personalRecordsCardHTML()}</div>

    <div class="disclaimer">Copyright 2026 Mattias Öman</div>
  `;

  document.getElementById("manageTypesBtn").addEventListener("click", () => {
    typesModalReturnsToSettings = false;
    openManageTypesModal();
  });
  wireSenastePassenCardEvents();
  wirePersonalRecordsCardEvents();
  loadPbRanks();

  content.querySelectorAll("[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      workoutFormState.type = btn.dataset.type;
      workoutFormState.minutes = DEFAULT_MINUTES[btn.dataset.type];
      workoutFormState.customLabel = "";
      workoutFormState.distance = "";
      workoutFormState.ratings = {};
      workoutFormState.gymSplit = null;
      workoutFormState.submissions = [];
      lastFocusedId = null;
      renderTraning();
    });
  });

  document.getElementById("workoutDate").addEventListener("change", (e) => {
    workoutFormState.date = e.target.value;
  });
  const minutesInput = document.getElementById("workoutMinutes");
  if (minutesInput) {
    minutesInput.addEventListener("input", (e) => {
      workoutFormState.minutes = e.target.value;
    });
  }
  document.getElementById("workoutNote").addEventListener("input", (e) => {
    workoutFormState.note = e.target.value;
  });
  const customLabelInput = document.getElementById("customLabelInput");
  if (customLabelInput) {
    customLabelInput.addEventListener("input", (e) => {
      workoutFormState.customLabel = e.target.value;
    });
  }
  const distanceInput = document.getElementById("workoutDistance");
  if (distanceInput) {
    distanceInput.addEventListener("input", (e) => {
      workoutFormState.distance = e.target.value;
    });
  }
  content.querySelectorAll("[data-rating-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.ratingQ;
      const val = parseInt(btn.dataset.ratingVal, 10);
      workoutFormState.ratings[q] = workoutFormState.ratings[q] === val ? undefined : val;
      lastFocusedId = null;
      renderTraning();
    });
  });
  content.querySelectorAll("[data-gym-split]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.gymSplit;
      workoutFormState.gymSplit = workoutFormState.gymSplit === id ? null : id;
      lastFocusedId = null;
      renderTraning();
    });
  });
  const startGymSessionBtn = document.getElementById("startGymSessionBtn");
  if (startGymSessionBtn) {
    startGymSessionBtn.addEventListener("click", () => {
      startGymSession(workoutFormState.gymSplit);
      renderTraning();
    });
  }
  const resumeGymSessionBtn = document.getElementById("resumeGymSessionBtn");
  if (resumeGymSessionBtn) {
    resumeGymSessionBtn.addEventListener("click", () => {
      gymSessionViewOpen = true;
      renderTraning();
    });
  }
  const cancelGymSessionBtn = document.getElementById("cancelGymSessionBtn");
  if (cancelGymSessionBtn) {
    cancelGymSessionBtn.addEventListener("click", () => { openCancelGymSessionModal(); });
  }
  const pbToggle = document.getElementById("pbSectionToggle");
  if (pbToggle) {
    pbToggle.addEventListener("click", () => {
      pbSectionExpanded = !pbSectionExpanded;
      renderTraning();
    });
  }
  const evaluationToggle = document.getElementById("evaluationSectionToggle");
  if (evaluationToggle) {
    evaluationToggle.addEventListener("click", () => {
      evaluationSectionExpanded = !evaluationSectionExpanded;
      renderTraning();
    });
  }
  const submissionsToggleBtn = document.getElementById("submissionsSectionToggle");
  if (submissionsToggleBtn) {
    submissionsToggleBtn.addEventListener("click", () => {
      submissionsSectionExpanded = !submissionsSectionExpanded;
      renderTraning();
    });
  }
  content.querySelectorAll("[data-pb-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.pbExercise;
      pbFormOpenExerciseId = pbFormOpenExerciseId === id ? null : id;
      renderTraning();
    });
  });
  const pbSaveBtn = document.getElementById("pbSaveBtn");
  if (pbSaveBtn) {
    pbSaveBtn.addEventListener("click", () => {
      const input = document.getElementById("pbValueInput");
      const dateInput = document.getElementById("pbDateInput");
      const errorEl = document.getElementById("pbValueError");
      const num = parseFloat(String(input.value).replace(",", "."));
      if (isNaN(num) || num <= 0) { input.focus(); return; }
      const cap = PB_EXERCISE_CAPS[pbFormOpenExerciseId];
      if (cap && num > cap) {
        const exDef = pbExercises.find((p) => p.id === pbFormOpenExerciseId);
        const isReps = exDef && exDef.unit === "reps";
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.textContent = isReps
            ? `Klarar du verkligen fler än ${cap} reps? 😮 Skicka gärna bevis (bild/video) till ${PB_CAP_CONTACT_EMAIL} så lägger jag in det manuellt!`
            : `Är du så stark? 😮 Skicka gärna bevis (bild/video) till ${PB_CAP_CONTACT_EMAIL} så lägger jag in det manuellt!`;
        }
        input.focus();
        return;
      }
      if (errorEl) errorEl.style.display = "none";
      pbLog.push({ id: uid(), date: (dateInput && dateInput.value) || workoutFormState.date || todayISO(), exerciseId: pbFormOpenExerciseId, value: num });
      persistPbLog();
      pbRankCache = {};
      vibrate();
      pbFormOpenExerciseId = null;
      renderTraning();
      renderPersonalRecordsCard();
    });
    wireEnterSubmit(["pbValueInput"], pbSaveBtn);
  }
  const konditionPbToggle = document.getElementById("konditionPbSectionToggle");
  if (konditionPbToggle) {
    konditionPbToggle.addEventListener("click", () => {
      konditionPbSectionExpanded = !konditionPbSectionExpanded;
      renderTraning();
    });
  }
  content.querySelectorAll("[data-kondition-pb]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.konditionPb;
      konditionPbFormOpenId = konditionPbFormOpenId === id ? null : id;
      renderTraning();
    });
  });
  const konditionPbSaveBtn = document.getElementById("konditionPbSaveBtn");
  if (konditionPbSaveBtn) {
    konditionPbSaveBtn.addEventListener("click", () => {
      const input = document.getElementById("konditionPbValueInput");
      const dateInput = document.getElementById("konditionPbDateInput");
      const errorEl = document.getElementById("konditionPbValueError");
      const num = parseFloat(String(input.value).replace(",", "."));
      if (isNaN(num) || num <= 0) { input.focus(); return; }
      const floor = (KONDITION_PB_MIN_MINUTES[konditionPbFormOpenId] || {})[workoutFormState.type];
      if (floor && num < floor) {
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.textContent = `Är du så snabb? 😮 Skicka gärna bevis (t.ex. länk till aktivitet) till ${PB_CAP_CONTACT_EMAIL} så lägger jag in det manuellt!`;
        }
        input.focus();
        return;
      }
      if (errorEl) errorEl.style.display = "none";
      konditionPbLog.push({ id: uid(), date: (dateInput && dateInput.value) || workoutFormState.date || todayISO(), distanceId: konditionPbFormOpenId, type: workoutFormState.type, minutes: num });
      persistKonditionPbLog();
      pbRankCache = {};
      vibrate();
      konditionPbFormOpenId = null;
      renderTraning();
      renderPersonalRecordsCard();
    });
    wireEnterSubmit(["konditionPbValueInput"], konditionPbSaveBtn);
  }
  content.querySelectorAll("[data-submission]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.submission;
      if (workoutFormState.submissions.includes(id)) {
        workoutFormState.submissions = workoutFormState.submissions.filter((s) => s !== id);
      } else {
        workoutFormState.submissions.push(id);
      }
      lastFocusedId = null;
      renderTraning();
    });
  });

  function showWorkoutFormError(msg) {
    const el = document.getElementById("workoutFormError");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  document.getElementById("workoutSubmit").addEventListener("click", () => {
    if (!requireAuth("Du behöver ett konto för att logga träningspass.")) return;
    const date = workoutFormState.date;
    const minutesInputEl = document.getElementById("workoutMinutes");
    const num = isHealthType ? 0 : parseInt(minutesInputEl ? minutesInputEl.value : "", 10);
    if (!date) {
      showWorkoutFormError("Välj ett datum.");
      return;
    }
    if (!isHealthType && (isNaN(num) || num <= 0)) {
      showWorkoutFormError("Ange antal minuter för passet.");
      if (minutesInputEl) minutesInputEl.focus();
      return;
    }
    const trimmedLabel = (workoutFormState.customLabel || "").trim();
    if (workoutFormState.type === "Ovrigt" && !trimmedLabel) {
      showWorkoutFormError("Skriv vad du tränat i fältet ovan.");
      const input = document.getElementById("customLabelInput");
      if (input) input.focus();
      return;
    }
    let trimmedNote = (workoutFormState.note || "").trim();
    const distanceVal = parseFloat(String(workoutFormState.distance || "").replace(",", "."));
    if (DISTANCE_TYPES.includes(workoutFormState.type) && !isNaN(distanceVal) && distanceVal > 0 && num > 0) {
      const kmh = distanceVal / (num / 60);
      const paceMinPerKm = num / distanceVal;
      const paceMin = Math.floor(paceMinPerKm);
      const paceSec = Math.round((paceMinPerKm - paceMin) * 60);
      const paceStr = `${paceMin}:${String(paceSec).padStart(2, "0")}`;
      const speedNote = `${distanceVal} km · Snitt ${kmh.toFixed(1)} km/h (${paceStr} min/km)`;
      trimmedNote = trimmedNote ? `${trimmedNote} — ${speedNote}` : speedNote;
    }
    if (advancedMenuEnabled && (workoutFormState.type === "BJJ" || workoutFormState.type === "SW")) {
      const ratingParts = advancedQuestions
        .filter((q) => q.enabled && workoutFormState.ratings[q.id])
        .map((q) => `${q.title}: ${workoutFormState.ratings[q.id]}/10`);
      if (ratingParts.length) {
        const ratingNote = ratingParts.join(" · ");
        trimmedNote = trimmedNote ? `${trimmedNote} — ${ratingNote}` : ratingNote;
      }
    }
    const gymSplitTracked = workoutFormState.type === "Gym" && workoutFormState.gymSplit;
    if (gymSplitTracked) {
      const split = gymSplits.find((g) => g.id === workoutFormState.gymSplit);
      if (split) {
        trimmedNote = trimmedNote ? `${trimmedNote} — ${split.text}` : split.text;
      }
    }
    const submissionsTracked = submissionsMenuEnabled && (workoutFormState.type === "BJJ" || workoutFormState.type === "SW");
    const submissionLabels = submissionsTracked
      ? workoutFormState.submissions.map((id) => submissionTypes.find((s) => s.id === id)).filter(Boolean).map((s) => s.label)
      : [];
    if (submissionLabels.length) {
      trimmedNote = trimmedNote ? `${trimmedNote} — Submissions: ${submissionLabels.join(", ")}` : `Submissions: ${submissionLabels.join(", ")}`;
    }
    const ratingsTracked = advancedMenuEnabled && (workoutFormState.type === "BJJ" || workoutFormState.type === "SW") &&
      Object.keys(workoutFormState.ratings).some((q) => workoutFormState.ratings[q]);
    if (workoutFormState.editingId) {
      const existing = workoutEntries.find((e) => e.id === workoutFormState.editingId);
      if (existing) {
        existing.date = date;
        existing.type = workoutFormState.type;
        existing.minutes = num;
        if (workoutFormState.type === "Ovrigt") existing.customLabel = trimmedLabel; else delete existing.customLabel;
        if (trimmedNote) existing.note = trimmedNote; else delete existing.note;
        if (submissionsTracked) existing.submissions = [...workoutFormState.submissions]; else delete existing.submissions;
        if (gymSplitTracked) existing.gymSplit = workoutFormState.gymSplit; else delete existing.gymSplit;
        if (ratingsTracked) existing.ratings = { ...workoutFormState.ratings }; else delete existing.ratings;
        markWeeklyMiscFlag("workoutEditedWeek");
      }
    } else {
      const entry = { id: uid(), date, type: workoutFormState.type, minutes: num };
      if (workoutFormState.type === "Ovrigt") entry.customLabel = trimmedLabel;
      if (trimmedNote) entry.note = trimmedNote;
      if (submissionsTracked) entry.submissions = [...workoutFormState.submissions];
      if (gymSplitTracked) entry.gymSplit = workoutFormState.gymSplit;
      if (ratingsTracked) entry.ratings = { ...workoutFormState.ratings };
      workoutEntries.unshift(entry);
      if (submissionsTracked && entry.submissions && entry.submissions.length) {
        checkBingoSquaresForSubmissionIds(entry.submissions);
      }
      const autoKcal = parseInt(DEFAULT_KCAL_BURNED[entry.type], 10);
      if (!isNaN(autoKcal) && autoKcal > 0) {
        calorieLog.push({ id: uid(), date: entry.date, kcal: autoKcal, type: "burned", autoFromWorkoutId: entry.id });
        persistCalorieLog();
      }
      awardLogXpForDate("training", entry.date);
    }
    workoutEntries.sort((a, b) => b.date.localeCompare(a.date));
    persistWorkouts();
    vibrate();
    checkAchievements();
    checkWeeklyChallenges();
    workoutFormState.minutes = DEFAULT_MINUTES[workoutFormState.type];
    workoutFormState.customLabel = "";
    workoutFormState.note = "";
    workoutFormState.distance = "";
    workoutFormState.ratings = {};
    workoutFormState.gymSplit = null;
    workoutFormState.submissions = [];
    workoutFormState.editingId = null;
    renderTraning();
  });

  restoreFocus();
}

/* ---------------- STATS TAB ---------------- */

let compareGranularity = "week";

function computePeriodStats(granularity) {
  const isHealth = (e) => e.type === "Sjuk" || e.type === "Skadad";
  if (granularity === "week") {
    const currentKey = getISOWeek(todayISO());
    const previousKey = getISOWeek(addDays(todayISO(), -7));
    const currentE = workoutEntries.filter((e) => getISOWeek(e.date) === currentKey && !isHealth(e));
    const previousE = workoutEntries.filter((e) => getISOWeek(e.date) === previousKey && !isHealth(e));
    return { currentE, previousE, currentLabel: "Denna vecka", previousLabel: "Förra veckan" };
  }
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const currentE = workoutEntries.filter((e) => e.date.slice(0, 7) === currentKey && !isHealth(e));
  const previousE = workoutEntries.filter((e) => e.date.slice(0, 7) === previousKey && !isHealth(e));
  return { currentE, previousE, currentLabel: "Denna månad", previousLabel: "Förra månaden" };
}

function renderStats() {
  checkAchievements();
  const currentMondayForVisit = mondayOf(todayISO());
  if (weeklyMisc.statsVisitedWeek !== currentMondayForVisit) {
    weeklyMisc.statsVisitedWeek = currentMondayForVisit;
    saveWeeklyMisc();
  }
  checkWeeklyChallenges();
  checkMonthRecapAutoShow();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = getISOWeek(todayISO());
  const currentMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const isHealth = (e) => e.type === "Sjuk" || e.type === "Skadad";
  const weekE = workoutEntries.filter((e) => getISOWeek(e.date) === currentWeek && !isHealth(e));
  const monthE = workoutEntries.filter((e) => e.date.slice(0, 7) === currentMonthKey && !isHealth(e));
  const yearE = workoutEntries.filter((e) => e.date.slice(0, 4) === String(currentYear));
  const yearTrainingE = yearE.filter((e) => !isHealth(e));
  const sum = (arr) => arr.reduce((s, e) => s + e.minutes, 0);

  content.innerHTML = `
    <div id="levelHeroCardWrap">${levelHeroCardHTML()}</div>

    <div id="weeklyChallengeCardWrap">${weeklyChallengeCardHTML()}</div>

    ${submissionBingoEnabled ? `<div id="bingoCardWrap">${bingoCardHTML()}</div>` : ""}

    <div class="stat-row">
      ${statCardHtml("Vecka", weekE.length, sum(weekE))}
      ${statCardHtml("Månad", monthE.length, sum(monthE))}
      ${statCardHtml("År", yearTrainingE.length, sum(yearTrainingE))}
    </div>

    <div id="compareCardWrap">${compareCardHTML()}</div>

    <div id="monthlyBarChartCardWrap">${monthlyBarChartCardHTML()}</div>

    <div id="weightStatsCardWrap">${weightStatsCardHTML(currentYear)}</div>

    <div id="calorieDayCardWrap">${calorieDayCardHTML()}</div>

    <div id="distributionCardWrap">${distributionCardHTML()}</div>

    <div id="submissionStatsCardWrap">${submissionStatsCardHTML()}</div>


    <div id="achievementsCardWrap">${achievementsCardHTML()}</div>

    <button class="modal-btn secondary" id="yearReviewBtn" style="width:auto;padding:12px 20px;margin:0 auto">🎉 Visa årskrönika</button>

    <div class="disclaimer">Copyright 2026 Mattias Öman</div>
  `;

  wireCompareCardEvents();
  document.getElementById("yearReviewBtn").addEventListener("click", openYearReviewModal);
  wireLevelHeroCardEvents();
  wireWeightStatsCardEvents();
  createWeightStatsChart();
  wireAchievementsCardEvents();
  wireDistributionCardEvents();
  wireSubmissionStatsCardEvents();
  wireWeeklyChallengeCardEvents();
  if (submissionBingoEnabled) wireBingoCardEvents();
  wireMonthlyBarChartCardEvents();

  wireCalorieDayCardEvents();
  createCalorieDayChart();
}

/* ---------------- Jämför perioder card (independently refreshable) ---------------- */

function compareCardHTML() {
  const sum = (arr) => arr.reduce((s, e) => s + e.minutes, 0);
  const cmp = computePeriodStats(compareGranularity);
  const cmpCountDelta = cmp.currentE.length - cmp.previousE.length;
  const cmpMinutesDelta = sum(cmp.currentE) - sum(cmp.previousE);
  const categories = [
    { key: "kampsport", label: "🥋 Kampsport", filter: isMartialArts },
    { key: "kondition", label: "🏃 Kondition", filter: isCardio },
    { key: "styrka", label: "🏋️ Styrka", filter: isGymType },
  ];
  const catRows = categories.map((cat) => {
    const curCount = cmp.currentE.filter(cat.filter).length;
    const prevCount = cmp.previousE.filter(cat.filter).length;
    const delta = curCount - prevCount;
    return { ...cat, curCount, prevCount, delta };
  });
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showCompareCardToggle", "Jämför perioder", showCompareCard, showCompareCard ? "10px" : null)}
      ${showCompareCard ? `
        <div class="theme-row" style="margin-bottom:10px">
          <button class="theme-btn" data-granularity="week" style="${compareGranularity === "week" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Vecka</button>
          <button class="theme-btn" data-granularity="month" style="${compareGranularity === "month" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Månad</button>
        </div>
        <div style="display:flex;align-items:center">
          <div class="compare-col">
            <div class="label">${cmp.previousLabel}</div>
            <div class="val">${cmp.previousE.length} pass</div>
            <div class="label">${fmtMinutes(sum(cmp.previousE))}</div>
          </div>
          <div class="compare-col">
            <div class="label">${cmp.currentLabel}</div>
            <div class="val">${cmp.currentE.length} pass</div>
            <div class="label">${fmtMinutes(sum(cmp.currentE))}</div>
            <div class="compare-delta" style="color:${cmpCountDelta >= 0 ? "#4CAF7D" : "#E8834A"}">${cmpCountDelta >= 0 ? "+" : ""}${cmpCountDelta} pass, ${cmpMinutesDelta >= 0 ? "+" : ""}${cmpMinutesDelta} min</div>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
          ${catRows.map((row) => `
            <div style="display:flex;align-items:center;gap:8px;font-size:12.5px">
              <span style="flex:1">${row.label}</span>
              <span style="color:var(--muted)">${row.prevCount} → ${row.curCount}</span>
              <span style="font-weight:700;min-width:44px;text-align:right;color:${row.delta > 0 ? "#4CAF7D" : row.delta < 0 ? "#E8834A" : "var(--muted)"}">${row.delta > 0 ? "+" : ""}${row.delta}</span>
            </div>
          `).join("")}
        </div>
        <button class="modal-btn secondary" id="openMonthRecapBtn" style="width:auto;padding:8px 14px;margin:12px auto 0;display:block;font-size:12.5px">📅 Sammanfattning för ${monthKeyLabelFull(lastCompletedMonthKey())}</button>
      ` : ""}
    </div>
  `;
}

function wireCompareCardEvents() {
  const monthRecapBtn = document.getElementById("openMonthRecapBtn");
  if (monthRecapBtn) {
    monthRecapBtn.addEventListener("click", () => openMonthRecapModal(lastCompletedMonthKey()));
  }
  const toggle = document.getElementById("showCompareCardToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showCompareCard = !showCompareCard;
      saveShowCompareCard();
      renderCompareCard();
    });
  }
  document.querySelectorAll("[data-granularity]").forEach((btn) => {
    btn.addEventListener("click", () => {
      compareGranularity = btn.dataset.granularity;
      renderCompareCard();
    });
  });
}

function renderCompareCard() {
  const wrap = document.getElementById("compareCardWrap");
  if (!wrap) return;
  wrap.innerHTML = compareCardHTML();
  wireCompareCardEvents();
}

/* ---------------- Kalorier per dag card (independently refreshable) ---------------- */

function calorieDayCardHTML() {
  const { goalTarget: calorieGoalTarget } = computeCalorieGoal();
  let calorieDayLabels, calorieDayDates, calorieNavLabel, calorieNavInputType, calorieNavInputValue;
  if (calorieStatsMode === "week") {
    const start = mondayOf(calorieStatsAnchor);
    calorieDayDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    calorieDayLabels = calorieDayDates.map((d) => fmtDateShort(d));
    calorieNavLabel = `Vecka ${getISOWeek(start).split("-W")[1]}, ${start.slice(0, 4)}`;
    calorieNavInputType = "week";
    calorieNavInputValue = getISOWeek(start);
  } else {
    const [yy, mm] = calorieStatsAnchor.slice(0, 7).split("-").map(Number);
    const daysInMonth = new Date(yy, mm, 0).getDate();
    calorieDayDates = Array.from({ length: daysInMonth }, (_, i) => `${yy}-${String(mm).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
    calorieDayLabels = calorieDayDates.map((_, i) => String(i + 1));
    calorieNavLabel = `${MONTHS_SV[mm - 1]} ${yy}`;
    calorieNavInputType = "month";
    calorieNavInputValue = calorieStatsAnchor.slice(0, 7);
  }
  const calorieDayData = calorieDayDates.map((d) => {
    const entries = calorieLog.filter((e) => e.date === d);
    const eaten = entries.filter((e) => e.type !== "burned").reduce((s, e) => s + e.kcal, 0);
    const burned = entries.filter((e) => e.type === "burned").reduce((s, e) => s + e.kcal, 0);
    const net = eaten - burned;
    const hasData = entries.length > 0;
    const over = calorieGoalTarget !== null && hasData && net > calorieGoalTarget;
    return { date: d, net, hasData, over };
  });
  const hasCalorieData = calorieDayData.some((r) => r.hasData);

  return `
    <div class="card">
      ${cardChevronHeaderHTML("showCalorieStatsToggle", "Kalorier per dag", showCalorieStats, showCalorieStats ? "10px" : null)}
      ${showCalorieStats ? `
        <div class="theme-row" style="margin-bottom:10px">
          <button class="theme-btn" data-cal-mode="week" style="${calorieStatsMode === "week" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Vecka</button>
          <button class="theme-btn" data-cal-mode="month" style="${calorieStatsMode === "month" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Månad</button>
        </div>
        <div class="row" style="align-items:center;margin-bottom:10px">
          <button class="btn-primary" id="calorieNavPrev" style="background:var(--border2);color:var(--text);width:40px;flex-shrink:0">${ICONS.chevronLeft}</button>
          <input type="${calorieNavInputType}" id="calorieNavPicker" value="${calorieNavInputValue}" style="text-align:center" />
          <button class="btn-primary" id="calorieNavNext" style="background:var(--border2);color:var(--text);width:40px;flex-shrink:0">${ICONS.chevronRight}</button>
        </div>
        ${hasCalorieData
          ? `<div class="chart-wrap"><canvas id="statsCalorieChart"></canvas></div>
             <div class="legend">
               <div class="legend-item"><span class="dot" style="background:#E15554"></span>Över kalorimålet</div>
               <div class="legend-item"><span class="dot" style="background:#4CAF7D"></span>Under kalorimålet</div>
             </div>`
          : `<div class="empty">Inga kalorier loggade för ${calorieNavLabel.toLowerCase()}</div>`
        }
      ` : ""}
    </div>
  `;
}

function createCalorieDayChart() {
  const canvas = document.getElementById("statsCalorieChart");
  if (!canvas) return;
  const { goalTarget: calorieGoalTarget } = computeCalorieGoal();
  let calorieDayLabels, calorieDayDates;
  if (calorieStatsMode === "week") {
    const start = mondayOf(calorieStatsAnchor);
    calorieDayDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    calorieDayLabels = calorieDayDates.map((d) => fmtDateShort(d));
  } else {
    const [yy, mm] = calorieStatsAnchor.slice(0, 7).split("-").map(Number);
    const daysInMonth = new Date(yy, mm, 0).getDate();
    calorieDayDates = Array.from({ length: daysInMonth }, (_, i) => `${yy}-${String(mm).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
    calorieDayLabels = calorieDayDates.map((_, i) => String(i + 1));
  }
  const calorieDayData = calorieDayDates.map((d) => {
    const entries = calorieLog.filter((e) => e.date === d);
    const eaten = entries.filter((e) => e.type !== "burned").reduce((s, e) => s + e.kcal, 0);
    const burned = entries.filter((e) => e.type === "burned").reduce((s, e) => s + e.kcal, 0);
    const net = eaten - burned;
    const hasData = entries.length > 0;
    const over = calorieGoalTarget !== null && hasData && net > calorieGoalTarget;
    return { hasData, net, over };
  });

  if (statsCalorieChartInstance) statsCalorieChartInstance.destroy();
  statsCalorieChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: calorieDayLabels,
      datasets: [{
        data: calorieDayData.map((r) => (r.hasData ? r.net : 0)),
        backgroundColor: calorieDayData.map((r) => (!r.hasData ? cssVar("--border2") : r.over ? "#E15554" : "#4CAF7D")),
        borderRadius: 3,
      }],
    },
    options: {
      ...chartBaseOptions(),
      plugins: {
        ...chartBaseOptions().plugins,
        legend: { display: false },
        tooltip: {
          ...chartBaseOptions().plugins.tooltip,
          callbacks: { title: () => "", label: (ctx) => `${ctx.parsed.y} kcal` },
        },
      },
    },
  });
}

function wireCalorieDayCardEvents() {
  const calorieToggle = document.getElementById("showCalorieStatsToggle");
  if (calorieToggle) {
    calorieToggle.addEventListener("click", () => {
      showCalorieStats = !showCalorieStats;
      saveShowCalorieStats();
      renderCalorieDayCard();
    });
  }
  document.querySelectorAll("[data-cal-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      calorieStatsMode = btn.dataset.calMode;
      renderCalorieDayCard();
    });
  });
  const navPrev = document.getElementById("calorieNavPrev");
  const navNext = document.getElementById("calorieNavNext");
  const navPicker = document.getElementById("calorieNavPicker");
  if (navPrev) {
    navPrev.addEventListener("click", () => {
      calorieStatsAnchor = calorieStatsMode === "week" ? addDays(calorieStatsAnchor, -7) : shiftMonth(calorieStatsAnchor, -1);
      renderCalorieDayCard();
    });
  }
  if (navNext) {
    navNext.addEventListener("click", () => {
      calorieStatsAnchor = calorieStatsMode === "week" ? addDays(calorieStatsAnchor, 7) : shiftMonth(calorieStatsAnchor, 1);
      renderCalorieDayCard();
    });
  }
  if (navPicker) {
    navPicker.addEventListener("change", (e) => {
      const val = e.target.value;
      if (!val) return;
      if (calorieStatsMode === "week") {
        const m = val.match(/(\d{4})-W(\d{2})/);
        if (m) {
          const jan4 = new Date(Date.UTC(+m[1], 0, 4));
          const dow = (jan4.getUTCDay() + 6) % 7;
          jan4.setUTCDate(jan4.getUTCDate() - dow + (+m[2] - 1) * 7);
          calorieStatsAnchor = jan4.toISOString().slice(0, 10);
        }
      } else {
        calorieStatsAnchor = `${val}-01`;
      }
      renderCalorieDayCard();
    });
  }
}

function calorieHistoryListCardHTML() {
  const { goalTarget } = computeCalorieGoal();
  const cutoff = periodCutoffISO(calorieHistoryPeriod);
  const dates = [...new Set(calorieLog.filter((e) => !cutoff || e.date >= cutoff).map((e) => e.date))].sort((a, b) => b.localeCompare(a));
  const rows = dates.map((date) => {
    const dayEntries = calorieLog.filter((e) => e.date === date);
    const eaten = dayEntries.filter((e) => e.type !== "burned").reduce((s, e) => s + e.kcal, 0);
    const burned = dayEntries.filter((e) => e.type === "burned").reduce((s, e) => s + e.kcal, 0);
    const remaining = goalTarget !== null ? goalTarget - eaten + burned : null;
    return { date, eaten, burned, remaining };
  });
  const gridTemplate = "grid-template-columns: 1fr 60px 90px 60px 32px; gap:6px;";
  const remainingColor = (r) => r === null ? "var(--muted)" : r < 0 ? "#E15554" : "#4CAF7D";
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showCalorieHistoryListToggle", "Historik", showCalorieHistoryList, showCalorieHistoryList ? "10px" : null)}
      ${showCalorieHistoryList ? `
        <div class="filter-row">
          <select class="filter-select" id="calorieHistoryPeriodSelect" style="flex:1">
            ${periodSelectOptionsHTML(calorieHistoryPeriod)}
          </select>
        </div>
        ${rows.length === 0 ? `<div class="empty">Inga kalorier loggade${cutoff ? " i vald period" : " än"}</div>` : `
        <div style="display:grid;${gridTemplate}padding:0 4px 6px;font-size:11px;font-weight:700;color:var(--muted2)">
          <span></span>
          <span style="color:#E8834A">Ätit</span>
          <span style="color:#4A90D9">Förbrukade</span>
          <span>Kvar</span>
          <span></span>
        </div>
        <div class="history-scroll" style="max-height:420px">
          ${rows.map((row) => `
            <div style="display:grid;${gridTemplate}align-items:center;padding:10px 4px;border-bottom:1px solid var(--border)">
              <span style="font-size:13px;color:var(--muted)">${fmtDateWithWeekday(row.date)}</span>
              <span style="font-size:13px;font-weight:600;color:#E8834A">${row.eaten}</span>
              <span style="font-size:13px;font-weight:600;color:#4A90D9">${row.burned}</span>
              <span style="font-size:13px;font-weight:700;color:${remainingColor(row.remaining)}">${row.remaining !== null ? row.remaining : "–"}</span>
              <button class="delete-btn" data-del-calorie-day="${row.date}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
      `}` : ""}
    </div>
  `;
}
function renderCalorieHistoryListCard() {
  const wrap = document.getElementById("calorieHistoryListCardWrap");
  if (!wrap) return;
  wrap.innerHTML = calorieHistoryListCardHTML();
  wireCalorieHistoryListCardEvents();
}
function wireCalorieHistoryListCardEvents() {
  const toggle = document.getElementById("showCalorieHistoryListToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showCalorieHistoryList = !showCalorieHistoryList;
      saveShowCalorieHistoryList();
      renderCalorieHistoryListCard();
    });
  }
  const periodSelect = document.getElementById("calorieHistoryPeriodSelect");
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      calorieHistoryPeriod = e.target.value;
      renderCalorieHistoryListCard();
    });
  }
  content.querySelectorAll("[data-del-calorie-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const day = btn.dataset.delCalorieDay;
      const removed = calorieLog.filter((e) => e.date === day);
      calorieLog = calorieLog.filter((e) => e.date !== day);
      persistCalorieLog();
      vibrate(10);
      renderCalorieHistoryListCard();
      if (activeTab === "kalorier") renderKalorier();
      if (removed.length) {
        showUndoToast(`Kalorier för ${fmtDateWithWeekday(day)} borttaget`, () => {
          calorieLog.push(...removed);
          persistCalorieLog();
          if (activeTab === "kalorier") renderKalorier();
          renderCalorieHistoryListCard();
        });
      }
    });
  });
}

function distributionCardHTML() {
  const currentYear = new Date().getFullYear();
  const yearE = workoutEntries.filter((e) => e.date.slice(0, 4) === String(currentYear));
  const yearByType = TYPE_KEYS.map((t) => {
    const arr = yearE.filter((e) => e.type === t);
    return { type: t, count: arr.length, minutes: arr.reduce((s, e) => s + e.minutes, 0) };
  });
  const maxCount = Math.max(1, ...yearByType.map((r) => r.count));
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showDistributionStatsToggle", "Fördelning i år", showDistributionStats, showDistributionStats ? "10px" : null)}
      ${showDistributionStats ? yearByType.map((row) => `
        <div class="bar-row">
          <div class="bar-row-head">
            <span style="font-weight:600;color:${TYPES[row.type].color}">${TYPES[row.type].label}</span>
            <span style="color:var(--muted)">${row.count} pass · ${fmtMinutes(row.minutes)}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${(row.count / maxCount) * 100}%;background:${TYPES[row.type].color}"></div></div>
        </div>
      `).join("") : ""}
    </div>
  `;
}
function renderDistributionCard() {
  const wrap = document.getElementById("distributionCardWrap");
  if (!wrap) return;
  wrap.innerHTML = distributionCardHTML();
  wireDistributionCardEvents();
}
function wireDistributionCardEvents() {
  const toggle = document.getElementById("showDistributionStatsToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showDistributionStats = !showDistributionStats;
      saveShowDistributionStats();
      renderDistributionCard();
    });
  }
}

function submissionStatsCardHTML() {
  const trackedMartialEntries = workoutEntries.filter((e) => (e.type === "BJJ" || e.type === "SW") && Array.isArray(e.submissions));
  const totalMartialSessions = trackedMartialEntries.length;
  const counts = {};
  submissionTypes.forEach((s) => { counts[s.id] = 0; });
  trackedMartialEntries.forEach((e) => { e.submissions.forEach((id) => { counts[id] = (counts[id] || 0) + 1; }); });
  const toRow = (s) => ({ label: s.label, count: counts[s.id] || 0, pct: totalMartialSessions ? Math.round(((counts[s.id] || 0) / totalMartialSessions) * 100) : 0 });
  const groups = SUBMISSION_CATEGORY_ORDER
    .map((cat) => ({
      label: cat ? SUBMISSION_CATEGORY_LABELS[cat] : "Övriga",
      rows: submissionTypes.filter((s) => (s.category || null) === cat).map(toRow).sort((a, b) => a.pct - b.pct),
    }))
    .filter((g) => g.rows.length);
  const rowHTML = (row) => `
    <div class="bar-row">
      <div class="bar-row-head">
        <span style="font-size:11.5px;font-weight:500;color:var(--muted)">${escapeHtml(row.label)}</span>
        <span style="font-size:11.5px;color:var(--muted)">${row.pct}% (${row.count}/${totalMartialSessions})</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${row.pct}%;background:${tabColors.traning}"></div></div>
    </div>
  `;
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;${showSubmissionStats ? "margin-bottom:10px;" : ""}" id="showSubmissionStatsToggle">
        <span class="card-label" style="margin-bottom:0;font-weight:700">Submissions</span>
        <span class="icon-14" style="color:var(--muted2);display:flex;transform:rotate(${showSubmissionStats ? "90" : "0"}deg);transition:transform .15s">${ICONS.chevronRight}</span>
      </div>
      ${showSubmissionStats ? `
        <p style="margin-top:-4px;margin-bottom:10px;font-size:11.5px;color:var(--muted)">Andel av dina loggade BJJ/SW-pass med submissions ikryssat (${totalMartialSessions} st) där du fått in respektive submission. Lägst procent högst upp — bra att fokusera på.</p>
        ${groups.map((g, gi) => `<div style="display:inline-block;font-size:12.5px;font-weight:800;letter-spacing:0.3px;text-transform:uppercase;color:${tabColors.traning};background:${tabColors.traning}1A;padding:3px 10px;border-radius:999px;margin:${gi === 0 ? "0 0 10px" : "16px 0 10px"}">${g.label}</div>${g.rows.map(rowHTML).join("")}`).join("")}
      ` : ""}
    </div>
  `;
}
function renderSubmissionStatsCard() {
  const wrap = document.getElementById("submissionStatsCardWrap");
  if (!wrap) return;
  wrap.innerHTML = submissionStatsCardHTML();
  wireSubmissionStatsCardEvents();
}
function wireSubmissionStatsCardEvents() {
  const toggle = document.getElementById("showSubmissionStatsToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showSubmissionStats = !showSubmissionStats;
      saveShowSubmissionStats();
      renderSubmissionStatsCard();
    });
  }
}

function renderCalorieDayCard() {
  const wrap = document.getElementById("calorieDayCardWrap");
  if (!wrap) return;
  wrap.innerHTML = calorieDayCardHTML();
  wireCalorieDayCardEvents();
  createCalorieDayChart();
}

/* ---------------- Viktutveckling card (independently refreshable) ---------------- */

function weightStatsCardHTML(currentYear) {
  const yearWeight = weightEntries.filter((e) => e.date.slice(0, 4) === String(currentYear));
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showWeightStatsToggle", `Viktutveckling, ${currentYear}`, showWeightStats, showWeightStats ? "10px" : null)}
      ${showWeightStats
        ? (yearWeight.length > 1 ? `<div class="chart-wrap"><canvas id="statsWeightChart"></canvas></div>` : `<div class="empty">Logga vikt några gånger i år för att se en graf</div>`)
        : ""}
    </div>
  `;
}

function createWeightStatsChart() {
  const canvas = document.getElementById("statsWeightChart");
  if (!canvas) return;
  const currentYear = new Date().getFullYear();
  const yearWeight = weightEntries.filter((e) => e.date.slice(0, 4) === String(currentYear));
  if (statsWeightChartInstance) statsWeightChartInstance.destroy();
  statsWeightChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: yearWeight.map((e) => fmtDateShort(e.date)),
      datasets: [{
        data: yearWeight.map((e) => e.value),
        borderColor: tabColors.vikt,
        backgroundColor: tabColors.vikt,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2.5,
      }],
    },
    options: chartBaseOptions(),
  });
}

function wireWeightStatsCardEvents() {
  const toggle = document.getElementById("showWeightStatsToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showWeightStats = !showWeightStats;
      saveShowWeightStats();
      renderWeightStatsCard();
    });
  }
}

function renderWeightStatsCard() {
  const wrap = document.getElementById("weightStatsCardWrap");
  if (!wrap) return;
  wrap.innerHTML = weightStatsCardHTML(new Date().getFullYear());
  wireWeightStatsCardEvents();
  createWeightStatsChart();
}

function statCardHtml(title, count, minutes) {
  return `
    <div class="card stat-card">
      <div class="title">${title}</div>
      <div class="count">${count}</div>
      <div class="unit">pass</div>
      <div class="minutes">${fmtMinutes(minutes)}</div>
    </div>
  `;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartBaseOptions() {
  const border = cssVar("--border") || "#1E2129";
  const muted2 = cssVar("--muted2") || "#6B6F7A";
  const cardBg = cssVar("--card-bg") || "#171A21";
  const text = cssVar("--text") || "#EDEDF0";
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: cardBg, titleColor: text, bodyColor: text, borderWidth: 1, borderColor: border, padding: 8 },
    },
    scales: {
      x: { grid: { color: border }, ticks: { color: muted2, font: { size: 11 } } },
      y: { grid: { color: border }, ticks: { color: muted2, font: { size: 11 } } },
    },
  };
}

/* ---------------- KALORIER TAB ---------------- */

function loadCalorieGoal() {
  try { return localStorage.getItem("calorie_goal_v1") || "maintain"; } catch (e) { return "maintain"; }
}
function saveCalorieGoal() {
  try { localStorage.setItem("calorie_goal_v1", calorieGoal); } catch (e) { /* ignore */ }
}
let calorieGoal = loadCalorieGoal(); // "lose" | "maintain" | "gain"

function computeCalorieGoal() {
  if (weightEntries.length) {
    calorieState.weight = weightEntries[weightEntries.length - 1].value;
  }
  const a = parseFloat(profile.age);
  const h = parseFloat(profile.height);
  const w = parseFloat(calorieState.weight);
  let result = null;
  if (a && h && w) {
    const base = 10 * w + 6.25 * h - 5 * a;
    const bmr = profile.gender === "man" ? base + 5 : base - 161;
    const factor = ACTIVITY_LEVELS.find((l) => l.key === calorieState.activity).factor;
    result = { bmr: Math.round(bmr), tdee: Math.round(bmr * factor) };
  }
  const goalTarget = result ? (calorieGoal === "lose" ? result.tdee - 500 : calorieGoal === "gain" ? result.tdee + 500 : result.tdee) : null;
  return { result, goalTarget };
}

let calorieLogDate = todayISO();

function loadShowFoodSearch() {
  try {
    const raw = localStorage.getItem("show_food_search_v1");
    return raw === null ? true : raw === "true";
  } catch (e) { return true; }
}
function saveShowFoodSearch() {
  try { localStorage.setItem("show_food_search_v1", String(showFoodSearch)); } catch (e) { /* ignore */ }
}
let showFoodSearch = loadShowFoodSearch();
let aboutModalReturnScrollTop = 0;
let profileModalReturnScrollTop = 0;
let typesModalReturnScrollTop = 0;
let foodSearchQuery = "";
let foodSearchResults = [];
let foodSearchStatus = "idle"; // idle | loading | done | error
let foodSearchSelectedIndex = null;
let foodSearchAmount = 100;
const foodSearchCache = {};

function loadFoodFavorites() {
  try {
    const raw = localStorage.getItem("food_favorites_v1");
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveFoodFavorites() {
  try { localStorage.setItem("food_favorites_v1", JSON.stringify(foodFavorites)); } catch (e) { /* ignore */ }
}
let foodFavorites = loadFoodFavorites();
let foodSearchMode = "search"; // search | favorites | meals

function loadSavedMeals() {
  try {
    const raw = localStorage.getItem("saved_meals_v1");
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch (e) { /* fall through */ }
  return [];
}
function saveSavedMeals() {
  try { localStorage.setItem("saved_meals_v1", JSON.stringify(savedMeals)); } catch (e) { /* ignore */ }
}
let savedMeals = loadSavedMeals();
let mealBuilderActive = false;
let mealBuilderEditingId = null;
let mealBuilderName = "";
let mealBuilderIngredients = []; // [{name, amount, kcal, protein, fat, carbs}]
let mealBuilderViewMode = "favorites";
function mealBuilderTotals() {
  return mealBuilderIngredients.reduce((acc, ing) => ({
    kcal: acc.kcal + ing.kcal,
    protein: acc.protein + (ing.protein || 0),
    fat: acc.fat + (ing.fat || 0),
    carbs: acc.carbs + (ing.carbs || 0),
  }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
}

function parseOffProduct(p) {
  const n = p.nutriments || {};
  const kcal100 = n["energy-kcal_100g"] ?? (n["energy_100g"] != null ? n["energy_100g"] / 4.184 : null);
  if (kcal100 == null || isNaN(kcal100)) return null;
  return {
    name: p.product_name || p.generic_name || "Okänt livsmedel",
    brand: p.brands ? p.brands.split(",")[0].trim() : "",
    kcal100: Math.round(kcal100),
    protein100: n.proteins_100g != null ? Math.round(n.proteins_100g * 10) / 10 : null,
    fat100: n.fat_100g != null ? Math.round(n.fat_100g * 10) / 10 : null,
    carbs100: n.carbohydrates_100g != null ? Math.round(n.carbohydrates_100g * 10) / 10 : null,
  };
}

function renderFoodMatchArea() {
  if (foodSearchMode === "meals" && mealBuilderActive) {
    const el = document.getElementById("mealSearchResults");
    if (el) { el.innerHTML = mealBuilderSearchResultsHTML(); wireFoodDetailEvents(); }
  } else {
    renderFoodResultsArea();
  }
}
async function searchFoodOFF(query) {
  const key = query.trim().toLowerCase();
  if (!key) return;
  if (foodSearchCache[key]) {
    foodSearchResults = foodSearchCache[key];
    foodSearchStatus = "done";
    renderFoodMatchArea();
    return;
  }
  foodSearchStatus = "loading";
  foodSearchResults = [];
  renderFoodMatchArea();
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(key)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,generic_name,brands,nutriments`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const products = (data.products || []).map(parseOffProduct).filter(Boolean).slice(0, 15);
    foodSearchCache[key] = products;
    foodSearchResults = products;
    foodSearchStatus = "done";
  } catch (e) {
    foodSearchStatus = "error";
  }
  renderFoodMatchArea();
}

function isFoodFavorited(p) {
  return foodFavorites.some((f) => f.name === p.name && f.kcal100 === p.kcal100);
}
function foodDetailPanelHTML(p, i) {
  const favorited = isFoodFavorited(p);
  if (mealBuilderActive) {
    return `
      <div style="padding:10px;background:var(--input-bg);border-radius:10px;margin:4px 0 10px">
        <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);margin-bottom:8px">
          ${p.protein100 != null ? `<span>Protein: ${p.protein100} g/100g</span>` : ""}
          ${p.fat100 != null ? `<span>Fett: ${p.fat100} g/100g</span>` : ""}
          ${p.carbs100 != null ? `<span>Kolhydrater: ${p.carbs100} g/100g</span>` : ""}
        </div>
        <div class="row" style="align-items:center">
          <input type="number" inputmode="numeric" id="foodAmountInput" value="${foodSearchAmount}" enterkeyhint="go" style="max-width:90px" />
          <span style="font-size:13px;color:var(--muted)">gram</span>
          <span style="font-size:15px;font-weight:700;margin-left:auto" id="foodComputedKcal">${Math.round((p.kcal100 * foodSearchAmount) / 100)} kcal</span>
        </div>
        <button class="modal-btn primary" id="mealIngredientAddBtn" style="width:100%;margin-top:10px">+ Lägg till i måltiden</button>
      </div>
    `;
  }
  return `
    <div style="padding:10px;background:var(--input-bg);border-radius:10px;margin:4px 0 10px">
      <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);margin-bottom:8px">
        ${p.protein100 != null ? `<span>Protein: ${p.protein100} g/100g</span>` : ""}
        ${p.fat100 != null ? `<span>Fett: ${p.fat100} g/100g</span>` : ""}
        ${p.carbs100 != null ? `<span>Kolhydrater: ${p.carbs100} g/100g</span>` : ""}
      </div>
      <div class="row" style="align-items:center">
        <input type="number" inputmode="numeric" id="foodAmountInput" value="${foodSearchAmount}" enterkeyhint="go" style="max-width:90px" />
        <span style="font-size:13px;color:var(--muted)">gram</span>
        <span style="font-size:15px;font-weight:700;margin-left:auto" id="foodComputedKcal">${Math.round((p.kcal100 * foodSearchAmount) / 100)} kcal</span>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="modal-btn primary" id="foodAddBtn" style="flex:1">Lägg till som ätit</button>
        <button class="modal-btn secondary" id="foodFavoriteBtn" style="width:auto;padding:0 14px;flex-shrink:0;${favorited ? "border-color:#F5B914;color:#F5B914;background:#F5B91426;" : ""}">${favorited ? "★" : "☆"}</button>
      </div>
    </div>
  `;
}
function mealBuilderSearchResultsHTML() {
  if (mealBuilderViewMode === "favorites") {
    if (!foodFavorites.length) return `<p style="text-align:center;font-size:12.5px;color:var(--muted)">Inga favoriter sparade än — spara några från Sök-fliken i Kalorier först.</p>`;
    return `
      <div class="history-scroll" style="max-height:260px">
        ${foodFavorites.map((p, i) => `
          <div class="list-row" style="cursor:pointer" data-food-result="${i}">
            <span style="font-size:13px;flex:1">${escapeHtml(p.name)}${p.brand ? ` <span style="color:var(--muted2)">— ${escapeHtml(p.brand)}</span>` : ""}</span>
            <span style="font-size:12.5px;color:var(--muted);white-space:nowrap">${p.kcal100} kcal/100g</span>
          </div>
          ${foodSearchSelectedIndex === i ? foodDetailPanelHTML(p, i) : ""}
        `).join("")}
      </div>
    `;
  }
  return `
    ${foodSearchStatus === "loading" ? `<p style="text-align:center">Söker…</p>` : ""}
    ${foodSearchStatus === "error" ? `<p style="text-align:center">Kunde inte hämta resultat.</p>` : ""}
    ${foodSearchStatus === "done" && foodSearchResults.length === 0 ? `<p style="text-align:center">Inga träffar.</p>` : ""}
    ${foodSearchStatus === "done" && foodSearchResults.length > 0 ? `
      <div class="history-scroll" style="max-height:260px">
        ${foodSearchResults.map((p, i) => `
          <div class="list-row" style="cursor:pointer" data-food-result="${i}">
            <span style="font-size:13px;flex:1">${escapeHtml(p.name)}${p.brand ? ` <span style="color:var(--muted2)">— ${escapeHtml(p.brand)}</span>` : ""}</span>
            <span style="font-size:12.5px;color:var(--muted);white-space:nowrap">${p.kcal100} kcal/100g</span>
          </div>
          ${foodSearchSelectedIndex === i ? foodDetailPanelHTML(p, i) : ""}
        `).join("")}
      </div>
    ` : ""}
  `;
}
function mealBuilderHTML() {
  const totals = mealBuilderTotals();
  return `
    <div style="font-size:12.5px;font-weight:700;color:var(--muted);margin-bottom:8px">${mealBuilderEditingId ? "Redigerar måltid" : "Ny måltid"}</div>
    <div style="background:var(--input-bg);border-radius:10px;padding:10px;margin-bottom:12px">
      <input type="text" id="mealNameInput" placeholder="Namn på måltiden, t.ex. Köttfärssås och spagetti" value="${escapeHtml(mealBuilderName)}" style="width:100%;margin-bottom:10px" />
      ${mealBuilderIngredients.length === 0 ? `<p style="font-size:12.5px;color:var(--muted)">Sök och lägg till ingredienser nedan.</p>` : `
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
          ${mealBuilderIngredients.map((ing, i) => `
            <div class="list-row">
              <span style="font-size:12.5px;flex:1">${escapeHtml(ing.name)} (${ing.amount} g)</span>
              <span style="font-size:12px;color:var(--muted);white-space:nowrap">${Math.round(ing.kcal)} kcal</span>
              <button class="delete-btn" data-remove-ingredient="${i}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);padding-top:6px;border-top:1px solid var(--border)">
          <span>Totalt: <strong style="color:var(--text)">${Math.round(totals.kcal)} kcal</strong></span>
          <span>P: ${Math.round(totals.protein * 10) / 10}g</span>
          <span>F: ${Math.round(totals.fat * 10) / 10}g</span>
          <span>K: ${Math.round(totals.carbs * 10) / 10}g</span>
        </div>
      `}
    </div>
    <div class="theme-row" style="margin-bottom:10px">
      <button class="theme-btn" data-meal-view-mode="favorites" style="${mealBuilderViewMode === "favorites" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">⭐ Favoriter</button>
      <button class="theme-btn" data-meal-view-mode="search" style="${mealBuilderViewMode === "search" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">🔍 Sök</button>
    </div>
    ${mealBuilderViewMode === "search" ? `
    <div class="row" style="margin-bottom:10px">
      <input type="text" id="foodSearchInput" placeholder="Sök ingrediens att lägga till" value="${escapeHtml(foodSearchQuery)}" style="flex:1;min-width:0" />
      <button class="btn-primary" id="foodSearchBtn" style="background:${tabColors.kalorier}">${ICONS.search || "🔍"}</button>
    </div>
    ` : ""}
    <div id="mealSearchResults">${mealBuilderSearchResultsHTML()}</div>
    <div class="row" style="margin-top:12px">
      <button class="modal-btn secondary" id="cancelMealBtn" style="flex:1">Avbryt</button>
      <button class="modal-btn primary" id="saveMealBtn" style="flex:1" ${mealBuilderIngredients.length === 0 ? "disabled" : ""}>${mealBuilderEditingId ? "Spara ändringar" : "Spara måltid"}</button>
    </div>
  `;
}
function foodResultsAreaHTML() {
  if (foodSearchMode === "search") {
    return `
      ${foodSearchStatus === "loading" ? `<p style="text-align:center">Söker…</p>` : ""}
      ${foodSearchStatus === "error" ? `<p style="text-align:center">Kunde inte hämta resultat. Kontrollera internetanslutningen och försök igen.</p>` : ""}
      ${foodSearchStatus === "done" && foodSearchResults.length === 0 ? `<p style="text-align:center">Inga träffar. Prova ett annat sökord, eller logga kcal manuellt ovan.</p>` : ""}
      ${foodSearchStatus === "done" && foodSearchResults.length > 0 ? `
        <div class="history-scroll" style="max-height:320px">
          ${foodSearchResults.map((p, i) => `
            <div class="list-row" style="cursor:pointer" data-food-result="${i}">
              <span style="font-size:13px;flex:1">${escapeHtml(p.name)}${p.brand ? ` <span style="color:var(--muted2)">— ${escapeHtml(p.brand)}</span>` : ""}</span>
              <span style="font-size:12.5px;color:var(--muted);white-space:nowrap">${p.kcal100} kcal/100g</span>
            </div>
            ${foodSearchSelectedIndex === i ? foodDetailPanelHTML(p, i) : ""}
          `).join("")}
        </div>
      ` : ""}
    `;
  }
  if (foodSearchMode === "meals") {
    if (mealBuilderActive) return mealBuilderHTML();
    return `
      <button class="modal-btn secondary" id="newMealBtn" style="width:100%;margin-bottom:10px">+ Ny måltid</button>
      ${savedMeals.length === 0 ? `<p style="text-align:center">Inga sparade måltider än — bygg ihop en av dina vanliga rätter för snabb loggning framöver.</p>` : `
        <div class="history-scroll" style="max-height:320px">
          ${savedMeals.map((m, i) => `
            <div class="list-row" style="cursor:pointer" data-meal="${i}">
              <span class="dot" style="background:${tabColors.kalorier}"></span>
              <span style="font-size:13px;flex:1">${escapeHtml(m.name)}</span>
              <span style="font-size:12.5px;color:var(--muted);white-space:nowrap">${Math.round(m.kcal)} kcal</span>
              <button class="delete-btn" data-edit-meal="${i}">${ICONS.pencil}</button>
              <button class="delete-btn" data-remove-meal="${i}">${ICONS.trash}</button>
            </div>
          `).join("")}
        </div>
      `}
    `;
  }
  if (foodFavorites.length === 0) return `<p style="text-align:center">Inga favoriter sparade än — tryck på stjärnan vid ett sökresultat för att spara det här.</p>`;
  return `
    <div class="history-scroll" style="max-height:320px">
      ${foodFavorites.map((p, i) => `
        <div class="list-row" style="cursor:pointer" data-food-fav="${i}">
          <span class="dot" style="background:${tabColors.kalorier}"></span>
          <span style="font-size:13px;flex:1">${escapeHtml(p.name)}</span>
          <span style="font-size:12.5px;color:var(--muted);white-space:nowrap">${p.kcal100} kcal/100g</span>
        </div>
        ${foodSearchSelectedIndex === i ? foodDetailPanelHTML(p, i) : ""}
      `).join("")}
    </div>
  `;
}
function foodSearchCardHTML() {
  return `
    <div class="card">
      ${cardChevronHeaderHTML("showFoodSearchToggle", "🔍 Sök livsmedel", showFoodSearch, showFoodSearch ? "10px" : null)}
      ${showFoodSearch ? `
        <div class="theme-row" style="margin-bottom:10px">
          <button class="theme-btn" data-food-mode="search" style="${foodSearchMode === "search" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">Sök</button>
          <button class="theme-btn" data-food-mode="favorites" style="${foodSearchMode === "favorites" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">⭐ Favoriter</button>
          <button class="theme-btn" data-food-mode="meals" style="${foodSearchMode === "meals" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">🍲 Måltider</button>
        </div>
        ${foodSearchMode === "search" ? `
          <div class="row" style="margin-bottom:10px">
            <input type="text" id="foodSearchInput" placeholder="t.ex. kycklingfilé" value="${escapeHtml(foodSearchQuery)}" style="flex:1;min-width:0" />
            <button class="btn-primary" id="foodSearchBtn" style="background:${tabColors.kalorier}">${ICONS.search || "🔍"}</button>
          </div>
        ` : ""}
        <div id="foodResultsArea">${foodResultsAreaHTML()}</div>
      ` : ""}
    </div>
  `;
}
function renderFoodSearchCard() {
  const wrap = document.getElementById("foodSearchCardWrap");
  if (!wrap) return;
  wrap.innerHTML = foodSearchCardHTML();
  wireFoodSearchCardEvents();
}
function renderFoodResultsArea() {
  const el = document.getElementById("foodResultsArea");
  if (!el) return;
  el.innerHTML = foodResultsAreaHTML();
  wireFoodResultsAreaEvents();
}
function activeFoodList() {
  const mode = mealBuilderActive ? mealBuilderViewMode : foodSearchMode;
  return mode === "favorites" ? foodFavorites : foodSearchResults;
}
function wireFoodSearchInputEvents() {
  const searchInput = document.getElementById("foodSearchInput");
  const searchBtn = document.getElementById("foodSearchBtn");
  if (!searchInput || !searchBtn || searchInput.dataset.wired) return;
  searchInput.dataset.wired = "1";
  const doSearch = () => {
    foodSearchQuery = searchInput.value;
    foodSearchSelectedIndex = null;
    searchFoodOFF(foodSearchQuery);
  };
  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); doSearch(); }
  });
  let debounceTimer = null;
  searchInput.addEventListener("input", () => {
    foodSearchQuery = searchInput.value;
    clearTimeout(debounceTimer);
    if (searchInput.value.trim().length < 2) return;
    debounceTimer = setTimeout(() => {
      foodSearchSelectedIndex = null;
      searchFoodOFF(searchInput.value);
    }, 450);
  });
}
function wireFoodSearchCardEvents() {
  const toggle = document.getElementById("showFoodSearchToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      showFoodSearch = !showFoodSearch;
      saveShowFoodSearch();
      renderFoodSearchCard();
    });
  }
  document.querySelectorAll("[data-food-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      foodSearchMode = btn.dataset.foodMode;
      foodSearchSelectedIndex = null;
      renderFoodSearchCard();
    });
  });
  wireFoodSearchInputEvents();
  wireFoodResultsAreaEvents();
}
function wireFoodDetailEvents() {
  document.querySelectorAll("[data-food-result]").forEach((row) => {
    row.addEventListener("click", () => {
      const i = parseInt(row.dataset.foodResult, 10);
      foodSearchSelectedIndex = foodSearchSelectedIndex === i ? null : i;
      renderFoodMatchArea();
    });
  });
  const amountInput = document.getElementById("foodAmountInput");
  if (amountInput) {
    amountInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value.replace(",", "."));
      foodSearchAmount = isNaN(val) ? 0 : val;
      const p = activeFoodList()[foodSearchSelectedIndex];
      const kcalEl = document.getElementById("foodComputedKcal");
      if (p && kcalEl) kcalEl.textContent = `${Math.round((p.kcal100 * foodSearchAmount) / 100)} kcal`;
    });
    amountInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); (document.getElementById("foodAddBtn") || document.getElementById("mealIngredientAddBtn"))?.click(); }
    });
  }
  const favBtn = document.getElementById("foodFavoriteBtn");
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      const p = activeFoodList()[foodSearchSelectedIndex];
      if (!p) return;
      const idx = foodFavorites.findIndex((f) => f.name === p.name && f.kcal100 === p.kcal100);
      if (idx === -1) {
        foodFavorites.push({ name: p.name, brand: p.brand || "", kcal100: p.kcal100, protein100: p.protein100, fat100: p.fat100, carbs100: p.carbs100 });
      } else if (foodSearchMode === "favorites") {
        foodFavorites.splice(idx, 1);
        foodSearchSelectedIndex = null;
      } else {
        foodFavorites.splice(idx, 1);
      }
      saveFoodFavorites();
      vibrate();
      renderFoodResultsArea();
    });
  }
  const addBtn = document.getElementById("foodAddBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const p = activeFoodList()[foodSearchSelectedIndex];
      if (!p) return;
      const kcal = Math.round((p.kcal100 * foodSearchAmount) / 100);
      if (kcal <= 0) return;
      const scale = (per100) => (per100 != null ? Math.round(((per100 * foodSearchAmount) / 100) * 10) / 10 : null);
      const entry = { id: uid(), date: calorieLogDate, kcal, type: "eaten", label: `${p.name} (${foodSearchAmount} g)`,
        foodName: p.name, amount: foodSearchAmount, kcal100: p.kcal100, protein100: p.protein100, fat100: p.fat100, carbs100: p.carbs100 };
      const protein = scale(p.protein100);
      const fat = scale(p.fat100);
      const carbs = scale(p.carbs100);
      if (protein != null) entry.protein = protein;
      if (fat != null) entry.fat = fat;
      if (carbs != null) entry.carbs = carbs;
      calorieLog.push(entry);
      persistCalorieLog();
      vibrate();
      checkAchievements();
      checkWeeklyChallenges();
      awardLogXpForDate("calorie", calorieLogDate);
      foodSearchSelectedIndex = null;
      renderKalorier();
    });
  }
  const mealIngredientAddBtn = document.getElementById("mealIngredientAddBtn");
  if (mealIngredientAddBtn) {
    mealIngredientAddBtn.addEventListener("click", () => {
      const p = activeFoodList()[foodSearchSelectedIndex];
      if (!p) return;
      const scale = (per100) => (per100 != null ? Math.round(((per100 * foodSearchAmount) / 100) * 10) / 10 : 0);
      mealBuilderIngredients.push({
        name: p.name,
        amount: foodSearchAmount,
        kcal: Math.round((p.kcal100 * foodSearchAmount) / 100),
        protein: scale(p.protein100),
        fat: scale(p.fat100),
        carbs: scale(p.carbs100),
      });
      foodSearchSelectedIndex = null;
      vibrate();
      renderFoodResultsArea();
    });
  }
}
function wireFoodResultsAreaEvents() {
  wireFoodSearchInputEvents();
  wireFoodDetailEvents();
  document.querySelectorAll("[data-meal-view-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mealBuilderViewMode = btn.dataset.mealViewMode;
      foodSearchSelectedIndex = null;
      renderFoodResultsArea();
    });
  });
  document.querySelectorAll("[data-food-fav]").forEach((row) => {
    row.addEventListener("click", () => {
      const i = parseInt(row.dataset.foodFav, 10);
      foodSearchSelectedIndex = foodSearchSelectedIndex === i ? null : i;
      renderFoodResultsArea();
    });
  });
  const newMealBtn = document.getElementById("newMealBtn");
  if (newMealBtn) {
    newMealBtn.addEventListener("click", () => {
      mealBuilderActive = true;
      mealBuilderEditingId = null;
      mealBuilderName = "";
      mealBuilderIngredients = [];
      foodSearchQuery = "";
      foodSearchResults = [];
      foodSearchStatus = "idle";
      foodSearchSelectedIndex = null;
      mealBuilderViewMode = foodFavorites.length ? "favorites" : "search";
      renderFoodResultsArea();
    });
  }
  const cancelMealBtn = document.getElementById("cancelMealBtn");
  if (cancelMealBtn) {
    cancelMealBtn.addEventListener("click", () => {
      mealBuilderActive = false;
      mealBuilderEditingId = null;
      mealBuilderIngredients = [];
      mealBuilderName = "";
      renderFoodResultsArea();
    });
  }
  const mealNameInput = document.getElementById("mealNameInput");
  if (mealNameInput) {
    mealNameInput.addEventListener("input", (e) => { mealBuilderName = e.target.value; });
  }
  document.querySelectorAll("[data-remove-ingredient]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mealBuilderIngredients.splice(parseInt(btn.dataset.removeIngredient, 10), 1);
      renderFoodResultsArea();
    });
  });
  const saveMealBtn = document.getElementById("saveMealBtn");
  if (saveMealBtn) {
    saveMealBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("mealNameInput");
      const name = (nameInput ? nameInput.value : mealBuilderName).trim();
      if (!name) { nameInput?.focus(); return; }
      if (mealBuilderIngredients.length === 0) return;
      const totals = mealBuilderTotals();
      const mealData = {
        name,
        kcal: Math.round(totals.kcal),
        protein: Math.round(totals.protein * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        ingredients: mealBuilderIngredients.slice(),
      };
      if (mealBuilderEditingId) {
        const existing = savedMeals.find((m) => m.id === mealBuilderEditingId);
        if (existing) Object.assign(existing, mealData);
      } else {
        savedMeals.push({ id: uid(), ...mealData });
      }
      saveSavedMeals();
      mealBuilderActive = false;
      mealBuilderEditingId = null;
      mealBuilderIngredients = [];
      mealBuilderName = "";
      vibrate();
      renderFoodResultsArea();
    });
  }
  document.querySelectorAll("[data-meal]").forEach((row) => {
    row.addEventListener("click", () => {
      const meal = savedMeals[parseInt(row.dataset.meal, 10)];
      if (!meal) return;
      const entry = { id: uid(), date: calorieLogDate, kcal: meal.kcal, type: "eaten", label: meal.name };
      if (meal.protein != null) entry.protein = meal.protein;
      if (meal.fat != null) entry.fat = meal.fat;
      if (meal.carbs != null) entry.carbs = meal.carbs;
      calorieLog.push(entry);
      persistCalorieLog();
      vibrate();
      checkAchievements();
      checkWeeklyChallenges();
      awardLogXpForDate("calorie", calorieLogDate);
      renderKalorier();
    });
  });
  document.querySelectorAll("[data-edit-meal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const meal = savedMeals[parseInt(btn.dataset.editMeal, 10)];
      if (!meal) return;
      mealBuilderActive = true;
      mealBuilderEditingId = meal.id;
      mealBuilderName = meal.name;
      mealBuilderIngredients = (meal.ingredients || []).map((ing) => ({ ...ing }));
      foodSearchQuery = "";
      foodSearchResults = [];
      foodSearchStatus = "idle";
      foodSearchSelectedIndex = null;
      mealBuilderViewMode = foodFavorites.length ? "favorites" : "search";
      renderFoodResultsArea();
    });
  });
  document.querySelectorAll("[data-remove-meal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      savedMeals.splice(parseInt(btn.dataset.removeMeal, 10), 1);
      saveSavedMeals();
      renderFoodResultsArea();
    });
  });
}

function renderKalorier() {
  const { result, goalTarget } = computeCalorieGoal();

  const selectedCalorieEntries = calorieLog.filter((e) => e.date === calorieLogDate);
  const selectedEaten = selectedCalorieEntries.filter((e) => e.type !== "burned").reduce((s, e) => s + e.kcal, 0);
  const selectedBurned = selectedCalorieEntries.filter((e) => e.type === "burned").reduce((s, e) => s + e.kcal, 0);
  const remaining = goalTarget !== null ? goalTarget - selectedEaten + selectedBurned : 0;
  const eatenEntries = selectedCalorieEntries.filter((e) => e.type !== "burned");
  const totalProtein = eatenEntries.reduce((s, e) => s + (e.protein || 0), 0);
  const totalFat = eatenEntries.reduce((s, e) => s + (e.fat || 0), 0);
  const totalCarbs = eatenEntries.reduce((s, e) => s + (e.carbs || 0), 0);
  const hasAnyMacros = eatenEntries.some((e) => e.protein != null || e.fat != null || e.carbs != null);
  const latestWeightEntry = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
  const bodyweightKg = latestWeightEntry ? latestWeightEntry.value : null;
  const macroDisplay = (key, total) => {
    const setting = macroSettings[key];
    const perKg = setting.enabled && setting.green.mode === "perkg" && bodyweightKg ? total / bodyweightKg : null;
    return {
      color: macroColorFor(key, total, bodyweightKg),
      suffix: perKg != null ? ` <span style="font-size:10.5px;font-weight:400">(${Math.round(perKg * 10) / 10} g/kg)</span>` : "",
    };
  };
  const proteinDisplay = macroDisplay("protein", totalProtein);
  const fatDisplay = macroDisplay("fat", totalFat);
  const carbsDisplay = macroDisplay("carbs", totalCarbs);

  content.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="card-label" style="margin-bottom:0">Kalorier</div>
        <button id="managePresetsBtn" style="background:none;border:none;color:${tabColors.kalorier};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px">Hantera</button>
      </div>
      <div class="row" style="margin-bottom:10px">
        <input type="date" id="calorieLogDateInput" value="${calorieLogDate}" />
      </div>
      <div class="field-label" style="margin-bottom:4px">Ätit</div>
      <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
        ${quickPresets.eaten.map((p, i) => `<button class="chip" data-quick-eaten-idx="${i}" style="${p.color ? `border-color:${p.color};background:${p.color}26;color:${p.color}` : ""}">${escapeHtml(p.label)} ${p.kcal} kcal</button>`).join("")}
      </div>
      <div class="row" style="margin-bottom:10px">
        <input type="number" inputmode="numeric" placeholder="kcal, t.ex. 800" id="calorieKcalInput" enterkeyhint="go" style="max-width:140px" />
        <button class="btn-primary" id="calorieAddBtn" style="background:${tabColors.kalorier}">${ICONS.plus}</button>
      </div>
      <div class="field-label" style="margin-bottom:4px">Kalorier förbrukade</div>
      <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
        ${quickPresets.burned.map((p) => `<button class="chip" data-quick-burned="${p.kcal}" style="${p.color ? `border-color:${p.color};background:${p.color}26;color:${p.color}` : ""}">${escapeHtml(p.label)} ${p.kcal} kcal</button>`).join("")}
      </div>
      <div class="row">
        <input type="number" inputmode="numeric" placeholder="kcal, t.ex. 300" id="burnedKcalInput" enterkeyhint="go" style="max-width:140px" />
        <button class="btn-primary" id="burnedAddBtn" style="background:${tabColors.kalorier}">${ICONS.plus}</button>
      </div>
      <div style="display:flex;justify-content:space-around;text-align:center;margin-top:14px">
        <div>
          <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">Ätit</div>
          <div style="font-size:18px;font-weight:700;color:#E8834A">${selectedEaten}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">Kalorier förbrukade</div>
          <div style="font-size:18px;font-weight:700;color:#4A90D9">${selectedBurned}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">Kalorier kvar${result ? ` <span style="opacity:0.7">(${calorieGoal === "lose" ? "viktnedgång" : calorieGoal === "gain" ? "viktuppgång" : "underhåll"})</span>` : ""}</div>
          <div style="font-size:18px;font-weight:700;color:${result ? (remaining < 0 ? "#E15554" : "#4CAF7D") : "var(--muted2)"}">${result ? remaining : "–"}</div>
        </div>
      </div>
      ${hasAnyMacros ? `
        <div style="display:flex;justify-content:space-around;text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
          <div>
            <div style="font-size:10.5px;color:var(--muted2);margin-bottom:2px">Protein</div>
            <div style="font-size:14px;font-weight:600;color:${proteinDisplay.color}">${Math.round(totalProtein * 10) / 10} g${proteinDisplay.suffix}</div>
          </div>
          <div>
            <div style="font-size:10.5px;color:var(--muted2);margin-bottom:2px">Fett</div>
            <div style="font-size:14px;font-weight:600;color:${fatDisplay.color}">${Math.round(totalFat * 10) / 10} g${fatDisplay.suffix}</div>
          </div>
          <div>
            <div style="font-size:10.5px;color:var(--muted2);margin-bottom:2px">Kolhydrater</div>
            <div style="font-size:14px;font-weight:600;color:${carbsDisplay.color}">${Math.round(totalCarbs * 10) / 10} g${carbsDisplay.suffix}</div>
          </div>
        </div>
      ` : ""}
      ${selectedCalorieEntries.length ? `
        <div class="history-scroll" style="margin-top:12px;max-height:330px">
          ${selectedCalorieEntries.map((e) => {
            const hasMacros = e.protein != null || e.fat != null || e.carbs != null;
            const macroParts = [];
            if (e.protein != null) macroParts.push(`P: ${e.protein} g`);
            if (e.fat != null) macroParts.push(`F: ${e.fat} g`);
            if (e.carbs != null) macroParts.push(`K: ${e.carbs} g`);
            return `
            <div class="list-row" style="align-items:flex-start">
              <span class="dot" style="background:${e.type === "burned" ? "#4CAF7D" : "#E8834A"};margin-top:5px"></span>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600">${e.label ? escapeHtml(e.label) : (e.type === "burned" ? "Kalorier förbrukade" : "Ätit")} · ${e.kcal} kcal</div>
                ${hasMacros ? `<div style="font-size:11.5px;color:var(--muted);margin-top:1px">${macroParts.join(" · ")}</div>` : ""}
              </div>
              <button class="delete-btn" data-edit-calorie="${e.id}">${ICONS.pencil}</button>
              <button class="delete-btn" data-del-calorie="${e.id}">${ICONS.trash}</button>
            </div>
          `;
          }).join("")}
        </div>
      ` : ""}
    </div>

    <div id="foodSearchCardWrap">${foodSearchCardHTML()}</div>

    ${result ? `
      <div class="card">
        <div style="display:flex;justify-content:space-around;text-align:center;margin-bottom:8px">
          <div>
            <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">Viloämnesomsättning (BMR)</div>
            <div style="font-size:24px;font-weight:700">${result.bmr}</div>
            <div style="font-size:11px;color:var(--muted2)">kcal/dygn</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">Underhåll (TDEE)</div>
            <div style="font-size:24px;font-weight:700;color:#2DD4BF">${result.tdee}</div>
            <div style="font-size:11px;color:var(--muted2)">kcal/dygn</div>
          </div>
        </div>
        <div style="text-align:center">
          <button id="editProfileFromCalBtn" style="background:none;border:none;color:${tabColors.kalorier};font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;padding:2px">Baserat på din profil — redigera</button>
        </div>
      </div>
    ` : `
      <div class="card"><div class="empty">Fyll i din profil (ålder, längd) och logga en vikt för att räkna ut ditt kaloribehov — hittas under kugghjulet → Profil.</div></div>
    `}

    <div id="calorieHistoryListCardWrap">${calorieHistoryListCardHTML()}</div>

    <div class="disclaimer">Copyright 2026 Mattias Öman</div>
  `;

  const editProfileBtn = document.getElementById("editProfileFromCalBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      profileModalReturnsToSettings = false;
      openProfileModal();
    });
  }
  wireCalorieHistoryListCardEvents();
  wireFoodSearchCardEvents();

  document.getElementById("managePresetsBtn").addEventListener("click", openManageCaloriePresetsModal);
  document.getElementById("calorieLogDateInput").addEventListener("change", (e) => {
    calorieLogDate = e.target.value;
    renderKalorier();
  });

  content.querySelectorAll("[data-quick-eaten-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = quickPresets.eaten[parseInt(btn.dataset.quickEatenIdx, 10)];
      if (!p) return;
      const entry = { id: uid(), date: calorieLogDate, kcal: p.kcal, type: "eaten" };
      if (p.protein != null) entry.protein = p.protein;
      if (p.fat != null) entry.fat = p.fat;
      if (p.carbs != null) entry.carbs = p.carbs;
      if (p.label) entry.label = p.label;
      calorieLog.push(entry);
      persistCalorieLog();
      vibrate();
      checkAchievements();
    checkWeeklyChallenges();
      awardLogXpForDate("calorie", calorieLogDate);
      renderKalorier();
    });
  });
  content.querySelectorAll("[data-quick-burned]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const num = parseInt(btn.dataset.quickBurned, 10);
      calorieLog.push({ id: uid(), date: calorieLogDate, kcal: num, type: "burned" });
      persistCalorieLog();
      vibrate();
      checkAchievements();
    checkWeeklyChallenges();
      awardLogXpForDate("calorie", calorieLogDate);
      renderKalorier();
    });
  });

  const calorieBtn = document.getElementById("calorieAddBtn");
  if (calorieBtn) {
    calorieBtn.addEventListener("click", () => {
      const input = document.getElementById("calorieKcalInput");
      const num = parseInt(input.value, 10);
      if (isNaN(num) || num <= 0) return;
      calorieLog.push({ id: uid(), date: calorieLogDate, kcal: num, type: "eaten" });
      persistCalorieLog();
      vibrate();
      checkAchievements();
    checkWeeklyChallenges();
      awardLogXpForDate("calorie", calorieLogDate);
      renderKalorier();
    });
    document.getElementById("calorieKcalInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); calorieBtn.click(); }
    });
  }
  const burnedBtn = document.getElementById("burnedAddBtn");
  if (burnedBtn) {
    burnedBtn.addEventListener("click", () => {
      const input = document.getElementById("burnedKcalInput");
      const num = parseInt(input.value, 10);
      if (isNaN(num) || num <= 0) return;
      calorieLog.push({ id: uid(), date: calorieLogDate, kcal: num, type: "burned" });
      persistCalorieLog();
      vibrate();
      checkAchievements();
    checkWeeklyChallenges();
      awardLogXpForDate("calorie", calorieLogDate);
      renderKalorier();
    });
    document.getElementById("burnedKcalInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); burnedBtn.click(); }
    });
  }
  content.querySelectorAll("[data-edit-calorie]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = calorieLog.find((e) => e.id === btn.dataset.editCalorie);
      if (!entry) return;
      if (entry.kcal100 != null) {
        openEditFoodEntryModal(entry.id);
        return;
      }
      // Remove the old entry and prefill the right input with its value for adjustment.
      calorieLog = calorieLog.filter((e) => e.id !== entry.id);
      persistCalorieLog();
      renderKalorier();
      const inputId = entry.type === "burned" ? "burnedKcalInput" : "calorieKcalInput";
      const input = document.getElementById(inputId);
      if (input) {
        input.value = entry.kcal;
        input.focus();
      }
    });
  });
  content.querySelectorAll("[data-del-calorie]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const removed = calorieLog.find((e) => e.id === btn.dataset.delCalorie);
      calorieLog = calorieLog.filter((e) => e.id !== btn.dataset.delCalorie);
      persistCalorieLog();
      vibrate(10);
      renderKalorier();
      if (removed) {
        showUndoToast(`${removed.kcal} kcal borttaget`, () => {
          calorieLog.push(removed);
          persistCalorieLog();
          if (activeTab === "kalorier") renderKalorier();
        });
      }
    });
  });

  // restore focus after re-render caused by typing
  restoreFocus();
}

let lastFocusedId = null;
content.addEventListener("focusin", (e) => { if (e.target && e.target.id) lastFocusedId = e.target.id; });
function restoreFocus() {
  if (lastFocusedId) {
    const el = document.getElementById(lastFocusedId);
    if (el) {
      el.focus();
      const val = el.value;
      el.value = "";
      el.value = val;
    }
  }
}

/* ---------------- Backup / restore (survives clearing browser data) ---------------- */

const modalRoot = document.getElementById("modalRoot");

const TAB_DEPTH_ORDER = ["vikt", "traning", "kalorier", "stats"];
function tabDepthOf(key) {
  const i = TAB_DEPTH_ORDER.indexOf(key);
  return i === -1 ? 0 : i;
}
let currentTabDepth = tabDepthOf(activeTab);
history.replaceState({ tabDepth: currentTabDepth }, "");

function navigateTabHistory(newKey) {
  const newDepth = tabDepthOf(newKey);
  if (newDepth > currentTabDepth) {
    for (let d = currentTabDepth + 1; d <= newDepth; d++) {
      history.pushState({ tabDepth: d }, "");
    }
  } else if (newDepth < currentTabDepth) {
    history.replaceState({ tabDepth: newDepth }, "");
  }
  currentTabDepth = newDepth;
}

let suppressNextPopstate = false;
let respondingToPopstate = false;
function pushModalHistoryIfNeeded() {
  if (!modalRoot.dataset.historyPushed) {
    history.pushState({ modalOpenMarker: true, tabDepth: currentTabDepth }, "");
    modalRoot.dataset.historyPushed = "1";
  }
}
function reestablishModalMarkerIfStillOpen() {
  if (modalRoot.innerHTML.trim()) {
    if (!modalRoot.dataset.historyPushed) {
      history.pushState({ modalOpenMarker: true, tabDepth: currentTabDepth }, "");
      modalRoot.dataset.historyPushed = "1";
    }
  } else {
    delete modalRoot.dataset.historyPushed;
  }
}
function handleModalClosedByUser() {
  if (respondingToPopstate) return;
  if (modalRoot.innerHTML.trim()) return;
  delete modalRoot.dataset.historyPushed;
  if (history.state && history.state.modalOpenMarker) {
    suppressNextPopstate = true;
    history.back();
  }
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".modal-close") && !respondingToPopstate) {
    handleModalClosedByUser();
  }
});
window.addEventListener("popstate", (e) => {
  if (suppressNextPopstate) { suppressNextPopstate = false; return; }
  if (modalRoot.innerHTML.trim()) {
    respondingToPopstate = true;
    const closeBtn = modalRoot.querySelector(".modal-close");
    if (closeBtn) closeBtn.click(); else modalRoot.innerHTML = "";
    respondingToPopstate = false;
    reestablishModalMarkerIfStillOpen();
    return;
  }
  const state = e.state;
  const newDepth = (state && typeof state.tabDepth === "number") ? state.tabDepth : 0;
  currentTabDepth = newDepth;
  const key = TAB_DEPTH_ORDER[newDepth] || "vikt";
  if (key !== activeTab) {
    activeTab = key;
    render();
  }
});
const importFileInput = document.getElementById("importFileInput");

function pad(n) { return String(n).padStart(2, "0"); }

function buildDataPayload() {
  return {
    app: "traningslogg",
    kind: "data",
    exportedAt: new Date().toISOString(),
    weightEntries,
    workoutEntries,
    calorieLog,
    bodyMeasurements,
    pbLog,
    konditionPbLog,
    foodFavorites,
    savedMeals,
    gymSessionHistory,
    activeGymSession,
    bingoCard,
    bingoHistory,
    bingoXp,
    bingoLifetimeStats,
    bgUnlockedAchievements,
    achievementPrestige,
    prestigeXp,
    prestigeBaseline,
    prestigeConsumedIds,
    prestigeStreakResetAt,
  };
}

function buildSettingsPayload() {
  return {
    app: "traningslogg",
    kind: "settings",
    exportedAt: new Date().toISOString(),
    trainingTypes,
    tabColors,
    navGlowColors,
    showNavLabels,
    tabOrder,
    quickPresets,
    profile,
    advancedMenuEnabled,
    advancedQuestions,
    gymMenuEnabled,
    konditionMenuEnabled,
    gymSplits,
    submissionsMenuEnabled,
    submissionTypes,
    themeMode,
    bgAccentHex,
    levelTheme,
    navIconStyle,
    navIconSize,
    navBadgeColor,
    trainingTabIcon,
    beltBadgeFrameEnabled,
    bodyMeasurementsEnabled,
    bodyMeasurementTypes,
    pbExercises,
    gymExercises,
    gymSplitsDefault,
    friendGroups,
    friendGroupOf,
    submissionBingoEnabled,
    kampsportAdvancedSectionOpen,
    showSubmissionBingo,
    macroSettings,
    konditionPbDistances,
    showPbCard,
    showPbHistory,
    showDistributionStats,
    showCompareCard,
    showWeeklyChallenge,
    showMonthlyBarChart,
    showWeightStats,
    showWeightHistory,
    showWorkoutHistory,
    showCalorieHistoryList,
    showBodyMeasurementHistory,
    showFoodSearch,
    hapticsEnabled,
    soundEffectsEnabled,
    calorieGoal,
    showCalorieStats,
    showSubmissionStats,
    weightChartPeriod,
    leaderboardSize,
    leaderboardGenderFilter,
    activityLevel: calorieState.activity,
    unlockedAchievements,
    unlockedAchievementDates,
    logXp,
    xpAwardedDates,
    weeklyChallengeState,
    weeklyChallengeXp,
    weeklyChallengeHistory,
    weeklyMisc,
  };
}

function downloadJSON(payload, filenamePrefix) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const filename = `${filenamePrefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportDataBackup() {
  downloadJSON(buildDataPayload(), "traningslogg-data");
  showModalStatus("Data nedladdad till telefonens Filer/Nedladdningar.", "ok");
  markBackupDone();
  markWeeklyMiscFlag("backupExportedWeek");
}

function exportSettingsBackup() {
  downloadJSON(buildSettingsPayload(), "traningslogg-installningar");
  showModalStatus("Inställningar nedladdade till telefonens Filer/Nedladdningar.", "ok");
}

function toSheet(rows, emptyMessage) {
  if (!rows.length) return XLSX.utils.aoa_to_sheet([[emptyMessage]]);
  return XLSX.utils.json_to_sheet(rows);
}

function buildWorkoutExportRows() {
  return [...workoutEntries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
    const typeLabel = e.type === "Ovrigt" && e.customLabel ? e.customLabel : typeMeta(e.type).label;
    const submissionLabel = Array.isArray(e.submissions) && e.submissions.length
      ? e.submissions.map((id) => (submissionTypes.find((s) => s.id === id) || {}).label).filter(Boolean).join(", ")
      : "";
    const gymSplitLabel = e.gymSplit ? ((gymSplits.find((g) => g.id === e.gymSplit) || {}).text || "") : "";
    const ratingsLabel = e.ratings
      ? Object.entries(e.ratings).filter(([, val]) => val).map(([qid, val]) => {
          const q = advancedQuestions.find((qq) => qq.id === qid);
          return `${q ? q.title : qid}: ${val}/10`;
        }).join(", ")
      : "";
    return { date: e.date, type: typeLabel, minutes: e.minutes, note: e.note || "", gymSplit: gymSplitLabel, submissions: submissionLabel, ratings: ratingsLabel };
  });
}
function buildBodyMeasurementExportRows() {
  return [...bodyMeasurements].sort((a, b) => a.date.localeCompare(b.date)).map((m) => ({
    date: m.date,
    type: (bodyMeasurementTypes.find((t) => t.id === m.typeId) || {}).label || "?",
    value: m.value,
  }));
}
function buildPbExportRows() {
  return [...pbLog].sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({
    date: e.date,
    exercise: (pbExercises.find((p) => p.id === e.exerciseId) || {}).label || "?",
    value: e.value,
  }));
}
function buildKonditionPbExportRows() {
  return [...konditionPbLog].sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({
    date: e.date,
    distance: (konditionPbDistances.find((d) => d.id === e.distanceId) || {}).label || "?",
    type: e.type ? typeMeta(e.type).label : "",
    time: fmtMinSec(e.minutes),
  }));
}
function exportExcel() {
  if (typeof XLSX === "undefined") {
    showModalStatus("Kunde inte ladda Excel-biblioteket. Kontrollera internetanslutningen och försök igen.", "err");
    return;
  }
  const weightRows = [...weightEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ Datum: e.date, "Vikt (kg)": e.value }));

  const workoutRows = buildWorkoutExportRows().map((r) => ({
    Datum: r.date,
    Typ: r.type,
    Minuter: r.minutes,
    Kommentar: r.note,
    Gympass: r.gymSplit,
    Submissions: r.submissions,
    Betyg: r.ratings,
  }));

  const calorieRows = [...calorieLog]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ Datum: e.date, Typ: e.type === "burned" ? "Förbrukat" : "Ätit", Kcal: e.kcal }));

  const bmRows = buildBodyMeasurementExportRows().map((r) => ({ Datum: r.date, Mått: r.type, "Värde (cm)": r.value }));
  const pbRows = buildPbExportRows().map((r) => ({ Datum: r.date, Övning: r.exercise, PB: r.value }));
  const konditionPbRows = buildKonditionPbExportRows().map((r) => ({ Datum: r.date, Distans: r.distance, Typ: r.type, Tid: r.time }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, toSheet(weightRows, "Ingen viktdata ännu"), "Vikt");
  XLSX.utils.book_append_sheet(wb, toSheet(workoutRows, "Inga träningspass ännu"), "Träningspass");
  XLSX.utils.book_append_sheet(wb, toSheet(calorieRows, "Ingen kaloridata ännu"), "Kalorier");
  XLSX.utils.book_append_sheet(wb, toSheet(bmRows, "Inga kroppsmått ännu"), "Kroppsmått");
  XLSX.utils.book_append_sheet(wb, toSheet(pbRows, "Inga personbästa (gym) ännu"), "Personbästa Gym");
  XLSX.utils.book_append_sheet(wb, toSheet(konditionPbRows, "Inga personbästa (kondition) ännu"), "Personbästa Kondition");

  const now = new Date();
  const filename = `traningslogg-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.xlsx`;
  try {
    XLSX.writeFile(wb, filename);
    showModalStatus("Excel-fil nedladdad till telefonens Filer/Nedladdningar.", "ok");
  } catch (e) {
    showModalStatus("Kunde inte skapa Excel-filen.", "err");
  }
}

function csvEscape(val) {
  const s = String(val === undefined || val === null ? "" : val);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsvSection(title, headers, rows) {
  const lines = [title, headers.map(csvEscape).join(";")];
  rows.forEach((row) => lines.push(row.map(csvEscape).join(";")));
  return lines.join("\n");
}
function exportCsv() {
  const weightRows = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.value]);
  const workoutRows = buildWorkoutExportRows().map((r) => [r.date, r.type, r.minutes, r.note, r.gymSplit, r.submissions, r.ratings]);
  const calorieRows = [...calorieLog].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.type === "burned" ? "Förbrukat" : "Ätit", e.kcal]);
  const bmRows = buildBodyMeasurementExportRows().map((r) => [r.date, r.type, r.value]);
  const pbRows = buildPbExportRows().map((r) => [r.date, r.exercise, r.value]);
  const konditionPbRows = buildKonditionPbExportRows().map((r) => [r.date, r.distance, r.type, r.time]);

  const csv = [
    toCsvSection("VIKT", ["Datum", "Vikt (kg)"], weightRows),
    "",
    toCsvSection("TRÄNING", ["Datum", "Typ", "Minuter", "Kommentar", "Gympass", "Submissions", "Betyg"], workoutRows),
    "",
    toCsvSection("KALORIER", ["Datum", "Typ", "Kcal"], calorieRows),
    "",
    toCsvSection("KROPPSMÅTT", ["Datum", "Mått", "Värde (cm)"], bmRows),
    "",
    toCsvSection("PERSONBÄSTA GYM", ["Datum", "Övning", "PB"], pbRows),
    "",
    toCsvSection("PERSONBÄSTA KONDITION", ["Datum", "Distans", "Typ", "Tid"], konditionPbRows),
  ].join("\n");

  const now = new Date();
  const filename = `traningslogg-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;
  try {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showModalStatus("CSV-fil nedladdad till telefonens Filer/Nedladdningar.", "ok");
  } catch (e) {
    showModalStatus("Kunde inte skapa CSV-filen.", "err");
  }
}

function exportPdf() {
  const now = new Date();
  const totalMinutes = workoutEntries.reduce((s, e) => s + e.minutes, 0);
  const weightRows = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date));
  const workoutRows = buildWorkoutExportRows().reverse();
  const calorieDates = [...new Set(calorieLog.map((e) => e.date))].sort((a, b) => b.localeCompare(a));
  const bmRows = buildBodyMeasurementExportRows().reverse();
  const pbRows = buildPbExportRows().reverse();
  const konditionPbRows = buildKonditionPbExportRows().reverse();

  const win = window.open("", "_blank");
  if (!win) {
    showModalStatus("Kunde inte öppna utskriftsfönstret. Tillåt popup-fönster och försök igen.", "err");
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8">
      <title>Träningslogg — export</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; color: #14161C; padding: 24px; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #6B6F7A; font-size: 13px; margin-bottom: 24px; }
        h2 { font-size: 16px; margin-top: 28px; border-bottom: 2px solid #14161C; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; }
        th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #D8DBE0; }
        th { color: #6B6F7A; font-weight: 600; }
        .summary { display: flex; gap: 32px; margin: 12px 0 24px; }
        .summary div { font-size: 13px; }
        .summary b { font-size: 20px; display: block; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Träningslogg</h1>
      <div class="sub">Exporterad ${now.getDate()} ${MONTHS_SV[now.getMonth()]} ${now.getFullYear()}</div>
      <div class="summary">
        <div><b>${workoutRows.length}</b>Träningspass</div>
        <div><b>${fmtMinutes(totalMinutes)}</b>Total tränings­tid</div>
        <div><b>${weightRows.length}</b>Vikt­loggningar</div>
        <div><b>${calorieDates.length}</b>Kalori­dagar</div>
      </div>

      <h2>Träningspass</h2>
      <table>
        <tr><th>Datum</th><th>Typ</th><th>Minuter</th><th>Kommentar</th><th>Gympass</th><th>Submissions</th><th>Betyg</th></tr>
        ${workoutRows.map((r) => `<tr><td>${r.date}</td><td>${escapeHtml(r.type)}</td><td>${r.minutes}</td><td>${escapeHtml(r.note)}</td><td>${escapeHtml(r.gymSplit)}</td><td>${escapeHtml(r.submissions)}</td><td>${escapeHtml(r.ratings)}</td></tr>`).join("")}
      </table>

      <h2>Vikt</h2>
      <table>
        <tr><th>Datum</th><th>Vikt (kg)</th></tr>
        ${weightRows.map((e) => `<tr><td>${e.date}</td><td>${e.value}</td></tr>`).join("")}
      </table>

      <h2>Kalorier</h2>
      <table>
        <tr><th>Datum</th><th>Typ</th><th>Kcal</th></tr>
        ${[...calorieLog].sort((a, b) => b.date.localeCompare(a.date)).map((e) => `<tr><td>${e.date}</td><td>${e.type === "burned" ? "Förbrukat" : "Ätit"}</td><td>${e.kcal}</td></tr>`).join("")}
      </table>

      <h2>Kroppsmått</h2>
      <table>
        <tr><th>Datum</th><th>Mått</th><th>Värde (cm)</th></tr>
        ${bmRows.map((r) => `<tr><td>${r.date}</td><td>${escapeHtml(r.type)}</td><td>${r.value}</td></tr>`).join("")}
      </table>

      <h2>Personbästa — Gym</h2>
      <table>
        <tr><th>Datum</th><th>Övning</th><th>PB</th></tr>
        ${pbRows.map((r) => `<tr><td>${r.date}</td><td>${escapeHtml(r.exercise)}</td><td>${r.value}</td></tr>`).join("")}
      </table>

      <h2>Personbästa — Kondition</h2>
      <table>
        <tr><th>Datum</th><th>Distans</th><th>Typ</th><th>Tid</th></tr>
        ${konditionPbRows.map((r) => `<tr><td>${r.date}</td><td>${escapeHtml(r.distance)}</td><td>${escapeHtml(r.type)}</td><td>${r.time}</td></tr>`).join("")}
      </table>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

function importBackupFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== "object" || data.app !== "traningslogg") {
        throw new Error("Ogiltigt format");
      }
      let restoredSomething = false;
      if (Array.isArray(data.weightEntries)) {
        weightEntries = data.weightEntries.sort((a, b) => a.date.localeCompare(b.date));
        persistWeights();
        restoredSomething = true;
      }
      if (Array.isArray(data.workoutEntries)) {
        workoutEntries = data.workoutEntries.sort((a, b) => b.date.localeCompare(a.date));
        persistWorkouts();
        restoredSomething = true;
      }
      if (Array.isArray(data.calorieLog)) {
        calorieLog = data.calorieLog;
        persistCalorieLog();
        restoredSomething = true;
      }
      if (Array.isArray(data.bodyMeasurements)) {
        bodyMeasurements = data.bodyMeasurements;
        persistBodyMeasurements();
        restoredSomething = true;
      }
      if (Array.isArray(data.pbLog)) {
        pbLog = data.pbLog;
        persistPbLog();
        restoredSomething = true;
      }
      if (Array.isArray(data.konditionPbLog)) {
        konditionPbLog = data.konditionPbLog;
        persistKonditionPbLog();
        restoredSomething = true;
      }
      if (Array.isArray(data.foodFavorites)) {
        foodFavorites = data.foodFavorites;
        saveFoodFavorites();
        restoredSomething = true;
      }
      if (Array.isArray(data.savedMeals)) {
        savedMeals = data.savedMeals;
        saveSavedMeals();
        restoredSomething = true;
      }
      if (Array.isArray(data.gymSessionHistory)) {
        gymSessionHistory = data.gymSessionHistory;
        saveGymSessionHistory();
        restoredSomething = true;
      }
      if (data.activeGymSession && typeof data.activeGymSession === "object") {
        activeGymSession = data.activeGymSession;
        saveActiveGymSession();
        restoredSomething = true;
      }
      if (data.bingoCard && typeof data.bingoCard === "object") {
        bingoCard = data.bingoCard;
        saveBingoCard();
        restoredSomething = true;
      }
      if (Array.isArray(data.bingoHistory)) {
        bingoHistory = data.bingoHistory;
        saveBingoHistory();
        restoredSomething = true;
      }
      if (typeof data.bingoXp === "number") {
        bingoXp = data.bingoXp;
        saveBingoXp();
        restoredSomething = true;
      }
      if (data.bingoLifetimeStats && typeof data.bingoLifetimeStats === "object") {
        bingoLifetimeStats = data.bingoLifetimeStats;
        saveBingoLifetimeStats();
        restoredSomething = true;
      }
      if (Array.isArray(data.bgUnlockedAchievements)) {
        bgUnlockedAchievements = data.bgUnlockedAchievements;
        saveBgUnlockedAchievements();
        restoredSomething = true;
      }
      if (data.achievementPrestige && typeof data.achievementPrestige === "object") {
        achievementPrestige = data.achievementPrestige;
        saveAchievementPrestige();
        restoredSomething = true;
      }
      if (typeof data.prestigeXp === "number") {
        prestigeXp = data.prestigeXp;
        savePrestigeXp();
        restoredSomething = true;
      }
      if (data.prestigeBaseline && typeof data.prestigeBaseline === "object") {
        prestigeBaseline = data.prestigeBaseline;
        savePrestigeBaseline();
        restoredSomething = true;
      }
      if (data.prestigeConsumedIds && typeof data.prestigeConsumedIds === "object") {
        prestigeConsumedIds = data.prestigeConsumedIds;
        savePrestigeConsumedIds();
        restoredSomething = true;
      }
      if (data.prestigeStreakResetAt && typeof data.prestigeStreakResetAt === "object") {
        prestigeStreakResetAt = data.prestigeStreakResetAt;
        savePrestigeStreakResetAt();
        restoredSomething = true;
      }
      if (Array.isArray(data.trainingTypes) && data.trainingTypes.length) {
        trainingTypes = data.trainingTypes;
        saveTrainingTypes();
        rebuildTypes();
        restoredSomething = true;
      }
      if (data.tabColors && typeof data.tabColors === "object") {
        tabColors = { ...TAB_COLOR_DEFAULTS, ...data.tabColors };
        saveTabColors();
        restoredSomething = true;
      }
      if (data.navGlowColors && typeof data.navGlowColors === "object") {
        navGlowColors = { ...TAB_COLOR_DEFAULTS, ...data.navGlowColors };
        saveNavGlowColors();
        restoredSomething = true;
      }
      if (typeof data.showNavLabels === "boolean") {
        showNavLabels = data.showNavLabels;
        saveShowNavLabels();
        restoredSomething = true;
      }
      if (Array.isArray(data.tabOrder) && data.tabOrder.length === DEFAULT_TAB_ORDER.length &&
          DEFAULT_TAB_ORDER.every((k) => data.tabOrder.includes(k))) {
        tabOrder = data.tabOrder;
        saveTabOrder();
        rebuildTabs();
        restoredSomething = true;
      }
      if (data.quickPresets && Array.isArray(data.quickPresets.eaten) && Array.isArray(data.quickPresets.burned)) {
        quickPresets = data.quickPresets;
        saveQuickPresets();
        restoredSomething = true;
      }
      if (data.profile && typeof data.profile === "object") {
        profile = { name: "", age: "38", height: "182", gender: "man", ...data.profile };
        saveProfile();
        restoredSomething = true;
      }
      if (typeof data.advancedMenuEnabled === "boolean") {
        advancedMenuEnabled = data.advancedMenuEnabled;
        saveAdvancedMenuEnabled();
        restoredSomething = true;
      }
      if (Array.isArray(data.advancedQuestions) && data.advancedQuestions.length) {
        advancedQuestions = data.advancedQuestions;
        saveAdvancedQuestions();
        restoredSomething = true;
      }
      if (typeof data.gymMenuEnabled === "boolean") {
        gymMenuEnabled = data.gymMenuEnabled;
        saveGymMenuEnabled();
        restoredSomething = true;
      }
      if (typeof data.konditionMenuEnabled === "boolean") {
        konditionMenuEnabled = data.konditionMenuEnabled;
        saveKonditionMenuEnabled();
        restoredSomething = true;
      }
      if (Array.isArray(data.gymSplits) && data.gymSplits.length) {
        gymSplits = data.gymSplits;
        saveGymSplits();
        restoredSomething = true;
      }
      if (typeof data.submissionsMenuEnabled === "boolean") {
        submissionsMenuEnabled = data.submissionsMenuEnabled;
        saveSubmissionsMenuEnabled();
        restoredSomething = true;
      }
      if (Array.isArray(data.submissionTypes) && data.submissionTypes.length) {
        submissionTypes = data.submissionTypes;
        saveSubmissionTypes();
        restoredSomething = true;
      }
      if (data.themeMode === "dark" || data.themeMode === "light") {
        themeMode = data.themeMode;
        saveThemeMode();
        applyTheme();
        restoredSomething = true;
      }
      if (data.bgAccentHex === null || typeof data.bgAccentHex === "string") {
        bgAccentHex = data.bgAccentHex;
        saveBgAccentHex();
        applyBgTint();
        restoredSomething = true;
      }
      if (data.levelTheme === "belt" || data.levelTheme === "fitness" || data.levelTheme === "gym" || data.levelTheme === "run") {
        levelTheme = data.levelTheme;
        saveLevelTheme();
        restoredSomething = true;
      }
      if (data.navIconStyle === "icons" || data.navIconStyle === "images" || data.navIconStyle === "emblem") {
        navIconStyle = data.navIconStyle;
        saveNavIconStyle();
        restoredSomething = true;
      }
      if (data.navIconSize === "tiny" || data.navIconSize === "small" || data.navIconSize === "large") {
        navIconSize = data.navIconSize;
        saveNavIconSize();
        restoredSomething = true;
      }
      if (typeof data.navBadgeColor === "string") {
        navBadgeColor = data.navBadgeColor;
        saveNavBadgeColor();
        restoredSomething = true;
      }
      {
        const migratedTTI = data.trainingTabIcon === "run" ? "runBlue" : data.trainingTabIcon;
        if (migratedTTI === null || Object.keys(TRAINING_TAB_ICON_CHOICES).includes(migratedTTI)) {
          trainingTabIcon = migratedTTI;
          saveTrainingTabIcon();
          restoredSomething = true;
        }
      }
      if (typeof data.beltBadgeFrameEnabled === "boolean") {
        beltBadgeFrameEnabled = data.beltBadgeFrameEnabled;
        saveBeltBadgeFrameEnabled();
        restoredSomething = true;
      }
      if (typeof data.bodyMeasurementsEnabled === "boolean") {
        bodyMeasurementsEnabled = data.bodyMeasurementsEnabled;
        saveBodyMeasurementsEnabled();
        restoredSomething = true;
      }
      if (Array.isArray(data.bodyMeasurementTypes) && data.bodyMeasurementTypes.length) {
        bodyMeasurementTypes = data.bodyMeasurementTypes;
        saveBodyMeasurementTypes();
        restoredSomething = true;
      }
      if (Array.isArray(data.pbExercises) && data.pbExercises.length) {
        pbExercises = data.pbExercises;
        savePbExercises();
        restoredSomething = true;
      }
      if (data.gymExercises && typeof data.gymExercises === "object") {
        gymExercises = data.gymExercises;
        saveGymExercises();
        restoredSomething = true;
      }
      if (typeof data.submissionBingoEnabled === "boolean") {
        submissionBingoEnabled = data.submissionBingoEnabled;
        saveSubmissionBingoEnabled();
        restoredSomething = true;
      }
      if (typeof data.kampsportAdvancedSectionOpen === "boolean") {
        kampsportAdvancedSectionOpen = data.kampsportAdvancedSectionOpen;
        saveKampsportAdvancedSectionOpen();
        restoredSomething = true;
      }
      if (typeof data.showSubmissionBingo === "boolean") {
        showSubmissionBingo = data.showSubmissionBingo;
        saveShowSubmissionBingo();
        restoredSomething = true;
      }
      if (data.macroSettings && typeof data.macroSettings === "object") {
        macroSettings = { protein: normalizeMacroSetting("protein", data.macroSettings.protein),
          fat: normalizeMacroSetting("fat", data.macroSettings.fat),
          carbs: normalizeMacroSetting("carbs", data.macroSettings.carbs) };
        saveMacroSettings();
        restoredSomething = true;
      }
      if (Array.isArray(data.konditionPbDistances) && data.konditionPbDistances.length) {
        konditionPbDistances = data.konditionPbDistances;
        saveKonditionPbDistances();
        restoredSomething = true;
      }
      if (typeof data.showPbCard === "boolean") {
        showPbCard = data.showPbCard;
        saveShowPbCard();
        restoredSomething = true;
      }
      if (typeof data.showPbHistory === "boolean") {
        showPbHistory = data.showPbHistory;
        saveShowPbHistory();
        restoredSomething = true;
      }
      if (typeof data.showDistributionStats === "boolean") {
        showDistributionStats = data.showDistributionStats;
        saveShowDistributionStats();
        restoredSomething = true;
      }
      if (typeof data.showCompareCard === "boolean") {
        showCompareCard = data.showCompareCard;
        saveShowCompareCard();
        restoredSomething = true;
      }
      if (typeof data.showWeeklyChallenge === "boolean") {
        showWeeklyChallenge = data.showWeeklyChallenge;
        saveShowWeeklyChallenge();
        restoredSomething = true;
      }
      if (typeof data.showMonthlyBarChart === "boolean") {
        showMonthlyBarChart = data.showMonthlyBarChart;
        saveShowMonthlyBarChart();
        restoredSomething = true;
      }
      if (typeof data.showWeightStats === "boolean") {
        showWeightStats = data.showWeightStats;
        saveShowWeightStats();
        restoredSomething = true;
      }
      if (typeof data.showWeightHistory === "boolean") {
        showWeightHistory = data.showWeightHistory;
        saveShowWeightHistory();
        restoredSomething = true;
      }
      if (typeof data.showWorkoutHistory === "boolean") {
        showWorkoutHistory = data.showWorkoutHistory;
        saveShowWorkoutHistory();
        restoredSomething = true;
      }
      if (typeof data.showCalorieHistoryList === "boolean") {
        showCalorieHistoryList = data.showCalorieHistoryList;
        saveShowCalorieHistoryList();
        restoredSomething = true;
      }
      if (typeof data.showBodyMeasurementHistory === "boolean") {
        showBodyMeasurementHistory = data.showBodyMeasurementHistory;
        saveShowBodyMeasurementHistory();
        restoredSomething = true;
      }
      if (typeof data.showFoodSearch === "boolean") {
        showFoodSearch = data.showFoodSearch;
        saveShowFoodSearch();
        restoredSomething = true;
      }
      if (typeof data.soundEffectsEnabled === "boolean") {
        soundEffectsEnabled = data.soundEffectsEnabled;
        saveSoundEffects();
        restoredSomething = true;
      }
      if (typeof data.hapticsEnabled === "boolean") {
        hapticsEnabled = data.hapticsEnabled;
        saveHaptics();
        restoredSomething = true;
      }
      if (data.calorieGoal === "lose" || data.calorieGoal === "maintain" || data.calorieGoal === "gain") {
        calorieGoal = data.calorieGoal;
        saveCalorieGoal();
        restoredSomething = true;
      }
      if (typeof data.showCalorieStats === "boolean") {
        showCalorieStats = data.showCalorieStats;
        saveShowCalorieStats();
        restoredSomething = true;
      }
      if (typeof data.showSubmissionStats === "boolean") {
        showSubmissionStats = data.showSubmissionStats;
        saveShowSubmissionStats();
        restoredSomething = true;
      }
      if (typeof data.weightChartPeriod === "string") {
        weightChartPeriod = data.weightChartPeriod;
        saveWeightChartPeriod();
        restoredSomething = true;
      }
      if (typeof data.activityLevel === "string" && ACTIVITY_LEVELS.some((l) => l.key === data.activityLevel)) {
        calorieState.activity = data.activityLevel;
        saveActivityLevel();
        restoredSomething = true;
      }
      if (Array.isArray(data.unlockedAchievements)) {
        unlockedAchievements = data.unlockedAchievements.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
        saveUnlockedAchievements();
        restoredSomething = true;
      }
      if (data.unlockedAchievementDates && typeof data.unlockedAchievementDates === "object") {
        unlockedAchievementDates = data.unlockedAchievementDates;
        saveUnlockedAchievementDates();
        restoredSomething = true;
      }
      if (typeof data.logXp === "number") {
        logXp = data.logXp;
        saveLogXp();
        restoredSomething = true;
      }
      if (data.xpAwardedDates && typeof data.xpAwardedDates === "object") {
        xpAwardedDates = {
          weight: Array.isArray(data.xpAwardedDates.weight) ? data.xpAwardedDates.weight : [],
          calorie: Array.isArray(data.xpAwardedDates.calorie) ? data.xpAwardedDates.calorie : [],
          training: Array.isArray(data.xpAwardedDates.training) ? data.xpAwardedDates.training : [],
        };
        saveXpAwardedDates();
        restoredSomething = true;
      }
      if (data.weeklyChallengeState && typeof data.weeklyChallengeState === "object") {
        weeklyChallengeState = data.weeklyChallengeState;
        saveWeeklyChallengeState();
        restoredSomething = true;
      }
      if (typeof data.weeklyChallengeXp === "number") {
        weeklyChallengeXp = data.weeklyChallengeXp;
        saveWeeklyChallengeXp();
        restoredSomething = true;
      }
      if (Array.isArray(data.weeklyChallengeHistory)) {
        weeklyChallengeHistory = data.weeklyChallengeHistory;
        saveWeeklyChallengeHistory();
        restoredSomething = true;
      }
      if (data.weeklyMisc && typeof data.weeklyMisc === "object") {
        weeklyMisc = data.weeklyMisc;
        saveWeeklyMisc();
        restoredSomething = true;
      }
      if (!restoredSomething) throw new Error("Tom fil");
      showModalStatus("Data återställd från backup.", "ok");
      render();
    } catch (e) {
      showModalStatus("Kunde inte läsa filen. Är det en giltig backup-fil?", "err");
    }
  };
  reader.onerror = () => showModalStatus("Kunde inte läsa filen.", "err");
  reader.readAsText(file);
}

/* ---------------- Molnsynk (Supabase) ----------------
   Appen fungerar helt offline som vanligt (localStorage är alltid källan för
   det appen visar). Är man inloggad speglas ändringar till Supabase i
   bakgrunden (debounced), och vid inloggning hämtas + slås ihop molndata
   med det som redan finns lokalt (aldrig en tyst överskrivning). */

const SUPABASE_URL = "https://dszhpntctnsbrytdpntx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2fnrX5rbYoEJ2Q_bhrHvLQ_fyhG3BWy";
// Dit Supabase skickar tillbaka användaren efter e-postbekräftelse och
// lösenordsåterställning. Måste matcha en URL i Supabase Auth ->
// URL Configuration -> Redirect URLs, annars visas "sidan kan inte visas".
const SITE_URL = "https://mattiasoman88.github.io/WorkoutTracker/";
const supabaseClient = (typeof window !== "undefined" && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

let authUser = null; // { id, email } | null
let cloudSyncStatus = "offline"; // "offline" | "idle" | "syncing" | "pending" | "error"
let cloudSyncErrorMsg = "";
let cloudSyncTimer = null;
let cloudSyncInFlight = false;
let cloudSyncQueuedWhileInFlight = false;

function loadLocalStateUpdatedAt() {
  try { const raw = localStorage.getItem("local_state_updated_at"); return raw ? Number(raw) : 0; } catch (e) { return 0; }
}
function bumpLocalStateUpdatedAt() {
  const now = Date.now();
  try { localStorage.setItem("local_state_updated_at", String(now)); } catch (e) { /* ignore */ }
  return now;
}
let localStateUpdatedAt = loadLocalStateUpdatedAt();

function mergeArrayById(localArr, remoteArr) {
  const local = Array.isArray(localArr) ? localArr : [];
  const remote = Array.isArray(remoteArr) ? remoteArr : [];
  const byId = new Map();
  local.forEach((e) => { if (e && e.id != null) byId.set(e.id, e); });
  remote.forEach((e) => { if (e && e.id != null && !byId.has(e.id)) byId.set(e.id, e); });
  return Array.from(byId.values());
}
// Som mergeArrayById, men för poster utan ett riktigt id-fält - keyFn
// bestämmer vad som räknas som samma post (t.ex. startdatum för en
// bingo-cykel, eller namn+kcal100 för en favoritmatvara).
function mergeArrayByKey(localArr, remoteArr, keyFn) {
  const local = Array.isArray(localArr) ? localArr : [];
  const remote = Array.isArray(remoteArr) ? remoteArr : [];
  const byKey = new Map();
  local.forEach((e) => { const k = e && keyFn(e); if (k != null) byKey.set(k, e); });
  remote.forEach((e) => { const k = e && keyFn(e); if (k != null && !byKey.has(k)) byKey.set(k, e); });
  return Array.from(byKey.values());
}
function mergeArrayStructural(localArr, remoteArr) {
  const local = Array.isArray(localArr) ? localArr : [];
  const remote = Array.isArray(remoteArr) ? remoteArr : [];
  const seen = new Set(local.map((e) => JSON.stringify(e)));
  const merged = [...local];
  remote.forEach((e) => {
    const key = JSON.stringify(e);
    if (!seen.has(key)) { seen.add(key); merged.push(e); }
  });
  return merged;
}
function mergeStringArrayUnion(localArr, remoteArr) {
  const local = Array.isArray(localArr) ? localArr : [];
  const remote = Array.isArray(remoteArr) ? remoteArr : [];
  return Array.from(new Set([...local, ...remote]));
}

function buildFullSyncPayload() {
  // Alla historik-listorna synkas numera via sina egna tabeller, inte som en
  // del av den här JSON-klumpen - se push*ToCloud()-funktionerna nedan. De
  // exkluderas härifrån (men finns kvar i buildDataPayload() själv, som
  // fortfarande används av den lokala backup-export/importen). Kvar i
  // klumpen: inställningar/konfiguration samt "ögonblicksbild"-state
  // (pågående gympass, aktivt bingo-kort, XP-räknare, prestige) - inget av
  // det är historik-listor så det vinner inget på egna tabeller.
  const {
    weightEntries: _skipWeightEntries,
    workoutEntries: _skipWorkoutEntries,
    calorieLog: _skipCalorieLog,
    bodyMeasurements: _skipBodyMeasurements,
    pbLog: _skipPbLog,
    konditionPbLog: _skipKonditionPbLog,
    gymSessionHistory: _skipGymSessionHistory,
    bingoHistory: _skipBingoHistory,
    savedMeals: _skipSavedMeals,
    foodFavorites: _skipFoodFavorites,
    ...dataRest
  } = buildDataPayload();
  // weeklyChallengeHistory ligger i settings-payloaden (inte data-payloaden)
  // men synkas numera också via sin egen tabell - samma resonemang som ovan.
  const { weeklyChallengeHistory: _skipWeeklyChallengeHistory, ...settingsRest } = buildSettingsPayload();
  return {
    app: "traningslogg",
    kind: "cloud_sync",
    localUpdatedAt: localStateUpdatedAt,
    ...dataRest,
    ...settingsRest,
  };
}

// Slår ihop moln-data med lokal data. Historik (pass, vikt, kalorier osv)
// slås ALDRIG bort — union av båda sidorna. XP-liknande tal tar det högsta
// värdet (XP ska aldrig kunna minska). "Ögonblicksbild"-inställningar
// (färger, flikordning, egna typer m.m.) avgörs av vilken sida som ändrats
// senast, sedan senaste synk.
function mergeRemoteStateIntoLocal(remote) {
  if (!remote || typeof remote !== "object") return;

  // Vikt skickas inte längre i den här klumpen (se pushWeightEntriesToCloud/
  // weight_entries-tabellen), men raden nedan lämnas kvar med flit: om
  // användaren senast synkade från en äldre appversion ligger vikten
  // fortfarande inbäddad i molnets gamla data-fält, och detta fångar upp
  // den lokalt innan den skrivs över av den nya, städade klumpen.
  if (Array.isArray(remote.weightEntries)) { weightEntries = mergeArrayById(weightEntries, remote.weightEntries).sort((a, b) => a.date.localeCompare(b.date)); persistWeights(); }
  // Samma resonemang som för vikt ovan - lämnas kvar för att fånga upp ev.
  // gammal träningspass-data som ligger kvar inbäddad från en äldre version.
  if (Array.isArray(remote.workoutEntries)) { workoutEntries = mergeArrayById(workoutEntries, remote.workoutEntries).sort((a, b) => b.date.localeCompare(a.date)); persistWorkouts(); }
  // Samma resonemang som för vikt/pass ovan - lämnas kvar för att fånga upp
  // ev. gammal kalorilogg/kroppsmått-data som ligger kvar inbäddad från en
  // äldre version.
  if (Array.isArray(remote.calorieLog)) { calorieLog = mergeArrayById(calorieLog, remote.calorieLog); persistCalorieLog(); }
  if (Array.isArray(remote.bodyMeasurements)) { bodyMeasurements = mergeArrayById(bodyMeasurements, remote.bodyMeasurements); persistBodyMeasurements(); }
  // Samma resonemang som för vikt/pass/kalorier/mått ovan - lämnas kvar för
  // att fånga upp ev. gammal data som ligger kvar inbäddad från en äldre
  // version, för alla listor som nu har egna tabeller.
  if (Array.isArray(remote.pbLog)) { pbLog = mergeArrayById(pbLog, remote.pbLog); persistPbLog(); }
  if (Array.isArray(remote.konditionPbLog)) { konditionPbLog = mergeArrayById(konditionPbLog, remote.konditionPbLog); persistKonditionPbLog(); }
  if (Array.isArray(remote.savedMeals)) { savedMeals = mergeArrayById(savedMeals, remote.savedMeals); saveSavedMeals(); }
  if (Array.isArray(remote.foodFavorites)) { foodFavorites = mergeArrayStructural(foodFavorites, remote.foodFavorites); saveFoodFavorites(); }
  if (Array.isArray(remote.gymSessionHistory)) { gymSessionHistory = mergeArrayStructural(gymSessionHistory, remote.gymSessionHistory); saveGymSessionHistory(); }
  if (Array.isArray(remote.bingoHistory)) { bingoHistory = mergeArrayStructural(bingoHistory, remote.bingoHistory); saveBingoHistory(); }
  if (Array.isArray(remote.weeklyChallengeHistory)) { weeklyChallengeHistory = mergeArrayStructural(weeklyChallengeHistory, remote.weeklyChallengeHistory); saveWeeklyChallengeHistory(); }

  if (Array.isArray(remote.bgUnlockedAchievements)) { bgUnlockedAchievements = mergeStringArrayUnion(bgUnlockedAchievements, remote.bgUnlockedAchievements); saveBgUnlockedAchievements(); }
  if (Array.isArray(remote.unlockedAchievements)) {
    unlockedAchievements = mergeStringArrayUnion(unlockedAchievements, remote.unlockedAchievements).filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
    saveUnlockedAchievements();
  }

  if (typeof remote.prestigeXp === "number") { prestigeXp = Math.max(prestigeXp || 0, remote.prestigeXp); savePrestigeXp(); }
  if (typeof remote.bingoXp === "number") { bingoXp = Math.max(bingoXp || 0, remote.bingoXp); saveBingoXp(); }
  if (typeof remote.logXp === "number") { logXp = Math.max(logXp || 0, remote.logXp); saveLogXp(); }
  if (typeof remote.weeklyChallengeXp === "number") { weeklyChallengeXp = Math.max(weeklyChallengeXp || 0, remote.weeklyChallengeXp); saveWeeklyChallengeXp(); }

  const remoteWins = typeof remote.localUpdatedAt === "number" && remote.localUpdatedAt > localStateUpdatedAt;
  if (remoteWins) {
    if (remote.activeGymSession && typeof remote.activeGymSession === "object") { activeGymSession = remote.activeGymSession; saveActiveGymSession(); }
    if (remote.bingoCard && typeof remote.bingoCard === "object") { bingoCard = remote.bingoCard; saveBingoCard(); }
    if (remote.bingoLifetimeStats && typeof remote.bingoLifetimeStats === "object") { bingoLifetimeStats = remote.bingoLifetimeStats; saveBingoLifetimeStats(); }
    if (remote.achievementPrestige && typeof remote.achievementPrestige === "object") { achievementPrestige = remote.achievementPrestige; saveAchievementPrestige(); }
    if (remote.prestigeBaseline && typeof remote.prestigeBaseline === "object") { prestigeBaseline = remote.prestigeBaseline; savePrestigeBaseline(); }
    if (remote.prestigeConsumedIds && typeof remote.prestigeConsumedIds === "object") { prestigeConsumedIds = remote.prestigeConsumedIds; savePrestigeConsumedIds(); }
    if (remote.prestigeStreakResetAt && typeof remote.prestigeStreakResetAt === "object") { prestigeStreakResetAt = remote.prestigeStreakResetAt; savePrestigeStreakResetAt(); }
    if (remote.unlockedAchievementDates && typeof remote.unlockedAchievementDates === "object") { unlockedAchievementDates = remote.unlockedAchievementDates; saveUnlockedAchievementDates(); }
    if (remote.xpAwardedDates && typeof remote.xpAwardedDates === "object") {
      xpAwardedDates = {
        weight: Array.isArray(remote.xpAwardedDates.weight) ? remote.xpAwardedDates.weight : [],
        calorie: Array.isArray(remote.xpAwardedDates.calorie) ? remote.xpAwardedDates.calorie : [],
        training: Array.isArray(remote.xpAwardedDates.training) ? remote.xpAwardedDates.training : [],
      };
      saveXpAwardedDates();
    }
    if (remote.weeklyChallengeState && typeof remote.weeklyChallengeState === "object") { weeklyChallengeState = remote.weeklyChallengeState; saveWeeklyChallengeState(); }
    if (remote.weeklyMisc && typeof remote.weeklyMisc === "object") { weeklyMisc = remote.weeklyMisc; saveWeeklyMisc(); }

    if (Array.isArray(remote.trainingTypes) && remote.trainingTypes.length) { trainingTypes = remote.trainingTypes; saveTrainingTypes(); rebuildTypes(); }
    if (remote.tabColors && typeof remote.tabColors === "object") { tabColors = { ...TAB_COLOR_DEFAULTS, ...remote.tabColors }; saveTabColors(); }
    if (remote.navGlowColors && typeof remote.navGlowColors === "object") { navGlowColors = { ...TAB_COLOR_DEFAULTS, ...remote.navGlowColors }; saveNavGlowColors(); }
    if (typeof remote.showNavLabels === "boolean") { showNavLabels = remote.showNavLabels; saveShowNavLabels(); }
    if (Array.isArray(remote.tabOrder) && remote.tabOrder.length === DEFAULT_TAB_ORDER.length && DEFAULT_TAB_ORDER.every((k) => remote.tabOrder.includes(k))) { tabOrder = remote.tabOrder; saveTabOrder(); rebuildTabs(); }
    if (remote.quickPresets && Array.isArray(remote.quickPresets.eaten) && Array.isArray(remote.quickPresets.burned)) { quickPresets = remote.quickPresets; saveQuickPresets(); }
    if (remote.profile && typeof remote.profile === "object") { profile = { name: "", age: "38", height: "182", gender: "man", ...remote.profile }; saveProfile(); }
    if (typeof remote.advancedMenuEnabled === "boolean") { advancedMenuEnabled = remote.advancedMenuEnabled; saveAdvancedMenuEnabled(); }
    if (Array.isArray(remote.advancedQuestions) && remote.advancedQuestions.length) { advancedQuestions = remote.advancedQuestions; saveAdvancedQuestions(); }
    if (typeof remote.gymMenuEnabled === "boolean") { gymMenuEnabled = remote.gymMenuEnabled; saveGymMenuEnabled(); }
    if (typeof remote.konditionMenuEnabled === "boolean") { konditionMenuEnabled = remote.konditionMenuEnabled; saveKonditionMenuEnabled(); }
    if (Array.isArray(remote.gymSplits) && remote.gymSplits.length) { gymSplits = remote.gymSplits; saveGymSplits(); }
    if (typeof remote.submissionsMenuEnabled === "boolean") { submissionsMenuEnabled = remote.submissionsMenuEnabled; saveSubmissionsMenuEnabled(); }
    if (Array.isArray(remote.submissionTypes) && remote.submissionTypes.length) { submissionTypes = migrateSubmissionTypesList(remote.submissionTypes); saveSubmissionTypes(); }
    if (remote.themeMode === "dark" || remote.themeMode === "light") { themeMode = remote.themeMode; saveThemeMode(); applyTheme(); }
    if (remote.bgAccentHex === null || typeof remote.bgAccentHex === "string") { bgAccentHex = remote.bgAccentHex; saveBgAccentHex(); applyBgTint(); }
    if (remote.levelTheme === "belt" || remote.levelTheme === "fitness" || remote.levelTheme === "gym" || remote.levelTheme === "run") { levelTheme = remote.levelTheme; saveLevelTheme(); }
    if (remote.navIconStyle === "icons" || remote.navIconStyle === "images" || remote.navIconStyle === "emblem") { navIconStyle = remote.navIconStyle; saveNavIconStyle(); }
    if (remote.navIconSize === "tiny" || remote.navIconSize === "small" || remote.navIconSize === "large") { navIconSize = remote.navIconSize; saveNavIconSize(); }
    if (typeof remote.navBadgeColor === "string") { navBadgeColor = remote.navBadgeColor; saveNavBadgeColor(); }
    { const migratedRemoteTTI = remote.trainingTabIcon === "run" ? "runBlue" : remote.trainingTabIcon; if (migratedRemoteTTI === null || Object.keys(TRAINING_TAB_ICON_CHOICES).includes(migratedRemoteTTI)) { trainingTabIcon = migratedRemoteTTI; saveTrainingTabIcon(); } }
    if (typeof remote.beltBadgeFrameEnabled === "boolean") { beltBadgeFrameEnabled = remote.beltBadgeFrameEnabled; saveBeltBadgeFrameEnabled(); }
    if (typeof remote.bodyMeasurementsEnabled === "boolean") { bodyMeasurementsEnabled = remote.bodyMeasurementsEnabled; saveBodyMeasurementsEnabled(); }
    if (Array.isArray(remote.bodyMeasurementTypes) && remote.bodyMeasurementTypes.length) { bodyMeasurementTypes = remote.bodyMeasurementTypes; saveBodyMeasurementTypes(); }
    if (Array.isArray(remote.pbExercises) && remote.pbExercises.length) { pbExercises = migratePbExercisesList(remote.pbExercises); savePbExercises(); }
    if (remote.gymSplitsDefault && typeof remote.gymSplitsDefault === "object") { gymSplitsDefault = remote.gymSplitsDefault; saveGymSplitsDefaultToStorage(); }
    if (Array.isArray(remote.friendGroups) && remote.friendGroups.length) { friendGroups = remote.friendGroups; saveFriendGroups(); }
    if (remote.friendGroupOf && typeof remote.friendGroupOf === "object") { friendGroupOf = remote.friendGroupOf; saveFriendGroupOf(); }
    if (remote.gymExercises && typeof remote.gymExercises === "object") { gymExercises = remote.gymExercises; saveGymExercises(); }
    if (typeof remote.submissionBingoEnabled === "boolean") { submissionBingoEnabled = remote.submissionBingoEnabled; saveSubmissionBingoEnabled(); }
    if (typeof remote.kampsportAdvancedSectionOpen === "boolean") { kampsportAdvancedSectionOpen = remote.kampsportAdvancedSectionOpen; saveKampsportAdvancedSectionOpen(); }
    if (typeof remote.showSubmissionBingo === "boolean") { showSubmissionBingo = remote.showSubmissionBingo; saveShowSubmissionBingo(); }
    if (remote.macroSettings && typeof remote.macroSettings === "object") {
      macroSettings = {
        protein: normalizeMacroSetting("protein", remote.macroSettings.protein),
        fat: normalizeMacroSetting("fat", remote.macroSettings.fat),
        carbs: normalizeMacroSetting("carbs", remote.macroSettings.carbs),
      };
      saveMacroSettings();
    }
    if (Array.isArray(remote.konditionPbDistances) && remote.konditionPbDistances.length) { konditionPbDistances = remote.konditionPbDistances; saveKonditionPbDistances(); }
    if (typeof remote.showPbCard === "boolean") { showPbCard = remote.showPbCard; saveShowPbCard(); }
    if (typeof remote.showPbHistory === "boolean") { showPbHistory = remote.showPbHistory; saveShowPbHistory(); }
    if (typeof remote.showDistributionStats === "boolean") { showDistributionStats = remote.showDistributionStats; saveShowDistributionStats(); }
    if (typeof remote.showCompareCard === "boolean") { showCompareCard = remote.showCompareCard; saveShowCompareCard(); }
    if (typeof remote.showWeeklyChallenge === "boolean") { showWeeklyChallenge = remote.showWeeklyChallenge; saveShowWeeklyChallenge(); }
    if (typeof remote.showMonthlyBarChart === "boolean") { showMonthlyBarChart = remote.showMonthlyBarChart; saveShowMonthlyBarChart(); }
    if (typeof remote.showWeightStats === "boolean") { showWeightStats = remote.showWeightStats; saveShowWeightStats(); }
    if (typeof remote.showWeightHistory === "boolean") { showWeightHistory = remote.showWeightHistory; saveShowWeightHistory(); }
    if (typeof remote.showWorkoutHistory === "boolean") { showWorkoutHistory = remote.showWorkoutHistory; saveShowWorkoutHistory(); }
    if (typeof remote.showCalorieHistoryList === "boolean") { showCalorieHistoryList = remote.showCalorieHistoryList; saveShowCalorieHistoryList(); }
    if (typeof remote.showBodyMeasurementHistory === "boolean") { showBodyMeasurementHistory = remote.showBodyMeasurementHistory; saveShowBodyMeasurementHistory(); }
    if (typeof remote.showFoodSearch === "boolean") { showFoodSearch = remote.showFoodSearch; saveShowFoodSearch(); }
    if (typeof remote.hapticsEnabled === "boolean") { hapticsEnabled = remote.hapticsEnabled; saveHaptics(); }
    if (typeof remote.soundEffectsEnabled === "boolean") { soundEffectsEnabled = remote.soundEffectsEnabled; saveSoundEffects(); }
    if (remote.calorieGoal === "lose" || remote.calorieGoal === "maintain" || remote.calorieGoal === "gain") { calorieGoal = remote.calorieGoal; saveCalorieGoal(); }
    if ([10, 15, 20, 30, 50].includes(remote.leaderboardSize)) { leaderboardSize = remote.leaderboardSize; saveLeaderboardSize(); }
    if (remote.leaderboardGenderFilter === "all" || remote.leaderboardGenderFilter === "man" || remote.leaderboardGenderFilter === "kvinna") { leaderboardGenderFilter = remote.leaderboardGenderFilter; saveLeaderboardGenderFilter(); }
    if (typeof remote.showCalorieStats === "boolean") { showCalorieStats = remote.showCalorieStats; saveShowCalorieStats(); }
    if (typeof remote.showSubmissionStats === "boolean") { showSubmissionStats = remote.showSubmissionStats; saveShowSubmissionStats(); }
    if (typeof remote.weightChartPeriod === "string") { weightChartPeriod = remote.weightChartPeriod; saveWeightChartPeriod(); }
    if (typeof remote.activityLevel === "string" && ACTIVITY_LEVELS.some((l) => l.key === remote.activityLevel)) { calorieState.activity = remote.activityLevel; saveActivityLevel(); }
  }

  localStateUpdatedAt = bumpLocalStateUpdatedAt();
  checkAchievements();
  render();
}

// Generisk avstämning för tabeller med en enkel unik nyckelkolumn (antingen
// "id", eller ett naturligt unikt datum som "start_date"/"week_start" för de
// listor som saknar ett riktigt klient-id). Upsertar alla lokala rader och
// tar sedan bort molnrader som saknar en lokal motsvarighet.
async function reconcileSingleKeyTable(table, keyCol, rows, localKeyValues) {
  if (!supabaseClient || !authUser) return;
  if (rows.length) {
    const { error } = await supabaseClient.from(table).upsert(rows, { onConflict: `user_id,${keyCol}` });
    if (error) throw error;
  }
  let delQuery = supabaseClient.from(table).delete().eq("user_id", authUser.id);
  if (localKeyValues.length) delQuery = delQuery.not(keyCol, "in", `(${localKeyValues.join(",")})`);
  const { error: delError } = await delQuery;
  if (delError) throw delError;
}

function cloudSyncStatusLabel() {
  if (!authUser) return "Inte inloggad";
  switch (cloudSyncStatus) {
    case "syncing": return "Synkar...";
    case "pending": return "Väntar på synk...";
    case "error": return `Synkfel: ${cloudSyncErrorMsg}`;
    default: return "Synkroniserad";
  }
}
function renderSyncStatusIfVisible() {
  const el = document.getElementById("cloudSyncStatusText");
  if (el) el.textContent = cloudSyncStatusLabel();
}

// Vikt har en egen tabell (weight_entries) istället för att ligga i
// app_state-klumpen - första steget i att bryta ur data till separata
// tabeller. Varje synk gör en full avstämning: alla lokala poster
// upsertas, och molnposter som inte längre finns lokalt (borttagna) tas
// bort. Enkelt och självläkande - ingen risk för att lokalt och moln
// glider isär även om ett synk-tillfälle missas.
async function pushWeightEntriesToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = weightEntries.map((e) => ({ user_id: authUser.id, id: e.id, date: e.date, value: e.value, updated_at: new Date().toISOString() }));
  if (rows.length) {
    const { error } = await supabaseClient.from("weight_entries").upsert(rows, { onConflict: "user_id,id" });
    if (error) throw error;
  }
  const localIds = weightEntries.map((e) => e.id);
  let delQuery = supabaseClient.from("weight_entries").delete().eq("user_id", authUser.id);
  if (localIds.length) delQuery = delQuery.not("id", "in", `(${localIds.join(",")})`);
  const { error: delError } = await delQuery;
  if (delError) throw delError;
}

async function pullAndMergeWeightEntriesFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("weight_entries").select("id,date,value").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    weightEntries = mergeArrayById(weightEntries, data).sort((a, b) => a.date.localeCompare(b.date));
    persistWeights();
  }
}

// Träningspass har fler valfria fält (note, submissions, gymSplit, ratings,
// customLabel) som kan variera/växa - date/type/minutes får egna kolumner
// (det man vill kunna fråga/analysera på), resten läggs i en jsonb-kolumn
// (extra) så tabellen inte behöver ändras varje gång ett nytt fält tillkommer.
function workoutEntryExtraFields(e) {
  const { id, date, type, minutes, ...rest } = e;
  return rest;
}
async function pushWorkoutEntriesToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = workoutEntries.map((e) => ({
    user_id: authUser.id, id: e.id, date: e.date, type: e.type, minutes: e.minutes,
    extra: workoutEntryExtraFields(e), updated_at: new Date().toISOString(),
  }));
  if (rows.length) {
    const { error } = await supabaseClient.from("workout_entries").upsert(rows, { onConflict: "user_id,id" });
    if (error) throw error;
  }
  const localIds = workoutEntries.map((e) => e.id);
  let delQuery = supabaseClient.from("workout_entries").delete().eq("user_id", authUser.id);
  if (localIds.length) delQuery = delQuery.not("id", "in", `(${localIds.join(",")})`);
  const { error: delError } = await delQuery;
  if (delError) throw delError;
}

async function pullAndMergeWorkoutEntriesFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("workout_entries").select("id,date,type,minutes,extra").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, date: r.date, type: r.type, minutes: r.minutes, ...(r.extra || {}) }));
    workoutEntries = mergeArrayById(workoutEntries, remote).sort((a, b) => b.date.localeCompare(a.date));
    persistWorkouts();
  }
}

// Kalorilogg: samma extra-jsonb-mönster som träningspass, eftersom poster
// kan komma från livsmedelssök (fler fält: makron, mängd m.m.) eller en
// enkel manuell in-/förbränningsrad.
function calorieEntryExtraFields(e) {
  const { id, date, kcal, type, ...rest } = e;
  return rest;
}
async function pushCalorieLogToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = calorieLog.map((e) => ({
    user_id: authUser.id, id: e.id, date: e.date, kcal: e.kcal, type: e.type,
    extra: calorieEntryExtraFields(e), updated_at: new Date().toISOString(),
  }));
  if (rows.length) {
    const { error } = await supabaseClient.from("calorie_log").upsert(rows, { onConflict: "user_id,id" });
    if (error) throw error;
  }
  const localIds = calorieLog.map((e) => e.id);
  let delQuery = supabaseClient.from("calorie_log").delete().eq("user_id", authUser.id);
  if (localIds.length) delQuery = delQuery.not("id", "in", `(${localIds.join(",")})`);
  const { error: delError } = await delQuery;
  if (delError) throw delError;
}
async function pullAndMergeCalorieLogFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("calorie_log").select("id,date,kcal,type,extra").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, date: r.date, kcal: r.kcal, type: r.type, ...(r.extra || {}) }));
    calorieLog = mergeArrayById(calorieLog, remote);
    persistCalorieLog();
  }
}

// Kroppsmått: enkel fast form, ingen extra-jsonb behövs.
async function pushBodyMeasurementsToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = bodyMeasurements.map((e) => ({
    user_id: authUser.id, id: e.id, date: e.date, type_id: e.typeId, value: e.value, updated_at: new Date().toISOString(),
  }));
  if (rows.length) {
    const { error } = await supabaseClient.from("body_measurements").upsert(rows, { onConflict: "user_id,id" });
    if (error) throw error;
  }
  const localIds = bodyMeasurements.map((e) => e.id);
  let delQuery = supabaseClient.from("body_measurements").delete().eq("user_id", authUser.id);
  if (localIds.length) delQuery = delQuery.not("id", "in", `(${localIds.join(",")})`);
  const { error: delError } = await delQuery;
  if (delError) throw delError;
}
async function pullAndMergeBodyMeasurementsFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("body_measurements").select("id,date,type_id,value").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, date: r.date, typeId: r.type_id, value: r.value }));
    bodyMeasurements = mergeArrayById(bodyMeasurements, remote);
    persistBodyMeasurements();
  }
}

// PB-logg (styrka): enkel fast form, ingen extra-jsonb behövs.
async function pushPbLogToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = pbLog.map((e) => ({ user_id: authUser.id, id: e.id, date: e.date, exercise_id: e.exerciseId, value: e.value, updated_at: new Date().toISOString() }));
  await reconcileSingleKeyTable("pb_log", "id", rows, pbLog.map((e) => e.id));
}
async function pullAndMergePbLogFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("pb_log").select("id,date,exercise_id,value").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, date: r.date, exerciseId: r.exercise_id, value: r.value }));
    pbLog = mergeArrayById(pbLog, remote);
    persistPbLog();
  }
}

// PB-logg (kondition): enkel fast form, ingen extra-jsonb behövs.
async function pushKonditionPbLogToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = konditionPbLog.map((e) => ({ user_id: authUser.id, id: e.id, date: e.date, distance_id: e.distanceId, type: e.type, minutes: e.minutes, updated_at: new Date().toISOString() }));
  await reconcileSingleKeyTable("kondition_pb_log", "id", rows, konditionPbLog.map((e) => e.id));
}
async function pullAndMergeKonditionPbLogFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("kondition_pb_log").select("id,date,distance_id,type,minutes").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, date: r.date, distanceId: r.distance_id, type: r.type, minutes: r.minutes }));
    konditionPbLog = mergeArrayById(konditionPbLog, remote);
    persistKonditionPbLog();
  }
}

// Gympass-historik: övningarna (namn + set) läggs i en egen jsonb-kolumn
// eftersom det är en nästlad struktur, inte ett gäng valfria fält.
async function pushGymSessionHistoryToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = gymSessionHistory.map((e) => ({
    user_id: authUser.id, id: e.id, date: e.date, split_id: e.splitId || null,
    total_volume: e.totalVolume || 0, exercises: e.exercises || [], updated_at: new Date().toISOString(),
  }));
  await reconcileSingleKeyTable("gym_session_history", "id", rows, gymSessionHistory.map((e) => e.id));
}
async function pullAndMergeGymSessionHistoryFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("gym_session_history").select("id,date,split_id,total_volume,exercises").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, date: r.date, splitId: r.split_id, totalVolume: r.total_volume, exercises: r.exercises || [] }));
    gymSessionHistory = mergeArrayById(gymSessionHistory, remote);
    saveGymSessionHistory();
  }
}

// Bingo-historik: har inget klient-id i appen, så startdatumet (en cykel
// per gång) fungerar som naturlig unik nyckel istället.
async function pushBingoHistoryToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = bingoHistory.map((e) => ({
    user_id: authUser.id, start_date: e.startDate, end_date: e.endDate || null,
    checked_count: e.checkedCount || 0, is_full: !!e.isFull, line_count: e.lineCount || 0,
    has_corners: !!e.hasCorners, has_x: !!e.hasX, xp: e.xp || 0, updated_at: new Date().toISOString(),
  }));
  await reconcileSingleKeyTable("bingo_history", "start_date", rows, bingoHistory.map((e) => e.startDate));
}
async function pullAndMergeBingoHistoryFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("bingo_history").select("start_date,end_date,checked_count,is_full,line_count,has_corners,has_x,xp").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({
      startDate: r.start_date, endDate: r.end_date, checkedCount: r.checked_count, isFull: r.is_full,
      lineCount: r.line_count, hasCorners: r.has_corners, hasX: r.has_x, xp: r.xp,
    }));
    bingoHistory = mergeArrayByKey(bingoHistory, remote, (e) => e.startDate);
    saveBingoHistory();
  }
}

// Veckoutmaning-historik: samma resonemang - veckostart är den naturliga
// unika nyckeln.
async function pushWeeklyChallengeHistoryToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = weeklyChallengeHistory.map((e) => ({
    user_id: authUser.id, week_start: e.weekStart, completed: e.completed || 0, total: e.total || 0, updated_at: new Date().toISOString(),
  }));
  await reconcileSingleKeyTable("weekly_challenge_history", "week_start", rows, weeklyChallengeHistory.map((e) => e.weekStart));
}
async function pullAndMergeWeeklyChallengeHistoryFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("weekly_challenge_history").select("week_start,completed,total").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ weekStart: r.week_start, completed: r.completed, total: r.total }));
    weeklyChallengeHistory = mergeArrayByKey(weeklyChallengeHistory, remote, (e) => e.weekStart);
    saveWeeklyChallengeHistory();
  }
}

// Sparade måltider: namn får en egen kolumn, resten (kcal/makron/
// ingredienser) i extra-jsonb.
function savedMealExtraFields(e) {
  const { id, name, ...rest } = e;
  return rest;
}
async function pushSavedMealsToCloud() {
  if (!supabaseClient || !authUser) return;
  const rows = savedMeals.map((e) => ({ user_id: authUser.id, id: e.id, name: e.name, extra: savedMealExtraFields(e), updated_at: new Date().toISOString() }));
  await reconcileSingleKeyTable("saved_meals", "id", rows, savedMeals.map((e) => e.id));
}
async function pullAndMergeSavedMealsFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("saved_meals").select("id,name,extra").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ id: r.id, name: r.name, ...(r.extra || {}) }));
    savedMeals = mergeArrayById(savedMeals, remote);
    saveSavedMeals();
  }
}

// Favoritmatvaror: inget id i appen - den identifierar en favorit via
// namn+kcal100, som blir en sammansatt nyckel i tabellen. Med en
// sammansatt nyckel funkar inte "ta bort det som saknas lokalt"-tricket med
// en enda kolumn, så här görs istället en full ersättning vid varje synk
// (radera allt, skriv in det som finns lokalt igen) - en liten lista så det
// är inget problem prestandamässigt.
async function pushFoodFavoritesToCloud() {
  if (!supabaseClient || !authUser) return;
  const { error: delError } = await supabaseClient.from("food_favorites").delete().eq("user_id", authUser.id);
  if (delError) throw delError;
  if (foodFavorites.length) {
    const rows = foodFavorites.map((e) => ({
      user_id: authUser.id, name: e.name, kcal100: e.kcal100,
      extra: { brand: e.brand || "", protein100: e.protein100, fat100: e.fat100, carbs100: e.carbs100 },
    }));
    const { error } = await supabaseClient.from("food_favorites").insert(rows);
    if (error) throw error;
  }
}
async function pullAndMergeFoodFavoritesFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("food_favorites").select("name,kcal100,extra").eq("user_id", authUser.id);
  if (error) throw error;
  if (Array.isArray(data) && data.length) {
    const remote = data.map((r) => ({ name: r.name, kcal100: r.kcal100, ...(r.extra || {}) }));
    foodFavorites = mergeArrayByKey(foodFavorites, remote, (e) => `${e.name}|${e.kcal100}`);
    saveFoodFavorites();
  }
}

async function pushLeaderboardVisibilityToCloud() {
  if (!supabaseClient || !authUser) return;
  const { error } = await supabaseClient.from("leaderboard_settings")
    .upsert({ user_id: authUser.id, visibility: leaderboardVisibility, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}
async function pullAndMergeLeaderboardVisibilityFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("leaderboard_settings").select("visibility").eq("user_id", authUser.id).maybeSingle();
  if (error) throw error;
  if (data && data.visibility) {
    leaderboardVisibility = data.visibility;
    saveLeaderboardVisibility();
  }
}

// Skickar upp en lättviktig sammanfattning (nivå, XP, upplåsta prestationer,
// antal pass, streak, sökbarhet) som andra användare kan se om de är vänner
// (eller hitta via sök, om sökbar). Räknas fram lokalt av samma logik som
// resten av appen använder - servern lagrar bara det färdiga resultatet.
async function pushSocialProfileToCloud() {
  if (!supabaseClient || !authUser) return;
  const totalSessions = workoutEntries.filter((e) => e.type !== "Sjuk" && e.type !== "Skadad").length;
  const { error } = await supabaseClient.from("social_profile").upsert({
    user_id: authUser.id,
    display_name: profile.name || null,
    avatar: profile.avatar || null,
    frame: profile.frame || null,
    level: computeLevelInfo(totalXp()).level,
    total_xp: totalXp(),
    unlocked_achievements: unlockedAchievements,
    achievement_prestige: achievementPrestige || {},
    total_sessions: totalSessions,
    current_streak: computeStreak(),
    belt_dates: profile.beltDates || {},
    searchable: socialSearchable,
    platinum_unlocked_at: platinumUnlockedAt ? new Date(platinumUnlockedAt).toISOString() : null,
    crown_emblem: platinumUnlockedAt ? (profile.crownEmblem || null) : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}
async function pullAndMergeSocialSearchableFromCloud() {
  if (!supabaseClient || !authUser) return;
  const { data, error } = await supabaseClient.from("social_profile").select("searchable").eq("user_id", authUser.id).maybeSingle();
  if (error) throw error;
  if (data && typeof data.searchable === "boolean") {
    socialSearchable = data.searchable;
    saveSocialSearchable();
  }
}

async function pushStateToCloud() {
  if (!supabaseClient || !authUser) return;
  if (cloudSyncInFlight) { cloudSyncQueuedWhileInFlight = true; return; }
  cloudSyncInFlight = true;
  cloudSyncStatus = "syncing";
  renderSyncStatusIfVisible();
  try {
    const payload = buildFullSyncPayload();
    const { error } = await supabaseClient.from("app_state").upsert({ user_id: authUser.id, data: payload }, { onConflict: "user_id" });
    if (error) throw error;
    await pushWeightEntriesToCloud();
    await pushWorkoutEntriesToCloud();
    await pushCalorieLogToCloud();
    await pushBodyMeasurementsToCloud();
    await pushPbLogToCloud();
    await pushKonditionPbLogToCloud();
    await pushGymSessionHistoryToCloud();
    await pushBingoHistoryToCloud();
    await pushWeeklyChallengeHistoryToCloud();
    await pushSavedMealsToCloud();
    await pushFoodFavoritesToCloud();
    await pushLeaderboardVisibilityToCloud();
    await pushSocialProfileToCloud();
    cloudSyncStatus = "idle";
    cloudSyncErrorMsg = "";
  } catch (e) {
    cloudSyncStatus = "error";
    cloudSyncErrorMsg = (e && e.message) || "Kunde inte synka.";
  } finally {
    cloudSyncInFlight = false;
    renderSyncStatusIfVisible();
    if (cloudSyncQueuedWhileInFlight) { cloudSyncQueuedWhileInFlight = false; scheduleCloudPush(); }
  }
}

// Anropas av alla save*/persist*-funktioner (se installCloudSyncHooks). Väntar
// 2.5s efter senaste ändringen innan den synkar, så en serie snabba ändringar
// (t.ex. att skriva i ett textfält) inte ger en nätverksanrop per tangenttryckning.
function scheduleCloudPush() {
  if (!supabaseClient || !authUser) return;
  // Blockera tills den inledande hämtningen är klar (se
  // initialPullCompletedForUser) - annars kan en lokal, ännu inte
  // ihopslagen profil skrivas över molnets riktiga data. Väntar man ut det
  // här fönstret pushas ändå allt korrekt strax efter, som en del av
  // hämtningens egen avslutande synk.
  if (initialPullCompletedForUser !== authUser.id) return;
  localStateUpdatedAt = bumpLocalStateUpdatedAt();
  cloudSyncStatus = "pending";
  renderSyncStatusIfVisible();
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  // Hämtar+slår ihop molndata FÖRST, varje gång - inte bara vid inloggning.
  // Annars kunde två enheter som båda är aktiva ungefär samtidigt (inte
  // bara en ny/tom enhet, utan två med riktig men olika data) fortfarande
  // skriva över varandra rakt av. Eftersom vår egen lokala ändring redan
  // fått en färsk tidsstämpel (raden ovan) vinner den jämförelsen normalt,
  // så vanlig enhets-användning fungerar precis som förut - det är bara
  // ett skydd för när en ANNAN enhet hunnit ändra något nyare däremellan.
  cloudSyncTimer = setTimeout(() => { pullAndMergeFromCloud(); }, 2500);
}

async function pullAndMergeFromCloud() {
  if (!supabaseClient || !authUser) return;
  cloudSyncStatus = "syncing";
  renderSyncStatusIfVisible();
  try {
    const { data, error } = await supabaseClient.from("app_state").select("data").eq("user_id", authUser.id).maybeSingle();
    if (error) throw error;
    if (data && data.data) mergeRemoteStateIntoLocal(data.data);
    // OBS ordning: hämta+slå ihop de utbrutna tabellerna FÖRE push, så att
    // ev. gammal data som fortfarande låg inbäddad i app_state-klumpen (från
    // innan de fick egna tabeller) hinner slås ihop lokalt innan vi skriver
    // den nya, städade klumpen och de nya tabellerna till molnet.
    await pullAndMergeWeightEntriesFromCloud();
    await pullAndMergeWorkoutEntriesFromCloud();
    await pullAndMergeCalorieLogFromCloud();
    await pullAndMergeBodyMeasurementsFromCloud();
    await pullAndMergePbLogFromCloud();
    await pullAndMergeKonditionPbLogFromCloud();
    await pullAndMergeGymSessionHistoryFromCloud();
    await pullAndMergeBingoHistoryFromCloud();
    await pullAndMergeWeeklyChallengeHistoryFromCloud();
    await pullAndMergeSavedMealsFromCloud();
    await pullAndMergeFoodFavoritesFromCloud();
    await pullAndMergeLeaderboardVisibilityFromCloud();
    await pullAndMergeSocialSearchableFromCloud();
    pbRankCache = {};
    await pushStateToCloud();
  } catch (e) {
    cloudSyncStatus = "error";
    cloudSyncErrorMsg = (e && e.message) || "Kunde inte hämta molndata.";
    renderSyncStatusIfVisible();
  }
}

async function authSignUp(email, password) {
  if (!supabaseClient) throw new Error("Molnfunktion inte tillgänglig just nu.");
  const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { emailRedirectTo: SITE_URL } });
  if (error) throw error;
  return data;
}
async function authResetPasswordForEmail(email) {
  if (!supabaseClient) throw new Error("Molnfunktion inte tillgänglig just nu.");
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
  if (error) throw error;
}
async function authSignIn(email, password) {
  if (!supabaseClient) throw new Error("Molnfunktion inte tillgänglig just nu.");
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Sätt authUser direkt (utöver onAuthStateChange, som sköter själva
  // molnhämtningen) så UI:t hinner visa inloggat läge direkt.
  if (data && data.user) authUser = { id: data.user.id, email: data.user.email };
  return data;
}
async function authSignOut() {
  if (!supabaseClient) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  await supabaseClient.auth.signOut();
}
async function authChangePassword(newPassword) {
  if (!supabaseClient) throw new Error("Molnfunktion inte tillgänglig just nu.");
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Håller reda på vilken användare vi senast hämtat+slagit ihop molndata för
// i den här sessionen. Ett booleskt "var jag inloggad innan" hade kunnat ge
// fel svar här eftersom authSignIn() sätter authUser direkt (för snabb
// UI-feedback) INNAN denna lyssnare hinner triggas - då hade en enkel
// "gick från utloggad till inloggad"-koll missat hämtningen helt.
let lastPulledUserId = null;
// Sant/id när den INLEDANDE hämtningen+ihopslagningen faktiskt är KLAR för
// den aktuella inloggningen (till skillnad från lastPulledUserId, som bara
// markerar att den PÅBÖRJATS - satt direkt för att undvika dubbel-hämtning).
// Så länge den här inte matchar authUser.id blockeras vanliga
// molnsynk-triggers (se scheduleCloudPush) - annars kan en lokal, ännu inte
// ihopslagen profil (t.ex. tom avatar på en nyss inloggad enhet) hinna
// skrivas över den riktiga molndatan innan den hunnit hämtas hem.
let initialPullCompletedForUser = null;
// Sant när användaren just klickat på en "återställ lösenord"-länk från
// mejlet. Då visar vi kontosektionen direkt med fokus på att sätta ett
// nytt lösenord, istället för det vanliga inloggningsläget.
let authRecoveryMode = false;

// Molndatan (XP/prestationer/allt annat) hämtas och slås ihop asynkront i
// bakgrunden efter inloggning (pullAndMergeFromCloud) - den är INTE klar när
// modalen/huvudvyn först renderas om direkt efter inloggning. Utan den här
// uppföljningen visade appen fel level (t.ex. "Level 1" tills riktig XP
// hunnit slås ihop) tills man råkade byta flik eller öppna om en vy manuellt.
function refreshAfterCloudPull() {
  render();
  if (document.getElementById("openProfileBtn")) {
    const sheet = modalRoot.querySelector(".modal-sheet");
    const scrollTop = sheet ? sheet.scrollTop : 0;
    openBackupModal();
    const newSheet = modalRoot.querySelector(".modal-sheet");
    if (newSheet) newSheet.scrollTop = scrollTop;
  } else if (document.getElementById("profileName")) {
    const sheet = modalRoot.querySelector(".modal-sheet");
    const scrollTop = sheet ? sheet.scrollTop : 0;
    openProfileModal();
    const newSheet = modalRoot.querySelector(".modal-sheet");
    if (newSheet) newSheet.scrollTop = scrollTop;
  }
}

function initCloudAuth() {
  if (!supabaseClient) return;
  supabaseClient.auth.onAuthStateChange((event, session) => {
    authUser = session && session.user ? { id: session.user.id, email: session.user.email } : null;
    if (event === "PASSWORD_RECOVERY") {
      authRecoveryMode = true;
      profilePasswordSectionOpen = true;
      openProfileModal();
    }
    if (event === "SIGNED_IN" && authUser && lastPulledUserId !== authUser.id) {
      lastPulledUserId = authUser.id;
      pullAndMergeFromCloud().then(() => { initialPullCompletedForUser = authUser.id; refreshAfterCloudPull(); });
    }
    if (event === "SIGNED_OUT") {
      cloudSyncStatus = "offline";
      lastPulledUserId = null;
      initialPullCompletedForUser = null;
      authRecoveryMode = false;
    }
    render();
  });
  supabaseClient.auth.getSession().then(({ data }) => {
    authUser = data && data.session && data.session.user ? { id: data.session.user.id, email: data.session.user.email } : null;
    if (authUser && lastPulledUserId !== authUser.id) {
      lastPulledUserId = authUser.id;
      pullAndMergeFromCloud().then(() => { initialPullCompletedForUser = authUser.id; refreshAfterCloudPull(); });
    }
    render();
  });
}

// Alla dessa funktioner motsvarar fält i buildDataPayload()/buildSettingsPayload().
// När någon av dem anropas (dvs. något i appen har ändrats och sparats lokalt)
// schemaläggs en molnsynk. Rena UI-lägen (t.ex. ihopfällda kort, debug-bonus)
// är medvetet uteslutna eftersom de inte är del av synk-payloaden.
const CLOUD_SYNC_TRIGGER_FNS = [
  "saveTrainingTypes", "saveTabColors", "saveNavGlowColors", "saveThemeMode", "saveHaptics",
  "persistWeights", "persistWorkouts", "saveActivityLevel", "saveProfile", "persistCalorieLog",
  "saveShowCalorieStats", "saveShowSubmissionStats", "saveShowDistributionStats", "saveShowCalorieHistoryList",
  "saveShowWeightHistory", "saveShowWorkoutHistory", "saveShowBodyMeasurementHistory", "saveShowCompareCard",
  "saveShowWeeklyChallenge", "saveShowMonthlyBarChart", "saveNavIconStyle", "saveNavIconSize", "saveShowNavLabels",
  "saveNavBadgeColor", "saveTrainingTabIcon", "saveShowWeightStats", "saveQuickPresets", "saveAdvancedMenuEnabled", "saveAdvancedQuestions",
  "saveKampsportAdvancedSectionOpen", "saveMacroSettings", "saveSubmissionsMenuEnabled", "saveSubmissionTypes",
  "saveGymMenuEnabled", "saveGymSplits", "saveKonditionMenuEnabled", "savePbExercises", "persistPbLog",
  "saveShowPbCard", "saveShowPbHistory", "saveKonditionPbDistances", "persistKonditionPbLog", "saveBodyMeasurementsEnabled",
  "saveBodyMeasurementTypes", "persistBodyMeasurements", "saveGymExercises", "saveActiveGymSession", "saveGymSessionHistory",
  "saveTabOrder", "saveWeightChartPeriod", "saveLevelTheme", "saveUnlockedAchievements", "saveUnlockedAchievementDates",
  "saveLogXp", "saveXpAwardedDates", "saveWeeklyMisc", "saveWeeklyChallengeState", "saveWeeklyChallengeXp",
  "saveWeeklyChallengeHistory", "saveSubmissionBingoEnabled", "saveShowSubmissionBingo", "saveBingoCard", "saveBingoHistory",
  "saveBingoXp", "saveBingoLifetimeStats", "saveBgUnlockedAchievements", "saveAchievementPrestige", "savePrestigeXp",
  "savePrestigeBaseline", "savePrestigeConsumedIds", "savePrestigeStreakResetAt", "saveCalorieGoal", "saveShowFoodSearch",
  "saveFoodFavorites", "saveSavedMeals",
];
function installCloudSyncHooks() {
  CLOUD_SYNC_TRIGGER_FNS.forEach((name) => {
    const original = window[name];
    if (typeof original !== "function") return;
    window[name] = function (...args) {
      const result = original.apply(this, args);
      scheduleCloudPush();
      return result;
    };
  });
}

function showModalStatus(msg, type) {
  const el = document.getElementById("modalStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  el.style.display = "block";
}

function applyAccentVar() {
  document.documentElement.style.setProperty("--accent", tabColors.stats);
}

const SETTINGS_SEARCH_INDEX = [
  { label: "Redigera profil", keywords: ["profil", "namn", "bälte namn"], expandIds: [], targetSelector: "#openProfileBtn" },
  { label: "Mörkt / Ljust läge", keywords: ["mörkt", "ljust", "dark", "light", "utseende"], expandIds: [], targetSelector: '[data-theme-btn="dark"]' },
  { label: "Bakgrundston", keywords: ["bakgrund", "bakgrundsfärg", "färg", "ton", "utseende"], expandIds: [], targetSelector: "#bgAccentColorInput" },
  { label: "Tema (Kampsport/Fitness/Styrkelyft/Löpare)", keywords: ["tema", "bälte", "fitness", "styrkelyft", "löpare", "kampsport level"], expandIds: [], targetSelector: '[data-level-theme-btn="belt"]' },
  { label: "Haptisk feedback", keywords: ["haptisk", "vibration"], expandIds: [], targetSelector: "#hapticsToggle" },
  { label: "Avancerad meny Vikt / Kroppsmått", keywords: ["kroppsmått", "midja", "bröstmått", "höft", "lår mått"], expandIds: [], targetSelector: "#viktAdvancedSectionToggle" },
  { label: "Avancerad meny (Kampsport)", keywords: ["kampsport meny"], expandIds: ["trainingAdvancedSectionToggle"], targetSelector: "#kampsportAdvancedSectionToggle" },
  { label: "Utvärdering (BJJ/SW-frågor)", keywords: ["utvärdering", "frågor", "betyg"], expandIds: ["trainingAdvancedSectionToggle", "kampsportAdvancedSectionToggle"], targetSelector: "#advancedMenuToggle" },
  { label: "Submissions", keywords: ["submission", "submissions", "kväv", "lås"], expandIds: ["trainingAdvancedSectionToggle", "kampsportAdvancedSectionToggle"], targetSelector: "#submissionsMenuToggle" },
  { label: "Submission-bingo", keywords: ["bingo"], expandIds: ["trainingAdvancedSectionToggle", "kampsportAdvancedSectionToggle"], targetSelector: "#submissionBingoToggle" },
  { label: "Avancerad meny (Gym)", keywords: ["gym", "gympass", "övningar", "personbästa styrka"], expandIds: ["trainingAdvancedSectionToggle"], targetSelector: "#gymMenuToggle" },
  { label: "Avancerad meny (Kondition)", keywords: ["kondition", "löpning distans", "cykel", "personbästa kondition"], expandIds: ["trainingAdvancedSectionToggle"], targetSelector: "#konditionMenuToggle" },
  { label: "Avancerad meny Kalorier / Snabbknappar / Makros", keywords: ["snabbknappar", "makro", "makros", "protein", "kolhydrater", "fett"], expandIds: [], targetSelector: "#presetsMenuToggle" },
  { label: "Avancerad meny Flikar / Ikonstorlek / Flikfärg", keywords: ["ikon", "ikonstorlek", "emblem", "flikfärg", "glow", "flikordning", "text under ikoner"], expandIds: [], targetSelector: "#tabOrderMenuToggle" },
  { label: "Färger (Vikt/Träning/Kalorier/Statistik)", keywords: ["färg", "färger"], expandIds: ["tabOrderMenuToggle"], targetSelector: "#resetColorsBtn" },
  { label: "Säkerhetskopiering / Backup", keywords: ["backup", "säkerhetskopia", "återställ", "exportera", "excel"], expandIds: [], targetSelector: "#backupMenuToggle" },
];

function searchSettingsIndex(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SETTINGS_SEARCH_INDEX.filter((entry) =>
    entry.label.toLowerCase().includes(q) || entry.keywords.some((k) => k.includes(q) || q.includes(k))
  );
}

function revealSettingsSearchResult(entry) {
  entry.expandIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.checked) { el.checked = true; el.dispatchEvent(new Event("change")); }
  });
  requestAnimationFrame(() => {
    const target = modalRoot.querySelector(entry.targetSelector);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const highlightEl = target.closest(".toggle-row") || target;
    highlightEl.style.transition = "background-color .3s";
    const original = highlightEl.style.backgroundColor;
    highlightEl.style.backgroundColor = "var(--input-bg)";
    setTimeout(() => { highlightEl.style.backgroundColor = original; }, 900);
  });
}

function handleKampsportToggleChange(checked) {
  const wasOff = !kampsportAdvancedSectionOpen;
  kampsportAdvancedSectionOpen = checked;
  saveKampsportAdvancedSectionOpen();
  if (checked && wasOff) {
    const result = mergeBgUnlockedAchievements();
    if (result) openKampsportWelcomeBackModal(result);
  }
}
let onboardingAnswers = { aktiviteter: new Set(), profil: { gender: null, age: "", height: "", weight: "" }, kroppsmatt: null, gymFreq: null, bingo: null, tema: null };
let onboardingStepIndex = 0;

function onboardingSteps() {
  const steps = ["aktiviteter", "profil", "kroppsmatt"];
  if (onboardingAnswers.aktiviteter.has("gym")) steps.push("gymfreq");
  if (onboardingAnswers.aktiviteter.has("bjj")) steps.push("bingo");
  steps.push("tema");
  steps.push("summary");
  return steps;
}

function applyOnboardingAnswers() {
  trainingAdvancedSectionOpen = true;
  const p = onboardingAnswers.profil;
  if (p.gender) profile.gender = p.gender;
  if (p.age) profile.age = p.age;
  if (p.height) profile.height = p.height;
  if (p.age || p.height || p.gender) saveProfile();
  if (p.weight) {
    calorieState.weight = p.weight;
    const today = todayISO();
    if (!weightEntries.some((e) => e.date === today)) {
      weightEntries.push({ id: uid(), date: today, value: parseFloat(p.weight) });
      persistWeights();
    }
  }
  if (onboardingAnswers.aktiviteter.has("bjj")) {
    handleKampsportToggleChange(true);
    submissionsMenuEnabled = true;
    saveSubmissionsMenuEnabled();
    advancedMenuEnabled = true;
    saveAdvancedMenuEnabled();
  } else {
    handleKampsportToggleChange(false);
  }
  if (onboardingAnswers.aktiviteter.has("gym")) {
    gymMenuEnabled = true;
    saveGymMenuEnabled();
    if (onboardingAnswers.gymFreq === "2") addGymTemplateSplits("helkropp");
    else if (onboardingAnswers.gymFreq === "3" || onboardingAnswers.gymFreq === "4") addGymTemplateSplits("ppl");
  }
  if (onboardingAnswers.aktiviteter.has("cardio")) {
    konditionMenuEnabled = true;
    saveKonditionMenuEnabled();
  }
  bodyMeasurementsEnabled = onboardingAnswers.kroppsmatt === "yes";
  saveBodyMeasurementsEnabled();
  if (onboardingAnswers.aktiviteter.has("bjj")) {
    submissionBingoEnabled = onboardingAnswers.bingo === "yes";
    saveSubmissionBingoEnabled();
    if (submissionBingoEnabled && !bingoCard) startNewBingoCard();
  }
  if (onboardingAnswers.tema) {
    levelTheme = onboardingAnswers.tema;
    saveLevelTheme();
  }
  renderNav();
}

function onboardingStepHTML(stepKey) {
  const opts = {
    aktiviteter: { title: "Vad tränar du?", sub: "Flera val möjliga.", type: "multi", key: "aktiviteter",
      options: [{ key: "bjj", label: "🥋 Kampsport (BJJ/SW)" }, { key: "gym", label: "🏋️ Gym / styrka" }, { key: "cardio", label: "🏃 Kondition / löpning" }] },
    kroppsmatt: { title: "Följer du kroppsmått?", sub: "Utöver vikten.", type: "single", key: "kroppsmatt",
      options: [{ key: "yes", label: "Ja, gärna" }, { key: "no", label: "Nej, bara vikten" }] },
    gymfreq: { title: "Hur ofta tränar du gym per vecka?", sub: "Vi föreslår ett upplägg som passar frekvensen.", type: "single", key: "gymFreq",
      options: [{ key: "2", label: "2 gånger — Helkropp A/B" }, { key: "3", label: "3 gånger — Push/Pull/Legs" }, { key: "4", label: "4+ gånger — Push/Pull/Legs" }] },
    bingo: { title: "Vill du ha Submission-bingo?", sub: "En rolig sidoutmaning, en bricka per månad.", type: "single", key: "bingo",
      options: [{ key: "yes", label: "Ja, testa gärna" }, { key: "no", label: "Nej tack" }] },
    tema: { title: "Vilken nivåstil vill du ha?", sub: "Kan ändras när som helst sen.", type: "single", key: "tema",
      options: [{ key: "belt", label: "🥋 Bälte (kampsport)" }, { key: "fitness", label: "🏆 Fitness" }, { key: "gym", label: "🏋️ Styrkelyft" }, { key: "run", label: "🏃 Löpare" }] },
  };
  if (stepKey === "profil") {
    const p = onboardingAnswers.profil;
    return `
      <h2 style="margin:0 0 4px">Lite om dig</h2>
      <p style="color:var(--muted);font-size:14px;margin:0 0 1rem">Valfritt, men ger dig kaloribehovet direkt från start.</p>
      <div class="row" style="margin-bottom:8px">
        <button data-onboarding-gender="man" class="chip" style="flex:1;${p.gender === "man" ? `border-color:${tabColors.stats};background:${tabColors.stats}26;color:${tabColors.stats};font-weight:700;` : ""}">Man</button>
        <button data-onboarding-gender="kvinna" class="chip" style="flex:1;${p.gender === "kvinna" ? `border-color:${tabColors.stats};background:${tabColors.stats}26;color:${tabColors.stats};font-weight:700;` : ""}">Kvinna</button>
      </div>
      <div class="field" style="margin-bottom:8px"><div class="field-label">Ålder</div><input type="number" inputmode="numeric" placeholder="år" id="onboardingAge" value="${escapeHtml(p.age)}" /></div>
      <div class="field" style="margin-bottom:8px"><div class="field-label">Längd</div><input type="number" inputmode="numeric" placeholder="cm" id="onboardingHeight" value="${escapeHtml(p.height)}" /></div>
      <div class="field" style="margin-bottom:1rem"><div class="field-label">Vikt idag</div><input type="number" inputmode="decimal" step="0.1" placeholder="kg" id="onboardingWeight" value="${escapeHtml(p.weight)}" /></div>
      <div class="row">
        ${onboardingStepIndex > 0 ? `<button class="modal-btn secondary" id="onboardingBackBtn" style="flex:1">Tillbaka</button>` : ""}
        <button class="modal-btn primary" id="onboardingNextBtn" style="flex:2">Nästa</button>
      </div>
    `;
  }
  if (stepKey === "summary") {
    const chosen = [];
    const p = onboardingAnswers.profil;
    if (p.age || p.height || p.weight) chosen.push("Profil uppdaterad — kaloribehov beräknat direkt under Kalorier");
    if (onboardingAnswers.aktiviteter.has("bjj")) chosen.push("Avancerad meny Kampsport aktiverad");
    if (onboardingAnswers.aktiviteter.has("gym")) {
      chosen.push("Avancerad meny Gym aktiverad");
      if (onboardingAnswers.gymFreq === "2") chosen.push("Helkropp A/B tillagt som gympass");
      if (onboardingAnswers.gymFreq === "3" || onboardingAnswers.gymFreq === "4") chosen.push("Push/Pull/Legs tillagt som gympass");
    }
    if (onboardingAnswers.aktiviteter.has("cardio")) chosen.push("Avancerad meny Kondition aktiverad");
    if (onboardingAnswers.kroppsmatt === "yes") chosen.push("Kroppsmått aktiverat under Vikt");
    if (onboardingAnswers.aktiviteter.has("bjj") && onboardingAnswers.bingo === "yes") chosen.push("Submission-bingo aktiverad");
    if (!onboardingAnswers.aktiviteter.has("bjj")) chosen.push("Kampsport-prestationer döljs (kan visas igen när som helst)");
    if (onboardingAnswers.tema) chosen.push("Nivåtema: " + opts.tema.options.find((o) => o.key === onboardingAnswers.tema).label);
    return `
      <h2 style="margin:0 0 4px">Klart!</h2>
      <p style="color:var(--muted);font-size:14px;margin:0 0 1rem">Vi ställer in det här åt dig:</p>
      <ul style="margin:0 0 20px;padding-left:1.2rem;font-size:14px;color:var(--muted)">
        ${chosen.length ? chosen.map((c) => `<li style="margin-bottom:6px">${escapeHtml(c)}</li>`).join("") : "<li>Standardinställningar</li>"}
      </ul>
      <div class="row">
        <button class="modal-btn secondary" id="onboardingRestartBtn" style="flex:1">Börja om</button>
        <button class="modal-btn primary" id="onboardingFinishBtn" style="flex:2">Klar ↗</button>
      </div>
    `;
  }
  const s = opts[stepKey];
  return `
    <h2 style="margin:0 0 4px">${s.title}</h2>
    <p style="color:var(--muted);font-size:14px;margin:0 0 1rem">${s.sub}</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1rem">
      ${s.options.map((o) => {
        const sel = s.type === "multi" ? onboardingAnswers[s.key].has(o.key) : onboardingAnswers[s.key] === o.key;
        return `<button data-onboarding-opt="${o.key}" data-onboarding-key="${s.key}" data-onboarding-type="${s.type}" class="chip" style="width:100%;text-align:left;padding:12px 14px;${sel ? `border-color:${tabColors.stats};background:${tabColors.stats}26;color:${tabColors.stats};font-weight:700;` : ""}">${sel ? "✓ " : ""}${o.label}</button>`;
      }).join("")}
    </div>
    <div class="row">
      ${onboardingStepIndex > 0 ? `<button class="modal-btn secondary" id="onboardingBackBtn" style="flex:1">Tillbaka</button>` : ""}
      <button class="modal-btn primary" id="onboardingNextBtn" style="flex:2">Nästa</button>
    </div>
  `;
}

function openOnboardingGuideModal() {
  onboardingAnswers = { aktiviteter: new Set(), profil: { gender: null, age: "", height: "", weight: "" }, kroppsmatt: null, gymFreq: null, bingo: null, tema: null };
  onboardingStepIndex = 0;
  pushModalHistoryIfNeeded();
  const render = () => {
    const steps = onboardingSteps();
    const stepKey = steps[onboardingStepIndex];
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="onboardingOverlay">
        <div class="modal-sheet">
          <div style="display:flex;gap:6px;justify-content:center;margin-bottom:16px">
            ${steps.map((_, i) => `<div style="width:${i === onboardingStepIndex ? "16px" : "6px"};height:6px;border-radius:3px;background:${i === onboardingStepIndex ? tabColors.stats : "var(--border2)"}"></div>`).join("")}
          </div>
          ${onboardingStepHTML(stepKey)}
          <div class="modal-close" id="onboardingCloseBtn">Avbryt</div>
        </div>
      </div>
    `;
    modalRoot.querySelectorAll("[data-onboarding-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.onboardingKey, val = btn.dataset.onboardingOpt, type = btn.dataset.onboardingType;
        if (type === "multi") {
          if (onboardingAnswers[key].has(val)) onboardingAnswers[key].delete(val); else onboardingAnswers[key].add(val);
        } else {
          onboardingAnswers[key] = val;
        }
        render();
      });
    });
    modalRoot.querySelectorAll("[data-onboarding-gender]").forEach((btn) => {
      btn.addEventListener("click", () => {
        onboardingAnswers.profil.gender = btn.dataset.onboardingGender;
        render();
      });
    });
    const ageInput = document.getElementById("onboardingAge");
    if (ageInput) ageInput.addEventListener("input", (e) => { onboardingAnswers.profil.age = e.target.value; });
    const heightInput = document.getElementById("onboardingHeight");
    if (heightInput) heightInput.addEventListener("input", (e) => { onboardingAnswers.profil.height = e.target.value; });
    const weightInput = document.getElementById("onboardingWeight");
    if (weightInput) weightInput.addEventListener("input", (e) => { onboardingAnswers.profil.weight = e.target.value; });
    const backBtn = document.getElementById("onboardingBackBtn");
    if (backBtn) backBtn.addEventListener("click", () => { onboardingStepIndex--; render(); });
    const nextBtn = document.getElementById("onboardingNextBtn");
    if (nextBtn) nextBtn.addEventListener("click", () => { onboardingStepIndex = Math.min(onboardingSteps().length - 1, onboardingStepIndex + 1); render(); });
    const restartBtn = document.getElementById("onboardingRestartBtn");
    if (restartBtn) restartBtn.addEventListener("click", () => {
      onboardingAnswers = { aktiviteter: new Set(), profil: { gender: null, age: "", height: "", weight: "" }, kroppsmatt: null, gymFreq: null, bingo: null, tema: null };
      onboardingStepIndex = 0;
      render();
    });
    const finishBtn = document.getElementById("onboardingFinishBtn");
    if (finishBtn) finishBtn.addEventListener("click", () => {
      applyOnboardingAnswers();
      modalRoot.innerHTML = "";
      handleModalClosedByUser();
      if (activeTab === "stats") renderStats();
    });
    document.getElementById("onboardingCloseBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; handleModalClosedByUser(); });
    document.getElementById("onboardingOverlay").addEventListener("click", (e) => {
      if (e.target.id === "onboardingOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
    });
  };
  render();
}

function openKampsportWelcomeBackModal(result) {
  pushModalHistoryIfNeeded();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="kampsportWelcomeBackOverlay">
      <div class="modal-sheet" style="text-align:center">
        <div style="font-size:40px">🥋</div>
        <h2>Välkommen tillbaka!</h2>
        <p>Medan Kampsport var dold hann du låsa upp <strong>${result.count}</strong> ${result.count === 1 ? "prestation" : "prestationer"} och tjäna <strong>+${result.xp} XP</strong>:</p>
        <div style="display:flex;flex-wrap:wrap;gap:14px 8px;justify-content:center;margin:10px 0">
          ${result.achievements.map(achievementBadgeHTML).join("")}
        </div>
        <button class="modal-btn primary" id="kampsportWelcomeBackCloseBtn" style="width:100%;margin-top:10px">Toppen!</button>
      </div>
    </div>
  `;
  document.getElementById("kampsportWelcomeBackCloseBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
    handleModalClosedByUser();
  });
  document.getElementById("kampsportWelcomeBackOverlay").addEventListener("click", (e) => {
    if (e.target.id === "kampsportWelcomeBackOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
}

// Spärr för inloggningskrävande handlingar (logga pass, logga vikt, m.m.).
// Anropas i toppen av ett submit-flöde: return om requireAuth(...) är false.
// Vid utloggat läge visas en modal som leder vidare till Inställningar.
function requireAuth(promptText) {
  if (authUser) return true;
  openLoginRequiredModal(promptText);
  return false;
}

function openLoginRequiredModal(promptText) {
  pushModalHistoryIfNeeded();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="loginRequiredOverlay">
      <div class="modal-sheet" style="text-align:center">
        <div style="font-size:36px">🔒</div>
        <h2>Logga in för att fortsätta</h2>
        <p>${escapeHtml(promptText)}</p>
        <button class="modal-btn primary" id="loginRequiredGoBtn" style="width:100%">Logga in / Skapa konto</button>
        <div class="modal-close" id="loginRequiredCloseBtn">Avbryt</div>
      </div>
    </div>
  `;
  document.getElementById("loginRequiredGoBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
    handleModalClosedByUser();
    openBackupModal();
  });
  document.getElementById("loginRequiredCloseBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; });
  document.getElementById("loginRequiredOverlay").addEventListener("click", (e) => {
    if (e.target.id === "loginRequiredOverlay") modalRoot.innerHTML = "";
  });
}

// Kontostatus-kortet högst upp i Inställningar - visar inloggningsstatus
// (med inloggnings-/registreringsformulär) om utloggad, eller namn/e-post/
// level+XP om inloggad. Utloggning och byt lösenord bor i Profil-vyn
// istället (öppnas via "Redigera profil"), för att hålla den här ytan kort.
function accountStatusCardHTML() {
  const avatarFallback = `<div style="width:44px;height:44px;border-radius:50%;background:var(--input-bg);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--muted)"><span class="icon-20">${ICONS.userCircle}</span></div>`;
  const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit";

  const editProfileBtn = `<button class="modal-btn secondary" id="openProfileBtn" style="width:auto;padding:6px 14px;font-size:12.5px;align-self:flex-start;display:flex;align-items:center;gap:6px">${ICONS.userCircle} Redigera profil</button>`;

  if (!authUser) {
    return `
      <div class="card" style="display:flex;align-items:center;gap:12px;text-align:left">
        ${avatarFallback}
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">Inte inloggad</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Logga in för att säkerhetskopiera dina framsteg och inställningar.</div>
        </div>
      </div>
      ${editProfileBtn}
      ${!supabaseClient ? `
        <div class="status-msg err" style="display:block;margin-top:8px">Molnfunktionen kunde inte laddas (ingen uppkoppling till Supabase-biblioteket). Kontrollera din internetanslutning.</div>
      ` : `
        <div class="theme-row" style="margin-top:8px">
          <button class="theme-btn" data-auth-mode="login" style="${authFormMode === "login" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Logga in</button>
          <button class="theme-btn" data-auth-mode="signup" style="${authFormMode === "signup" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Skapa konto</button>
        </div>
        <input type="text" id="authEmailInput" placeholder="E-post" autocomplete="email" inputmode="email" style="${inputStyle}" />
        <input type="password" id="authPasswordInput" placeholder="Lösenord (minst 6 tecken)" autocomplete="${authFormMode === "signup" ? "new-password" : "current-password"}" style="${inputStyle}" />
        <button class="modal-btn primary" id="authSubmitBtn" ${authFormBusy ? "disabled" : ""}>${authFormMode === "signup" ? "Skapa konto" : "Logga in"}</button>
        ${authFormMode === "login" ? `<button type="button" id="forgotPasswordBtn" style="background:none;border:none;padding:4px;font-family:inherit;cursor:pointer;font-size:12.5px;color:${tabColors.stats};text-decoration:underline;text-align:center;width:100%">Glömt lösenord?</button>` : ""}
        <div id="accountStatus" class="status-msg ${authFormError.startsWith("Om kontot finns") || authFormError.startsWith("Konto skapat") ? "ok" : "err"}" style="display:${authFormError ? "block" : "none"}">${escapeHtml(authFormError)}</div>
      `}
    `;
  }

  const info = computeLevelInfo(totalXp());
  return `
    <div class="card" style="display:flex;align-items:center;gap:12px;text-align:left;position:relative">
      <div style="position:absolute;top:10px;right:14px;font-size:10px;color:var(--muted);text-align:right;max-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" id="cloudSyncStatusText">${cloudSyncStatusLabel()}</div>
      ${profileAvatarHTML(44, 3) || avatarFallback}
      <div style="flex:1;min-width:0">
        <button id="openProfileBtn" style="background:none;border:none;padding:0;font-family:inherit;cursor:pointer;font-size:14px;font-weight:700;color:${tabColors.stats};text-decoration:underline;text-align:left">${profile.name ? escapeHtml(profile.name) : "Namnlös profil"}</button>
        <div style="font-size:12px;font-weight:600;color:${tabColors.stats};margin-top:2px">Level ${info.level} • ${totalXp().toLocaleString("sv-SE")} XP</div>
      </div>
    </div>
  `;
}

function openBackupModal() {
  pushModalHistoryIfNeeded();
  applyAccentVar();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal-sheet">
        <button id="settingsModalBackBtn" aria-label="Tillbaka" style="background:none;border:none;padding:4px;margin:-4px;cursor:pointer;color:var(--text);display:flex;align-items:center;flex-shrink:0"><span class="icon-20">${ICONS.chevronLeft}</span></button>
        ${accountStatusCardHTML()}

        <h2>Inställningar</h2>
        <button class="modal-btn secondary" id="openOnboardingGuideBtn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px">✨ Kör inställningsguiden</button>
        <h2 style="margin-top:6px">Utseende</h2>
        <div class="theme-row">
          <button class="theme-btn" data-theme-btn="dark" style="${themeMode === "dark" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🌙 Mörkt</button>
          <button class="theme-btn" data-theme-btn="light" style="${themeMode === "light" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">☀️ Ljust</button>
        </div>
        <h2 style="margin-top:6px">Tema</h2>
        <div class="theme-row">
          <button class="theme-btn" data-level-theme-btn="belt" style="${levelTheme === "belt" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🥋 Kampsport</button>
          <button class="theme-btn" data-level-theme-btn="fitness" style="${levelTheme === "fitness" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🏆 Fitness</button>
        </div>
        <div class="theme-row" style="margin-top:8px">
          <button class="theme-btn" data-level-theme-btn="gym" style="${levelTheme === "gym" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🏋️ Styrkelyft</button>
          <button class="theme-btn" data-level-theme-btn="run" style="${levelTheme === "run" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">🏃 Löpare</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          <span style="font-size:14px;font-weight:600;flex:1">Bakgrundston</span>
          <input type="color" id="bgAccentColorInput" value="${bgAccentHex || (themeMode === "light" ? "#F4F5F7" : "#0F1115")}" style="width:36px;height:36px;border:1px solid var(--border2);border-radius:8px;background:var(--input-bg);padding:2px;cursor:pointer" />
          ${bgAccentHex ? `<button class="modal-btn secondary" id="bgAccentResetBtn" style="width:auto;padding:8px 12px">Återställ</button>` : ""}
        </div>
        <div style="position:relative;margin-top:4px">
          <input type="text" id="settingsSearchInput" placeholder="🔍 Sök i inställningar..." style="width:100%;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit" />
          <div id="settingsSearchResults" style="display:none;position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--card-bg);border:1px solid var(--border2);border-radius:10px;z-index:20;max-height:260px;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,0.3)"></div>
        </div>
        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Haptisk feedback (vibration)</span>
          <label class="toggle-switch">
            <input type="checkbox" id="hapticsToggle" ${hapticsEnabled ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Ljud vid grattis-popups</span>
          <label class="toggle-switch">
            <input type="checkbox" id="soundEffectsToggle" ${soundEffectsEnabled ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Avancerad meny Vikt</span>
          <label class="toggle-switch">
            <input type="checkbox" id="viktAdvancedSectionToggle" ${bodyMeasurementsEnabled ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px">Extra mått och val kopplade till Vikt-fliken.</p>
        <div id="viktAdvancedBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${bodyMeasurementsEnabled ? "" : "display:none"}">

          <div id="bodyMeasurementTypesList" style="display:flex;flex-direction:column;gap:10px"></div>

        </div>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Avancerad meny Träning</span>
          <label class="toggle-switch">
            <input type="checkbox" id="trainingAdvancedSectionToggle" ${trainingAdvancedSectionOpen ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px">Extra frågor och val kopplade till kampsport, styrka och kondition.</p>
        <div id="trainingAdvancedBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${trainingAdvancedSectionOpen ? "" : "display:none"}">

          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Avancerad meny (Kampsport)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="kampsportAdvancedSectionToggle" ${kampsportAdvancedSectionOpen ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="margin-top:-4px">Utvärdering och submissions för BJJ/SW-pass.</p>
          <div id="kampsportAdvancedBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${kampsportAdvancedSectionOpen ? "" : "display:none"}">

            <div class="toggle-row">
              <span style="font-size:14px;font-weight:600">Utvärdering</span>
              <label class="toggle-switch">
                <input type="checkbox" id="advancedMenuToggle" ${advancedMenuEnabled ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p style="margin-top:-4px">Slå på för att svara på frågor (1-10) efter BJJ/SW-pass.</p>

            <div id="advancedQuestionsList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${advancedMenuEnabled ? "" : "display:none"}"></div>

            <div class="toggle-row" id="submissionsToggleRow">
              <span style="font-size:14px;font-weight:600">Submissions</span>
              <label class="toggle-switch">
                <input type="checkbox" id="submissionsMenuToggle" ${submissionsMenuEnabled ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p style="margin-top:-4px" id="submissionsToggleHint">Slå på för att välja vilka submissions du fick under BJJ/SW-pass.</p>
            <div id="submissionTypesList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${submissionsMenuEnabled ? "" : "display:none"}"></div>

            <div class="toggle-row">
              <span style="font-size:14px;font-weight:600">Submission-bingo</span>
              <label class="toggle-switch">
                <input type="checkbox" id="submissionBingoToggle" ${submissionBingoEnabled ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p style="margin-top:-4px">Slå på för en rolig sidoutmaning: en bricka med 25 slumpade submissions per månad. Kryssa i rader, kryss (X) och hörn för XP.</p>

          </div>
          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Avancerad meny (Gym)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="gymMenuToggle" ${gymMenuEnabled ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="margin-top:-4px">Hantera dina gympass och vilka övningar som räknas som personbästa.</p>
          <div id="gymSplitsList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${gymMenuEnabled ? "" : "display:none"}"></div>
          <div id="gymSplitsDefaultControls" class="settings-indent" style="margin-top:8px;${gymMenuEnabled ? "" : "display:none"}"></div>
          <p class="settings-indent" style="margin-top:6px;${gymMenuEnabled ? "" : "display:none"}" id="gymExercisesHint">Övningar per gympass (för "Starta pass"):</p>
          <div id="gymExercisesManagement" class="settings-indent" style="display:flex;flex-direction:column;gap:14px;${gymMenuEnabled ? "" : "display:none"}"></div>
          <p class="settings-indent" style="margin-top:6px;${gymMenuEnabled ? "" : "display:none"}" id="pbExercisesHint">Övningar för "Personbästa!" (visas när du loggar ett gympass):</p>
          <div id="pbExercisesList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${gymMenuEnabled ? "" : "display:none"}"></div>

          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Avancerad meny (Kondition)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="konditionMenuToggle" ${konditionMenuEnabled ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="margin-top:-4px">Gäller cykel, motionscykel, löpning och egna pass i kategorin kondition.</p>
          <div id="konditionPbList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${konditionMenuEnabled ? "" : "display:none"}"></div>

        </div>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Avancerad meny Kalorier</span>
          <label class="toggle-switch">
            <input type="checkbox" id="presetsMenuToggle" ${presetsSectionOpen ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px">Redigera snabbknappar och hantera hur makros (protein/fett/kolhydrater) färgkodas.</p>
        <div id="presetsBody" style="display:flex;flex-direction:column;gap:10px;${presetsSectionOpen ? "" : "display:none"}">
          <div style="font-size:13px;color:var(--muted);margin-bottom:0;font-weight:600">Hantera snabbknappar</div>
          <div style="font-size:12px;font-weight:700;color:var(--muted)">Ätit</div>
          <div id="presetsEatenList" style="display:flex;flex-direction:column;gap:6px"></div>
          <div style="display:flex;gap:8px">
            <input type="text" id="newEatenLabel" placeholder="Namn" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
            <input type="number" inputmode="numeric" id="newEatenKcal" placeholder="kcal" style="width:70px;flex-shrink:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 8px;color:var(--text);font-size:13px;font-family:inherit;text-align:center" />
            <button class="modal-btn primary" id="addEatenPresetBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:-4px">
            <input type="number" inputmode="decimal" id="newEatenProtein" placeholder="Protein g" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px;color:var(--text);font-size:12px;font-family:inherit;text-align:center" />
            <input type="number" inputmode="decimal" id="newEatenFat" placeholder="Fett g" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px;color:var(--text);font-size:12px;font-family:inherit;text-align:center" />
            <input type="number" inputmode="decimal" id="newEatenCarbs" placeholder="Kolh. g" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px;color:var(--text);font-size:12px;font-family:inherit;text-align:center" />
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:4px">Kalorier förbrukade</div>
          <div id="presetsBurnedList" style="display:flex;flex-direction:column;gap:6px"></div>
          <div style="display:flex;gap:8px">
            <input type="text" id="newBurnedLabel" placeholder="Namn" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
            <input type="number" inputmode="numeric" id="newBurnedKcal" placeholder="kcal" style="width:70px;flex-shrink:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 8px;color:var(--text);font-size:13px;font-family:inherit;text-align:center" />
            <button class="modal-btn primary" id="addBurnedPresetBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
          </div>

          <div style="font-size:13px;color:var(--muted);margin-bottom:0;margin-top:10px;font-weight:600">Hantera makros</div>
          <div id="macroSettingsList" style="display:flex;flex-direction:column;gap:10px"></div>
        </div>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Avancerad meny Flikar</span>
          <label class="toggle-switch">
            <input type="checkbox" id="tabOrderMenuToggle" ${tabOrderSectionOpen ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px">Slå på för att välja ikonstil, flikfärger och ändra ordningen på flikarna längst ner.</p>
        <div id="tabOrderBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${tabOrderSectionOpen ? "" : "display:none"}">
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px">Ikonstorlek</div>
          <div class="theme-row">
            <button class="theme-btn" data-nav-icon-size="tiny" style="${navIconSize === "tiny" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Liten</button>
            <button class="theme-btn" data-nav-icon-size="small" style="${navIconSize === "small" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Medel</button>
            <button class="theme-btn" data-nav-icon-size="large" style="${navIconSize === "large" ? `border-color:${tabColors.stats};color:${tabColors.stats}` : ""}">Stor</button>
          </div>
          <div class="toggle-row">
            <span style="font-size:13px;color:var(--muted)">Visa text under ikonerna</span>
            <label class="toggle-switch">
              <input type="checkbox" id="showNavLabelsToggle" ${showNavLabels ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div style="font-size:13px;color:var(--muted);margin-bottom:4px">Träningsflikens ikon</div>
          <p style="margin-top:-6px;font-size:12px;color:var(--muted)">Nya ikoner låses upp när du levlar upp.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${(() => {
              const currentLevel = computeLevelInfo(totalXp()).level;
              return Object.keys(TRAINING_TAB_ICON_CHOICES).map((key) => {
                const unlockLevel = TRAINING_TAB_ICON_UNLOCK_LEVEL[key] || 1;
                const isUnlocked = currentLevel >= unlockLevel || debugForceUnlockCosmetics;
                return `
                  <div style="display:flex;flex-direction:column;align-items:center;gap:3px;width:52px">
                    <button ${isUnlocked ? `data-training-tab-icon="${key}"` : ""} aria-label="${key}" style="width:52px;height:52px;padding:4px;border-radius:12px;border:1.5px solid ${trainingTabIcon === key ? tabColors.traning : "var(--border2)"};background:${trainingTabIcon === key ? tabColors.traning + "26" : "transparent"};cursor:${isUnlocked ? "pointer" : "default"}">
                      <img src="${TRAINING_TAB_ICON_CHOICES[key]}" alt="" style="width:100%;height:100%;object-fit:contain;display:block;${isUnlocked ? "" : "filter:grayscale(1);opacity:0.35;"}" />
                    </button>
                    ${!isUnlocked ? `<span style="font-size:10px;color:var(--muted2);text-align:center;line-height:1.1">Lvl ${unlockLevel}</span>` : ""}
                  </div>
                `;
              }).join("");
            })()}
          </div>

          <div id="tabOrderList" style="display:flex;flex-direction:column;gap:6px"></div>

          <div style="font-size:13px;color:var(--muted);margin-bottom:0;margin-top:10px;font-weight:600">Flikfärg (nav-bar &amp; glow)</div>
          <p style="margin-top:-4px;font-size:12px;color:var(--muted)">Färgen på den aktiva fliken längst ner, inklusive glow-effekten. Fler effekter låses upp när du levlar upp.</p>
          <div id="navGlowSection"></div>
          <button class="modal-btn secondary" id="resetNavGlowColorsBtn">Återställ till standardfärg</button>

          <div style="font-size:13px;color:var(--muted);margin-bottom:0;margin-top:10px;font-weight:600">Färger</div>
          <p style="margin-top:-4px;font-size:12px;color:var(--muted)">Färgen som används inne i själva Vikt-/Tränings-/Kalorier-/Statistik-rutorna.</p>
          ${TABS.map((t) => `
            <div style="display:flex;align-items:center;gap:10px">
              <input type="color" data-tab-color="${t.key}" value="${tabColors[t.key]}" style="width:32px;height:32px;border:1px solid var(--border2);border-radius:8px;background:var(--input-bg);padding:2px;cursor:pointer" />
              <span style="font-size:14px;font-weight:600">${t.label}</span>
            </div>
          `).join("")}
          <button class="modal-btn secondary" id="resetColorsBtn">Återställ till standardfärg</button>
          <button class="modal-btn secondary" id="manageTypesFromColorsBtn">Hantera träningspass (färg &amp; minuter)</button>
        </div>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Säkerhetskopiering</span>
          <label class="toggle-switch">
            <input type="checkbox" id="backupMenuToggle" ${backupSectionOpen ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px">Ladda ner, dela, exportera till Excel eller återställ din data och dina inställningar.</p>
        <div id="backupBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${backupSectionOpen ? "" : "display:none"}">
          <div style="font-size:12px;font-weight:700;color:var(--muted)">Data (vikt, träning, kalorier)</div>
          <button class="modal-btn primary" id="exportDataBtn">${ICONS.download}Ladda ner backup av data</button>
          <button class="modal-btn secondary" id="shareDataBtn">${ICONS.upload}Dela data (t.ex. till Google Drive)</button>
          <button class="modal-btn secondary" id="exportExcelBtn">${ICONS.download}Exportera till Excel</button>
          <button class="modal-btn secondary" id="exportCsvBtn">${ICONS.download}Exportera som CSV</button>
          <button class="modal-btn secondary" id="exportPdfBtn">${ICONS.download}Exportera som PDF</button>

          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">Inställningar (färger, flikordning, egna pass, snabbknappar m.m.)</div>
          <button class="modal-btn primary" id="exportSettingsBtn">${ICONS.download}Ladda ner backup av inställningar</button>

          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">Återställ</div>
          <button class="modal-btn secondary" id="importBtn">${ICONS.upload}Återställ från backup-fil</button>
          <div id="modalStatus" class="status-msg" style="display:none"></div>
        </div>

        <button class="modal-btn secondary" id="openAboutBtn" style="margin-top:6px">ℹ️ Om Workout Tracker</button>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Debug / testläge</span>
          <label class="toggle-switch">
            <input type="checkbox" id="debugMenuToggle" ${debugSectionOpen ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px">Testa bälten och nivåer, eller lås upp valfria prestationer manuellt.</p>
        <div id="debugBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${debugSectionOpen ? "" : "display:none"}">
          ${debugUnlockedThisSession ? `
          <div style="font-size:12px;font-weight:700;color:var(--muted)">Hoppa till nivå</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((lvl) => `<button class="chip" data-debug-belt="${lvl}">${getBeltForLevel(lvl).name} (level ${lvl})</button>`).join("")}
          </div>
          <button class="modal-btn secondary" id="debugPlusLevelBtn">+1 Level</button>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" inputmode="numeric" id="debugLevelInput" placeholder="Valfri nivå" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit" />
            <button class="modal-btn primary" id="debugSetLevelBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Sätt</button>
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">Lägg till XP (från din nuvarande level, för att se hur baren fylls)</div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" inputmode="numeric" id="debugXpInput" placeholder="T.ex. 500" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit" />
            <button class="modal-btn primary" id="debugSetXpBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Lägg till</button>
          </div>
          <button class="modal-btn secondary" id="debugResetXpBtn">Återställ (använd riktig XP)</button>

          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">Prestationer</div>
          <button class="modal-btn secondary" id="debugUnlockAllBtn">🔓 Lås upp alla prestationer</button>
          <button class="modal-btn secondary" id="debugLockAllBtn">Lås alla prestationer igen</button>
          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">Lås upp/av valfri prestation</div>
          <div id="debugAchievementsList" style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto"></div>

          <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">Kosmetik (flikikoner &amp; profilram/flik-sken)</div>
          <p style="margin-top:-4px;font-size:12px;color:var(--muted)">Visar alla ikoner och sken som upplåsta för förhandsgranskning, utan att ändra din riktiga level.</p>
          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Lås upp alla för test</span>
            <label class="toggle-switch">
              <input type="checkbox" id="debugForceUnlockCosmeticsToggle" ${debugForceUnlockCosmetics ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          ` : `
          <div style="font-size:12px;color:var(--muted)">Debug-läget är låst. Ange PIN-kod för att låsa upp.</div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="password" inputmode="numeric" id="debugPinInput" placeholder="PIN-kod" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;letter-spacing:2px" />
            <button class="modal-btn primary" id="debugPinSubmitBtn" style="width:auto;padding:9px 14px;flex-shrink:0">Lås upp</button>
          </div>
          <div id="debugPinError" style="display:none;color:#E15554;font-size:12px">Fel PIN-kod.</div>
          `}
        </div>

        <div class="modal-close" id="modalCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  modalRoot.querySelectorAll("[data-theme-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      themeMode = btn.dataset.themeBtn;
      saveThemeMode();
      markWeeklyMiscFlag("themeChangedWeek");
      applyTheme();
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openBackupModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
    });
  });
  document.getElementById("bgAccentColorInput").addEventListener("input", (e) => {
    bgAccentHex = e.target.value;
    saveBgAccentHex();
    applyBgTint();
    const resetBtn = document.getElementById("bgAccentResetBtn");
    if (!resetBtn) {
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openBackupModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
    }
  });
  const bgAccentResetBtn = document.getElementById("bgAccentResetBtn");
  if (bgAccentResetBtn) {
    bgAccentResetBtn.addEventListener("click", () => {
      bgAccentHex = null;
      saveBgAccentHex();
      applyBgTint();
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openBackupModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
    });
  }
  modalRoot.querySelectorAll("[data-level-theme-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      levelTheme = btn.dataset.levelThemeBtn;
      saveLevelTheme();
      markWeeklyMiscFlag("levelThemeChangedWeek");
      renderNav();
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openBackupModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
      if (activeTab === "stats") renderStats();
    });
  });
  const openOnboardingGuideBtn = document.getElementById("openOnboardingGuideBtn");
  if (openOnboardingGuideBtn) openOnboardingGuideBtn.addEventListener("click", openOnboardingGuideModal);
  const settingsSearchInput = document.getElementById("settingsSearchInput");
  const settingsSearchResults = document.getElementById("settingsSearchResults");
  if (settingsSearchInput) {
    settingsSearchInput.addEventListener("input", (e) => {
      const results = searchSettingsIndex(e.target.value);
      if (!results.length) { settingsSearchResults.style.display = "none"; settingsSearchResults.innerHTML = ""; return; }
      settingsSearchResults.innerHTML = results.map((r, i) => `
        <div data-search-result="${i}" style="padding:10px 12px;cursor:pointer;font-size:13px;${i > 0 ? "border-top:1px solid var(--border)" : ""}">${r.label}</div>
      `).join("");
      settingsSearchResults.style.display = "block";
      settingsSearchResults.querySelectorAll("[data-search-result]").forEach((row) => {
        row.addEventListener("click", () => {
          const entry = results[parseInt(row.dataset.searchResult, 10)];
          settingsSearchResults.style.display = "none";
          settingsSearchInput.value = "";
          revealSettingsSearchResult(entry);
        });
      });
    });
  }
  document.getElementById("openProfileBtn").addEventListener("click", () => {
    profileModalReturnsToSettings = true;
    const sheet = modalRoot.querySelector(".modal-sheet");
    profileModalReturnScrollTop = sheet ? sheet.scrollTop : 0;
    openProfileModal();
  });
  document.getElementById("openAboutBtn").addEventListener("click", () => {
    const sheet = modalRoot.querySelector(".modal-sheet");
    aboutModalReturnScrollTop = sheet ? sheet.scrollTop : 0;
    openAboutModal();
  });
  document.getElementById("advancedMenuToggle").addEventListener("change", (e) => {
    advancedMenuEnabled = e.target.checked;
    saveAdvancedMenuEnabled();
    document.getElementById("advancedQuestionsList").style.display = advancedMenuEnabled ? "flex" : "none";
    const sheetA = modalRoot.querySelector(".modal-sheet");
    const scrollTopA = sheetA ? sheetA.scrollTop : 0;
    if (activeTab === "traning") renderTraning();
    if (sheetA) sheetA.scrollTop = scrollTopA;
  });
  renderAdvancedQuestionsList();
  renderSubmissionTypesList();
  document.getElementById("submissionsMenuToggle").addEventListener("change", (e) => {
    submissionsMenuEnabled = e.target.checked;
    saveSubmissionsMenuEnabled();
    document.getElementById("submissionTypesList").style.display = submissionsMenuEnabled ? "flex" : "none";
    const sheetB = modalRoot.querySelector(".modal-sheet");
    const scrollTopB = sheetB ? sheetB.scrollTop : 0;
    if (activeTab === "stats") renderStats();
    if (activeTab === "traning") renderTraning();
    if (sheetB) sheetB.scrollTop = scrollTopB;
  });
  document.getElementById("submissionBingoToggle").addEventListener("change", (e) => {
    submissionBingoEnabled = e.target.checked;
    saveSubmissionBingoEnabled();
    if (submissionBingoEnabled && !bingoCard) startNewBingoCard();
    if (activeTab === "stats") renderStats();
  });
  document.getElementById("gymMenuToggle").addEventListener("change", (e) => {
    gymMenuEnabled = e.target.checked;
    saveGymMenuEnabled();
    document.getElementById("gymSplitsList").style.display = gymMenuEnabled ? "flex" : "none";
    document.getElementById("gymSplitsDefaultControls").style.display = gymMenuEnabled ? "" : "none";
    document.getElementById("gymExercisesManagement").style.display = gymMenuEnabled ? "flex" : "none";
    document.getElementById("gymExercisesHint").style.display = gymMenuEnabled ? "" : "none";
    document.getElementById("pbExercisesList").style.display = gymMenuEnabled ? "flex" : "none";
    document.getElementById("pbExercisesHint").style.display = gymMenuEnabled ? "" : "none";
    const sheetC = modalRoot.querySelector(".modal-sheet");
    const scrollTopC = sheetC ? sheetC.scrollTop : 0;
    if (activeTab === "traning") renderTraning();
    if (sheetC) sheetC.scrollTop = scrollTopC;
  });
  renderGymSplitsList();
  renderGymSplitsDefaultControls();
  renderGymExercisesManagement();
  renderPbExercisesList();
  document.getElementById("konditionMenuToggle").addEventListener("change", (e) => {
    konditionMenuEnabled = e.target.checked;
    saveKonditionMenuEnabled();
    document.getElementById("konditionPbList").style.display = konditionMenuEnabled ? "flex" : "none";
    const sheetD = modalRoot.querySelector(".modal-sheet");
    const scrollTopD = sheetD ? sheetD.scrollTop : 0;
    if (activeTab === "traning") renderTraning();
    if (sheetD) sheetD.scrollTop = scrollTopD;
  });
  renderKonditionPbList();
  document.getElementById("trainingAdvancedSectionToggle").addEventListener("change", (e) => {
    trainingAdvancedSectionOpen = e.target.checked;
    document.getElementById("trainingAdvancedBody").style.display = trainingAdvancedSectionOpen ? "flex" : "none";
  });
  document.getElementById("kampsportAdvancedSectionToggle").addEventListener("change", (e) => {
    handleKampsportToggleChange(e.target.checked);
    const body = document.getElementById("kampsportAdvancedBody");
    if (body) body.style.display = kampsportAdvancedSectionOpen ? "flex" : "none";
  });
  document.getElementById("viktAdvancedSectionToggle").addEventListener("change", (e) => {
    bodyMeasurementsEnabled = e.target.checked;
    saveBodyMeasurementsEnabled();
    document.getElementById("viktAdvancedBody").style.display = bodyMeasurementsEnabled ? "flex" : "none";
    if (activeTab === "vikt") renderVikt();
  });
  renderBodyMeasurementTypesList();
  renderTabOrderList();
  renderNavGlowSection();
  if (debugSectionOpen && debugUnlockedThisSession) renderDebugAchievementsList();
  document.getElementById("tabOrderMenuToggle").addEventListener("change", (e) => {
    tabOrderSectionOpen = e.target.checked;
    document.getElementById("tabOrderBody").style.display = tabOrderSectionOpen ? "flex" : "none";
  });
  modalRoot.querySelectorAll("[data-nav-icon-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navIconSize = btn.dataset.navIconSize;
      saveNavIconSize();
      markWeeklyMiscFlag("iconSizeChangedWeek");
      renderNav();
      const sheet = modalRoot.querySelector(".modal-sheet");
      const scrollTop = sheet ? sheet.scrollTop : 0;
      openBackupModal();
      const newSheet = modalRoot.querySelector(".modal-sheet");
      if (newSheet) newSheet.scrollTop = scrollTop;
    });
  });
  const showNavLabelsToggle = document.getElementById("showNavLabelsToggle");
  if (showNavLabelsToggle) {
    showNavLabelsToggle.addEventListener("change", (e) => {
      showNavLabels = e.target.checked;
      saveShowNavLabels();
      renderNav();
    });
  }
  modalRoot.querySelectorAll("[data-training-tab-icon]").forEach((btn) => {
    btn.addEventListener("click", () => {
      trainingTabIcon = trainingTabIcon === btn.dataset.trainingTabIcon ? null : btn.dataset.trainingTabIcon;
      saveTrainingTabIcon();
      renderNav();
      renderTabOrderList();
      modalRoot.querySelectorAll("[data-training-tab-icon]").forEach((otherBtn) => {
        const isSelected = trainingTabIcon === otherBtn.dataset.trainingTabIcon;
        otherBtn.style.borderColor = isSelected ? tabColors.traning : "var(--border2)";
        otherBtn.style.background = isSelected ? tabColors.traning + "26" : "transparent";
      });
    });
  });
  document.getElementById("presetsMenuToggle").addEventListener("change", (e) => {
    presetsSectionOpen = e.target.checked;
    document.getElementById("presetsBody").style.display = presetsSectionOpen ? "flex" : "none";
  });
  document.getElementById("backupMenuToggle").addEventListener("change", (e) => {
    backupSectionOpen = e.target.checked;
    document.getElementById("backupBody").style.display = backupSectionOpen ? "flex" : "none";
  });
  const reopenAccountSection = () => {
    const sheet = modalRoot.querySelector(".modal-sheet");
    const scrollTop = sheet ? sheet.scrollTop : 0;
    openBackupModal();
    const newSheet = modalRoot.querySelector(".modal-sheet");
    if (newSheet) newSheet.scrollTop = scrollTop;
  };
  modalRoot.querySelectorAll("[data-auth-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      authFormMode = btn.dataset.authMode;
      authFormError = "";
      reopenAccountSection();
    });
  });
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener("click", async () => {
      const email = (document.getElementById("authEmailInput").value || "").trim();
      const password = document.getElementById("authPasswordInput").value || "";
      if (!email || !password) {
        authFormError = "Fyll i både e-post och lösenord.";
        reopenAccountSection();
        return;
      }
      authFormBusy = true;
      authFormError = "";
      reopenAccountSection();
      try {
        if (authFormMode === "signup") {
          await authSignUp(email, password);
          authFormError = "Konto skapat! Om e-postbekräftelse krävs, kolla din inkorg innan du loggar in.";
        } else {
          await authSignIn(email, password);
        }
      } catch (err) {
        authFormError = (err && err.message) || "Något gick fel.";
      } finally {
        authFormBusy = false;
        reopenAccountSection();
      }
    });
  }
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      const email = (document.getElementById("authEmailInput").value || "").trim();
      if (!email) {
        authFormError = "Skriv in din e-post ovan först, så skickar vi en återställningslänk dit.";
        reopenAccountSection();
        return;
      }
      authFormBusy = true;
      reopenAccountSection();
      try {
        await authResetPasswordForEmail(email);
        authFormError = "Om kontot finns har vi skickat ett mejl med en återställningslänk.";
      } catch (err) {
        authFormError = (err && err.message) || "Kunde inte skicka återställningsmejl.";
      } finally {
        authFormBusy = false;
        reopenAccountSection();
      }
    });
  }
  document.getElementById("debugMenuToggle").addEventListener("change", (e) => {
    debugSectionOpen = e.target.checked;
    document.getElementById("debugBody").style.display = debugSectionOpen ? "flex" : "none";
    const sheet1 = modalRoot.querySelector(".modal-sheet");
    const scrollTop1 = sheet1 ? sheet1.scrollTop : 0;
    openBackupModal();
    const newSheet1 = modalRoot.querySelector(".modal-sheet");
    if (newSheet1) newSheet1.scrollTop = scrollTop1;
  });
  const debugPinSubmitBtn = document.getElementById("debugPinSubmitBtn");
  if (debugPinSubmitBtn) {
    const tryUnlock = async () => {
      const input = document.getElementById("debugPinInput");
      const enteredHash = await sha256Hex(input.value);
      if (enteredHash === DEBUG_PIN_HASH) {
        debugUnlockedThisSession = true;
        const sheet2 = modalRoot.querySelector(".modal-sheet");
        const scrollTop2 = sheet2 ? sheet2.scrollTop : 0;
        openBackupModal();
        const newSheet2 = modalRoot.querySelector(".modal-sheet");
        if (newSheet2) newSheet2.scrollTop = scrollTop2;
      } else {
        document.getElementById("debugPinError").style.display = "block";
        input.value = "";
        input.focus();
      }
    };
    debugPinSubmitBtn.addEventListener("click", tryUnlock);
    document.getElementById("debugPinInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryUnlock();
    });
  }
  if (debugUnlockedThisSession) {
    document.querySelectorAll("[data-debug-belt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        withLevelUpCelebration(() => {
          const target = xpNeededForLevel(parseInt(btn.dataset.debugBelt, 10));
          debugXpOverride = target - (achievementXp() + logXp);
          saveDebugXpOverride();
        });
        if (activeTab === "stats") renderStats(); else render();
        showModalStatus(`Level satt till ${btn.dataset.debugBelt} (debug).`, "ok");
      });
    });
    document.getElementById("debugPlusLevelBtn").addEventListener("click", () => {
      const currentLevel = computeLevelInfo(totalXp()).level;
      withLevelUpCelebration(() => {
        const target = xpNeededForLevel(currentLevel + 1);
        debugXpOverride = target - (achievementXp() + logXp);
        saveDebugXpOverride();
      });
      if (activeTab === "stats") renderStats(); else render();
      showModalStatus(`Level satt till ${currentLevel + 1} (debug).`, "ok");
    });
    document.getElementById("debugSetLevelBtn").addEventListener("click", () => {
      const input = document.getElementById("debugLevelInput");
      const lvl = parseInt(input.value, 10);
      if (isNaN(lvl) || lvl < 1) { input.focus(); return; }
      withLevelUpCelebration(() => {
        const target = xpNeededForLevel(lvl);
        debugXpOverride = target - (achievementXp() + logXp);
        saveDebugXpOverride();
      });
      if (activeTab === "stats") renderStats(); else render();
      showModalStatus(`Level satt till ${lvl} (debug).`, "ok");
    });
    document.getElementById("debugSetXpBtn").addEventListener("click", () => {
      const input = document.getElementById("debugXpInput");
      const addXp = parseInt(input.value, 10);
      if (isNaN(addXp)) { input.focus(); return; }
      withLevelUpCelebration(() => {
        debugXpOverride += addXp;
        saveDebugXpOverride();
      });
      if (activeTab === "stats") renderStats(); else render();
      input.value = "";
      showModalStatus(`+${addXp} XP tillagt (debug), totalt ${totalXp()} XP.`, "ok");
    });
    document.getElementById("debugResetXpBtn").addEventListener("click", () => {
      debugXpOverride = 0;
      saveDebugXpOverride();
      if (activeTab === "stats") renderStats(); else render();
      showModalStatus("Debug-bonus borttagen, riktig XP (prestationer + loggning) används igen.", "ok");
    });
    document.getElementById("debugForceUnlockCosmeticsToggle").addEventListener("change", (e) => {
      debugForceUnlockCosmetics = e.target.checked;
      saveDebugForceUnlockCosmetics();
      renderNav();
      const sheetCosm = modalRoot.querySelector(".modal-sheet");
      const scrollTopCosm = sheetCosm ? sheetCosm.scrollTop : 0;
      openBackupModal();
      const newSheetCosm = modalRoot.querySelector(".modal-sheet");
      if (newSheetCosm) newSheetCosm.scrollTop = scrollTopCosm;
      showModalStatus(debugForceUnlockCosmetics ? "Alla ikoner & ramar visas som upplåsta (debug)." : "Kosmetik-upplåsning avstängd, riktiga nivåer gäller igen.", "ok");
    });
    document.getElementById("debugUnlockAllBtn").addEventListener("click", () => {
      ACHIEVEMENTS.forEach((a) => {
        if (!unlockedAchievements.includes(a.id)) unlockedAchievements.push(a.id);
        unlockedAchievementDates[a.id] = todayISO();
      });
      saveUnlockedAchievements();
      saveUnlockedAchievementDates();
      // Debug-massupplåsningen kringgår den vanliga checkAchievements()-slingan
      // (den hoppar bara över redan upplåsta prestationer, så "anyNew" hade
      // aldrig blivit true här) - därför måste platina-logiken köras separat
      // så att markeringen faktiskt sätts och firandet visas, precis som vid
      // en riktig upplåsning.
      if (!platinumUnlockedAt && isAllAchievementsUnlocked() && unlockedAchievements.includes("platinum_all")) {
        platinumUnlockedAt = todayISO();
        savePlatinumUnlockedAt();
        celebrationQueue.push({ type: "platinum" });
        celebrationQueue.push({ type: "newgameplus_intro" });
      }
      renderDebugAchievementsList();
      if (activeTab === "stats") renderStats(); else render();
      if (!document.getElementById("celebrationOverlay")) showNextCelebration();
      showModalStatus(`Alla ${ACHIEVEMENTS.length} prestationer upplåsta (debug).`, "ok");
    });
    document.getElementById("debugLockAllBtn").addEventListener("click", () => {
      unlockedAchievements = [];
      unlockedAchievementDates = {};
      saveUnlockedAchievements();
      saveUnlockedAchievementDates();
      // Nollställ även platina-markören så 100%-firandet kan testas om.
      platinumUnlockedAt = null;
      savePlatinumUnlockedAt();
      renderDebugAchievementsList();
      if (activeTab === "stats") renderStats(); else render();
      showModalStatus("Alla prestationer låsta igen (debug).", "ok");
    });
  }
  document.getElementById("hapticsToggle").addEventListener("change", (e) => {
    hapticsEnabled = e.target.checked;
    saveHaptics();
    vibrate();
  });
  document.getElementById("soundEffectsToggle").addEventListener("change", (e) => {
    soundEffectsEnabled = e.target.checked;
    saveSoundEffects();
    if (soundEffectsEnabled) playCelebrationChime("achievement");
  });
  modalRoot.querySelectorAll("[data-tab-color]").forEach((input) => {
    input.addEventListener("input", (e) => {
      tabColors[input.dataset.tabColor] = e.target.value;
      saveTabColors();
      markWeeklyMiscFlag("tabColorChangedWeek");
      applyAccentVar();
      render();
    });
  });
  document.getElementById("resetColorsBtn").addEventListener("click", () => {
    tabColors = { ...TAB_COLOR_DEFAULTS };
    saveTabColors();
    render();
    const sheet = modalRoot.querySelector(".modal-sheet");
    const scrollTop = sheet ? sheet.scrollTop : 0;
    openBackupModal();
    const newSheet = modalRoot.querySelector(".modal-sheet");
    if (newSheet) newSheet.scrollTop = scrollTop;
  });
  document.getElementById("resetNavGlowColorsBtn").addEventListener("click", () => {
    navGlowColors = { ...TAB_COLOR_DEFAULTS };
    saveNavGlowColors();
    renderNav();
    renderNavGlowSection();
  });
  document.getElementById("manageTypesFromColorsBtn").addEventListener("click", () => {
    typesModalReturnsToSettings = true;
    const sheet = modalRoot.querySelector(".modal-sheet");
    typesModalReturnScrollTop = sheet ? sheet.scrollTop : 0;
    openManageTypesModal();
  });
  renderPresetLists();
  renderMacroSettingsList();
  document.getElementById("addEatenPresetBtn").addEventListener("click", () => addPreset("eaten", "newEatenLabel", "newEatenKcal"));
  document.getElementById("addBurnedPresetBtn").addEventListener("click", () => addPreset("burned", "newBurnedLabel", "newBurnedKcal"));
  wireEnterSubmit(["newEatenLabel", "newEatenKcal", "newEatenProtein", "newEatenFat", "newEatenCarbs"], document.getElementById("addEatenPresetBtn"));
  wireEnterSubmit(["newBurnedLabel", "newBurnedKcal"], document.getElementById("addBurnedPresetBtn"));
  document.getElementById("exportExcelBtn").addEventListener("click", exportExcel);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
  document.getElementById("exportPdfBtn").addEventListener("click", exportPdf);
  document.getElementById("exportDataBtn").addEventListener("click", exportDataBackup);
  document.getElementById("shareDataBtn").addEventListener("click", () => shareBackup("data"));
  document.getElementById("exportSettingsBtn").addEventListener("click", exportSettingsBackup);
  document.getElementById("importBtn").addEventListener("click", () => importFileInput.click());
  document.getElementById("modalCloseBtn").addEventListener("click", closeBackupModal);
  document.getElementById("settingsModalBackBtn").addEventListener("click", closeBackupModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") { closeBackupModal(); handleModalClosedByUser(); }
  });
}

function renderDebugAchievementsList() {
  const list = document.getElementById("debugAchievementsList");
  if (!list) return;
  list.innerHTML = ACHIEVEMENT_CATEGORIES.map((cat) => {
    const items = cat.ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
    return `
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-top:4px">${cat.label}</div>
      ${items.map((a) => {
        const done = unlockedAchievements.includes(a.id);
        return `
          <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:8px;padding:6px 10px">
            <span style="flex:1;font-size:12.5px;font-weight:600;color:${done ? tabColors.stats : "var(--text)"}">${a.title}${a.secret ? " 🔒" : ""}</span>
            <label class="toggle-switch">
              <input type="checkbox" data-debug-achievement="${a.id}" ${done ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        `;
      }).join("")}
    `;
  }).join("");
  list.querySelectorAll("[data-debug-achievement]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const id = input.dataset.debugAchievement;
      if (e.target.checked) {
        if (!unlockedAchievements.includes(id)) unlockedAchievements.push(id);
        unlockedAchievementDates[id] = todayISO();
      } else {
        unlockedAchievements = unlockedAchievements.filter((x) => x !== id);
        delete unlockedAchievementDates[id];
      }
      saveUnlockedAchievements();
      saveUnlockedAchievementDates();
      renderDebugAchievementsList();
      if (activeTab === "stats") renderStats();
    });
  });
}

function renderTabOrderList() {
  const list = document.getElementById("tabOrderList");
  if (!list) return;
  list.innerHTML = TABS.map((t, i) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
      <img src="${resolveTabEmblem(t)}" alt="${t.label}" style="width:24px;height:24px;object-fit:contain;flex-shrink:0" />
      <span style="flex:1;font-size:14px;font-weight:600">${t.label}</span>
      <button class="delete-btn" data-tab-move-up="${i}" ${i === 0 ? "disabled style='opacity:0.25'" : ""}>${ICONS.up}</button>
      <button class="delete-btn" data-tab-move-down="${i}" ${i === TABS.length - 1 ? "disabled style='opacity:0.25'" : ""}>${ICONS.down}</button>
    </div>
  `).join("");
  list.querySelectorAll("[data-tab-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.tabMoveUp, 10);
      if (i > 0) {
        [tabOrder[i - 1], tabOrder[i]] = [tabOrder[i], tabOrder[i - 1]];
        saveTabOrder();
        rebuildTabs();
        renderTabOrderList();
        renderNav();
      }
    });
  });
  list.querySelectorAll("[data-tab-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.tabMoveDown, 10);
      if (i < TABS.length - 1) {
        [tabOrder[i + 1], tabOrder[i]] = [tabOrder[i], tabOrder[i + 1]];
        saveTabOrder();
        rebuildTabs();
        renderTabOrderList();
        renderNav();
      }
    });
  });
}

// Fristående, likt renderTabOrderList() - ritar bara om sin egen container
// istället för hela inställningsmenyn. Att välja en flikfärg/effekt ska
// kännas som en liten justering, inte att sidan laddas om.
function renderNavGlowSection() {
  const wrap = document.getElementById("navGlowSection");
  if (!wrap) return;
  const currentLevel = computeLevelInfo(totalXp()).level;
  wrap.innerHTML = TABS.map((t) => {
    const currentColor = navGlowColors[t.key];
    const isEffect = FRAME_EFFECT_KEYS.includes(currentColor);
    return `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:10px">
          <input type="color" data-nav-glow-color="${t.key}" value="${isEffect ? "#FFFFFF" : currentColor}" style="width:32px;height:32px;border:1px solid var(--border2);border-radius:8px;background:var(--input-bg);padding:2px;cursor:pointer" />
          <span style="font-size:14px;font-weight:600;flex:1">${t.label}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${FRAME_EFFECT_KEYS.map((key) => {
            const unlockLevel = PROFILE_FRAME_UNLOCK_LEVEL[key] || 1;
            const isUnlocked = currentLevel >= unlockLevel || debugForceUnlockCosmetics;
            const isSelected = currentColor === key;
            const swatch = profileFrameWrapStyle(key, 2);
            return `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:40px">
                <button ${isUnlocked ? `data-nav-glow-effect="${t.key}|${key}"` : ""} aria-label="${PROFILE_FRAMES[key].label}" title="${PROFILE_FRAMES[key].label}" style="width:36px;height:36px;border-radius:50%;padding:2px;border:1.5px solid ${isSelected ? tabColors.stats : "transparent"};background:none;cursor:${isUnlocked ? "pointer" : "default"}">
                  <div class="${swatch.className}" style="${swatch.style};width:100%;height:100%;${isUnlocked ? "" : "filter:grayscale(1);opacity:0.35;"}">
                    <div style="width:100%;height:100%;border-radius:50%;background:var(--input-bg)"></div>
                  </div>
                </button>
                ${!isUnlocked ? `<span style="font-size:9px;color:var(--muted2);text-align:center;line-height:1.1">Lvl ${unlockLevel}</span>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");
  wrap.querySelectorAll("[data-nav-glow-color]").forEach((input) => {
    input.addEventListener("input", (e) => {
      navGlowColors[input.dataset.navGlowColor] = e.target.value;
      saveNavGlowColors();
      markWeeklyMiscFlag("tabColorChangedWeek");
      renderNav();
      updateNavGlowSwatchSelection(input.dataset.navGlowColor);
    });
  });
  wrap.querySelectorAll("[data-nav-glow-effect]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [tabKey, effectKey] = btn.dataset.navGlowEffect.split("|");
      navGlowColors[tabKey] = navGlowColors[tabKey] === effectKey ? (TAB_COLOR_DEFAULTS[tabKey] || "#8080FF") : effectKey;
      saveNavGlowColors();
      markWeeklyMiscFlag("tabColorChangedWeek");
      renderNav();
      updateNavGlowSwatchSelection(tabKey);
    });
  });
}
// Uppdaterar bara vald-markeringen (kantfärg) och färgväljarens värde för en
// enskild flik, utan att bygga om hela listan - annars skulle ALLA rörliga
// sken-swatcharna i listan starta om sina animationer för ett enda klick.
function updateNavGlowSwatchSelection(tabKey) {
  const currentColor = navGlowColors[tabKey];
  const isEffect = FRAME_EFFECT_KEYS.includes(currentColor);
  const colorInput = document.querySelector(`[data-nav-glow-color="${tabKey}"]`);
  if (colorInput) colorInput.value = isEffect ? "#FFFFFF" : currentColor;
  document.querySelectorAll(`[data-nav-glow-effect^="${tabKey}|"]`).forEach((btn) => {
    const key = btn.dataset.navGlowEffect.split("|")[1];
    btn.style.borderColor = currentColor === key ? tabColors.stats : "transparent";
  });
}

function renderAdvancedQuestionsList() {
  const list = document.getElementById("advancedQuestionsList");
  if (!list) return;
  list.innerHTML = advancedQuestions.map((q, i) => `
    <div style="background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px">
      <div class="toggle-row" style="margin-bottom:8px">
        <input type="text" data-q-title="${i}" value="${escapeHtml(q.title)}" style="flex:1;background:transparent;border:none;color:var(--text);font-size:14px;font-weight:700;font-family:inherit;padding:2px;min-width:0" />
        <label class="toggle-switch">
          <input type="checkbox" data-q-enabled="${i}" ${q.enabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" data-q-remove="${i}">${ICONS.trash}</button>
      </div>
      <input type="text" data-q-desc="${i}" value="${escapeHtml(q.desc)}" style="width:100%;background:transparent;border:none;color:var(--muted);font-size:12.5px;font-family:inherit;padding:2px" />
    </div>
  `).join("") + `
    <div style="background:var(--input-bg);border:1px dashed var(--border2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px">
      <input type="text" id="newQuestionTitle" placeholder="Rubrik, t.ex. Motivation" style="background:transparent;border:none;color:var(--text);font-size:14px;font-weight:700;font-family:inherit;padding:2px" />
      <div style="display:flex;gap:8px">
        <input type="text" id="newQuestionDesc" placeholder="Beskrivning (valfritt)" style="flex:1;background:transparent;border:none;color:var(--muted);font-size:12.5px;font-family:inherit;padding:2px;min-width:0" />
        <button class="modal-btn primary" id="addQuestionBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
      </div>
    </div>
  `;
  list.querySelectorAll("[data-q-title]").forEach((input) => {
    input.addEventListener("input", (e) => {
      advancedQuestions[parseInt(input.dataset.qTitle, 10)].title = e.target.value;
      saveAdvancedQuestions();
    });
  });
  list.querySelectorAll("[data-q-desc]").forEach((input) => {
    input.addEventListener("input", (e) => {
      advancedQuestions[parseInt(input.dataset.qDesc, 10)].desc = e.target.value;
      saveAdvancedQuestions();
    });
  });
  list.querySelectorAll("[data-q-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      advancedQuestions[parseInt(input.dataset.qEnabled, 10)].enabled = e.target.checked;
      saveAdvancedQuestions();
      });
  });
  list.querySelectorAll("[data-q-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      advancedQuestions.splice(parseInt(btn.dataset.qRemove, 10), 1);
      saveAdvancedQuestions();
      renderAdvancedQuestionsList();
    });
  });
  const addQBtn = document.getElementById("addQuestionBtn");
  if (addQBtn) {
    addQBtn.addEventListener("click", () => {
      const titleInput = document.getElementById("newQuestionTitle");
      const descInput = document.getElementById("newQuestionDesc");
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); return; }
      advancedQuestions.push({ id: uid(), title, desc: descInput.value.trim(), enabled: true });
      saveAdvancedQuestions();
      renderAdvancedQuestionsList();
    });
    wireEnterSubmit(["newQuestionTitle", "newQuestionDesc"], addQBtn);
  }
}

function renderSubmissionTypesList() {
  const list = document.getElementById("submissionTypesList");
  if (!list) return;
  const expanded = !!settingsListExpanded.submissionTypesList;
  let html = collapsibleListHeaderHTML("submissionTypesList", "Hantera submissions", submissionTypes.length);
  const withIndex = submissionTypes.map((s, i) => ({ ...s, i }));
  const categoryOptionsHTML = (selected) => `
    <option value="" ${!selected ? "selected" : ""}>Ingen</option>
    <option value="chokes" ${selected === "chokes" ? "selected" : ""}>Stryp</option>
    <option value="armlocks" ${selected === "armlocks" ? "selected" : ""}>Armlås</option>
    <option value="leglocks" ${selected === "leglocks" ? "selected" : ""}>Ben- och fotledsvarianter</option>
  `;
  const rowHTML = (s) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
      <input type="text" data-s-label="${s.i}" value="${escapeHtml(s.label)}" style="flex:1;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px;min-width:0" />
      <select data-s-category="${s.i}" style="background:transparent;border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:12px;font-family:inherit;padding:4px">
        ${categoryOptionsHTML(s.category)}
      </select>
      <label class="toggle-switch">
        <input type="checkbox" data-s-enabled="${s.i}" ${s.enabled ? "checked" : ""} />
        <span class="toggle-slider"></span>
      </label>
      <button class="delete-btn" data-s-remove="${s.i}">${ICONS.trash}</button>
    </div>
  `;
  if (expanded) {
    const groups = groupSubmissionsByCategory(withIndex);
    html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">` +
      groups.map((g, gi) => `<div style="font-size:12px;font-weight:700;color:var(--muted);${gi > 0 ? "margin-top:4px" : ""}">${g.label}</div>` + g.items.map(rowHTML).join("")).join("") +
      `
      <div style="display:flex;gap:8px">
        <input type="text" id="newSubmissionLabel" placeholder="t.ex. Twister" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
        <select id="newSubmissionCategory" style="background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;padding:9px 8px">
          ${categoryOptionsHTML(null)}
        </select>
        <button class="modal-btn primary" id="addSubmissionBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
  wireCollapsibleListToggles(list);
  if (!expanded) return;
  list.querySelectorAll("[data-s-label]").forEach((input) => {
    input.addEventListener("input", (e) => {
      submissionTypes[parseInt(input.dataset.sLabel, 10)].label = e.target.value;
      saveSubmissionTypes();
    });
  });
  list.querySelectorAll("[data-s-category]").forEach((select) => {
    select.addEventListener("change", (e) => {
      submissionTypes[parseInt(select.dataset.sCategory, 10)].category = e.target.value || null;
      saveSubmissionTypes();
      renderSubmissionTypesList();
    });
  });
  list.querySelectorAll("[data-s-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      submissionTypes[parseInt(input.dataset.sEnabled, 10)].enabled = e.target.checked;
      saveSubmissionTypes();
    });
  });
  list.querySelectorAll("[data-s-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      submissionTypes.splice(parseInt(btn.dataset.sRemove, 10), 1);
      saveSubmissionTypes();
      renderSubmissionTypesList();
    });
  });
  const addBtn = document.getElementById("addSubmissionBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const input = document.getElementById("newSubmissionLabel");
      const categorySelect = document.getElementById("newSubmissionCategory");
      const label = input.value.trim();
      if (!label) { input.focus(); return; }
      submissionTypes.push({ id: uid(), label, enabled: true, category: categorySelect.value || null });
      saveSubmissionTypes();
      renderSubmissionTypesList();
    });
    wireEnterSubmit(["newSubmissionLabel"], addBtn);
  }
}
SETTINGS_LIST_RENDERERS.submissionTypesList = renderSubmissionTypesList;

function renderBodyMeasurementTypesList() {
  const list = document.getElementById("bodyMeasurementTypesList");
  if (!list) return;
  const expanded = !!settingsListExpanded.bodyMeasurementTypesList;
  let html = collapsibleListHeaderHTML("bodyMeasurementTypesList", "Hantera kroppsmått", bodyMeasurementTypes.length);
  if (expanded) {
    html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">` + bodyMeasurementTypes.map((t, i) => `
      <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
        <input type="text" data-bmt-label="${i}" value="${escapeHtml(t.label)}" style="flex:1;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px;min-width:0" />
        <label class="toggle-switch">
          <input type="checkbox" data-bmt-enabled="${i}" ${t.enabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" data-bmt-remove="${i}">${ICONS.trash}</button>
      </div>
    `).join("") + `
      <div style="display:flex;gap:8px">
        <input type="text" id="newBodyMeasurementLabel" placeholder="t.ex. Vader" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
        <button class="modal-btn primary" id="addBodyMeasurementBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
  wireCollapsibleListToggles(list);
  if (!expanded) return;
  list.querySelectorAll("[data-bmt-label]").forEach((input) => {
    input.addEventListener("input", (e) => {
      bodyMeasurementTypes[parseInt(input.dataset.bmtLabel, 10)].label = e.target.value;
      saveBodyMeasurementTypes();
    });
  });
  list.querySelectorAll("[data-bmt-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      bodyMeasurementTypes[parseInt(input.dataset.bmtEnabled, 10)].enabled = e.target.checked;
      saveBodyMeasurementTypes();
    });
  });
  list.querySelectorAll("[data-bmt-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      bodyMeasurementTypes.splice(parseInt(btn.dataset.bmtRemove, 10), 1);
      saveBodyMeasurementTypes();
      renderBodyMeasurementTypesList();
    });
  });
  const addBtn = document.getElementById("addBodyMeasurementBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const input = document.getElementById("newBodyMeasurementLabel");
      const label = input.value.trim();
      if (!label) { input.focus(); return; }
      bodyMeasurementTypes.push({ id: uid(), label, enabled: true });
      saveBodyMeasurementTypes();
      renderBodyMeasurementTypesList();
    });
    wireEnterSubmit(["newBodyMeasurementLabel"], addBtn);
  }
}
SETTINGS_LIST_RENDERERS.bodyMeasurementTypesList = renderBodyMeasurementTypesList;

function renderKonditionPbList() {
  const list = document.getElementById("konditionPbList");
  if (!list) return;
  const expanded = !!settingsListExpanded.konditionPbList;
  let html = collapsibleListHeaderHTML("konditionPbList", `Hantera distanser för "Personbästa!"`, konditionPbDistances.length);
  if (expanded) {
    html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">` + konditionPbDistances.map((d, i) => `
      <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
        <input type="text" data-kpb-label="${i}" value="${escapeHtml(d.label)}" style="flex:1;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px;min-width:0" />
        <label class="toggle-switch">
          <input type="checkbox" data-kpb-enabled="${i}" ${d.enabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" data-kpb-remove="${i}">${ICONS.trash}</button>
      </div>
    `).join("") + `
      <div style="display:flex;gap:8px">
        <input type="text" id="newKonditionPbLabel" placeholder="t.ex. 1 mil" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
        <button class="modal-btn primary" id="addKonditionPbBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
  wireCollapsibleListToggles(list);
  if (!expanded) return;
  list.querySelectorAll("[data-kpb-label]").forEach((input) => {
    input.addEventListener("input", (e) => {
      konditionPbDistances[parseInt(input.dataset.kpbLabel, 10)].label = e.target.value;
      saveKonditionPbDistances();
    });
  });
  list.querySelectorAll("[data-kpb-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      konditionPbDistances[parseInt(input.dataset.kpbEnabled, 10)].enabled = e.target.checked;
      saveKonditionPbDistances();
    });
  });
  list.querySelectorAll("[data-kpb-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      konditionPbDistances.splice(parseInt(btn.dataset.kpbRemove, 10), 1);
      saveKonditionPbDistances();
      renderKonditionPbList();
    });
  });
  const addBtn = document.getElementById("addKonditionPbBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const input = document.getElementById("newKonditionPbLabel");
      const label = input.value.trim();
      if (!label) { input.focus(); return; }
      konditionPbDistances.push({ id: uid(), label, enabled: true });
      saveKonditionPbDistances();
      renderKonditionPbList();
    });
    wireEnterSubmit(["newKonditionPbLabel"], addBtn);
  }
}
SETTINGS_LIST_RENDERERS.konditionPbList = renderKonditionPbList;

function renderPbExercisesList() {
  const list = document.getElementById("pbExercisesList");
  if (!list) return;
  const expanded = !!settingsListExpanded.pbExercisesList;
  let html = collapsibleListHeaderHTML("pbExercisesList", "Hantera övningar för personbästa", pbExercises.length);
  if (expanded) {
    html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">` + pbExercises.map((p, i) => `
      <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
        <input type="text" data-pbe-label="${i}" value="${escapeHtml(p.label)}" style="flex:1;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px;min-width:0" />
        <select data-pbe-unit="${i}" ${p.id === "pullup" ? "disabled" : ""} style="background:var(--input-bg);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:12px;font-family:inherit;padding:3px 4px;flex-shrink:0${p.id === "pullup" ? ";opacity:.6" : ""}">
          <option value="kg" ${p.unit === "kg" ? "selected" : ""}>kg</option>
          <option value="reps" ${p.unit === "reps" ? "selected" : ""}>reps</option>
        </select>
        <label class="toggle-switch">
          <input type="checkbox" data-pbe-enabled="${i}" ${p.enabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" data-pbe-remove="${i}">${ICONS.trash}</button>
      </div>
    `).join("") + `
      <div style="display:flex;gap:8px">
        <input type="text" id="newPbExerciseLabel" placeholder="t.ex. Frontböj" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
        <button class="modal-btn primary" id="addPbExerciseBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
  wireCollapsibleListToggles(list);
  if (!expanded) return;
  list.querySelectorAll("[data-pbe-label]").forEach((input) => {
    input.addEventListener("input", (e) => {
      pbExercises[parseInt(input.dataset.pbeLabel, 10)].label = e.target.value;
      savePbExercises();
    });
  });
  list.querySelectorAll("[data-pbe-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      pbExercises[parseInt(input.dataset.pbeEnabled, 10)].enabled = e.target.checked;
      savePbExercises();
    });
  });
  list.querySelectorAll("[data-pbe-unit]").forEach((select) => {
    select.addEventListener("change", (e) => {
      pbExercises[parseInt(select.dataset.pbeUnit, 10)].unit = e.target.value;
      savePbExercises();
      renderPersonalRecordsCard();
    });
  });
  list.querySelectorAll("[data-pbe-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pbExercises.splice(parseInt(btn.dataset.pbeRemove, 10), 1);
      savePbExercises();
      renderPbExercisesList();
    });
  });
  const addBtn = document.getElementById("addPbExerciseBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const input = document.getElementById("newPbExerciseLabel");
      const label = input.value.trim();
      if (!label) { input.focus(); return; }
      pbExercises.push({ id: uid(), label, enabled: true, unit: "kg" });
      savePbExercises();
      renderPbExercisesList();
    });
    wireEnterSubmit(["newPbExerciseLabel"], addBtn);
  }
}
SETTINGS_LIST_RENDERERS.pbExercisesList = renderPbExercisesList;

function renderGymExercisesManagement() {
  const container = document.getElementById("gymExercisesManagement");
  if (!container) return;
  gymSplits.forEach((split) => { SETTINGS_LIST_RENDERERS[`gymExercises_${split.id}`] = renderGymExercisesManagement; });
  container.innerHTML = gymSplits.filter((g) => g.enabled).map((split) => {
    const listKey = `gymExercises_${split.id}`;
    const expanded = !!settingsListExpanded[listKey];
    const list = exercisesForSplit(split.id);
    let html = collapsibleListHeaderHTML(listKey, `Övningar — ${split.text}`, list.length);
    if (expanded) {
      html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">` + list.map((ex, i) => `
        <div style="display:flex;flex-direction:column;gap:6px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:7px 10px">
          <div style="display:flex;align-items:center;gap:8px">
            <input type="text" data-gymex-name="${split.id}:${i}" value="${escapeHtml(ex.name)}" style="flex:1;min-width:0;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px" />
            <label class="toggle-switch">
              <input type="checkbox" data-gymex-enabled="${split.id}:${i}" ${ex.enabled ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
            <button class="delete-btn" data-gymex-remove="${split.id}:${i}">${ICONS.trash}</button>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <label style="display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--muted)">Set
              <input type="number" inputmode="numeric" min="1" data-gymex-sets="${split.id}:${i}" value="${ex.defaultSets}" style="width:44px;text-align:center;background:transparent;border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:12px;font-family:inherit;padding:3px" />
            </label>
            <label style="display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--muted)">Reps
              <input type="number" inputmode="numeric" min="1" data-gymex-reps="${split.id}:${i}" value="${ex.defaultReps}" style="width:44px;text-align:center;background:transparent;border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:12px;font-family:inherit;padding:3px" />
            </label>
          </div>
        </div>
      `).join("") + `
        <div style="display:flex;gap:8px">
          <input type="text" data-gymex-new="${split.id}" placeholder="t.ex. Marklyft" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit" />
          <button class="modal-btn primary" data-gymex-add="${split.id}" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
        </div>
      </div>`;
    }
    return `<div>${html}</div>`;
  }).join("");
  wireCollapsibleListToggles(container);
  container.querySelectorAll("[data-gymex-name]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [splitId, idx] = input.dataset.gymexName.split(":");
      gymExercises[splitId][parseInt(idx, 10)].name = e.target.value;
      saveGymExercises();
    });
  });
  container.querySelectorAll("[data-gymex-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const [splitId, idx] = input.dataset.gymexEnabled.split(":");
      gymExercises[splitId][parseInt(idx, 10)].enabled = e.target.checked;
      saveGymExercises();
    });
  });
  container.querySelectorAll("[data-gymex-sets]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [splitId, idx] = input.dataset.gymexSets.split(":");
      const num = parseInt(e.target.value, 10);
      gymExercises[splitId][parseInt(idx, 10)].defaultSets = isNaN(num) || num < 1 ? 1 : num;
      saveGymExercises();
    });
  });
  container.querySelectorAll("[data-gymex-reps]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [splitId, idx] = input.dataset.gymexReps.split(":");
      const num = parseInt(e.target.value, 10);
      gymExercises[splitId][parseInt(idx, 10)].defaultReps = isNaN(num) || num < 1 ? 1 : num;
      saveGymExercises();
    });
  });
  container.querySelectorAll("[data-gymex-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [splitId, idx] = btn.dataset.gymexRemove.split(":");
      gymExercises[splitId].splice(parseInt(idx, 10), 1);
      saveGymExercises();
      renderGymExercisesManagement();
    });
  });
  container.querySelectorAll("[data-gymex-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const splitId = btn.dataset.gymexAdd;
      const input = container.querySelector(`[data-gymex-new="${splitId}"]`);
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      if (!gymExercises[splitId]) gymExercises[splitId] = [];
      gymExercises[splitId].push({ id: uid(), name, enabled: true, defaultSets: 3, defaultReps: 12 });
      saveGymExercises();
      renderGymExercisesManagement();
    });
    const splitId = btn.dataset.gymexAdd;
    const input = container.querySelector(`[data-gymex-new="${splitId}"]`);
    if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); btn.click(); } });
  });
}

function renderGymSplitsList() {
  const list = document.getElementById("gymSplitsList");
  if (!list) return;
  const expanded = !!settingsListExpanded.gymSplitsList;
  let html = collapsibleListHeaderHTML("gymSplitsList", "Hantera gympass", gymSplits.length);
  if (expanded) {
    html += `
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
        <button class="chip" data-gym-template="halvkropp">Halvkropp</button>
        <button class="chip" data-gym-template="helkropp">Helkropp A/B</button>
        <button class="chip" data-gym-template="ppl">PPL</button>
      </div>
      <p style="margin:4px 0 0;font-size:11px;color:var(--muted2)">Lägger till färdiga gympass med övningar - du kan redigera eller ta bort dem efteråt.</p>
    `;
    html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:10px">` + gymSplits.map((g, i) => `
      <div style="display:flex;align-items:center;gap:8px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
        <input type="text" data-g-text="${i}" value="${escapeHtml(g.text)}" style="flex:1;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px;min-width:0" />
        <label class="toggle-switch">
          <input type="checkbox" data-g-enabled="${i}" ${g.enabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" data-g-remove="${i}">${ICONS.trash}</button>
      </div>
    `).join("") + `
      <div style="display:flex;gap:8px">
        <input type="text" id="newGymSplitText" placeholder="t.ex. Axlar, Armar" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
        <button class="modal-btn primary" id="addGymSplitBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
  wireCollapsibleListToggles(list);
  if (!expanded) return;
  list.querySelectorAll("[data-gym-template]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addGymTemplateSplits(btn.dataset.gymTemplate);
      renderGymSplitsList();
      renderGymExercisesManagement();
    });
  });
  list.querySelectorAll("[data-g-text]").forEach((input) => {
    input.addEventListener("input", (e) => {
      gymSplits[parseInt(input.dataset.gText, 10)].text = e.target.value;
      saveGymSplits();
      renderGymExercisesManagement();
    });
  });
  list.querySelectorAll("[data-g-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      gymSplits[parseInt(input.dataset.gEnabled, 10)].enabled = e.target.checked;
      saveGymSplits();
      renderGymExercisesManagement();
    });
  });
  list.querySelectorAll("[data-g-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gymSplits.splice(parseInt(btn.dataset.gRemove, 10), 1);
      saveGymSplits();
      renderGymSplitsList();
      renderGymExercisesManagement();
    });
  });
  const addBtn = document.getElementById("addGymSplitBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const input = document.getElementById("newGymSplitText");
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      gymSplits.push({ id: uid(), text, enabled: true });
      saveGymSplits();
      renderGymSplitsList();
      renderGymExercisesManagement();
    });
    wireEnterSubmit(["newGymSplitText"], addBtn);
  }
}
SETTINGS_LIST_RENDERERS.gymSplitsList = renderGymSplitsList;

// Spara/återställ-knapparna för "min standard" - egen liten sektion, separat
// från den hopfällbara gympass-listan, placerad precis ovanför "Övningar
// per gympass" så den syns oavsett om listan är utfälld eller ej.
function renderGymSplitsDefaultControls() {
  const wrap = document.getElementById("gymSplitsDefaultControls");
  if (!wrap) return;
  if (!settingsListExpanded.gymSplitsList) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <button class="chip" id="gymSaveDefaultBtn">💾 Spara som standard</button>
      ${gymSplitsDefault ? `<button class="chip" id="gymRestoreDefaultBtn" data-armed="false">↺ Återställ standard</button>` : ""}
    </div>
    <p style="margin:4px 0 0;font-size:11px;color:var(--muted2)">${gymSplitsDefault ? "Sparad standard finns - återställ hit när du vill ha tillbaka dina egna gympass." : "Spara dina nuvarande gympass som din personliga standard - du kan alltid återställa till dem senare."}</p>
  `;
  const gymSaveDefaultBtn = document.getElementById("gymSaveDefaultBtn");
  if (gymSaveDefaultBtn) {
    gymSaveDefaultBtn.addEventListener("click", () => {
      saveCurrentGymSplitsAsDefault();
      renderGymSplitsDefaultControls();
      showInfoToast("Sparade dina gympass som standard.");
    });
  }
  const gymRestoreDefaultBtn = document.getElementById("gymRestoreDefaultBtn");
  if (gymRestoreDefaultBtn) {
    gymRestoreDefaultBtn.addEventListener("click", () => {
      if (gymRestoreDefaultBtn.dataset.armed !== "true") {
        gymRestoreDefaultBtn.dataset.armed = "true";
        gymRestoreDefaultBtn.textContent = "Tryck igen för att återställa";
        gymRestoreDefaultBtn.style.borderColor = "#E8834A";
        gymRestoreDefaultBtn.style.color = "#E8834A";
        return;
      }
      restoreGymSplitsDefault();
      renderGymSplitsList();
      renderGymExercisesManagement();
      renderGymSplitsDefaultControls();
      showInfoToast("Återställde dina standardpass.");
    });
  }
}
SETTINGS_LIST_RENDERERS.gymSplitsDefaultControls = renderGymSplitsDefaultControls;

function openEditFoodEntryModal(entryId) {
  const entry = calorieLog.find((e) => e.id === entryId);
  if (!entry) return;
  pushModalHistoryIfNeeded();
  const render = () => {
    const kcal = Math.round((entry.kcal100 * entry.amount) / 100);
    const scale = (per100) => (per100 != null ? Math.round(((per100 * entry.amount) / 100) * 10) / 10 : null);
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="editFoodEntryOverlay">
        <div class="modal-sheet">
          <h2>${escapeHtml(entry.foodName || "Redigera livsmedel")}</h2>
          <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);margin-bottom:8px">
            ${entry.protein100 != null ? `<span>Protein: ${entry.protein100} g/100g</span>` : ""}
            ${entry.fat100 != null ? `<span>Fett: ${entry.fat100} g/100g</span>` : ""}
            ${entry.carbs100 != null ? `<span>Kolhydrater: ${entry.carbs100} g/100g</span>` : ""}
          </div>
          <div class="row" style="align-items:center">
            <input type="number" inputmode="numeric" id="editFoodAmountInput" value="${entry.amount}" enterkeyhint="done" style="max-width:90px" />
            <span style="font-size:13px;color:var(--muted)">gram</span>
            <span style="font-size:15px;font-weight:700;margin-left:auto" id="editFoodComputedKcal">${kcal} kcal</span>
          </div>
          <button class="modal-btn primary" id="saveEditFoodBtn" style="width:100%;margin-top:14px">Spara ändring</button>
          <button class="modal-btn secondary" id="deleteEditFoodBtn" style="width:100%;margin-top:8px">Ta bort</button>
          <div class="modal-close" id="editFoodCloseBtn">Avbryt</div>
        </div>
      </div>
    `;
    const amountInput = document.getElementById("editFoodAmountInput");
    amountInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value.replace(",", "."));
      if (!isNaN(val)) entry.amount = val;
      const kcalEl = document.getElementById("editFoodComputedKcal");
      if (kcalEl) kcalEl.textContent = `${Math.round((entry.kcal100 * (isNaN(val) ? 0 : val)) / 100)} kcal`;
    });
    amountInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); document.getElementById("saveEditFoodBtn").click(); }
    });
    document.getElementById("editFoodCloseBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; });
    document.getElementById("editFoodEntryOverlay").addEventListener("click", (e) => {
      if (e.target.id === "editFoodEntryOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
    });
    document.getElementById("deleteEditFoodBtn").addEventListener("click", () => {
      calorieLog = calorieLog.filter((e) => e.id !== entryId);
      persistCalorieLog();
      modalRoot.innerHTML = "";
      handleModalClosedByUser();
      renderKalorier();
    });
    document.getElementById("saveEditFoodBtn").addEventListener("click", () => {
      const amount = parseFloat(amountInput.value.replace(",", "."));
      if (isNaN(amount) || amount <= 0) { amountInput.focus(); return; }
      entry.amount = amount;
      entry.kcal = Math.round((entry.kcal100 * amount) / 100);
      entry.label = `${entry.foodName} (${amount} g)`;
      const protein = scale(entry.protein100);
      const fat = scale(entry.fat100);
      const carbs = scale(entry.carbs100);
      if (protein != null) entry.protein = protein; else delete entry.protein;
      if (fat != null) entry.fat = fat; else delete entry.fat;
      if (carbs != null) entry.carbs = carbs; else delete entry.carbs;
      persistCalorieLog();
      modalRoot.innerHTML = "";
      handleModalClosedByUser();
      renderKalorier();
    });
  };
  render();
}

function openManageWeightModal() {
  pushModalHistoryIfNeeded();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="manageWeightOverlay">
      <div class="modal-sheet">
        <h2>Hantera vikt</h2>
        <p>Extra mått och val kopplade till Vikt-fliken.</p>

        <div class="toggle-row">
          <span style="font-size:14px;font-weight:600">Avancerad meny Vikt</span>
          <label class="toggle-switch">
            <input type="checkbox" id="viktAdvancedSectionToggleModal" ${bodyMeasurementsEnabled ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p style="margin-top:-4px;font-size:12px;color:var(--muted)">Slå på för att visa kroppsmått i Vikt-fliken. Du kan hantera vilka mått som finns oavsett.</p>
        <div id="bodyMeasurementTypesList" style="display:flex;flex-direction:column;gap:10px"></div>

        <div class="modal-close" id="manageWeightCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  settingsListExpanded.bodyMeasurementTypesList = true;
  renderBodyMeasurementTypesList();
  document.getElementById("viktAdvancedSectionToggleModal").addEventListener("change", (e) => {
    bodyMeasurementsEnabled = e.target.checked;
    saveBodyMeasurementsEnabled();
    if (activeTab === "vikt") renderVikt();
  });
  document.getElementById("manageWeightCloseBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
  });
  document.getElementById("manageWeightOverlay").addEventListener("click", (e) => {
    if (e.target.id === "manageWeightOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
}

function openManageCaloriePresetsModal() {
  pushModalHistoryIfNeeded();
  applyAccentVar();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="caloriePresetsModalOverlay">
      <div class="modal-sheet">
        <h2>Hantera kalorier</h2>
        <p>Lägg till eller ta bort knapparna för Ätit och Kalorier förbrukade, och hantera hur makros (protein/fett/kolhydrater) färgkodas.</p>
        <div style="font-size:12px;font-weight:700;color:var(--muted)">Ätit</div>
        <div id="presetsEatenList" style="display:flex;flex-direction:column;gap:6px"></div>
        <div style="display:flex;gap:8px">
          <input type="text" id="newEatenLabel" placeholder="Namn" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
          <input type="number" inputmode="numeric" id="newEatenKcal" placeholder="kcal" style="width:70px;flex-shrink:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 8px;color:var(--text);font-size:13px;font-family:inherit;text-align:center" />
          <button class="modal-btn primary" id="addEatenPresetBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
        </div>
        <div style="display:flex;gap:8px">
          <input type="number" inputmode="decimal" id="newEatenProtein" placeholder="Protein g" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px;color:var(--text);font-size:12px;font-family:inherit;text-align:center" />
          <input type="number" inputmode="decimal" id="newEatenFat" placeholder="Fett g" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px;color:var(--text);font-size:12px;font-family:inherit;text-align:center" />
          <input type="number" inputmode="decimal" id="newEatenCarbs" placeholder="Kolh. g" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px;color:var(--text);font-size:12px;font-family:inherit;text-align:center" />
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:4px">Kalorier förbrukade</div>
        <div id="presetsBurnedList" style="display:flex;flex-direction:column;gap:6px"></div>
        <div style="display:flex;gap:8px">
          <input type="text" id="newBurnedLabel" placeholder="Namn" style="flex:1;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--text);font-size:13px;font-family:inherit;min-width:0" />
          <input type="number" inputmode="numeric" id="newBurnedKcal" placeholder="kcal" style="width:70px;flex-shrink:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:9px 8px;color:var(--text);font-size:13px;font-family:inherit;text-align:center" />
          <button class="modal-btn primary" id="addBurnedPresetBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
        </div>

        <div style="font-size:13px;color:var(--muted);margin-bottom:0;margin-top:10px;font-weight:600">Hantera makros</div>
        <div id="macroSettingsList" style="display:flex;flex-direction:column;gap:10px"></div>

        <div class="modal-close" id="caloriePresetsModalCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  renderPresetLists();
  renderMacroSettingsList();
  document.getElementById("addEatenPresetBtn").addEventListener("click", () => addPreset("eaten", "newEatenLabel", "newEatenKcal"));
  document.getElementById("addBurnedPresetBtn").addEventListener("click", () => addPreset("burned", "newBurnedLabel", "newBurnedKcal"));
  wireEnterSubmit(["newEatenLabel", "newEatenKcal", "newEatenProtein", "newEatenFat", "newEatenCarbs"], document.getElementById("addEatenPresetBtn"));
  wireEnterSubmit(["newBurnedLabel", "newBurnedKcal"], document.getElementById("addBurnedPresetBtn"));
  function closeCaloriePresetsModal() {
    modalRoot.innerHTML = "";
    if (activeTab === "kalorier") renderKalorier();
  }
  document.getElementById("caloriePresetsModalCloseBtn").addEventListener("click", closeCaloriePresetsModal);
  document.getElementById("caloriePresetsModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "caloriePresetsModalOverlay") { closeCaloriePresetsModal(); handleModalClosedByUser(); }
  });
}

function renderMacroSettingsList() {
  const container = document.getElementById("macroSettingsList");
  if (!container) return;
  const labels = { protein: "Protein", fat: "Fett", carbs: "Kolhydrater" };
  const levelLabels = [
    { key: "green", label: "🟢 Grönt vid minst" },
    { key: "blue", label: "🔵 Blått vid minst" },
    { key: "orange", label: "🟠 Orange vid minst" },
  ];
  container.innerHTML = Object.keys(labels).map((key) => {
    const s = macroSettings[key];
    return `
      <div style="display:flex;flex-direction:column;gap:10px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600">${labels[key]}</span>
          <label class="toggle-switch">
            <input type="checkbox" data-macro-enabled="${key}" ${s.enabled ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        ${s.enabled ? levelLabels.map((lvl) => {
          const level = s[lvl.key];
          return `
            <div style="display:flex;flex-direction:column;gap:6px;padding-top:6px;border-top:1px solid var(--border)">
              <span style="font-size:12px;color:var(--muted)">${lvl.label}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="theme-row" style="flex:1">
                  <button class="theme-btn" data-macro-level-mode="${key}:${lvl.key}:static" style="${level.mode === "static" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">Statiskt (g)</button>
                  <button class="theme-btn" data-macro-level-mode="${key}:${lvl.key}:perkg" style="${level.mode === "perkg" ? `border-color:${tabColors.kalorier};color:${tabColors.kalorier}` : ""}">g/kg</button>
                </div>
                <input type="number" inputmode="decimal" step="0.1" data-macro-level-value="${key}:${lvl.key}" value="${level.value}" style="width:56px;text-align:center;flex-shrink:0" />
              </div>
            </div>
          `;
        }).join("") : ""}
      </div>
    `;
  }).join("");
  container.querySelectorAll("[data-macro-enabled]").forEach((input) => {
    input.addEventListener("change", (e) => {
      macroSettings[input.dataset.macroEnabled].enabled = e.target.checked;
      saveMacroSettings();
      renderMacroSettingsList();
      if (activeTab === "kalorier") renderKalorier();
    });
  });
  container.querySelectorAll("[data-macro-level-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [key, level, mode] = btn.dataset.macroLevelMode.split(":");
      macroSettings[key][level].mode = mode;
      saveMacroSettings();
      renderMacroSettingsList();
      if (activeTab === "kalorier") renderKalorier();
    });
  });
  container.querySelectorAll("[data-macro-level-value]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [key, level] = input.dataset.macroLevelValue.split(":");
      const num = parseFloat(e.target.value.replace(",", "."));
      if (!isNaN(num) && num > 0) macroSettings[key][level].value = num;
      saveMacroSettings();
      if (activeTab === "kalorier") renderKalorier();
    });
  });
}

function renderPresetLists() {
  const render = (kind, containerId, label) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const listKey = containerId;
    const expanded = !!settingsListExpanded[listKey];
    let html = collapsibleListHeaderHTML(listKey, label, quickPresets[kind].length);
    if (expanded) {
      html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">` + (quickPresets[kind].map((p, i) => `
        <div style="display:flex;flex-direction:column;gap:6px;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:7px 10px">
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" data-preset-color="${kind}:${i}" value="${p.color || "#8A8E99"}" style="width:26px;height:26px;border:1px solid var(--border2);border-radius:6px;background:none;padding:1px;cursor:pointer;flex-shrink:0" />
            <input type="text" data-preset-label="${kind}:${i}" value="${escapeHtml(p.label)}" style="flex:1;min-width:0;background:transparent;border:none;color:var(--text);font-size:13px;font-weight:600;font-family:inherit;padding:2px" />
            <input type="number" inputmode="numeric" data-preset-kcal="${kind}:${i}" value="${p.kcal}" style="width:56px;flex-shrink:0;background:transparent;border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:12px;font-family:inherit;text-align:center;padding:4px 2px" />
            <button class="delete-btn" data-preset-remove="${kind}:${i}">${ICONS.trash}</button>
          </div>
          ${kind === "eaten" ? `
            <div style="display:flex;gap:6px">
              <input type="number" inputmode="decimal" data-preset-protein="${kind}:${i}" value="${p.protein ?? ""}" placeholder="Protein g" style="flex:1;min-width:0;background:transparent;border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:11.5px;font-family:inherit;text-align:center;padding:4px 2px" />
              <input type="number" inputmode="decimal" data-preset-fat="${kind}:${i}" value="${p.fat ?? ""}" placeholder="Fett g" style="flex:1;min-width:0;background:transparent;border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:11.5px;font-family:inherit;text-align:center;padding:4px 2px" />
              <input type="number" inputmode="decimal" data-preset-carbs="${kind}:${i}" value="${p.carbs ?? ""}" placeholder="Kolh. g" style="flex:1;min-width:0;background:transparent;border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:11.5px;font-family:inherit;text-align:center;padding:4px 2px" />
            </div>
          ` : ""}
        </div>
      `).join("") || `<div class="empty" style="padding:4px 0">Inga knappar</div>`) + `</div>`;
    }
    el.innerHTML = html;
    wireCollapsibleListToggles(el);
    if (!expanded) return;
    el.querySelectorAll("[data-preset-color]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const [k, idx] = input.dataset.presetColor.split(":");
        quickPresets[k][parseInt(idx, 10)].color = e.target.value;
        saveQuickPresets();
        if (activeTab === "kalorier") renderKalorier();
      });
    });
    el.querySelectorAll("[data-preset-label]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const [k, idx] = input.dataset.presetLabel.split(":");
        quickPresets[k][parseInt(idx, 10)].label = e.target.value;
        saveQuickPresets();
      });
      input.addEventListener("blur", () => {
        if (activeTab === "kalorier") renderKalorier();
      });
    });
    el.querySelectorAll("[data-preset-kcal]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const [k, idx] = input.dataset.presetKcal.split(":");
        const num = parseInt(e.target.value, 10);
        if (!isNaN(num) && num > 0) quickPresets[k][parseInt(idx, 10)].kcal = num;
        saveQuickPresets();
      });
      input.addEventListener("blur", () => {
        if (activeTab === "kalorier") renderKalorier();
      });
    });
    el.querySelectorAll("[data-preset-protein]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const [k, idx] = input.dataset.presetProtein.split(":");
        const num = parseFloat(e.target.value.replace(",", "."));
        quickPresets[k][parseInt(idx, 10)].protein = isNaN(num) ? undefined : num;
        saveQuickPresets();
      });
    });
    el.querySelectorAll("[data-preset-fat]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const [k, idx] = input.dataset.presetFat.split(":");
        const num = parseFloat(e.target.value.replace(",", "."));
        quickPresets[k][parseInt(idx, 10)].fat = isNaN(num) ? undefined : num;
        saveQuickPresets();
      });
    });
    el.querySelectorAll("[data-preset-carbs]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const [k, idx] = input.dataset.presetCarbs.split(":");
        const num = parseFloat(e.target.value.replace(",", "."));
        quickPresets[k][parseInt(idx, 10)].carbs = isNaN(num) ? undefined : num;
        saveQuickPresets();
      });
    });
    el.querySelectorAll("[data-preset-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [k, idx] = btn.dataset.presetRemove.split(":");
        quickPresets[k].splice(parseInt(idx, 10), 1);
        saveQuickPresets();
        renderPresetLists();
        if (activeTab === "kalorier") renderKalorier();
      });
    });
  };
  render("eaten", "presetsEatenList", "Hantera — Ätit");
  render("burned", "presetsBurnedList", "Hantera — Förbrukade");
}
SETTINGS_LIST_RENDERERS.presetsEatenList = renderPresetLists;
SETTINGS_LIST_RENDERERS.presetsBurnedList = renderPresetLists;

function addPreset(kind, labelInputId, kcalInputId) {
  const labelInput = document.getElementById(labelInputId);
  const kcalInput = document.getElementById(kcalInputId);
  const label = labelInput.value.trim();
  const kcal = parseInt(kcalInput.value, 10);
  if (!label) { labelInput.focus(); return; }
  if (isNaN(kcal) || kcal <= 0) { kcalInput.focus(); return; }
  const preset = { id: uid(), label, kcal };
  if (kind === "eaten") {
    const proteinInput = document.getElementById("newEatenProtein");
    const fatInput = document.getElementById("newEatenFat");
    const carbsInput = document.getElementById("newEatenCarbs");
    const protein = proteinInput ? parseFloat(proteinInput.value.replace(",", ".")) : NaN;
    const fat = fatInput ? parseFloat(fatInput.value.replace(",", ".")) : NaN;
    const carbs = carbsInput ? parseFloat(carbsInput.value.replace(",", ".")) : NaN;
    if (!isNaN(protein)) preset.protein = protein;
    if (!isNaN(fat)) preset.fat = fat;
    if (!isNaN(carbs)) preset.carbs = carbs;
    if (proteinInput) proteinInput.value = "";
    if (fatInput) fatInput.value = "";
    if (carbsInput) carbsInput.value = "";
  }
  quickPresets[kind].push(preset);
  saveQuickPresets();
  markWeeklyMiscFlag("newPresetAddedWeek");
  labelInput.value = "";
  kcalInput.value = "";
  renderPresetLists();
  if (activeTab === "kalorier") renderKalorier();
}

async function shareBackup(kind) {
  const payload = kind === "settings" ? buildSettingsPayload() : buildDataPayload();
  const now = new Date();
  const filename = `traningslogg-${kind === "settings" ? "installningar" : "data"}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
  const file = new File([JSON.stringify(payload, null, 2)], filename, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Workout Tracker ${kind === "settings" ? "inställningar" : "data"}` });
      if (kind === "data") markBackupDone();
      showModalStatus(kind === "settings" ? "Inställningar delade." : "Data delad.", "ok");
    } catch (e) {
      if (e.name !== "AbortError") showModalStatus("Kunde inte dela. Testa nedladdning istället.", "err");
    }
  } else {
    showModalStatus("Delning stöds inte i den här webbläsaren — använder nedladdning istället.", "err");
    if (kind === "settings") exportSettingsBackup(); else exportDataBackup();
  }
}

function openAboutModal() {
  pushModalHistoryIfNeeded();
  applyAccentVar();
  const currentMondayForAbout = mondayOf(todayISO());
  if (weeklyMisc.aboutOpenedWeek !== currentMondayForAbout) {
    weeklyMisc.aboutOpenedWeek = currentMondayForAbout;
    saveWeeklyMisc();
    checkWeeklyChallenges();
  }
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="aboutModalOverlay">
      <div class="modal-sheet">
        <button id="aboutModalBackBtn" aria-label="Tillbaka" style="background:none;border:none;padding:4px;margin:-4px;cursor:pointer;color:var(--text);display:flex;align-items:center;flex-shrink:0"><span class="icon-20">${ICONS.chevronLeft}</span></button>
        <div style="text-align:center;padding:8px 0">
          <img src="${APP_ICON_IMG}" alt="Workout Tracker" style="width:64px;height:64px;border-radius:16px" />
          <div style="font-size:19px;font-weight:700;margin-top:8px">Workout Tracker</div>
          <div style="font-size:12.5px;color:var(--muted2);margin-top:2px">Version 1.0</div>
        </div>
        <p style="text-align:center">En personlig träningsapp som hjälper dig att  följa din vikt, träning och utveckling!</p>

        <div class="card" style="background:var(--bg)">
          <div class="card-label">Funktioner</div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13.5px">
            <div>🏋️ Registrera träningspass - styrkelyft, kondition, kampsport m.m.</div>
            <div>⚖️ Följ din viktutveckling och kroppsmått</div>
            <div>🔥 Beräkna kaloribehov och logga kalorier</div>
            <div>🥇 Sätt personbästa och jämför dig mot andra på topplistan</div>
            <div>🏆 Lås upp prestationer, levla upp och samla XP</div>
            <div>🥋 Bälte-system för kampsport</div>
            <div>📊 Se statistik, veckoutmaningar och årskrönika</div>
            <div>👥 Lägg till vänner, se deras framsteg och gruppera dem</div>
            <div>☁️ Molnsynk mellan dina enheter</div>
          </div>
        </div>

        <div class="card" style="background:var(--bg)">
          <div class="card-label">Utvecklare</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">Mattias Öman</div>
          <a href="mailto:Mattiasoman88@gmail.com" style="font-size:13px;color:${tabColors.stats};text-decoration:none">Mattiasoman88@gmail.com</a>
        </div>

        <div class="disclaimer">Copyright 2026 Mattias Öman</div>
        <div class="modal-close" id="aboutModalCloseBtn">← Tillbaka</div>
      </div>
    </div>
  `;
  const closeAboutModal = () => {
    openBackupModal();
    const sheet = modalRoot.querySelector(".modal-sheet");
    if (sheet) sheet.scrollTop = aboutModalReturnScrollTop;
  };
  document.getElementById("aboutModalCloseBtn").addEventListener("click", closeAboutModal);
  document.getElementById("aboutModalBackBtn").addEventListener("click", closeAboutModal);
  document.getElementById("aboutModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "aboutModalOverlay") {
      openBackupModal();
      const sheet = modalRoot.querySelector(".modal-sheet");
      if (sheet) sheet.scrollTop = aboutModalReturnScrollTop;
      reestablishModalMarkerIfStillOpen();
    }
  });
}

// Uppdaterar bara profilbilds-elementet (och dess ram), utan att bygga om
// resten av profil-modalen. Bevarar att andra element (som alla svar-
// väljarens animationer) inte startar om i onödan.
function renderProfileAvatarWrap() {
  const wrap = document.getElementById("profileAvatarWrap");
  if (!wrap) return;
  wrap.innerHTML = profileAvatarHTML(88, 3)
    || `<div style="width:88px;height:88px;border-radius:50%;background:var(--input-bg);border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--muted)"><span class="icon-32" style="display:flex">${ICONS.userCircle}</span></div>`;
}
// Uppdaterar bara vilken ram-swatch som är markerad (kantfärgen på knappen),
// utan att röra sken-elementen inuti - annars skulle ALLA animationer i
// listan starta om bara för att man valde en enda.
function updateProfileFrameSwatchSelection() {
  const currentFrame = resolveProfileFrame();
  modalRoot.querySelectorAll("[data-profile-frame]").forEach((btn) => {
    const isSelected = btn.dataset.profileFrame === currentFrame;
    btn.style.borderColor = isSelected ? tabColors.stats : "transparent";
  });
}

function openProfileModal() {
  pushModalHistoryIfNeeded();
  applyAccentVar();
  markWeeklyMiscFlag("profileOpenedWeek");
  if (weightEntries.length) {
    calorieState.weight = weightEntries[weightEntries.length - 1].value;
  }
  const ramSectionHTML = `
    <div style="margin-bottom:14px">
      ${cardChevronHeaderHTML("profileFramePickerToggle", "Ram runt profilbilden", profileFramePickerExpanded)}
      ${profileFramePickerExpanded ? `
      <p style="margin-top:6px;font-size:12px;color:var(--muted);text-align:center">Nya sken låses upp när du levlar upp.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        ${(() => {
          const currentLevel = computeLevelInfo(totalXp()).level;
          const currentFrame = resolveProfileFrame();
          return Object.keys(PROFILE_FRAMES).map((key) => {
            const unlockLevel = PROFILE_FRAME_UNLOCK_LEVEL[key] || 1;
            const isUnlocked = currentLevel >= unlockLevel || debugForceUnlockCosmetics;
            const isSelected = currentFrame === key;
            const swatch = profileFrameWrapStyle(key, 2);
            return `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:40px">
                <button ${isUnlocked ? `data-profile-frame="${key}"` : ""} aria-label="${PROFILE_FRAMES[key].label}" title="${PROFILE_FRAMES[key].label}" style="width:36px;height:36px;border-radius:50%;padding:2px;border:1.5px solid ${isSelected ? tabColors.stats : "transparent"};background:none;cursor:${isUnlocked ? "pointer" : "default"}">
                  <div class="${swatch.className}" style="${swatch.style};width:100%;height:100%;${isUnlocked ? "" : "filter:grayscale(1);opacity:0.35;"}">
                    <div style="width:100%;height:100%;border-radius:50%;background:var(--input-bg)"></div>
                  </div>
                </button>
                ${!isUnlocked ? `<span style="font-size:9px;color:var(--muted2);text-align:center;line-height:1.1">Lvl ${unlockLevel}</span>` : ""}
              </div>
            `;
          }).join("");
        })()}
      </div>
      ${(() => {
        const currentLevel = computeLevelInfo(totalXp()).level;
        const cycleUnlocked = currentLevel >= (PROFILE_FRAME_UNLOCK_LEVEL.allaMinaRamar || 999) || debugForceUnlockCosmetics;
        // Bara relevant att visa urvalslistan när "Alla animationer" faktiskt
        // är den valda ramen just nu - annars är den bara i vägen.
        if (!cycleUnlocked || resolveProfileFrame() !== "allaMinaRamar") return "";
        return `
        <div style="margin-top:12px;border-top:1px solid var(--border2);padding-top:10px">
          <p style="font-size:12px;font-weight:600;margin-bottom:6px">Vilka ska "Alla animationer" cykla mellan?</p>
          <p style="font-size:11px;color:var(--muted);margin-bottom:8px">Fritt urval - allt från en enda till alla.</p>
          <div style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto">
            ${Object.keys(PROFILE_FRAMES).filter((k) => k !== "allaMinaRamar").map((key) => {
              const unlockLevel = PROFILE_FRAME_UNLOCK_LEVEL[key] || 1;
              const isUnlocked = currentLevel >= unlockLevel || debugForceUnlockCosmetics;
              if (!isUnlocked) return "";
              const selected = getCycleAllFrameKeys().includes(key);
              return `
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;${isUnlocked ? "" : "opacity:0.4"}">
                  <input type="checkbox" data-cycle-frame-key="${key}" ${selected ? "checked" : ""} />
                  ${PROFILE_FRAMES[key].label}
                </label>
              `;
            }).join("")}
          </div>
        </div>
        `;
      })()}
      <div class="toggle-row" style="margin-top:10px">
        <span style="font-size:13px;font-weight:600">Visa rörligt sken på Level-Badgen</span>
        <label class="toggle-switch">
          <input type="checkbox" id="beltBadgeFrameToggle" ${beltBadgeFrameEnabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
      </div>
      ` : ""}
    </div>
  `;
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="profileModalOverlay">
      <div class="modal-sheet">
        <div style="display:flex;align-items:center;gap:10px">
          <button id="profileModalBackBtn" aria-label="Tillbaka" style="background:none;border:none;padding:4px;margin:-4px;cursor:pointer;color:var(--text);display:flex;align-items:center;flex-shrink:0"><span class="icon-20">${ICONS.chevronLeft}</span></button>
          <h2>Profil</h2>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:10px">
          <div style="position:relative">
            ${crownEmblemOverlayHTML(profile.crownEmblem, 116)}
            <div id="profileAvatarWrap">${profileAvatarHTML(88, 3)
              || `<div style="width:88px;height:88px;border-radius:50%;background:var(--input-bg);border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--muted)"><span class="icon-32" style="display:flex">${ICONS.userCircle}</span></div>`}</div>
          </div>
          ${platinumUnlockedAt ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(239,159,39,0.12);border:1px solid rgba(239,159,39,0.4);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;color:#EF9F27">🏆 New Game+ — 100%</div>` : ""}
          ${platinumUnlockedAt ? `
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <span style="font-size:11.5px;color:var(--muted2)">Bevingad krona:</span>
            <button data-crown-emblem="" class="crown-emblem-btn" style="font-size:11.5px;padding:3px 9px;border-radius:999px;border:1px solid ${!profile.crownEmblem ? "var(--text)" : "var(--border2)"};background:none;color:var(--text);cursor:pointer;font-family:inherit">Av</button>
            <button data-crown-emblem="gold" class="crown-emblem-btn" style="font-size:11.5px;padding:3px 9px;border-radius:999px;border:1px solid ${profile.crownEmblem === "gold" ? "#EF9F27" : "var(--border2)"};background:none;color:${profile.crownEmblem === "gold" ? "#EF9F27" : "var(--text)"};cursor:pointer;font-family:inherit">Guld</button>
            <button data-crown-emblem="diamond" class="crown-emblem-btn" style="font-size:11.5px;padding:3px 9px;border-radius:999px;border:1px solid ${profile.crownEmblem === "diamond" ? "#85B7EB" : "var(--border2)"};background:none;color:${profile.crownEmblem === "diamond" ? "#85B7EB" : "var(--text)"};cursor:pointer;font-family:inherit">Diamant</button>
          </div>
          ` : ""}
          <div style="display:flex;gap:8px">
            <button class="modal-btn secondary" id="profileAvatarUploadBtn" style="padding:6px 14px;font-size:12.5px;width:auto">${profile.avatar ? "Byt bild" : "Ladda upp bild"}</button>
            ${profile.avatar ? `<button class="delete-btn" id="profileAvatarRemoveBtn" style="padding:6px 10px">${ICONS.trash}</button>` : ""}
          </div>
          <input type="file" id="profileAvatarFileInput" accept="image/*" style="display:none" />
        </div>
        ${authUser ? `
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
          <div style="text-align:center;font-size:12px;color:var(--muted)">${escapeHtml(authUser.email || "")}</div>
        </div>
        ${ramSectionHTML}
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
          ${authRecoveryMode ? `<div class="status-msg ok" style="display:block">Du klickade på en återställningslänk. Sätt ditt nya lösenord nedan.</div>` : ""}
          ${cardChevronHeaderHTML("profilePasswordToggle", authRecoveryMode ? "Sätt nytt lösenord" : "Byt lösenord/Logga ut", profilePasswordSectionOpen)}
          ${profilePasswordSectionOpen ? `
            <input type="password" id="newPasswordInput" placeholder="Nytt lösenord (minst 6 tecken)" autocomplete="new-password" style="width:100%;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit" />
            <button class="modal-btn primary" id="changePasswordBtn">${authRecoveryMode ? "Spara nytt lösenord" : "Byt lösenord"}</button>
            <div id="accountStatus" class="status-msg ${authFormError ? "err" : "ok"}" style="display:${authFormError ? "block" : "none"}">${escapeHtml(authFormError)}</div>
            ${authRecoveryMode ? "" : `<button class="modal-btn secondary" id="logoutBtn" style="width:auto;padding:6px 14px;font-size:12.5px;align-self:center;margin-top:4px">Logga ut</button>`}
          ` : ""}
        </div>
        <div style="margin-bottom:14px">
          <button class="modal-btn secondary" id="openFriendsBtn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px">👥 Vänner</button>
        </div>
        ` : ramSectionHTML}
        ${kampsportAdvancedSectionOpen ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${beltSectionOpen ? "10px" : "0"}">
          <div class="field-label" style="margin-bottom:0">Dina bälten</div>
          <button id="beltSectionToggleBtn" style="background:none;border:none;color:${tabColors.stats};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px">${beltSectionOpen ? "Dölj" : "Visa"}</button>
        </div>
        ${beltSectionOpen ? (() => {
          const highest = highestActiveBeltName();
          const editingTier = BELT_TIERS.find((t) => t.name === editingBeltName);
          return `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              ${BELT_TIERS.slice(0, 5).map((tier) => {
                const dateVal = profile.beltDates && profile.beltDates[tier.name];
                const isHighest = tier.name === highest;
                return `
                  <button data-profile-belt="${tier.name}" style="display:flex;flex-direction:column;align-items:center;background:var(--input-bg);border:2px solid ${isHighest ? tabColors.stats : "var(--border2)"};border-radius:10px;padding:6px;cursor:pointer;width:66px;transition:opacity .2s;${dateVal ? "opacity:1" : "opacity:0.3"}">
                    <img src="${PROFILE_BELT_IMAGES[tier.name]}" alt="${tier.name}" style="width:56px;height:auto;object-fit:contain;display:block" />
                  </button>
                `;
              }).join("")}
            </div>
            ${editingTier ? `
              <div class="field" style="display:flex;align-items:center;gap:8px">
                <div style="flex:1">
                  <div class="field-label">${editingTier.name}</div>
                  <input type="date" id="profileBeltDateInput" value="${(profile.beltDates && profile.beltDates[editingTier.name]) || ""}" />
                </div>
                ${profile.beltDates && profile.beltDates[editingTier.name] ? `<button class="delete-btn" id="profileBeltDateRemoveBtn" style="margin-top:18px">${ICONS.trash}</button>` : ""}
              </div>
            ` : ""}
          `;
        })() : ""}
        ` : ""}
        <div class="field">
          <div class="field-label">Namn</div>
          <input type="text" id="profileName" placeholder="Ditt namn" value="${escapeHtml(profile.name || "")}" />
        </div>
        <div class="gender-row">
          <button class="gender-btn" data-profile-gender="man" style="${profile.gender === "man" ? `border-color:${tabColors.stats};background:${tabColors.stats}26;color:${tabColors.stats}` : ""}">Man</button>
          <button class="gender-btn" data-profile-gender="kvinna" style="${profile.gender === "kvinna" ? `border-color:${tabColors.stats};background:${tabColors.stats}26;color:${tabColors.stats}` : ""}">Kvinna</button>
        </div>
        <div class="row">
          <div class="field"><div class="field-label">Ålder</div><input type="number" inputmode="numeric" placeholder="år" id="profileAge" value="${escapeHtml(profile.age || "")}" /></div>
          <div class="field"><div class="field-label">Längd</div><input type="number" inputmode="numeric" placeholder="cm" id="profileHeight" value="${escapeHtml(profile.height || "")}" /></div>
          <div class="field"><div class="field-label">Vikt${weightEntries.length ? ' <span style="color:var(--muted3)">(auto)</span>' : ""}</div><input type="number" inputmode="decimal" step="0.1" placeholder="kg" id="profileWeight" value="${calorieState.weight}" ${weightEntries.length ? "readonly" : ""} /></div>
        </div>
        <div class="field-label">Aktivitetsnivå</div>
        ${ACTIVITY_LEVELS.map((l) => `
          <button class="activity-btn" data-profile-activity="${l.key}" style="${calorieState.activity === l.key ? `border-color:${tabColors.stats};background:${tabColors.stats}1A` : ""}">
            <span class="lbl" style="${calorieState.activity === l.key ? `color:${tabColors.stats}` : ""}">${l.label}</span>
            <span class="desc">${l.desc}</span>
          </button>
        `).join("")}
        <p>Används för att räkna ut ditt kaloribehov i Kalorier-fliken.</p>

        <div class="field-label">Kalorimål (används för "Kalorier kvar")</div>
        ${(() => {
          const { result } = computeCalorieGoal();
          if (!result) return `<p style="margin-top:0">Fyll i ålder, längd och vikt ovan för att se kalorimål.</p>`;
          return `
            <button class="activity-btn" data-goal="lose" style="${calorieGoal === "lose" ? "border-color:#5B7FBF;background:#5B7FBF1A" : ""}">
              <span class="lbl" style="${calorieGoal === "lose" ? "color:#5B7FBF" : ""}">Viktnedgång (~0.5 kg/vecka)</span>
              <span class="desc">${result.tdee - 500} kcal</span>
            </button>
            <button class="activity-btn" data-goal="maintain" style="${calorieGoal === "maintain" ? "border-color:#4CAF7D;background:#4CAF7D1A" : ""}">
              <span class="lbl" style="${calorieGoal === "maintain" ? "color:#4CAF7D" : ""}">Underhåll</span>
              <span class="desc">${result.tdee} kcal</span>
            </button>
            <button class="activity-btn" data-goal="gain" style="${calorieGoal === "gain" ? "border-color:#E15554;background:#E155541A" : ""}">
              <span class="lbl" style="${calorieGoal === "gain" ? "color:#E15554" : ""}">Viktuppgång (~0.5 kg/vecka)</span>
              <span class="desc">${result.tdee + 500} kcal</span>
            </button>
          `;
        })()}

        <div class="modal-close" id="profileModalCloseBtn">${profileModalReturnsToSettings ? "← Tillbaka" : "Stäng"}</div>
      </div>
    </div>
  `;
  // Sparar/återställer scroll-läget runt en omritning av profil-modalen.
  // Utan den här hoppar sidan högst upp och man ser en full omritning
  // ("flimmer") varje gång man t.ex. fäller ut bälten eller väljer ett
  // bälte - samma buggmönster som tidigare fanns på träningsflik-ikonen.
  const reopenProfileModal = () => {
    const sheet = modalRoot.querySelector(".modal-sheet");
    const scrollTop = sheet ? sheet.scrollTop : 0;
    openProfileModal();
    const newSheet = modalRoot.querySelector(".modal-sheet");
    if (newSheet) newSheet.scrollTop = scrollTop;
  };
  const beltToggleBtn = document.getElementById("beltSectionToggleBtn");
  if (beltToggleBtn) {
    beltToggleBtn.addEventListener("click", () => {
      beltSectionOpen = !beltSectionOpen;
      saveBeltSectionOpen();
      editingBeltName = null;
      reopenProfileModal();
    });
  }
  const frameToggleBtn = document.getElementById("profileFramePickerToggle");
  if (frameToggleBtn) {
    frameToggleBtn.addEventListener("click", () => {
      profileFramePickerExpanded = !profileFramePickerExpanded;
      saveProfileFramePickerExpanded();
      reopenProfileModal();
    });
  }
  const passwordToggleBtn = document.getElementById("profilePasswordToggle");
  if (passwordToggleBtn) {
    passwordToggleBtn.addEventListener("click", () => {
      profilePasswordSectionOpen = !profilePasswordSectionOpen;
      reopenProfileModal();
    });
  }
  const openFriendsBtn = document.getElementById("openFriendsBtn");
  if (openFriendsBtn) {
    openFriendsBtn.addEventListener("click", () => openFriendsModal());
  }
  const beltBadgeFrameToggle = document.getElementById("beltBadgeFrameToggle");
  if (beltBadgeFrameToggle) {
    beltBadgeFrameToggle.addEventListener("change", (e) => {
      beltBadgeFrameEnabled = e.target.checked;
      saveBeltBadgeFrameEnabled();
      if (activeTab === "stats") renderStats();
    });
  }
  modalRoot.querySelectorAll("[data-crown-emblem]").forEach((btn) => {
    btn.addEventListener("click", () => {
      profile.crownEmblem = btn.dataset.crownEmblem || null;
      saveProfile();
      reopenProfileModal();
    });
  });
  modalRoot.querySelectorAll("[data-cycle-frame-key]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const checkedKeys = Array.from(modalRoot.querySelectorAll("[data-cycle-frame-key]:checked")).map((el) => el.dataset.cycleFrameKey);
      profile.cycleFrameKeys = checkedKeys;
      saveProfile();
      refreshCycleAllFrames();
    });
  });
  modalRoot.querySelectorAll("[data-profile-belt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.profileBelt;
      editingBeltName = editingBeltName === name ? null : name;
      reopenProfileModal();
    });
  });
  const beltDateInput = document.getElementById("profileBeltDateInput");
  if (beltDateInput) {
    beltDateInput.addEventListener("change", (e) => {
      if (!profile.beltDates) profile.beltDates = {};
      if (e.target.value) { profile.beltDates[editingBeltName] = e.target.value; markWeeklyMiscFlag("beltDateUpdatedWeek"); }
      else delete profile.beltDates[editingBeltName];
      saveProfile();
      reopenProfileModal();
    });
  }
  const beltDateRemoveBtn = document.getElementById("profileBeltDateRemoveBtn");
  if (beltDateRemoveBtn) {
    beltDateRemoveBtn.addEventListener("click", () => {
      if (profile.beltDates) delete profile.beltDates[editingBeltName];
      saveProfile();
      editingBeltName = null;
      reopenProfileModal();
    });
  }
  document.getElementById("profileName").addEventListener("input", (e) => {
    profile.name = e.target.value;
    saveProfile();
    renderLevelHeroCard();
  });
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await authSignOut();
      reopenProfileModal();
    });
  }
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      const newPassword = document.getElementById("newPasswordInput").value || "";
      if (newPassword.length < 6) {
        authFormError = "Lösenordet måste vara minst 6 tecken.";
        reopenProfileModal();
        return;
      }
      try {
        await authChangePassword(newPassword);
        authFormError = authRecoveryMode ? "Klart! Ditt nya lösenord är sparat." : "Lösenord ändrat.";
        authRecoveryMode = false;
      } catch (err) {
        authFormError = (err && err.message) || "Kunde inte byta lösenord.";
      }
      reopenProfileModal();
    });
  }
  const avatarUploadBtn = document.getElementById("profileAvatarUploadBtn");
  const avatarFileInput = document.getElementById("profileAvatarFileInput");
  if (avatarUploadBtn && avatarFileInput) {
    avatarUploadBtn.addEventListener("click", () => avatarFileInput.click());
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      resizeImageFileToDataUrl(file, 320, 0.85)
        .then((dataUrl) => {
          profile.avatar = dataUrl;
          saveProfile();
          reopenProfileModal();
          renderLevelHeroCard();
        })
        .catch(() => { alert("Kunde inte läsa bilden. Prova en annan fil."); });
    });
  }
  const avatarRemoveBtn = document.getElementById("profileAvatarRemoveBtn");
  if (avatarRemoveBtn) {
    avatarRemoveBtn.addEventListener("click", () => {
      profile.avatar = null;
      saveProfile();
      reopenProfileModal();
      renderLevelHeroCard();
    });
  }
  modalRoot.querySelectorAll("[data-profile-frame]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.profileFrame;
      const cycleAllInvolved = key === "allaMinaRamar" || profile.frame === "allaMinaRamar";
      profile.frame = profile.frame === key ? null : key;
      saveProfile();
      // Flikikonerna (nedre navigeringen) ritas inte om av resten av denna
      // modal, så utan detta anrop syns den nya ramen där först efter att
      // man bytt flik manuellt.
      renderNav();
      if (cycleAllInvolved) {
        // "Alla animationer" har en egen urvalslista som bara ska synas när
        // den faktiskt är vald - kräver en full omritning för att dyka
        // upp/försvinna, inte bara punktuppdateringarna nedan. Men vi vill
        // ändå uppdatera level-kortet bakom modalen direkt (annars syns
        // bytet inte förrän man bytt flik och tillbaka).
        renderLevelHeroCard();
        reopenProfileModal();
        return;
      }
      renderProfileAvatarWrap();
      updateProfileFrameSwatchSelection();
      renderLevelHeroCard();
    });
  });
  document.getElementById("profileAge").addEventListener("input", (e) => { profile.age = e.target.value; saveProfile(); });
  document.getElementById("profileHeight").addEventListener("input", (e) => { profile.height = e.target.value; saveProfile(); });
  const profileWeightInput = document.getElementById("profileWeight");
  if (profileWeightInput) {
    profileWeightInput.addEventListener("input", (e) => { calorieState.weight = e.target.value; });
  }
  modalRoot.querySelectorAll("[data-profile-gender]").forEach((btn) => {
    btn.addEventListener("click", () => {
      profile.gender = btn.dataset.profileGender;
      saveProfile();
      reopenProfileModal();
    });
  });
  modalRoot.querySelectorAll("[data-profile-activity]").forEach((btn) => {
    btn.addEventListener("click", () => {
      calorieState.activity = btn.dataset.profileActivity;
      saveActivityLevel();
      reopenProfileModal();
    });
  });
  modalRoot.querySelectorAll("[data-goal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      calorieGoal = btn.dataset.goal;
      saveCalorieGoal();
      markWeeklyMiscFlag("calorieGoalSetWeek");
      reopenProfileModal();
    });
  });
  function closeProfileModal() {
    editingBeltName = null;
    if (profileModalReturnsToSettings) {
      openBackupModal();
      const sheet = modalRoot.querySelector(".modal-sheet");
      if (sheet) sheet.scrollTop = profileModalReturnScrollTop;
    } else {
      modalRoot.innerHTML = "";
      if (activeTab === "kalorier") renderKalorier();
    }
  }
  document.getElementById("profileModalCloseBtn").addEventListener("click", closeProfileModal);
  document.getElementById("profileModalBackBtn").addEventListener("click", closeProfileModal);
  modalRoot.querySelectorAll("#profileModalOverlay").forEach((ov) => {
    ov.addEventListener("click", (e) => {
      if (e.target.id === "profileModalOverlay") { closeProfileModal(); reestablishModalMarkerIfStillOpen(); }
    });
  });
}

function closeBackupModal() {
  modalRoot.innerHTML = "";
}

/* ---------------- Manage training types (add / delete / reorder) ---------------- */

let typesModalReturnsToSettings = false;

function openManageTypesModal() {
  pushModalHistoryIfNeeded();
  applyAccentVar();
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="typesModalOverlay">
      <div class="modal-sheet">
        <div style="display:flex;align-items:center;gap:10px">
          <button id="typesModalBackBtn" aria-label="Tillbaka" style="background:none;border:none;padding:4px;margin:-4px;cursor:pointer;color:var(--text);display:flex;align-items:center;flex-shrink:0"><span class="icon-20">${ICONS.chevronLeft}</span></button>
          <h2>Hantera träningspass</h2>
        </div>
        <p>Lägg till, ta bort, ändra ordning, namn, färg, förinställda minuter eller kcal på dina träningspass. "Sjuk" och "Skadad" hanteras separat och visas alltid.</p>
        <div id="typesList" style="display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto"></div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
          <input type="text" id="newTypeLabel" placeholder="Nytt pass" style="width:100%;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit" />
          <select id="newTypeCategory" style="width:100%;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit">
            <option value="">Ingen kategori</option>
            <option value="kampsport">Kampsport</option>
            <option value="gym">Styrka</option>
            <option value="kondition">Kondition</option>
          </select>
          <div style="display:flex;gap:8px">
            <input type="color" id="newTypeColor" value="#4FC3D9" style="width:44px;height:44px;flex-shrink:0;border:1px solid var(--border2);border-radius:10px;background:var(--input-bg);padding:2px;cursor:pointer" />
            <input type="number" inputmode="numeric" id="newTypeMinutes" placeholder="min" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 8px;color:var(--text);font-size:14px;font-family:inherit;text-align:center" />
            <input type="number" inputmode="numeric" id="newTypeKcal" placeholder="kcal" style="flex:1;min-width:0;background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:10px 8px;color:var(--text);font-size:14px;font-family:inherit;text-align:center" />
            <button class="modal-btn primary" id="addTypeBtn" style="width:44px;padding:0;flex-shrink:0">${ICONS.plus}</button>
          </div>
        </div>

          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Avancerad meny (Kampsport)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="kampsportAdvancedSectionToggle" ${kampsportAdvancedSectionOpen ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="margin-top:-4px">Utvärdering och submissions för BJJ/SW-pass.</p>
          <div id="kampsportAdvancedBody" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${kampsportAdvancedSectionOpen ? "" : "display:none"}">

            <div class="toggle-row">
              <span style="font-size:14px;font-weight:600">Utvärdering</span>
              <label class="toggle-switch">
                <input type="checkbox" id="advancedMenuToggle" ${advancedMenuEnabled ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p style="margin-top:-4px">Slå på för att svara på frågor (1-10) efter BJJ/SW-pass.</p>

            <div id="advancedQuestionsList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${advancedMenuEnabled ? "" : "display:none"}"></div>

            <div class="toggle-row" id="submissionsToggleRow">
              <span style="font-size:14px;font-weight:600">Submissions</span>
              <label class="toggle-switch">
                <input type="checkbox" id="submissionsMenuToggle" ${submissionsMenuEnabled ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p style="margin-top:-4px" id="submissionsToggleHint">Slå på för att välja vilka submissions du fick under BJJ/SW-pass.</p>
            <div id="submissionTypesList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${submissionsMenuEnabled ? "" : "display:none"}"></div>

            <div class="toggle-row">
              <span style="font-size:14px;font-weight:600">Submission-bingo</span>
              <label class="toggle-switch">
                <input type="checkbox" id="submissionBingoToggle" ${submissionBingoEnabled ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p style="margin-top:-4px">Slå på för en rolig sidoutmaning: en bricka med 25 slumpade submissions per månad. Kryssa i rader, kryss (X) och hörn för XP.</p>

          </div>
          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Avancerad meny (Gym)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="gymMenuToggle" ${gymMenuEnabled ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="margin-top:-4px">Hantera dina gympass och vilka övningar som räknas som personbästa.</p>
          <div id="gymSplitsList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${gymMenuEnabled ? "" : "display:none"}"></div>
          <div id="gymSplitsDefaultControls" class="settings-indent" style="margin-top:8px;${gymMenuEnabled ? "" : "display:none"}"></div>
          <p class="settings-indent" style="margin-top:6px;${gymMenuEnabled ? "" : "display:none"}" id="gymExercisesHint">Övningar per gympass (för "Starta pass"):</p>
          <div id="gymExercisesManagement" class="settings-indent" style="display:flex;flex-direction:column;gap:14px;${gymMenuEnabled ? "" : "display:none"}"></div>
          <p class="settings-indent" style="margin-top:6px;${gymMenuEnabled ? "" : "display:none"}" id="pbExercisesHint">Övningar för "Personbästa!" (visas när du loggar ett gympass):</p>
          <div id="pbExercisesList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${gymMenuEnabled ? "" : "display:none"}"></div>

          <div class="toggle-row">
            <span style="font-size:14px;font-weight:600">Avancerad meny (Kondition)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="konditionMenuToggle" ${konditionMenuEnabled ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="margin-top:-4px">Gäller cykel, motionscykel, löpning och egna pass i kategorin kondition.</p>
          <div id="konditionPbList" class="settings-indent" style="display:flex;flex-direction:column;gap:10px;${konditionMenuEnabled ? "" : "display:none"}"></div>


        <div class="modal-close" id="typesModalCloseBtn">${typesModalReturnsToSettings ? "← Tillbaka" : "Stäng"}</div>
      </div>
    </div>
  `;
  renderTypesList();
  renderAdvancedQuestionsList();
  renderSubmissionTypesList();
  renderGymSplitsList();
  renderGymSplitsDefaultControls();
  renderGymExercisesManagement();
  renderPbExercisesList();
  renderKonditionPbList();
  document.getElementById("kampsportAdvancedSectionToggle").addEventListener("change", (e) => {
    handleKampsportToggleChange(e.target.checked);
    const body = document.getElementById("kampsportAdvancedBody");
    if (body) body.style.display = kampsportAdvancedSectionOpen ? "flex" : "none";
  });
  document.getElementById("advancedMenuToggle").addEventListener("change", (e) => {
    advancedMenuEnabled = e.target.checked;
    saveAdvancedMenuEnabled();
    document.getElementById("advancedQuestionsList").style.display = advancedMenuEnabled ? "flex" : "none";
    const sheet1 = modalRoot.querySelector(".modal-sheet");
    const scrollTop1 = sheet1 ? sheet1.scrollTop : 0;
    if (activeTab === "traning") renderTraning();
    if (sheet1) sheet1.scrollTop = scrollTop1;
  });
  document.getElementById("submissionsMenuToggle").addEventListener("change", (e) => {
    submissionsMenuEnabled = e.target.checked;
    saveSubmissionsMenuEnabled();
    document.getElementById("submissionTypesList").style.display = submissionsMenuEnabled ? "flex" : "none";
    const sheet2 = modalRoot.querySelector(".modal-sheet");
    const scrollTop2 = sheet2 ? sheet2.scrollTop : 0;
    if (activeTab === "stats") renderStats();
    if (activeTab === "traning") renderTraning();
    if (sheet2) sheet2.scrollTop = scrollTop2;
  });
  document.getElementById("submissionBingoToggle").addEventListener("change", (e) => {
    submissionBingoEnabled = e.target.checked;
    saveSubmissionBingoEnabled();
    if (submissionBingoEnabled && !bingoCard) startNewBingoCard();
    if (activeTab === "stats") renderStats();
  });
  document.getElementById("gymMenuToggle").addEventListener("change", (e) => {
    gymMenuEnabled = e.target.checked;
    saveGymMenuEnabled();
    document.getElementById("gymSplitsList").style.display = gymMenuEnabled ? "flex" : "none";
    document.getElementById("gymSplitsDefaultControls").style.display = gymMenuEnabled ? "" : "none";
    document.getElementById("gymExercisesManagement").style.display = gymMenuEnabled ? "flex" : "none";
    document.getElementById("gymExercisesHint").style.display = gymMenuEnabled ? "" : "none";
    document.getElementById("pbExercisesList").style.display = gymMenuEnabled ? "flex" : "none";
    document.getElementById("pbExercisesHint").style.display = gymMenuEnabled ? "" : "none";
    const sheet3 = modalRoot.querySelector(".modal-sheet");
    const scrollTop3 = sheet3 ? sheet3.scrollTop : 0;
    if (activeTab === "traning") renderTraning();
    if (sheet3) sheet3.scrollTop = scrollTop3;
  });
  document.getElementById("konditionMenuToggle").addEventListener("change", (e) => {
    konditionMenuEnabled = e.target.checked;
    saveKonditionMenuEnabled();
    document.getElementById("konditionPbList").style.display = konditionMenuEnabled ? "flex" : "none";
    const sheet4 = modalRoot.querySelector(".modal-sheet");
    const scrollTop4 = sheet4 ? sheet4.scrollTop : 0;
    if (activeTab === "traning") renderTraning();
    if (sheet4) sheet4.scrollTop = scrollTop4;
  });
  document.getElementById("addTypeBtn").addEventListener("click", () => {
    const input = document.getElementById("newTypeLabel");
    const colorInput = document.getElementById("newTypeColor");
    const minutesInput = document.getElementById("newTypeMinutes");
    const kcalInput = document.getElementById("newTypeKcal");
    const categoryInput = document.getElementById("newTypeCategory");
    const label = input.value.trim();
    if (!label) { input.focus(); return; }
    const minutesVal = parseInt(minutesInput.value, 10);
    const kcalVal = parseInt(kcalInput.value, 10);
    trainingTypes.push({
      key: uid(), label, color: colorInput.value,
      defaultMinutes: isNaN(minutesVal) ? "" : minutesVal,
      defaultKcalBurned: isNaN(kcalVal) ? "" : kcalVal,
      category: categoryInput.value || null,
    });
    saveTrainingTypes();
    weeklyMisc.customTypeCreatedWeek = mondayOf(todayISO());
    weeklyMisc.customTypeCreatedKey = trainingTypes[trainingTypes.length - 1].key;
    saveWeeklyMisc();
    checkWeeklyChallenges();
    rebuildTypes();
    renderTypesList();
    input.value = "";
    minutesInput.value = "";
    kcalInput.value = "";
    categoryInput.value = "";
  });
  wireEnterSubmit(["newTypeLabel", "newTypeMinutes", "newTypeKcal"], document.getElementById("addTypeBtn"));
  document.getElementById("typesModalCloseBtn").addEventListener("click", closeTypesModal);
  document.getElementById("typesModalBackBtn").addEventListener("click", closeTypesModal);
  document.getElementById("typesModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "typesModalOverlay") { closeTypesModal(); reestablishModalMarkerIfStillOpen(); }
  });
}

function renderTypesList() {
  const list = document.getElementById("typesList");
  if (!list) return;
  list.innerHTML = trainingTypes.map((t, i) => `
    <div style="background:var(--input-bg);border:1px solid var(--border2);border-radius:10px;padding:8px 10px">
      <div style="display:flex;align-items:center;gap:8px">
        <input type="color" data-edit-color="${i}" value="${t.color}" style="width:28px;height:28px;border:1px solid var(--border2);border-radius:6px;background:none;padding:1px;cursor:pointer;flex-shrink:0" />
        <input type="text" data-edit-label="${i}" value="${escapeHtml(t.label)}" style="flex:1;min-width:0;background:transparent;border:none;color:var(--text);font-size:14px;font-weight:600;font-family:inherit;padding:2px" />
        <button class="delete-btn" data-move-up="${i}" ${i === 0 ? "disabled style='opacity:0.25'" : ""}>${ICONS.up}</button>
        <button class="delete-btn" data-move-down="${i}" ${i === trainingTypes.length - 1 ? "disabled style='opacity:0.25'" : ""}>${ICONS.down}</button>
        <button class="delete-btn" data-remove-type="${i}">${ICONS.trash}</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding-left:36px">
        <span style="font-size:12px;color:var(--muted);white-space:nowrap">Förinställda minuter:</span>
        <input type="number" inputmode="numeric" data-edit-minutes="${i}" value="${t.defaultMinutes || ""}" placeholder="–" style="width:70px;background:var(--card-bg);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-size:13px;font-family:inherit" />
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding-left:36px">
        <span style="font-size:12px;color:var(--muted);white-space:nowrap">Förinställda kcal:</span>
        <input type="number" inputmode="numeric" data-edit-kcal="${i}" value="${t.defaultKcalBurned || ""}" placeholder="–" style="width:70px;background:var(--card-bg);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-size:13px;font-family:inherit" />
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding-left:36px">
        <span style="font-size:12px;color:var(--muted);white-space:nowrap">Kategori:</span>
        <select data-edit-category="${i}" style="flex:1;background:var(--card-bg);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-size:13px;font-family:inherit">
          <option value="" ${!t.category ? "selected" : ""}>Ingen</option>
          <option value="kampsport" ${t.category === "kampsport" ? "selected" : ""}>Kampsport</option>
          <option value="gym" ${t.category === "gym" ? "selected" : ""}>Styrka</option>
          <option value="kondition" ${t.category === "kondition" ? "selected" : ""}>Kondition</option>
        </select>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-edit-color]").forEach((input) => {
    input.addEventListener("input", (e) => {
      trainingTypes[parseInt(input.dataset.editColor, 10)].color = e.target.value;
      saveTrainingTypes();
      rebuildTypes();
    });
  });
  list.querySelectorAll("[data-edit-label]").forEach((input) => {
    input.addEventListener("input", (e) => {
      trainingTypes[parseInt(input.dataset.editLabel, 10)].label = e.target.value;
      saveTrainingTypes();
      rebuildTypes();
    });
  });
  list.querySelectorAll("[data-edit-minutes]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      trainingTypes[parseInt(input.dataset.editMinutes, 10)].defaultMinutes = isNaN(val) ? "" : val;
      saveTrainingTypes();
      rebuildTypes();
    });
  });
  list.querySelectorAll("[data-edit-kcal]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      trainingTypes[parseInt(input.dataset.editKcal, 10)].defaultKcalBurned = isNaN(val) ? "" : val;
      saveTrainingTypes();
      rebuildTypes();
    });
  });
  list.querySelectorAll("[data-edit-category]").forEach((select) => {
    select.addEventListener("change", (e) => {
      trainingTypes[parseInt(select.dataset.editCategory, 10)].category = e.target.value || null;
      saveTrainingTypes();
      rebuildTypes();
    });
  });
  list.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.moveUp, 10);
      if (i > 0) {
        [trainingTypes[i - 1], trainingTypes[i]] = [trainingTypes[i], trainingTypes[i - 1]];
        saveTrainingTypes();
        rebuildTypes();
        renderTypesList();
      }
    });
  });
  list.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.moveDown, 10);
      if (i < trainingTypes.length - 1) {
        [trainingTypes[i + 1], trainingTypes[i]] = [trainingTypes[i], trainingTypes[i + 1]];
        saveTrainingTypes();
        rebuildTypes();
        renderTypesList();
      }
    });
  });
  list.querySelectorAll("[data-remove-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (trainingTypes.length <= 1) return;
      const i = parseInt(btn.dataset.removeType, 10);
      trainingTypes.splice(i, 1);
      saveTrainingTypes();
      rebuildTypes();
      renderTypesList();
    });
  });
}

function closeTypesModal() {
  modalRoot.innerHTML = "";
  if (!TYPES[workoutFormState.type]) {
    workoutFormState.type = TRAINING_KEYS[0] || HEALTH_KEYS[0];
    workoutFormState.minutes = DEFAULT_MINUTES[workoutFormState.type] || "";
    workoutFormState.customLabel = "";
  }
  if (typesModalReturnsToSettings) {
    openBackupModal();
    const sheet = modalRoot.querySelector(".modal-sheet");
    if (sheet) sheet.scrollTop = typesModalReturnScrollTop;
  } else if (activeTab === "traning") {
    renderTraning();
  }
}

/* ---------------- Årskrönika (year in review) ---------------- */

function openWeeklyChallengeSummaryModal() {
  pushModalHistoryIfNeeded();
  const weeksTotal = weeklyChallengeHistory.length;
  const weeksAllThree = weeklyChallengeHistory.filter((w) => w.completed === w.total).length;
  const weeksPct = weeksTotal ? Math.round((weeksAllThree / weeksTotal) * 100) : 0;

  const indivCompleted = weeklyChallengeHistory.reduce((s, w) => s + w.completed, 0) + weeklyChallengeState.completed.length;
  const indivTotal = weeklyChallengeHistory.reduce((s, w) => s + w.total, 0) + weeklyChallengeState.ids.length;
  const indivPct = indivTotal ? Math.round((indivCompleted / indivTotal) * 100) : 0;

  modalRoot.innerHTML = `
    <div class="modal-overlay" id="weeklyChallengeSummaryOverlay">
      <div class="modal-sheet">
        <div style="text-align:center;padding:4px 0 8px">
          <img src="${APP_ICON_IMG}" alt="Workout Tracker" style="width:48px;height:48px;border-radius:12px" />
        </div>
        <h2>📊 Sammanfattning av veckoutmaningar</h2>

        <div class="card" style="background:var(--bg);text-align:center">
          <div class="card-label">Veckor med alla tre klara</div>
          <div style="font-size:34px;font-weight:800;color:${tabColors.traning};margin:4px 0">${weeksPct}%</div>
          <div style="font-size:12.5px;color:var(--muted)">${weeksAllThree} av ${weeksTotal} avslutade veckor</div>
          <div class="bar-track" style="margin-top:10px"><div class="bar-fill" style="width:${weeksPct}%;background:${tabColors.traning}"></div></div>
        </div>

        <div class="card" style="background:var(--bg);text-align:center">
          <div class="card-label">Enskilda utmaningar klarade</div>
          <div style="font-size:34px;font-weight:800;color:${tabColors.traning};margin:4px 0">${indivPct}%</div>
          <div style="font-size:12.5px;color:var(--muted)">${indivCompleted} av ${indivTotal} utmaningar totalt</div>
          <div class="bar-track" style="margin-top:10px"><div class="bar-fill" style="width:${indivPct}%;background:${tabColors.traning}"></div></div>
        </div>

        ${weeksTotal === 0 ? `<p style="text-align:center">Statistiken byggs upp vartefter veckor avslutas — kom tillbaka nästa vecka!</p>` : ""}

        <div class="modal-close" id="weeklyChallengeSummaryCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  document.getElementById("weeklyChallengeSummaryCloseBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
  });
  document.getElementById("weeklyChallengeSummaryOverlay").addEventListener("click", (e) => {
    if (e.target.id === "weeklyChallengeSummaryOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
}

function openMonthRecapModal(monthKey) {
  pushModalHistoryIfNeeded();
  const monthEntries = workoutEntries.filter((e) => e.date.slice(0, 7) === monthKey && isTraining(e));
  const totalMinutes = monthEntries.reduce((s, e) => s + e.minutes, 0);
  const catStats = [
    { label: "🥋 Kampsport", filter: isMartialArts },
    { label: "🏃 Kondition", filter: isCardio },
    { label: "🏋️ Styrka", filter: isGymType },
  ].map((c) => ({ label: c.label, minutes: monthEntries.filter(c.filter).reduce((s, e) => s + e.minutes, 0) }));

  const dayCounts = {};
  monthEntries.forEach((e) => { dayCounts[e.date] = (dayCounts[e.date] || 0) + 1; });
  const bestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const bestDay = bestDayEntry ? { date: bestDayEntry[0], count: bestDayEntry[1] } : null;

  const unlockedThisMonth = Object.entries(unlockedAchievementDates)
    .filter(([id, date]) => date.slice(0, 7) === monthKey && ACHIEVEMENTS.some((a) => a.id === id))
    .map(([id]) => ACHIEVEMENTS.find((a) => a.id === id));

  const monthWeightEntries = weightEntries.filter((e) => e.date.slice(0, 7) === monthKey);
  const weightChange = monthWeightEntries.length >= 2
    ? +(monthWeightEntries[monthWeightEntries.length - 1].value - monthWeightEntries[0].value).toFixed(1)
    : null;

  const monthCalorieDates = [...new Set(calorieLog.filter((e) => e.date.slice(0, 7) === monthKey && e.type !== "burned").map((e) => e.date))];
  const avgCalories = monthCalorieDates.length
    ? Math.round(monthCalorieDates.reduce((s, d) => s + calorieLog.filter((e) => e.date === d && e.type !== "burned").reduce((s2, e) => s2 + e.kcal, 0), 0) / monthCalorieDates.length)
    : null;

  modalRoot.innerHTML = `
    <div class="modal-overlay" id="monthRecapOverlay">
      <div class="modal-sheet">
        <div style="text-align:center;padding:4px 0 8px">
          <img src="${APP_ICON_IMG}" alt="Workout Tracker" style="width:48px;height:48px;border-radius:12px" />
        </div>
        <h2>📅 Sammanfattning ${monthKeyLabelFull(monthKey)}</h2>
        <div class="card" style="background:var(--bg)">
          <div style="display:flex;justify-content:space-around;text-align:center">
            <div><div class="value" style="color:${tabColors.stats}">${monthEntries.length}</div><div class="sub">pass</div></div>
            <div><div class="value" style="color:${tabColors.stats}">${fmtMinutes(totalMinutes)}</div><div class="sub">total tid</div></div>
          </div>
        </div>
        <div class="card" style="background:var(--bg)">
          <div class="card-label" style="margin-bottom:8px">Tid per kategori</div>
          ${catStats.map((c) => `<div class="goal-row"><span class="goal-label">${c.label}</span><span class="goal-value">${c.minutes ? fmtMinutes(c.minutes) : "–"}</span></div>`).join("")}
        </div>
        ${bestDay ? `
          <div class="card" style="background:var(--bg)">
            <div class="goal-row"><span class="goal-label">🔥 Mest aktiva dagen</span><span class="goal-value">${fmtDateWithWeekday(bestDay.date)} (${bestDay.count} pass)</span></div>
          </div>
        ` : ""}
        ${weightChange !== null ? `
          <div class="card" style="background:var(--bg)">
            <div class="goal-row"><span class="goal-label">⚖️ Viktförändring</span><span class="goal-value" style="color:${weightChange > 0 ? "#E8834A" : weightChange < 0 ? "#4CAF7D" : "var(--muted)"}">${weightChange > 0 ? "+" : ""}${weightChange} kg</span></div>
          </div>
        ` : ""}
        ${avgCalories !== null ? `
          <div class="card" style="background:var(--bg)">
            <div class="goal-row"><span class="goal-label">🍽️ Snittkalorier/dag</span><span class="goal-value">${avgCalories} kcal</span></div>
          </div>
        ` : ""}
        ${unlockedThisMonth.length ? `
          <div class="card" style="background:var(--bg)">
            <div class="card-label" style="margin-bottom:8px">Prestationer denna månad <span style="color:var(--muted2);font-weight:600">${unlockedThisMonth.length} st</span></div>
            <div style="display:flex;gap:8px;justify-content:space-around;flex-wrap:wrap">
              ${unlockedThisMonth.slice(0, 8).map(achievementBadgeHTML).join("")}
            </div>
          </div>
        ` : ""}
        ${monthEntries.length === 0 ? `<p>Inga pass loggade den här månaden.</p>` : ""}
        <div class="modal-close" id="monthRecapCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  document.getElementById("monthRecapCloseBtn").addEventListener("click", () => {
    modalRoot.innerHTML = "";
  });
  document.getElementById("monthRecapOverlay").addEventListener("click", (e) => {
    if (e.target.id === "monthRecapOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
}

// Tränings-heatmap i stil med GitHubs bidragsgraf: en ruta per dag, färgad
// efter hur mycket man tränade den dagen (5 nivåer, mörkare = mer tid).
// Byggs som veckokolumner (måndag-söndag) från årets första till sista dag
// (eller till idag om det är innevarande år), i en horisontellt scrollbar
// rad så den funkar på mobil utan att tvinga fram en jättebred modal.
function yearHeatmapHTML(year, trainingEntries) {
  const minutesByDate = {};
  trainingEntries.forEach((e) => { minutesByDate[e.date] = (minutesByDate[e.date] || 0) + e.minutes; });

  const jan1 = `${year}-01-01`;
  const dec31 = `${year}-12-31`;
  const isCurrentYear = year === new Date().getFullYear();
  const rangeEnd = isCurrentYear && todayISO() < dec31 ? todayISO() : dec31;

  const gridStart = mondayOf(jan1);
  const gridEndMonday = mondayOf(rangeEnd);
  const msPerWeek = 7 * 86400000;
  const weeksCount = Math.round((new Date(gridEndMonday + "T00:00:00") - new Date(gridStart + "T00:00:00")) / msPerWeek) + 1;

  function levelFor(mins) {
    if (!mins) return 0;
    if (mins < 30) return 1;
    if (mins < 60) return 2;
    if (mins < 90) return 3;
    return 4;
  }
  const levelColors = [
    "var(--border)",
    hexToRgba(tabColors.traning, 0.30),
    hexToRgba(tabColors.traning, 0.55),
    hexToRgba(tabColors.traning, 0.78),
    hexToRgba(tabColors.traning, 1),
  ];

  const monthLabels = [];
  let lastMonth = null;
  const weekCols = [];
  for (let w = 0; w < weeksCount; w++) {
    const weekStartDate = new Date(gridStart + "T00:00:00");
    weekStartDate.setDate(weekStartDate.getDate() + w * 7);
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(weekStartDate);
      cellDate.setDate(cellDate.getDate() + d);
      const iso = toLocalISO(cellDate);
      const inRange = iso >= jan1 && iso <= rangeEnd;
      if (d === 0 && inRange) {
        const m = cellDate.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ weekIndex: w, label: MONTHS_SV[m] });
          lastMonth = m;
        }
      }
      const mins = minutesByDate[iso] || 0;
      cells.push({ iso, level: inRange ? levelFor(mins) : -1, mins, inRange });
    }
    weekCols.push(cells);
  }

  const cellSize = 11;
  const gap = 3;
  const colWidth = cellSize + gap;
  const gridWidth = weeksCount * colWidth;

  const monthLabelsHTML = monthLabels.map((m) => `<span style="position:absolute;left:${m.weekIndex * colWidth}px;font-size:10px;color:var(--muted2)">${m.label}</span>`).join("");

  const gridHTML = weekCols.map((cells) => `
    <div style="display:flex;flex-direction:column;gap:${gap}px">
      ${cells.map((c) => c.inRange
        ? `<div title="${fmtDateWithWeekday(c.iso)}${c.mins ? ` · ${fmtMinutes(c.mins)}` : ""}" style="width:${cellSize}px;height:${cellSize}px;border-radius:3px;background:${levelColors[c.level]}"></div>`
        : `<div style="width:${cellSize}px;height:${cellSize}px"></div>`
      ).join("")}
    </div>
  `).join("");

  return `
    <div class="card" style="background:var(--bg)">
      <div class="card-label" style="margin-bottom:6px">🔥 Träningskalender ${year}</div>
      <div class="heatmap-scroll" style="overflow-x:auto">
        <div style="position:relative;height:14px;margin-bottom:2px;min-width:${gridWidth}px">${monthLabelsHTML}</div>
        <div style="display:flex;gap:${gap}px;min-width:${gridWidth}px">${gridHTML}</div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:8px;font-size:10px;color:var(--muted2)">
        <span>Mindre</span>
        ${levelColors.map((c) => `<div style="width:10px;height:10px;border-radius:2px;background:${c}"></div>`).join("")}
        <span>Mer</span>
      </div>
    </div>
  `;
}

function openYearReviewModal() {
  pushModalHistoryIfNeeded();
  const currentMondayForYearReview = mondayOf(todayISO());
  if (weeklyMisc.yearReviewOpenedWeek !== currentMondayForYearReview) {
    weeklyMisc.yearReviewOpenedWeek = currentMondayForYearReview;
    saveWeeklyMisc();
    checkWeeklyChallenges();
  }
  const isHealth = (e) => e.type === "Sjuk" || e.type === "Skadad";
  const currentYear = new Date().getFullYear();
  const yearE = workoutEntries.filter((e) => e.date.slice(0, 4) === String(currentYear));
  const yearTrainingE = yearE.filter((e) => !isHealth(e));
  const totalMinutes = yearTrainingE.reduce((s, e) => s + e.minutes, 0);

  const countByType = {};
  yearTrainingE.forEach((e) => { countByType[e.type] = (countByType[e.type] || 0) + 1; });
  let topType = null;
  Object.keys(countByType).forEach((t) => {
    if (!topType || countByType[t] > countByType[topType]) topType = t;
  });

  const yearWeight = weightEntries.filter((e) => e.date.slice(0, 4) === String(currentYear)).sort((a, b) => a.date.localeCompare(b.date));
  const weightDelta = yearWeight.length > 1 ? +(yearWeight[yearWeight.length - 1].value - yearWeight[0].value).toFixed(1) : null;
  const yearWeightValues = yearWeight.map((e) => e.value);
  const yearWeightMax = yearWeightValues.length ? Math.max(...yearWeightValues) : null;
  const yearWeightMin = yearWeightValues.length ? Math.min(...yearWeightValues) : null;
  const yearWeightSwing = yearWeightMax !== null && yearWeightMin !== null ? +(yearWeightMax - yearWeightMin).toFixed(1) : null;

  const weekCounts = {};
  yearTrainingE.forEach((e) => {
    const wk = getISOWeek(e.date);
    weekCounts[wk] = (weekCounts[wk] || 0) + 1;
  });
  const peakWeekCount = Math.max(0, ...Object.values(weekCounts));
  const longestStreak = computeLongestStreakInYear(currentYear);

  const martialMinutes = yearTrainingE.filter(isMartialArts).reduce((s, e) => s + e.minutes, 0);
  const cardioMinutes = yearTrainingE.filter(isCardio).reduce((s, e) => s + e.minutes, 0);
  const gymMinutes = yearTrainingE.filter(isGymType).reduce((s, e) => s + e.minutes, 0);

  const yearGymEntries = yearTrainingE.filter((e) => e.type === "Gym");
  const yearGymSplitCounts = {};
  yearGymEntries.forEach((e) => { if (e.gymSplit) yearGymSplitCounts[e.gymSplit] = (yearGymSplitCounts[e.gymSplit] || 0) + 1; });
  const yearGymSplitRows = gymSplits
    .map((g) => ({ label: g.text, count: yearGymSplitCounts[g.id] || 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const yearTotalVolume = gymSessionHistory
    .filter((s) => s.date.slice(0, 4) === String(currentYear) && s.totalVolume)
    .reduce((sum, s) => sum + s.totalVolume, 0);

  const sortedByMinutes = [...yearTrainingE].filter((e) => e.minutes > 0).sort((a, b) => a.minutes - b.minutes);
  const shortest = sortedByMinutes[0];
  const longest = sortedByMinutes[sortedByMinutes.length - 1];

  const recentAchievements = recentlyUnlockedList(3);

  const trackedMartialEntries = workoutEntries.filter((e) => (e.type === "BJJ" || e.type === "SW") && Array.isArray(e.submissions));
  let topSubmissions = [];
  if (submissionsMenuEnabled && trackedMartialEntries.length) {
    const subCounts = {};
    trackedMartialEntries.forEach((e) => { e.submissions.forEach((id) => { subCounts[id] = (subCounts[id] || 0) + 1; }); });
    topSubmissions = submissionTypes
      .map((s) => ({ label: s.label, pct: Math.round(((subCounts[s.id] || 0) / trackedMartialEntries.length) * 100) }))
      .filter((s) => s.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }

  modalRoot.innerHTML = `
    <div class="modal-overlay" id="yearReviewOverlay">
      <div class="modal-sheet">
        <div style="text-align:center;padding:4px 0 8px">
          <img src="${APP_ICON_IMG}" alt="Workout Tracker" style="width:48px;height:48px;border-radius:12px" />
        </div>
        <h2>🎉 Din ${currentYear} hittills</h2>
        <div class="card" style="background:var(--bg)">
          <div style="display:flex;justify-content:space-around;text-align:center">
            <div>
              <div style="font-size:26px;font-weight:700;color:${tabColors.stats}">${yearTrainingE.length}</div>
              <div style="font-size:11px;color:var(--muted2)">tränade pass</div>
            </div>
            <div>
              <div style="font-size:26px;font-weight:700;color:${tabColors.stats}">${fmtMinutes(totalMinutes)}</div>
              <div style="font-size:11px;color:var(--muted2)">total tid</div>
            </div>
          </div>
        </div>
        <div class="card" style="background:var(--bg)">
          <div class="card-label" style="margin-bottom:8px">Tid per kategori</div>
          <div class="goal-row"><span class="goal-label">🥋 Kampsport</span><span class="goal-value">${martialMinutes ? fmtMinutes(martialMinutes) : "–"}</span></div>
          <div class="goal-row"><span class="goal-label">🏃 Kondition</span><span class="goal-value">${cardioMinutes ? fmtMinutes(cardioMinutes) : "–"}</span></div>
          <div class="goal-row"><span class="goal-label">🏋️ Styrka</span><span class="goal-value">${gymMinutes ? fmtMinutes(gymMinutes) : "–"}</span></div>
        </div>
        ${yearGymEntries.length ? `
          <div class="card" style="background:var(--bg)">
            <div class="card-label" style="margin-bottom:8px">Gympass i år <span style="color:var(--muted2);font-weight:600">${yearGymEntries.length} st</span></div>
            ${yearGymSplitRows.map((row) => `<div class="goal-row"><span class="goal-label">${escapeHtml(row.label)}</span><span class="goal-value">${row.count} pass</span></div>`).join("")}
            ${yearTotalVolume > 0 ? `<div class="goal-row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)"><span class="goal-label">💪 Totalvikt lyft</span><span class="goal-value" style="color:${tabColors.traning}">${Math.round(yearTotalVolume).toLocaleString("sv-SE")} kg</span></div>` : ""}
          </div>
        ` : ""}
        <div class="card" style="background:var(--bg)">
          ${topType ? `<div class="goal-row"><span class="goal-label">Vanligaste passet</span><span class="goal-value" style="color:${typeMeta(topType).color}">${typeMeta(topType).label} (${countByType[topType]}×)</span></div>` : ""}
          <div class="goal-row"><span class="goal-label">Bästa veckan</span><span class="goal-value">${peakWeekCount} pass</span></div>
          <div class="goal-row"><span class="goal-label">Längsta streak 🔥</span><span class="goal-value">${longestStreak} ${longestStreak === 1 ? "dag" : "dagar"}</span></div>
          ${longest ? `<div class="goal-row"><span class="goal-label">Längsta passet</span><span class="goal-value" style="color:${typeMeta(longest.type).color}">${fmtMinutes(longest.minutes)} (${typeMeta(longest.type).label})</span></div>` : ""}
          ${shortest ? `<div class="goal-row"><span class="goal-label">Kortaste passet</span><span class="goal-value" style="color:${typeMeta(shortest.type).color}">${fmtMinutes(shortest.minutes)} (${typeMeta(shortest.type).label})</span></div>` : ""}
          ${weightDelta !== null ? `<div class="goal-row"><span class="goal-label">Viktförändring i år</span><span class="goal-value" style="color:${weightDelta > 0 ? "#E8834A" : weightDelta < 0 ? "#4CAF7D" : "var(--text)"}">${weightDelta > 0 ? "+" : ""}${weightDelta} kg</span></div>` : ""}
          ${yearWeightMax !== null ? `<div class="goal-row"><span class="goal-label">Högsta vikt i år</span><span class="goal-value">${yearWeightMax} kg</span></div>` : ""}
          ${yearWeightMin !== null ? `<div class="goal-row"><span class="goal-label">Lägsta vikt i år</span><span class="goal-value">${yearWeightMin} kg</span></div>` : ""}
          ${yearWeightSwing !== null ? `<div class="goal-row"><span class="goal-label">Pendling i år</span><span class="goal-value" style="color:${tabColors.stats}">${yearWeightSwing} kg</span></div>` : ""}
        </div>
        ${yearTrainingE.length === 0 ? `<p>Inga pass loggade i år ännu — dags att sätta igång!</p>` : `<p>Fortsätt så — varje pass räknas.</p>`}
        ${topSubmissions.length ? `
          <div class="card" style="background:var(--bg)">
            <div class="card-label" style="margin-bottom:8px">Dina bästa submissions</div>
            ${topSubmissions.map((s) => `<div class="goal-row"><span class="goal-label">${escapeHtml(s.label)}</span><span class="goal-value">${s.pct}%</span></div>`).join("")}
          </div>
        ` : ""}
        ${recentAchievements.length ? `
          <div class="card" style="background:var(--bg)">
            <div class="card-label" style="margin-bottom:8px">Senast upplåsta</div>
            <div style="display:flex;gap:8px;justify-content:space-around">
              ${recentAchievements.map(achievementBadgeHTML).join("")}
            </div>
          </div>
        ` : ""}
        ${yearHeatmapHTML(currentYear, yearTrainingE)}
        <div class="modal-close" id="yearReviewCloseBtn">Stäng</div>
      </div>
    </div>
  `;
  document.getElementById("yearReviewCloseBtn").addEventListener("click", () => { modalRoot.innerHTML = ""; });
  document.getElementById("yearReviewOverlay").addEventListener("click", (e) => {
    if (e.target.id === "yearReviewOverlay") { modalRoot.innerHTML = ""; handleModalClosedByUser(); }
  });
}

/* ---------------- Automatic backup reminder (every 14 days) ---------------- */

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function loadBackupMeta() {
  try {
    const raw = localStorage.getItem("backup_meta");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  const fresh = { firstOpenAt: Date.now(), lastBackupAt: null, snoozeUntil: 0 };
  localStorage.setItem("backup_meta", JSON.stringify(fresh));
  return fresh;
}
function saveBackupMeta(meta) {
  try { localStorage.setItem("backup_meta", JSON.stringify(meta)); } catch (e) { /* ignore */ }
}

function markBackupDone() {
  const meta = loadBackupMeta();
  meta.lastBackupAt = Date.now();
  meta.snoozeUntil = 0;
  saveBackupMeta(meta);
  hideBackupBanner();
}

function checkBackupReminder() {
  const meta = loadBackupMeta();
  const now = Date.now();
  const base = meta.lastBackupAt || meta.firstOpenAt;
  const due = now - base >= TWO_WEEKS_MS && now >= (meta.snoozeUntil || 0);
  if (due) {
    const text = meta.lastBackupAt
      ? "Det har gått över 2 veckor sedan din senaste backup. Ladda ner en ny så är din data trygg."
      : "Du har inte säkerhetskopierat din träningslogg än. Dags att ladda ner en backup-fil.";
    showBackupBanner(text);
  } else {
    hideBackupBanner();
  }
}

function showBackupBanner(text) {
  document.getElementById("backupBannerText").textContent = text;
  document.getElementById("backupBanner").style.display = "flex";
}
function hideBackupBanner() {
  document.getElementById("backupBanner").style.display = "none";
}

document.getElementById("backupBannerNow").addEventListener("click", () => {
  exportDataBackup();
});
document.getElementById("backupBannerSnooze").addEventListener("click", () => {
  const meta = loadBackupMeta();
  meta.snoozeUntil = Date.now() + THREE_DAYS_MS;
  saveBackupMeta(meta);
  hideBackupBanner();
});

document.getElementById("appHeaderIcon").src = APP_ICON_IMG;
document.getElementById("settingsBtn").innerHTML = ICONS.gear;
document.getElementById("settingsBtn").addEventListener("click", openBackupModal);
importFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importBackupFile(file);
  importFileInput.value = "";
});

/* ---------------- Init ---------------- */

render();
checkBackupReminder();
installCloudSyncHooks();
initCloudAuth();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

// Ask the browser to protect this site's storage from automatic eviction
// (does not protect against the user manually clearing browsing data — use backups for that).
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}
