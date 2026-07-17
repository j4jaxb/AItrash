import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function AdminScreen({ navigation, user, setUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({ totalUsers: 0, totalScans: 0, topCategories: [] });
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data, error } = await supabase.from("user").select("*").order("id", { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.log("Load users error", err);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadSupportRequests = async (showLoading = true) => {
    try {
      if (showLoading) setSupportLoading(true);
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSupportRequests(data || []);
    } catch (err) {
      console.log("Load support requests error", err);
    } finally {
      if (showLoading) setSupportLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadUsers(false), loadSupportRequests(false)]);
    } catch (err) {
      console.log("Refresh admin screen error", err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const { data, error } = await supabase
        .from("result")
        .select("id, user_id, scan_date, material(material_name, recycle)")
        .order("scan_date", { ascending: false });

      if (error) throw error;

      const categoryCounts = {};
      (data || []).forEach((item) => {
        const categoryName = item.material?.material_name?.toUpperCase();
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setSystemStats({
        totalUsers: users.length || 0,
        totalScans: data?.length || 0,
        topCategories,
      });
    } catch (err) {
      console.log("Load system stats error", err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadSupportRequests();
  }, []);

  useEffect(() => {
    loadSystemStats();
  }, [users.length]);

  const handleDeleteUser = async (targetUser) => {
    Alert.alert(
      "ลบบัญชีผู้ใช้",
      `คุณต้องการลบ ${targetUser.first_name || targetUser.email} หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("user").delete().eq("id", targetUser.id);
              if (error) throw error;
              Alert.alert("สำเร็จ", "ลบบัญชีผู้ใช้เรียบร้อยแล้ว");
              const updatedUsers = users.filter((item) => item.id !== targetUser.id);
              setUsers(updatedUsers);
            } catch (err) {
              console.log("Delete user error", err);
              Alert.alert("เกิดข้อผิดพลาด", "ลบบัญชีไม่สำเร็จ");
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((item) => {
    const query = search.toLowerCase();
    return (
      (item.email || "").toLowerCase().includes(query) ||
      (item.first_name || "").toLowerCase().includes(query) ||
      (item.last_name || "").toLowerCase().includes(query)
    );
  });

  const filteredSupportRequests = supportRequests;
  const pendingCount = supportRequests.filter((item) => (item.status || "ยังไม่ตอบกลับ") !== "ตอบกลับแล้ว").length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} disabled={refreshing}>
          {refreshing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="refresh" size={18} color="#fff" />}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => setUser(null)} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#0F3D34"]} tintColor="#0F3D34" />}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{users.length}</Text>
            <Text style={styles.summaryLabel}>ผู้ใช้ทั้งหมด</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{systemStats.totalScans}</Text>
            <Text style={styles.summaryLabel}>การสแกนรวม</Text>
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.sectionTitle}>ประเภทขยะที่มีในระบบมากที่สุด</Text>
          {systemStats.topCategories.length > 0 ? (
            systemStats.topCategories.map((item) => (
              <View key={item.name} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Text style={styles.categoryCount}>{item.count} ครั้ง</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(100, item.count * 10)}%` }]} />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลประเภทขยะ</Text>
          )}
        </View>

        <View style={styles.panelCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>คำร้องสนับสนุน</Text>
            <Text style={styles.sectionBadge}>{supportRequests.length}</Text>
          </View>

          {supportLoading ? (
            <ActivityIndicator size="small" color="#0F3D34" />
          ) : filteredSupportRequests.length > 0 ? (
            <TouchableOpacity
              style={styles.supportMainButton}
              onPress={() => navigation.navigate("AdminSupportDetail", { request: filteredSupportRequests[0] })}
            >
              <View style={styles.supportMainTextBox}>
                <Text style={styles.supportMainTitle}>ดูคำร้องสนับสนุนทั้งหมด</Text>
                <Text style={styles.supportMainSubtitle}>กดเพื่อเปิดหน้าจัดการคำร้อง</Text>
              </View>
              {pendingCount > 0 ? (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>ยังไม่มีคำร้องในหมวดนี้</Text>
          )}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#7b8a85" />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาผู้ใช้"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0F3D34" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <View style={styles.userListSection}>
            {filteredUsers.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.userCard}
                onPress={() => navigation.navigate("AdminUserDetail", { user: item })}
              >
                <View style={styles.userCardLeft}>
                  <View style={styles.avatarCircle}>
                    {item.profile ? (
                      <Image source={{ uri: item.profile }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={22} color="#fff" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>
                      {item.first_name && item.last_name
                        ? `${item.first_name} ${item.last_name}`
                        : item.email || "ผู้ใช้"}
                    </Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={styles.userRole}>{item.role === "admin" ? "Admin" : "User"}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteUser(item)}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8efe8",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#004743" },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F3D34",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F3D34",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 16, paddingBottom: 32 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  summaryValue: { fontSize: 22, fontWeight: "700", color: "#0F3D34" },
  summaryLabel: { fontSize: 12, color: "#66736f", marginTop: 4 },
  panelCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F3D34", marginBottom: 10 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionBadge: { fontSize: 12, fontWeight: "700", color: "#2b7a63", backgroundColor: "#edf7f2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#f4f7f5", marginRight: 8, marginBottom: 6 },
  filterChipActive: { backgroundColor: "#0F3D34" },
  filterChipText: { fontSize: 11, color: "#0F3D34", fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },
  supportMainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4fbf7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#dfeee7",
  },
  supportMainTextBox: { flex: 1 },
  supportMainTitle: { fontSize: 14, fontWeight: "700", color: "#0F3D34" },
  supportMainSubtitle: { fontSize: 12, color: "#66736f", marginTop: 2 },
  pendingBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  pendingBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  categoryRow: { marginBottom: 10 },
  categoryInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  categoryName: { fontSize: 13, fontWeight: "600", color: "#0F3D34" },
  categoryCount: { fontSize: 12, color: "#66736f" },
  barTrack: { height: 8, backgroundColor: "#eaf4f0", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, backgroundColor: "#2b7a63", borderRadius: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  searchInput: { flex: 1, marginLeft: 8, color: "#0f3d34" },
  loadingBox: { alignItems: "center", paddingVertical: 20 },
  loadingText: { marginTop: 8, color: "#0f3d34" },
  userListSection: { marginTop: 12 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  userCardActive: { borderColor: "#2b7a63", backgroundColor: "#f4fbf7" },
  userCardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2b7a63",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  avatarImage: { width: 42, height: 42, resizeMode: "cover" },
  userName: { fontSize: 15, fontWeight: "700", color: "#0f3d34" },
  userEmail: { fontSize: 12, color: "#66736f", marginTop: 2 },
  userRole: { fontSize: 11, color: "#2b7a63", marginTop: 2 },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d9534f",
    justifyContent: "center",
    alignItems: "center",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e4ece8",
  },
  profileBox: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarCircleLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2b7a63",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImageLarge: { width: 56, height: 56, resizeMode: "cover" },
  detailName: { fontSize: 17, fontWeight: "700", color: "#0F3D34" },
  metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  metricBox: {
    flex: 1,
    backgroundColor: "#f6f8f7",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 3,
    alignItems: "center",
  },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#0F3D34" },
  metricLabel: { fontSize: 11, color: "#66736f", marginTop: 2 },
  subSection: { marginTop: 10 },
  subTitle: { fontSize: 14, fontWeight: "700", color: "#0F3D34", marginBottom: 8 },
  historyItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f4f1" },
  historyText: { fontSize: 13, color: "#0F3D34" },
  historyDate: { fontSize: 11, color: "#66736f", marginTop: 2 },
  categoryTagRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  categoryTagText: { marginLeft: 8, color: "#0F3D34" },
  requestBox: {
    backgroundColor: "#f8fbf9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf4ef",
  },
  requestText: { fontSize: 13, color: "#0F3D34" },
  requestMeta: { fontSize: 11, color: "#2b7a63", marginTop: 4 },
  emptyText: { color: "#7f8b86", fontSize: 13 },
});
