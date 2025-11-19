import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { RADIOLOGY_TESTS } from '../../../constants/learningData';
import { RadiologyCategory, RadiologyTest } from '../../../types/learning';

interface GroupedRadiologyTests {
  [category: string]: {
    [subCategory: string]: RadiologyTest[];
  };
}

export default function RadiologyDirectoryScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

  const groupedTests = useMemo(() => {
    const filtered = RADIOLOGY_TESTS.filter(
      (test) =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped: GroupedRadiologyTests = {};

    filtered.forEach((test) => {
      if (!grouped[test.category]) {
        grouped[test.category] = {};
      }
      if (!grouped[test.category][test.subCategory]) {
        grouped[test.category][test.subCategory] = [];
      }
      grouped[test.category][test.subCategory].push(test);
    });

    return grouped;
  }, [searchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search radiology tests..."
          placeholderTextColor={Colors.light.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
        <Text style={styles.infoBannerText}>
          An informational guide to various imaging and radiology procedures.
        </Text>
      </View>

      {/* Grouped Tests */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedTests).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={64} color={Colors.light.textLight} />
            <Text style={styles.emptyStateText}>No tests found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search criteria
            </Text>
          </View>
        ) : (
          Object.entries(groupedTests).map(([category, subCategories]) => (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Ionicons name="folder" size={20} color={Colors.light.primary} />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                <Ionicons
                  name={expandedCategories[category] ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.light.textSecondary}
                />
              </TouchableOpacity>

              {expandedCategories[category] && (
                <View style={styles.categoryContent}>
                  {Object.entries(subCategories).map(([subCategory, tests]) => (
                    <View key={subCategory} style={styles.subCategorySection}>
                      <Text style={styles.subCategoryTitle}>{subCategory}</Text>

                      {/* Table Header */}
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.testNameColumn]}>
                          Test Name
                        </Text>
                        <Text style={[styles.tableHeaderText, styles.purposeColumn]}>
                          Purpose
                        </Text>
                      </View>

                      {/* Table Rows */}
                      {tests.map((test, index) => (
                        <View
                          key={test.id}
                          style={[
                            styles.tableRow,
                            index % 2 === 0 && styles.tableRowEven,
                          ]}
                        >
                          <Text style={[styles.tableCellText, styles.testNameColumn]}>
                            {test.name}
                          </Text>
                          <Text style={[styles.tableCellText, styles.purposeColumn]}>
                            {test.purpose}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '15',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.primary + '08',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  categoryContent: {
    padding: 12,
  },
  subCategorySection: {
    marginBottom: 16,
  },
  subCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tableRowEven: {
    backgroundColor: Colors.light.background,
  },
  tableCellText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  testNameColumn: {
    width: '40%',
    fontWeight: '600',
  },
  purposeColumn: {
    flex: 1,
    paddingLeft: 8,
  },
});
