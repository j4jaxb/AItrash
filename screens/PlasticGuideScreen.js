import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const plasticCategories = [
  {
    id: 1,
    code: "1",
    title: "PETE",
    name: "Polyethylene Terephthalate",
    description:
      "PETE เป็นพลาสติกเบอร์ 1 ที่มักใช้ทำขวดน้ำ ขวดน้ำอัดลม และกล่องอาหารใส เพราะมีความใสและเบากว่า",
    examples: "ขวดน้ำดื่ม, กล่องอาหารใส, ขวดโซดา",
    mainImage: require("../assets/pete1.png"),
    sampleImages: [
      require("../assets/pete_1.png"),
      require("../assets/pete_2.png"),
      require("../assets/pete_3.png"),
    ],
  },
  {
    id: 2,
    code: "2",
    title: "HDPE",
    name: "High-Density Polyethylene",
    description:
      "HDPE เป็นพลาสติกเบอร์ 2 ที่ใช้ในผลิตภัณฑ์ที่ต้องการความทนทานและทนต่อสารเคมี เช่น ขวดนม ขวดแชมพู และขวดซักผ้า",
    examples: "ขวดนม, ขวดแชมพู, ขวดน้ำยาซักผ้า",
    mainImage: require("../assets/hdpe2.png"),
    sampleImages: [
      require("../assets/hdpe_1.png"),
      require("../assets/hdpe_2.png"),
      require("../assets/hdpe_3.png"),
    ],
  },
  {
    id: 3,
    code: "3",
    title: "PVC",
    name: "Polyvinyl Chloride",
    description:
      "PVC เป็นพลาสติกเบอร์ 3 ที่พบได้ในท่อพลาสติก บัตรเครดิต และวัสดุหุ้มฉนวนบางชนิด มักต้องรีไซเคิลด้วยวิธีพิเศษ",
    examples: "ท่อ PVC, บัตรเครดิต, วัสดุหุ้มฉนวน",
    mainImage: require("../assets/pvc3.png"),
    sampleImages: [
      require("../assets/pvc_1.png"),
      require("../assets/pvc_2.png"),
      require("../assets/pvc_3.png"),
    ],
  },
  {
    id: 4,
    code: "4",
    title: "LDPE",
    name: "Low-Density Polyethylene",
    description:
      "LDPE เป็นพลาสติกเบอร์ 4 ที่มักพบในถุงพลาสติก ห่ออาหาร และขวดบีบ มีความยืดหยุ่นและใช้งานทั่วไป",
    examples: "ถุงพลาสติก, ถุงห่ออาหาร, ขวดบีบ",
    mainImage: require("../assets/ldpe4.png"),
    sampleImages: [
      require("../assets/ldpe_1.png"),
      require("../assets/ldpe_2.png"),
      require("../assets/ldpe_3.png"),
    ],
  },
  {
    id: 5,
    code: "5",
    title: "PP",
    name: "Polypropylene",
    description:
      "PP เป็นพลาสติกเบอร์ 5 ที่ใช้ทำฝาปิดขวด กล่องโยเกิร์ต และหลอดพลาสติก เพราะทนความร้อนและแข็งแรง",
    examples: "กระบอกน้ำพลาสติก, กล่องโยเกิร์ต, หลอดพลาสติก",
    mainImage: require("../assets/pp5.png"),
    sampleImages: [
      require("../assets/pp_1.png"),
      require("../assets/pp_2.png"),
      require("../assets/pp_3.png"),
    ],
  },
  {
    id: 6,
    code: "6",
    title: "PS",
    name: "Polystyrene",
    description:
      "PS เป็นพลาสติกเบอร์ 6 ที่พบในโฟมใส่อาหาร ถ้วยพลาสติก และภาชนะใช้แล้วทิ้ง บางพื้นที่อาจรับรีไซเคิลได้ไม่ทั่วถึง",
    examples: "โฟมใส่อาหาร, ถ้วยพลาสติก, กล่องอาหารใช้แล้วทิ้ง",
    mainImage: require("../assets/ps6.png"),
    sampleImages: [
      require("../assets/ps_1.png"),
      require("../assets/ps_2.png"),
      require("../assets/ps_3.png"),
    ],
  }
];

export default function PlasticGuideScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F3D34" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แนะนำสัญลักษณ์พลาสติก</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerCard}>
          <MaterialCommunityIcons name="recycle" size={34} color="#FFD700" />
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>เรียนรู้รหัสพลาสติก 1–7</Text>
            <Text style={styles.bannerDesc}>
              กดแต่ละหมวดหมู่เพื่อดูสัญลักษณ์และตัวอย่างวัสดุที่พบได้บ่อย พร้อมคำอธิบายแบบสั้นๆ
            </Text>
          </View>
        </View>

        {plasticCategories.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{item.code}</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.name}</Text>
              </View>
            </View>

            <View style={styles.detailBox}>
              {item.mainImage ? (
                <Image source={item.mainImage} style={styles.mainImage} resizeMode="contain" />
              ) : (
                <View style={styles.placeholderIconBox}>
                  <MaterialCommunityIcons name="shape-outline" size={36} color="#1E6C5B" />
                </View>
              )}

              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.examplesTitle}>ตัวอย่างที่พบได้บ่อย</Text>
              <Text style={styles.examplesText}>{item.examples}</Text>

              {item.sampleImages.length > 0 && (
                <View style={styles.sampleRow}>
                  {item.sampleImages.map((img, index) => (
                    <Image key={`${item.code}-${index}`} source={img} style={styles.sampleImage} resizeMode="contain" />
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
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
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 16.5, fontWeight: "bold", color: "#0F3D34" },
  scrollContent: { padding: 12, paddingBottom: 20 },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F3D34",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  bannerTextWrap: { flex: 1, marginLeft: 8 },
  bannerTitle: { fontSize: 14.5, fontWeight: "bold", color: "#FFF" },
  bannerDesc: { fontSize: 11, color: "#CFDAD9", marginTop: 2, lineHeight: 15 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4ECE8",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  codeBadge: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: "#EAF4F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  codeBadgeText: { fontSize: 14, fontWeight: "bold", color: "#1E6C5B" },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 13.5, fontWeight: "bold", color: "#0F3D34" },
  cardSubtitle: { fontSize: 10.8, color: "#4F7B72", marginTop: 1 },
  detailBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E9F0ED",
    paddingTop: 8,
  },
  mainImage: {
    width: "100%",
    height: 88,
    borderRadius: 12,
    backgroundColor: "#F8FBFA",
    marginBottom: 10,
  },
  placeholderIconBox: {
    width: "100%",
    height: 88,
    borderRadius: 12,
    backgroundColor: "#F8FBFA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  description: { fontSize: 11.5, color: "#444", lineHeight: 15, marginBottom: 5 },
  examplesTitle: { fontSize: 10.8, fontWeight: "bold", color: "#0F3D34", marginBottom: 2 },
  examplesText: { fontSize: 10.8, color: "#666", marginBottom: 6 },
  sampleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  sampleImage: {
    width: "31%",
    height: 54,
    borderRadius: 10,
    backgroundColor: "#F8FBFA",
  },
});
