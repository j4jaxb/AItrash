import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { recordGamePlay } from "../utils/gameService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SIZE = (SCREEN_WIDTH - 60) / 3; // 3 columns layout

// คู่การ์ดสำหรับเล่นเกม (พลาสติก 6 ประเภท = 12 ใบ)
const PAIRS_DATA = [
  { id: 1, className: "PETE", title: "PETE", label: "ขวดน้ำดื่ม", icon: "water-outline", color: "#2B7A63", assetKey: "pete" },
  { id: 2, className: "HDPE", title: "HDPE", label: "แกลลอนนม", icon: "bottle-tonic-outline", color: "#3B7471", assetKey: "hdpe" },
  { id: 3, className: "PVC", title: "PVC", label: "ขวดน้ำยาล้างจาน", icon: "pipe-disconnected", color: "#B45309", assetKey: "pvc" },
  { id: 4, className: "LDPE", title: "LDPE", label: "ถุงช้อปปิ้ง", icon: "shopping-outline", color: "#558686", assetKey: "ldpe" },
  { id: 5, className: "PP", title: "PP", label: "ช้อนพลาสติก", icon: "spoon-sugar", color: "#0A4C47", assetKey: "pp" },
  { id: 6, className: "PS", title: "PS", label: "ถ้วยโฟม", icon: "cup-outline", color: "#0891B2", assetKey: "ps" },
];

const CARD_IMAGE_SOURCES = {
  pete: [
    require("../assets/pete_1.png"),
    require("../assets/pete_2.png"),
    require("../assets/pete_3.png"),
  ],
  hdpe: [
    require("../assets/hdpe_1.png"),
    require("../assets/hdpe_2.png"),
    require("../assets/hdpe_3.png"),
  ],
  pvc: [
    require("../assets/pvc_1.png"),
    require("../assets/pvc_2.png"),
    require("../assets/pvc_3.png"),
  ],
  ldpe: [
    require("../assets/ldpe_1.png"),
    require("../assets/ldpe_2.png"),
    require("../assets/ldpe_3.png"),
  ],
  pp: [
    require("../assets/pp_1.png"),
    require("../assets/pp_2.png"),
    require("../assets/pp_3.png"),
  ],
  ps: [
    require("../assets/ps_1.png"),
    require("../assets/ps_2.png"),
    require("../assets/ps_3.png"),
  ],
  glass: [
    require("../assets/glass_1.png"),
    require("../assets/glass_2.png"),
    require("../assets/glass_3.png"),
  ],
  metal: [
    require("../assets/metal_1.png"),
    require("../assets/metal_2.png"),
    require("../assets/metal_3.png"),
  ],
  paper: [
    require("../assets/paper_1.png"),
    require("../assets/paper_2.png"),
    require("../assets/paper_3.png"),
  ],
};

const CARD_REFERENCE_SOURCES = {
  pete: require("../assets/pete1.png"),
  hdpe: require("../assets/hdpe2.png"),
  pvc: require("../assets/pvc3.png"),
  ldpe: require("../assets/ldpe4.png"),
  pp: require("../assets/pp5.png"),
  ps: require("../assets/ps6.png"),
};

const TEXT_IMAGE_KEYS = [];

export default function MemoryGameScreen({ navigation, user }) {
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(5);
  const [showWinModal, setShowWinModal] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  // เริ่มต้นเกมใหม่
  const initGame = () => {
    setMatches(0);
    setMoves(0);
    setSelectedCards([]);
    setGameStarted(false);
    setPreviewing(false);
    setIsPlaying(false);
    setShowWinModal(false);

    const deck = [];
    PAIRS_DATA.forEach((pair) => {
      const randomIndex = Math.floor(Math.random() * CARD_IMAGE_SOURCES[pair.assetKey].length);
      const randomImage = CARD_IMAGE_SOURCES[pair.assetKey][randomIndex];
      const isTextImagePair = TEXT_IMAGE_KEYS.includes(pair.assetKey);

      if (isTextImagePair) {
        deck.push({
          id: `text_${pair.id}`,
          pairId: pair.id,
          cardKind: "text",
          role: "label",
          title: pair.title,
          value: pair.title,
          icon: pair.icon,
          color: pair.color,
          isFlipped: false,
          isMatched: false,
        });

        deck.push({
          id: `img_${pair.id}`,
          pairId: pair.id,
          cardKind: "image",
          role: "random",
          title: pair.title,
          value: pair.title,
          imageSource: randomImage,
          icon: pair.icon,
          color: pair.color,
          isFlipped: false,
          isMatched: false,
        });
      } else {
        const referenceImage = CARD_REFERENCE_SOURCES[pair.assetKey];

        deck.push({
          id: `ref_${pair.id}`,
          pairId: pair.id,
          cardKind: "image",
          role: "reference",
          title: pair.title,
          value: `${pair.title} (หลัก)`,
          imageSource: referenceImage,
          icon: pair.icon,
          color: pair.color,
          isFlipped: false,
          isMatched: false,
        });

        deck.push({
          id: `rand_${pair.id}`,
          pairId: pair.id,
          cardKind: "image",
          role: "random",
          title: pair.title,
          value: pair.label,
          imageSource: randomImage,
          icon: pair.icon,
          color: pair.color,
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    const shuffledDeck = deck.sort(() => Math.random() - 0.5);
    setCards(shuffledDeck);
  };

  useEffect(() => {
    initGame();
    const timer = setTimeout(() => {
      setIsLoadingAssets(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const startGame = () => {
    if (gameStarted) return;
    setGameStarted(true);
    setPreviewing(true);
    setPreviewSeconds(5);

    const previewCards = cards.map((card) => ({ ...card, isFlipped: true }));
    setCards(previewCards);

    const interval = setInterval(() => {
      setPreviewSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const hiddenCards = previewCards.map((card) => ({ ...card, isFlipped: false }));
          setCards(hiddenCards);
          setPreviewing(false);
          setIsPlaying(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCardPress = (cardIndex) => {
    if (!gameStarted || previewing || !isPlaying) return;
    
    const card = cards[cardIndex];
    
    // ห้ามกดการ์ดที่เปิดอยู่แล้วหรือจับคู่ได้แล้ว
    if (card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

    // เปิดการ์ดใบที่เลือก
    const updatedCards = [...cards];
    updatedCards[cardIndex].isFlipped = true;
    setCards(updatedCards);

    const newSelected = [...selectedCards, { card, index: cardIndex }];
    setSelectedCards(newSelected);

    // หากเปิดครบ 2 ใบ ให้ตรวจผล
    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      setTimeout(() => checkMatch(newSelected), 800);
    }
  };

  const checkMatch = (selected) => {
    const [first, second] = selected;
    const isPair = first.card.pairId === second.card.pairId;

    const updatedCards = [...cards];

    if (isPair) {
      // จับคู่สำเร็จ
      updatedCards[first.index].isMatched = true;
      updatedCards[second.index].isMatched = true;
      setMatches(prev => {
        const nextMatches = prev + 1;
        // หากจับคู่ครบ 6 คู่ ชนะเกม!
        if (nextMatches === 6) {
          handleWin();
        }
        return nextMatches;
      });
    } else {
      // จับคู่ไม่สำเร็จ -> ปิดการ์ด
      updatedCards[first.index].isFlipped = false;
      updatedCards[second.index].isFlipped = false;
    }

    setCards(updatedCards);
    setSelectedCards([]);
  };

  const handleWin = async () => {
    setIsPlaying(false);
    setShowWinModal(true);
    if (user?.id) {
      await recordGamePlay(user.id, "memory");
    }
  };

  const renderCard = ({ item, index }) => {
    const isFlippedOrMatched = item.isFlipped || item.isMatched;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isFlippedOrMatched ? styles.cardFlipped : styles.cardCover,
          item.isMatched && styles.cardMatched,
        ]}
        onPress={() => handleCardPress(index)}
        activeOpacity={0.7}
      >
        {isFlippedOrMatched ? (
          <View style={styles.cardInfo}>
            {item.cardKind === "image" ? (
              <Image source={item.imageSource} style={styles.cardImage} />
            ) : (
              <Text style={[styles.cardText, styles.textOnlyCardText]}>{item.value}</Text>
            )}
          </View>
        ) : (
          <View style={styles.cardBack}>
            <MaterialCommunityIcons name="help-circle-outline" size={32} color="#A1AAA6" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoadingAssets) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0F3D34" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>เตรียมความพร้อม...</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <ActivityIndicator size="large" color="#1E6C5B" style={{ marginBottom: 15 }} />
          <Text style={{ fontSize: 16, color: '#0F3D34', fontWeight: 'bold' }}>กำลังโหลดรูปภาพและโมเดล...</Text>
          <Text style={{ fontSize: 12, color: '#8E9B96', marginTop: 5 }}>กรุณารอสักครู่เพื่อประสิทธิภาพสูงสุด</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เกมจับคู่การ์ดความจำ</Text>
        <View style={{ width: 34 }} />
      </View>

      {!gameStarted ? (
        <View style={styles.startScreenContainer}>
          <View style={styles.startContainer}>
            <Text style={styles.startLabel}>Memory Match</Text>
            <Text style={styles.startNote}>Press START to preview all cards for 5 seconds.</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={startGame}
              activeOpacity={0.8}
              disabled={previewing}
            >
              <Text style={styles.startBtnText}>{previewing ? `Previewing ${previewSeconds}` : "START"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>จับคู่ได้</Text>
              <Text style={styles.statValue}>{matches} / 6 คู่</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>จำนวนครั้งที่ทาย</Text>
              <Text style={styles.statValue}>{moves} ครั้ง</Text>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={initGame}>
              <Ionicons name="refresh" size={18} color="#1E6C5B" />
              <Text style={styles.resetBtnText}>เริ่มใหม่</Text>
            </TouchableOpacity>
          </View>

          {/* CARD GRID */}
          <View style={styles.gridContainer}>
            <FlatList
              data={cards}
              renderItem={renderCard}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.rowWrapper}
            />
            {previewing && (
              <View style={styles.previewOverlay} pointerEvents="none">
                <Text style={styles.previewText}>{previewSeconds}</Text>
                <Text style={styles.previewSubtext}>Memorize the cards</Text>
              </View>
            )}
          </View>

          {/* HELP TIPS */}
          <View style={styles.tipsBox}>
            <Ionicons name="bulb-outline" size={16} color="#0F3D34" />
            <Text style={styles.tipsText}>
              คำแนะนำ: สังเกตไอคอนเดียวกันและสีเดียวกันของรูปขยะและโค้ดรีไซเคิลเพื่อช่วยในการจำคู่!
            </Text>
          </View>
        </>
      )}

      {/* WIN MODAL */}
      <Modal visible={showWinModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="trophy" size={80} color="#FFD700" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>ยอดเยี่ยมมาก!</Text>
            <Text style={styles.modalDesc}>
              คุณทายถูกครบทั้ง 6 คู่ใน {moves} ครั้ง ได้รับรางวัลและคะแนนโบนัสเรียบร้อยแล้ว
            </Text>
            <Text style={styles.successBig}>สำเร็จ6คู่</Text>
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
        {Object.values(CARD_REFERENCE_SOURCES).map((src, i) => (
          <Image key={`ref-${i}`} source={src} style={{ width: 100, height: 100 }} />
        ))}
        {Object.values(CARD_IMAGE_SOURCES).flatMap(arr => arr).map((src, i) => (
          <Image key={`img-${i}`} source={src} style={{ width: 100, height: 100 }} />
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
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    alignItems: "center",
  },
  statBox: { flex: 1 },
  statLabel: { fontSize: 10, color: "#8E9B96", fontWeight: "bold", marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: "bold", color: "#0F3D34" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E6C5B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetBtnText: { fontSize: 12, fontWeight: "bold", color: "#1E6C5B", marginLeft: 4 },
  gridContainer: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
  },
  rowWrapper: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 10,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardImage: {
    width: CARD_SIZE - 20,
    height: CARD_SIZE - 30,
    resizeMode: "contain",
  },
  cardCover: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E4ECE8",
  },
  cardFlipped: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#1E6C5B",
  },
  cardMatched: {
    backgroundColor: "#E8F5E9",
    borderColor: "#059669",
    opacity: 0.85,
  },
  cardBack: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  cardText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
  },
  textOnlyCardText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "bold",
    color: "#000",
    paddingHorizontal: 4,
    maxWidth: CARD_SIZE - 20,
    flexWrap: "wrap",
  },
  tipsBox: {
    flexDirection: "row",
    backgroundColor: "#EAF4F0",
    margin: 15,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B2DFDB",
    marginBottom: 20,
  },
  tipsText: {
    flex: 1,
    fontSize: 11,
    color: "#0F3D34",
    marginLeft: 8,
    lineHeight: 16,
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 61, 52, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
  },
  previewText: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  previewSubtext: {
    fontSize: 16,
    color: "#E2F0E9",
  },
  startScreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  startContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  startLabel: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F3D34",
    marginBottom: 14,
  },
  startNote: {
    fontSize: 15,
    color: "#334155",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: "#1E6C5B",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 160,
    alignItems: "center",
  },
  startBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
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
  successBig: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#059669",
    marginTop: 10,
    marginBottom: 8,
  },
});
