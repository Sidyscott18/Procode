import { useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { getGameData, saveGameData, addPlayerXp, addCoins, unlockAchievement, unlockWeapon } from "../../services/gameService";

export default function SOSChef() {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case "REQUEST_GAME_DATA": {
          const gameId = msg.game || "soschef";
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
          await saveGameData(msg.game || "soschef", msg.data);
          break;
        case "ADD_PLAYER_XP":
          await addPlayerXp(msg.amount);
          break;
        case "ADD_COINS":
          await addCoins(msg.amount);
          break;
        case "UNLOCK_ACHIEVEMENT":
          await unlockAchievement(msg.game || "soschef", msg.achievementId);
          break;
        case "UNLOCK_WEAPON":
          await unlockWeapon(msg.game || "soschef", msg.weapon);
          break;
      }
    } catch (e) {
      console.log("Error handling webview message", e);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{
          uri: "https://ethereal-realm--createmusicb.replit.app/",
        }}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}