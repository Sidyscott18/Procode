import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Asset } from "expo-asset";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { getGameData, saveGameData, addPlayerXp, addCoins, unlockAchievement, unlockWeapon } from "../../services/gameService";

export default function PyroScreen() {
  const [html, setHtml] = useState("");
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const asset = Asset.fromModule(
          require("../../assets/games/pyro.html")
        );

        await asset.downloadAsync();

        const response = await fetch(asset.localUri || asset.uri);

        const text = await response.text();

        setHtml(text);
      } catch (err) {
        console.error(err);
      }
    };

    loadGame();
  }, []);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case "REQUEST_GAME_DATA": {
          const gameId = msg.game || "pyro";
          const data = await getGameData(gameId);
          const response = {
            type: "LOAD_GAME_DATA",
            game: gameId,
            data: data || {}
          };
          webViewRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(JSON.stringify(response))}, '*'); true;`);
          break;
        }
        case "SAVE_GAME":
          await saveGameData(msg.game || "pyro", msg.data);
          break;
        case "ADD_PLAYER_XP":
          await addPlayerXp(msg.amount);
          break;
        case "ADD_COINS":
          await addCoins(msg.amount);
          break;
        case "UNLOCK_ACHIEVEMENT":
          await unlockAchievement(msg.game || "pyro", msg.achievementId);
          break;
        case "UNLOCK_WEAPON":
          await unlockWeapon(msg.game || "pyro", msg.weapon);
          break;
      }
    } catch (e) {
      console.log("Error handling webview message", e);
    }
  };

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4cc9f0" />
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
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});