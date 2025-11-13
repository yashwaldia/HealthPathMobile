import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  const handleDiagnosePress = () => {
    Alert.alert('Analyze', 'Analyze feature will be available soon!');
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height: 85 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {/* 2 Buttons on the LEFT */}
      <TabButton
        iconName="home"
        label="Home"
        isFocused={state.index === 0}
        onPress={() => navigation.navigate('index')}
      />
      <TabButton
        iconName="stats-chart"
        label="Track"
        isFocused={state.index === 1}
        onPress={() => navigation.navigate('track')}
      />

      {/* CENTER Plus Button with Label */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity style={styles.centerButton} onPress={handleDiagnosePress}>
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.centerButtonLabel}>Analyze</Text>
      </View>

      {/* 2 Buttons on the RIGHT */}
      <TabButton
        iconName="fitness"
        label="Vitals"
        isFocused={state.index === 2}
        onPress={() => navigation.navigate('vitals')}
      />
      <TabButton
        iconName="compass"
        label="Explore"
        isFocused={state.index === 3}
        onPress={() => navigation.navigate('explore')}
      />
    </View>
  );
};

type TabButtonProps = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  isFocused: boolean;
  onPress: () => void;
};

const TabButton = ({ iconName, label, isFocused, onPress }: TabButtonProps) => {
  const color = isFocused ? Colors.light.primary : Colors.light.textLight;

  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Ionicons name={iconName} size={24} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="track" />
      <Tabs.Screen name="vitals" />
      <Tabs.Screen name="explore" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 9,
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 34,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.light.background,
    borderWidth: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  centerButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 6,
  },
});