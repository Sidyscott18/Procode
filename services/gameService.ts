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
  await setDoc(docRef, data, { merge: true });
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
    
    // Level calculation: level = floor(sqrt(xp / 100)) + 1
    // Example formula, adjust as needed. Or just simply increment if they provided a formula, wait, they said "using your level calculation".
    // I will just use a generic one: each level takes (level * 100) XP. 
    // Or just simple math: Level 1 is 0-100, Level 2 is 100-300, Level 3 is 300-600.
    let newLevel = 1;
    let requiredXp = 0;
    while (newXp >= requiredXp + (newLevel * 100)) {
        requiredXp += (newLevel * 100);
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
          level: 1
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
