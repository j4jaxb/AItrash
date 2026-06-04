import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { calculateCO2 } from "../utils/achievementService";
import { fetchUserResults } from "../utils/resultService";

// ✅ format date
const formatScanDate = (dateString) => {
  const now = new Date();
  const scanDate = new Date(dateString);
  const diffInMs = now - scanDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const timeStr = scanDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffInDays === 0) return `Today at ${timeStr}`;
  if (diffInDays === 1) return `Yesterday at ${timeStr}`;
  if (diffInDays < 7) return `${diffInDays} days ago at ${timeStr}`;

  return scanDate.toLocaleDateString("en-GB");
};

// ✅ ฟังก์ชันเลือกไอคอน (คงเดิมเพื่อให้ UI ลิงก์กันทุกหน้า)
const getCategoryIcon = (categoryName) => {
  const iconSize = 26;
  const iconColor = "#004743";

  switch (categoryName) {
    case "PETE":
      return <MaterialCommunityIcons name="water-outline" size={iconSize} color={iconColor} />;
    case "HDPE":
      return <MaterialCommunityIcons name="bottle-tonic-outline" size={iconSize} color={iconColor} />;
    case "PVC":
      return <MaterialCommunityIcons name="pipe-disconnected" size={iconSize} color={iconColor} />;
    case "LDPE":
      return <MaterialCommunityIcons name="shopping-outline" size={iconSize} color={iconColor} />;
    case "PP":
      return <MaterialCommunityIcons name="spoon-sugar" size={iconSize} color={iconColor} />;
    case "PS":
      return <MaterialCommunityIcons name="cup-outline" size={iconSize} color={iconColor} />;
    case "glass":
    case "Glass":
      return <MaterialCommunityIcons name="glass-fragile" size={iconSize} color={iconColor} />;
    case "metal":
    case "Metal":
      return <MaterialCommunityIcons name="silverware-fork-knife" size={iconSize} color={iconColor} />;
    case "paper":
    case "Paper":
      return <Ionicons name="document-text-outline" size={iconSize} color={iconColor} />;
    case "Non-recyclable":
      return <MaterialCommunityIcons name="trash-can-outline" size={iconSize} color={iconColor} />;
    default:
      return <MaterialCommunityIcons name="package-variant" size={iconSize} color={iconColor} />;
  }
};

export default function ScanHistoryScreen({ navigation, route }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = route.params?.user;
  const filterCategory = route.params?.filterCategory;

  useEffect(() => {
    if (user?.id) loadScans();
  }, [user, filterCategory]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const data = await fetchUserResults({
        userId: user.id,
        orderBy: "scan_date",
        ascending: false,
      });

      let filtered = data || [];

      if (filterCategory) {
        filtered = filtered.filter(
          (item) => item.material?.material_name === filterCategory
        );
      }

      setScans(filtered);
    } catch (err) {
      console.log("Load scans error", err);
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const renderScan = ({ item }) => {
    const isManual = item.edit === 0 || item.is_manual;
    const co2 = calculateCO2(item.material?.material_name);

    return (
      <View style={styles.scanCard}>
        <View style={styles.scanIconBox}>
          {getCategoryIcon(item.material?.material_name)}
        </View>

        <View style={styles.scanDetails}>
          <Text style={styles.scanName}>
            {item.material?.material_name || "Unknown"}
          </Text>
          {item.material?.recycle && (
            <Text style={styles.scanSub}>
              {item.material.recycle}
            </Text>
          )}
          {isManual ? (
            <Text style={{ fontSize: 11, color: "#999", marginVertical: 2 }}>
              ✏️ แก้ไขด้วยมือ (0 XP)
            </Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 3 }}>
              <MaterialCommunityIcons name="leaf" size={12} color="#1E6C5B" />
              <Text style={{ fontSize: 11, color: "#1E6C5B", marginLeft: 2, marginRight: 8, fontWeight: "bold" }}>
                +2 XP
              </Text>
              <MaterialCommunityIcons name="cloud-outline" size={12} color="#666" />
              <Text style={{ fontSize: 11, color: "#666", marginLeft: 2, fontWeight: "500" }}>
                {co2}kg CO₂
              </Text>
            </View>
          )}
          <Text style={styles.scanTime}>
            {formatScanDate(item.scan_date)}
          </Text>
        </View>

        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {filterCategory
              ? `ประวัติการสแกน: ${filterCategory}`
              : "ประวัติการสแกน"}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderScan}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ยังไม่มีประวัติการสแกน</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
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
  headerTitle: { fontSize: 18, fontWeight: "bold", textAlign: 'center', flex: 1 },
  listContainer: { padding: 20, paddingBottom: 40 },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E4ECE8",
    marginBottom: 12,
  },
  scanIconBox: {
    width: 55,
    height: 55,
    backgroundColor: "#EAF4F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanDetails: { flex: 1, marginLeft: 15 },
  scanName: { fontWeight: "bold", fontSize: 15, color: "#0F3D34" },
  scanSub: { fontSize: 12, color: "#5E6E69", marginVertical: 2 },
  scanTime: { fontSize: 11, color: "#98A59F" },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1E6C5B",
    justifyContent: "center",
    alignItems: "center",
  },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { marginTop: 60, alignItems: 'center' },
  emptyText: { color: '#AAA', fontSize: 14 }
});