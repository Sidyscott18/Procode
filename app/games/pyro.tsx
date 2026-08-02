import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Asset } from "expo-asset";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";

export default function PyroScreen() {
  const [html, setHtml] = useState("");
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const asset = Asset.fromModule(require("../../assets/games/pyro.html"));
        await asset.downloadAsync();
        const response = await fetch(asset.localUri || asset.uri);
        const text = await response.text();
        setHtml(text);
      } catch (err) {
        console.error("[Pyro] Failed to load game HTML:", err);
      }
    };
    loadGame();
  }, []);

  // ── Send save data to WebView ──────────────────────────────────
  const sendSaveToWebView = (data: object) => {
    const msg = JSON.stringify({ type: "LOAD_GAME", data });
    webViewRef.current?.injectJavaScript(
      `(function(){
        var e = new MessageEvent('message', { data: ${JSON.stringify(msg)} });
        window.dispatchEvent(e);
        document.dispatchEvent(e);
      })(); true;`
    );
  };

  // ── Load save data from Firestore and send to WebView ─────────
  const loadAndSendSaveData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      sendSaveToWebView({});
      return;
    }
    try {
      const gameRef = doc(db, "users", uid, "games", "pyro");
      const snap = await getDoc(gameRef);
      if (snap.exists()) {
        console.log("[Pyro] Loaded save data:", JSON.stringify(snap.data()).substring(0, 100));
        sendSaveToWebView(snap.data());
      } else {
        console.log("[Pyro] No save data, starting fresh");
        sendSaveToWebView({});
      }
    } catch (e) {
      console.log("[Pyro] Error loading save:", e);
      sendSaveToWebView({});
    }
  };

  // ── Handle message from WebView ────────────────────────────────
  const handleMessage = async (event: WebViewMessageEvent) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      console.log("[Pyro] Bad message:", event.nativeEvent.data?.substring(0, 100));
      return;
    }

    const userRef = doc(db, "users", uid);
    const gameRef = doc(db, "users", uid, "games", "pyro");

    console.log("[Pyro] MSG:", msg.type);

    switch (msg.type) {

      // Game requests its save data on boot
      case "REQUEST_SAVE":
      case "REQUEST_GAME_DATA": {
        await loadAndSendSaveData();
        break;
      }

      // Full save — game sends entire SAVE object
      case "SAVE_GAME": {
        const data = msg.data || {};
        // achievements in game is an object {id: true}, convert to array for Firestore
        const achievementsObj = data.achievements || {};
        const achievementsArr = Object.keys(achievementsObj).filter(k => achievementsObj[k]);
        // unlockedWeapons is already an array
        const unlockedWeapons = Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons : ["standard"];

        const cleanData = {
          playerLevel: data.playerLevel ?? 1,
          xp: data.xp ?? 0,
          coins: data.coins ?? 0,
          lifetimeCoins: data.lifetimeCoins ?? 0,
          highScore: data.highScore ?? 0,
          highestWave: data.highestWave ?? 0,
          totalEnemiesDestroyed: data.totalEnemiesDestroyed ?? 0,
          totalShotsFired: data.totalShotsFired ?? 0,
          totalHits: data.totalHits ?? 0,
          accuracy: data.accuracy ?? 0,
          totalPlayTimeSec: data.totalPlayTimeSec ?? 0,
          achievements: achievementsArr,
          unlockedWeapons,
          equippedWeapon: data.equippedWeapon ?? "standard",
          resume: data.resume ?? null,
          lastPlayed: new Date().toISOString(),
        };

        console.log("[Pyro] SAVE_GAME level:", cleanData.playerLevel, "xp:", cleanData.xp);
        await setDoc(gameRef, cleanData, { merge: true });

        // Also sync the global user XP/level from game data
        await syncGlobalXP(uid, cleanData.playerLevel, cleanData.xp, cleanData.coins);
        break;
      }

      // XP update — game sends individual XP increments
      case "ADD_XP":
      case "ADD_PLAYER_XP": {
        const amount = msg.data?.amount ?? msg.amount ?? 0;
        const newXp = msg.data?.xp;
        const newPlayerLevel = msg.data?.playerLevel;

        console.log("[Pyro] ADD_XP amount:", amount, "newXp:", newXp, "newLevel:", newPlayerLevel);

        if (newXp !== undefined && newPlayerLevel !== undefined) {
          // Game tells us exact new values — use them directly
          await setDoc(gameRef, { xp: newXp, playerLevel: newPlayerLevel }, { merge: true });
          await syncGlobalXP(uid, newPlayerLevel, newXp, undefined);
        } else if (amount > 0) {
          // Fallback: read current and add
          await addXPFallback(uid, amount);
        }
        break;
      }

      // Coins
      case "ADD_COINS": {
        const amount = msg.amount ?? msg.data?.amount ?? 0;
        if (amount > 0) {
          const snap = await getDoc(userRef);
          const current = snap.exists() ? (snap.data().coins ?? 0) : 0;
          await setDoc(userRef, { coins: current + amount }, { merge: true });
          const gSnap = await getDoc(gameRef);
          const gCoins = gSnap.exists() ? (gSnap.data().coins ?? 0) : 0;
          await setDoc(gameRef, { coins: gCoins + amount, lifetimeCoins: (gSnap.data()?.lifetimeCoins ?? 0) + amount }, { merge: true });
        }
        break;
      }

      // Achievement unlocked
      case "UNLOCK_ACHIEVEMENT": {
        const achievementId = msg.data?.id ?? msg.achievementId;
        if (achievementId) {
          const snap = await getDoc(gameRef);
          const existing: string[] = snap.exists() ? (snap.data().achievements ?? []) : [];
          if (!existing.includes(achievementId)) {
            await setDoc(gameRef, { achievements: [...existing, achievementId] }, { merge: true });
          }
          // Grant achievement XP if present
          const xpReward = msg.data?.xp ?? 0;
          if (xpReward > 0) {
            await addXPFallback(uid, xpReward);
          }
        }
        break;
      }

      // Game over summary
      case "GAME_OVER": {
        const data = msg.data || {};
        console.log("[Pyro] GAME_OVER — score:", data.summary?.score, "wave:", data.highestWave);
        // Full save will follow from SAVE_GAME, but update highScore/highestWave now
        if (data.highScore !== undefined || data.highestWave !== undefined) {
          const snap = await getDoc(gameRef);
          const cur = snap.exists() ? snap.data() : {};
          await setDoc(gameRef, {
            highScore: Math.max(cur.highScore ?? 0, data.highScore ?? 0),
            highestWave: Math.max(cur.highestWave ?? 0, data.highestWave ?? 0),
          }, { merge: true });
        }
        break;
      }

      case "DAILY_MISSION_COMPLETE": {
        console.log("[Pyro] Daily mission complete:", msg.data?.id);
        // XP already handled by ADD_XP from the game
        break;
      }
    }
  };

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs
      style={{ flex: 1 }}
      onMessage={handleMessage}
      onLoadEnd={() => {
        // Once WebView is loaded, load save data from Firestore
        setTimeout(() => loadAndSendSaveData(), 300);
      }}
    />
  );
}

// ── Sync global user XP/level from game's playerLevel ────────────
async function syncGlobalXP(uid: string, gameLevel: number, gameXp: number, coins?: number) {
  try {
    const userRef = doc(db, "users", uid);

    // Convert game-internal xp/level to a cumulative total XP for the global profile
    // Game formula: xpNeededFor(level) = 100 + (level-1)*60
    // We reconstruct total XP: sum of all previous levels + current xp
    let totalXp = gameXp;
    for (let i = 1; i < gameLevel; i++) {
      totalXp += 100 + (i - 1) * 60;
    }

    // Map to global level using same formula used in HomeScreen
    let globalLevel = 0;
    let remaining = totalXp;
    while (remaining >= (globalLevel + 1) * 100) {
      remaining -= (globalLevel + 1) * 100;
      globalLevel++;
    }

    const update: any = { xp: totalXp, level: globalLevel };
    if (coins !== undefined) update.coins = coins;

    console.log("[Pyro] Syncing global: totalXp=", totalXp, "globalLevel=", globalLevel);
    await setDoc(userRef, update, { merge: true });
  } catch (e) {
    console.log("[Pyro] syncGlobalXP error:", e);
  }
}

// ── Fallback: add XP incrementally ───────────────────────────────
async function addXPFallback(uid: string, amount: number) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const current = snap.exists() ? (snap.data().xp ?? 0) : 0;
    const newTotal = current + amount;

    let globalLevel = 0;
    let remaining = newTotal;
    while (remaining >= (globalLevel + 1) * 100) {
      remaining -= (globalLevel + 1) * 100;
      globalLevel++;
    }

    await setDoc(userRef, { xp: newTotal, level: globalLevel }, { merge: true });
  } catch (e) {
    console.log("[Pyro] addXPFallback error:", e);
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#050811",
    justifyContent: "center",
    alignItems: "center",
  },
});