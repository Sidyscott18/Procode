/**
 * anomolies.web.tsx — web version of Anomalies Hunt.
 * Loads the Replit-hosted game in an iframe instead of react-native-webview.
 * anomolies.tsx (native) is unchanged.
 */
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

const GAME_URL = "https://ghostly-guest--musicreporterin.replit.app/";

export default function AnomoliesScreen() {
  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (!event.data) return;
      let msg: any;
      try { msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      if (msg?.type === "EXIT_GAME") router.replace("/home");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <View style={styles.container}>
      {/* @ts-ignore */}
      <iframe
        src={GAME_URL}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="fullscreen"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
});
