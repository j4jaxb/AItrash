import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
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
import { loadStreak, loadMaxStreak } from "../utils/streakService";
import { calculateAchievements, calculateConsecutiveCorrect, calculateTotalPoints } from "../utils/achievementService";

const { width } = Dimensions.get("window");

// --- ดึงไอคอนจากหน้าโฮมที่คุณใช้อยู่มาใส่ใน Recent Scans ---
const getCategoryIcon = (categoryName) => {
  const iconSize = 28;
  const iconColor = "#004743";
  switch (categoryName) {
    case "PETE": return <MaterialCommunityIcons name="water-outline" size={iconSize} color={iconColor} />;
    case "HDPE": return <MaterialCommunityIcons name="bottle-tonic-outline" size={iconSize} color={iconColor} />;
    case "PVC": return <MaterialCommunityIcons name="pipe-disconnected" size={iconSize} color={iconColor} />;
    case "LDPE": return <MaterialCommunityIcons name="shopping-outline" size={iconSize} color={iconColor} />;
    case "PP": return <MaterialCommunityIcons name="spoon-sugar" size={iconSize} color={iconColor} />;
    case "PS": return <MaterialCommunityIcons name="cup-outline" size={iconSize} color={iconColor} />;
    case "OTHER": return <MaterialCommunityIcons name="recycle-variant" size={iconSize} color={iconColor} />;
    case "glass":
    case "Glass": return <MaterialCommunityIcons name="glass-fragile" size={iconSize} color={iconColor} />;
    case "metal":
    case "Metal": return <MaterialCommunityIcons name="can" size={iconSize} color={iconColor} />;
    case "paper":
    case "Paper": return <Ionicons name="document-text-outline" size={iconSize} color={iconColor} />;
    case "Non-recyclable": return <MaterialCommunityIcons name="trash-can-outline" size={iconSize} color={iconColor} />;
    default: return <MaterialCommunityIcons name="package-variant" size={iconSize} color={iconColor} />;
  }
};

export default function ProfileScreen({ onLogout, user, setUser, navigation }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    achievements: 0,
    points: 0,
    co2Saved: 0,
    maxStreak: 0,
    consecutiveCorrect: 0,
    recycledCount: 0,
  });
  const [achievementsList, setAchievementsList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    BalooTammudu2_400Regular,
    BalooTammudu2_700Bold,
  });

  // สูตรคำนวณ CO2 ตามประเภทขยะ
  const calculateCO2 = (materialName) => {
    const name = materialName?.toUpperCase();
    if (name?.includes("PETE") || name?.includes("PLASTIC")) return 0.05;
    if (name?.includes("GLASS")) return 0.1;
    if (name?.includes("METAL") || name?.includes("CAN")) return 0.2;
    return 0.02;
  };

  const loadProfileData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // ดึงสถิติจริงจาก Supabase [cite: 4, 5, 8, 9]
      const { data: allData } = await supabase
        .from("result")
        .select(`id, scan_date, material (material_name, recycle)`)
        .eq("user_id", user.id);

      if (allData) {
        const total = allData.length;
        const sevenPlastics = ["PETE", "HDPE", "PVC", "LDPE", "PP", "PS", "OTHER"];
        
        const consecutiveCorrect = calculateConsecutiveCorrect(allData);

        const recycledCount = allData.filter(item => 
          sevenPlastics.includes(item.material?.material_name?.toUpperCase())
        ).length;
        
        const totalCO2 = allData.reduce((sum, item) => 
          sum + calculateCO2(item.material?.material_name), 0
        );

        const streakCount = await loadStreak(user.id);
        const maxStreakCount = await loadMaxStreak(user.id);
        
        const calculatedAchievements = calculateAchievements(allData, streakCount);
        setAchievementsList(calculatedAchievements);
        const unlockedCount = calculatedAchievements.filter(a => a.unlocked).length;

        const totalPoints = calculateTotalPoints(allData, calculatedAchievements, consecutiveCorrect);

        setStats({
          totalScans: total,
          achievements: unlockedCount,
          points: totalPoints,
          co2Saved: totalCO2.toFixed(2),
          maxStreak: maxStreakCount,
          consecutiveCorrect: consecutiveCorrect,
          recycledCount: recycledCount,
        });
      }

      // ดึง 3 รายการล่าสุด [cite: 17, 18, 22, 25]
      const { data: recentData } = await supabase
        .from("result")
        .select(`id, scan_date, material (material_name, recycle)`)
        .eq("user_id", user.id)
        .order("scan_date", { ascending: false })
        .limit(3);
      
      setResults(recentData || []);
    } catch (err) {
      console.log("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  if (!fontsLoaded) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#1A1A1A" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar ตามรูปเป๊ะ */}
      <View style={styles.topNavBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.navTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile", { user, setUser })}
        >
          <Ionicons name="settings-sharp" size={22} color="#004743" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        {/* Profile Info Section [cite: 2, 3] */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarGrayBox}
            onPress={() => navigation.navigate("EditProfile", { user, setUser })}
          >
            {user?.profile ? (
              <Image source={{ uri: user.profile }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={70} color="#004743" />
            )}
          </TouchableOpacity>
          <Text style={[styles.userNameText, { fontFamily: "BalooTammudu2_700Bold" }]}>
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user?.first_name ?? "User Name"}
          </Text>
          <Text style={styles.subImpactText}>You're making an environmental impact!</Text>
        </View>

        {/* Stats Grid [cite: 10, 11] */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatBox num={stats.totalScans} label="Total Scans" />
            <StatBox num={`${stats.achievements}/8`} label="Achievements" />
          </View>
          <View style={styles.statsRow}>
            <StatBox 
              num={stats.points} 
              label="คะแนนสะสม (XP)" 
              onPress={() => navigation.navigate("Rewards", { user })}
            />
            <StatBox num={`${stats.co2Saved}kg`} label="CO₂ Saved" />
          </View>
        </View>

        {/* Achievements Section [cite: 12-16] */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 10 }}>
            {achievementsList.map(ach => (
              <BadgeItem key={ach.id} title={ach.title} icon={ach.icon} unlocked={ach.unlocked} />
            ))}
          </ScrollView>
        </View>

        {/* Recent Scans Section (พื้นหลังเทาอ่อนตามรูป) [cite: 17, 21] */}
        <View style={styles.recentScansArea}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ScanHistory", { user })}>
              <Text style={styles.viewAllText}>See History</Text>
            </TouchableOpacity>
          </View>
          {results.map((item) => (
            <View key={item.id} style={styles.scanCard}>
              <View style={styles.scanIconPlaceholder}>
                {getCategoryIcon(item.material?.material_name)}
              </View>
              <View style={styles.scanContent}>
                <Text style={styles.scanMainName}>{item.material?.material_name || "Plastic Bottle (PET)"}</Text>
                <Text style={styles.scanSubDetail}>{item.material?.recycle || "Resin Code 1 • Recyclable"}</Text>
                <Text style={styles.scanDateText}>
                  {new Date(item.scan_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.checkCircleBlack}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            </View>
          ))}
        </View>

        {/* Account Settings Section [cite: 29-40] */}
        <View style={styles.settingsArea}>
          <Text style={styles.settingsTitle}>Account Settings</Text>
          <MenuLink
            icon="person-outline"
            title="Edit Profile"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <MenuLink 
            icon="shield-checkmark-outline" 
            title="Privacy Settings" 
            onPress={() => navigation.navigate("PrivacySettings")}
          />
          <MenuLink 
            icon="information-circle-outline" 
            title="About App" 
            onPress={() => navigation.navigate("AboutApp")}
          />

          {/* ปุ่มที่เพิ่มมาให้เหมือนในรูป */}
          <TouchableOpacity 
            style={styles.supportBtn}
            onPress={() => navigation.navigate("HelpSupport")}
          >
            <Ionicons name="help-circle-outline" size={24} color="#004743" />
            <Text style={[styles.supportText, { color: "#004743" }]}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutFullBtn} onPress={onLogout}>
            <MaterialCommunityIcons name="logout-variant" size={22} color="#004743" />
            <Text style={[styles.logoutFullText, { color: "#004743" }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components
const StatBox = ({ num, label, onPress }) => (
  <TouchableOpacity 
    style={styles.statBox} 
    onPress={onPress} 
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.statNum}>{num}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const BadgeItem = ({ title, icon, unlocked }) => (
  <View style={[styles.badgeItemBox, { width: 100, marginRight: 15 }]}>
    <View style={[styles.badgeCircleGray, unlocked && { backgroundColor: '#1E6C5B' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={unlocked ? "#FFF" : "#B5CAC9"} />
    </View>
    <Text style={[styles.badgeText, { color: unlocked ? "#1E6C5B" : "#AAA", marginBottom: 4, fontWeight: "bold" }]}>
      {unlocked ? "สำเร็จแล้ว" : "ยังไม่ได้รับ"}
    </Text>
    <Text style={[styles.badgeText, { fontSize: 11, color: "#666" }]}>{title.replace(' ', '\n')}</Text>
  </View>
);

const MenuLink = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItemRow} onPress={onPress}>
    <View style={styles.menuLeftSide}>
      <Ionicons name={icon} size={22} color="#004743" />
      <Text style={styles.menuItemText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#004743" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#FFF" 
  },
  topNavBar: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    height: 50, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F0F0F0" 
  },
  navTitle: { 
    fontSize: 18, 
    fontWeight: "500", 
    color: "#004743" 
  },
  content: { 
    flex: 1 
  },
  profileHeader: { 
    alignItems: "center", 
    marginTop: 30, 
    marginBottom: 30 
  },
  avatarGrayBox: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: "#EFEFEF", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 15 
  },
  avatarImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    resizeMode: "cover" 
  },
  userNameText: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#004743" 
  },
  subImpactText: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 5 
  },
  statsContainer: { paddingHorizontal: 20, marginBottom: 30 },
  statsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 15 
  },
  statBox: { 
    width: (width - 55) / 2, 
    height: 80, 
    backgroundColor: "#CFDAD9", 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#F0F0F0", 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 1 
  },
  statNum: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#004743" 
  },
  statValue: { fontSize: 20, fontFamily: "BalooTammudu2_700Bold", color: "#0F3D34" },
  statLabel: { fontSize: 13, color: "#666" },
  bonusBox: { backgroundColor: "#E8F5E9", padding: 15, borderRadius: 12, marginTop: 10 },
  bonusTitle: { fontSize: 16, fontWeight: "bold", color: "#1E6C5B", marginBottom: 5 },
  bonusText: { fontSize: 14, color: "#333", marginBottom: 3 },
  sectionContainer: { marginBottom: 25, paddingHorizontal: 20 }, 
  sectionHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#004743" 
  },
  viewAllText: { 
    fontSize: 13, 
    color: "#999" 
  },
  achievementRow: { 
    flexDirection: "row", 
    justifyContent: "space-around" 
  },
  badgeItemBox: { 
    alignItems: "center", 
    width: width / 4 
  },
  badgeCircleGray: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: "#ECF1F1", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 8 
  },
  badgeText: { 
    fontSize: 10, 
    textAlign: "center" 
  },
  recentScansArea: { 
    backgroundColor: "#F9F9F9", 
    paddingHorizontal: 20, 
    
    paddingVertical: 20 
  },
  scanCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFF", 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#EEE", 
    marginBottom: 12 
  },
  scanIconPlaceholder: { 
    width: 60, 
    height: 60, 
    backgroundColor: "#C7D7D6", 
    borderRadius: 8, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  scanContent: { 
    flex: 1, 
    marginLeft: 15 
  },
  scanMainName: { 
    fontSize: 15, 
    fontWeight: "bold", 
    color: "#004743" 
  },
  scanSubDetail: { 
    fontSize: 12, 
    color: "#666", 
    marginVertical: 3 
  },
  scanDateText: { 
    fontSize: 11, 
    color: "#999" 
  },
  checkCircleBlack: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: "#16A34A", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  settingsArea: { 
    paddingHorizontal: 20, 
    marginTop: 30 
  },
  settingsTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 20 
  },
  menuItemRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F5F5F5" 
  },
  menuLeftSide: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  menuItemText: { 
    marginLeft: 15, 
    fontSize: 16, 
    color: "#004743" 
  },
  supportBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 15, 
    marginTop: 20, 
    backgroundColor: "#FFF", 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#F0F0F0" 
  },
  supportText: { 
    marginLeft: 10, 
    fontSize: 16, 
    color: "#004743", 
    fontWeight: "500" 
  },
  logoutFullBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 15, 
    marginTop: 15 
  },
  logoutFullText: { 
    marginLeft: 10, 
    fontSize: 16, 
    color: "#004743", 
    fontWeight: "500" 
  }
});