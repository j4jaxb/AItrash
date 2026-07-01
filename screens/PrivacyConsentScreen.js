import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyConsentScreen({ navigation, onConsent, onCancel }) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedData, setAgreedData] = useState(false);

  const handleContinue = () => {
    if (!agreedTerms || !agreedPrivacy || !agreedData) {
      Alert.alert("ต้องยอมรับทั้งหมด", "กรุณายอมรับเงื่อนไขทั้งหมดเพื่อดำเนินการต่อ");
      return;
    }
    if (onConsent) {
      onConsent();
      return;
    }
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacy & Consent</Text>
        <Text style={styles.headerSubtitle}>ยอมรับเงื่อนไขการใช้งาน</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TERMS OF SERVICE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#0F3D34" />
            <Text style={styles.sectionTitle}>Terms of Service</Text>
          </View>
          <View style={styles.consentCard}>
            <Text style={styles.contentText}>
              ใช้งานแอปได้ตามข้อกำหนดของนโยบายนี้เท่านั้น{"\n"}
              ห้ามใช้เพื่อกิจกรรมผิดกฎหมาย{"\n"}
              AItrash มีสิทธิ์ปิดบัญชีหากฝ่าฝืนกฎ
            </Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedTerms(!agreedTerms)}
            >
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>ฉันยอมรับเงื่อนไขการให้บริการ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PRIVACY POLICY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield" size={24} color="#0F3D34" />
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>
          <View style={styles.consentCard}>
            <Text style={styles.contentText}>
              ข้อมูลส่วนบุคคล ชื่อ อีเมล{"\n"}
              ข้อมูลการใช้งาน ประวัติการแสกน คะแนน ประวัติเกม{"\n"}
              รูปภาพสแกน เก็บไว้เพื่อปรับปรุง AI{"\n"}
              ไม่มีการขายข้อมูลให้บุคคลที่สาม
            </Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedPrivacy(!agreedPrivacy)}
            >
              <View style={[styles.checkbox, agreedPrivacy && styles.checkboxChecked]}>
                {agreedPrivacy && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>ฉันยอมรับนโยบายความเป็นส่วนตัว</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DATA USAGE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="database" size={24} color="#0F3D34" />
            <Text style={styles.sectionTitle}>Data Collection & Usage</Text>
          </View>
          <View style={styles.consentCard}>
            <Text style={styles.contentText}>
              เก็บข้อมูลการเล่นเกมและสถิติของคุณ{"\n"}
              อาจใช้สำหรับการวิจัยและการจำแนกชนิด{"\n"}
              สามารถลบข้อมูลได้ตลอดเวลาในการตั้งค่า
            </Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedData(!agreedData)}
            >
              <View style={[styles.checkbox, agreedData && styles.checkboxChecked]}>
                {agreedData && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>ฉันอนุญาตให้เก็บและใช้ข้อมูล</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            if (onCancel) return onCancel();
            if (navigation?.goBack) return navigation.goBack();
          }}
        >
          <Text style={styles.cancelBtnText}>ยกเลิก</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueBtn, (!agreedTerms || !agreedPrivacy || !agreedData) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!agreedTerms || !agreedPrivacy || !agreedData}
        >
          <Text style={styles.continueBtnText}>ดำเนินการต่อ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: {
    backgroundColor: "#0F3D34",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#CFDAD9",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F3D34",
    marginLeft: 10,
  },
  consentCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E4ECE8",
  },
  contentText: {
    fontSize: 12,
    color: "#444",
    lineHeight: 18,
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#1E6C5B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#1E6C5B",
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  continueBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1E6C5B",
    alignItems: "center",
  },
  continueBtnDisabled: {
    backgroundColor: "#A0B5B0",
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
  },
});
