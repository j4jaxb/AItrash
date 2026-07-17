import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase";
import { fetchAllUserResults } from "../utils/resultService";
import { calculateCO2 } from "../utils/achievementService";

export default function AdminUserDetailScreen({ route, navigation, setUser }) {
  const targetUser = route?.params?.user;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const loadUserDetails = async () => {
    if (!targetUser?.id) return;

    try {
      setLoading(true);
      const results = await fetchAllUserResults(targetUser.id);
      const scanCount = results.length;
      const co2Saved = results.reduce((sum, item) => sum + calculateCO2(item.material?.material_name), 0).toFixed(2);
      const score = scanCount * 2 + Math.floor(Number(co2Saved) * 10);

      const categoryCounts = {};
      results.forEach((item) => {
        const categoryName = item.material?.material_name?.toUpperCase();
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const { data: requestData, error: requestError } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestError) throw requestError;

      const normalizedEmail = (targetUser?.email || "").trim().toLowerCase();
      const filteredRequests = (requestData || []).filter((item) => {
        const matchesUserId = Number(item.user_id) === Number(targetUser?.id);
        const matchesEmail = (item.email || "").toLowerCase() === normalizedEmail;
        return matchesUserId || matchesEmail;
      });

      setStats({ scanCount, co2Saved, score, topCategories });
      setScanHistory(results || []);
      setRequests(filteredRequests);
    } catch (err) {
      console.log("Load user detail error", err);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [targetUser?.id]);

  const toggleRequestStatus = async (requestItem) => {
    const nextStatus = requestItem.status === "ตอบกลับแล้ว" ? "ยังไม่ตอบกลับ" : "ตอบกลับแล้ว";

    try {
      setUpdatingId(requestItem.id);
      const { error } = await supabase
        .from("support_messages")
        .update({ status: nextStatus })
        .eq("id", requestItem.id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((item) => (item.id === requestItem.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      console.log("Update request status error", err);
      Alert.alert("เกิดข้อผิดพลาด", "บันทึกสถานะไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!targetUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>ไม่พบข้อมูลผู้ใช้</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={20} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดผู้ใช้</Text>
        <TouchableOpacity onPress={() => setUser(null)} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0F3D34" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              {targetUser.profile ? (
                <Image source={{ uri: targetUser.profile }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={30} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {targetUser.first_name && targetUser.last_name
                  ? `${targetUser.first_name} ${targetUser.last_name}`
                  : targetUser.email || "ผู้ใช้"}
              </Text>
              <Text style={styles.userEmail}>{targetUser.email}</Text>
              <Text style={styles.userRole}>{targetUser.role === "admin" ? "Admin" : "User"}</Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{stats?.scanCount || 0}</Text>
              <Text style={styles.metricLabel}>การสแกน</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{stats?.co2Saved || 0}kg</Text>
              <Text style={styles.metricLabel}>CO₂</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{stats?.score || 0}</Text>
              <Text style={styles.metricLabel}>คะแนน</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ประเภทขยะที่สแกนบ่อย</Text>
            {stats?.topCategories?.length > 0 ? (
              stats.topCategories.map((item) => (
                <View key={item.name} style={styles.tagRow}>
                  <MaterialCommunityIcons name="recycle" size={16} color="#2b7a63" />
                  <Text style={styles.tagText}>{item.name} ({item.count})</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>ยังไม่มีข้อมูล</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ประวัติการสแกนทั้งหมด</Text>
            {scanHistory.length > 0 ? (
              scanHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyText}>{item.material?.material_name || "Unknown"}</Text>
                  <Text style={styles.historyDate}>{new Date(item.scan_date).toLocaleString("th-TH")}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>ยังไม่มีประวัติการสแกน</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>คำร้องจากผู้ใช้</Text>
            {requests.length > 0 ? (
              requests.map((item) => (
                <View key={item.id} style={styles.requestBox}>
                  <View style={styles.requestTopRow}>
                    <Text style={styles.requestText}>{item.message}</Text>
                    <TouchableOpacity
                      style={styles.checkboxButton}
                      onPress={() => toggleRequestStatus(item)}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? (
                        <ActivityIndicator size="small" color="#2b7a63" />
                      ) : (
                        <Ionicons
                          name={item.status === "ตอบกลับแล้ว" ? "checkbox" : "square-outline"}
                          size={20}
                          color="#2b7a63"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.requestMeta}>{item.status || "ยังไม่ตอบกลับ"}</Text>
                  <Text style={styles.requestDate}>{new Date(item.created_at).toLocaleString("th-TH")}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>ยังไม่มีคำร้อง</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8efe8",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef6f1",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F3D34" },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0F3D34",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#0F3D34" },
  content: { padding: 16, paddingBottom: 32 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2b7a63",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: { width: 56, height: 56, resizeMode: "cover" },
  userName: { fontSize: 16, fontWeight: "700", color: "#0F3D34" },
  userEmail: { fontSize: 12, color: "#66736f", marginTop: 2 },
  userRole: { fontSize: 12, color: "#2b7a63", marginTop: 4 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  metricBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#0F3D34" },
  metricLabel: { fontSize: 11, color: "#66736f", marginTop: 2 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F3D34", marginBottom: 8 },
  tagRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  tagText: { marginLeft: 8, color: "#0F3D34" },
  historyItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f4f1" },
  historyText: { fontSize: 13, color: "#0F3D34" },
  historyDate: { fontSize: 11, color: "#66736f", marginTop: 2 },
  requestBox: {
    backgroundColor: "#f8fbf9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf4ef",
  },
  requestTopRow: { flexDirection: "row", alignItems: "flex-start" },
  requestText: { flex: 1, fontSize: 13, color: "#0F3D34" },
  checkboxButton: { marginLeft: 8, padding: 2 },
  requestMeta: { fontSize: 11, color: "#2b7a63", marginTop: 6 },
  requestDate: { fontSize: 11, color: "#66736f", marginTop: 2 },
  emptyText: { color: "#7f8b86", fontSize: 13 },
});
