import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

const ASYNC_STORAGE_KEY = "@aitrash:game_plays";
const isWebStorageAvailable = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
let hasAsyncStorageFailure = false;

const getStorageItem = async (key) => {
  if (!hasAsyncStorageFailure && AsyncStorage && typeof AsyncStorage.getItem === "function") {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      hasAsyncStorageFailure = true;
    }
  }

  if (isWebStorageAvailable) {
    try {
      return window.localStorage.getItem(key);
    } catch (_err) {
      // ignore
    }
  }

  return null;
};

const setStorageItem = async (key, value) => {
  if (!hasAsyncStorageFailure && AsyncStorage && typeof AsyncStorage.setItem === "function") {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (err) {
      hasAsyncStorageFailure = true;
    }
  }

  if (isWebStorageAvailable) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (_err) {
      // ignore
    }
  }

  return false;
};

/**
 * แปลงวันที่เป็น YYYY-MM-DD ใน Timezone ท้องถิ่น
 */
const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split("T")[0];
};

/**
 * ตรวจสอบความต่อเนื่องของสองวัน
 */
const isConsecutiveDays = (dateStr1, dateStr2) => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

/**
 * ดึงประวัติการเล่นเกมทั้งหมดจาก AsyncStorage
 */
export const getLocalGameHistory = async () => {
  try {
    const data = await getStorageItem(ASYNC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.log("Error loading local game history:", err);
    return [];
  }
};

/**
 * ดึงประวัติการเล่นเกมทั้งหมดจาก Supabase (ถ้ามีตาราง)
 */
export const getCloudGameHistory = async (userId) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("game_play")
      .select("id, game_type, played_date, points_earned")
      .eq("user_id", userId);
    
    if (error) {
      // ตารางยังไม่ได้สร้าง หรือไม่มีสิทธิ์
      console.log("Supabase game_play query returned error (might not exist):", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.log("Error querying Supabase game_play:", err);
    return [];
  }
};

/**
 * โหลดประวัติการเล่นเกมแบบ Sync ระหว่าง Cloud และ Local
 */
export const fetchGameHistory = async (userId) => {
  const localData = await getLocalGameHistory();
  if (!userId) return localData;

  const cloudData = await getCloudGameHistory(userId);
  
  // รวมข้อมูลและขจัดข้อมูลซ้ำซ้อน (อิงตาม date + game_type)
  const mergedMap = new Map();
  
  localData.forEach(item => {
    const key = `${item.played_date}:${item.game_type}`;
    mergedMap.set(key, item);
  });
  
  cloudData.forEach(item => {
    const key = `${item.played_date}:${item.game_type}`;
    // ถ้ามีข้อมูลบนคลาวด์ ให้เขียนทับหรือเพิ่มเข้าไป
    mergedMap.set(key, {
      game_type: item.game_type,
      played_date: item.played_date,
      points_earned: item.points_earned,
    });
  });

  const mergedList = Array.from(mergedMap.values());

  // บันทึกกลับลง AsyncStorage หรือ web localStorage เพื่ออัปเดตข้อมูลให้ตรงกัน
  try {
    await setStorageItem(ASYNC_STORAGE_KEY, JSON.stringify(mergedList));
  } catch (e) {
    console.log("Failed to cache synced game history:", e);
  }

  return mergedList;
};

/**
 * บันทึกผลการชนะเกม (ได้ 5 XP)
 */
export const recordGamePlay = async (userId, gameType) => {
  const todayStr = getLocalDateString();
  const record = {
    game_type: gameType,
    played_date: todayStr,
    points_earned: 5,
  };

  // โหลดและตรวจสอบประวัติปัจจุบัน
  const history = await getLocalGameHistory();
  const alreadyPlayedToday = history.some(
    item => item.played_date === todayStr && item.game_type === gameType
  );

  if (alreadyPlayedToday) {
    return { success: true, message: "Today's reward already claimed." };
  }

  const updatedHistory = [...history, record];
  
  try {
    await setStorageItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.log("Error saving game record locally:", e);
  }

  // พยายามอัปเดตขึ้น Supabase
  if (userId) {
    try {
      const { error } = await supabase
        .from("game_play")
        .insert([{
          user_id: userId,
          game_type: gameType,
          played_date: todayStr,
          points_earned: 5
        }]);
      
      if (error) {
        console.log("Supabase insert failed (can fallback to local):", error.message);
      }
    } catch (err) {
      console.log("Network error syncing to Supabase:", err);
    }
  }

  return { success: true, pointsEarned: 5 };
};

/**
 * คำนวณสถานะของแต่ละเกม (สถิติการเล่น, สตีกปัจจุบัน, เล่นเสร็จวันนี้หรือยัง)
 */
export const calculateGameStats = (historyList, gameType) => {
  const gameHistory = historyList
    .filter(item => item.game_type === gameType)
    .sort((a, b) => new Date(a.played_date) - new Date(b.played_date));

  const uniqueDates = Array.from(new Set(gameHistory.map(h => h.played_date))).sort();
  
  const todayStr = getLocalDateString();
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  
  const completedToday = uniqueDates.includes(todayStr);
  const completedYesterday = uniqueDates.includes(yesterdayStr);

  let currentStreak = 0;

  if (completedToday || completedYesterday) {
    // นับสตรีกล่าสุดถอยหลัง
    let checkDate = completedToday ? new Date(todayStr) : new Date(yesterdayStr);
    currentStreak = 0;
    
    while (true) {
      const checkDateStr = getLocalDateString(checkDate);
      if (uniqueDates.includes(checkDateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    completedToday,
    currentStreak,
    totalPlays: uniqueDates.length,
  };
};

/**
 * คำนวณคะแนนรวมทั้งหมดที่ได้จากเกมและแต้มโบนัสคาร์บอน
 */
export const calculateGamePoints = (historyList) => {
  let dailyPoints = 0;
  let catcherStreakBonus = 0;
  let memoryStreakBonus = 0;

  // 1. แต้มรายวัน (5 XP ต่อวันต่อเกม)
  const catcherDates = Array.from(new Set(historyList.filter(item => item.game_type === "catcher").map(item => item.played_date))).sort();
  const memoryDates = Array.from(new Set(historyList.filter(item => item.game_type === "memory").map(item => item.played_date))).sort();

  dailyPoints += catcherDates.length * 5;
  dailyPoints += memoryDates.length * 5;

  // 2. แต้มโบนัสเล่นติดต่อกันครบ 7 วัน (+20 XP ต่อครั้ง)
  const calculateStreakBonus = (dates) => {
    if (dates.length === 0) return 0;
    
    let bonus = 0;
    let currentStreakLength = 1;

    for (let i = 0; i < dates.length - 1; i++) {
      const d1 = new Date(dates[i]);
      const d2 = new Date(dates[i+1]);
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreakLength++;
      } else {
        // จบช่วงสตรีค
        bonus += Math.floor(currentStreakLength / 7) * 20;
        currentStreakLength = 1;
      }
    }
    // บวกส่วนที่เหลือตอนท้าย
    bonus += Math.floor(currentStreakLength / 7) * 20;
    return bonus;
  };

  catcherStreakBonus = calculateStreakBonus(catcherDates);
  memoryStreakBonus = calculateStreakBonus(memoryDates);

  return {
    totalGamePoints: dailyPoints + catcherStreakBonus + memoryStreakBonus,
    dailyPoints,
    catcherStreakBonus,
    memoryStreakBonus,
  };
};
