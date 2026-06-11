import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function HelpSupportScreen({ navigation }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your message or question.");
      return;
    }
    Alert.alert("Success", "Your message has been sent to our support team. We will get back to you shortly.", [
      { text: "OK", onPress: () => {
        setMessage("");
        navigation.goBack();
      }}
    ]);
  };

  const faqList = [
    { q: "How does the AI scanning work?", a: "Our AI model analyzes your camera input to detect the physical properties of the item, matching it against our database of recyclable materials." },
    { q: "Why did my scan fail?", a: "Ensure the item is well-lit, clearly visible, and the camera is steady. Sometimes items that are heavily crumpled or dirty might be harder for the AI to recognize." },
    { q: "How do I redeem my XP points?", a: "Navigate to the Rewards screen by tapping your XP on the Profile or Stats page. There you can exchange XP for available discounts and items." },
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
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.contactDesc}>Having an issue or need help? Send us a message directly.</Text>
          
          <TextInput
            style={styles.textArea}
            placeholder="Type your message here..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendBtnText}>Send Message</Text>
            <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginLeft: 5, marginTop: 20 }]}>Frequently Asked Questions</Text>
        
        {faqList.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <Text style={styles.faqQ}>{faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}

        <View style={styles.directContactBox}>
          <Text style={styles.directContactText}>Or email us directly at:</Text>
          <Text style={styles.directContactEmail}>support@aitrashapp.com</Text>
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
  sendBtn: { backgroundColor: "#1E6C5B", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 15, borderRadius: 10, marginTop: 15 },
  sendBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  faqCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 10 },
  faqQ: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 8 },
  faqA: { fontSize: 14, color: "#666", lineHeight: 20 },
  directContactBox: { marginTop: 30, alignItems: "center" },
  directContactText: { fontSize: 14, color: "#666" },
  directContactEmail: { fontSize: 16, fontWeight: "bold", color: "#1E6C5B", marginTop: 5 }
});
