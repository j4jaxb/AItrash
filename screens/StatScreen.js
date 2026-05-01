import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";

const { width } = Dimensions.get("window");

const categories = [
  { id: "pete", name: "PETE" },
  { id: "hdpe", name: "HDPE" },
  { id: "pvc", name: "PVC" },
  { id: "ldpe", name: "LDPE" },
  { id: "pp", name: "PP" },
  { id: "ps", name: "PS" },
  { id: "glass", name: "Glass" },
  { id: "paper", name: "Paper" },
  { id: "metal", name: "Metal" },
];

// ไล่สีกราฟแท่งแบบตัวอย่าง
const barColors = [
  "#A6BCBC",
  "#8EADAD",
  "#739999",
  "#558686",
  "#3B7471",
  "#1F6560",
  "#00554E",
  "#0A4C47",
  "#083F3B",
];

export default function StatScreen({ user }) {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [recyclingData, setRecyclingData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1);
      monday.setHours(0, 0, 0, 0);

      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);

      const { data: totalData } = await supabase
        .from("result")
        .select("material!inner(material_name)")
        .eq("user_id", user.id);

      const totalCounts = {};

      totalData?.forEach((item) => {
        const name = item.material.material_name;
        totalCounts[name] = (totalCounts[name] || 0) + 1;
      });

      const { data: weekData } = await supabase
        .from("result")
        .select("material!inner(material_name)")
        .eq("user_id", user.id)
        .gte("scan_date", monday.toISOString())
        .lt("scan_date", nextMonday.toISOString());

      const weekCounts = {};

      weekData?.forEach((item) => {
        const name = item.material.material_name;
        weekCounts[name] = (weekCounts[name] || 0) + 1;
      });

      const thisWeekCount = Object.values(weekCounts).reduce(
        (a, b) => a + b,
        0
      );

      const data = {};

      categories.forEach((cat) => {
        data[cat.id] = totalCounts[cat.name] || 0;
      });

      data.thisWeekCount = thisWeekCount;

      setRecyclingData(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        setLoading(true);
        setTimeout(() => setLoading(false), 100);
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalItems = categories.reduce(
    (sum, cat) => sum + (recyclingData[cat.id] || 0),
    0
  );

  const chartData = categories.map((cat) => ({
    label: cat.name,
    count: recyclingData[cat.id] || 0,
  }));

  const maxVal = Math.max(...chartData.map((d) => d.count), 1);

  const topActivities = [...chartData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F6F8F7",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0F3D34" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8F7" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <View style={styles.avatarPlaceholder}>
            {user?.profile ? (
              <Image source={{ uri: user.profile }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color="#fff" />
            )}
          </View>

          <View style={{ marginLeft: 10 }}>
            <Text style={styles.userName}>
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.first_name ?? "User"}
            </Text>

            <Text style={styles.userDesc}>
              Welcome to your recycling dashboard!
            </Text>
          </View>
        </View>

        {/* PROGRESS */}
        <Text style={styles.sectionTitle}>Your Progress</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressCard}>
            <Text style={styles.progressNum}>{totalItems}</Text>
            <Text style={styles.progressLabel}>Total Recycled Items</Text>
            <Text style={styles.progressSub}>
              {recyclingData.thisWeekCount > 0
                ? `+${recyclingData.thisWeekCount}`
                : "0"}{" "}
              this week
            </Text>
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressNum}>400</Text>
            <Text style={styles.progressLabel}>Recommended Amount</Text>
            <Text style={styles.progressSub}>Keep Going!</Text>
          </View>
        </View>

        {/* CHART */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Accumulated Recyclable Items</Text>

          <View style={styles.chartBarRow}>
            {chartData.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.chartBar,
                  {
                    height: (item.count / maxVal) * 60,
                    backgroundColor: barColors[i % barColors.length],
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.chartLabelRow}>
            {chartData.map((item, i) => (
              <Text key={i} style={styles.chartLabel}>
                {item.label}
              </Text>
            ))}
          </View>
        </View>

        {/* BUTTONS */}
        <View style={{ flexDirection: "row", marginVertical: 10 }}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("ScanHistory", { user })}
          >
            <Text style={styles.actionBtnText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Goals</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVITIES */}
        <Text style={styles.sectionTitle}>Recent Recycling Activities</Text>

        {topActivities.map((activity, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="recycle"
                size={20}
                color="#0F3D34"
              />
              <Text style={styles.activityLabel}>{activity.label}</Text>
              <Text style={styles.activityCount}>
                {activity.count} items
              </Text>
            </View>

            <Text style={styles.activityDate}>
              Based on your total stats
            </Text>
          </View>
        ))}

        {/* BOTTOM */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.leaderboardBtn}>
            <Text style={styles.bottomBtnText}>See Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rewardBtn}>
            <Text style={[styles.bottomBtnText, styles.rewardBtnText]}>
              Earn Rewards
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F3D34",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },

  userName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#0F3D34",
  },

  userDesc: {
    color: "#7B8883",
    fontSize: 12,
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 18,
    marginBottom: 8,
    color: "#0F3D34",
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  progressCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4ECE8",
  },

  progressNum: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#0F3D34",
  },

  progressLabel: {
    color: "#5E6E69",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },

  progressSub: {
    color: "#1E6C5B",
    fontSize: 12,
    marginTop: 2,
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E4ECE8",
  },

  chartTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 12,
    color: "#0F3D34",
  },

  chartBarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
    marginBottom: 8,
  },

  chartBar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 3,
  },

  chartLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  chartLabel: {
    fontSize: 8,
    color: "#7B8883",
    flex: 1,
    textAlign: "center",
  },

  actionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#0F3D34",
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
  },

  actionBtnText: {
    color: "#0F3D34",
    fontWeight: "bold",
  },

  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E4ECE8",
  },

  activityLabel: {
    fontWeight: "bold",
    marginLeft: 8,
    color: "#0F3D34",
  },

  activityCount: {
    color: "#7B8883",
    marginLeft: 8,
  },

  activityDate: {
    color: "#7B8883",
    fontSize: 12,
    marginTop: 2,
  },

  bottomRow: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 30,
  },

  leaderboardBtn: {
    flex: 1,
    backgroundColor: "#EAF4F0",
    borderRadius: 8,
    padding: 14,
    marginRight: 8,
    alignItems: "center",
  },

  rewardBtn: {
    flex: 1,
    backgroundColor: "#0F3D34",
    borderRadius: 8,
    padding: 14,
    marginLeft: 8,
    alignItems: "center",
  },

  bottomBtnText: {
    color: "#0F3D34",
    fontWeight: "bold",
  },

  rewardBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});