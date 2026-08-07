import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { getGameData, saveGameData, addPlayerXp, addCoins, unlockAchievement, unlockWeapon } from "../../services/gameService";

export default function AnomoliesScreen() {
  const webViewRef = useRef<WebView>(null);
  const [saveDataStr, setSaveDataStr] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data before rendering webview to avoid race conditions
    // and pass it safely via URL query param to bypass CORS on Web.
    getGameData("anomolies").then(data => {
      setSaveDataStr(encodeURIComponent(JSON.stringify(data || {})));
      console.log("[Anomolies] Pre-fetched save data for URL");
    }).catch(e => {
      setSaveDataStr("%7B%7D"); // empty object
    });
  }, []);

  const handleGameMessage = async (msg: any) => {
    try {
      if (!msg || !msg.type) return;
      console.log("[Anomolies] Received message:", msg.type);

      switch (msg.type) {
        case "SAVE_GAME":
          await saveGameData(msg.game || "anomolies", msg.data);
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
    // On Web, `react-native-webview` might drop cross-origin iframe messages. 
    // We listen to the global window object as a fallback.
    if (Platform.OS === "web") {
      const listener = (event: MessageEvent) => {
        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          // Filter to only messages from our game
          if (data && data.type) {
            handleGameMessage(data);
          }
        } catch (e) {
          // ignore parsing errors from other extensions/scripts
        }
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

  if (saveDataStr === null) {
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
        source={{
          uri: `https://ghostly-guest--musicreporterin.replit.app/?saveData=${saveDataStr}`,
        }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        style={{ flex: 1 }}
        onMessage={onWebViewMessage}
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