import { db } from '@/firebaseConfig';
import { Stack, router, useFocusEffect } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Student Item Component - Enhanced with modern design
const StudentItem = ({ item }) => {
  const [scaleValue] = React.useState(new Animated.Value(1));
  
  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.96,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity 
        style={styles.itemContainer} 
        onPress={() => router.push(`/(admin)/students/${item.id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: item.profileImageLocalUri || 'https://via.placeholder.com/100' }} 
            style={styles.profileImage} 
          />
          <View style={styles.statusIndicator} />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.fullName}</Text>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>Class: {item.className}</Text>
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowIcon}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AllStudentsScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fabAnimation] = React.useState(new Animated.Value(0));

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsCollection = collection(db, 'students');
      const studentSnapshot = await getDocs(studentsCollection);
      const studentsList = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students: ", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
      // Animate FAB on screen focus
      Animated.timing(fabAnimation, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Students',
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        }
      }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Directory</Text>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredStudents}
        renderItem={({ item }) => <StudentItem item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No Students Found</Text>
            <Text style={styles.emptySubtitle}>Press the '+' button below to add a new student.</Text>
          </View>
        )}
      />
      
      <Animated.View 
        style={[
          styles.fab,
          {
            transform: [
              {
                scale: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                })
              },
              {
                rotate: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }
            ],
            opacity: fabAnimation
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.fabInner} 
          onPress={() => router.push('/(admin)/students/add-student')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#64748B',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  classPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  classPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowIcon: {
    fontSize: 24,
    color: '#CBD5E1',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  }
});