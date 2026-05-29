import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const materialsData = [
  { id: 'pet', code: 'PET (1)', name: 'Polyethylene Terephthalate', icon: 'bottle-wine', family: 'MC', examples: 'Water bottles   Soda bottles   Food containers', infoTitle: 'Did You Know?', infoContent: 'PET bottles can be recycled into new bottles or clothing fibers!' },
  { id: 'hdpe', code: 'HDPE (2)', name: 'High-Density Polyethylene', icon: 'bottle-soda-outline', family: 'MC', examples: 'Milk jugs   Detergent bottles   Shampoo bottles' },
  { id: 'pvc', code: 'PVC (3)', name: 'Polyvinyl Chloride', icon: 'hammer', family: 'FA', examples: 'Pipes   Credit cards   Vinyl siding', infoTitle: '⚠ Special Handling', infoContent: 'PVC requires special recycling facilities.' },
  { id: 'ldpe', code: 'LDPE (4)', name: 'Low-Density Polyethylene', icon: 'shopping', family: 'MC', examples: 'Plastic bags   Food wraps   Squeeze bottles' },
  { id: 'pp', code: 'PP (5)', name: 'Polypropylene', icon: 'silverware-fork-knife', family: 'MC', examples: 'Yogurt cups   Bottle caps   Straws' },
  { id: 'ps', code: 'PS (6)', name: 'Polystyrene', icon: 'cup-outline', family: 'MC', examples: 'Styrofoam   Disposable cups   Food trays' },
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: '#004743' }]}>Learn to Recycle Better</Text>
          <Text style={styles.subtitleText}>
            Tap any material card to explore recycling codes and best practices
          </Text>
        </View>

        {/* Cards */}
        {materialsData.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <View key={item.id} style={styles.materialCard}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  {item.family === 'FA' ? (
                    <FontAwesome5 name={item.icon} size={18} color="#004743" />
                  ) : (
                    <MaterialCommunityIcons name={item.icon} size={24} color="#004743" />
                  )}
                </View>

                <View style={styles.headerTextGroup}>
                  <Text style={styles.materialTitle}>{item.code}</Text>
                  <Text style={styles.materialSubtitle}>{item.name}</Text>
                </View>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardDetails}>
                  <View style={styles.divider} />
                  <Text style={styles.exampleText}>{item.examples}</Text>

                  {item.infoContent && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoTitle}>{item.infoTitle}</Text>
                      <Text style={styles.infoContent}>{item.infoContent}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Before Section */}
        <Text style={styles.sectionHeading}>Before You Recycle</Text>

        {[
          { id: '1', title: 'Clean Containers', desc: 'Rinse out food residue and remove labels if possible' },
          { id: '2', title: 'Check Local Rules', desc: 'Recycling acceptance varies by location' },
          { id: '3', title: 'Sort Properly', desc: 'Separate different plastic types when required' }
        ].map((item) => (
          <View key={item.id} style={styles.stepCard}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>{item.id}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="bulb-outline" size={20} color="#FDE047" />
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
    backgroundColor: '#F2F2F7'
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },

  header: {
    marginTop: 80,
    marginBottom: 25
  },
  titleText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#004743'
  },
  subtitleText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8
  },

  /* 🔥 CARD สีเขียวเต็ม */
  materialCard: {
    backgroundColor: '#004743',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  /* 🔥 icon พื้นเทา */
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },

  headerTextGroup: {
    flex: 1
  },

  materialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  materialSubtitle: {
    fontSize: 13,
    color: '#D1D5DB'
  },

  divider: {
    height: 1,
    backgroundColor: '#0F5C54',
    marginVertical: 15
  },

  exampleText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12
  },

  /* 🔥 กล่องเทาด้านใน */
  infoBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4
  },
  infoContent: {
    fontSize: 13,
    color: '#3A3A3C'
  },

  sectionHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004743',
    marginTop: 25,
    marginBottom: 15
  },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },

  stepNumberCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#004743',
    justifyContent: 'center',
    alignItems: 'center'
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004743'
  },

  stepDesc: {
    fontSize: 13,
    color: '#8E8E93'
  },

  tipsContainer: {
    padding: 20,
    backgroundColor: '#004743',
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },

  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FAFAFA'
  },

  tipItem: {
    fontSize: 14,
    color: '#FAFAFA',
    marginBottom: 10
  }
});