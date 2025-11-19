import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { PATHOLOGY_TESTS } from '../../../constants/learningData';
import { TestCategory, PathologyTest } from '../../../types/learning';
import TestCard from '../../../components/learning/TestCard';
import TestDetailModal from '../../../components/learning/TestDetailModal';

interface TestDirectoryScreenProps {
  comparisonList: string[];
  onToggleCompare: (testId: string) => void;
  onOpenLearningZone: () => void;
}

export default function TestDirectoryScreen({
  comparisonList,
  onToggleCompare,
  onOpenLearningZone,
}: TestDirectoryScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<PathologyTest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const categories = useMemo(() => {
    return ['all', ...Object.values(TestCategory)];
  }, []);

  const filteredTests = useMemo(() => {
    return PATHOLOGY_TESTS.filter((test) => {
      const matchesSearch =
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.purpose.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || test.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleTestPress = (test: PathologyTest) => {
    setSelectedTest(test);
    setDetailModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tests..."
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

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'} found
        </Text>
      </View>

      {/* Test List */}
      {filteredTests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flask-outline" size={64} color={Colors.light.textLight} />
          <Text style={styles.emptyStateText}>No tests found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TestCard
              test={item}
              onPress={() => handleTestPress(item)}
              onToggleCompare={onToggleCompare}
              isInComparisonList={comparisonList.includes(item.id)}
            />
          )}
        />
      )}

      {/* Floating Compare Button */}
      {comparisonList.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCompareButton}
          onPress={onOpenLearningZone}
          activeOpacity={0.8}
        >
          <Ionicons name="git-compare" size={24} color="#FFFFFF" />
          <Text style={styles.floatingCompareText}>
            Compare ({comparisonList.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Test Detail Modal */}
      {selectedTest && (
        <TestDetailModal
          visible={detailModalVisible}
          test={selectedTest}
          onClose={() => setDetailModalVisible(false)}
        />
      )}
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
  filterContainer: {
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  floatingCompareButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  floatingCompareText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
