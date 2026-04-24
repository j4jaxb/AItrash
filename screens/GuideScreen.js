import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const materialsData = [
  { id: 'pet', code: 'PET (1)', name: 'Polyethylene Terephthalate', icon: 'bottle-wine', family: 'MC', examples: 'Water bottles, Soda bottles, Food containers', infoTitle: 'Did You Know?', infoContent: 'PET bottles can be recycled into new bottles or clothing fibers!' },
  { id: 'hdpe', code: 'HDPE (2)', name: 'High-Density Polyethylene', icon: 'bottle-soda-outline', family: 'MC', examples: 'Milk jugs, Detergent bottles, Shampoo bottles' },
  { id: 'pvc', code: 'PVC (3)', name: 'Polyvinyl Chloride', icon: 'hammer', family: 'FA', examples: 'Pipes, Credit cards, Vinyl siding', infoTitle: '⚠ Special Handling', infoContent: 'PVC requires special recycling facilities.', isWarning: true },
  { id: 'ldpe', code: 'LDPE (4)', name: 'Low-Density Polyethylene', icon: 'shopping', family: 'MC', examples: 'Plastic bags, Food wraps, Squeeze bottles' },
  { id: 'pp', code: 'PP (5)', name: 'Polypropylene', icon: 'silverware-fork-knife', family: 'MC', examples: 'Yogurt cups, Bottle caps, Straws' },
  { id: 'ps', code: 'PS (6)', name: 'Polystyrene', icon: 'cup-outline', family: 'MC', examples: 'Styrofoam, Disposable cups, Food trays' },
  { id: 'other', code: 'Other (7)', name: 'Mixed Plastics', icon: 'help-circle', family: 'MC', examples: 'Mixed Plastics, Multi-layer, Composite, Mixed materials', infoTitle: '⚠ Check Locally', infoContent: 'Recycling options vary by location.', isWarning: true },
];

export default function GuideScreen() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section - เว้นระยะด้านบนมากขึ้น */}
        <View style={styles.header}>
          <Text style={styles.titleText}>Learn to Recycle Better</Text>
          <Text style={styles.subtitleText}>Tap any material card to explore recycling codes and best practices</Text>
        </View>

        {/* Recycling Cards Section */}
        {materialsData.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.materialCard}>
              <TouchableOpacity 
                style={styles.cardHeader} 
                onPress={() => toggleExpand(item.id)} 
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#555' }]}>
                  {item.family === 'FA' ? (
                    <FontAwesome5 name={item.icon} size={18} color="white" />
                  ) : (
                    <MaterialCommunityIcons name={item.icon} size={24} color="white" />
                  )}
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.materialTitle}>{item.code}</Text>
                  <Text style={styles.materialSubtitle}>{item.name}</Text>
                </View>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardDetails}>
                  <View style={styles.divider} />
                  <Text style={styles.exampleText}>{item.examples}</Text>
                  {item.infoContent && (
                    <View style={[styles.infoBox, item.isWarning ? styles.warningBox : styles.grayBox]}>
                      <Text style={[styles.infoTitle, item.isWarning && styles.warningTitle]}>
                        {item.infoTitle}
                      </Text>
                      <Text style={styles.infoContent}>{item.infoContent}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Before You Recycle Section */}
        <Text style={styles.sectionHeading}>Before You Recycle</Text>
        {[ 
          { id: '1', title: 'Clean Containers', desc: 'Rinse out food residue and remove labels if possible' },
          { id: '2', title: 'Check Local Rules', desc: 'Recycling acceptance varies by location' },
          { id: '3', title: 'Sort Properly', desc: 'Separate different plastic types when required' }
        ].map((item) => (
          <View key={item.id} style={styles.stepCard}>
            <View style={styles.stepNumberCircle}><Text style={styles.stepNumberText}>{item.id}</Text></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Quick Tips Section */}
        <View style={styles.tipsContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="bulb-outline" size={20} color="#333" />
            <Text style={styles.tipsTitle}>Quick Tips</Text>
          </View>
          <Text style={styles.tipItem}>• Clean containers before recycling to avoid contamination</Text>
          <Text style={styles.tipItem}>• Remove caps and labels when possible</Text>
          <Text style={styles.tipItem}>• Check local recycling guidelines for specific rules</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  scrollContent: { 
    paddingHorizontal: 20,
    paddingBottom: 40 
  },
  header: { 
    marginTop: 80, // เพิ่มระยะห่างจากขอบบนสุดมากขึ้น
    marginBottom: 25 
  },
  titleText: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  subtitleText: { fontSize: 15, color: '#666', marginTop: 8 },
  materialCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#EEE', elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTextGroup: { flex: 1 },
  materialTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  materialSubtitle: { fontSize: 13, color: '#666' },
  cardDetails: { marginTop: 0 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  exampleText: { fontSize: 14, color: '#555', marginBottom: 12 },
  infoBox: { borderRadius: 10, padding: 12 },
  grayBox: { backgroundColor: '#F8F8F8' },
  warningBox: { backgroundColor: '#FFF3E0' },
  infoTitle: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 4 },
  warningTitle: { color: '#E65100' },
  infoContent: { fontSize: 13, color: '#666', lineHeight: 18 },
  sectionHeading: { fontSize: 20, fontWeight: 'bold', color: '#111', marginTop: 25, marginBottom: 15 },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  stepNumberCircle: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#FFF', fontWeight: 'bold' },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  stepDesc: { fontSize: 13, color: '#666' },
  tipsContainer: { padding: 20, backgroundColor: '#FFF', borderRadius: 15, marginTop: 20, borderWidth: 1, borderColor: '#EEE' },
  tipsTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  tipItem: { fontSize: 14, color: '#555', marginBottom: 10 }
});