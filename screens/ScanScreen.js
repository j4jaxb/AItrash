import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native"; // 🔥 เพิ่มตัวนี้

const { width } = Dimensions.get("window");
const PREVIEW_SIZE = width * 0.8;

export default function ScanScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState(null);
  const [flash, setFlash] = useState(false);

  // ถ้ามี autoPickGallery ให้เปิด picker อัตโนมัติเมื่อเข้าหน้านี้
  useEffect(() => {
    if (route?.params?.autoPickGallery && isFocused) {
      pickImage();
      // ลบ flag เพื่อไม่ให้เรียกซ้ำถ้า navigate กลับมา
      navigation.setParams({ autoPickGallery: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.autoPickGallery, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setFlash(false);
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      navigation.navigate("Result", { image: photo.uri });
    } catch (err) {
      console.log("Take picture error:", err);
    }
  };

  const pickImage = async () => {
    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!picker.canceled) {
      navigation.navigate("Result", { image: picker.assets[0].uri });
    }
  };

  if (hasPermission === null) return <View style={styles.container} />;
  if (hasPermission === false)
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>No access to camera</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ width: 32 }} />
        <TouchableOpacity onPress={() => setFlash(!flash)}>
          <Ionicons
            name={flash ? "flash" : "flash-off"}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.previewBox}>
        {/* ✅ เปิดกล้องเฉพาะตอนที่ Focus อยู่เท่านั้น ช่วยประหยัดทรัพยากรเครื่องด้วย */}
        {isFocused && (
          <CameraView
            ref={cameraRef}
            style={styles.previewImg}
            facing="back"
            enableTorch={flash}
          />
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
          <Ionicons name="image" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <View style={{ width: 56, marginLeft: 30 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  previewBox: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  bottomBar: { flexDirection: "row", alignItems: "center", marginTop: 60 },
  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 30,
  },
  shutterBtn: {
    width: 75,
    height: 75,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
});