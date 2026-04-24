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

export default function StatScreen({ user }) {

  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [recyclingData, setRecyclingData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      console.log('Fetching data for user:', user.id);
      const { data: totalData, error: totalError } = await supabase
        .from("result")
        .select("material!inner(material_name)")
        .eq("user_id", user.id);
      console.log('Total data:', totalData, 'Error:', totalError);
      const totalCounts = {};
      totalData?.forEach(item => {
        const name = item.material.material_name;
        totalCounts[name] = (totalCounts[name] || 0) + 1;
      });
      console.log('Total counts:', totalCounts);
      const { data: weekData, error: weekError } = await supabase
        .from("result")
        .select("material!inner(material_name)")
        .eq("user_id", user.id)
        .gte("scan_date", monday.toISOString())
        .lt("scan_date", nextMonday.toISOString());
      console.log('Week data:', weekData, 'Error:', weekError);
      const weekCounts = {};
      weekData?.forEach(item => {
        const name = item.material.material_name;
        weekCounts[name] = (weekCounts[name] || 0) + 1;
      });
      const thisWeekCount = Object.values(weekCounts).reduce((a, b) => a + b, 0);
      console.log('This week count:', thisWeekCount);
      const recyclingData = {};
      categories.forEach(cat => {
        recyclingData[cat.id] = totalCounts[cat.name] || 0;
      });
      recyclingData.thisWeekCount = thisWeekCount;
      console.log('Final recyclingData:', recyclingData);
      setRecyclingData(recyclingData);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      // Force re-render when screen is focused
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

  const totalItems = categories.reduce((sum, cat) => sum + (recyclingData[cat.id] || 0), 0);

  const chartData = categories.map(cat => ({ label: cat.name, count: recyclingData[cat.id] || 0 }));

  const maxVal = Math.max(...chartData.map(d => d.count), 1);
  const topActivities = [...chartData].sort((a, b) => b.count - a.count).slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#222" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
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
            <Text style={styles.userDesc}>Welcome to your recycling dashboard!</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Progress</Text>
        {/* แก้จาก div เป็น View ตรงนี้ครับ */}
        <View style={styles.progressRow}>
          <View style={styles.progressCard}>
            <Text style={styles.progressNum}>{totalItems}</Text>
            <Text style={styles.progressLabel}>Total Recycled Items</Text>
            <Text style={styles.progressSub}>
              {recyclingData.thisWeekCount > 0 ? `+${recyclingData.thisWeekCount}` : '0'} this week
            </Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressNum}>400</Text>
            <Text style={styles.progressLabel}>Recommended Amount</Text>
            <Text style={styles.progressSub}>Keep Going!</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Accumulated Recyclable Items</Text>
          <View style={styles.chartBarRow}>
            {chartData.map((item, i) => (
              <View key={i} style={[styles.chartBar, { height: (item.count / maxVal) * 60 }]} />
            ))}
          </View>
          <View style={styles.chartLabelRow}>
            {chartData.map((item, i) => (
              <Text key={i} style={styles.chartLabel}>{item.label}</Text>
            ))}
          </View>
        </View>

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

        <Text style={styles.sectionTitle}>Recent Recycling Activities</Text>
        {topActivities.map((activity, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="recycle" size={20} color="#222" />
              <Text style={styles.activityLabel}>{activity.label}</Text>
              <Text style={styles.activityCount}>{activity.count} items</Text>
            </View>
            <Text style={styles.activityDate}>Based on your total stats</Text>
          </View>
        ))}

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.leaderboardBtn}><Text style={styles.bottomBtnText}>See Leaderboard</Text></TouchableOpacity>
          <TouchableOpacity style={styles.rewardBtn}><Text style={[styles.bottomBtnText, styles.rewardBtnText]}>Earn Rewards</Text></TouchableOpacity>
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
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userDesc: { color: '#888', fontSize: 12 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginTop: 18, marginBottom: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressCard: { flex: 1, backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, marginRight: 10, alignItems: 'center' },
  progressNum: { fontWeight: 'bold', fontSize: 22 },
  progressLabel: { color: '#555', fontSize: 12, marginTop: 2, textAlign: 'center' },
  progressSub: { color: '#1a8f3c', fontSize: 12, marginTop: 2 },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 10, borderWidth: 1, borderColor: '#eee' },
  chartTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  chartBarRow: { flexDirection: 'row', alignItems: 'flex-end', height: 60, marginBottom: 8 },
  chartBar: { flex: 1, backgroundColor: '#888', marginHorizontal: 2, borderRadius: 2 },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 8, color: '#888', flex: 1, textAlign: 'center' },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 12, marginRight: 10, alignItems: 'center' },
  actionBtnText: { color: '#222', fontWeight: 'bold' },
  activityCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  activityLabel: { fontWeight: 'bold', marginLeft: 8 },
  activityCount: { color: '#888', marginLeft: 8 },
  activityDate: { color: '#888', fontSize: 12, marginTop: 2 },
  bottomRow: { flexDirection: 'row', marginTop: 16, marginBottom: 30 },
  leaderboardBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 14, marginRight: 8, alignItems: 'center' },
  rewardBtn: { flex: 1, backgroundColor: '#222', borderRadius: 8, padding: 14, marginLeft: 8, alignItems: 'center' },
  bottomBtnText: { color: '#222', fontWeight: 'bold' },
  rewardBtnText: { color: '#fff', fontWeight: 'bold' },
});