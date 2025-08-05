import { db } from '@/firebaseConfig';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



// Clean Minimal Summary Card
interface SummaryCardProps {
  title: string;
  value: number;
  iconName: keyof typeof FontAwesome.glyphMap;
  change?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, iconName, change }) => (
  <View style={styles.summaryCard}>
    <View style={styles.cardHeader}>
      <View style={styles.iconContainer}>
        <FontAwesome name={iconName} size={18} color="#666" />
      </View>
      {change && (
        <Text style={styles.changeText}>{change}</Text>
      )}
    </View>
    <Text style={styles.cardValue}>{value.toLocaleString()}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
);

// Minimal Action Button
interface ActionButtonProps {
  title: string;
  description: string;
  iconName: keyof typeof FontAwesome.glyphMap;
  href: string;
  onPress?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, description, iconName, href, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(href as any);
    }
  };

  return (
    <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
      <View style={styles.actionContent}>
        <View style={styles.actionIcon}>
          <FontAwesome name={iconName} size={20} color="#333" />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#999" />
      </View>
    </TouchableOpacity>
  );
};

// Quick Stats Component
const QuickStats = () => (
  <View style={styles.quickStats}>
    <Text style={styles.sectionTitle}>Today</Text>
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>156</Text>
        <Text style={styles.statLabel}>Check-ins</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>98.2%</Text>
        <Text style={styles.statLabel}>Attendance</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>3</Text>
        <Text style={styles.statLabel}>Alerts</Text>
      </View>
    </View>
  </View>
);

export default function AdminDashboardScreen() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsPresent, setStudentsPresent] = useState(0);
  const [studentsOnLeave, setStudentsOnLeave] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        setTotalStudents(studentsSnapshot.size);

        const presentCount = Math.floor(studentsSnapshot.size * 0.92);
        const onLeaveCount = studentsSnapshot.size - presentCount;

        setStudentsPresent(presentCount);
        setStudentsOnLeave(onLeaveCount);

        setTimeout(() => setLoading(false), 800);
      } catch (error) {
        console.error("Error fetching summary data:", error);
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Good morning</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <FontAwesome name="user" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards Grid */}
        <View style={styles.summaryGrid}>
          <SummaryCard 
            title="Total Students" 
            value={totalStudents} 
            iconName="users"
            change="+12"
          />
          <SummaryCard 
            title="Present" 
            value={studentsPresent} 
            iconName="check"
            change="+8"
          />
          <SummaryCard 
            title="Absent" 
            value={studentsOnLeave} 
            iconName="clock-o"
            change="-3"
          />
          <SummaryCard 
            title="Attendance Rate" 
            value={Math.round((studentsPresent / totalStudents) * 100)} 
            iconName="chart-line"
            change="+2.1%"
          />
        </View>

        {/* Quick Stats */}
        <QuickStats />

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <ActionButton 
            title="Scan QR Code" 
            description="Quick student check-in"
            iconName="qrcode" 
            href="/(admin)/scan-qr" 
          />
          
          <ActionButton 
            title="Manage Students" 
            description="Add or edit student records"
            iconName="user-plus" 
            href="/(admin)/students" 
          />
          
          <ActionButton 
            title="Add New Student" 
            description="Register new student"
            iconName="plus"
            href="/(admin)/students/add-student" 
          />
          
          <ActionButton 
            title="Communication" 
            description="Send notifications to parents"
            iconName="bullhorn" 
            href="/(admin)/communication" 
          />
          
          <ActionButton 
            title="System Settings" 
            description="Configure application"
            iconName="cog" 
            href="/settings" 
          />
        </View>

        {/* System Status */}
        <View style={styles.systemStatus}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statusText}>System Online</Text>
            </View>
            <Text style={styles.statusTime}>Last sync: 2 min ago</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '400',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  welcomeText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '400',
  },
  headerTitle: {
    color: '#111',
    fontSize: 32,
    fontWeight: '300',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '300',
    color: '#111',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },

  // Quick Stats
  quickStats: {
    marginHorizontal: 24,
    marginVertical: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '300',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },

  // Actions
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // System Status
  systemStatus: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusTime: {
    fontSize: 12,
    color: '#999',
  },
});