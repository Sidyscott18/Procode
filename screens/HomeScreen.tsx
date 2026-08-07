import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  ImageStyle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import AuthBackground from "../components/AuthBackground";
import { auth, db } from "../services/firebase";
import { GameData } from "../services/gameService";

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(RAW_SCREEN_WIDTH, 480) : RAW_SCREEN_WIDTH;

// ── Types ─────────────────────────────────────────────────────
interface Game {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  playable: boolean;
  image: ImageSourcePropType | null;
  genre?: string;
}

interface PlaceholderThumbProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

interface GameSheetProps {
  game: Game | null;
  visible: boolean;
  onClose: () => void;
  onPlay: (game: Game) => void;
  onAction: (action: "recap" | "ai") => void;
}

// ── Master list of ALL games (used for last-played lookup) ─────
const ALL_GAMES: Game[] = [
  {
    id: "pyro",
    title: "PYRO - Data Defence",
    subtitle: "Python Data Types",
    genre: "TOWER DEFENCE",
    description: "Defend your data fortress against waves of type errors and corrupted variables. Learn Python data types — integers, strings, lists, and dicts — by deploying the right defences at the right time.",
    playable: true,
    image: require("../assets/games/pyro.png"),
  },
  {
    id: "anomolies",
    title: "Anomalies Hunt",
    subtitle: "Debugging",
    genre: "SURVIVAL",
    description: "Strange entities have infiltrated the city. Use Python conditional logic to build security protocols and identify anomalies before they reach your stand. Survive as many nights as possible.",
    playable: true,
    image: require("../assets/games/anomolies.png"),
  },
];

const recommendedGames: Game[] = [
  {
    id: "pyro",
    title: "PYRO - Data Defence",
    subtitle: "Python Data Types",
    genre: "TOWER DEFENCE",
    description: "Defend your data fortress against waves of type errors and corrupted variables. Learn Python data types — integers, strings, lists, and dicts — by deploying the right defences at the right time.",
    playable: true,
    image: require("../assets/games/pyro.png"),
  },
  {
    id: "anomolies",
    title: "Anomalies Hunt",
    subtitle: "Debugging",
    genre: "SURVIVAL",
    description: "Strange entities have infiltrated the city. Use Python conditional logic to build security protocols and identify anomalies before they reach your stand. Survive as many nights as possible.",
    playable: true,
    image: require("../assets/games/anomolies.png"),
  },
];


const genreColor: Record<string, string> = {
  "TOWER DEFENCE": "#4F6EF7",
  SURVIVAL: "#F7784F",
  RUNNER: "#4FF79E",
  PUZZLE: "#C84FF7",
  ARCADE: "#F7D44F",
  "SPEED RUN": "#4FF7F0",
  RPG: "#F74F8E",
};

// ── Shared UI ─────────────────────────────────────────────────
function PlaceholderThumb({ title, style }: PlaceholderThumbProps) {
  return (
    <View style={[style, { backgroundColor: "#0D1730", alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontSize: 30, marginBottom: 6 }}>🎮</Text>
      <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: 1.5, fontWeight: "700" }}>COMING SOON</Text>
    </View>
  );
}

function PressCard({ onPress, style, children }: { onPress: () => void; style?: StyleProp<ViewStyle>; children: React.ReactNode; }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Game Detail Sheet — Roblox-style centered card ────────────
function GameSheet({ game, visible, onClose, onPlay, onAction }: GameSheetProps) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [stats, setStats] = useState<GameData | null>(null);

  useEffect(() => {
    if (visible && game) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 18, mass: 0.7, stiffness: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const uid = auth.currentUser?.uid;
      if (uid) {
        const docRef = doc(db, "users", uid, "games", game.id);
        const unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) setStats(snap.data() as GameData);
          else setStats({ level: 0, xp: 0, coins: 0, highScore: 0, highestWave: 0, completion: 0 });
        });
        return () => unsubscribe();
      }
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.88, damping: 18, mass: 0.7, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setStats(null), 220);
    }
  }, [visible, game]);

  if (!game) return null;
  const accent = genreColor[game.genre ?? ""] ?? "#4F6EF7";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Dimmed backdrop — tap to close */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim, backgroundColor: 'rgba(0,0,0,0.75)' }]}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Centered card */}
      <View style={styles.sheetCenteredWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheetCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <LinearGradient colors={["rgba(11,17,32,0.98)", "rgba(6,10,24,1)"]} style={StyleSheet.absoluteFillObject} />

          {/* Hero image with close button */}
          <View style={styles.sheetImgContainer}>
            {game.image
              ? <Image source={game.image} style={styles.sheetCardThumb as StyleProp<ImageStyle>} resizeMode="cover" />
              : <PlaceholderThumb title={game.title} style={styles.sheetCardThumb} />}
            <LinearGradient
              colors={["transparent", "rgba(6,10,24,0.7)", "rgba(6,10,24,1)"]}
              style={styles.sheetImgGrad}
            />
            {/* Genre badge */}
            {game.genre && (
              <View style={[styles.sheetCardGenreBadge, { backgroundColor: accent + "22", borderColor: accent + "55" }]}>
                <Text style={[styles.sheetGenreText, { color: accent }]}>{game.genre}</Text>
              </View>
            )}
            {/* Close button */}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={onClose}>
              <Text style={styles.sheetCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetCardScroll}
            contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={styles.sheetCardInfo}>
              <Text style={styles.sheetTitle}>{game.title}</Text>
              <Text style={styles.sheetTag}>{game.subtitle}</Text>
              <View style={styles.sheetDivider} />
              <Text style={styles.sheetDescHeading}>About</Text>
              <Text style={styles.sheetDesc}>{game.description}</Text>

              {stats && (
                <View style={styles.liveStatsContainer}>
                  <Text style={styles.sheetDescHeading}>Your Progress</Text>
                  <View style={styles.liveStatsGrid}>
                    <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Level</Text><Text style={[styles.liveStatValue, { color: accent }]}>{stats.level ?? 0}</Text></View>
                    <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>High Score</Text><Text style={styles.liveStatValue}>{stats.highScore ?? 0}</Text></View>
                    <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Coins</Text><Text style={[styles.liveStatValue, { color: "#F7D44F" }]}>{stats.coins ?? 0}</Text></View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.sheetCardFooter}>
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onAction("recap")}>
                <LinearGradient colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]} style={styles.actionBtnGradient}>
                  <Text style={styles.actionBtnIcon}>📘</Text>
                  <Text style={styles.actionBtnText}>Quick Knowledge</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onAction("ai")}>
                <LinearGradient colors={["rgba(79,110,247,0.2)", "rgba(79,110,247,0.05)"]} style={styles.actionBtnGradient}>
                  <Text style={styles.actionBtnIcon}>🤖</Text>
                  <Text style={[styles.actionBtnText, { color: "#E2E8F0" }]}>Ask AI</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {game.playable ? (
              <TouchableOpacity style={styles.playBtnWrapper} onPress={() => onPlay(game)} activeOpacity={0.85}>
                <LinearGradient colors={[accent, accent + "CC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playBtnGradient}>
                  <Text style={styles.playBtnText}>▶  PLAY NOW</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.comingSoonBtn}>
                <Text style={styles.comingSoonText}>🚧  COMING SOON</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}



function QuickRecapModal({ visible, onClose, gameId }: { visible: boolean; onClose: () => void; gameId: string }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  useEffect(() => {
    if (visible) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
    else Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
  }, [visible, slideAnim]);

  const pyroCards = [
    { icon: '📦', title: 'Data Types', desc: 'A data type tells Python what kind of value a variable stores.\nExample: <Text style={{fontFamily: "monospace", color: "#F7D44F"}}>age = 20</Text>' },
    { icon: '🔢', title: 'Integer (int)', desc: 'Stores whole numbers without decimal points.\nExamples: <Text style={{fontFamily: "monospace", color: "#4FF79E"}}>age = 20, marks = 95</Text>' },
    { icon: '🎯', title: 'Float (float)', desc: 'Stores numbers with decimal points.\nExamples: <Text style={{fontFamily: "monospace", color: "#4F6EF7"}}>price = 99.99, height = 5.8</Text>' },
    { icon: '📝', title: 'String (str)', desc: 'Stores text enclosed in single or double quotes.\nExamples: <Text style={{fontFamily: "monospace", color: "#F7D44F"}}>name = "John"</Text>' },
    { icon: '⚖️', title: 'Boolean (bool)', desc: 'Stores only two values: True or False. Used for conditions.\nExamples: <Text style={{fontFamily: "monospace", color: "#C84FF7"}}>isLoggedIn = True</Text>' },
    { icon: '🔄', title: 'Type Casting', desc: 'Converting one data type into another.\n• int → float: <Text style={{fontFamily: "monospace"}}>float(10) → 10.0</Text>\n• float → int: <Text style={{fontFamily: "monospace"}}>int(5.8) → 5</Text>' }
  ];

  const anomolyCards = [
    { icon: '🤔', title: 'If Statement (if)', desc: 'Runs code ONLY if a condition is True.\nExample:\n<Text style={{fontFamily: "monospace", color: "#4FF79E"}}>if health > 0:\n  print("Alive!")</Text>' },
    { icon: '🔀', title: 'Else Statement (else)', desc: 'Provides an alternative path if the condition is False.\nExample:\n<Text style={{fontFamily: "monospace", color: "#F7D44F"}}>if age >= 18:\n  print("Adult")\nelse:\n  print("Minor")</Text>' },
    { icon: '🪜', title: 'Else If (elif)', desc: 'Checks multiple conditions one by one.\nExample:\n<Text style={{fontFamily: "monospace", color: "#4F6EF7"}}>if score > 90:\n  grade = "A"\nelif score > 80:\n  grade = "B"</Text>' },
    { icon: '⚖️', title: 'Equality (==)', desc: 'Checks if two values are exactly equal.\n<Text style={{fontFamily: "monospace", color: "#C84FF7"}}>5 == 5</Text> → True\n<Text style={{fontFamily: "monospace", color: "#C84FF7"}}>"cat" == "dog"</Text> → False' },
    { icon: '❌', title: 'Inequality (!=)', desc: 'Checks if two values are NOT equal.\n<Text style={{fontFamily: "monospace", color: "#4FF79E"}}>5 != 3</Text> → True' },
    { icon: '📏', title: 'Greater/Less (>, <, >=, <=)', desc: 'Compares numerical values.\n<Text style={{fontFamily: "monospace"}}>10 > 5</Text> → True\n<Text style={{fontFamily: "monospace"}}>8 <= 8</Text> → True' }
  ];

  const cards = gameId === 'anomolies' ? anomolyCards : pyroCards;
  const kicker = gameId === 'anomolies' ? "ANOMALIES DATABASE" : "PYRO DATABASE";
  const introText = gameId === 'anomolies' ? "Core conditional concepts for Anomalies:" : "Core Python concepts for Pyro Game:";

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', justifyContent: 'flex-end', zIndex: 100 }]} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[wPanelStyles.panel, { transform: [{ translateX: slideAnim }] }]}>
          <View style={StyleSheet.absoluteFillObject}>
            <LinearGradient colors={["rgba(6,10,24,0.85)", "rgba(2,4,10,0.95)"]} style={StyleSheet.absoluteFillObject} />
            <View style={[wPanelStyles.bgOrb, { top: -50, right: -50, backgroundColor: 'rgba(139,92,246,0.15)' }]} />
            <View style={[wPanelStyles.bgOrb, { bottom: 100, left: -100, backgroundColor: 'rgba(79,110,247,0.1)' }]} />
          </View>

          <View style={wPanelStyles.panelHeader}>
            <View>
              <Text style={wPanelStyles.panelKicker}>{kicker}</Text>
              <Text style={wPanelStyles.panelTitle}>Quick Knowledge</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={wPanelStyles.panelCloseBtn}>
              <Text style={wPanelStyles.panelCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={wPanelStyles.tabDivider} />

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.recapText, { color: "rgba(255,255,255,0.7)", marginBottom: 16, fontSize: 14 }]}>{introText}</Text>

            {cards.map((c, i) => (
              <View key={i} style={styles.recapCard}>
                <View style={styles.recapCardHeader}>
                  <Text style={styles.recapCardIcon}>{c.icon}</Text>
                  <Text style={styles.recapCardTitle}>{c.title}</Text>
                </View>
                <Text style={styles.recapCardDesc}>{c.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.72)' }]}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
      <Animated.View style={[styles.glassSheet, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={["rgba(20, 25, 45, 0.9)", "rgba(10, 15, 30, 0.95)"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📘 Quick Knowledge</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll}>
          <Text style={styles.recapText}>{introText}</Text>

          {cards.map((c, i) => (
            <View key={i} style={styles.recapCard}>
              <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>{c.icon}</Text>
                <Text style={styles.recapCardTitle}>{c.title}</Text>
              </View>
              <Text style={styles.recapCardDesc}>{c.desc}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function AskAiModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(420)).current;
  const isWeb = Platform.OS === 'web';

  const [messages, setMessages] = useState([{ role: "model", text: "Hi! I'm your Procode AI. Ask me anything about Python, PYRO - Data Defence, or Anomalies Hunt! or any programming concepts!" }]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      if (isWeb) {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 220, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      }
    } else {
      if (isWeb) {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 420, duration: 200, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    }
  }, [visible]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: "model", text: "Error: API Key not found. Please set EXPO_PUBLIC_GROQ_API_KEY in your .env file." }]);
        setIsLoading(false);
        return;
      }
      const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are Procode AI, an educational coding assistant. You ONLY answer questions about Python programming and the games PYRO - Data Defence (a tower defence game teaching Python data types) and Anomalies Hunt (a survival game teaching Python conditional logic). Format code examples clearly. Be concise, friendly, and encouraging for learners. If asked about anything unrelated to programming, politely decline." },
            ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || `Error: ${JSON.stringify(data)}`;
      setMessages(prev => [...prev, { role: "model", text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", text: `Network error: ${e}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isWeb) {
    if (!visible) return null;
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }]} pointerEvents={visible ? 'auto' : 'none'}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[wAiStyles.panel, { transform: [{ translateX: slideAnim }] }]}>
          <LinearGradient colors={["#080D1C", "#050811"]} style={StyleSheet.absoluteFillObject} />
          <View style={wAiStyles.header}>
            <View style={wAiStyles.headerLeft}>
              <View style={wAiStyles.avatar}>
                <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                <Text style={{ fontSize: 18 }}>⚡</Text>
              </View>
              <View>
                <Text style={wAiStyles.name}>Procode AI</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <View style={wAiStyles.onlineDot} />
                  <Text style={wAiStyles.onlineTxt}>Online · Llama 3.1</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={wAiStyles.closeBtn}>
              <Text style={wAiStyles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={wAiStyles.divider} />
          <ScrollView ref={scrollViewRef} style={{ flex: 1 }}
            contentContainerStyle={wAiStyles.msgList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}>
            {messages.map((msg, i) => (
              <View key={i} style={msg.role === 'model' ? wAiStyles.msgRowAi : wAiStyles.msgRowUser}>
                {msg.role === 'model' && (
                  <View style={wAiStyles.msgAvatar}>
                    <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                    <Text style={{ fontSize: 11 }}>⚡</Text>
                  </View>
                )}
                <View style={msg.role === 'model' ? wAiStyles.bubbleAi : wAiStyles.bubbleUser}>
                  <Text style={msg.role === 'model' ? wAiStyles.bubbleTxtAi : wAiStyles.bubbleTxtUser}>{msg.text}</Text>
                </View>
              </View>
            ))}
            {isLoading && (
              <View style={wAiStyles.msgRowAi}>
                <View style={wAiStyles.msgAvatar}>
                  <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                  <Text style={{ fontSize: 11 }}>⚡</Text>
                </View>
                <View style={wAiStyles.bubbleAi}>
                  <Text style={[wAiStyles.bubbleTxtAi, { opacity: 0.5 }]}>● ● ●</Text>
                </View>
              </View>
            )}
          </ScrollView>
          <View style={wAiStyles.inputRow}>
            <TextInput
              style={wAiStyles.input}
              placeholder="Ask about Python, data types, Pyro game..."
              placeholderTextColor="rgba(148,163,184,0.45)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              multiline={false}
            />
            <TouchableOpacity style={wAiStyles.sendBtn} onPress={sendMessage} disabled={isLoading}>
              <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
              <Text style={wAiStyles.sendTxt}>❯</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.fullScreenModal, { opacity: fadeAnim }]}>
        <LinearGradient colors={["#050811", "#080D1C", "#050811"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.aiOrb1} />
        <View style={styles.aiOrb2} />
        <View style={styles.aiHeader}>
          <View style={styles.aiHeaderLeft}>
            <View style={styles.aiAvatar}>
              <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.aiAvatarEmoji}>⚡</Text>
            </View>
            <View>
              <Text style={styles.aiName}>Procode AI</Text>
              <View style={styles.aiStatusRow}>
                <View style={styles.aiStatusDot} />
                <Text style={styles.aiStatusText}>Online · Llama 3.1</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.aiCloseBtn}>
            <Text style={styles.aiCloseBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.aiDivider} />
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}>
          {messages.map((msg, index) => (
            <View key={index} style={msg.role === "model" ? styles.aiMsgRow : styles.userMsgRow}>
              {msg.role === "model" && (
                <View style={styles.aiMsgAvatar}>
                  <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                  <Text style={styles.aiMsgAvatarEmoji}>⚡</Text>
                </View>
              )}
              <View style={msg.role === "model" ? styles.chatBubbleAi : styles.chatBubbleUser}>
                <Text style={msg.role === "model" ? styles.chatTextAi : styles.chatTextUser}>{msg.text}</Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={styles.aiMsgRow}>
              <View style={styles.aiMsgAvatar}>
                <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.aiMsgAvatarEmoji}>⚡</Text>
              </View>
              <View style={styles.chatBubbleAi}>
                <Text style={[styles.chatTextAi, { opacity: 0.6 }]}>● ● ●</Text>
              </View>
            </View>
          )}
        </ScrollView>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.chatInputWrapper}>
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask me about Python, games..."
                placeholderTextColor="rgba(148,163,184,0.5)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                multiline={false}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={isLoading}>
                <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.sendBtnText}>❯</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ──
//  WEB-ONLY DESKTOP LAYOUT  (Android/iOS never reaches this)
// ──
function WebHomeScreen({
  displayName, level, xp, xpProgress, xpForCurrentLevel, currentProgressXp,
  searchQuery, setSearchQuery, openGameSheet, aiVisible, setAiVisible,
  recapVisible, setRecapVisible, selectedGame, sheetVisible,
  closeGameSheet, handlePlay, handleAction, lastPlayedGame, recapGameId
}: any) {
  const allGames = [...new Map(ALL_GAMES.map(g => [g.id, g])).values()];
  const filtered = allGames.filter(g =>
    searchQuery === "" ||
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={wStyles.root}>
      {/* ── Modals ABOVE everything ── */}
      <GameSheet game={selectedGame} visible={sheetVisible} onClose={closeGameSheet} onPlay={handlePlay} onAction={handleAction} />
      <QuickRecapModal visible={recapVisible} onClose={() => setRecapVisible(false)} gameId={recapGameId} />
      <AskAiModal visible={aiVisible} onClose={() => setAiVisible(false)} />

      {/* ── Sidebar ── */}
      <View style={wStyles.sidebar}>
        <Image source={require("../assets/images/procode.png")} style={wStyles.sidebarLogo} resizeMode="contain" />

        <View style={wStyles.navSection}>
          <TouchableOpacity style={[wStyles.navItem, wStyles.navItemActive]}>
            <Text style={[wStyles.navIcon, wStyles.navActive]}>🎮</Text>
            <Text style={[wStyles.navLabel, wStyles.navActive]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={wStyles.navItem} onPress={() => router.push("/profile" as any)}>
            <Text style={wStyles.navIcon}>👤</Text>
            <Text style={wStyles.navLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[wStyles.navItem, wStyles.navAiItem]} onPress={() => setAiVisible(true)}>
            <Text style={wStyles.navIcon}>⚡</Text>
            <Text style={[wStyles.navLabel, { color: "#8B5CF6", fontWeight: '700' }]}>Ask AI</Text>
          </TouchableOpacity>
        </View>

        <View style={wStyles.sidebarSpacer} />

        <View style={wStyles.sidebarXP}>
          <Text style={{ color: "rgba(148,163,184,0.8)", fontSize: 11, fontWeight: '600', marginBottom: 6 }}>Level {level} Progress</Text>
          <View style={wStyles.sidebarXpBar}>
            <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={[wStyles.sidebarXpFill, { width: `${Math.max(0, Math.min(1, xpProgress)) * 100}%` }]} />
          </View>
        </View>

        <View style={wStyles.sidebarUser}>
          <View style={wStyles.sidebarAvatar}>
            <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
            <Text style={wStyles.sidebarAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={wStyles.sidebarUserInfo}>
            <Text style={wStyles.sidebarUserName}>{displayName}</Text>
            <Text style={wStyles.sidebarUserLevel}>Level {level}</Text>
          </View>
        </View>
      </View>

      {/* ── Main Content ── */}
      <View style={wStyles.main}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={wStyles.mainScroll} showsVerticalScrollIndicator={false}>

          <View style={wStyles.topBar}>
            <View>
              <Text style={wStyles.topGreetLabel}>WELCOME BACK</Text>
              <Text style={wStyles.topGreetName}>{displayName}</Text>
            </View>
            <View style={wStyles.topRight}>
              <View style={wStyles.searchBox}>
                <Text style={wStyles.searchIcon}>🔍</Text>
                <TextInput
                  placeholder="Search games..."
                  placeholderTextColor="rgba(148,163,184,0.4)"
                  style={wStyles.searchInput}
                  value={searchQuery} onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity onPress={() => router.push("/profile" as any)} style={wStyles.topAvatar}>
                <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={wStyles.topAvatarGrad}>
                  <Text style={wStyles.topAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* XP / Level Progress Card — always visible */}
          <View style={wStyles.xpCard}>
            <LinearGradient colors={["rgba(139,92,246,0.15)", "rgba(79,110,247,0.08)"]} style={StyleSheet.absoluteFillObject} />
            <View style={wStyles.xpCardRow}>
              <View style={wStyles.xpCardLeft}>
                <View style={wStyles.xpBadge}>
                  <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                  <Text style={wStyles.xpBadgeLvl}>LVL</Text>
                  <Text style={wStyles.xpBadgeNum}>{level}</Text>
                </View>
                <View style={wStyles.xpInfo}>
                  <Text style={wStyles.xpTitle}>Level Progress</Text>
                  <Text style={wStyles.xpSub}>{currentProgressXp} / {xpForCurrentLevel} XP</Text>
                </View>
              </View>
              <Text style={wStyles.xpPct}>{Math.round(xpProgress * 100)}%</Text>
            </View>
            <View style={wStyles.xpBarBg}>
              <LinearGradient colors={["#8B5CF6", "#4F6EF7", "#34D399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[wStyles.xpBarFill, { width: `${Math.max(0, Math.min(1, xpProgress)) * 100}%` }]} />
            </View>
          </View>

          {/* Hero Banner — Continue Playing for returning users, Featured for new users */}
          <View style={wStyles.heroBanner}>
            {lastPlayedGame?.image
              ? <Image source={lastPlayedGame.image} style={wStyles.heroBannerImg} resizeMode="cover" />
              : <Image source={require("../assets/games/pyro.png")} style={wStyles.heroBannerImg} resizeMode="cover" />}
            <LinearGradient colors={["transparent", "rgba(5,8,17,0.8)", "rgba(5,8,17,1)"]} style={StyleSheet.absoluteFillObject} />
            <View style={[wStyles.heroBannerBadge, lastPlayedGame
              ? { backgroundColor: "rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.35)" }
              : { backgroundColor: "rgba(79,110,247,0.15)", borderColor: "rgba(79,110,247,0.3)" }
            ]}>
              <Text style={[wStyles.heroBannerBadgeTxt, { color: lastPlayedGame ? "#34D399" : "#4F6EF7" }]}>
                {lastPlayedGame ? "CONTINUE PLAYING" : "FEATURED UPDATE"}
              </Text>
            </View>
            <View style={wStyles.heroBannerInfo}>
              <Text style={wStyles.heroBannerTitle}>{lastPlayedGame?.title ?? "PYRO - Data Defence"}</Text>
              <Text style={wStyles.heroBannerSub}>{lastPlayedGame?.subtitle ?? "Learn Python Data Types in this Tower Defence Game!"}</Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
                <TouchableOpacity style={wStyles.heroBannerPlayBtn} onPress={() => handlePlay(lastPlayedGame ?? ALL_GAMES[0])}>
                  <LinearGradient
                    colors={lastPlayedGame ? ["#34D399", "#059669"] : ["#8B5CF6", "#4F6EF7"]}
                    style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                  <Text style={wStyles.heroBannerPlayTxt}>{lastPlayedGame ? "▶  CONTINUE" : "▶  PLAY NOW"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={wStyles.heroBannerAiBtn} onPress={() => handleAction("recap", lastPlayedGame?.id ?? "pyro")}>
                  <Text style={wStyles.heroBannerAiTxt}>📘 Quick Knowledge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* All Games Grid */}
          <View style={wStyles.sectionHeader}>
            <View style={[wStyles.sectionBar, { backgroundColor: "#F7784F" }]} />
            <Text style={wStyles.sectionTitle}>All Games</Text>
          </View>
          <View style={wStyles.gameGrid}>
            {filtered.map(game => (
              <TouchableOpacity activeOpacity={0.8} key={game.id + game.title} onPress={() => openGameSheet(game)} style={wStyles.gameCard}>
                <View style={wStyles.gameImgWrap}>
                  {game.image
                    ? <Image source={game.image} style={wStyles.gameImg as any} resizeMode="cover" />
                    : <PlaceholderThumb title={game.title} style={wStyles.gameImg} />}
                  <LinearGradient colors={["transparent", "rgba(5,8,17,0.85)"]} style={StyleSheet.absoluteFillObject} />
                  {game.genre && <View style={[wStyles.gameChip, { backgroundColor: (genreColor[game.genre] ?? "#4F6EF7") + "EE" }]}><Text style={wStyles.gameChipTxt}>{game.genre}</Text></View>}
                  {!game.playable && (
                    <View style={wStyles.gameDim}><Text style={wStyles.gameDimTxt}>COMING SOON</Text></View>
                  )}
                  {game.playable && (
                    <View style={wStyles.gamePlayIcon}><Text style={{ color: "#fff", fontSize: 11 }}>▶</Text></View>
                  )}
                </View>
                <Text style={wStyles.gameTitle}>{game.title}</Text>
                <Text style={wStyles.gameSub}>{game.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ── Web styles ───────────────────────────────────────────────
const wStyles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#020617" },

  // Sidebar
  sidebar: { width: 220, paddingTop: 28, paddingHorizontal: 16, paddingBottom: 20, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.05)" },
  sidebarLogo: { width: 150, height: 46, marginBottom: 36 },
  navSection: { gap: 4 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, overflow: 'hidden' },
  navItemActive: { backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12 },
  navAiItem: { marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  navIcon: { fontSize: 17 },
  navLabel: { color: "rgba(148,163,184,0.65)", fontSize: 14, fontWeight: "600" },
  navActive: { color: "#E2E8F0", fontWeight: '800' },
  sidebarSpacer: { flex: 1 },
  // Sidebar XP mini
  sidebarXP: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  sidebarXpBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  sidebarXpFill: { height: '100%' as any, borderRadius: 3 },
  sidebarUser: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  sidebarAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  sidebarAvatarText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  sidebarUserInfo: { flex: 1 },
  sidebarUserName: { color: "#E2E8F0", fontSize: 13, fontWeight: "800" },
  sidebarUserLevel: { color: "rgba(148,163,184,0.55)", fontSize: 11, fontWeight: "500", marginTop: 2 },

  // Main
  main: { flex: 1 },
  mainScroll: { padding: 28, paddingBottom: 80 },

  // Top bar
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  topGreetLabel: { color: "rgba(139,92,246,0.9)", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 2 },
  topGreetName: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 13, paddingHorizontal: 13, height: 42, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", minWidth: 240 },
  searchIcon: { fontSize: 13, marginRight: 7, opacity: 0.5 },
  searchInput: { flex: 1, color: "#E2E8F0", fontSize: 13.5 },
  topAvatar: { overflow: "hidden", borderRadius: 21, borderWidth: 2, borderColor: "rgba(139,92,246,0.6)" },
  topAvatarGrad: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  topAvatarText: { color: "#fff", fontSize: 15, fontWeight: "900" },

  // Featured hero banner
  heroBanner: { width: '100%' as any, height: 380, borderRadius: 24, overflow: 'hidden', marginBottom: 32, position: 'relative' as any, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  heroBannerImg: { width: '100%' as any, height: '100%' as any },
  heroBannerBadge: { position: 'absolute', top: 18, left: 18, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  heroBannerBadgeTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroBannerInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 28 },
  heroBannerTitle: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  heroBannerSub: { color: 'rgba(148,163,184,0.9)', fontSize: 15, marginTop: 6 },
  heroBannerPlayBtn: { height: 46, paddingHorizontal: 28, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  heroBannerPlayTxt: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  heroBannerAiBtn: { height: 46, paddingHorizontal: 20, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroBannerAiTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  sectionBar: { width: 4, height: 20, borderRadius: 2 },
  sectionTitle: { color: "#F8FAFC", fontSize: 17, fontWeight: "900" },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#34D399" },

  // Game grid
  gameGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginBottom: 32 },
  gameCard: { width: 200 },
  gameImgWrap: { width: "100%" as any, height: 130, borderRadius: 16, overflow: "hidden", backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  gameImg: { width: "100%" as any, height: "100%" as any },
  gameChip: { position: "absolute", top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  gameChipTxt: { color: "#fff", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  gameDim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,8,17,0.65)", alignItems: "center", justifyContent: "center" },
  gameDimTxt: { color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  gamePlayIcon: { position: "absolute", bottom: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(139,92,246,0.9)", alignItems: "center", justifyContent: "center" },
  gameTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "800", marginTop: 10 },
  gameSub: { color: "rgba(100,116,139,0.85)", fontSize: 12, marginTop: 3 },

  // Legacy (hero row kept for backwards compat but not used in new layout)
  heroRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 36 },
  heroCard: { width: 420, borderRadius: 24, overflow: "hidden", backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)" },
  heroImg: { width: "100%" as any, height: 240 },
  heroGrad: { position: "absolute", left: 0, right: 0, bottom: 0, height: 220 },
  heroPill: { position: "absolute", top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  heroPillTxt: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  heroSub: { color: "rgba(148,163,184,0.9)", fontSize: 13, marginTop: 4, marginBottom: 14 },
  heroBtn: { height: 40, borderRadius: 12, overflow: "hidden", alignSelf: "flex-start", paddingHorizontal: 20, justifyContent: "center", alignItems: "center" },
  heroBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 1 },

  // XP card (web)
  xpCard: { borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", overflow: "hidden", backgroundColor: "rgba(10,14,30,0.6)" },
  xpCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  xpCardLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  xpBadge: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  xpBadgeLvl: { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  xpBadgeNum: { color: "#fff", fontSize: 24, fontWeight: "900" },
  xpInfo: { gap: 3 },
  xpTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "800" },
  xpSub: { color: "rgba(148,163,184,0.8)", fontSize: 13 },
  xpPct: { color: "#8B5CF6", fontSize: 24, fontWeight: "900" },
  xpBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  xpBarFill: { height: "100%" as any, borderRadius: 4 },
});

// ── Main Screen ───────────────────────────────────────────────
export default function HomeScreen() {
  const [displayName, setDisplayName] = useState("Coder");
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(0);

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [sheetVisible, setSheetVisible] = useState(false);
  const [recapVisible, setRecapVisible] = useState(false);
  const [recapGameId, setRecapGameId] = useState("pyro");
  const [aiVisible, setAiVisible] = useState(false);
  const [hasPyroSave, setHasPyroSave] = useState(false); // kept for legacy compat
  const [lastPlayedGame, setLastPlayedGame] = useState<Game | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    // Scan all game saves and find the most recently played one
    import("firebase/firestore").then(({ getDoc, doc: fDoc }) => {
      const checks = ALL_GAMES.map(game =>
        getDoc(fDoc(db, "users", user.uid, "games", game.id))
          .then(snap => ({
            game,
            lastPlayed: snap.exists() && snap.data()?.lastPlayed ? snap.data()!.lastPlayed as string : null,
          }))
          .catch(() => ({ game, lastPlayed: null }))
      );
      Promise.all(checks).then(results => {
        const played = results.filter(r => r.lastPlayed !== null);
        if (played.length === 0) { setLastPlayedGame(null); setHasPyroSave(false); return; }
        played.sort((a, b) => (b.lastPlayed! > a.lastPlayed! ? 1 : -1));
        const most = played[0];
        setLastPlayedGame(most.game);
        setHasPyroSave(true); // keep legacy flag in sync
      });
    });
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName || "Coder");
        setLevel(data.level ?? 0);
        setXp(data.xp ?? 0);
      } else {
        // Init user to level 0 and 0 xp
        setDoc(userRef, { displayName: user.displayName || "Coder", level: 0, xp: 0, coins: 0 }, { merge: true });
      }
    });

    return () => unsubscribe();
  }, []);

  const openGameSheet = (game: Game) => {
    setSelectedGame(game);
    setSheetVisible(true);
  };

  const closeGameSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSelectedGame(null), 300);
  };

  const handlePlay = (game: Game) => {
    // Close the sheet first, then navigate after animation completes
    setSheetVisible(false);
    setTimeout(() => setSelectedGame(null), 250);
    setTimeout(() => {
      if (game.id === "pyro") { router.push("/games/pyro"); return; }
      if (game.id === "anomolies") { router.push("/games/anomolies"); return; }
      if (game.id === "soschef") { router.push("/games/soschef"); return; }
    }, 260);
  };

  const handleAction = (action: "recap" | "ai", explicitGameId?: string) => {
    // Determine the gameId before nullifying selectedGame
    const targetGameId = explicitGameId || selectedGame?.id || "pyro";

    setSheetVisible(false);
    setTimeout(() => setSelectedGame(null), 250);
    setTimeout(() => {
      if (action === "recap") {
        setRecapGameId(targetGameId);
        setRecapVisible(true);
      }
      if (action === "ai") setAiVisible(true);
    }, 280);
  };

  // XP Calculation - Required for NEXT level
  const getLevelStart = (lvl: number) => {
    let start = 0;
    for (let i = 0; i < lvl; i++) start += (i + 1) * 100;
    return start;
  }
  const currentLevelStart = getLevelStart(level);
  const nextLevelStart = getLevelStart(level + 1);
  const xpForCurrentLevel = nextLevelStart - currentLevelStart;
  const currentProgressXp = Math.max(0, xp - currentLevelStart);
  const xpProgress = Math.max(0, Math.min(1, currentProgressXp / xpForCurrentLevel));

  if (Platform.OS === 'web') {
    return (
      <WebHomeScreen
        displayName={displayName} level={level} xp={xp}
        xpProgress={xpProgress} xpForCurrentLevel={xpForCurrentLevel}
        currentProgressXp={currentProgressXp}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        openGameSheet={openGameSheet} aiVisible={aiVisible}
        setAiVisible={setAiVisible} recapVisible={recapVisible}
        setRecapVisible={setRecapVisible} selectedGame={selectedGame}
        sheetVisible={sheetVisible} closeGameSheet={closeGameSheet}
        handlePlay={handlePlay} handleAction={handleAction}
        lastPlayedGame={lastPlayedGame} recapGameId={recapGameId}
      />
    );
  }

  return (
    <AuthBackground>
      {/* ── Modals ── */}
      <GameSheet game={selectedGame} visible={sheetVisible} onClose={closeGameSheet} onPlay={handlePlay} onAction={handleAction} />
      <QuickRecapModal visible={recapVisible} onClose={() => setRecapVisible(false)} gameId={recapGameId} />
      <AskAiModal visible={aiVisible} onClose={() => setAiVisible(false)} />

      {/* ── Main scroll ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* TOP HEADER BAR */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarLabel}>WELCOME BACK</Text>
            <Text style={styles.topBarName}>{displayName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/profile" as any)} style={styles.avatarBtn}>
            <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.avatarBtnText}>{displayName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* XP / LEVEL PROGRESS CARD */}
        <View style={styles.xpCard}>
          <LinearGradient colors={["rgba(139,92,246,0.15)", "rgba(79,110,247,0.1)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.xpCardRow}>
            <View style={styles.xpCardLeft}>
              <View style={styles.levelBadge}>
                <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.levelBadgeText}>LVL</Text>
                <Text style={styles.levelBadgeNum}>{level}</Text>
              </View>
              <View style={styles.xpInfo}>
                <Text style={styles.xpTitle}>Level Progress</Text>
                <Text style={styles.xpSub}>{currentProgressXp} / {xpForCurrentLevel} XP</Text>
              </View>
            </View>
            <View style={styles.xpPct}>
              <Text style={styles.xpPctText}>{Math.round(xpProgress * 100)}%</Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <LinearGradient colors={["#8B5CF6", "#4F6EF7", "#34D399"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpBarFill, { width: `${(xpProgress || 0) * 100}%` }]} />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput placeholder="Search games..." placeholderTextColor="rgba(148,163,184,0.4)" style={styles.search} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── Continue Playing (dynamic: last played game) ── */}
        {lastPlayedGame && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionTitle}>Continue Playing</Text>
              <View style={styles.sectionLiveDot} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroRow}>
              <PressCard onPress={() => openGameSheet(lastPlayedGame)} style={styles.heroCard}>
                {lastPlayedGame.image ? <Image source={lastPlayedGame.image} style={styles.heroImage as StyleProp<ImageStyle>} resizeMode="cover" /> : <PlaceholderThumb title={lastPlayedGame.title} style={styles.heroImage} />}
                <LinearGradient colors={["transparent", "rgba(5,8,17,0.7)", "rgba(5,8,17,0.98)"]} style={styles.heroGradient} />
                {lastPlayedGame.genre && (
                  <View style={[styles.heroPill, { backgroundColor: (genreColor[lastPlayedGame.genre] ?? "#4F6EF7") + "33", borderColor: genreColor[lastPlayedGame.genre] ?? "#4F6EF7" }]}>
                    <Text style={[styles.heroPillText, { color: genreColor[lastPlayedGame.genre] ?? "#4FF79E" }]}>{lastPlayedGame.genre}</Text>
                  </View>
                )}
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>{lastPlayedGame.title}</Text>
                  <Text style={styles.heroSubtitle}>{lastPlayedGame.subtitle}</Text>
                  <View style={styles.heroPlayBtn}>
                    <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                    <Text style={styles.heroPlayBtnText}>▶  CONTINUE</Text>
                  </View>
                </View>
              </PressCard>
            </ScrollView>
          </>
        )}

        {/* ── Recommended ── */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccentBar, { backgroundColor: "#F7784F" }]} />
          <Text style={styles.sectionTitle}>Recommended For You</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
          {recommendedGames.map((game) => (
            <PressCard key={game.id + game.title} onPress={() => openGameSheet(game)} style={styles.gameCard}>
              <View style={styles.gameImageWrap}>
                {game.image ? <Image source={game.image} style={styles.gameImage as StyleProp<ImageStyle>} resizeMode="cover" /> : <PlaceholderThumb title={game.title} style={styles.gameImage} />}
                <LinearGradient colors={["transparent", "rgba(5,8,17,0.85)"]} style={StyleSheet.absoluteFillObject} />
                {game.genre && <View style={[styles.gameChip, { backgroundColor: (genreColor[game.genre] ?? "#4F6EF7") + "EE" }]}><Text style={styles.gameChipText}>{game.genre}</Text></View>}
                {!game.playable && (
                  <View style={styles.gameDim}>
                    <Text style={styles.gameDimText}>COMING SOON</Text>
                  </View>
                )}
                {game.playable && <View style={styles.gamePlayIcon}><Text style={{ color: "#fff", fontSize: 10 }}>▶</Text></View>}
              </View>
              <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
              <Text style={styles.gameSubtitle} numberOfLines={1}>{game.subtitle}</Text>
            </PressCard>
          ))}
        </ScrollView>

      </ScrollView>

      {/* Floating AI Button */}
      <TouchableOpacity style={styles.floatingAiBtn} onPress={() => setAiVisible(true)}>
        <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} style={styles.floatingAiGradient}>
          <Text style={styles.floatingAiText}>⚡</Text>
        </LinearGradient>
      </TouchableOpacity>
    </AuthBackground>
  );
}


// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { paddingTop: 56, paddingBottom: 130, ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center' as any, width: '100%' } : {}) },

  // Top Bar
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, marginBottom: 18 },
  topBarLabel: { color: "rgba(139,92,246,0.9)", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 2 },
  topBarName: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 2, borderColor: "rgba(139,92,246,0.6)" },
  avatarBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // XP Card
  xpCard: { marginHorizontal: 22, borderRadius: 20, padding: 18, marginBottom: 22, borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", overflow: "hidden", backgroundColor: "rgba(10,14,30,0.6)" },
  xpCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  xpCardLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  levelBadge: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  levelBadgeText: { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  levelBadgeNum: { color: "#fff", fontSize: 22, fontWeight: "900", lineHeight: 26 },
  xpInfo: { gap: 3 },
  xpTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "800" },
  xpSub: { color: "rgba(148,163,184,0.8)", fontSize: 12, fontWeight: "500" },
  xpPct: {},
  xpPctText: { color: "#8B5CF6", fontSize: 22, fontWeight: "900" },
  xpBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 4 },

  // Legacy (kept for refs)
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, marginBottom: 24 },
  greeting: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  subGreeting: { color: "rgba(148,163,184,0.8)", fontSize: 13, marginTop: 3, fontWeight: "500" },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 28, paddingVertical: 8, paddingLeft: 12, paddingRight: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", gap: 8 },
  profileCardLeft: { marginRight: 10, alignItems: "flex-end", zIndex: 2 },
  profileCardLevel: { color: "#fff", fontSize: 13, fontWeight: "800", marginBottom: 5 },
  profileCardProgressBg: { width: 50, height: 5, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" },
  profileCardProgressFill: { height: "100%", borderRadius: 3 },

  // Search
  searchWrap: { marginHorizontal: 22, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  searchIcon: { fontSize: 14, marginRight: 10, opacity: 0.5 },
  search: { flex: 1, color: "#E2E8F0", fontSize: 15, fontWeight: "400" },

  // Sections
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, marginBottom: 14, gap: 10 },
  sectionAccentBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: "#8B5CF6" },
  sectionTitle: { color: "#F8FAFC", fontSize: 17, fontWeight: "900", letterSpacing: -0.2, flex: 1 },
  sectionLiveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#34D399" },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: "#8B5CF6" },

  // Hero Card
  heroRow: { paddingLeft: 22, paddingRight: 8, marginBottom: 30 },
  heroCard: { width: Math.min(SCREEN_WIDTH - 50, 430), borderRadius: 24, overflow: "hidden", marginRight: 16, backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  heroImage: { width: "100%", height: 220 },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  heroPill: { position: "absolute", top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  heroPillText: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingBottom: 18 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  heroSubtitle: { color: "rgba(148,163,184,0.9)", fontSize: 12, fontWeight: "500", marginTop: 3, marginBottom: 14 },
  heroPlayBtn: { height: 40, borderRadius: 12, overflow: "hidden", alignSelf: "flex-start", paddingHorizontal: 20, justifyContent: "center", alignItems: "center" },
  heroPlayBtnText: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 1 },

  // Small Game Card
  cardRow: { paddingLeft: 22, paddingRight: 8, marginBottom: 28 },
  gameCard: { width: 158, marginRight: 14 },
  gameImageWrap: { width: "100%", height: 120, borderRadius: 18, overflow: "hidden", backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  gameImage: { width: "100%", height: "100%" },
  gameTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "800", marginTop: 10, letterSpacing: -0.2 },
  gameSubtitle: { color: "rgba(100,116,139,0.9)", fontSize: 12, fontWeight: "500", marginTop: 3 },
  gameChip: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gameChipText: { color: "#fff", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  gameDim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,8,17,0.65)", alignItems: "center", justifyContent: "center" },
  gameDimText: { color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  gamePlayIcon: { position: "absolute", bottom: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(139,92,246,0.9)", alignItems: "center", justifyContent: "center" },

  // ── Game Sheet — Roblox-style centered card
  sheetCenteredWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: SCREEN_HEIGHT * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 30,
  },
  sheetImgContainer: { position: 'relative', width: '100%' },
  sheetCardThumb: { width: '100%', height: 200 },
  sheetImgGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  sheetCardGenreBadge: { position: 'absolute', bottom: 12, left: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  sheetCloseBtn: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sheetCloseBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  sheetCardScroll: { maxHeight: SCREEN_HEIGHT * 0.32 },
  sheetCardInfo: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  sheetHandle: { display: 'none' as any, width: 0, height: 0 },
  sheetThumb: { width: "100%", height: 210 },
  sheetGenreText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  sheetGenreBadge: { marginHorizontal: 22, marginTop: 20, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  sheetInfo: { paddingHorizontal: 22, paddingTop: 16 },
  sheetTitle: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  sheetTag: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginTop: 5, letterSpacing: 0.3 },
  sheetDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 18 },
  sheetDescHeading: { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 10 },
  sheetDesc: { color: "#94A3B8", fontSize: 13.5, lineHeight: 22, fontWeight: "500" },
  sheetFooter: { paddingHorizontal: 22, paddingVertical: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(5,8,17,0.95)" },
  sheetCardFooter: { paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(6,10,24,1)' },

  // Game Sheet Action Bar
  actionBar: { flexDirection: "row", gap: 12, marginBottom: 14 },
  actionBtn: { flex: 1, height: 46, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionBtnGradient: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnIcon: { fontSize: 15 },
  actionBtnText: { color: "#E2E8F0", fontSize: 13, fontWeight: "800" },
  playBtnWrapper: { borderRadius: 16, height: 54, shadowColor: "#4F6EF7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8, overflow: 'hidden' },
  playBtnGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  playBtnText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  comingSoonBtn: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  comingSoonText: { color: "#64748B", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  // Live Stats Grid
  liveStatsContainer: { marginTop: 28 },
  liveStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  liveStatItem: { width: "31%", backgroundColor: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  liveStatLabel: { color: "#64748B", fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginBottom: 6 },
  liveStatValue: { color: "#E2E8F0", fontSize: 18, fontWeight: "900" },
  lastPlayedText: { color: "#64748B", fontSize: 12, marginTop: 14, fontStyle: "italic", fontWeight: "600" },

  // Glass Sheet (Quick Recap)
  glassSheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: SCREEN_HEIGHT * 0.75, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderBottomWidth: 0, overflow: "hidden", ...(Platform.OS === 'web' ? { maxWidth: 480, marginHorizontal: 'auto' as any } : {}) },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingBottom: 16, paddingTop: 10 },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#94A3B8", fontSize: 16, fontWeight: "800" },
  modalScroll: { paddingHorizontal: 22, paddingBottom: 40 },
  recapText: { color: "#94A3B8", fontSize: 15, lineHeight: 24, marginBottom: 24, fontWeight: "500" },
  recapCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  recapCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  recapCardIcon: { fontSize: 20 },
  recapCardTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  recapCardDesc: { color: "#E2E8F0", fontSize: 14, lineHeight: 22, fontWeight: "500" },

  // Full Screen Modal (Ask AI)
  fullScreenModal: { flex: 1 },
  aiOrb1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(139, 92, 246, 0.08)", top: -80, right: -80 },
  aiOrb2: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(79, 110, 247, 0.06)", bottom: 100, left: -60 },
  aiHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 16 },
  aiHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  aiAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(139, 92, 246, 0.6)", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 },
  aiAvatarText: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  aiAvatarEmoji: { fontSize: 22 },
  aiName: { color: "#F8FAFC", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  aiStatusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  aiStatusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#34D399" },
  aiStatusText: { color: "rgba(148,163,184,0.9)", fontSize: 12, fontWeight: "600" },
  aiCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  aiCloseBtnText: { color: "#94A3B8", fontSize: 14, fontWeight: "700" },
  aiDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 20 },
  chatContainer: { padding: 20, paddingTop: 24, paddingBottom: 20 },
  aiMsgRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 16 },
  userMsgRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  aiMsgAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.4)" },
  aiMsgAvatarText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  aiMsgAvatarEmoji: { fontSize: 14 },
  chatBubbleAi: { backgroundColor: "rgba(30, 41, 70, 0.8)", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderTopLeftRadius: 4, maxWidth: "78%", borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.2)" },
  chatTextAi: { color: "#E2E8F0", fontSize: 14.5, lineHeight: 22, fontWeight: "400" },
  chatBubbleUser: { backgroundColor: "#5B6EF7", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderTopRightRadius: 4, maxWidth: "78%", shadowColor: "#5B6EF7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  chatTextUser: { color: "#FFFFFF", fontSize: 14.5, lineHeight: 22, fontWeight: "500" },
  chatInputWrapper: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 32 : 14 },
  chatInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.95)", borderRadius: 32, borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.35)", paddingLeft: 20, paddingRight: 6, paddingVertical: 6 },
  chatInput: { flex: 1, height: 46, color: "#F8FAFC", fontSize: 15, fontWeight: "400" },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden", elevation: 4, shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", marginLeft: 2 },

  // Floating AI Button
  floatingAiBtn: { position: "absolute", bottom: 24, right: Platform.OS === 'web' ? '50%' as any : 24, ...(Platform.OS === 'web' ? { transform: [{ translateX: 30 }] } : {}), shadowColor: "#C84FF7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 12 },
  floatingAiGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  floatingAiText: { fontSize: 28 },
});

const wPanelStyles = StyleSheet.create({
  panel: { position: "absolute", top: 0, right: 0, bottom: 0, width: 480, borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.05)", elevation: 20, shadowColor: "#000", shadowOffset: { width: -20, height: 0 }, shadowOpacity: 0.8, shadowRadius: 40, backgroundColor: "#04060E" },
  bgOrb: { position: "absolute", width: 300, height: 300, borderRadius: 150, filter: "blur(80px)" as any },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 28, paddingTop: 36, paddingBottom: 16 },
  panelKicker: { color: "rgba(139,92,246,0.9)", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 4 },
  panelTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  panelCloseBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  panelCloseTxt: { color: "#94A3B8", fontSize: 16, fontWeight: "800" },

  tabBar: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: "rgba(139,92,246,0.15)" },
  tabTxt: { color: "rgba(148,163,184,0.6)", fontSize: 14, fontWeight: "700" },
  tabTxtActive: { color: "#fff", fontWeight: "900" },
  tabDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.03)" },

  tabContent: { padding: 24 },

  heroCard: { padding: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 32, overflow: "hidden" },
  heroCardGlow: { position: "absolute", top: -50, left: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(139,92,246,0.15)", filter: "blur(40px)" as any },
  heroCardIcon: { fontSize: 36 },
  heroCardTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 6, letterSpacing: -0.3 },
  heroCardDesc: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20, fontWeight: "500" },

  panelSectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },

  typeGrid: { flexDirection: "column", gap: 12, marginBottom: 36 },
  typeChip: { padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  typeChipIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  typeChipName: { fontSize: 17, fontWeight: "900", marginBottom: 2 },
  typeChipDesc: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 18, fontWeight: "500" },

  rulesContainer: { backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden" },
  ruleRow: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  ruleCode: { color: "#E2E8F0", fontFamily: "monospace", fontSize: 14, fontWeight: "600", flex: 1, backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, textAlign: "center" },
  ruleArrow: { color: "#94A3B8", fontSize: 16, fontWeight: "800", width: 40, textAlign: "center" },

  exprCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  exprCodeWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", padding: 10, borderRadius: 10, marginRight: 16 },
  exprCode: { fontFamily: "monospace", fontSize: 13, fontWeight: "600" },
  exprDesc: { flex: 1, color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "500", lineHeight: 18 },
});

const wAiStyles = StyleSheet.create({
  panel: { position: "absolute", top: 0, right: 0, bottom: 0, width: 420, borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.08)", elevation: 20, shadowColor: "#000", shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  name: { color: "#F8FAFC", fontSize: 18, fontWeight: "800" },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399" },
  onlineTxt: { color: "rgba(148,163,184,0.8)", fontSize: 12, fontWeight: "600" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  closeTxt: { color: "#94A3B8", fontSize: 14, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  chipBar: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  chipTxt: { color: "#E2E8F0", fontSize: 13, fontWeight: "600" },
  msgList: { padding: 24, paddingBottom: 40 },
  msgRowAi: { flexDirection: "row", gap: 12, marginBottom: 20 },
  msgRowUser: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 4 },
  bubbleAi: { backgroundColor: "rgba(30,41,70,0.8)", padding: 16, borderRadius: 20, borderTopLeftRadius: 4, maxWidth: "85%", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)" },
  bubbleTxtAi: { color: "#E2E8F0", fontSize: 14.5, lineHeight: 22 },
  bubbleUser: { backgroundColor: "#5B6EF7", padding: 16, borderRadius: 20, borderTopRightRadius: 4, maxWidth: "85%" },
  bubbleTxtUser: { color: "#fff", fontSize: 14.5, lineHeight: 22, fontWeight: "500" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(5,8,17,0.95)", gap: 12 },
  input: { flex: 1, height: 48, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, paddingHorizontal: 20, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  sendTxt: { color: "#fff", fontSize: 18, fontWeight: "900", marginLeft: 2 },
});