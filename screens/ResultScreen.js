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
  Dimensions,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase";
import Constants from "expo-constants";
import { loadStreak } from "../utils/streakService";
import { calculateAchievements } from "../utils/achievementService";
import { fetchAllUserResults, insertUserResults } from "../utils/resultService";

const { width } = Dimensions.get("window");
const MARGIN = 20;
const IMAGE_SIZE = width - MARGIN * 2;



export default function ResultScreen({ route, navigation, user }) {
  const { image } = route.params;
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [displayImage, setDisplayImage] = useState(image);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  const allCategories = ["PETE", "HDPE", "PVC", "LDPE", "PP", "PS", "glass", "metal", "paper"];

  const changeCategory = (newCategory) => {
    if (editingIndex !== null) {
      const newPredictions = [...predictions];
      newPredictions[editingIndex] = {
        ...newPredictions[editingIndex],
        class_name: newCategory,
        confidence: null, // ซ่อนเปอร์เซ็นต์เมื่อแก้เอง
        userConfirmedType: true,
      };
      setPredictions(newPredictions);
    }
    setModalVisible(false);
  };

  const toggleSaveSelection = (index) => {
    const newPredictions = [...predictions];
    newPredictions[index] = {
      ...newPredictions[index],
      selected: !newPredictions[index].selected,
    };
    setPredictions(newPredictions);
  };

  const cancelEdit = (index) => {
    const newPredictions = [...predictions];
    const pred = newPredictions[index];
    newPredictions[index] = {
      ...pred,
      class_name: pred.originalClassName ?? pred.class_name,
      confidence: pred.originalConfidence ?? pred.confidence,
      userConfirmedType: false,
    };
    setPredictions(newPredictions);
  };

  useEffect(() => {
    analyzeImage();
  }, []);

  const analyzeImage = async () => {
    try {
      let apiUrl = "http://10.0.2.2:5000/predict"; 
      if (Constants?.expoConfig?.hostUri) {
        const ip = Constants.expoConfig.hostUri.split(":")[0];
        apiUrl = `http://${ip}:5000/predict`;
      }

      const formData = new FormData();
      formData.append("image", {
        uri: image,
        type: "image/jpeg",
        name: "scan.jpg",
      });

      // ส่ง user_id ไปเพื่อให้เซิร์ฟเวอร์ดึงข้อมูลสแกนของวันนี้มาเทียบความซ้ำซ้อน
      if (user?.id) {
        formData.append("user_id", user.id);
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      console.log("Server response similarity score:", data.similarity_score);
      console.log("Server response predictions:", data.predictions);
      
      if (response.ok && data.predictions && data.predictions.length > 0) {
        setIsDuplicate(false);
        setPredictions(data.predictions.map((pred) => ({
          ...pred,
          userConfirmedType: false,
          selected: true,
          originalClassName: pred.class_name,
          originalConfidence: pred.confidence,
        })));
        if (data.image_base64) {
          setDisplayImage(data.image_base64);
        }
      } else {
        if (data.is_duplicate) {
          setIsDuplicate(true);
          setErrorMsg(data.error || "ปฏิเสธแต้ม: ตรวจพบว่าเป็นขยะชิ้นเดิมที่คุณเพิ่งแสกน");
        } else {
          setIsDuplicate(false);
          setErrorMsg(data.error || "ไม่พบขยะในภาพ หรือความมั่นใจต่ำเกินไป");
        }
        if (data.image_base64) {
          setDisplayImage(data.image_base64);
        }
      }
    } catch (error) {
      console.log("AI Error:", error);
      setIsDuplicate(false);
      setErrorMsg("ไม่สามารถเชื่อมต่อกับ AI Server ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (predictions.length === 0) {
      navigation.navigate("Scan");
      return;
    }

    try {
      setIsSaving(true);
      if (!user) {
        Alert.alert("Error", "User not logged in");
        setIsSaving(false);
        return;
      }

      // หาค่า ID สูงสุดเพื่อสร้าง ID ใหม่
      const { data: maxIdData } = await supabase
        .from('result')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
        
      let nextId = 1;
      if (maxIdData && maxIdData.length > 0) {
        nextId = maxIdData[0].id + 1;
      }

      const inserts = [];
      for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        if (!pred.selected) continue;

        let materialId = null;
        const { data: matData, error: matError } = await supabase
          .from('material')
          .select('id')
          .eq('material_name', pred.class_name)
          .single();

        if (matError || !matData) {
          Alert.alert("Notice", `ไม่พบหมวดหมู่ ${pred.class_name} ในฐานข้อมูล`);
        } else {
          materialId = matData.id;
        }

        inserts.push({
          id: nextId++,
          user_id: user.id,
          material_id: materialId,
          edit: pred.userConfirmedType ? 0 : 1,
        });
      }

      if (inserts.length === 0) {
        Alert.alert("แจ้งเตือน", "กรุณาเลือกผลที่ต้องการบันทึกก่อน");
        setIsSaving(false);
        return;
      }

      const oldData = await fetchAllUserResults(user.id);
      const oldStreak = await loadStreak(user.id);

      // Fetch goal data
      let goalTarget = null;
      let goalStartDate = null;
      let goalXp = 50;
      try {
        const { data: userData } = await supabase
          .from("user")
          .select("goal_target, goal_start_date, goal_xp")
          .eq("id", user.id)
          .single();
        if (userData) {
          goalTarget = userData.goal_target;
          goalStartDate = userData.goal_start_date;
          if (userData.goal_xp) goalXp = userData.goal_xp;
        }
      } catch (e) {
        // Ignore if columns don't exist
      }

      const oldAchievements = calculateAchievements(oldData || [], oldStreak, goalTarget, goalStartDate, goalXp);

      const { error } = await insertUserResults(inserts);
      if (error) throw error;
      

      
      const newData = await fetchAllUserResults(user.id);
      const newStreak = await loadStreak(user.id);
      const newAchievements = calculateAchievements(newData || [], newStreak, goalTarget, goalStartDate, goalXp);
      
      const newlyUnlocked = newAchievements.filter((newAch, idx) => newAch.unlocked && !oldAchievements[idx].unlocked);

      if (newlyUnlocked.length > 0) {
        setUnlockedAchievements(newlyUnlocked);
      } else {
        navigation.navigate("MainTabs", { screen: "Scan" });
      }
    } catch (err) {
      console.log("Save error:", err);
      Alert.alert("Error", "Failed to save result");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>ผลการตรวจสอบ</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.imageContainer}>
          <View style={styles.imageCard}>
            <Image source={{ uri: displayImage }} style={styles.mainImage} />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>ผลการวิเคราะห์จาก AI</Text>

          {isSaving ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color="#0F3D34" size="large" />
              <Text style={styles.statusText}>กำลังบันทึกข้อมูล...</Text>
            </View>
          ) : loading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color="#0F3D34" size="large" />
              <Text style={styles.statusText}>กำลังให้ AI ประมวลผล...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.resultCard}>
              <Ionicons name="warning" size={40} color="#ff3333" />
              <Text style={[styles.materialName, { color: '#ff3333' }]}>{isDuplicate ? 'ซ้ำกับที่คุณเคยแสกน' : 'ตรวจไม่พบ'}</Text>
              <Text style={styles.description}>{errorMsg}</Text>
              
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSkip]}
                onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>กลับสู่หน้าหลัก</Text>
              </TouchableOpacity>
            </View>
          ) : predictions.length > 0 ? (
            <View>
              {predictions.map((pred, index) => {
                const unsureMode = pred.confidence !== null && pred.confidence < 0.6;
                return (
                  <View key={index} style={[styles.resultCard, { marginTop: index > 0 ? 15 : 0 }, unsureMode && { borderTopColor: '#ff9900' }]}>
                    <View style={styles.nameRow}>
                      <Text style={styles.materialName}>{pred.class_name}</Text>
                      <TouchableOpacity onPress={() => { setEditingIndex(index); setModalVisible(true); }}>
                        <Ionicons name="pencil" size={24} color="#1E6C5B" style={{ marginLeft: 8 }} />
                      </TouchableOpacity>
                    </View>
                    
                    {pred.confidence !== null && (
                      <Text style={styles.description}>
                        ความมั่นใจ (Confidence): {(pred.confidence * 100).toFixed(2)}%
                      </Text>
                    )}
                    
                    {unsureMode && (
                      <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                          ⚠️ AI ไม่ค่อยแน่ใจ (ต่ำกว่า 60%)
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.checkboxContainer, { marginTop: unsureMode ? 10 : 20 }]}
                      onPress={() => toggleSaveSelection(index)}
                    >
                      <Ionicons 
                        name={pred.selected ? "checkbox" : "checkbox-outline"} 
                        size={24} 
                        color={pred.selected ? "#1E6C5B" : "#666"} 
                      />
                      <Text style={[styles.checkboxLabel, pred.selected ? {color: "#1E6C5B"} : {color: "#666"}]}>
                        {pred.selected ? "บันทึกผล" : "ไม่บันทึกผล"}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.checkboxContainer}>
                      <Ionicons 
                        name={pred.userConfirmedType ? "alert-circle-outline" : "checkmark-circle-outline"} 
                        size={20} 
                        color={pred.userConfirmedType ? "#ff9900" : "#1E6C5B"} 
                      />
                      <Text style={[styles.checkboxLabel, pred.userConfirmedType ? {color: "#ff9900"} : {color: "#1E6C5B"}]}> 
                        {pred.userConfirmedType ? "แก้ไขประเภทแล้ว" : "ยังไม่ได้แก้ไขประเภท"}
                      </Text>
                    </View>
                    {pred.userConfirmedType && (
                      <TouchableOpacity style={styles.cancelEditBtn} onPress={() => cancelEdit(index)}>
                        <Text style={styles.cancelEditText}>ยกเลิกแก้ไข</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSave}
              >
                <Ionicons 
                  name="bookmark-outline" 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.actionBtnText}>
                  บันทึกประวัติ
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>เลือกประเภทที่ถูกต้อง</Text>
            <FlatList 
              data={allCategories}
              keyExtractor={(item) => item}
              style={{ maxHeight: 300, width: "100%" }}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.catOption} onPress={() => changeCategory(item)}>
                  <Text style={styles.catOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Achievement Unlocked Modal */}
      <Modal visible={unlockedAchievements.length > 0} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.achievementModalContent}>
            <Ionicons name="trophy" size={60} color="#FFD700" style={{ marginBottom: 10 }} />
            <Text style={styles.achievementTitle}>ปลดล็อกความสำเร็จ!</Text>
            {unlockedAchievements.map((ach) => (
              <View key={ach.id} style={styles.achievementItem}>
                <View style={styles.achievementIconBox}>
                  <MaterialCommunityIcons name={ach.icon} size={30} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementName}>{ach.title}</Text>
                  <Text style={styles.achievementDesc}>{ach.desc} (+{ach.points} XP)</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.achievementCloseBtn} 
              onPress={() => {
                setUnlockedAchievements([]);
                navigation.navigate("MainTabs", { screen: "Scan" });
              }}
            >
              <Text style={styles.achievementCloseText}>สุดยอด!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoSection: { paddingHorizontal: 20, marginTop: 10 },
  label: { fontSize: 14, color: "#6E7B76", marginBottom: 12, fontWeight: "600" },
  statusBox: { padding: 40, alignItems: "center", backgroundColor: "#fff", borderRadius: 20, elevation: 2 },
  statusText: { marginTop: 15, color: "#0F3D34", fontWeight: "500", fontSize: 15 },
  resultCard: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderTopWidth: 5,
    borderTopColor: "#1E6C5B",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  iconContainer: { marginBottom: 10 },
  materialName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F3D34",
    marginBottom: 5,
    textAlign: "center",
  },
  description: {
    color: "#6E7B76",
    lineHeight: 22,
    textAlign: "center",
    fontSize: 14,
  },
  warningBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffcc80",
    width: "100%",
  },
  warningText: {
    color: "#e65100",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  cancelEditBtn: {
    marginTop: 10,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F8D7DA",
  },
  cancelEditText: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 13,
  },
  checkboxButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    backgroundColor: "#0F3D34",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    borderRadius: 15,
    marginTop: 25,
  },
  actionBtnSkip: {
    backgroundColor: "#e53935",
  },
  actionBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34", marginBottom: 15 },
  catOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#E4ECE8", width: "100%", alignItems: "center" },
  catOptionText: { fontSize: 16, color: "#333", fontWeight: "500" },
  closeModalBtn: { marginTop: 15, padding: 12, width: "100%", alignItems: "center", backgroundColor: "#e53935", borderRadius: 10 },
  closeModalText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  achievementModalContent: {
    backgroundColor: "#FFF",
    padding: 25,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F3D34",
    marginBottom: 20,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F9F8",
    padding: 15,
    borderRadius: 15,
    width: "100%",
    marginBottom: 10,
  },
  achievementIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1E6C5B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F3D34",
  },
  achievementDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  achievementCloseBtn: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 15,
  },
  achievementCloseText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});