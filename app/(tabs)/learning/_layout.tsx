import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import TestDirectoryScreen from './directory';
import RadiologyDirectoryScreen from './radiology';
import LearningZoneScreen from './learning';

type TabType = 'directory' | 'radiology' | 'learning';

export default function LearningLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [comparisonList, setComparisonList] = useState<string[]>([]);

  const tabs = [
    { id: 'directory' as TabType, label: 'Test Directory', icon: 'flask' },
    { id: 'radiology' as TabType, label: 'Radiology', icon: 'scan' },
    { id: 'learning' as TabType, label: 'Learning Zone', icon: 'school' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'directory':
        return (
          <TestDirectoryScreen
            comparisonList={comparisonList}
            onToggleCompare={(testId: string) => {
              setComparisonList((prev) => {
                if (prev.includes(testId)) {
                  return prev.filter((id) => id !== testId);
                }
                if (prev.length < 3) {
                  return [...prev, testId];
                }
                return prev;
              });
            }}
            onOpenLearningZone={() => setActiveTab('learning')}
          />
        );
      case 'radiology':
        return <RadiologyDirectoryScreen />;
      case 'learning':
        return (
          <LearningZoneScreen
            initialCompareList={comparisonList}
            onUpdateCompareList={setComparisonList}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Custom Top Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? Colors.light.primary : Colors.light.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>{renderContent()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingVertical: 5,
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    position: 'relative',
  },
  tabActive: {
    // Active state handled by indicator
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabLabelActive: {
    color: Colors.light.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.light.primary,
  },
  content: {
    flex: 1,
  },
});
