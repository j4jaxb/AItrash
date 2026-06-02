import { loadStreak } from "./streakService";
import { calculateGamePoints } from "./gameService";

const isCountedResult = (item) => {
  if (!item) return false;
  if (item.edit === 0) return false;
  if (item.is_manual === true) return false;
  return true;
};

// Check if a week is completed (7 full days have passed since start)
const isWeekCompleted = (goalStartDate) => {
  if (!goalStartDate) return false;
  const startDate = new Date(goalStartDate);
  const weekEnd = new Date(startDate);
  weekEnd.setDate(weekEnd.getDate() + 7); // Add 7 days
  const now = new Date();
  return now >= weekEnd;
};

// Count scans in a specific week range
const countScansInWeek = (allData, startDate, endDate) => {
  return (allData || []).filter(item => {
    const itemDate = new Date(item.scan_date);
    return isCountedResult(item) && itemDate >= startDate && itemDate < endDate;
  }).length;
};
// Check if any completed week since goal_start_date has met the target
const hasMetWeeklyGoal = (allData, goalTarget, goalStartDate) => {
  if (!goalTarget || !goalStartDate) return false;
  
  const startDate = new Date(goalStartDate);
  const now = new Date();
  
  // Check each 7-day period since goal start
  let weekStart = new Date(startDate);
  while (weekStart < now) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // If this week is completed
    if (weekEnd <= now) {
      const weekScans = countScansInWeek(allData, weekStart, weekEnd);
      if (weekScans >= goalTarget) {
        return true;
      }
    }
    
    // Move to next week
    weekStart = new Date(weekEnd);
  }
  
  return false;
};
export const calculateAchievements = (allData, streak, goalTarget, goalStartDate, goalXp) => {
  const cleanData = (allData || []).filter(isCountedResult);
  const totalScans = cleanData.length;
  
  const hasFirstScan = totalScans >= 1;
  const hasCentury = totalScans >= 100;
  const has3Days = streak >= 3;
  const hasWeekly = streak >= 7;
  const hasMonthly = streak >= 30;

  // Check Weekly Goal: any completed week since goal start has met target
  const hasWeeklyGoal = hasMetWeeklyGoal(allData, goalTarget, goalStartDate);

  let hasFastScanner = false;
  if (totalScans >= 5) {
    const dates = cleanData.map(d => new Date(d.scan_date).getTime()).sort((a,b) => a - b);
    for (let i = 0; i <= dates.length - 5; i++) {
      if (dates[i+4] - dates[i] <= 60000) {
        hasFastScanner = true;
        break;
      }
    }
  }

  const hasAccurate = totalScans >= 10; 

  let hasPlasticMaster = false;
  const datesMap = {};
  cleanData.forEach(d => {
    if (!d.scan_date) return;
    const dateStr = new Date(d.scan_date).toISOString().split('T')[0];
    if (!datesMap[dateStr]) datesMap[dateStr] = new Set();
    const name = d.material?.material_name?.toUpperCase();
    if (name) datesMap[dateStr].add(name);
  });
  
  const requiredCategories = ["PETE", "HDPE", "PVC", "LDPE", "PP", "PS"];
  for (const date in datesMap) {
    const categorySet = datesMap[date];
    const hasAllCategories = requiredCategories.every((category) => categorySet.has(category));
    if (hasAllCategories) {
      hasPlasticMaster = true;
      break;
    }
  }

  return [
    { id: 1, title: "First Scan", desc: "สแกนครั้งแรก", icon: "camera-iris", unlocked: hasFirstScan, points: 10 },
    { id: 2, title: "PET Hunter", desc: "สแกนครบ 100", icon: "bullseye-arrow", unlocked: hasCentury, points: 50 },
    { id: 3, title: "3 Days Streak", desc: "แสกนติดกัน 3 วัน", icon: "fire", unlocked: has3Days, points: 15 },
    { id: 4, title: "Weekly Recycler", desc: "แสกนติดกัน 7 วัน", icon: "calendar-week", unlocked: hasWeekly, points: 40 },
    { id: 5, title: "Monthly Recycler", desc: "แสกน 30 วัน", icon: "calendar-month", unlocked: hasMonthly, points: 150 },
    { id: 6, title: "Fast Scanner", desc: "5 ชิ้น ใน 1 นาที", icon: "lightning-bolt", unlocked: hasFastScanner, points: 20 },
    { id: 7, title: "Accurate Sorter", desc: "ความแม่นยำสูง", icon: "brain", unlocked: hasAccurate, points: 20 },
    { id: 8, title: "Plastic Master", desc: "สแกนครบพลาสติก 6 ชนิด/วัน", icon: "recycle", unlocked: hasPlasticMaster, points: 30 },
    { id: 9, title: "Weekly Goal", desc: "สำเร็จเป้าหมายประจำสัปดาห์", icon: "target", unlocked: hasWeeklyGoal, points: goalXp || 50 },
  ];
};
export const calculateCO2 = (materialName) => {
  const name = materialName?.toUpperCase();
  if (name?.includes("PETE") || name?.includes("PLASTIC")) return 0.05;
  if (name?.includes("GLASS")) return 0.1;
  if (name?.includes("METAL") || name?.includes("CAN")) return 0.2;
  return 0.02;
};

export const calculateTotalPoints = (allData, achievementsList, gameHistoryList) => {
  let points = 0;
  const dailyCategoryCount = {};

  const cleanData = (allData || []).filter(isCountedResult);

  // คำนวณคาร์บอนสะสมทั้งหมดจากข้อมูลที่นับคะแนนได้
  let totalCO2 = 0;
  cleanData.forEach(item => {
    totalCO2 += calculateCO2(item.material?.material_name);
  });

  // โบนัสคาร์บอนสะสม: ทุกๆ 0.5 kg จะได้รับโบนัส 10 XP
  const carbonPoints = Math.floor(totalCO2 / 0.5) * 10;
  points += carbonPoints;

  cleanData.forEach(item => {
    const dateStr = item.scan_date ? new Date(item.scan_date).toISOString().split('T')[0] : "unknown";
    const name = item.material?.material_name?.toUpperCase() || "UNKNOWN";
    const key = `${dateStr}:${name}`;
    const count = dailyCategoryCount[key] || 0;

    if (count < 10) {
      points += 2; // ขยะสแกนได้ชิ้นละ 2 แต้ม
      dailyCategoryCount[key] = count + 1;
    }
  });

  if (achievementsList) {
    achievementsList.forEach(ach => {
      if (ach.unlocked) {
        points += ach.points;
      }
    });
  }

  // คำนวณคะแนนและโบนัสจากมินิเกม
  if (gameHistoryList) {
    const { totalGamePoints } = calculateGamePoints(gameHistoryList);
    points += totalGamePoints;
  }

  return points;
};
