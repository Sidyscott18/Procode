import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { getGameData, saveGameData, addPlayerXp, addCoins, unlockAchievement, unlockWeapon } from "../../services/gameService";

export default function AnomoliesScreen() {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case "REQUEST_GAME_DATA": {
          const gameId = msg.game || "anomolies";
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
          await saveGameData(msg.game || "anomolies", msg.data);
          break;
        case "ADD_PLAYER_XP":
          await addPlayerXp(msg.amount);
          break;
        case "ADD_COINS":
          await addCoins(msg.amount);
          break;
        case "UNLOCK_ACHIEVEMENT":
          await unlockAchievement(msg.game || "anomolies", msg.achievementId);
          break;
        case "UNLOCK_WEAPON":
          await unlockWeapon(msg.game || "anomolies", msg.weapon);
          break;
      }
    } catch (e) {
      console.log("Error handling webview message", e);
    }
  };
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{
          uri: "https://ghostly-guest--musicreporterin.replit.app/",
        }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        style={{ flex: 1 }}
        onMessage={handleMessage}
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