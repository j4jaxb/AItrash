import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase";

// ฟังก์ชันเลือกไอคอน (เหมือนกับหน้า Home เพื่อให้ UI ไปในทิศทางเดียวกัน)
const getCategoryIcon = (categoryName) => {
  const iconSize = 24;
  const iconColor = "#1A1A1A";

  switch (categoryName) {
    case "PETE":
      return (
        <MaterialCommunityIcons
          name="water-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "HDPE":
      return (
        <MaterialCommunityIcons
          name="bottle-tonic-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "PVC":
      return (
        <MaterialCommunityIcons
          name="pipe-disconnected"
          size={iconSize}
          color={iconColor}
        />
      );
    case "LDPE":
      return (
        <MaterialCommunityIcons
          name="shopping-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "PP":
      return (
        <MaterialCommunityIcons
          name="spoon-sugar"
          size={iconSize}
          color={iconColor}
        />
      );
    case "PS":
      return (
        <MaterialCommunityIcons
          name="cup-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "OTHER":
      return (
        <MaterialCommunityIcons
          name="recycle-variant"
          size={iconSize}
          color={iconColor}
        />
      );
    case "Glass":
      return (
        <MaterialCommunityIcons
          name="glass-fragile"
          size={iconSize}
          color={iconColor}
        />
      );
    case "Metal":
      return (
        <MaterialCommunityIcons name="can" size={iconSize} color={iconColor} />
      );
    case "Paper":
      return (
        <Ionicons
          name="document-text-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    case "Non-recyclable":
      return (
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={iconSize}
          color={iconColor}
        />
      );
    default:
      return (
        <MaterialCommunityIcons
          name="package-variant"
          size={iconSize}
          color={iconColor}
        />
      );
  }
};

export default function CategoryHistoryScreen({ navigation, route }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = route.params?.user;

  const availableCategories = [
    { id: "pete", name: "PETE", sub: "Resin Code 1" },
    { id: "hdpe", name: "HDPE", sub: "Resin Code 2" },
    { id: "pvc", name: "PVC", sub: "Resin Code 3" },
    { id: "ldpe", name: "LDPE", sub: "Resin Code 4" },
    { id: "pp", name: "PP", sub: "Resin Code 5" },
    { id: "ps", name: "PS", sub: "Resin Code 6" },
    { id: "other", name: "OTHER", sub: "Resin Code 7" },
    { id: "glass", name: "Glass", sub: "Recyclable" },
    { id: "metal", name: "Metal", sub: "Recyclable" },
    { id: "paper", name: "Paper", sub: "Clean & Dry" },
    { id: "non", name: "Non-recyclable", sub: "Waste" },
  ];

  useEffect(() => {
    if (user?.id) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("result")
        .select(
          `
          material (
            material_name,
            recycle
          )
        `,
        )
        .eq("user_id", user.id)
        .not("material", "is", null);

      if (error) {
        console.log("Load categories error", error);
        setCategories([]);
      } else {
        const uniqueCategories = [];
        const seen = new Set();
        data.forEach((item) => {
          if (item.material && !seen.has(item.material.material_name)) {
            seen.add(item.material.material_name);
            uniqueCategories.push(item.material);
          }
        });

        const availableCategoryNames = availableCategories.map(
          (cat) => cat.name,
        );
        const filteredCategories = uniqueCategories.filter((cat) =>
          availableCategoryNames.includes(cat.material_name),
        );

        setCategories(filteredCategories);
      }
    } catch (err) {
      console.log("Load categories network error", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => {
    const catInfo = availableCategories.find(
      (cat) => cat.name === item.material_name,
    );
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() =>
          navigation.navigate("ScanHistory", {
            user,
            filterCategory: item.material_name,
          })
        }
      >
        <View style={styles.categoryIcon}>
          {getCategoryIcon(item.material_name)}
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.material_name}</Text>
          <Text style={styles.categorySub}>{catInfo?.sub || item.recycle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recyclable Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.material_name}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No categories found. Start scanning!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  listContainer: { padding: 20 },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 12,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: { flex: 1, marginLeft: 15 },
  categoryName: { fontSize: 16, fontWeight: "bold" },
  categorySub: { fontSize: 12, color: "#666", marginTop: 2 },
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { marginTop: 50, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 14 },
});
