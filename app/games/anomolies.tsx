import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Asset } from "expo-asset";
import { auth } from "../../services/firebase";
import { getGameData, saveGameData, addPlayerXp, addCoins, unlockAchievement, unlockWeapon } from "../../services/gameService";

export default function AnomoliesScreen() {
  const [html, setHtml] = useState("");
  const webViewRef = useRef<WebView>(null);
  const cachedSave = useRef<object | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const data = await getGameData("anomolies");
          if (!data) {
            await saveGameData("anomolies", { totalPlayTime: 0 });
            console.log("[Anomolies] Created new game document in DB");
            cachedSave.current = { totalPlayTime: 0 };
          } else {
            cachedSave.current = data;
          }
          console.log("[Anomolies] Pre-fetched save data");
        } catch (e) {
          console.log("[Anomolies] Pre-fetch error:", e);
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
        setHtml(text);
      } catch (err) {
        console.error("[Anomolies] Failed to load game HTML:", err);
      }
    };

    loadGameHtml();
    return unsubscribe;
  }, []);

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

  const loadAndSendSaveData = async () => {
    if (cachedSave.current !== null) {
      console.log("[Anomolies] Sending pre-fetched save data");
      sendSaveToWebView(cachedSave.current);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      sendSaveToWebView({});
      return;
    }
    
    try {
      const data = await getGameData("anomolies");
      if (data) {
        cachedSave.current = data;
        sendSaveToWebView(data);
      } else {
        cachedSave.current = {};
        sendSaveToWebView({});
      }
    } catch (e) {
      console.log("[Anomolies] Error loading save:", e);
      sendSaveToWebView({});
    }
  };

  const handleGameMessage = async (msg: any) => {
    try {
      if (!msg || !msg.type) return;
      console.log("[Anomolies] Received message:", msg.type);

      switch (msg.type) {
        case "REQUEST_SAVE":
        case "REQUEST_GAME_DATA":
          await loadAndSendSaveData();
          break;
        case "SAVE_GAME":
          await saveGameData(msg.game || "anomolies", msg.data);
          // Update cached save
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
      console.log("[Anomolies] Error in handleGameMessage", e);
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") {
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
    }
  }, []);

  const onWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      handleGameMessage(msg);
    } catch (e) {
      console.log("[Anomolies] Bad message from WebView", e);
    }
  };

  if (!html) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        style={{ flex: 1 }}
        onMessage={onWebViewMessage}
        onLoadEnd={() => {
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