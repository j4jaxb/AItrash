import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { recordGamePlay } from "../utils/gameService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GAME_HEIGHT = SCREEN_HEIGHT * 0.75;
const ITEM_SIZE = 85; // รูปใหญ่ขึ้นตามคำขอเพื่อให้กดง่ายและเห็นชัดเจน

// หมวดหมู่ขยะและข้อมูลพื้นฐาน
const TARGET_TYPES = [
  { name: "PETE", label: "พลาสติก PETE (เบอร์ 1)", icon: "water-outline", color: "#2B7A63" },
  { name: "HDPE", label: "พลาสติก HDPE (เบอร์ 2)", icon: "bottle-tonic-outline", color: "#3B7471" },
  { name: "PVC", label: "พลาสติก PVC (เบอร์ 3)", icon: "pipe-disconnected", color: "#B45309" },
  { name: "LDPE", label: "พลาสติก LDPE (เบอร์ 4)", icon: "shopping-outline", color: "#558686" },
  { name: "PP", label: "พลาสติก PP (เบอร์ 5)", icon: "spoon-sugar", color: "#0A4C47" },
  { name: "PS", label: "พลาสติก PS (เบอร์ 6)", icon: "cup-outline", color: "#0891B2" },
];

const OTHER_TYPES = [
  { name: "Glass", label: "แก้ว (Glass)", icon: "glass-fragile", color: "#558686" },
  { name: "Metal", label: "โลหะ (Metal)", icon: "silverware-fork-knife", color: "#9F1239" },
  { name: "Paper", label: "กระดาษ (Paper)", icon: "document-text-outline", color: "#8EADAD" },
];

const FALLING_TYPES = [...TARGET_TYPES, ...OTHER_TYPES];

// ลิงก์รูปภาพขยะประเภทละ 3 ดีไซน์ (สุ่มหยิบมาใช้ในเกม)
const TRASH_IMAGES = {
  PETE: [
    require("../assets/pete_1.png"),
    require("../assets/pete_2.png"),
    require("../assets/pete_3.png"),
  ],
  HDPE: [
    require("../assets/hdpe_1.png"),
    require("../assets/hdpe_2.png"),
    require("../assets/hdpe_3.png"),
  ],
  PVC: [
    require("../assets/pvc_1.png"),
    require("../assets/pvc_2.png"),
    require("../assets/pvc_3.png"),
  ],
  LDPE: [
    require("../assets/ldpe_1.png"),
    require("../assets/ldpe_2.png"),
    require("../assets/ldpe_3.png"),
  ],
  PP: [
    require("../assets/pp_1.png"),
    require("../assets/pp_2.png"),
    require("../assets/pp_3.png"),
  ],
  PS: [
    require("../assets/ps_1.png"),
    require("../assets/ps_2.png"),
    require("../assets/ps_3.png"),
  ],
  Glass: [
    require("../assets/glass_1.png"),
    require("../assets/glass_2.png"),
    require("../assets/glass_3.png"),
  ],
  Metal: [
    require("../assets/metal_1.png"),
    require("../assets/metal_2.png"),
    require("../assets/metal_3.png"),
  ],
  Paper: [
    require("../assets/paper_1.png"),
    require("../assets/paper_2.png"),
    require("../assets/paper_3.png"),
  ],
};

export default function TrashCatcherGameScreen({ navigation, user }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [targetType, setTargetType] = useState(TARGET_TYPES[0]);
  const [fallingItems, setFallingItems] = useState([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const gameInterval = useRef(null);
  const spawnInterval = useRef(null);
  const countdownInterval = useRef(null);
  

  // สุ่มเลือกเป้าหมายที่จะเล่นในตาปัจจุบัน (เลือกแค่ครั้งเดียวตอนเริ่มเกม)
  const chooseGameTarget = () => {
    const randomIndex = Math.floor(Math.random() * TARGET_TYPES.length);
    setTargetType(TARGET_TYPES[randomIndex]);
  };

  const prepareGame = () => {
    setScore(0);
    setFallingItems([]);
    setShowWinModal(false);
    chooseGameTarget();
    setIsConfirming(true); // แสดงหน้าต่างยืนยันเป้าหมายขยะ
  };

  const startCountdown = () => {
    setIsConfirming(false);
    setIsPlaying(true);
    setCountdown(3);

    let count = 3;
    countdownInterval.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownInterval.current);
        setCountdown(null);
        startGamePlayLoops();
      }
    }, 1000);
  };

  const startGamePlayLoops = () => {
    clearInterval(gameInterval.current);
    clearInterval(spawnInterval.current);

    // เริ่มให้ขยะปรากฏทันทีเพื่อให้เกมดูมีชีวิตชีวาและไม่ต้องรอ
    spawnTrash();

    // เกมลูปอัปเดตตำแหน่งขยะและการหมุน (60 FPS)
    gameInterval.current = setInterval(updatePhysics, 1000 / 60);

    // สุ่มเกิดขยะถี่ขึ้น 3 เท่าจากเดิมทุกๆ 0.2 วินาที (200ms) ตามคำขอ
    spawnInterval.current = setInterval(spawnTrash, 180);
  };

  const stopGame = () => {
    setIsPlaying(false);
    setIsConfirming(false);
    setCountdown(null);
    clearInterval(gameInterval.current);
    clearInterval(spawnInterval.current);
    clearInterval(countdownInterval.current);
  };

  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []);

  // เกิดขยะใหม่หล่นจากด้านบนพร้อมมุมการหมุนและการสุ่มดีไซน์
  const spawnTrash = () => {
    const randomIndex = Math.floor(Math.random() * FALLING_TYPES.length);
    const trashType = FALLING_TYPES[randomIndex];
    
    // สุ่มเลือกรูปภาพดีไซน์ 1 ใน 3 สำหรับประเภทนั้นๆ
    const designIndex = Math.floor(Math.random() * 3);
    const imageSource = TRASH_IMAGES[trashType.name][designIndex];

    const newItem = {
      id: Math.random().toString(),
      x: Math.random() * (SCREEN_WIDTH - ITEM_SIZE - 30) + 15,
      y: -ITEM_SIZE,
      type: trashType.name,
      label: trashType.label,
      imageSource: imageSource,
      color: trashType.color,
      speed: Math.random() * 1.5 + 3.0, // ความเร็วหล่น 3.0 - 4.5
      rotation: Math.random() * 360, // มุมเริ่มต้นสุ่ม
      rotationSpeed: (Math.random() - 0.5) * 3, // ความเร็วการเอียง/พลิก (-1.5 ถึง +1.5 องศาต่อเฟรม)
    };
    setFallingItems(prev => [...prev, newItem]);
  };

  // อัปเดตตำแหน่งและการพลิกตะแคงของขยะ
  const updatePhysics = () => {
    setFallingItems(prevItems => {
      const remainingItems = [];

      for (let i = 0; i < prevItems.length; i++) {
        const item = prevItems[i];
        const nextY = item.y + item.speed;
        const nextRotation = (item.rotation + item.rotationSpeed) % 360;

        // หากขยะเลยขอบล่างของพื้นที่เล่นเกม ให้ตัดทิ้งไป
        if (nextY < GAME_HEIGHT - 30) {
          remainingItems.push({ 
            ...item, 
            y: nextY, 
            rotation: nextRotation 
          });
        }
      }

      return remainingItems;
    });
  };

  // จัดการเมื่อผู้ใช้แตะโดนขยะ
  const handleTapItem = (itemId, itemType, itemLabel) => {
    if (!isPlaying) return;

    // ลบขยะชิ้นที่ถูกแตะออกจากจอทันที
    setFallingItems(prev => prev.filter(item => item.id !== itemId));

    setScore(prevScore => {
      let newScore = prevScore;
      if (itemType === targetType.name) {
        newScore = prevScore + 1;
        if (newScore >= 20) {
          handleWin();
        }
      } else {
        newScore = Math.max(0, prevScore - 1);
      }
      return newScore;
    });
  };

  

  

  const handleWin = async () => {
    stopGame();
    setShowWinModal(true);
    if (user?.id) {
      await recordGamePlay(user.id, "catcher");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            stopGame();
            navigation.goBack();
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เกมฝนขยะ (Trash Raining)</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* GAME PLAY AREA */}
      {isPlaying ? (
        <>
          {/* GAME SCORE & TARGET */}
          <View style={styles.dashboard}>
            <View style={styles.targetBox}>
              <Text style={styles.targetTitle}>เป้าหมายการแตะเก็บในตานี้</Text>
              <View style={[styles.targetBadge, { backgroundColor: targetType.color }]}>
                <MaterialCommunityIcons name={targetType.icon} size={20} color="#FFF" />
                <Text style={styles.targetText}>{targetType.label}</Text>
              </View>
            </View>

            <View style={styles.scoreBox}>
              <Text style={styles.scoreTitle}>คะแนนสะสม</Text>
              <Text style={[styles.scoreValue, score >= 20 && { color: "#059669" }]}>
                {score} / 20
              </Text>
            </View>
          </View>

          <View style={styles.gameView}>
            {fallingItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[
                  styles.fallingItemTouch,
                  { left: item.x, top: item.y },
                ]}
                onPress={() => handleTapItem(item.id, item.type, item.label)}
              >
                <Image
                  source={item.imageSource}
                  style={[
                    styles.fallingImage,
                    { transform: [{ rotate: `${item.rotation}deg` }] }
                  ]}
                />
              </TouchableOpacity>
            ))}

            {countdown !== null && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.introView}>
          <MaterialCommunityIcons name="weather-pouring" size={80} color="#1E6C5B" />
          <Text style={styles.introTitle}>กติกาการเล่นเกมฝนขยะ</Text>
          <View style={styles.rulesList}>
            <Text style={styles.ruleText}>1. สังเกต "เป้าหมายขยะที่กำหนด" ที่ด้านบน (โจทย์จะไม่เปลี่ยนตลอดทั้งเกมนี้)</Text>
            <Text style={styles.ruleText}>2. ขยะประเภทต่างๆ 3 ดีไซน์จะร่วงและหมุนตะแคงลงมาจากด้านบน</Text>
            <Text style={styles.ruleText}>3. **แตะที่ขยะโดยตรงเพื่อเก็บ** (ไม่มีถังขยะด้านล่างแล้ว)</Text>
            <Text style={styles.ruleText}>4. แตะขยะตรงกับโจทย์ **+1 คะแนน** | แตะผิดประเภท **-1 คะแนน**</Text>
            <Text style={styles.ruleText}>5. ทำคะแนนให้ครบ **20 คะแนน** เพื่อชนะและรับ **5 XP** ประจำวัน!</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={prepareGame}>
            <Text style={styles.startBtnText}>เริ่มเล่นเกม</Text>
            <Ionicons name="play-circle-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* CONFIRM TARGET MODAL */}
      <Modal visible={isConfirming} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="target" size={60} color="#0F3D34" style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>เป้าหมายการเก็บขยะ</Text>
            <Text style={styles.confirmDesc}>
              รอบนี้คุณต้องแตะเก็บขยะประเภทด้านล่างนี้เท่านั้น ห้ามแตะขยะประเภทอื่น!
            </Text>
            
            <View style={[styles.confirmTargetBadge, { backgroundColor: targetType.color }]}>
              <MaterialCommunityIcons name={targetType.icon} size={40} color="#FFF" />
              <Text style={styles.confirmTargetText}>{targetType.label}</Text>
            </View>

            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={startCountdown}
            >
              <Text style={styles.confirmBtnText}>ยืนยันและพร้อมเล่น</Text>
              <Ionicons name="play-circle-outline" size={22} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={stopGame}
            >
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WIN MODAL */}
      <Modal visible={showWinModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="trophy" size={80} color="#FFD700" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>คุณชนะแล้ว!</Text>
            <Text style={styles.modalDesc}>
              เก่งมาก! คุณสะสมคะแนนครบ 20 แต้ม และได้รับโบนัสประจำวันเรียบร้อยแล้ว
            </Text>
            <Text style={styles.successBig}>สำเร็จ20</Text>
            <View style={styles.xpBonusBadge}>
              <MaterialCommunityIcons name="leaf" size={20} color="#FFF" />
              <Text style={styles.xpBonusText}>+5 XP ได้รับแล้ว</Text>
            </View>

            <TouchableOpacity 
              style={styles.closeModalBtn}
              onPress={() => {
                setShowWinModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.closeModalText}>กลับสู่หน้าหลัก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hidden preloader container to cache images */}
      <View style={{ position: 'absolute', top: 9999, left: 9999, width: 1, height: 1, overflow: 'hidden' }}>
        {Object.values(TRASH_IMAGES).flatMap(arr => arr).map((src, i) => (
          <Image key={`trash-${i}`} source={src} style={{ width: 100, height: 100 }} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  dashboard: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  targetBox: { flex: 2, justifyContent: "center" },
  targetTitle: { fontSize: 11, color: "#8E9B96", fontWeight: "bold", marginBottom: 4 },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  targetText: { color: "#FFF", fontSize: 13, fontWeight: "bold", marginLeft: 6 },
  scoreBox: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
  scoreTitle: { fontSize: 11, color: "#8E9B96", fontWeight: "bold", marginBottom: 4 },
  scoreValue: { fontSize: 18, fontWeight: "bold", color: "#0F3D34" },
  gameView: {
    flex: 1,
    backgroundColor: "#E4ECE8",
    height: GAME_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  fallingItemTouch: {
    position: "absolute",
    width: ITEM_SIZE + 10,
    height: ITEM_SIZE + 15,
    justifyContent: "center",
    alignItems: "center",
  },
  fallingImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    resizeMode: "contain",
  },
  miniBadge: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  miniBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  introView: { flex: 1, justifyContent: "center", alignItems: "center", padding: 25 },
  introTitle: { fontSize: 22, fontWeight: "bold", color: "#0F3D34", marginTop: 15, marginBottom: 15 },
  rulesList: { backgroundColor: "#FFF", padding: 20, borderRadius: 15, borderWidth: 1, borderColor: "#E4ECE8", marginBottom: 30, width: "100%" },
  ruleText: { fontSize: 13, color: "#4A5A54", lineHeight: 22, marginBottom: 8 },
  startBtn: {
    flexDirection: "row",
    backgroundColor: "#0F3D34",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    elevation: 2,
  },
  startBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginRight: 10 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#FFF", borderRadius: 25, padding: 30, alignItems: "center", elevation: 5 },
  modalTitle: { fontSize: 24, fontWeight: "bold", color: "#0F3D34", marginBottom: 10 },
  modalDesc: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  xpBonusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
  },
  xpBonusText: { color: "#FFF", fontWeight: "bold", fontSize: 14, marginLeft: 6 },
  closeModalBtn: { backgroundColor: "#0F3D34", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  closeModalText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 61, 52, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  countdownText: {
    fontSize: 100,
    fontWeight: "bold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F3D34",
    marginBottom: 5,
  },
  confirmDesc: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 18,
  },
  confirmTargetBadge: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderRadius: 20,
    marginVertical: 15,
    width: "100%",
    elevation: 3,
  },
  confirmTargetText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  confirmBtn: {
    flexDirection: "row",
    backgroundColor: "#0F3D34",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    elevation: 2,
  },
  confirmBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "bold",
  },
  tapEffect: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    elevation: 4,
  },
  tapEffectText: {
    color: "#E11D48",
    fontWeight: "bold",
    fontSize: 12,
  },
  ripple: {
    position: "absolute",
    // base style overridden inline for multiple layers
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  sparkle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 6,
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  successBig: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#059669",
    marginTop: 10,
    marginBottom: 8,
  },
});
