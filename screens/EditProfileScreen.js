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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.inner}>

        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
          {profileBase64 || profileUri ? (
            <Image source={{ uri: profileBase64 || profileUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#fff" />
              <Text style={styles.avatarLabel}>เพิ่มรูปโปรไฟล์</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ชื่อ</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>นามสกุล</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>รหัสผ่านเดิม</Text>
          <TextInput style={styles.input} secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)</Text>
          <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#222" style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>บันทึก</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  inner: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  avatarWrapper: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, resizeMode: "cover" },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#aaa",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLabel: { color: "#fff", marginTop: 8, fontSize: 12 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#059669",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});