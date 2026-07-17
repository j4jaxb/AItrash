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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function AdminSupportDetailScreen({ route, navigation, setUser }) {
  const requestItem = route?.params?.request;
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");

  const loadDetail = async () => {
    if (!requestItem?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.log("Load support detail error", err);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดคำร้องได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [requestItem?.id]);

  const toggleStatus = async (requestId, currentStatus) => {
    const nextStatus = currentStatus === "ตอบกลับแล้ว" ? "ยังไม่ตอบกลับ" : "ตอบกลับแล้ว";

    try {
      setUpdatingId(requestId);
      const { error } = await supabase.from("support_messages").update({ status: nextStatus }).eq("id", requestId);
      if (error) throw error;

      const { data, refreshError } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (refreshError) throw refreshError;

      setRequests(data || []);
    } catch (err) {
      console.log("Update support status error", err);
      Alert.alert("เกิดข้อผิดพลาด", "บันทึกสถานะไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = requests.filter((item) => {
    if (filter === "pending") return (item.status || "ยังไม่ตอบกลับ") !== "ตอบกลับแล้ว";
    if (filter === "done") return (item.status || "ยังไม่ตอบกลับ") === "ตอบกลับแล้ว";
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={20} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>คำร้องสนับสนุน</Text>
        <TouchableOpacity onPress={() => setUser(null)} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0F3D34" />
          <Text style={styles.loadingText}>กำลังโหลดคำร้อง...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.filterRow}>
            {[
              { key: "all", label: "ทั้งหมด" },
              { key: "pending", label: "ยังไม่ได้ตอบกลับ" },
              { key: "done", label: "ตอบกลับแล้ว" },
            ].map((option) => {
              const active = filter === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(option.key)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredRequests.length > 0 ? (
            filteredRequests.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.listItemText} numberOfLines={1}>{item.message || "-"}</Text>
                  <TouchableOpacity
                    style={styles.statusButtonSmall}
                    onPress={() => toggleStatus(item.id, item.status)}
                    disabled={updatingId === item.id}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.statusButtonTextSmall}>{item.status || "ยังไม่ตอบกลับ"}</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.listItemMeta}>{item.email || "ไม่ระบุอีเมล"}</Text>
                <Text style={styles.listItemMeta}>{item.created_at ? new Date(item.created_at).toLocaleString("th-TH") : "-"}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>ไม่มีคำร้องในหมวดนี้</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8efe8" },
  headerButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eef6f1", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F3D34" },
  logoutButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#0F3D34", justifyContent: "center", alignItems: "center" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#0F3D34" },
  emptyText: { color: "#7f8b86", fontSize: 13 },
  content: { padding: 16, paddingBottom: 32 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#f4f7f5", marginRight: 8, marginBottom: 6 },
  filterChipActive: { backgroundColor: "#0F3D34" },
  filterChipText: { fontSize: 11, color: "#0F3D34", fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e4ece8" },
  label: { fontSize: 12, fontWeight: "700", color: "#2b7a63", marginBottom: 6 },
  value: { fontSize: 14, color: "#0F3D34", lineHeight: 22 },
  statusButton: { backgroundColor: "#2b7a63", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  statusButtonText: { color: "#fff", fontWeight: "700" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  statusButtonSmall: { backgroundColor: "#2b7a63", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  statusButtonTextSmall: { color: "#fff", fontSize: 11, fontWeight: "700" },
  listItemText: { fontSize: 13, color: "#0F3D34", flex: 1 },
  listItemMeta: { fontSize: 11, color: "#66736f", marginTop: 2 },
});
