import { loadStreak } from "./streakService";

export const calculateAchievements = (allData, streak) => {
  const totalScans = allData.length;
  
  const hasFirstScan = totalScans >= 1;
  const hasCentury = totalScans >= 100;
  const has3Days = streak >= 3;
  const hasWeekly = streak >= 7;
  const hasMonthly = streak >= 30;

  let hasFastScanner = false;
  if (totalScans >= 5) {
    const dates = allData.map(d => new Date(d.scan_date).getTime()).sort((a,b) => a - b);
    for (let i = 0; i <= dates.length - 5; i++) {
      if (dates[i+4] - dates[i] <= 60000) {
        hasFastScanner = true;
        break;
      }
    }
  }

  const hasAccurate = totalScans >= 10; 

  let hasMixedMaster = false;
  const datesMap = {};
  allData.forEach(d => {
    if (!d.scan_date) return;
    const dateStr = new Date(d.scan_date).toISOString().split('T')[0];
    if (!datesMap[dateStr]) datesMap[dateStr] = new Set();
    const name = d.material?.material_name;
    if (name) datesMap[dateStr].add(name.toLowerCase());
  });
  
  const plastics = ["pete", "hdpe", "pvc", "ldpe", "pp", "ps"];
  for (const date in datesMap) {
    let count = 0;
    plastics.forEach(p => {
      if (datesMap[date].has(p)) count++;
    });
    if (count >= 6 || datesMap[date].size >= 6) { 
      hasMixedMaster = true;
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
    { id: 8, title: "Mixed Master", desc: "ครบทุกประเภท/วัน", icon: "recycle", unlocked: hasMixedMaster, points: 30 },
  ];
};

export const calculateTotalPoints = (allData, achievementsList, consecutiveCorrect) => {
  let points = 0;

  allData.forEach(item => {
    const name = item.material?.material_name?.toUpperCase();
    if (!name) return;
    
    points += 2; // ขยะสแกนได้ชิ้นละ 2 แต้ม
  });

  if (achievementsList) {
    achievementsList.forEach(ach => {
      if (ach.unlocked) {
        points += ach.points;
      }
    });
  }

  points += consecutiveCorrect * 1; // ปรับสมดุลโบนัสต่อเนื่อง

  return points;
};

export const calculateConsecutiveCorrect = (allData) => {
  const sevenPlastics = ["PETE", "HDPE", "PVC", "LDPE", "PP", "PS"];
  let consecutiveCorrect = 0;
  const sortedScans = [...allData].sort((a,b) => new Date(b.scan_date) - new Date(a.scan_date));
  for (const scan of sortedScans) {
    if (sevenPlastics.includes(scan.material?.material_name?.toUpperCase())) {
      consecutiveCorrect++;
    } else {
      break;
    }
  }
  return consecutiveCorrect;
};
