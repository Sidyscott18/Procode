/**
 * pyro.web.tsx — loaded by Expo Router on web only.
 * pyro.tsx    — loaded on Android/iOS (unchanged).
 *
 * Uses an <iframe srcDoc> + window.postMessage instead of react-native-webview,
 * which does not support the web platform.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { router } from "expo-router";

// Injected into the game HTML so window.ReactNativeWebView.postMessage works
const RN_SHIM = `<script>
window.ReactNativeWebView={postMessage:function(d){window.parent.postMessage(d,'*');}};
</script>`;

export default function PyroScreen() {
  const [html, setHtml] = useState("");
  const iframeRef = useRef<any>(null);

  // ── Load the game HTML and inject the bridge shim ──────────────
  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(
          require("../../assets/games/pyro.html")
        );
        await asset.downloadAsync();
        const res = await fetch(asset.localUri || asset.uri);
        const text = await res.text();
        // Inject shim right after <head> so it runs before any game script
        setHtml(text.replace("<head>", "<head>" + RN_SHIM));
      } catch (err) {
        console.error("[Pyro Web] Failed to load game HTML:", err);
      }
    })();
  }, []);

  // ── Send save data → iframe ────────────────────────────────────
  const sendSaveToGame = (data: object) => {
    try {
      const msg = JSON.stringify({ type: "LOAD_GAME", data });
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    } catch {}
  };

  const loadAndSend = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { sendSaveToGame({}); return; }
    try {
      const snap = await getDoc(doc(db, "users", uid, "games", "pyro"));
      sendSaveToGame(snap.exists() ? snap.data() : {});
    } catch {
      sendSaveToGame({});
    }
  };

  // ── Receive messages ← iframe (game → Firestore) ──────────────
  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      let msg: any;
      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch { return; }
      if (!msg?.type) return;

      const userRef = doc(db, "users", uid);
      const gameRef = doc(db, "users", uid, "games", "pyro");

      switch (msg.type) {

        case "REQUEST_SAVE":
        case "REQUEST_GAME_DATA":
          await loadAndSend();
          break;

        case "SAVE_GAME": {
          const d = msg.data || {};
          const achievementsArr = Object.keys(d.achievements || {}).filter(
            (k) => (d.achievements as any)[k]
          );
          const unlockedWeapons = Array.isArray(d.unlockedWeapons)
            ? d.unlockedWeapons
            : ["standard"];
          const clean = {
            playerLevel: d.playerLevel ?? 1,
            xp: d.xp ?? 0,
            coins: d.coins ?? 0,
            lifetimeCoins: d.lifetimeCoins ?? 0,
            highScore: d.highScore ?? 0,
            highestWave: d.highestWave ?? 0,
            totalEnemiesDestroyed: d.totalEnemiesDestroyed ?? 0,
            totalShotsFired: d.totalShotsFired ?? 0,
            totalHits: d.totalHits ?? 0,
            accuracy: d.accuracy ?? 0,
            totalPlayTimeSec: d.totalPlayTimeSec ?? 0,
            achievements: achievementsArr,
            unlockedWeapons,
            equippedWeapon: d.equippedWeapon ?? "standard",
            resume: d.resume ?? null,
            lastPlayed: new Date().toISOString(),
          };
          await setDoc(gameRef, clean, { merge: true });
          await syncGlobalXP(uid, clean.playerLevel, clean.xp, clean.coins);
          break;
        }

        case "ADD_XP":
        case "ADD_PLAYER_XP": {
          const amount = msg.data?.amount ?? msg.amount ?? 0;
          const newXp = msg.data?.xp;
          const newLevel = msg.data?.playerLevel;
          if (newXp !== undefined && newLevel !== undefined) {
            await setDoc(gameRef, { xp: newXp, playerLevel: newLevel }, { merge: true });
            await syncGlobalXP(uid, newLevel, newXp, undefined);
          } else if (amount > 0) {
            await addXPFallback(uid, amount);
          }
          break;
        }

        case "ADD_COINS": {
          const amount = msg.amount ?? msg.data?.amount ?? 0;
          if (amount > 0) {
            const uSnap = await getDoc(userRef);
            await setDoc(userRef, { coins: (uSnap.data()?.coins ?? 0) + amount }, { merge: true });
            const gSnap = await getDoc(gameRef);
            await setDoc(gameRef, {
              coins: (gSnap.data()?.coins ?? 0) + amount,
              lifetimeCoins: (gSnap.data()?.lifetimeCoins ?? 0) + amount,
            }, { merge: true });
          }
          break;
        }

        case "UNLOCK_ACHIEVEMENT": {
          const id = msg.data?.id ?? msg.achievementId;
          if (id) {
            const snap = await getDoc(gameRef);
            const existing: string[] = snap.exists() ? snap.data().achievements ?? [] : [];
            if (!existing.includes(id)) {
              await setDoc(gameRef, { achievements: [...existing, id] }, { merge: true });
            }
            if ((msg.data?.xp ?? 0) > 0) await addXPFallback(uid, msg.data.xp);
          }
          break;
        }

        case "GAME_OVER": {
          const d = msg.data || {};
          if (d.highScore !== undefined || d.highestWave !== undefined) {
            const snap = await getDoc(gameRef);
            const cur = snap.exists() ? snap.data() : {};
            await setDoc(gameRef, {
              highScore: Math.max(cur.highScore ?? 0, d.highScore ?? 0),
              highestWave: Math.max(cur.highestWave ?? 0, d.highestWave ?? 0),
            }, { merge: true });
          }
          break;
        }

        case "EXIT_GAME":
          router.replace("/home");
          break;

        case "DAILY_MISSION_COMPLETE":
          break; // XP handled by ADD_XP from game
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* @ts-ignore — iframe is a valid DOM element on web */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        onLoad={() => setTimeout(loadAndSend, 300)}
      />
    </View>
  );
}

// ── Helpers (mirrors pyro.tsx, web-safe) ──────────────────────
async function syncGlobalXP(
  uid: string,
  gameLevel: number,
  gameXp: number,
  coins?: number
) {
  try {
    let totalXp = gameXp;
    for (let i = 1; i < gameLevel; i++) totalXp += 100 + (i - 1) * 60;
    let globalLevel = 0,
      remaining = totalXp;
    while (remaining >= (globalLevel + 1) * 100) {
      remaining -= (globalLevel + 1) * 100;
      globalLevel++;
    }
    const update: any = { xp: totalXp, level: globalLevel };
    if (coins !== undefined) update.coins = coins;
    await setDoc(doc(db, "users", uid), update, { merge: true });
  } catch {}
}

async function addXPFallback(uid: string, amount: number) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const newTotal = (snap.data()?.xp ?? 0) + amount;
    let globalLevel = 0,
      remaining = newTotal;
    while (remaining >= (globalLevel + 1) * 100) {
      remaining -= (globalLevel + 1) * 100;
      globalLevel++;
    }
    await setDoc(doc(db, "users", uid), { xp: newTotal, level: globalLevel }, { merge: true });
  } catch {}
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050811" },
  loading: {
    flex: 1,
    backgroundColor: "#050811",
    justifyContent: "center",
    alignItems: "center",
  },
});
