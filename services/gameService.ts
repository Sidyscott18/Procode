import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface GameData {
  level?: number;
  xp?: number;
  coins?: number;
  highScore?: number;
  highestWave?: number;
  completion?: number;
  lastPlayed?: string;
  achievements?: string[];
  unlockedWeapons?: string[];
  totalEnemiesDestroyed?: number;
  totalPlayTime?: number;
  accuracy?: number;
}

export const getGameData = async (gameId: string): Promise<GameData | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  
  const docRef = doc(db, "users", uid, "games", gameId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    return snap.data() as GameData;
  }
  return null;
};

export const saveGameData = async (gameId: string, data: Partial<GameData>) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  
  const docRef = doc(db, "users", uid, "games", gameId);
  await setDoc(docRef, { ...data, lastPlayed: new Date().toISOString() }, { merge: true });
};

export const addPlayerXp = async (amount: number) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    const currentXp = snap.data().xp || 0;
    const currentLevel = snap.data().level || 1;
    const newXp = currentXp + amount;
    
    // Level calculation:
    // Level 0: 0-99 XP
    // Level 1: 100-299 XP
    // Level 2: 300-599 XP
    let newLevel = 0;
    let requiredXp = 0;
    while (newXp >= requiredXp + ((newLevel + 1) * 100)) {
        requiredXp += ((newLevel + 1) * 100);
        newLevel++;
    }

    await setDoc(userRef, { 
        xp: newXp,
        level: newLevel
    }, { merge: true });
  } else {
      // Initialize if not exists
      await setDoc(userRef, {
          xp: amount,
          level: 0,
          coins: 0
      }, { merge: true });
  }
};

export const addCoins = async (amount: number) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { 
      coins: increment(amount) 
  }, { merge: true });
};

export const unlockAchievement = async (gameId: string, achievementId: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  
  const docRef = doc(db, "users", uid, "games", gameId);
  await setDoc(docRef, {
      achievements: arrayUnion(achievementId)
  }, { merge: true });
};

export const unlockWeapon = async (gameId: string, weapon: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  
  const docRef = doc(db, "users", uid, "games", gameId);
  await setDoc(docRef, {
      unlockedWeapons: arrayUnion(weapon)
  }, { merge: true });
};
