import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions, // 🔥 เพิ่ม Dimensions เพื่อคำนวณขนาดหน้าจอ
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 🔥 คำนวณขนาดสี่เหลี่ยมจตุรัส โดยอิงจากความกว้างหน้าจอและหักลบ Margin
const { width } = Dimensions.get("window");
const MARGIN = 20;
const IMAGE_SIZE = width - MARGIN * 2; // ขนาดรูปภาพจะเท่ากับความกว้างหน้าจอหัก Margin

export default function ResultScreen({ route, navigation }) {
  const { image } = route.params;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - คงเดิม */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>ผลการตรวจสอบ</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 🔥 ส่วนแสดงรูปภาพแบบสี่เหลี่ยมจตุรัส */}
        <View style={styles.imageContainer}>
          <View style={styles.imageCard}>
            <Image source={{ uri: image }} style={styles.mainImage} />
          </View>
        </View>

        {/* ส่วนข้อมูลด้านล่าง - คงเดิม */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>สถานะระบบ</Text>

          {loading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color="#0066cc" size="large" />
              <Text style={styles.statusText}>กำลังตรวจสอบ...</Text>
            </View>
          ) : (
            <View>
              <View style={styles.resultCard}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={40}
                    color="#ff9900"
                  />
                </View>
                <Text style={styles.materialName}>ยังไม่มี AI วิเคราะห์</Text>
                <Text style={styles.description}>
                  ขณะนี้ระบบยังไม่มีฟังก์ชัน AI
                  สำหรับวิเคราะห์ประเภทวัสดุอัตโนมัติ
                  โปรดติดตามการอัปเดตในอนาคตเพื่อการใช้งานที่เต็มรูปแบบ
                </Text>
              </View>

              <TouchableOpacity
                style={styles.actionBtnDisabled}
                disabled={true}
              >
                <Ionicons name="bookmark-outline" size={20} color="#888" />
                <Text style={styles.actionBtnTextDisabled}>
                  ไม่สามารถบันทึกประวัติได้
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10, // ปรับลด Padding Top เล็กน้อยเพื่อให้สมดุล
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#333" },

  // 🔥 Style ใหม่สำหรับจัดวางรูปภาพให้เป็นจตุรัสและอยู่กึ่งกลาง
  imageContainer: {
    alignItems: "center", // จัดให้อยู่กึ่งกลางแนวนอน
    marginVertical: 20,
  },
  imageCard: {
    width: IMAGE_SIZE, // 🔥 ใช้ขนาดที่คำนวณได้
    height: IMAGE_SIZE, // 🔥 กำหนดสูงเท่ากับกว้าง เพื่อเป็นจตุรัส
    borderRadius: 24, // เพิ่มความโค้งเล็กน้อยให้ดูทันสมัย
    overflow: "hidden",
    backgroundColor: "#fff", // เพิ่มพื้นหลังสีขาวกรณีรูปโหลดไม่ขึ้น

    // ส่วนเงา (Shadow)
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover", // ให้รูปครอบคลุมพื้นที่ทั้งหมดโดยไม่เสียสัดส่วน
  },

  infoSection: { paddingHorizontal: 20, marginTop: 10 }, // 🔥 เพิ่ม Margin Top เล็กน้อย
  label: { fontSize: 14, color: "#888", marginBottom: 12, fontWeight: "600" },
  statusBox: { padding: 40, alignItems: "center", backgroundColor: "#fff", borderRadius: 20, elevation: 2 },
  statusText: { marginTop: 15, color: "#0066cc", fontWeight: "500", fontSize: 15 },
  
  resultCard: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderTopWidth: 5,
    borderTopColor: "#ff9900",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  iconContainer: { marginBottom: 15 },
  materialName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
    fontSize: 14,
  },
  actionBtnDisabled: {
    backgroundColor: "#E0E0E0", // ปรับสีเทาให้ดูอ่อนลงเล็กน้อย
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18, // เพิ่ม Padding ให้ปุ่มดูใหญ่ขึ้น
    borderRadius: 15,
    marginTop: 25,
  },
  actionBtnTextDisabled: { color: "#888", fontWeight: "bold", marginLeft: 8, fontSize: 15 },
});