import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function PrivacySettingsScreen({ navigation, user, setUser }) {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account & Data",
      "This will permanently delete your account and all data. This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            Alert.prompt(
              "Confirm Delete",
              'Type "DELETE" to confirm permanent deletion:',
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: (text) => confirmDelete(text), style: "destructive" },
              ],
              "plain-text"
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  const confirmDelete = async (confirmText) => {
    if (confirmText !== "DELETE") {
      Alert.alert("Error", "Please type DELETE exactly to confirm");
      return;
    }

    try {
      setDeleting(true);

      // Delete all related data from database in correct order (dependencies first)
      if (user?.id) {
        // Delete result first (has dependencies)
        try {
          await supabase.from("result").delete().eq("user_id", user.id);
        } catch (err) {
          console.log("Ignore result delete error:", err);
        }

        // Delete game history
        await supabase.from("game_history").delete().eq("user_id", user.id);

        // Delete scan history
        await supabase.from("scan_history").delete().eq("user_id", user.id);

        // Delete achievements/rewards if exists
        try {
          await supabase.from("user_achievements").delete().eq("user_id", user.id);
        } catch (err) {
          console.log("Ignore user_achievements delete error:", err);
        }

        // Delete user profile from app database (last, as it's the parent)
        await supabase.from("user").delete().eq("id", user.id);
      }

      Alert.alert("Account Deleted", "Your account and all data have been permanently deleted.", [
        { text: "OK", onPress: () => {
          setUser(null);
        }},
      ]);
    } catch (error) {
      console.log("Delete account error:", error);
      Alert.alert("Error", error?.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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
        
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>ข้อมูลที่เก็บ</Text>
          </View>
          <Text style={styles.infoText}>    อีเมล</Text>
          <Text style={styles.infoText}>    รหัสผ่าน</Text>
          <Text style={styles.infoText}>    ประวัติการสแกนพลาสติก</Text>
          <Text style={styles.infoText}>    คะแนนเกมและความสำเร็จ</Text>
        </View>

       


        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color="#e53935" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#e53935" />
              <Text style={styles.deleteBtnText}>Delete Account & All Data</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          เมื่อลบบัญชี ข้อมูลทั้งหมดที่เกี่ยวข้อง รวมถึงประวัติเกม ประวัติการสแกน และข้อมูลโปรไฟล์จะถูกลบอย่างถาวร
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
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#0F3D34", marginTop: 20, marginBottom: 15 },
  infoCard: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: "#1E6C5B" },
  infoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoTitle: { fontSize: 14, fontWeight: "600", color: "#0F3D34", marginLeft: 8 },
  infoText: { fontSize: 12, color: "#555", marginBottom: 6, lineHeight: 18 },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "#ffebee", borderRadius: 12, marginBottom: 15 },
  deleteBtnText: { color: "#e53935", fontWeight: "bold", marginLeft: 8, fontSize: 15 },
  footerText: { fontSize: 12, color: "#999", textAlign: "center", paddingHorizontal: 10, lineHeight: 18 }
});
