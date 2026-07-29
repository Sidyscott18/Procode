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
import { onSnapshot, doc } from "firebase/firestore";
import { router } from "expo-router";
import { auth, db } from "../services/firebase";
import AuthBackground from "../components/AuthBackground";
import { LinearGradient } from "expo-linear-gradient";
import { GameData } from "../services/gameService";

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
  progress?: number; // fallback progress
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
    progress: 0.42,
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

// ── Placeholder Thumb ─────────────────────────────────────────
function PlaceholderThumb({ title, style }: PlaceholderThumbProps) {
  return (
    <View style={[style, { backgroundColor: "#0D1730", alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontSize: 30, marginBottom: 6 }}>🎮</Text>
      <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: 1.5, fontWeight: "700" }}>COMING SOON</Text>
    </View>
  );
}

// ── Animated Card Wrapper ─────────────────────────────────────
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
      
      // Setup realtime listener for game data
      const uid = auth.currentUser?.uid;
      if (uid) {
        const docRef = doc(db, "users", uid, "games", game.id);
        const unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) setStats(snap.data() as GameData);
          else setStats(null);
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity activeOpacity={1} style={styles.sheetBackdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
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
              <Text style={styles.actionBtnText}>📘 Quick Recap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onAction("ai")}>
              <Text style={styles.actionBtnText}>🤖 Ask AI</Text>
            </TouchableOpacity>
          </View>
          
          {game.playable ? (
            <TouchableOpacity style={[styles.playBtn, { backgroundColor: accent }]} onPress={() => onPlay(game)} activeOpacity={0.85}>
              <Text style={styles.playBtnText}>▶  PLAY NOW</Text>
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity activeOpacity={1} style={styles.sheetBackdrop} onPress={onClose} />
      <Animated.View style={[styles.glassSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📘 Quick Recap</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll}>
          <Text style={styles.recapText}>In this section, you&apos;ll review the core concepts you&apos;ve mastered so far.</Text>
          {/* Placeholder for real recap content */}
          <View style={styles.recapCard}>
            <Text style={styles.recapCardTitle}>Data Types</Text>
            <Text style={styles.recapCardDesc}>Integers, Strings, Lists, and Dictionaries form the foundation of Python data structures.</Text>
          </View>
          <View style={styles.recapCard}>
            <Text style={styles.recapCardTitle}>Conditional Logic</Text>
            <Text style={styles.recapCardDesc}>If/Elif/Else statements allow you to branch your code execution based on dynamic logic.</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function AskAiModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    else Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [visible, fadeAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.fullScreenModal, { opacity: fadeAnim }]}>
        <LinearGradient colors={["#0B1120", "#080E1E", "#050811"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.modalHeaderFullScreen}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
             <View style={styles.aiAvatar}><Text style={{fontSize: 20}}>🤖</Text></View>
             <View>
               <Text style={styles.modalTitle}>AI Assistant</Text>
               <Text style={styles.aiStatus}>Online</Text>
             </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.chatContainer}>
          <View style={styles.chatBubbleAi}>
            <Text style={styles.chatTextAi}>Hello! I&apos;m your Procode AI assistant. Need help understanding a concept or unstucking a level?</Text>
          </View>
        </ScrollView>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.chatInputContainer}>
            <TextInput style={styles.chatInput} placeholder="Ask AI anything..." placeholderTextColor="#64748B" />
            <TouchableOpacity style={styles.sendBtn}><Text style={styles.sendBtnText}>➤</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}


// ── Main Screen ───────────────────────────────────────────────
export default function HomeScreen() {
  const [displayName, setDisplayName] = useState("Coder");
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [recapVisible, setRecapVisible] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Live listener for user profile xp and level
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName || "Coder");
        setLevel(data.level || 1);
        setXp(data.xp || 0);
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
  
  // XP Calculation
  const nextLevelXp = level * 100;
  const xpProgress = (xp % nextLevelXp) / nextLevelXp;

  return (
    <AuthBackground>
      {/* ── Modals ── */}
      <GameSheet game={selectedGame} visible={sheetVisible} onClose={closeGameSheet} onPlay={handlePlay} onAction={handleAction} />
      <QuickRecapModal visible={recapVisible} onClose={() => setRecapVisible(false)} />
      <AskAiModal visible={aiVisible} onClose={() => setAiVisible(false)} />

      {/* ── Main scroll ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hey, {displayName} 👋</Text>
            <Text style={styles.subGreeting}>Ready to level up today?</Text>
          </View>
          
          {/* Profile Card Top Right */}
          <TouchableOpacity activeOpacity={0.8} style={styles.profileCard} onPress={() => router.push("/profile" as any)}>
              <View style={styles.profileCardLeft}>
                 <Text style={styles.profileCardLevel}>Lvl {level}</Text>
                 <View style={styles.profileCardProgressBg}>
                    <LinearGradient colors={["#4FF79E", "#4F6EF7"]} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.profileCardProgressFill, { width: `${xpProgress * 100}%` }]} />
                 </View>
              </View>
              <View style={styles.avatarBtn}>
                 <Text style={styles.avatarBtnText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput placeholder="Search games..." placeholderTextColor="#64748B" style={styles.search} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── Continue Playing ── */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Continue Playing</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroRow}>
          {continuePlaying.map((game) => (
             <PressCard key={game.id} onPress={() => openGameSheet(game)} style={styles.heroCard}>
               {game.image ? <Image source={game.image} style={styles.heroImage as StyleProp<ImageStyle>} resizeMode="cover" /> : <PlaceholderThumb title={game.title} style={styles.heroImage} />}
               <LinearGradient colors={["transparent", "rgba(11,17,32,0.8)", "rgba(11,17,32,1)"]} style={styles.heroGradient} />
               {game.genre && <View style={[styles.heroPill, { backgroundColor: genreColor[game.genre] ?? "#4F6EF7" }]}><Text style={styles.heroPillText}>{game.genre}</Text></View>}
               <View style={styles.heroContent}>
                 <Text style={styles.heroTitle}>{game.title}</Text>
                 <Text style={styles.heroSubtitle}>{game.subtitle}</Text>
               </View>
             </PressCard>
          ))}
        </ScrollView>

        {/* ── Recommended ── */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recommended For You</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
          {recommendedGames.map((game) => (
             <PressCard key={game.id + game.title} onPress={() => openGameSheet(game)} style={styles.gameCard}>
               <View style={styles.gameImageWrap}>
                 {game.image ? <Image source={game.image} style={styles.gameImage as StyleProp<ImageStyle>} resizeMode="cover" /> : <PlaceholderThumb title={game.title} style={styles.gameImage} />}
                 {game.genre && <View style={[styles.gameChip, { backgroundColor: (genreColor[game.genre] ?? "#4F6EF7") + "DD" }]}><Text style={styles.gameChipText}>{game.genre}</Text></View>}
                 {!game.playable && <View style={styles.gameDim} />}
               </View>
               <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
               <Text style={styles.gameSubtitle} numberOfLines={1}>{game.subtitle}</Text>
             </PressCard>
          ))}
        </ScrollView>
      </ScrollView>
      
      {/* Floating Ask AI Button */}
      <TouchableOpacity style={styles.floatingAiBtn} onPress={() => setAiVisible(true)}>
          <LinearGradient colors={["#C84FF7", "#4F6EF7"]} style={styles.floatingAiGradient}>
             <Text style={styles.floatingAiText}>🤖</Text>
          </LinearGradient>
      </TouchableOpacity>
    </AuthBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { paddingTop: 60, paddingBottom: 130 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, marginBottom: 28 },
  greeting: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.3 },
  subGreeting: { color: "#94A3B8", fontSize: 14, marginTop: 3, fontWeight: "500" },
  
  // Profile Card
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 28, padding: 6, paddingLeft: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  profileCardLeft: { marginRight: 10, alignItems: "flex-end" },
  profileCardLevel: { color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  profileCardProgressBg: { width: 50, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  profileCardProgressFill: { height: "100%", borderRadius: 2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#4F6EF7", alignItems: "center", justifyContent: "center" },
  avatarBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  
  // Search
  searchWrap: { marginHorizontal: 22, height: 54, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  searchIcon: { fontSize: 16, marginRight: 12 },
  search: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" },
  
  // Sections
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, marginBottom: 16 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.2 },
  
  // Hero Card
  heroRow: { paddingLeft: 22, paddingRight: 8, marginBottom: 32 },
  heroCard: { width: SCREEN_WIDTH - 60, borderRadius: 24, overflow: "hidden", marginRight: 16, backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  heroImage: { width: "100%", height: 200 },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 160 },
  heroPill: { position: "absolute", top: 14, left: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  heroPillText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingBottom: 18 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.2 },
  heroSubtitle: { color: "#94A3B8", fontSize: 14, fontWeight: "500", marginTop: 4 },
  
  // Small Card
  cardRow: { paddingLeft: 22, paddingRight: 8, marginBottom: 28 },
  gameCard: { width: 164, marginRight: 14 },
  gameImageWrap: { width: "100%", height: 118, borderRadius: 20, overflow: "hidden", backgroundColor: "#0B1120", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  gameImage: { width: "100%", height: "100%" },
  gameChip: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gameChipText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  gameDim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  gameTitle: { color: "#E2E8F0", fontSize: 15, fontWeight: "700", marginTop: 12 },
  gameSubtitle: { color: "#64748B", fontSize: 12, fontWeight: "500", marginTop: 4 },

  // Bottom Sheet
  sheetBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0A0F1E", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: SCREEN_HEIGHT * 0.88, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderBottomWidth: 0 },
  sheetHandle: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginTop: 14, marginBottom: 8 },
  sheetThumb: { width: "100%", height: 210 },
  sheetGenreBadge: { marginHorizontal: 22, marginTop: 18, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  sheetGenreText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  sheetInfo: { paddingHorizontal: 22, paddingTop: 14 },
  sheetTitle: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.2 },
  sheetTag: { color: "#94A3B8", fontSize: 14, fontWeight: "600", marginTop: 6, letterSpacing: 0.3 },
  sheetDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 20 },
  sheetDescHeading: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  sheetDesc: { color: "#94A3B8", fontSize: 14, lineHeight: 22 },
  sheetFooter: { paddingHorizontal: 22, paddingVertical: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", backgroundColor: "#0A0F1E" },
  
  // Game Sheet Action Bar
  actionBar: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, height: 46, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#E2E8F0", fontSize: 14, fontWeight: "700" },
  playBtn: { borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center" },
  playBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1.5 },
  comingSoonBtn: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  comingSoonText: { color: "#64748B", fontSize: 15, fontWeight: "700", letterSpacing: 1 },

  // Live Stats Grid
  liveStatsContainer: { marginTop: 24 },
  liveStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  liveStatItem: { width: "31%", backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  liveStatLabel: { color: "#64748B", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  liveStatValue: { color: "#E2E8F0", fontSize: 16, fontWeight: "800" },
  lastPlayedText: { color: "#64748B", fontSize: 12, marginTop: 12, fontStyle: "italic" },

  // Glass Sheet (Quick Recap)
  glassSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(11,17,32,0.85)", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: SCREEN_HEIGHT * 0.7, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderBottomWidth: 0 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingBottom: 16, paddingTop: 10 },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#94A3B8", fontSize: 16, fontWeight: "800" },
  modalScroll: { paddingHorizontal: 22, paddingBottom: 40 },
  recapText: { color: "#94A3B8", fontSize: 15, lineHeight: 22, marginBottom: 20 },
  recapCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  recapCardTitle: { color: "#4F6EF7", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  recapCardDesc: { color: "#E2E8F0", fontSize: 14, lineHeight: 20 },

  // Full Screen Modal (Ask AI)
  fullScreenModal: { flex: 1 },
  modalHeaderFullScreen: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  aiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  aiStatus: { color: "#4FF79E", fontSize: 12, fontWeight: "600", marginTop: 2 },
  chatContainer: { padding: 22 },
  chatBubbleAi: { backgroundColor: "rgba(255,255,255,0.08)", padding: 16, borderRadius: 20, borderTopLeftRadius: 4, maxWidth: "85%", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  chatTextAi: { color: "#E2E8F0", fontSize: 15, lineHeight: 22 },
  chatInputContainer: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(11,17,32,0.95)" },
  chatInput: { flex: 1, height: 50, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 25, paddingHorizontal: 20, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#4F6EF7", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },

  // Floating AI Button
  floatingAiBtn: { position: "absolute", bottom: 24, right: 24, shadowColor: "#C84FF7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  floatingAiGradient: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  floatingAiText: { fontSize: 26 },
});