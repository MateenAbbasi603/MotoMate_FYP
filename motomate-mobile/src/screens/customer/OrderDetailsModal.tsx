import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from 'services/apiService';
import { useAuth } from 'context/AuthContext';

interface OrderDetailsModalProps {
  orderId: number;
  visible: boolean;
  onClose: () => void;
}

interface OrderDetails {
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId?: number;
  includesInspection: boolean;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes?: string;
  invoiceStatus?: string;
  invoiceId?: number;
  user?: {
    userId: number;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  vehicle?: {
    vehicleId: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  service?: {
    serviceId: number;
    serviceName: string;
    category: string;
    subCategory?: string;
    price: number;
    description: string;
  };
  inspection?: {
    inspectionId: number;
    serviceId?: number;
    serviceName?: string;
    subCategory?: string;
    scheduledDate: string;
    timeSlot: string;
    status: string;
    bodyCondition?: string;
    engineCondition?: string;
    electricalCondition?: string;
    tireCondition?: string;
    brakeCondition?: string;
    transmissionCondition?: string;
    notes?: string;
    price?: number;
  };
  additionalServices?: Array<{
    serviceId: number;
    serviceName: string;
    category: string;
    subCategory?: string;
    price: number;
    description: string;
  }>;
}

interface InvoiceData {
  success: boolean;
  invoice: {
    invoiceId: number;
    orderId: number;
    userId: number;
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    invoiceDate: string;
    dueDate: string;
    status: string;
    notes?: string;
  };
  invoiceItems: Array<{
    invoiceItemId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  customer?: {
    userId: number;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  vehicle?: {
    vehicleId: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  mechanic?: {
    userId: number;
    name: string;
    phone?: string;
  };
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, visible, onClose }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'inspection' | 'invoice'>('details');

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (visible && orderId) {
      fetchOrderDetails();
    }
  }, [visible, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching order details for orderId:', orderId);
      const response = await apiService.getOrderDetails(orderId);
      console.log('Order details response:', response.data);

      if (response.success || response.data) {
        const orderData = response.data || response;
        setOrder(orderData);

        // If order is completed, check for invoice
        if (orderData.status?.toLowerCase() === 'completed') {
          await checkForInvoice(orderData.orderId);
        }
      } else {
        setError(response.message || 'Failed to fetch order details');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setError('An unexpected error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  };

  const checkForInvoice = async (orderIdParam: number) => {
    try {
      setLoadingInvoice(true);
      console.log('Checking for invoice for order:', orderIdParam);
      
      const response:any = await apiService.getInvoiceById("2009");
      console.log('Invoice response:', response);

      if (response.success) {
        setInvoice(response);
        console.log("Invoice found:", response);
      }
    } catch (error: any) {
      console.error('Error checking for invoice:', error);
      // We'll silently fail here since this is just a check
    } finally {
      setLoadingInvoice(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `PKR ${numAmount?.toFixed(2) || '0.00'}`;
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
      case 'paid':
        return '#10B981';
      case 'issued':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      case 'in progress':
      case 'inprogress':
        return 'play-circle';
      case 'issued':
        return 'document-text';
      case 'overdue':
        return 'alarm';
      default:
        return 'ellipse-outline';
    }
  };

  const calculateOrderTotal = () => {
    let total = 0;
    
    // Add main service price
    if (order?.service?.price) {
      total += order.service.price;
    }
    
    // Add inspection price if available
    if (order?.includesInspection && order?.inspection?.price) {
      total += order.inspection.price;
    }
    
    // Add additional services
    if (order?.additionalServices) {
      total += order.additionalServices.reduce((sum, service) => sum + (service.price || 0), 0);
    }
    
    return total || order?.totalAmount || 0;
  };

  const renderTabButton = (
    tab: 'details' | 'inspection' | 'invoice',
    title: string,
    icon: string,
    isVisible: boolean = true
  ) => {
    if (!isVisible) return null;

    const visibleTabs = [
      true, // details always visible
      order?.includesInspection && order?.inspection,
      !!invoice,
    ].filter(Boolean);

    const tabsCount = visibleTabs.length;

    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === tab && styles.activeTabButton,
          { width: (screenWidth - 48) / tabsCount }
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={activeTab === tab ? '#3B82F6' : '#6B7280'}
        />
        <Text style={[
          styles.tabButtonText,
          activeTab === tab && styles.activeTabButtonText
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      {/* Vehicle Information */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="car" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
        </View>
        {order?.vehicle && (
          <View style={styles.sectionContent}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconContainer}>
                <Ionicons name="car-sport" size={24} color="#3B82F6" />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleTitle}>
                  {order.vehicle.make} {order.vehicle.model}
                </Text>
                <View style={styles.vehicleBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{order.vehicle.year}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{order.vehicle.licensePlate}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.detailRows}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registration No.</Text>
                <Text style={styles.detailValue}>{order.vehicle.licensePlate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model Year</Text>
                <Text style={styles.detailValue}>{order.vehicle.year}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Service Information */}
      {order?.service && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Service Information</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.serviceItem}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <Ionicons 
                    name={order.service.category?.toLowerCase() === 'inspection' ? 'shield-checkmark' : 'construct'} 
                    size={20} 
                    color="#3B82F6" 
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{order.service.serviceName}</Text>
                  {order.service.subCategory && (
                    <Text style={styles.serviceSubCategory}>{order.service.subCategory}</Text>
                  )}
                  <Text style={styles.serviceDescription}>
                    {order.service.description || 'No description available'}
                  </Text>
                </View>
              </View>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceDetailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#E0E7FF' }]}>
                    <Text style={[styles.statusText, { color: '#3730A3' }]}>
                      {order.service.category}
                    </Text>
                  </View>
                </View>
                <View style={styles.serviceDetailRow}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(order.service.price || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Additional Services */}
      {order?.additionalServices && order.additionalServices.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Additional Services</Text>
          </View>
          <View style={styles.sectionContent}>
            {order.additionalServices.map((service, index) => (
              <View key={service.serviceId || index} style={styles.additionalServiceItem}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Ionicons 
                      name={service.category?.toLowerCase() === 'inspection' ? 'shield-checkmark' : 'construct'} 
                      size={16} 
                      color="#3B82F6" 
                    />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.additionalServiceTitle}>{service.serviceName}</Text>
                    {service.subCategory && (
                      <Text style={styles.serviceSubCategory}>{service.subCategory}</Text>
                    )}
                    <Text style={styles.additionalServiceDescription}>
                      {service.description || 'No description available'}
                    </Text>
                  </View>
                  <View style={styles.additionalServicePrice}>
                    <Text style={styles.detailValue}>{formatCurrency(service.price || 0)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.statusText, { color: '#374151' }]}>
                        {service.category}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Payment Summary */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="card" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Payment Summary</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.paymentSummary}>
            {order?.service && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Main Service</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(order.service.price || 0)}
                </Text>
              </View>
            )}
            
            {order?.includesInspection && order?.inspection?.price && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Inspection Fee</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(order.inspection.price)}
                </Text>
              </View>
            )}

            {order?.additionalServices && order.additionalServices.length > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Additional Services</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(
                    order.additionalServices.reduce((sum, service) => sum + (service.price || 0), 0)
                  )}
                </Text>
              </View>
            )}

            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(calculateOrderTotal())}
              </Text>
            </View>

            {/* Payment Status */}
            {invoice && (
              <View style={[styles.paymentRow, styles.statusRow]}>
                <Text style={styles.paymentLabel}>Payment Status</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
                ]}>
                  <Ionicons
                    name={getStatusIcon(invoice.invoice.status) as any}
                    size={14}
                    color={getStatusColor(invoice.invoice.status)}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(invoice.invoice.status) }
                  ]}>
                    {invoice.invoice.status}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Notes */}
      {order?.notes && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Order Notes</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderInspectionTab = () => (
    <View style={styles.tabContent}>
      {order?.inspection ? (
        <>
          {/* Inspection Schedule Info */}
          <View style={styles.inspectionScheduleCard}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleIconContainer}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.scheduleLabel}>Inspection Date</Text>
                  <Text style={styles.scheduleValue}>
                    {formatDate(order.inspection.scheduledDate)}
                  </Text>
                </View>
              </View>
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleIconContainer}>
                  <Ionicons name="time" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.scheduleLabel}>Time Slot</Text>
                  <Text style={styles.scheduleValue}>
                    {order.inspection.timeSlot || 'Not specified'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.inspection.status) + '20', alignSelf: 'center' }
            ]}>
              <Ionicons
                name={getStatusIcon(order.inspection.status) as any}
                size={14}
                color={getStatusColor(order.inspection.status)}
              />
              <Text style={[
                styles.statusText,
                { color: getStatusColor(order.inspection.status) }
              ]}>
                {order.inspection.status}
              </Text>
            </View>
          </View>

          {/* Inspection Service Details */}
          {order.inspection.serviceName && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Inspection Service</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.inspectionServiceItem}>
                  <Text style={styles.inspectionServiceName}>{order.inspection.serviceName}</Text>
                  {order.inspection.subCategory && (
                    <Text style={styles.inspectionServiceSubCategory}>
                      {order.inspection.subCategory}
                    </Text>
                  )}
                  {order.inspection.price && (
                    <View style={styles.inspectionServicePrice}>
                      <Text style={styles.detailLabel}>Inspection Fee</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(order.inspection.price)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Inspection Results */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Inspection Results</Text>
            </View>
            
            {order.inspection.status === 'completed' ? (
              <View style={styles.sectionContent}>
                <View style={styles.inspectionGrid}>
                  {[
                    { label: 'Body Condition', value: order.inspection.bodyCondition },
                    { label: 'Engine Condition', value: order.inspection.engineCondition },
                    { label: 'Electrical Condition', value: order.inspection.electricalCondition },
                    { label: 'Tire Condition', value: order.inspection.tireCondition },
                    { label: 'Brake Condition', value: order.inspection.brakeCondition },
                    { label: 'Transmission Condition', value: order.inspection.transmissionCondition },
                  ].filter(item => item.value && item.value !== 'Not Inspected Yet').map((item, index) => (
                    <View key={index} style={styles.inspectionResultItem}>
                      <Text style={styles.inspectionResultLabel}>{item.label}</Text>
                      <View style={styles.inspectionResultValue}>
                        <Ionicons name="ellipse" size={8} color="#3B82F6" />
                        <Text style={styles.inspectionResultText}>
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.inspectionStatusContainer}>
                <View style={styles.inspectionStatusIcon}>
                  <Ionicons
                    name={getStatusIcon(order.inspection.status) as any}
                    size={32}
                    color={getStatusColor(order.inspection.status)}
                  />
                </View>
                <Text style={styles.inspectionStatusTitle}>
                  {order.inspection.status === 'pending' ? 'Inspection Scheduled' :
                   order.inspection.status === 'in progress' ? 'Inspection In Progress' :
                   order.inspection.status === 'cancelled' ? 'Inspection Cancelled' :
                   `Inspection ${order.inspection.status}`}
                </Text>
                <Text style={styles.inspectionStatusDescription}>
                  {order.inspection.status === 'pending' 
                    ? "Your vehicle inspection is scheduled but has not been completed yet. We'll notify you once the inspection is complete."
                    : order.inspection.status === 'in progress'
                    ? "Your vehicle is currently being inspected by our technicians. Results will be available soon."
                    : order.inspection.status === 'cancelled'
                    ? "This inspection was cancelled. Please contact customer service if you need to reschedule."
                    : `The current status of your inspection is ${order.inspection.status}.`}
                </Text>
              </View>
            )}
          </View>

          {/* Inspection Notes */}
          {order.inspection.notes && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Inspection Notes</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.notesText}>{order.inspection.notes}</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No Inspection Data</Text>
          <Text style={styles.emptySubtext}>This order does not include an inspection</Text>
        </View>
      )}
    </View>
  );

  const renderInvoiceTab = () => (
    <View style={styles.tabContent}>
      {invoice ? (
        <>
          {/* Invoice Header */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Invoice #{invoice.invoice.invoiceId}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
              ]}>
                <Ionicons
                  name={getStatusIcon(invoice.invoice.status) as any}
                  size={14}
                  color={getStatusColor(invoice.invoice.status)}
                />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(invoice.invoice.status) }
                ]}>
                  {invoice.invoice.status}
                </Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.detailRows}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issue Date</Text>
                  <Text style={styles.detailValue}>{formatDate(invoice.invoice.invoiceDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={[
                    styles.detailValue,
                    invoice.invoice.status === 'overdue' && styles.overdueText
                  ]}>
                    {formatDate(invoice.invoice.dueDate)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>{invoice.invoice.orderId}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Invoice Items */}
          {invoice.invoiceItems && invoice.invoiceItems.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Invoice Items</Text>
              </View>
              <View style={styles.sectionContent}>
                {invoice.invoiceItems.map((item, index) => (
                  <View key={item.invoiceItemId || index} style={styles.invoiceItem}>
                    <View style={styles.invoiceItemHeader}>
                      <Text style={styles.invoiceItemDescription}>{item.description}</Text>
                      <Text style={styles.invoiceItemPrice}>{formatCurrency(item.totalPrice)}</Text>
                    </View>
                    <View style={styles.invoiceItemDetails}>
                      <Text style={styles.invoiceItemDetail}>
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Invoice Summary */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calculator" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Invoice Summary</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.paymentSummary}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Subtotal</Text>
                  <Text style={styles.paymentValue}>
                    {formatCurrency(invoice.invoice.subTotal)}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>
                    Tax ({invoice.invoice.taxRate}%)
                  </Text>
                  <Text style={styles.paymentValue}>
                    {formatCurrency(invoice.invoice.taxAmount)}
                  </Text>
                </View>
                <View style={[styles.paymentRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.invoice.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Customer & Mechanic Info */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Service Information</Text>
            </View>
            <View style={styles.sectionContent}>
              {invoice.customer && (
                <View style={styles.customerInfo}>
                  <Text style={styles.customerInfoTitle}>Customer</Text>
                  <Text style={styles.customerInfoText}>{invoice.customer.name}</Text>
                  <Text style={styles.customerInfoText}>{invoice.customer.email}</Text>
                  <Text style={styles.customerInfoText}>{invoice.customer.phone}</Text>
                </View>
              )}
              
              {invoice.mechanic && (
                <View style={styles.mechanicInfo}>
                  <Text style={styles.mechanicInfoTitle}>Service Performed By</Text>
                  <Text style={styles.mechanicInfoText}>{invoice.mechanic.name}</Text>
                  {invoice.mechanic.phone && (
                    <Text style={styles.mechanicInfoText}>{invoice.mechanic.phone}</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Invoice Notes */}
          {invoice.invoice.notes && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Invoice Notes</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.notesText}>{invoice.invoice.notes}</Text>
              </View>
            </View>
          )}

          {/* Payment Actions */}
          {invoice.invoice.status !== 'paid' && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Payment Required</Text>
              </View>
              <View style={styles.sectionContent}>
                <TouchableOpacity style={styles.payNowButton}>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.payNowButtonText}>
                    Pay Now - {formatCurrency(invoice.invoice.totalAmount)}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.paymentHelpText}>
                  Tap to proceed to secure payment
                </Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No Invoice Available</Text>
          <Text style={styles.emptySubtext}>
            {order?.status === 'completed' 
              ? loadingInvoice 
                ? 'Checking for invoice...'
                : 'Invoice is being generated'
              : 'Invoice will be available once the order is completed'
            }
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Order Details</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (error || !order) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Order Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Error Loading Order</Text>
            <Text style={styles.errorText}>{error || 'Order not found'}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchOrderDetails}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Order #{order.orderId}</Text>
            <Text style={styles.subtitle}>Placed on {formatDate(order.orderDate)}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Order Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '20' }
              ]}>
                <Ionicons
                  name={getStatusIcon(order.status) as any}
                  size={16}
                  color={getStatusColor(order.status)}
                />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) }
                ]}>
                  {order.status}
                </Text>
              </View>
            </View>
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(calculateOrderTotal())}</Text>
            </View>
          </View>
          
          {/* Invoice Status */}
          {invoice && (
            <View style={styles.invoiceStatusContainer}>
              <Text style={styles.invoiceStatusLabel}>Invoice Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
              ]}>
                <Ionicons
                  name={getStatusIcon(invoice.invoice.status) as any}
                  size={14}
                  color={getStatusColor(invoice.invoice.status)}
                />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(invoice.invoice.status) }
                ]}>
                  {invoice.invoice.status}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {renderTabButton('details', 'Details', 'document-text')}
          {renderTabButton('inspection', 'Inspection', 'shield-checkmark', 
            order.includesInspection && !!order.inspection)}
          {renderTabButton('invoice', 'Invoice', 'receipt', !!invoice)}
        </View>

        {/* Tab Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'inspection' && renderInspectionTab()}
          {activeTab === 'invoice' && renderInvoiceTab()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 2,
  },
  invoiceStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  invoiceStatusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#F3F4F6',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  sectionContent: {
    gap: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  vehicleIconContainer: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  vehicleBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  detailRows: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  serviceItem: {
    gap: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceIconContainer: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: 8,
    marginTop: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  serviceSubCategory: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  serviceDetails: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  serviceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalServiceItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  additionalServiceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  additionalServiceDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  additionalServicePrice: {
    alignItems: 'flex-end',
    marginLeft: 12,
    minWidth: 80,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusRow: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  paymentSummary: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inspectionScheduleCard: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scheduleIconContainer: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: 8,
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#3B82F6',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  inspectionServiceItem: {
    gap: 8,
  },
  inspectionServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  inspectionServiceSubCategory: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  inspectionServicePrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inspectionGrid: {
    gap: 12,
  },
  inspectionResultItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inspectionResultLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  inspectionResultValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectionResultText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  inspectionStatusContainer: {
    alignItems: 'center',
    padding: 32,
  },
  inspectionStatusIcon: {
    marginBottom: 16,
  },
  inspectionStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  inspectionStatusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  invoiceItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  invoiceItemDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  invoiceItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  invoiceItemDetails: {
    marginTop: 4,
  },
  invoiceItemDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  customerInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customerInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  customerInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  mechanicInfo: {
    marginTop: 8,
  },
  mechanicInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  mechanicInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  payNowButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentHelpText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
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
});

export default OrderDetailsModal;