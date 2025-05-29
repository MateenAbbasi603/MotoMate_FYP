import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/apiService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  OrderHistoryMain: undefined;
  OrderDetails: { orderId: number };
  'New Order': undefined;
  Vehicles: undefined;
  Profile: undefined;
  Notifications: undefined;
};

type OrderHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Order {
  orderId: number;
  status: string;
  orderDate: string;
  totalAmount: number;
  notes?: string;
  vehicleId?: number;
  serviceId?: number;
  includesInspection?: boolean;
  orderType?: string;
  paymentMethod?: string;
  invoice?: {
    invoiceId: number;
    status: string;
    totalAmount: number;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  service?: {
    serviceName: string;
    category: string;
    price: number;
  };
}

const OrderHistoryScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<OrderHistoryScreenNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalWithTax, setTotalWithTax] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getOrders();
      console.log('API Response:', response);

      if (response.success) {
        const ordersData = Array.isArray(response.data) ? response.data : [];
        console.log('Orders data:', ordersData);
        setOrders(ordersData);

        // Calculate financial statistics
        const spent = ordersData
          .filter(order => order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'paid')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        // Calculate total SST (18% of completed/paid orders)
        const tax = spent * 0.18;
        const withTax = spent + tax;

        setTotalSpent(spent);
        setTotalTax(tax);
        setTotalWithTax(withTax);
      } else {
        const errorMessage = response.message || 'Failed to fetch orders';
        console.error('Failed to fetch orders:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders(selectedFilter);
  }, [orders, selectedFilter]);

  const filterOrders = (filter: string) => {
    switch (filter) {
      case 'all':
        setFilteredOrders(orders);
        break;
      case 'pending':
        setFilteredOrders(orders.filter(order => order.status.toLowerCase() === 'pending'));
        break;
      case 'in-progress':
        setFilteredOrders(orders.filter(order => 
          order.status.toLowerCase() === 'in progress' || 
          order.status.toLowerCase() === 'inprogress'
        ));
        break;
      case 'completed':
        setFilteredOrders(orders.filter(order => order.status.toLowerCase() === 'completed'));
        break;
      case 'cancelled':
        setFilteredOrders(orders.filter(order => order.status.toLowerCase() === 'cancelled'));
        break;
      default:
        setFilteredOrders(orders);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount?.toFixed(2) || '0.00'}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10B981';
      case 'in progress':
      case 'inprogress':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleOrderPress = (orderId: number) => {
    console.log('Opening order details for:', orderId);
    navigation.navigate('OrderDetails', { orderId });
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item.orderId)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.orderId}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{formatDate(item.orderDate)}</Text>
        </View>

        {item.vehicle && (
          <View style={styles.detailRow}>
            <Ionicons name="car" size={20} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.vehicle.make} {item.vehicle.model} ({item.vehicle.year})
            </Text>
          </View>
        )}

        {item.orderType && (
          <View style={styles.detailRow}>
            <Ionicons name="storefront" size={20} color="#6B7280" />
            <Text style={styles.detailText}>{item.orderType}</Text>
          </View>
        )}

        {item.includesInspection && (
          <View style={styles.detailRow}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Includes Inspection</Text>
          </View>
        )}

        {item.service && (
          <View style={styles.detailRow}>
            <Ionicons name="construct" size={20} color="#6B7280" />
            <Text style={styles.detailText}>{item.service.serviceName}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.price}>{formatCurrency(item.totalAmount)}</Text>
        <View style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <View style={styles.filterModal}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filter Orders</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.filterOptions}>
        {[
          { label: 'All Orders', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterOption,
              selectedFilter === filter.value && styles.selectedFilter
            ]}
            onPress={() => {
              setSelectedFilter(filter.value);
              setShowFilterModal(false);
            }}
          >
            <Text style={[
              styles.filterOptionText,
              selectedFilter === filter.value && styles.selectedFilterText
            ]}>
              {filter.label}
            </Text>
            {selectedFilter === filter.value && (
              <Ionicons name="checkmark" size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUserSection = () => (
    <View style={styles.userSection}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: user?.imgUrl || 'https://via.placeholder.com/100' }}
          style={styles.userAvatar}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {orders.filter(o => o.status.toLowerCase() === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {orders.filter(o => o.status.toLowerCase() === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
      <View style={styles.financialStatsContainer}>
        <View style={styles.financialStatItem}>
          <View style={styles.financialStatHeader}>
            <Ionicons name="wallet" size={20} color="#10B981" />
            <Text style={styles.financialStatLabel}>Total Spent (Excl. SST)</Text>
          </View>
          <Text style={styles.financialStatValue}>{formatCurrency(totalSpent)}</Text>
        </View>
        <View style={styles.financialStatItem}>
          <View style={styles.financialStatHeader}>
            <Ionicons name="calculator" size={20} color="#F59E0B" />
            <Text style={styles.financialStatLabel}>Total SST (18%)</Text>
          </View>
          <Text style={styles.financialStatValue}>{formatCurrency(totalTax)}</Text>
        </View>
        <View style={[styles.financialStatItem, styles.totalWithTaxItem]}>
          <View style={styles.financialStatHeader}>
            <Ionicons name="cash" size={20} color="#3B82F6" />
            <Text style={styles.financialStatLabel}>Total Amount (Incl. SST)</Text>
          </View>
          <Text style={[styles.financialStatValue, styles.totalWithTaxValue]}>
            {formatCurrency(totalWithTax)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderShortcuts = () => (
    <View style={styles.shortcutsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.shortcutsGrid}>
        <TouchableOpacity
          style={styles.shortcutItem}
          onPress={() => navigation.navigate('New Order')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#EBF4FF' }]}>
            <Ionicons name="add-circle" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.shortcutLabel}>New Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutItem}
          onPress={() => navigation.navigate('Vehicles')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="car" size={24} color="#10B981" />
          </View>
          <Text style={styles.shortcutLabel}>My Vehicles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="person" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.shortcutLabel}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutItem}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="notifications" size={24} color="#EF4444" />
          </View>
          <Text style={styles.shortcutLabel}>Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Dashboard</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrders}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {renderUserSection()}
        {renderShortcuts()}
        
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.orderId?.toString() || Math.random().toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No orders found</Text>
                <Text style={styles.emptySubtext}>Your service history will appear here</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchOrders}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </ScrollView>

      {showFilterModal && renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  userSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  shortcutsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 1,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginHorizontal: -8,
  },
  shortcutItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  ordersSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterOptions: {
    maxHeight: 300,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedFilter: {
    backgroundColor: '#EBF4FF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  selectedFilterText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  financialStatsContainer: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  financialStatItem: {
    marginBottom: 12,
  },
  financialStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  financialStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  financialStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 28,
  },
  totalWithTaxItem: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalWithTaxValue: {
    fontSize: 20,
    color: '#3B82F6',
  },
});

export default OrderHistoryScreen;