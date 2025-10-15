import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import HeaderMobile from '../../components/HeaderMobile';

const { width } = Dimensions.get('window');
 
const cardData = [
  {
    title: "Annual General Body Meeting",
    color: "#FFD600",
    link: "/member/agm-resolutions",
    gradientColors: ['#FDE047', '#FACC15', '#EAB308'],
    textColor: "#92400E",
  },
  {
    title: "Board Of Management",
    color: "#43A047",
    link: "/member/bom-resolutions",
    gradientColors: ['#86EFAC', '#4ADE80', '#16A34A'],
    textColor: "#166534",
  },
  {
    title: "Governing Council",
    color: "#3F51B5",
    link: "/member/gc-resolutions",
    gradientColors: ['#A5B4FC', '#818CF8', '#6366F1'],
    textColor: "#3730A3",
  },
];

const DashboardMobile = () => {
  const navigation = useNavigation();
  
  // Auto-refresh every 5 minutes (matching web version)
  useEffect(() => {
    const intervalId = setInterval(() => {
      // In mobile, we might want to refetch data instead of reload
      console.log('Auto refresh triggered');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);
 
  const handleCardPress = (link) => {
    console.log('Navigate to:', link);
    if (link === "/member/gc-resolutions") {
      navigation.navigate('GCResolution');
    } else if (link === "/member/agm-resolutions") {
        navigation.navigate('AGMResolution');
    } else if (link === "/member/bom-resolutions") {
        navigation.navigate('BOMResolution');
    }
  };

  return (
    <LinearGradient
      colors={['#EEF2FF', '#FFFFFF', '#EEF2FF']}
      style={styles.container}
    >
      <HeaderMobile />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {cardData.map((card, index) => (
            <TouchableOpacity
              key={card.title}
              style={[styles.cardWrapper, { marginBottom: index === cardData.length - 1 ? 0 : 24 }]}
              onPress={() => handleCardPress(card.link)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={card.gradientColors}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: card.textColor }]}>
                    {card.title}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: width - 32,
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'serif',
    lineHeight: 32,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default DashboardMobile;
