import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function EditProfileScreen({ route, navigation, user, setUser }) {

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileBase64, setProfileBase64] = useState(user?.profile || null);
  const [profileUri, setProfileUri] = useState(null);

  useEffect(() => {
    loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user) return;
    if (user.profile && user.profile.startsWith("data:image")) {
      setProfileBase64(user.profile);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      console.log("Permission status:", status);
      
      if (status !== "granted") {
        Alert.alert("ต้องการอนุญาต", "กรุณาอนุญาตการเข้าถึงรูปภาพในการตั้งค่า");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log("Selected image URI:", uri);
        setProfileUri(uri);
        await uploadProfileImage(uri);
      } else {
        console.log("Image selection canceled");
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("เปิดรูปภาพไม่สำเร็จ", error?.message || "เกิดข้อผิดพลาด");
    }
  };

  const uploadProfileImage = async (uri) => {
    if (!uri) return;
    try {
      setLoading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      // แปลง blob เป็น Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setProfileBase64(base64);
        setProfileUri(uri);
        
        console.log("Profile image converted to Base64, length:", base64.length);
        setLoading(false);
        Alert.alert("อัปโหลดสำเร็จ", "รูปโปรไฟล์ถูกเลือกเรียบร้อย");
      };

      reader.onerror = () => {
        setLoading(false);
        Alert.alert("แปลงรูปไม่สำเร็จ", "เกิดข้อผิดพลาดในการอ่านไฟล์");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.log("Upload profile error", error);
      Alert.alert("เลือกรูปไม่สำเร็จ", error?.message || "ลองอีกครั้ง");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("กรุณากรอกข้อมูล", "ชื่อและนามสกุลต้องไม่ว่าง");
      return;
    }

    if (newPassword.trim()) {
      if (!oldPassword.trim()) {
        Alert.alert("กรุณายืนยันรหัสผ่าน", "กรุณาใส่รหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่าน");
        return;
      }

      if (oldPassword !== user.password) {
        Alert.alert("รหัสผ่านไม่ถูกต้อง", "กรุณากรอกรหัสผ่านเดิมให้ถูกต้อง");
        return;
      }
    }

    setLoading(true);

    const updates = {
      first_name: firstName,
      last_name: lastName,
    };

    if (newPassword.trim()) {
      updates.password = newPassword;
    }

    if (profileBase64) {
      updates.profile = profileBase64;
    } else if (user.profile) {
      // ถ้าไม่เปลี่ยนรูป ให้เก็บรูปเดิมไว้
      updates.profile = user.profile;
    }

    try {
      const { data, error } = await supabase
        .from("user")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert("บันทึกสำเร็จ", "ข้อมูลโปรไฟล์ถูกอัปเดตเรียบร้อย");

      if (setUser) {
        setUser(data);
      }

      navigation.goBack();
    } catch (error) {
      console.log("Update profile error", error);
      Alert.alert("อัปเดตไม่สำเร็จ", error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>ไม่พบข้อมูลผู้ใช้</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#004743" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profileBase64 || profileUri ? (
              <Image source={{ uri: profileBase64 || profileUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
                <Text style={styles.avatarLabel}>เพิ่มรูปโปรไฟล์</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>ชื่อ</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="กรอกชื่อ"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>นามสกุล</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="กรอกนามสกุล"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>รหัสผ่านเดิม</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="กรอกรหัสผ่านเดิม"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="กรอกรหัสผ่านใหม่"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0f766e" />
              <Text style={styles.loadingText}>กำลังอัปเดตโปรไฟล์...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f2" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomColor: "#eef3ea",
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef8f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#004743" },
  headerSpacer: { width: 40 },
  inner: { padding: 20, paddingTop: 16, paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarWrapper: { alignItems: "center", marginBottom: 18 },
  avatar: { width: 120, height: 120, borderRadius: 60, resizeMode: "cover" },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#d7f3eb",
  },
  avatarLabel: { color: "#fff", marginTop: 8, fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#004743",
    marginBottom: 14,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 14,
    backgroundColor: "#f8fbf8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e7efe8",
  },
  label: { fontSize: 13, marginBottom: 6, color: "#0f766e", fontWeight: "800" },
  input: {
    borderWidth: 0,
    paddingVertical: 6,
    fontSize: 16,
    color: "#111827",
  },
  loadingBox: { alignItems: "center", marginTop: 16, paddingVertical: 12 },
  loadingText: { marginTop: 10, color: "#0f766e", fontSize: 15, fontWeight: "600" },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#0f766e",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#0f766e",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
});