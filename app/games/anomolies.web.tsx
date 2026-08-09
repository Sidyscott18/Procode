import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { getGameData, saveGameData, addPlayerXp, addCoins, unlockAchievement, unlockWeapon } from "../../services/gameService";

const RN_SHIM = `<script>
window.ReactNativeWebView={postMessage:function(d){window.parent.postMessage(d,'*');}};
</script>`;

export default function AnomoliesScreen() {
  const [html, setHtml] = useState("");
  const iframeRef = useRef<any>(null);
  const cachedSave = useRef<object | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const data = await getGameData("anomolies");
          if (!data) {
            await saveGameData("anomolies", { totalPlayTime: 0 });
            console.log("[Anomolies Web] Created new game document in DB");
            cachedSave.current = { totalPlayTime: 0 };
          } else {
            cachedSave.current = data;
          }
          console.log("[Anomolies Web] Pre-fetched save data");
        } catch (e) {
          console.log("[Anomolies Web] Pre-fetch error:", e);
          cachedSave.current = {};
        }
      } else {
        cachedSave.current = {};
      }
    });

    const loadGameHtml = async () => {
      try {
        const asset = Asset.fromModule(require("../../assets/games/anomolies.html"));
        await asset.downloadAsync();
        const response = await fetch(asset.localUri || asset.uri);
        const text = await response.text();
        setHtml(text.replace("<head>", "<head>" + RN_SHIM));
      } catch (err) {
        console.error("[Anomolies Web] Failed to load game HTML:", err);
      }
    };

    loadGameHtml();
    return unsubscribe;
  }, []);

  const sendSaveToGame = (data: object) => {
    try {
      const msg = JSON.stringify({ type: "LOAD_GAME", data });
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    } catch {}
  };

  const loadAndSendSaveData = async () => {
    if (cachedSave.current !== null) {
      console.log("[Anomolies Web] Sending pre-fetched save data");
      sendSaveToGame(cachedSave.current);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      sendSaveToGame({});
      return;
    }
    
    try {
      const data = await getGameData("anomolies");
      if (data) {
        cachedSave.current = data;
        sendSaveToGame(data);
      } else {
        cachedSave.current = {};
        sendSaveToGame({});
      }
    } catch (e) {
      console.log("[Anomolies Web] Error loading save:", e);
      sendSaveToGame({});
    }
  };

  const handleGameMessage = async (msg: any) => {
    try {
      if (!msg || !msg.type) return;
      console.log("[Anomolies Web] Received message:", msg.type);

      switch (msg.type) {
        case "REQUEST_SAVE":
        case "REQUEST_GAME_DATA":
          await loadAndSendSaveData();
          break;
        case "SAVE_GAME":
          await saveGameData(msg.game || "anomolies", msg.data);
          cachedSave.current = { ...(cachedSave.current || {}), ...msg.data };
          break;
        case "ADD_PLAYER_XP":
          await addPlayerXp(msg.amount || 0);
          break;
        case "ADD_COINS":
          await addCoins(msg.amount || 0);
          break;
        case "UNLOCK_ACHIEVEMENT":
          await unlockAchievement(msg.game || "anomolies", msg.achievementId);
          break;
        case "UNLOCK_WEAPON":
          await unlockWeapon(msg.game || "anomolies", msg.weapon);
          break;
      }
    } catch (e) {
      console.log("[Anomolies Web] Error in handleGameMessage", e);
    }
  };

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data && data.type) {
          handleGameMessage(data);
        }
      } catch (e) { }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  if (!html) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* @ts-ignore */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        allow="fullscreen"
        onLoad={() => {
          setTimeout(() => loadAndSendSaveData(), 300);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
