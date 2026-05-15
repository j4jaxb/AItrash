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
import { supabase } from "../supabase";

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
  const iconColor = "#1A1A1A";

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
    case "OTHER":
      return <MaterialCommunityIcons name="recycle-variant" size={iconSize} color={iconColor} />;
    case "glass":
    case "Glass":
      return <MaterialCommunityIcons name="glass-fragile" size={iconSize} color={iconColor} />;
    case "metal":
    case "Metal":
      return <MaterialCommunityIcons name="can" size={iconSize} color={iconColor} />;
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
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const user = route.params?.user;
  const filterCategory = route.params?.filterCategory;

  useEffect(() => {
    if (user?.id) loadScans();
  }, [user, sortBy, sortOrder, filterCategory]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("result")
        .select(`
          id,
          scan_date,
          material:material_id (
            material_name,
            recycle
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.log("Load scans error", error);
        setScans([]);
        return;
      }

      let filtered = (data || []).filter(
        (item) => item.material && item.material.material_name
      );

      if (filterCategory) {
        filtered = filtered.filter(
          (item) => item.material.material_name === filterCategory
        );
      }

      if (sortBy === "date") {
        filtered.sort((a, b) =>
          sortOrder === "asc"
            ? new Date(a.scan_date) - new Date(b.scan_date)
            : new Date(b.scan_date) - new Date(a.scan_date)
        );
      } else {
        filtered.sort((a, b) =>
          sortOrder === "asc"
            ? a.material.material_name.localeCompare(b.material.material_name)
            : b.material.material_name.localeCompare(a.material.material_name)
        );
      }
      setScans(filtered);
    } catch (err) {
      console.log("Load scans network error", err);
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = () => {
    setSortBy((prev) => (prev === "date" ? "material" : "date"));
  };

  const toggleOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const renderScan = ({ item }) => (
    <View style={styles.scanCard}>
      <View style={styles.scanIconBox}>
        {getCategoryIcon(item.material.material_name)}
      </View>

      <View style={styles.scanDetails}>
        <Text style={styles.scanName}>
          {item.material.material_name}
        </Text>
        {item.material.recycle && (
          <Text style={styles.scanSub}>
            {item.material.recycle}
          </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {filterCategory
            ? `Scans: ${filterCategory}`
            : "Scan History"}
        </Text>

        <View style={{ width: 34 }} />
      </View>

      {/* SORT */}
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Text style={styles.sortText}>
            {`Sort by ${sortBy === "date" ? "Material" : "Date"}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={toggleOrder}>
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={16}
            color="#000"
          />
        </TouchableOpacity>
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
              <Text style={styles.emptyText}>No scan history found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", textAlign: 'center', flex: 1 },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  sortText: { fontSize: 13, marginRight: 5, color: "#333" },
  listContainer: { padding: 20, paddingBottom: 40 },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 12,
  },
  scanIconBox: {
    width: 55,
    height: 55,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanDetails: { flex: 1, marginLeft: 15 },
  scanName: { fontWeight: "bold", fontSize: 15, color: "#1A1A1A" },
  scanSub: { fontSize: 12, color: "#666", marginVertical: 2 },
  scanTime: { fontSize: 11, color: "#AAA" },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { marginTop: 60, alignItems: 'center' },
  emptyText: { color: '#AAA', fontSize: 14 }
});