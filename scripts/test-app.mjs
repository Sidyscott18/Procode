/**
 * Procode App - Full Test Suite
 * Tests: Firebase connection, Auth, Firestore, Game Score logic,
 *        XP/Level calculation, Groq AI API, username validation.
 *
 * Run: node scripts/test-app.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Load env ────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const [k, ...rest] = line.split("=");
      if (k && rest.length) process.env[k.trim()] = rest.join("=").trim();
    }
  } catch {
    // no .env – that's fine
  }
}
loadEnv();

// ─── Colour helpers ──────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", green: "\x1b[32m",
  red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m",
  blue: "\x1b[34m", dim: "\x1b[2m",
};

const PASS = `${C.green}${C.bold}  PASS${C.reset}`;
const FAIL = `${C.red}${C.bold}  FAIL${C.reset}`;
const WARN = `${C.yellow}${C.bold}  WARN${C.reset}`;
const INFO = `${C.blue}${C.bold}  INFO${C.reset}`;

let totalPass = 0, totalFail = 0, totalWarn = 0;

function section(name) {
  console.log(`\n${C.cyan}${C.bold}---  ${name}  ---${C.reset}`);
}

function pass(msg, detail = "") {
  totalPass++;
  console.log(`${PASS} ${msg}${detail ? ` ${C.dim}(${detail})${C.reset}` : ""}`);
}

function fail(msg, detail = "") {
  totalFail++;
  console.log(`${FAIL} ${msg}${detail ? `\n        ${C.red}${detail}${C.reset}` : ""}`);
}

function warn(msg, detail = "") {
  totalWarn++;
  console.log(`${WARN} ${msg}${detail ? ` ${C.dim}(${detail})${C.reset}` : ""}`);
}

function info(msg) {
  console.log(`${INFO} ${C.dim}${msg}${C.reset}`);
}

// ════════════════════════════════════════════════════════════════════
// SUITE 1 - Firebase Config
// ════════════════════════════════════════════════════════════════════
async function testFirebaseConfig() {
  section("1. Firebase Configuration");

  const firebaseConfigValues = {
    apiKey: "AIzaSyAdZsMY-mYLxeWxdG1Z_ua8x__AUoHH_C0",
    authDomain: "procode-1bdef.firebaseapp.com",
    projectId: "procode-1bdef",
    storageBucket: "procode-1bdef.firebasestorage.app",
    messagingSenderId: "868812370783",
    appId: "1:868812370783:web:fbe33e0959dc7d399d3cea",
  };

  for (const [key, value] of Object.entries(firebaseConfigValues)) {
    if (value && value.length > 0) {
      pass(`${key} is set`, value.substring(0, 24) + "...");
    } else {
      fail(`${key} is missing`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 2 - Firebase REST API Connection
// ════════════════════════════════════════════════════════════════════
async function testFirebaseConnection() {
  section("2. Firebase Network Connection");

  const PROJECT_ID = "procode-1bdef";
  const API_KEY = "AIzaSyAdZsMY-mYLxeWxdG1Z_ua8x__AUoHH_C0";

  // 2a - Auth endpoint reachable?
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "invalid-test-token" }),
      }
    );
    const data = await res.json();
    if (res.status === 400 && data.error) {
      pass("Firebase Auth REST endpoint reachable", `Error: ${data.error.message}`);
    } else {
      warn("Firebase Auth REST - unexpected response", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Firebase Auth REST endpoint unreachable", String(e));
  }

  // 2b - Firestore REST endpoint reachable?
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/nonexistent_collection?key=${API_KEY}`
    );
    if (res.status === 200 || res.status === 404) {
      pass("Firestore REST endpoint reachable", `HTTP ${res.status}`);
    } else if (res.status === 403) {
      pass("Firestore REST endpoint reachable", "Security rules active (403 for anon)");
    } else {
      warn("Firestore REST - unexpected status", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Firestore REST endpoint unreachable", String(e));
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 3 - Groq AI API Connection
// ════════════════════════════════════════════════════════════════════
async function testGroqApi() {
  section("3. Groq AI API (Procode AI Chat)");

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    fail("EXPO_PUBLIC_GROQ_API_KEY not found in .env");
    return;
  }

  if (!apiKey.startsWith("gsk_")) {
    warn("API key format looks unusual", "Expected to start with 'gsk_'");
  } else {
    pass("API key format valid", `gsk_${apiKey.substring(4, 14)}...`);
  }

  // 3a - List models to verify key is active
  try {
    const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (modelsRes.ok) {
      const data = await modelsRes.json();
      const models = data?.data?.map((m) => m.id) ?? [];
      const hasLlama = models.some((m) => m.includes("llama"));
      pass("Groq API key is active", `${models.length} models available`);
      hasLlama
        ? pass("llama-3.1-8b-instant available")
        : warn("llama-3.1-8b-instant not found in model list");
    } else {
      const err = await modelsRes.json().catch(() => ({}));
      fail("Groq API key rejected", `HTTP ${modelsRes.status}: ${err?.error?.message ?? "unknown"}`);
    }
  } catch (e) {
    fail("Cannot reach Groq API", String(e));
    return;
  }

  // 3b - Actual chat completion test
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Reply with ONLY the word: OK" },
          { role: "user", content: "test" },
        ],
        max_tokens: 10,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? "";
      pass("Groq chat completion works", `Reply: "${reply.trim().substring(0, 30)}"`);
    } else {
      const err = await res.json().catch(() => ({}));
      fail("Groq chat completion failed", `HTTP ${res.status}: ${err?.error?.message ?? "unknown"}`);
    }
  } catch (e) {
    fail("Groq chat completion request failed", String(e));
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 4 - XP / Level Calculation Logic
// ════════════════════════════════════════════════════════════════════
function testXpLogic() {
  section("4. XP & Level Calculation Logic");

  function calcLevel(totalXp) {
    let newLevel = 0;
    let requiredXp = 0;
    while (totalXp >= requiredXp + (newLevel + 1) * 100) {
      requiredXp += (newLevel + 1) * 100;
      newLevel++;
    }
    return newLevel;
  }

  function getLevelStart(lvl) {
    let start = 0;
    for (let i = 0; i < lvl; i++) start += (i + 1) * 100;
    return start;
  }

  const cases = [
    { xp: 0, expectedLevel: 0, note: "0 XP -> Level 0" },
    { xp: 99, expectedLevel: 0, note: "99 XP -> Level 0" },
    { xp: 100, expectedLevel: 1, note: "100 XP -> Level 1" },
    { xp: 299, expectedLevel: 1, note: "299 XP -> Level 1" },
    { xp: 300, expectedLevel: 2, note: "300 XP -> Level 2" },
    { xp: 599, expectedLevel: 2, note: "599 XP -> Level 2" },
    { xp: 600, expectedLevel: 3, note: "600 XP -> Level 3" },
    { xp: 1000, expectedLevel: 4, note: "1000 XP -> Level 4" },
  ];

  for (const { xp, expectedLevel, note } of cases) {
    const level = calcLevel(xp);
    if (level === expectedLevel) {
      pass(note, `level=${level}`);
    } else {
      fail(note, `Expected level ${expectedLevel} but got ${level}`);
    }
  }

  // Verify boundary consistency
  for (let lvl = 0; lvl <= 5; lvl++) {
    const start = getLevelStart(lvl);
    const end = getLevelStart(lvl + 1) - 1;
    const levelAtStart = calcLevel(start);
    const levelAtEnd = calcLevel(end);
    if (levelAtStart === lvl && levelAtEnd === lvl) {
      pass(`Level ${lvl} boundary consistent`, `XP range [${start}, ${end}]`);
    } else {
      fail(`Level ${lvl} boundary mismatch`, `Start ${start}->lvl${levelAtStart}, End ${end}->lvl${levelAtEnd}`);
    }
  }

  // XP bar progress
  section("4b. XP Progress Bar Logic");
  const testUser = { xp: 150, level: 1 };
  const currentLevelStart = getLevelStart(testUser.level);
  const nextLevelStart = getLevelStart(testUser.level + 1);
  const xpForCurrentLevel = nextLevelStart - currentLevelStart;
  const currentProgressXp = testUser.xp - currentLevelStart;
  const xpProgress = Math.max(0, Math.min(1, currentProgressXp / xpForCurrentLevel));

  info(`Level 1 user with 150 XP: progress = ${(xpProgress * 100).toFixed(1)}%`);
  (xpProgress > 0 && xpProgress < 1)
    ? pass("XP bar progress is between 0-100%", `${(xpProgress * 100).toFixed(1)}%`)
    : fail("XP bar progress out of range", String(xpProgress));
}

// ════════════════════════════════════════════════════════════════════
// SUITE 5 - Game Score Data Structure
// ════════════════════════════════════════════════════════════════════
function testGameScoreStructure() {
  section("5. Game Score Data Structure");

  const requiredGameFields = [
    "level", "xp", "coins", "highScore", "highestWave",
    "completion", "lastPlayed", "achievements", "unlockedWeapons",
    "totalEnemiesDestroyed", "totalPlayTime", "accuracy",
  ];

  const mockSavePayload = {
    highScore: 3200,
    highestWave: 5,
    level: 2,
    xp: 350,
    coins: 120,
    completion: 40,
    lastPlayed: new Date().toLocaleDateString(),
    unlockedWeapons: ["fireball", "ice_shard"],
    achievements: ["first_win"],
    accuracy: 87.5,
    totalEnemiesDestroyed: 80,
    totalPlayTime: 300,
  };

  for (const field of requiredGameFields) {
    if (field in mockSavePayload) {
      pass(`GameData field '${field}' present`, String(mockSavePayload[field]).substring(0, 30));
    } else {
      warn(`GameData field '${field}' not in mock save payload`);
    }
  }

  const typeChecks = [
    ["highScore", "number"], ["highestWave", "number"], ["level", "number"],
    ["xp", "number"], ["coins", "number"], ["completion", "number"],
    ["lastPlayed", "string"], ["achievements", "array"], ["unlockedWeapons", "array"],
  ];

  for (const [field, expectedType] of typeChecks) {
    const val = mockSavePayload[field];
    const actualType = Array.isArray(val) ? "array" : typeof val;
    if (actualType === expectedType) {
      pass(`Field '${field}' type is ${expectedType}`);
    } else {
      fail(`Field '${field}' type mismatch`, `Expected ${expectedType}, got ${actualType}`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 6 - Username Validation Logic
// ════════════════════════════════════════════════════════════════════
function testUsernameValidation() {
  section("6. Username Validation Logic");

  const reservedNames = [
    "admin","administrator","owner","support","moderator",
    "scott","procode","fuck","fucker","shit","bitch",
    "asshole","bastard","dick","sex","porn","nazi","terrorist",
  ];

  function validateUsername(username) {
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20)
      return "Username must be 3-20 characters";
    if (!/^[A-Za-z0-9_]+$/.test(trimmed))
      return "Only letters, numbers and _ allowed";
    if (reservedNames.includes(trimmed.toLowerCase()))
      return "This username is not allowed";
    return null;
  }

  const cases = [
    { username: "ab", expected: "Username must be 3-20 characters", note: "Too short (2 chars)" },
    { username: "a".repeat(21), expected: "Username must be 3-20 characters", note: "Too long (21 chars)" },
    { username: "valid_user", expected: null, note: "Valid username" },
    { username: "Valid123", expected: null, note: "Mixed case + numbers" },
    { username: "user name", expected: "Only letters, numbers and _ allowed", note: "Space in username" },
    { username: "user@name", expected: "Only letters, numbers and _ allowed", note: "@ symbol in username" },
    { username: "admin", expected: "This username is not allowed", note: "Reserved: admin" },
    { username: "PROCODE", expected: "This username is not allowed", note: "Reserved: procode (case-insensitive)" },
    { username: "  siddy  ", expected: null, note: "Username with spaces trimmed" },
    { username: "abc", expected: null, note: "Minimum 3-char username" },
    { username: "a".repeat(20), expected: null, note: "Maximum 20-char username" },
  ];

  for (const { username, expected, note } of cases) {
    const result = validateUsername(username);
    if (result === expected) {
      pass(note, result ?? "valid");
    } else {
      fail(note, `Expected: "${expected}" | Got: "${result}"`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 7 - File / Asset Integrity
// ════════════════════════════════════════════════════════════════════
function testAssetIntegrity() {
  section("7. Critical File & Asset Integrity");

  const criticalFiles = [
    { path: "app.json", label: "app.json" },
    { path: "package.json", label: "package.json" },
    { path: ".env", label: ".env (Groq key)" },
    { path: "services/firebase.ts", label: "Firebase service" },
    { path: "services/auth.ts", label: "Auth service" },
    { path: "services/gameService.ts", label: "Game service" },
    { path: "services/userService.ts", label: "User service" },
    { path: "services/googleAuth.ts", label: "Google Auth service" },
    { path: "services/usernameFilter.ts", label: "Username filter" },
    { path: "screens/HomeScreen.tsx", label: "HomeScreen" },
    { path: "screens/LoginScreen.tsx", label: "LoginScreen" },
    { path: "screens/SignupScreen.tsx", label: "SignupScreen" },
    { path: "screens/ProfileScreen.tsx", label: "ProfileScreen" },
    { path: "screens/LoadingScreen.tsx", label: "LoadingScreen" },
    { path: "screens/UsernameSetupScreen.tsx", label: "UsernameSetupScreen" },
    { path: "screens/VerifyEmailScreen.tsx", label: "VerifyEmailScreen" },
    { path: "app/_layout.tsx", label: "Root Layout" },
    { path: "app/index.tsx", label: "Index route" },
    { path: "app/home.tsx", label: "Home route" },
    { path: "app/login.tsx", label: "Login route" },
    { path: "app/signup.tsx", label: "Signup route" },
    { path: "app/profile.tsx", label: "Profile route" },
    { path: "app/games/pyro.tsx", label: "Pyro game route" },
    { path: "app/games/anomolies.tsx", label: "Anomalies game route" },
    { path: "assets/games/pyro.png", label: "Pyro game thumbnail" },
    { path: "assets/games/anomolies.png", label: "Anomalies game thumbnail" },
    { path: "assets/games/pyro.html", label: "Pyro game HTML" },
  ];

  for (const { path, label } of criticalFiles) {
    const fullPath = join(ROOT, path);
    if (existsSync(fullPath)) {
      const size = readFileSync(fullPath).length;
      if (size === 0) {
        warn(`${label} exists but is EMPTY`, path);
      } else {
        pass(`${label}`, `${(size / 1024).toFixed(1)} KB`);
      }
    } else {
      fail(`${label} MISSING`, path);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 8 - app.json / package.json Config Validation
// ════════════════════════════════════════════════════════════════════
function testAppConfig() {
  section("8. App Config Validation");

  const appJson = JSON.parse(readFileSync(join(ROOT, "app.json"), "utf-8"));
  const pkgJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

  const appName = appJson?.expo?.name;
  const appSlug = appJson?.expo?.slug;
  const appVersion = appJson?.expo?.version;
  const expoSdkVersion = appJson?.expo?.sdkVersion;
  const androidPkg = appJson?.expo?.android?.package;

  appName ? pass("app.json: name set", appName) : fail("app.json: name missing");
  appSlug ? pass("app.json: slug set", appSlug) : fail("app.json: slug missing");
  appVersion ? pass("app.json: version set", appVersion) : fail("app.json: version missing");
  expoSdkVersion ? pass("app.json: sdkVersion set", expoSdkVersion) : warn("app.json: sdkVersion not set");
  androidPkg ? pass("app.json: android.package set", androidPkg) : warn("app.json: android.package not set");

  const deps = pkgJson?.dependencies ?? {};
  const requiredDeps = [
    "expo", "firebase", "expo-router", "react-native", "expo-blur",
    "expo-linear-gradient", "@react-native-google-signin/google-signin",
    "react-native-webview", "expo-crypto",
  ];

  info("Checking required dependencies...");
  for (const dep of requiredDeps) {
    if (deps[dep]) {
      pass(`Dependency: ${dep}`, deps[dep]);
    } else {
      fail(`Dependency MISSING: ${dep}`);
    }
  }

  const expoVersion = deps["expo"] ?? "";
  expoVersion.includes("54")
    ? pass("Expo SDK 54 in use (correct)", expoVersion)
    : warn("Expo version may not be SDK 54", expoVersion);

  const fbVersion = deps["firebase"] ?? "";
  const fbMajor = parseInt(fbVersion.replace(/[^0-9]/, ""), 10);
  fbMajor >= 10
    ? pass("Firebase SDK v10+ (Modular API)", fbVersion)
    : fail("Firebase SDK outdated (<10)", fbVersion);
}

// ════════════════════════════════════════════════════════════════════
// SUITE 9 - Game Route File Validation
// ════════════════════════════════════════════════════════════════════
function testGameRouteFiles() {
  section("9. Game Route File Checks");

  const gameFiles = [
    { path: "app/games/pyro.tsx", name: "Pyro" },
    { path: "app/games/anomolies.tsx", name: "Anomalies" },
    { path: "app/games/soschef.tsx", name: "SosChef" },
  ];

  for (const { path, name } of gameFiles) {
    const fullPath = join(ROOT, path);
    if (!existsSync(fullPath)) {
      fail(`${name} game file missing`, path);
      continue;
    }

    const src = readFileSync(fullPath, "utf-8");
    src.includes("export default")
      ? pass(`${name}: has default export`)
      : fail(`${name}: missing default export`);

    src.includes("firebase")
      ? pass(`${name}: imports Firebase`)
      : warn(`${name}: no Firebase import found`);
  }

  const pyroPath = join(ROOT, "app/games/pyro.tsx");
  if (existsSync(pyroPath)) {
    const pyroSrc = readFileSync(pyroPath, "utf-8");

    const checks = [
      { needle: "setDoc", label: "Pyro: saves data with setDoc" },
      { needle: "getDoc", label: "Pyro: loads save data with getDoc" },
      { needle: "highScore", label: "Pyro: tracks highScore field" },
      { needle: "highestWave", label: "Pyro: tracks highestWave field" },
      { needle: "auth.currentUser", label: "Pyro: uses auth.currentUser for UID" },
      { needle: "SAVE_GAME", label: "Pyro: handles SAVE_GAME WebView message" },
      { needle: "LOAD_GAME", label: "Pyro: sends LOAD_GAME to WebView" },
      // Pyro uses its own syncGlobalXP / addXPFallback instead of importing addPlayerXp
      { needle: "syncGlobalXP", label: "Pyro: awards XP via syncGlobalXP (inline)" },
      { needle: "addXPFallback", label: "Pyro: fallback XP increment via addXPFallback" },
      { needle: "ADD_XP", label: "Pyro: handles ADD_XP WebView message" },
      { needle: "ADD_COINS", label: "Pyro: handles ADD_COINS WebView message" },
      { needle: "UNLOCK_ACHIEVEMENT", label: "Pyro: handles UNLOCK_ACHIEVEMENT message" },
      { needle: "GAME_OVER", label: "Pyro: handles GAME_OVER message" },
    ];

    for (const { needle, label } of checks) {
      pyroSrc.includes(needle)
        ? pass(label)
        : fail(label, `'${needle}' not found in pyro.tsx`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// SUITE 10 - Google Sign-In Config Check
// ════════════════════════════════════════════════════════════════════
function testGoogleSignInConfig() {
  section("10. Google Sign-In Configuration");

  const googleAuthSrc = readFileSync(join(ROOT, "services/googleAuth.ts"), "utf-8");

  const clientIdMatch = googleAuthSrc.match(/webClientId:\s*["']([^"']+)["']/);
  if (clientIdMatch) {
    pass("webClientId configured", clientIdMatch[1].substring(0, 30) + "...");
    clientIdMatch[1].endsWith(".apps.googleusercontent.com")
      ? pass("webClientId format is valid Google OAuth format")
      : warn("webClientId format may be incorrect");
  } else {
    fail("webClientId not found in googleAuth.ts");
  }

  const hasSignOutBeforeSignIn =
    googleAuthSrc.includes("GoogleSignin.signOut()") &&
    googleAuthSrc.indexOf("GoogleSignin.signOut()") < googleAuthSrc.indexOf("GoogleSignin.signIn()");
  hasSignOutBeforeSignIn
    ? pass("Clears previous Google session before sign-in (fresh token flow)")
    : warn("No sign-out-before-sign-in pattern found (stale token risk)");

  googleAuthSrc.includes('router.replace("/home")')
    ? pass("Routes to /home for existing users")
    : fail("Missing /home redirect for existing users");

  googleAuthSrc.includes("/username-setup")
    ? pass("Routes to /username-setup for new users")
    : fail("Missing /username-setup redirect for new users");
}

// ════════════════════════════════════════════════════════════════════
// SUITE 11 - Auth Service Logic
// ════════════════════════════════════════════════════════════════════
function testAuthService() {
  section("11. Auth Service Logic");

  const authSrc = readFileSync(join(ROOT, "services/auth.ts"), "utf-8");

  const checks = [
    { needle: "createUserWithEmailAndPassword", label: "signupUser uses createUserWithEmailAndPassword" },
    { needle: "sendEmailVerification", label: "signupUser sends email verification" },
    { needle: "signInWithEmailAndPassword", label: "loginUser uses signInWithEmailAndPassword" },
    { needle: "signOut", label: "logoutUser uses signOut" },
    { needle: "export const signupUser", label: "signupUser is exported" },
    { needle: "export const loginUser", label: "loginUser is exported" },
    { needle: "export const logoutUser", label: "logoutUser is exported" },
  ];

  for (const { needle, label } of checks) {
    authSrc.includes(needle)
      ? pass(label)
      : fail(label, `'${needle}' not found in auth.ts`);
  }
}

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════
console.log(`\n${C.bold}${C.cyan}==============================================`);
console.log(`     PROCODE APP - FULL TEST SUITE`);
console.log(`==============================================${C.reset}`);
console.log(`${C.dim}  Running at: ${new Date().toLocaleString()}${C.reset}`);

await testFirebaseConfig();
await testFirebaseConnection();
await testGroqApi();
testXpLogic();
testGameScoreStructure();
testUsernameValidation();
testAssetIntegrity();
testAppConfig();
testGameRouteFiles();
testGoogleSignInConfig();
testAuthService();

// Summary
console.log(`\n${C.bold}${C.cyan}================  TEST SUMMARY  ================${C.reset}`);
console.log(`  ${C.green}${C.bold}PASSED  : ${totalPass}${C.reset}`);
console.log(`  ${C.red}${C.bold}FAILED  : ${totalFail}${C.reset}`);
console.log(`  ${C.yellow}${C.bold}WARNINGS: ${totalWarn}${C.reset}`);

if (totalFail === 0) {
  console.log(`\n${C.green}${C.bold}  All tests passed! Your app looks healthy.${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${C.red}${C.bold}  ${totalFail} test(s) failed. See details above.${C.reset}\n`);
  process.exit(1);
}
