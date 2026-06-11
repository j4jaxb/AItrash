import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AboutAppScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About App</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons name="leaf" size={60} color="#FFF" />
          </View>
          <Text style={styles.appName}>AItrash</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            AItrash aims to revolutionize waste management by empowering individuals with an AI-powered sorting assistant. We believe that proper recycling starts with accurate classification, and together, we can reduce environmental impact and build a sustainable future.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Open Source Licenses</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2026 AItrash Team. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFF" },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  content: { padding: 20, alignItems: "center" },
  logoContainer: { alignItems: "center", marginTop: 20, marginBottom: 40 },
  logoBox: { width: 100, height: 100, borderRadius: 25, backgroundColor: "#1E6C5B", justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10 },
  appName: { fontSize: 24, fontWeight: "bold", color: "#0F3D34", marginTop: 15 },
  appVersion: { fontSize: 14, color: "#666", marginTop: 5 },
  infoCard: { width: "100%", backgroundColor: "#FFF", padding: 20, borderRadius: 15, marginBottom: 20 },
  missionTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34", marginBottom: 10 },
  missionText: { fontSize: 14, color: "#555", lineHeight: 22 },
  sectionCard: { width: "100%", backgroundColor: "#FFF", borderRadius: 15, overflow: "hidden" },
  linkRow: { flexDirection: "row", justifyContent: "space-between", padding: 18 },
  linkText: { fontSize: 16, color: "#333" },
  divider: { height: 1, backgroundColor: "#eee", marginLeft: 18 },
  copyright: { fontSize: 12, color: "#aaa", marginTop: 40, marginBottom: 20 }
});
