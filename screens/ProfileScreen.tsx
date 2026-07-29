import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import AuthBackground from "../components/AuthBackground";

export default function ProfileScreen() {
  const [displayName, setDisplayName] = useState("Coder");
  const [level, setLevel] = useState(1);
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
        setLevel(data.level || 1);
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

  const nextLevelXp = level * 100;
  const xpProgress = (xp % nextLevelXp) / nextLevelXp;

  return (
    <AuthBackground>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
           <LinearGradient colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]} style={styles.profileCardGradient}>
              <View style={styles.avatarLarge}>
                 <Text style={styles.avatarLargeText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileLevelBadge}>Level {level}</Text>
              
              <View style={styles.xpRow}>
                <Text style={styles.xpText}>{xp} / {xp + (nextLevelXp - (xp % nextLevelXp))} XP</Text>
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
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{coins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <Text style={styles.sectionTitle}>Detailed Statistics</Text>
        <View style={styles.detailsContainer}>
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

           <View style={styles.detailRow}>
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
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 60, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, marginBottom: 30 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  backBtnText: { color: "#fff", fontSize: 20 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  
  profileCard: { marginHorizontal: 22, borderRadius: 32, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  profileCardGradient: { padding: 32, alignItems: "center" },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#4F6EF7", alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: "#4F6EF7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  avatarLargeText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  profileName: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 6 },
  profileLevelBadge: { color: "#4F6EF7", fontSize: 16, fontWeight: "800", backgroundColor: "rgba(79, 110, 247, 0.15)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, overflow: "hidden", marginBottom: 24 },
  
  xpRow: { width: "100%", flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  xpText: { color: "#94A3B8", fontSize: 13, fontWeight: "700" },
  progressBg: { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  
  statsRow: { flexDirection: "row", marginHorizontal: 22, gap: 14, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, paddingVertical: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#94A3B8", fontSize: 13, marginTop: 4, fontWeight: "600" },
  
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginHorizontal: 22, marginBottom: 16 },
  detailsContainer: { marginHorizontal: 22, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 32 },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  detailIcon: { fontSize: 18 },
  detailLabel: { color: "#E2E8F0", fontSize: 15, fontWeight: "600" },
  detailValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  
  logoutBtn: { marginHorizontal: 22, backgroundColor: "rgba(248, 113, 113, 0.1)", borderRadius: 18, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "rgba(248, 113, 113, 0.3)" },
  logoutText: { color: "#F87171", fontSize: 16, fontWeight: "700" }
});
