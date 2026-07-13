import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function PrivacySettingsScreen({ navigation, user, setUser }) {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "ลบบัญชีและข้อมูลทั้งหมด",
      "การดำเนินการนี้จะลบบัญชี ประวัติการสแกน คะแนนเกม และข้อมูลทั้งหมดอย่างถาวร\n\nไม่สามารถกู้คืนข้อมูลได้",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบบัญชี",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "ยืนยันการลบบัญชี",
              'กรุณาพิมพ์ "DELETE" เพื่อยืนยันการลบข้อมูลถาวร',
              [
                {
                  text: "ยกเลิก",
                  style: "cancel",
                },
                {
                  text: "ยืนยันการลบ",
                  style: "destructive",
                  onPress: (text) => confirmDelete(text),
                },
              ],
              "plain-text"
            );
          },
        },
      ]
    );
  };


  const confirmDelete = async (confirmText) => {
    if (confirmText !== "DELETE") {
      Alert.alert(
        "ไม่สามารถดำเนินการได้",
        'กรุณาพิมพ์คำว่า "DELETE" ให้ถูกต้อง'
      );
      return;
    }

    try {
      setDeleting(true);

      if (user?.id) {

        // ลบผลการสแกน
        try {
          await supabase
            .from("result")
            .delete()
            .eq("user_id", user.id);
        } catch (err) {
          console.log("Ignore result delete error:", err);
        }


        // ลบประวัติการเล่นเกม
        await supabase
          .from("game_history")
          .delete()
          .eq("user_id", user.id);


        // ลบประวัติการสแกน
        await supabase
          .from("scan_history")
          .delete()
          .eq("user_id", user.id);


        // ลบรางวัล / ความสำเร็จ
        try {
          await supabase
            .from("user_achievements")
            .delete()
            .eq("user_id", user.id);

        } catch (err) {
          console.log("Ignore achievement delete error:", err);
        }


        // ลบข้อมูลผู้ใช้
        await supabase
          .from("user")
          .delete()
          .eq("id", user.id);
      }


      Alert.alert(
        "ลบบัญชีสำเร็จ",
        "บัญชีและข้อมูลทั้งหมดของคุณถูกลบเรียบร้อยแล้ว",
        [
          {
            text: "ตกลง",
            onPress: () => {
              setUser(null);
            },
          },
        ]
      );


    } catch (error) {

      console.log("Delete account error:", error);

      Alert.alert(
        "เกิดข้อผิดพลาด",
        error?.message || "ไม่สามารถลบบัญชีได้ กรุณาลองใหม่อีกครั้ง"
      );

    } finally {
      setDeleting(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons 
            name="arrow-back"
            size={24}
            color="#0F3D34"
          />
        </TouchableOpacity>


        <Text style={styles.headerTitle}>
          การตั้งค่าความเป็นส่วนตัว
        </Text>


        <View style={{ width: 24 }} />

      </View>



      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >


        <Text style={styles.sectionTitle}>
          ข้อมูลส่วนตัวและการใช้งานข้อมูล
        </Text>



        {/* DATA COLLECTION */}

        <View style={styles.infoCard}>

          <View style={styles.infoHeader}>

            <Ionicons
              name="information-circle"
              size={22}
              color="#1E6C5B"
            />

            <Text style={styles.infoTitle}>
              ข้อมูลที่ AItrash เก็บรวบรวม
            </Text>

          </View>


          <Text style={styles.infoText}>
            • ข้อมูลบัญชี เช่น อีเมลสำหรับเข้าสู่ระบบ
          </Text>

          <Text style={styles.infoText}>
            • ประวัติการสแกนพลาสติก เพื่อวิเคราะห์ประเภทของวัสดุ
          </Text>

          <Text style={styles.infoText}>
            • คะแนนเกม ระดับ และความสำเร็จภายในแอป
          </Text>

          <Text style={styles.infoText}>
            • ข้อมูลการใช้งาน เพื่อพัฒนาประสิทธิภาพของแอป
          </Text>

        </View>




        {/* DATA USAGE */}

        <View style={styles.infoCard}>

          <View style={styles.infoHeader}>

            <Ionicons
              name="shield-checkmark"
              size={22}
              color="#1E6C5B"
            />

            <Text style={styles.infoTitle}>
              การใช้ข้อมูลของคุณ
            </Text>

          </View>


          <Text style={styles.infoText}>
            • ใช้เพื่อปรับปรุงความแม่นยำของระบบ AI
          </Text>

          <Text style={styles.infoText}>
            • พัฒนาฟีเจอร์และประสบการณ์ใช้งาน
          </Text>

          <Text style={styles.infoText}>
            • จัดทำสถิติการใช้งานภายในระบบ
          </Text>

          <Text style={styles.infoText}>
            • ไม่มีการจำหน่ายข้อมูลส่วนบุคคลให้บุคคลภายนอก
          </Text>

        </View>




        {/* USER RIGHTS */}

        <View style={styles.infoCard}>

          <View style={styles.infoHeader}>

            <Ionicons
              name="person-circle"
              size={22}
              color="#1E6C5B"
            />

            <Text style={styles.infoTitle}>
              สิทธิ์ของผู้ใช้
            </Text>

          </View>


          <Text style={styles.infoText}>
            • สามารถตรวจสอบข้อมูลที่ระบบจัดเก็บ
          </Text>

          <Text style={styles.infoText}>
            • สามารถขอลบข้อมูลและบัญชีผู้ใช้
          </Text>

          <Text style={styles.infoText}>
            • สามารถจัดการข้อมูลส่วนตัวได้ตลอดเวลา
          </Text>

        </View>




        {/* DELETE */}

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >

          {
            deleting ? (

              <ActivityIndicator color="#e53935" />

            ) : (

              <>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#e53935"
                />

                <Text style={styles.deleteBtnText}>
                  ลบบัญชีและข้อมูลทั้งหมด
                </Text>

              </>

            )
          }


        </TouchableOpacity>



        <Text style={styles.footerText}>
          การลบบัญชีจะลบข้อมูลโปรไฟล์ ประวัติการสแกน
          ประวัติการเล่นเกม และข้อมูลที่เกี่ยวข้องทั้งหมดอย่างถาวร
          การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </Text>



      </ScrollView>


    </SafeAreaView>
  );
}




const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F6F8F7",
  },


  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
  },


  backBtn: {
    padding: 5,
  },


  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F3D34",
  },


  content: {
    padding: 20,
  },


  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F3D34",
    marginTop: 10,
    marginBottom: 15,
  },


  infoCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#1E6C5B",
  },


  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },


  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F3D34",
    marginLeft: 8,
  },


  infoText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 7,
    lineHeight: 18,
  },


  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 12,
    marginTop: 10,
  },


  deleteBtnText: {
    color: "#e53935",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 15,
  },


  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 18,
    marginTop: 15,
    marginBottom: 30,
  },

});