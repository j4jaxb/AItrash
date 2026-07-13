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
              ก่อนใช้งาน AItrash กรุณาอ่านและยอมรับข้อกำหนดการใช้งาน{"\n\n"}
              • ใช้งานแอปตามวัตถุประสงค์ที่กำหนด{"\n"}
              • ไม่ใช้แอปในกิจกรรมที่ผิดกฎหมายหรือส่งผลกระทบต่อระบบ{"\n"}
              • AItrash ขอสงวนสิทธิ์ในการระงับบัญชี หากพบการละเมิดข้อกำหนด
            </Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedTerms(!agreedTerms)}
            >
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>

              <Text style={styles.checkboxLabel}>
                ฉันได้อ่านและยอมรับข้อกำหนดการใช้งาน
              </Text>
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
              AItrash ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งาน{"\n\n"}

              ข้อมูลที่อาจมีการเก็บรวบรวม ได้แก่{"\n"}
              • ข้อมูลบัญชี เช่น ชื่อ และอีเมล{"\n"}
              • ข้อมูลการใช้งาน เช่น ประวัติการสแกน คะแนน และสถิติการเล่นเกม{"\n"}
              • รูปภาพหรือข้อมูลที่ใช้สำหรับการวิเคราะห์ด้วย AI{"\n\n"}

              ข้อมูลเหล่านี้ใช้เพื่อปรับปรุงประสิทธิภาพของระบบ{"\n"}
              พัฒนาฟีเจอร์ และเพิ่มประสบการณ์การใช้งานให้ดีขึ้น{"\n\n"}

              AItrash ไม่มีการจำหน่ายข้อมูลส่วนบุคคลให้กับบุคคลภายนอก
            </Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedPrivacy(!agreedPrivacy)}
            >
              <View style={[styles.checkbox, agreedPrivacy && styles.checkboxChecked]}>
                {agreedPrivacy && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>

              <Text style={styles.checkboxLabel}>
                ฉันยอมรับนโยบายความเป็นส่วนตัวและการจัดการข้อมูล
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* DATA USAGE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="database" size={24} color="#0F3D34" />
            <Text style={styles.sectionTitle}>Data Usage</Text>
          </View>

          <View style={styles.consentCard}>
            <Text style={styles.contentText}>
              การอนุญาตให้ใช้ข้อมูลช่วยให้ AItrash สามารถพัฒนาแอป
              และปรับปรุงระบบ AI ได้อย่างมีประสิทธิภาพมากขึ้น{"\n\n"}

              ข้อมูลอาจถูกนำไปใช้เพื่อ{"\n"}
              • วิเคราะห์และเพิ่มความแม่นยำของระบบ AI{"\n"}
              • ปรับปรุงรูปแบบการใช้งานและประสบการณ์ของผู้ใช้{"\n"}
              • จัดทำสถิติการใช้งานภายในระบบ{"\n\n"}

              ผู้ใช้สามารถจัดการหรือลบข้อมูลของตนเองได้จากเมนูการตั้งค่า
            </Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedData(!agreedData)}
            >
              <View style={[styles.checkbox, agreedData && styles.checkboxChecked]}>
                {agreedData && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>

              <Text style={styles.checkboxLabel}>
                ฉันอนุญาตให้ AItrash ใช้ข้อมูลเพื่อพัฒนาแอป
              </Text>
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
