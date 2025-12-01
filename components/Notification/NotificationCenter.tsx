import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList, 
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppNotification } from '../../services/appNotificationService';
import { Colors } from '../../constants/colors'; 

// --- Bell Component (The Icon) ---
export const NotificationBell = ({ onPress, unreadCount }: { onPress: () => void, unreadCount: number }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.bellContainer}>
      <Ionicons name="notifications-outline" size={26} color={Colors.light.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// --- Modal Component (The List) ---
interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationModal = ({ 
  visible, 
  onClose, 
  notifications, 
  onClearAll,
  onMarkRead 
}: NotificationModalProps) => {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'weekly', label: 'Weekly' },      // NEW: Weekly tab
    { id: 'vitals', label: 'Vitals' },
    // { id: 'ai-insight', label: 'AI Insight' },
    { id: 'reminder', label: 'Reminder' },
  ];

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'weekly') {
      // Weekly reports are stored as ai-insight with data.type === 'weekly-report'
      return n.data?.type === 'weekly-report';
    }
    return n.type === filter;
  });

  const handleNotificationPress = (item: AppNotification) => {
    // Mark as read in Firestore / state
    onMarkRead(item.id);

    // If it's a weekly report, navigate to the History (Weekly Reports) screen
    if (item.data?.type === 'weekly-report') {
      onClose(); // close modal first for smoother UX
      // Go to the History screen that lists weekly reports
      router.push('/(tabs)/history');
      return;
    }

    // For other notification types, you can add navigation logic later if needed
  };

  // Render individual notification item
  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: getCategoryColor(item) }]}>
         <Ionicons name={getCategoryIcon(item)} size={20} color="#fff" />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        {!item.read && <View style={styles.dot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
       <SafeAreaView style={styles.modalContainer}>
         
         {/* Header */}
         <View style={styles.modalHeader}>
           <Text style={styles.modalTitle}>Notifications</Text>
           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
             <Ionicons name="close" size={24} color={Colors.light.text} />
           </TouchableOpacity>
         </View>

         {/* Filter Tabs */}
         <View style={styles.filterContainer}>
           <FlatList
             horizontal
             showsHorizontalScrollIndicator={false}
             data={filters}
             keyExtractor={item => item.id}
             renderItem={({ item }) => (
               <TouchableOpacity 
                 style={[styles.filterChip, filter === item.id && styles.activeFilter]}
                 onPress={() => setFilter(item.id)}
               >
                 <Text style={[styles.filterText, filter === item.id && styles.activeFilterText]}>
                   {item.label}
                 </Text>
               </TouchableOpacity>
             )}
             contentContainerStyle={{ paddingHorizontal: 16 }}
           />
         </View>

         {/* Notification List */}
         <FlatList
           data={filteredNotifications}
           renderItem={renderItem}
           keyExtractor={item => item.id}
           contentContainerStyle={styles.listContent}
           ListEmptyComponent={
             <View style={styles.emptyState}>
               <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
               <Text style={styles.emptyText}>No notifications yet</Text>
             </View>
           }
         />

         {/* Footer: Clear All */}
         {notifications.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
                <Text style={styles.clearText}>Clear All Notifications</Text>
              </TouchableOpacity>
            </View>
         )}
       </SafeAreaView>
    </Modal>
  );
};

// --- Helpers & Styles ---

// Now take full notification to allow checking data.type
const getCategoryColor = (item: AppNotification) => {
  // Special color for weekly reports if you want
  if (item.data?.type === 'weekly-report') {
    return '#3182CE'; // blue
  }

  switch(item.type) {
    case 'reminder': return '#FFB199'; // Peach
    case 'ai-insight': return '#9F7AEA'; // Purple
    case 'vitals': return '#F56565'; // Red
    default: return '#CBD5E0'; // Gray
  }
};

const getCategoryIcon = (item: AppNotification) => {
  if (item.data?.type === 'weekly-report') {
    return 'calendar-outline';
  }

  switch(item.type) {
    case 'reminder': return 'alarm-outline';
    case 'ai-insight': return 'sparkles-outline';
    case 'vitals': return 'heart-outline';
    default: return 'information-circle-outline';
  }
};

const formatTime = (date: Date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  // Bell Styles
  bellContainer: { 
    padding: 8, 
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff'
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  closeButton: { padding: 4 },
  
  filterContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#F7FAFC', 
    marginRight: 8 
  },
  activeFilter: { backgroundColor: Colors.light.primary || '#fa8a61ff' },
  filterText: { color: '#718096', fontSize: 14, fontWeight: '600' },
  activeFilterText: { color: '#fff' },
  
  listContent: { padding: 16, paddingBottom: 100 },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
  },
  unreadItem: { backgroundColor: '#FFF5F5', borderColor: '#FED7D7' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text, flex: 1, marginRight: 8 },
  time: { fontSize: 12, color: '#A0AEC0' },
  body: { fontSize: 13, color: '#718096', lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5252', position: 'absolute', top: 40, right: 0 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#A0AEC0' },
  
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  clearButton: { padding: 12, alignItems: 'center' },
  clearText: { color: '#FF5252', fontWeight: '600', fontSize: 16 }
});
