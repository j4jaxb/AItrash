import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase";
import { calculateTotalPoints, calculateAchievements, calculateCO2 } from "../utils/achievementService";
import { loadStreak } from "../utils/streakService";
import { fetchUserResults } from "../utils/resultService";
import { fetchGameHistory, calculateGamePoints } from "../utils/gameService";

export default function RewardScreen({ route, navigation }) {
  const { user } = route.params;
  const [activeTab, setActiveTab] = useState("rewards"); // 'rewards' or 'history'
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch goal data
      let goalTarget = null;
      let goalStartDate = null;
      let goalXp = 50;
      try {
        const { data: userData } = await supabase
          .from("user")
          .select("goal_target, goal_start_date, goal_xp")
          .eq("id", user.id)
          .single();
        if (userData) {
          goalTarget = userData.goal_target;
          goalStartDate = userData.goal_start_date;
          if (userData.goal_xp) goalXp = userData.goal_xp;
        }
      } catch (e) {
        // Ignore if columns don't exist
      }

      const allData = await fetchUserResults({
        userId: user.id,
        orderBy: "scan_date",
        ascending: false,
      });

      const gameHistory = await fetchGameHistory(user.id);
      const mappedAll = (allData || []).map(item => ({
        ...item,
        material: item.material
      }));

      const streakCount = await loadStreak(user.id);
      const achievementsList = calculateAchievements(mappedAll, streakCount, goalTarget, goalStartDate, goalXp);
      const totalPoints = calculateTotalPoints(mappedAll, achievementsList, gameHistory);
      
      setPoints(totalPoints);

      // คำนวณคาร์บอนสะสมทั้งหมดจากขยะที่ไม่ได้แก้ไขด้วยมือ
      const cleanData = mappedAll.filter(item => !(item.edit === 0 || item.is_manual));
      let totalCO2 = 0;
      cleanData.forEach(item => {
        totalCO2 += calculateCO2(item.material?.material_name);
      });

      // สร้างประวัติคะแนนจากการสแกน (ได้ 2 แต้มฐานต่อการสแกน)
      const historyData = mappedAll.map(item => {
        const isManual = item.edit === 0 || item.is_manual;
        const co2 = calculateCO2(item.material?.material_name);
        return {
          id: item.id.toString(),
          title: `สแกนขยะ (${item.material?.material_name || 'Unknown'})`,
          points: isManual ? "+0 XP" : "+2 XP",
          subtitle: isManual 
            ? "แก้ไขด้วยมือ - ไม่ได้คะแนน" 
            : `ได้รับแต้มฐานสแกน +2 XP (ลด CO₂ ได้ ${co2}kg)`,
          date: new Date(item.scan_date).toLocaleString('th-TH', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          timestamp: new Date(item.scan_date).getTime(),
          icon: "camera-iris",
        };
      });

      // เพิ่มประวัติการเล่นเกมมินิเกมรายวัน
      gameHistory.forEach(item => {
        historyData.push({
          id: `game_${item.game_type}_${item.played_date}`,
          title: item.game_type === "catcher" ? "เล่นเกมฝนขยะสำเร็จ" : "เล่นเกมจับคู่การ์ดความจำสำเร็จ",
          points: "+5 XP",
          subtitle: "โบนัสผ่านด่านประจำวัน",
          date: new Date(item.played_date).toLocaleDateString('th-TH', { 
            year: 'numeric', month: 'short', day: 'numeric'
          }),
          timestamp: new Date(item.played_date).getTime(),
          icon: "gamepad-variant",
        });
      });

      // เรียงลำดับประวัติการสแกนและเกมรวมกัน (จากใหม่ไปเก่าตามเวลาจริง)
      historyData.sort((a, b) => b.timestamp - a.timestamp);

      // เพิ่มโบนัสสะสมคาร์บอน (ทุกๆ 0.5 kg = 10 XP)
      const accumulatedCarbonPoints = Math.floor(totalCO2 / 0.5) * 10;
      if (accumulatedCarbonPoints > 0) {
        historyData.unshift({
          id: "carbon_bonus",
          title: "โบนัสลดคาร์บอนสะสม",
          points: `+${accumulatedCarbonPoints} XP`,
          subtitle: `สะสมคาร์บอนรวมได้ ${totalCO2.toFixed(2)} kg (รับโบนัส +10 XP ทุกๆ 0.5 kg)`,
          date: "Carbon Savings Bonus",
          icon: "leaf",
          isAchievement: true,
          timestamp: 0
        });
      }

      // เพิ่มโบนัสสตรีคมินิเกม (7 วันติดต่อกัน +20 XP)
      const { catcherStreakBonus, memoryStreakBonus } = calculateGamePoints(gameHistory);

      // Helper: find completion dates for each 7-day streak instance
      const findStreakCompletionDates = (dates) => {
        const results = [];
        if (!dates || dates.length === 0) return results;
        // ensure sorted ascending
        const d = Array.from(new Set(dates)).sort((a,b) => new Date(a) - new Date(b));

        let segStart = 0;
        for (let i = 0; i < d.length; i++) {
          const isLast = i === d.length - 1;
          const nextDiffIsMoreThan1 = !isLast && (Math.round((new Date(d[i+1]) - new Date(d[i])) / (1000*60*60*24)) !== 1);

          if (nextDiffIsMoreThan1 || isLast) {
            // segment is from segStart..i
            const segLen = i - segStart + 1;
            const completeCount = Math.floor(segLen / 7);
            for (let k = 1; k <= completeCount; k++) {
              const completionIndex = segStart + (7 * k) - 1;
              const completionDate = d[completionIndex];
              results.push(completionDate);
            }
            segStart = i + 1;
          }
        }

        return results;
      };

      // attach streak bonus entries with real timestamps so they sort by time received
      const catcherCompletions = findStreakCompletionDates(gameHistory.filter(h => h.game_type === 'catcher').map(h => h.played_date));
      catcherCompletions.forEach((dateStr, idx) => {
        historyData.push({
          id: `catcher_streak_bonus_${idx}_${dateStr}`,
          title: "โบนัสสตรีค 7 วัน: เกมฝนขยะ",
          points: `+20 XP`,
          subtitle: "ผ่านด่านมินิเกมฝนขยะต่อเนื่องครบ 7 วัน",
          date: new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
          timestamp: new Date(dateStr).getTime(),
          icon: "fire",
          isStreakBonus: true
        });
      });

      const memoryCompletions = findStreakCompletionDates(gameHistory.filter(h => h.game_type === 'memory').map(h => h.played_date));
      memoryCompletions.forEach((dateStr, idx) => {
        historyData.push({
          id: `memory_streak_bonus_${idx}_${dateStr}`,
          title: "โบนัสสตรีค 7 วัน: เกมจับคู่การ์ด",
          points: `+20 XP`,
          subtitle: "ผ่านด่านมินิเกมการ์ดความจำต่อเนื่องครบ 7 วัน",
          date: new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
          timestamp: new Date(dateStr).getTime(),
          icon: "fire",
          isStreakBonus: true
        });
      });

      // เพิ่มโบนัส Achievements เข้าไปบนสุด (ไม่มีวันที่ที่แน่นอน)
      const unlockedAchievements = achievementsList.filter(a => a.unlocked);
      unlockedAchievements.forEach(ach => {
        historyData.unshift({
          id: `ach_${ach.id}`,
          title: `ปลดล็อก: ${ach.title}`,
          points: `+${ach.points} XP`,
          date: "Achievement Bonus",
          icon: ach.icon,
          isAchievement: true,
          timestamp: 0
        });
      });

      // Final sort: order by timestamp (newest first). Items without timestamps sink to bottom.
      historyData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setHistory(historyData);
    } catch (err) {
      console.log("Error loading rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const rewardsList = [
    { id: 1, title: "คูปองส่วนลด 10 บาท", desc: "ใช้เป็นส่วนลดที่ร้านค้าพันธมิตร", points: 300, icon: "ticket-percent-outline" },
    { id: 2, title: "กาแฟฟรี 1 แก้ว", desc: "รับกาแฟฟรี 1 แก้วที่ EcoCafe", points: 1000, icon: "coffee-outline" },
    { id: 3, title: "ถุงผ้าลดโลกร้อน", desc: "แลกรับถุงผ้าพรีเมียมจากโครงการ", points: 5000, icon: "shopping-outline" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>คะแนนสะสมและของรางวัล</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.pointsCard}>
        <MaterialCommunityIcons name="leaf-circle" size={48} color="#1E6C5B" />
        <Text style={styles.pointsValue}>{points}</Text>
        <Text style={styles.pointsLabel}>XP คะแนนของคุณ</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === "rewards" && styles.activeTabBtn]} 
          onPress={() => setActiveTab("rewards")}
        >
          <Text style={[styles.tabText, activeTab === "rewards" && styles.activeTabText]}>แลกของรางวัล</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === "history" && styles.activeTabBtn]} 
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>ประวัติคะแนน</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F3D34" style={{ marginTop: 50 }} />
      ) : activeTab === "rewards" ? (
        <ScrollView style={styles.contentScroll}>
          {rewardsList.map(reward => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardIconBox}>
                <MaterialCommunityIcons name={reward.icon} size={32} color="#1E6C5B" />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDesc}>{reward.desc}</Text>
                <Text style={styles.rewardPoints}>{reward.points} XP</Text>
              </View>
              <TouchableOpacity 
                style={[styles.redeemBtn, points < reward.points && styles.redeemBtnDisabled]}
                disabled={points < reward.points}
              >
                <Text style={styles.redeemBtnText}>แลกรับ</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.contentScroll}>
          {history.length > 0 ? history.map((item, index) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={[
                styles.historyIconBox,
                item.isAchievement && { backgroundColor: '#FFD700' },
                item.isStreakBonus && { backgroundColor: '#EDE9FE' }
              ]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.isStreakBonus ? "#6D28D9" : (item.isAchievement ? "#B8860B" : "#1E6C5B")} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.historySubtitle}>{item.subtitle}</Text>
                ) : null}
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <Text style={styles.historyPoints}>{item.points}</Text>
            </View>
          )) : (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>ยังไม่มีประวัติคะแนน</Text>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFF" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  pointsCard: { backgroundColor: "#FFF", margin: 20, padding: 30, borderRadius: 20, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  pointsValue: { fontSize: 36, fontWeight: "bold", color: "#0F3D34", marginTop: 10 },
  pointsLabel: { fontSize: 14, color: "#666", marginTop: 5 },
  tabContainer: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#E4ECE8", borderRadius: 12, padding: 5, marginBottom: 15 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  activeTabBtn: { backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 15, color: "#666", fontWeight: "600" },
  activeTabText: { color: "#0F3D34", fontWeight: "bold" },
  contentScroll: { flex: 1, paddingHorizontal: 20 },
  rewardCard: { flexDirection: "row", backgroundColor: "#FFF", padding: 15, borderRadius: 15, marginBottom: 15, alignItems: "center", elevation: 1 },
  rewardIconBox: { width: 60, height: 60, backgroundColor: "#EAF4F0", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: "bold", color: "#0F3D34" },
  rewardDesc: { fontSize: 12, color: "#666", marginVertical: 4 },
  rewardPoints: { fontSize: 14, fontWeight: "bold", color: "#1E6C5B" },
  redeemBtn: { backgroundColor: "#1E6C5B", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  redeemBtnDisabled: { backgroundColor: "#ccc" },
  redeemBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  historyCard: { flexDirection: "row", backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 10, alignItems: "center" },
  historyIconBox: { width: 40, height: 40, backgroundColor: "#EAF4F0", borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 15 },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: "bold", color: "#333" },
  historySubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  historyDate: { fontSize: 11, color: "#999", marginTop: 4 },
  historyPoints: { fontSize: 16, fontWeight: "bold", color: "#1E6C5B" },
});
