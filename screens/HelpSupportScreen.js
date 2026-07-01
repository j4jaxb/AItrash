import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function HelpSupportScreen({ navigation, route, user: loggedInUser }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const activeUser = route?.params?.user ?? loggedInUser;

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อความหรือคำถามของคุณ");
      return;
    }

    try {
      setSending(true);

      // Insert message into database
      const { error } = await supabase.from("support_messages").insert([
        {
          user_id: activeUser?.id ?? null,
          email: activeUser?.email ?? null,
          message: message.trim(),
          created_at: new Date().toISOString(),
          status: "ยังไม่ตอบกลับ",
        },
      ]);

      if (error) throw error;

      Alert.alert("สำเร็จ", "ข้อความของคุณได้ถูกส่งไปยังทีมสนับสนุนของเรา เราจะติดต่อกลับคุณทางอีเมล", [
        { text: "ตกลง", onPress: () => {
          setMessage("");
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      console.log("Send support message error:", error);
      Alert.alert("ข้อผิดพลาด", error?.message || "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่");
    } finally {
      setSending(false);
    }
  };

  const faqList = [
    { q: "การสแกน AI ทำงานอย่างไร?", a: "โมเดล AI ของเราจะวิเคราะห์อินพุตจากกล้องเพื่อตรวจจับคุณสมบัติทางกายภาพของสิ่งของ และเปรียบเทียบกับฐานข้อมูลวัสดุที่นำมาใช้ใหม่ได้" },
    { q: "ทำไมการสแกนของฉันจึงล้มเหลว?", a: "ตรวจสอบให้แน่ใจว่าสิ่งของมีแสงเพียงพอ มองเห็นได้ชัดเจน และกล้องอยู่นิ่ง บางครั้งสิ่งของที่มีรอยย่นหรือสกปรกอาจเป็นการยากต่อการจดจำของ AI" },
    { q: "ฉันจะแลกคะแนน XP ได้อย่างไร?", a: "ไปที่หน้า Rewards โดยแตะที่ XP ของคุณบนหน้า Profile หรือ Stats คุณสามารถแลกคะแนน XP เพื่อรับส่วนลดและรายการต่างๆ ได้" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>ติดต่อเรา</Text>
          <Text style={styles.contactDesc}>มีปัญหาหรือต้องการความช่วยเหลือ? ส่งข้อความมาให้เราและเราจะติดต่อกลับคุณทางอีเมล</Text>
          
          <TextInput
            style={styles.textArea}
            placeholder="พิมพ์ข้อความของคุณที่นี่..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.sendBtnText}>ส่งข้อความ</Text>
                <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginLeft: 5, marginTop: 20 }]}>คำถามที่พบบ่อย</Text>
        
        {faqList.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <Text style={styles.faqQ}>{faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}

        <View style={styles.directContactBox}>
          <Text style={styles.directContactText}>หรือเขียนอีเมลถึงเราได้ที่:</Text>
          <Text style={styles.directContactEmail}>jnp.trash@gmail.com</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFF" },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  content: { padding: 15 },
  contactCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 15, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34", marginBottom: 10 },
  contactDesc: { fontSize: 14, color: "#666", marginBottom: 15 },
  textArea: { backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#E4ECE8", borderRadius: 10, padding: 15, fontSize: 15, minHeight: 120 },
  sendBtn: { backgroundColor: "#1E6C5B", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 15, borderRadius: 10, marginTop: 15, opacity: 0.9 },
  sendBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  faqCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 10 },
  faqQ: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 8 },
  faqA: { fontSize: 14, color: "#666", lineHeight: 20 },
  directContactBox: { marginTop: 30, alignItems: "center" },
  directContactText: { fontSize: 14, color: "#666" },
  directContactEmail: { fontSize: 16, fontWeight: "bold", color: "#1E6C5B", marginTop: 5 }
});
