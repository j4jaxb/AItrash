import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFonts,
  BalooTammudu2_400Regular,
  BalooTammudu2_700Bold,
} from "@expo-google-fonts/baloo-tammudu-2";
import { supabase } from "../supabase";
import { loadStreak } from "../utils/streakService";

const { width } = Dimensions.get("window");

// ฟังก์ชันจัดการรูปแบบเวลา
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

// ฟังก์ชันเลือกไอคอน
const getCategoryIcon = (categoryName) => {
  const iconSize = 24;
  const iconColor = "#004743";

  switch (categoryName) {
    case "PETE":
      return (
        <MaterialCommunityIcons
          name="water-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "HDPE":
      return (
        <MaterialCommunityIcons
          name="bottle-tonic-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "PVC":
      return (
        <MaterialCommunityIcons
          name="pipe-disconnected"
          size={iconSize}
          color={iconColor}
        />
      );
    case "LDPE":
      return (
        <MaterialCommunityIcons
          name="shopping-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "PP":
      return (
        <MaterialCommunityIcons
          name="spoon-sugar"
          size={iconSize}
          color={iconColor}
        />
      );
    case "PS":
      return (
        <MaterialCommunityIcons
          name="cup-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "OTHER":
      return (
        <MaterialCommunityIcons
          name="recycle-variant"
          size={iconSize}
          color={iconColor}
        />
      );
    case "Glass":
      return (
        <MaterialCommunityIcons
          name="glass-fragile"
          size={iconSize}
          color={iconColor}
        />
      );
    case "Metal":
      return (
        <MaterialCommunityIcons name="can" size={iconSize} color={iconColor} />
      );
    case "Paper":
      return (
        <Ionicons
          name="document-text-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "Non-recyclable":
      return (
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    default:
      return (
        <MaterialCommunityIcons
          name="package-variant"
          size={iconSize}
          color={iconColor}
        />
      );
  }
};

export default function HomeScreen({ user, navigation }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    itemsScanned: 0,
    accuracy: 0,
    categories: 0,
    streak: 0,
    xp: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    BalooTammudu2_400Regular,
    BalooTammudu2_700Bold,
  });

  const categories = [
    { id: "pete", name: "PETE", sub: "Resin Code 1" },
    { id: "hdpe", name: "HDPE", sub: "Resin Code 2" },
    { id: "pvc", name: "PVC", sub: "Resin Code 3" },
    { id: "ldpe", name: "LDPE", sub: "Resin Code 4" },
    { id: "pp", name: "PP", sub: "Resin Code 5" },
    { id: "ps", name: "PS", sub: "Resin Code 6" },
  ];

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Load Recent Scans
      const { data: recentData } = await supabase
        .from("result")
        .select(`id, scan_date, material (material_name, recycle)`)
        .eq("user_id", user.id)
        .order("scan_date", { ascending: false })
        .limit(3);

      setResults(recentData || []);

      // Load Stats
      const { count: itemsCount } = await supabase
        .from("result")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { data: categoriesData } = await supabase
        .from("result")
        .select("material!inner(material_name)")
        .eq("user_id", user.id);

      let categoriesCount = 0;
      if (categoriesData) {
        const unique = new Set(
          categoriesData
            .map((item) => item.material?.material_name)
            .filter(Boolean),
        );
        categoriesCount = unique.size;
      }

      // Load Streak
      const streak = await loadStreak(user.id);

      setStats((prev) => ({
        ...prev,
        itemsScanned: itemsCount || 0,
        categories: categoriesCount,
        streak: streak,
      }));
    } catch (err) {
      console.log("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        bounces={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              {user?.profile ? (
                <Image source={{ uri: user.profile }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={20} color="white" />
              )}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.streakLabel}>SORTING STREAK</Text>
              <Text style={styles.streakValue}>
                {stats.streak > 0 ? `🔥 ${stats.streak} Days` : "No streak yet"}
              </Text>
            </View>
          </View>
          <View style={styles.xpBadge}>
            <MaterialCommunityIcons name="leaf" size={14} color="#FFF" />
            <Text style={styles.xpText}>{`${stats.xp} XP`}</Text>
          </View>
        </View>

        <Text
          style={[styles.welcomeTitle, { fontFamily: "BalooTammudu2_700Bold" }]}
        >
          Welcome Back!
        </Text>
        <Text style={styles.subTitle}>
          Start scanning to make a difference today
        </Text>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.itemsScanned}</Text>
            <Text style={styles.statLabel}>Items Scanned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{`${stats.accuracy}%`}</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.categories}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* BUTTONS */}
        <TouchableOpacity
          style={styles.mainBtnDark}
          onPress={() => navigation.navigate("Scan")}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.mainBtnTextLight}>Start Scanning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainBtnOutline}
          onPress={() => navigation.navigate("Scan", { autoPickGallery: true })}
        >
          <Ionicons name="image" size={20} color="#333" />
          <Text style={styles.mainBtnTextDark}>Upload from Gallery</Text>
        </TouchableOpacity>

        {/* CATEGORIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recyclable Categories</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("CategoryHistory", { user })}
          >
            <Text style={styles.seeMoreText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catItem}
              onPress={() =>
                navigation.navigate("ScanHistory", {
                  user,
                  filterCategory: cat.name,
                })
              }
            >
              <View style={styles.catIconBox}>{getCategoryIcon(cat.name)}</View>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catSub}>{cat.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT SCANS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("ScanHistory", { user })}
          >
            <Text style={styles.seeMoreText}>See History</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ margin: 20 }} />
        ) : (
          results.map((item) => (
            <View key={item.id} style={styles.scanCard}>
              <View style={styles.scanIconBox}>
                {getCategoryIcon(item.material?.material_name)}
              </View>
              <View style={styles.scanDetails}>
                <Text style={styles.scanName}>
                  {item.material?.material_name || "Unknown Item"}
                </Text>
                <Text style={styles.scanSub}>
                  {item.material?.recycle || "Processing..."}
                </Text>
                <Text style={styles.scanTime}>
                  {formatScanDate(item.scan_date)}
                </Text>
              </View>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ส่วน Stylesheet ที่สำคัญที่สุด (ต้องอยู่ล่างสุดและถูกเรียกใช้จาก react-native)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  container: { flex: 1, paddingHorizontal: 20 },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: "cover",
  },
  streakLabel: { fontSize: 10, color: "#AAA", fontWeight: "bold" },
  streakValue: { fontSize: 14, color: "#333", fontWeight: "bold" },
  xpBadge: {
    flexDirection: "row",
    backgroundColor: "#9BB1C9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
  },
  xpText: { color: "#FFF", fontSize: 12, fontWeight: "bold", marginLeft: 4 },
  welcomeTitle: { fontSize: 24, fontWeight: "bold", marginTop: 20 },
  subTitle: { color: "#666", fontSize: 14, marginBottom: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 3,
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 10, color: "#888", marginTop: 4, textAlign: "center" },
  mainBtnDark: {
    backgroundColor: "#1A1A1A",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  mainBtnTextLight: { color: "#FFF", fontWeight: "bold", marginLeft: 8 },
  mainBtnOutline: {
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  mainBtnTextDark: { color: "#1A1A1A", fontWeight: "bold", marginLeft: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  seeMoreText: { color: "#888", fontSize: 14 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  catItem: {
    width: (width - 55) / 2,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  catIconBox: {
    width: 45,
    height: 45,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  catName: { fontWeight: "bold", fontSize: 14 },
  catSub: { fontSize: 10, color: "#AAA" },
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
    backgroundColor: "#EBEBEB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanDetails: { flex: 1, marginLeft: 15 },
  scanName: { fontWeight: "bold", fontSize: 15 },
  scanSub: { fontSize: 12, color: "#666", marginVertical: 2 },
  scanTime: { fontSize: 11, color: "#AAA" },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
});
