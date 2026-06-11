import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacySettingsScreen({ navigation }) {
  const [shareData, setShareData] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Data Collection</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Share Scanning Data</Text>
            <Text style={styles.settingDesc}>Allow AItrash to use your scan images to improve our AI models.</Text>
          </View>
          <Switch 
            value={shareData} 
            onValueChange={setShareData} 
            trackColor={{ false: "#e0e0e0", true: "#81b0ff" }}
            thumbColor={shareData ? "#1E6C5B" : "#f4f3f4"}
          />
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>App Analytics</Text>
            <Text style={styles.settingDesc}>Share crash reports and usage statistics to help us improve.</Text>
          </View>
          <Switch 
            value={allowAnalytics} 
            onValueChange={setAllowAnalytics} 
            trackColor={{ false: "#e0e0e0", true: "#81b0ff" }}
            thumbColor={allowAnalytics ? "#1E6C5B" : "#f4f3f4"}
          />
        </View>

        <Text style={styles.sectionTitle}>Profile Visibility</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Public Profile</Text>
            <Text style={styles.settingDesc}>Allow other users to see your recycling statistics on leaderboards.</Text>
          </View>
          <Switch 
            value={publicProfile} 
            onValueChange={setPublicProfile} 
            trackColor={{ false: "#e0e0e0", true: "#81b0ff" }}
            thumbColor={publicProfile ? "#1E6C5B" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#e53935" />
          <Text style={styles.deleteBtnText}>Delete Account & Data</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Your data is encrypted and securely stored. We never sell your personal information to third parties.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFF" },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#0F3D34", marginTop: 10, marginBottom: 15 },
  settingCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 15 },
  settingInfo: { flex: 1, marginRight: 15 },
  settingName: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  settingDesc: { fontSize: 13, color: "#666", lineHeight: 18 },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, backgroundColor: "#ffebee", borderRadius: 12, marginTop: 20 },
  deleteBtnText: { color: "#e53935", fontWeight: "bold", marginLeft: 8, fontSize: 16 },
  footerText: { fontSize: 12, color: "#999", textAlign: "center", marginTop: 30, paddingHorizontal: 20, lineHeight: 18 }
});
