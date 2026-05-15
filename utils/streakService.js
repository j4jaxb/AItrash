import { supabase } from "../supabase";

/**
 * ฟังก์ชันคำนวณจำนวนวันติดต่อกันที่สแกน
 * @param {Array} scans - รายการสแกนทั้งหมดที่เรียงลำดับจากใหม่ไปเก่า
 * @returns {number} จำนวนวันติดต่อกัน
 */
const calculateStreakFromScans = (scans) => {
  if (!scans || scans.length === 0) return 0;

  // เรียงลำดับจากใหม่ไปเก่า
  const sortedScans = [...scans].sort(
    (a, b) => new Date(b.scan_date) - new Date(a.scan_date)
  );

  // ดึงวันที่ของแต่ละสแกนและกำจัดซ้ำ
  const uniqueDays = new Set();
  sortedScans.forEach((scan) => {
    const date = new Date(scan.scan_date);
    const dayString = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    uniqueDays.add(dayString);
  });

  // แปลงเป็น array และเรียงลำดับจากใหม่ไปเก่า
  const days = Array.from(uniqueDays).sort().reverse();

  if (days.length === 0) return 0;

  // ตรวจสอบความติดต่อกันของวัน
  let streak = 1;
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  // ถ้าวันแรก (ใหม่ที่สุด) ไม่ใช่วันนี้หรือเมื่อวาน ให้รีเซตสตีก
  const firstDay = new Date(days[0]);
  const daysDifference = Math.floor(
    (today - firstDay) / (1000 * 60 * 60 * 24)
  );

  // ถ้าล่าสุดเกิน 1 วันที่แล้ว ให้รีเซตสตีก
  if (daysDifference > 1) {
    return 0;
  }

  // นับสตีก
  for (let i = 0; i < days.length - 1; i++) {
    const currentDay = new Date(days[i]);
    const nextDay = new Date(days[i + 1]);

    const diffInDays = Math.floor(
      (currentDay - nextDay) / (1000 * 60 * 60 * 24)
    );

    // ถ้าวันต่อไปห่างออกไปมากกว่า 1 วัน สตีกหยุด
    if (diffInDays !== 1) {
      break;
    }

    streak++;
  }

  return streak;
};

/**
 * โหลดสตีกจาก Supabase สำหรับ user
 * @param {string} userId - ID ของผู้ใช้
 * @returns {Promise<number>} จำนวนสตีก
 */
export const loadStreak = async (userId) => {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("result")
      .select("scan_date")
      .eq("user_id", userId)
      .order("scan_date", { ascending: false });

    if (error) {
      console.log("Error loading streak data:", error);
      return 0;
    }

    return calculateStreakFromScans(data || []);
  } catch (err) {
    console.log("Error in loadStreak:", err);
    return 0;
  }
};

export const calculateMaxStreakFromScans = (scans) => {
  if (!scans || scans.length === 0) return 0;
  const sortedScans = [...scans].sort((a, b) => new Date(a.scan_date) - new Date(b.scan_date));
  const uniqueDays = new Set(sortedScans.map(scan => new Date(scan.scan_date).toISOString().split("T")[0]));
  const days = Array.from(uniqueDays).sort();
  
  if (days.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 0; i < days.length - 1; i++) {
    const d1 = new Date(days[i]);
    const d2 = new Date(days[i + 1]);
    const diffInDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
};

export const loadMaxStreak = async (userId) => {
  if (!userId) return 0;
  try {
    const { data, error } = await supabase.from("result").select("scan_date").eq("user_id", userId).order("scan_date", { ascending: true });
    if (error) return 0;
    return calculateMaxStreakFromScans(data || []);
  } catch (err) {
    return 0;
  }
};

/**
 * ตรวจสอบว่าวันนี้มีสแกนแล้วหรือไม่
 * @param {string} userId - ID ของผู้ใช้
 * @returns {Promise<boolean>} true ถ้ามีสแกนวันนี้
 */
export const hasScannedToday = async (userId) => {
  if (!userId) return false;

  try {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const tomorrowString = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from("result")
      .select("id")
      .eq("user_id", userId)
      .gte("scan_date", `${todayString}T00:00:00`)
      .lt("scan_date", `${tomorrowString}T00:00:00`)
      .limit(1);

    if (error) {
      console.log("Error checking today's scans:", error);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (err) {
    console.log("Error in hasScannedToday:", err);
    return false;
  }
};

/**
 * ดึงข้อมูลสตีกทั้งหมด
 * @param {string} userId - ID ของผู้ใช้
 * @returns {Promise<Object>} { streak: number, scannedToday: boolean }
 */
export const getStreakData = async (userId) => {
  const [streak, scannedToday] = await Promise.all([
    loadStreak(userId),
    hasScannedToday(userId),
  ]);

  return { streak, scannedToday };
};
