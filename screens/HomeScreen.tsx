import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Animated,
  Dimensions,
  StyleProp,
  ViewStyle,
  ImageStyle,
  ImageSourcePropType,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useEffect, useState, useRef } from "react";
import { onSnapshot, doc, setDoc } from "firebase/firestore";
import { router } from "expo-router";
import { auth, db } from "../services/firebase";
import AuthBackground from "../components/AuthBackground";
import { LinearGradient } from "expo-linear-gradient";
import { GameData } from "../services/gameService";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

// ── Game Data ─────────────────────────────────────────────────
const continuePlaying: Game[] = [
  {
    id: "pyro",
    title: "PYRO - Data Defence",
    subtitle: "Python Data Types",
    genre: "TOWER DEFENCE",
    description: "Defend your data fortress against waves of type errors and corrupted variables. Learn Python data types — integers, strings, lists, and dicts — by deploying the right defences at the right time.",
    playable: true,
    image: require("../assets/games/pyro.png"),
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
  {
    id: "coderunner",
    title: "Code Runner",
    subtitle: "Python Basics",
    genre: "RUNNER",
    description: "🚧 Coming Soon\n\nRace through procedurally generated code tracks by writing correct Python syntax. The faster you code, the further you run.",
    playable: false,
    image: null,
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

// ── Game Detail Bottom Sheet ───────────────────────────────────
function GameSheet({ game, visible, onClose, onPlay, onAction }: GameSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [stats, setStats] = useState<GameData | null>(null);

  useEffect(() => {
    if (visible && game) {
      Animated.spring(slideAnim, { toValue: 0, damping: 20, mass: 0.8, stiffness: 120, useNativeDriver: true }).start();
      
      const uid = auth.currentUser?.uid;
      if (uid) {
        const docRef = doc(db, "users", uid, "games", game.id);
        const unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) setStats(snap.data() as GameData);
          else setStats({ level: 0, xp: 0, coins: 0, highScore: 0, highestWave: 0, completion: 0 }); // Init to 0
        });
        return () => unsubscribe();
      }
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }).start();
      setTimeout(() => setStats(null), 300);
    }
  }, [visible, game, slideAnim]);

  if (!game) return null;

  const accent = genreColor[game.genre ?? ""] ?? "#4F6EF7";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
      </BlurView>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={["rgba(11, 17, 32, 0.95)", "rgba(8, 14, 30, 1)"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          {game.image ? (
            <Image source={game.image} style={styles.sheetThumb as StyleProp<ImageStyle>} resizeMode="cover" />
          ) : (
            <PlaceholderThumb title={game.title} style={styles.sheetThumb} />
          )}

          {game.genre && (
            <View style={[styles.sheetGenreBadge, { backgroundColor: accent + "22", borderColor: accent + "55" }]}>
              <Text style={[styles.sheetGenreText, { color: accent }]}>{game.genre}</Text>
            </View>
          )}

          <View style={styles.sheetInfo}>
            <Text style={styles.sheetTitle}>{game.title}</Text>
            <Text style={styles.sheetTag}>{game.subtitle}</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetDescHeading}>About</Text>
            <Text style={styles.sheetDesc}>{game.description}</Text>

            {/* Live Progress Stats */}
            {stats && (
              <View style={styles.liveStatsContainer}>
                <Text style={styles.sheetDescHeading}>Your Progress</Text>
                <View style={styles.liveStatsGrid}>
                  <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Level</Text><Text style={[styles.liveStatValue, { color: accent }]}>{stats.level ?? 0}</Text></View>
                  <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Game XP</Text><Text style={styles.liveStatValue}>{stats.xp ?? 0}</Text></View>
                  <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Completion</Text><Text style={styles.liveStatValue}>{stats.completion ?? 0}%</Text></View>
                  <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>High Score</Text><Text style={styles.liveStatValue}>{stats.highScore ?? 0}</Text></View>
                  <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Highest Wave</Text><Text style={styles.liveStatValue}>{stats.highestWave ?? 0}</Text></View>
                  <View style={styles.liveStatItem}><Text style={styles.liveStatLabel}>Coins</Text><Text style={[styles.liveStatValue, {color: "#F7D44F"}]}>{stats.coins ?? 0}</Text></View>
                </View>
                {stats.lastPlayed && <Text style={styles.lastPlayedText}>Last Played: {stats.lastPlayed}</Text>}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.sheetFooter}>
          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onAction("recap")}>
              <LinearGradient colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.02)"]} style={styles.actionBtnGradient}>
                <Text style={styles.actionBtnIcon}>📘</Text>
                <Text style={styles.actionBtnText}>Quick Knowledge</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onAction("ai")}>
              <LinearGradient colors={["rgba(79, 110, 247, 0.2)", "rgba(79, 110, 247, 0.05)"]} style={styles.actionBtnGradient}>
                <Text style={styles.actionBtnIcon}>🤖</Text>
                <Text style={[styles.actionBtnText, {color: "#E2E8F0"}]}>Ask AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {game.playable ? (
            <TouchableOpacity style={styles.playBtnWrapper} onPress={() => onPlay(game)} activeOpacity={0.85}>
              <LinearGradient colors={[accent, accent + "DD"]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.playBtnGradient}>
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
    </Modal>
  );
}

// ── Modals ───────────────────────────────────────────────────
function QuickRecapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  useEffect(() => {
    if (visible) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
    else Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
  }, [visible, slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
         <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
      </BlurView>
      <Animated.View style={[styles.glassSheet, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={["rgba(20, 25, 45, 0.9)", "rgba(10, 15, 30, 0.95)"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📘 Quick Knowledge</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll}>
          <Text style={styles.recapText}>Notes for Pyro Game:</Text>
          
          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>📦</Text>
                <Text style={styles.recapCardTitle}>Data Types</Text>
            </View>
            <Text style={styles.recapCardDesc}>A data type tells Python what kind of value a variable stores, allowing different operations.{"\n"}Example: <Text style={{fontFamily: "monospace", color: "#F7D44F"}}>age = 20</Text>, <Text style={{fontFamily: "monospace", color: "#F7D44F"}}>name = "Alex"</Text></Text>
          </View>

          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>🔢</Text>
                <Text style={styles.recapCardTitle}>Integer (int)</Text>
            </View>
            <Text style={styles.recapCardDesc}>Stores whole numbers without decimal points.{"\n"}Examples: <Text style={{fontFamily: "monospace", color: "#4FF79E"}}>age = 20, marks = 95, temperature = -5</Text></Text>
          </View>

          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>🎯</Text>
                <Text style={styles.recapCardTitle}>Float (float)</Text>
            </View>
            <Text style={styles.recapCardDesc}>Stores numbers with decimal points.{"\n"}Examples: <Text style={{fontFamily: "monospace", color: "#4F6EF7"}}>price = 99.99, height = 5.8, pi = 3.14159</Text></Text>
          </View>

          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>📝</Text>
                <Text style={styles.recapCardTitle}>String (str)</Text>
            </View>
            <Text style={styles.recapCardDesc}>Stores text enclosed in single or double quotes.{"\n"}Examples: <Text style={{fontFamily: "monospace", color: "#F7D44F"}}>name = "John", city = 'Chennai'</Text></Text>
          </View>

          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>⚖️</Text>
                <Text style={styles.recapCardTitle}>Boolean (bool)</Text>
            </View>
            <Text style={styles.recapCardDesc}>Stores only two values: <Text style={{fontWeight:'bold', color: "#C84FF7"}}>True</Text> or <Text style={{fontWeight:'bold', color: "#C84FF7"}}>False</Text>. Used for conditions.{"\n"}Examples: <Text style={{fontFamily: "monospace", color: "#C84FF7"}}>isLoggedIn = True, isRainy = False</Text></Text>
          </View>

          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>🔄</Text>
                <Text style={styles.recapCardTitle}>Type Casting</Text>
            </View>
            <Text style={styles.recapCardDesc}>Converting one data type into another.{"\n"}• int → float: <Text style={{fontFamily: "monospace"}}>float(10) → 10.0</Text>{"\n"}• float → int: <Text style={{fontFamily: "monospace"}}>int(5.8) → 5</Text>{"\n"}• int → str: <Text style={{fontFamily: "monospace"}}>str(20) → "20"</Text>{"\n"}• str → int: <Text style={{fontFamily: "monospace"}}>int("100") → 100</Text></Text>
          </View>

          <View style={styles.recapCard}>
            <View style={styles.recapCardHeader}>
                <Text style={styles.recapCardIcon}>📏</Text>
                <Text style={styles.recapCardTitle}>len() & abs()</Text>
            </View>
            <Text style={styles.recapCardDesc}><Text style={{fontWeight:'bold'}}>len()</Text> returns the number of characters. Example: <Text style={{fontFamily: "monospace"}}>len("Python") → 6</Text>{"\n\n"}<Text style={{fontWeight:'bold'}}>abs()</Text> returns the absolute positive value. Example: <Text style={{fontFamily: "monospace"}}>abs(-15) → 15</Text></Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function AskAiModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [messages, setMessages] = useState([{ role: "model", text: "Hello! I'm your Procode AI assistant. Need help understanding a concept or unstucking a level?" }]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    else Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [visible, fadeAnim]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      console.log("[AI] API Key present:", !!apiKey, "| Key prefix:", apiKey?.substring(0, 10));
      if (!apiKey) {
        setMessages(prev => [...prev, { role: "model", text: "Error: API Key not found. Please paste your Groq API key in the .env file as EXPO_PUBLIC_GROQ_API_KEY." }]);
        setIsLoading(false);
        return;
      }

      console.log("[AI] Making request to Groq...");
      const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are Procode AI. You must ONLY respond to questions related to programming and the games. You have knowledge of the 'Pyro Game' (a game where users learn Python programming by typing python spells to defeat bugs). If a question is NOT about programming or games, politely decline to answer." },
            { role: "user", content: userMsg }
          ]
        })
      });
      console.log("[AI] Response status:", res.status);
      const data = await res.json();
      console.log("[AI] Response data:", JSON.stringify(data).substring(0, 200));
      const reply = data.choices?.[0]?.message?.content || `API Error: ${JSON.stringify(data)}`;
      setMessages(prev => [...prev, { role: "model", text: reply }]);
    } catch (e) {
      console.log("[AI] Fetch error:", e);
      setMessages(prev => [...prev, { role: "model", text: `Network error: ${e}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.fullScreenModal, { opacity: fadeAnim }]}>
        {/* Background */}
        <LinearGradient colors={["#050811", "#080D1C", "#050811"]} style={StyleSheet.absoluteFillObject} />
        {/* Decorative Orbs */}
        <View style={styles.aiOrb1} />
        <View style={styles.aiOrb2} />

        {/* Header */}
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

        {/* Divider */}
        <View style={styles.aiDivider} />

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
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

        {/* Input Row */}
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


// ── Main Screen ───────────────────────────────────────────────
export default function HomeScreen() {
  const [displayName, setDisplayName] = useState("Coder");
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(0);
  
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [sheetVisible, setSheetVisible] = useState(false);
  const [recapVisible, setRecapVisible] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);

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
    if (game.id === "pyro") { router.push("/games/pyro"); return; }
    if (game.id === "anomolies") { router.push("/games/anomolies"); return; }
    if (game.id === "soschef") { router.push("/games/soschef"); return; }
  };
  
  const handleAction = (action: "recap" | "ai") => {
      if (action === "recap") setRecapVisible(true);
      if (action === "ai") setAiVisible(true);
  };
  
  // XP Calculation - Required for NEXT level
  const getLevelStart = (lvl: number) => {
     let start = 0;
     for(let i=0; i<lvl; i++) start += (i+1)*100;
     return start;
  }
  const currentLevelStart = getLevelStart(level);
  const nextLevelStart = getLevelStart(level + 1);
  const xpForCurrentLevel = nextLevelStart - currentLevelStart;
  const currentProgressXp = xp - currentLevelStart;
  const xpProgress = Math.max(0, Math.min(1, currentProgressXp / xpForCurrentLevel));

  return (
    <AuthBackground>
      {/* ── Modals ── */}
      <GameSheet game={selectedGame} visible={sheetVisible} onClose={closeGameSheet} onPlay={handlePlay} onAction={handleAction} />
      <QuickRecapModal visible={recapVisible} onClose={() => setRecapVisible(false)} />
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
            <LinearGradient colors={["#8B5CF6", "#4F6EF7", "#34D399"]} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.xpBarFill, { width: `${(xpProgress || 0) * 100}%` }]} />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput placeholder="Search games..." placeholderTextColor="rgba(148,163,184,0.4)" style={styles.search} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── Continue Playing ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccentBar} />
          <Text style={styles.sectionTitle}>Continue Playing</Text>
          <View style={styles.sectionLiveDot} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroRow}>
          {continuePlaying.map((game) => (
             <PressCard key={game.id} onPress={() => openGameSheet(game)} style={styles.heroCard}>
               {game.image ? <Image source={game.image} style={styles.heroImage as StyleProp<ImageStyle>} resizeMode="cover" /> : <PlaceholderThumb title={game.title} style={styles.heroImage} />}
               <LinearGradient colors={["transparent", "rgba(5,8,17,0.7)", "rgba(5,8,17,0.98)"]} style={styles.heroGradient} />
               {game.genre && (
                 <View style={[styles.heroPill, { backgroundColor: (genreColor[game.genre] ?? "#4F6EF7") + "33", borderColor: genreColor[game.genre] ?? "#4F6EF7" }]}>
                   <Text style={[styles.heroPillText, {color: genreColor[game.genre] ?? "#4FF79E"}]}>{game.genre}</Text>
                 </View>
               )}
               <View style={styles.heroContent}>
                 <Text style={styles.heroTitle}>{game.title}</Text>
                 <Text style={styles.heroSubtitle}>{game.subtitle}</Text>
                 <View style={styles.heroPlayBtn}>
                   <LinearGradient colors={["#8B5CF6", "#4F6EF7"]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
                   <Text style={styles.heroPlayBtnText}>▶  CONTINUE</Text>
                 </View>
               </View>
             </PressCard>
          ))}
        </ScrollView>

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
  container: { paddingTop: 56, paddingBottom: 130 },

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
  heroCard: { width: SCREEN_WIDTH - 50, borderRadius: 24, overflow: "hidden", marginRight: 16, backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
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
  gameSubtitle: { color: "rgba(100,116,139,0.9)", fontSize: 12, fontWeight: "500", marginTop: 3 },

  // Game Sheet
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: SCREEN_HEIGHT * 0.88, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderBottomWidth: 0, overflow: "hidden" },
  sheetHandle: { width: 48, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginTop: 14, marginBottom: 12 },
  sheetThumb: { width: "100%", height: 210 },
  sheetGenreBadge: { marginHorizontal: 22, marginTop: 20, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  sheetGenreText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  sheetInfo: { paddingHorizontal: 22, paddingTop: 16 },
  sheetTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  sheetTag: { color: "#94A3B8", fontSize: 14, fontWeight: "600", marginTop: 6, letterSpacing: 0.3 },
  sheetDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 24 },
  sheetDescHeading: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  sheetDesc: { color: "#94A3B8", fontSize: 14, lineHeight: 24, fontWeight: "500" },
  sheetFooter: { paddingHorizontal: 22, paddingVertical: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(5, 8, 17, 0.95)" },
  
  // Game Sheet Action Bar
  actionBar: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, height: 48, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionBtnGradient: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnIcon: { fontSize: 16 },
  actionBtnText: { color: "#E2E8F0", fontSize: 14, fontWeight: "800" },
  playBtnWrapper: { borderRadius: 18, height: 58, shadowColor: "#4F6EF7", shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8, overflow: 'hidden' },
  playBtnGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  playBtnText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  comingSoonBtn: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, height: 58, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  comingSoonText: { color: "#64748B", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  // Live Stats Grid
  liveStatsContainer: { marginTop: 28 },
  liveStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  liveStatItem: { width: "31%", backgroundColor: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  liveStatLabel: { color: "#64748B", fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginBottom: 6 },
  liveStatValue: { color: "#E2E8F0", fontSize: 18, fontWeight: "900" },
  lastPlayedText: { color: "#64748B", fontSize: 12, marginTop: 14, fontStyle: "italic", fontWeight: "600" },

  // Glass Sheet (Quick Recap)
  glassSheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: SCREEN_HEIGHT * 0.75, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderBottomWidth: 0, overflow: "hidden" },
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
  aiAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(139, 92, 246, 0.6)", shadowColor: "#8B5CF6", shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 },
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
  chatBubbleUser: { backgroundColor: "#5B6EF7", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderTopRightRadius: 4, maxWidth: "78%", shadowColor: "#5B6EF7", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  chatTextUser: { color: "#FFFFFF", fontSize: 14.5, lineHeight: 22, fontWeight: "500" },
  chatInputWrapper: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 32 : 14 },
  chatInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.95)", borderRadius: 32, borderWidth: 1, borderColor: "rgba(139, 92, 246, 0.35)", paddingLeft: 20, paddingRight: 6, paddingVertical: 6 },
  chatInput: { flex: 1, height: 46, color: "#F8FAFC", fontSize: 15, fontWeight: "400" },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden", elevation: 4, shadowColor: "#8B5CF6", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 10 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", marginLeft: 2 },

  // Floating AI Button
  floatingAiBtn: { position: "absolute", bottom: 24, right: 24, shadowColor: "#C84FF7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 12 },
  floatingAiGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  floatingAiText: { fontSize: 28 },
});