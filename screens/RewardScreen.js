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
import { calculateTotalPoints, calculateAchievements, calculateConsecutiveCorrect } from "../utils/achievementService";
import { loadStreak } from "../utils/streakService";

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
      const { data: allData } = await supabase
        .from("result")
        .select(`id, scan_date, material (material_name)`)
        .eq("user_id", user.id)
        .order("scan_date", { ascending: false });

      if (allData) {
        const mappedAll = allData.map(item => ({
          ...item,
          material: item.material
        }));

        const streakCount = await loadStreak(user.id);
        const achievementsList = calculateAchievements(mappedAll, streakCount);
        const consecutiveCorrect = calculateConsecutiveCorrect(mappedAll);
        const totalPoints = calculateTotalPoints(mappedAll, achievementsList, consecutiveCorrect);
        
        setPoints(totalPoints);

        // สร้างประวัติคะแนนจากการสแกน (2 แต้มต่อชิ้น)
        const historyData = mappedAll.map(item => ({
          id: item.id.toString(),
          title: `สแกนขยะ (${item.material?.material_name || 'Unknown'})`,
          points: "+2 XP",
          date: new Date(item.scan_date).toLocaleString('th-TH', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          icon: "camera-iris",
        }));
        
        // เพิ่มโบนัส Achievements เข้าไปบนสุด (ไม่มีวันที่ที่แน่นอน)
        const unlockedAchievements = achievementsList.filter(a => a.unlocked);
        unlockedAchievements.forEach(ach => {
          historyData.unshift({
            id: `ach_${ach.id}`,
            title: `ปลดล็อก: ${ach.title}`,
            points: `+${ach.points} XP`,
            date: "Achievement Bonus",
            icon: ach.icon,
            isAchievement: true
          });
        });

        setHistory(historyData);
      }
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
              <View style={[styles.historyIconBox, item.isAchievement && { backgroundColor: '#FFD700' }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.isAchievement ? "#B8860B" : "#1E6C5B"} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{item.title}</Text>
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
  historyDate: { fontSize: 12, color: "#999", marginTop: 4 },
  historyPoints: { fontSize: 16, fontWeight: "bold", color: "#1E6C5B" },
});
