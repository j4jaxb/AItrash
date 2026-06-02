import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import { fetchGameHistory, calculateGameStats } from "../utils/gameService";

export default function GameHubScreen({ navigation, user }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [catcherStats, setCatcherStats] = useState({ completedToday: false, currentStreak: 0 });
  const [memoryStats, setMemoryStats] = useState({ completedToday: false, currentStreak: 0 });

  const loadStats = async () => {
    try {
      if (!user?.id) return;
      const historyList = await fetchGameHistory(user.id);
      setHistory(historyList);
      
      const catcher = calculateGameStats(historyList, "catcher");
      const memory = calculateGameStats(historyList, "memory");

      setCatcherStats(catcher);
      setMemoryStats(memory);
    } catch (e) {
      console.log("Error loading game stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [user])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#0F3D34" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>มินิเกมสะสมแต้ม</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* BANNER */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerInfo}>
            <MaterialCommunityIcons name="leaf" size={40} color="#FFD700" />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.bannerTitle}>Earn Extra XP Daily!</Text>
              <Text style={styles.bannerDesc}>
                เล่นเกมประลองสมองและความเร็วเพื่อรับสูงสุด 10 XP ต่อวัน + โบนัสความต่อเนื่องสัปดาห์ละ 20 XP ต่อเกม!
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>เลือกมินิเกมของคุณ</Text>

        {/* GAME 1 CARD */}
        <View style={styles.gameCard}>
          <View style={styles.gameIconWrapper}>
            <MaterialCommunityIcons name="weather-pouring" size={32} color="#1E6C5B" />
          </View>
          <View style={styles.gameInfoWrapper}>
            <View style={styles.gameTitleRow}>
              <Text style={styles.gameName}>เกมฝนขยะ</Text>
              <View style={styles.xpLabel}>
                <Text style={styles.xpLabelText}>+5 XP</Text>
              </View>
            </View>
            <Text style={styles.gameDesc}>
              ขยะจะร่วงลงมา! คอยบังคับถังขยะเก็บขยะประเภทที่โจทย์สุ่มเลือกเพื่อสะสมคะแนนให้ครบ 30 แต้ม
            </Text>
            
            {/* STATS */}
            <View style={styles.streakRow}>
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="fire" size={16} color="#E65100" />
                <Text style={styles.statPillText}>สตรีค: {catcherStats.currentStreak} วัน</Text>
              </View>
              <View style={[styles.statPill, catcherStats.completedToday ? styles.pillDone : styles.pillPlay]}>
                <Ionicons name={catcherStats.completedToday ? "checkmark-circle" : "ellipse-outline"} size={14} color={catcherStats.completedToday ? "#059669" : "#666"} />
                <Text style={[styles.statPillText, catcherStats.completedToday && { color: "#059669" }]}>
                  {catcherStats.completedToday ? "รับ XP แล้ว" : "วันนี้ยังไม่ได้เล่น"}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.playBtn, catcherStats.completedToday && styles.playBtnDisabled]}
              onPress={() => navigation.navigate("TrashCatcherGame")}
            >
              <Text style={styles.playBtnText}>
                {catcherStats.completedToday ? "เล่นอีกครั้ง (ไม่ได้แต้มเพิ่ม)" : "เริ่มเล่นเกม"}
              </Text>
              <Ionicons name="play" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* GAME 2 CARD */}
        <View style={styles.gameCard}>
          <View style={styles.gameIconWrapper}>
            <MaterialCommunityIcons name="cards-outline" size={32} color="#1E6C5B" />
          </View>
          <View style={styles.gameInfoWrapper}>
            <View style={styles.gameTitleRow}>
              <Text style={styles.gameName}>เกมจับคู่การ์ดความจำ</Text>
              <View style={styles.xpLabel}>
                <Text style={styles.xpLabelText}>+5 XP</Text>
              </View>
            </View>
            <Text style={styles.gameDesc}>
              ประลองความจำ! จับคู่รูปภาพขยะกับสัญลักษณ์รีไซเคิล/ประเภทวัสดุ (เช่น ขวดน้ำกับ PETE) ให้ครบทุกคู่
            </Text>
            
            {/* STATS */}
            <View style={styles.streakRow}>
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="fire" size={16} color="#E65100" />
                <Text style={styles.statPillText}>สตรีค: {memoryStats.currentStreak} วัน</Text>
              </View>
              <View style={[styles.statPill, memoryStats.completedToday ? styles.pillDone : styles.pillPlay]}>
                <Ionicons name={memoryStats.completedToday ? "checkmark-circle" : "ellipse-outline"} size={14} color={memoryStats.completedToday ? "#059669" : "#666"} />
                <Text style={[styles.statPillText, memoryStats.completedToday && { color: "#059669" }]}>
                  {memoryStats.completedToday ? "รับ XP แล้ว" : "วันนี้ยังไม่ได้เล่น"}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.playBtn, memoryStats.completedToday && styles.playBtnDisabled]}
              onPress={() => navigation.navigate("MemoryGame")}
            >
              <Text style={styles.playBtnText}>
                {memoryStats.completedToday ? "เล่นอีกครั้ง (ไม่ได้แต้มเพิ่ม)" : "เริ่มเล่นเกม"}
              </Text>
              <Ionicons name="play" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F8F7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  scrollContent: { padding: 20 },
  bannerCard: {
    backgroundColor: "#0F3D34",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bannerInfo: { flexDirection: "row", alignItems: "center" },
  bannerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF", marginBottom: 5 },
  bannerDesc: { fontSize: 12, color: "#CFDAD9", lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#0F3D34", marginBottom: 15 },
  gameCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E4ECE8",
    elevation: 1,
  },
  gameIconWrapper: {
    width: 60,
    height: 60,
    backgroundColor: "#EAF4F0",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  gameInfoWrapper: { flex: 1 },
  gameTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  gameName: { fontSize: 16, fontWeight: "bold", color: "#0F3D34" },
  xpLabel: { backgroundColor: "#FFD700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  xpLabelText: { fontSize: 10, fontWeight: "bold", color: "#856600" },
  gameDesc: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 12 },
  streakRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F9F8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E0ECE8",
  },
  pillPlay: { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" },
  pillDone: { backgroundColor: "#E8F5E9", borderColor: "#C8E6C9" },
  statPillText: { fontSize: 11, color: "#666", fontWeight: "bold", marginLeft: 4 },
  playBtn: {
    backgroundColor: "#1E6C5B",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  playBtnDisabled: { backgroundColor: "#789F97" },
  playBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14, marginRight: 8 },
});
