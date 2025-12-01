import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getAllLabReports, deleteLabReport } from '../../services/labReportService';
import { LabReport } from '../../types/upload';

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reports, setReports] = useState<LabReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchQuery, reports]);

  const loadReports = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await getAllLabReports(user.uid);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, []);

  const filterReports = () => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(report => 
      report.labName.toLowerCase().includes(query) ||
      report.testResults.some(test => 
        test.testName.toLowerCase().includes(query)
      ) ||
      report.tags.some(tag => tag.toLowerCase().includes(query))
    );
    setFilteredReports(filtered);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed': return Colors.light.success;
      case 'pending': return Colors.light.warning;
      case 'reviewed': return Colors.light.primary;
      default: return Colors.light.textSecondary;
    }
  };

  // Delete report with confirmation
  const handleDeleteReport = async (reportId: string) => {
    if (!user?.uid) return;
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this lab report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteLabReport(user.uid, reportId);
              await loadReports(); // reload data
            } catch (error) {
              Alert.alert('Error', 'Could not delete report. Please try again.');
            }
          } 
        },
      ]
    );
  };

  const renderReportCard = ({ item }: { item: LabReport }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        // @ts-ignore - Dynamic route will be created
        router.push({
          pathname: '/report-detail',
          params: { id: item.reportId }
        });
      }}
      activeOpacity={0.7}
      onLongPress={() => handleDeleteReport(item.reportId)}
      delayLongPress={500}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons 
            name={item.reportType === 'pathology' ? 'flask' : 'document-text'} 
            size={24} 
            color={Colors.light.primary} 
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.labName}>{item.labName}</Text>
          <Text style={styles.testDate}>{formatDate(item.testDate)}</Text>
        </View>
        {item.isFavorite && (
          <Ionicons name="star" size={20} color={Colors.light.warning} />
        )}
      </View>

      <View style={styles.cardBody}>
        {item.testResults.length > 0 && (
          <View style={styles.testCount}>
            <Ionicons name="clipboard-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.testCountText}>
              {item.testResults.length} test{item.testResults.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>

        {item.aiInterpretation && (
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={14} color={Colors.light.upload.analyzing} />
            <Text style={styles.aiText}>AI Analyzed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={80} color={Colors.light.textLight} />
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptyText}>
        Upload your first lab report to get AI-powered health insights
      </Text>
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => {
          // @ts-ignore
          router.push('/smart-upload');
        }}
      >
        <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        <Text style={styles.uploadButtonText}>Upload Report</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Reports</Text>
        <View style={styles.addButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports, tests, or tags..."
          placeholderTextColor={Colors.light.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {reports.filter(r => r.status === 'analyzed').length}
          </Text>
          <Text style={styles.statLabel}>Analyzed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {reports.filter(r => r.isFavorite).length}
          </Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.reportId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reportCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  testDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  cardBody: {
    marginBottom: 12,
  },
  testCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  testCountText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  moreText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    paddingHorizontal: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.upload.analyzing,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});