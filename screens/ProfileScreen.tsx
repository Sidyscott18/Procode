import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import AuthBackground from "../components/AuthBackground";
import { BlurView } from "expo-blur";

export default function ProfileScreen() {
  const [displayName, setDisplayName] = useState("Coder");
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  
  // Stats could be computed from games collection, but for now we'll mock or fetch basic ones
  const [totalPlayTime] = useState("45h 12m");
  const [gamesPlayed] = useState(12);
  const [achievements] = useState(24);
  const [streak] = useState(7);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName || "Coder");
        setLevel(data.level ?? 0);
        setXp(data.xp || 0);
        setCoins(data.coins || 0);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log(error);
    }
  };

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
           <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFillObject} />
           <LinearGradient colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0.01)"]} style={styles.profileCardGradient}>
              <View style={styles.avatarLarge}>
                 <LinearGradient colors={["#C84FF7", "#4F6EF7"]} style={StyleSheet.absoluteFillObject} />
                 <Text style={styles.avatarLargeText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{displayName}</Text>
              
              <View style={styles.profileLevelBadge}>
                 <LinearGradient colors={["rgba(79, 110, 247, 0.25)", "rgba(79, 110, 247, 0.05)"]} style={StyleSheet.absoluteFillObject} />
                 <Text style={styles.profileLevelBadgeText}>Level {level}</Text>
              </View>
              
              <View style={styles.xpRow}>
                <Text style={styles.xpText}>{currentProgressXp} / {xpForCurrentLevel} XP</Text>
              </View>
              <View style={styles.progressBg}>
                <LinearGradient 
                  colors={["#4FF79E", "#4F6EF7"]} 
                  start={{x:0,y:0}} end={{x:1,y:0}} 
                  style={[styles.progressFill, { width: `${xpProgress * 100}%` }]} 
                />
              </View>
           </LinearGradient>
        </View>

        {/* Core Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFillObject} />
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{coins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.statCard}>
            <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFillObject} />
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <Text style={styles.sectionTitle}>Detailed Statistics</Text>
        <View style={styles.detailsContainer}>
           <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFillObject} />
           
           <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(79, 110, 247, 0.2)" }]}>
                  <Text style={styles.detailIcon}>🎮</Text>
                </View>
                <Text style={styles.detailLabel}>Games Played</Text>
              </View>
              <Text style={styles.detailValue}>{gamesPlayed}</Text>
           </View>

           <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(200, 79, 247, 0.2)" }]}>
                  <Text style={styles.detailIcon}>🏆</Text>
                </View>
                <Text style={styles.detailLabel}>Achievements</Text>
              </View>
              <Text style={styles.detailValue}>{achievements}</Text>
           </View>

           <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={styles.detailLeft}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(79, 247, 158, 0.2)" }]}>
                  <Text style={styles.detailIcon}>⏱️</Text>
                </View>
                <Text style={styles.detailLabel}>Total Play Time</Text>
              </View>
              <Text style={styles.detailValue}>{totalPlayTime}</Text>
           </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={["rgba(248, 113, 113, 0.15)", "rgba(248, 113, 113, 0.05)"]} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        </View>
      </ScrollView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { alignItems: "center" },
  container: { paddingTop: 60, paddingBottom: 60, width: "100%", maxWidth: Platform.OS === 'web' ? 800 : undefined },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, marginBottom: 30 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  backBtnText: { color: "#fff", fontSize: 20 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  
  profileCard: { marginHorizontal: 22, borderRadius: 36, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  profileCardGradient: { padding: 32, alignItems: "center" },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: 'hidden', borderWidth: 2, borderColor: "rgba(255,255,255,0.2)", shadowColor: "#4F6EF7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  avatarLargeText: { color: "#fff", fontSize: 40, fontWeight: "900" },
  profileName: { color: "#fff", fontSize: 30, fontWeight: "900", marginBottom: 8, letterSpacing: -0.5 },
  profileLevelBadge: { borderRadius: 12, overflow: "hidden", marginBottom: 28, borderWidth: 1, borderColor: "rgba(79, 110, 247, 0.4)" },
  profileLevelBadgeText: { color: "#4F6EF7", fontSize: 15, fontWeight: "800", paddingHorizontal: 16, paddingVertical: 6, letterSpacing: 0.5 },
  
  xpRow: { width: "100%", flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  xpText: { color: "#94A3B8", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  progressBg: { width: "100%", height: 8, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 4, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  progressFill: { height: "100%", borderRadius: 4 },
  
  statsRow: { flexDirection: "row", marginHorizontal: 22, gap: 14, marginBottom: 32 },
  statCard: { flex: 1, borderRadius: 24, paddingVertical: 22, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { color: "#E2E8F0", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { color: "#94A3B8", fontSize: 13, marginTop: 4, fontWeight: "700", textTransform: 'uppercase', letterSpacing: 0.5 },
  
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginHorizontal: 22, marginBottom: 16, letterSpacing: -0.2 },
  detailsContainer: { marginHorizontal: 22, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 32, overflow: "hidden" },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  detailIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  detailIcon: { fontSize: 20 },
  detailLabel: { color: "#E2E8F0", fontSize: 16, fontWeight: "700" },
  detailValue: { color: "#fff", fontSize: 18, fontWeight: "900" },
  
  logoutBtn: { marginHorizontal: 22, borderRadius: 20, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "rgba(248, 113, 113, 0.4)", overflow: 'hidden' },
  logoutText: { color: "#F87171", fontSize: 17, fontWeight: "800", letterSpacing: 1 }
});
