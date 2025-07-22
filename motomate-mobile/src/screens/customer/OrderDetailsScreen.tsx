import React, { useState, useEffect, useRef } from 'react';
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
    Modal,
    Platform,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from 'context/AuthContext';
import { apiService } from 'services/apiService';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';


// Define navigation types
type OrdersStackParamList = {
    OrderHistoryMain: undefined;
    OrderDetails: { orderId: number };
};

type OrderDetailsScreenNavigationProp = StackNavigationProp<
    OrdersStackParamList,
    'OrderDetails'
>;

type OrderDetailsScreenRouteProp = RouteProp<
    OrdersStackParamList,
    'OrderDetails'
>;

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
    paymentMethod?: string;
    invoiceStatus?: string;
    invoiceId?: number | null;
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
        price: number;
        description: string;
        subCategory?: string;
    };
    inspection?: {
        inspectionId: number;
        serviceId: number;
        scheduledDate: string;
        status: string;
        serviceName: string;
        subCategory: string;
        timeSlot: string;
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
        price: number;
        description: string;
        subCategory?: string;
        status?: string;
    }>;
}

// Helper type for array elements, safely handles undefined
type ArrayElement<ArrayType extends readonly unknown[] | undefined> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// Define a discriminated union type for inspection items
type MainInspectionItem = Omit<NonNullable<OrderDetails['inspection']>, 'Service' | 'serviceName' | 'price' | 'subCategory' | 'description' | 'status'> & // Exclude relevant properties to redefine
{
    isMainInspection: true;
    status: string;
    price?: number;
    notes?: string;
    serviceName?: string;
    subCategory?: string;
    engineCondition?: string;
    transmissionCondition?: string;
    brakeCondition?: string;
    electricalCondition?: string;
    tireCondition?: string;
    bodyCondition?: string;
};

type AdditionalServiceItemBase = NonNullable<ArrayElement<NonNullable<OrderDetails['additionalServices']>>>;

type AdditionalInspectionItem = Omit<AdditionalServiceItemBase, 'notes' | 'engineCondition' | 'transmissionCondition' | 'brakeCondition' | 'electricalCondition' | 'tireCondition' | 'bodyCondition' | 'inspectionId' | 'scheduledDate' | 'timeSlot' | 'Service'> & // Exclude properties not present on additional services
{ isMainInspection: false; subCategory?: string; description?: string; status?: string; price?: number; serviceId: number; serviceName: string; category: string; }; // Include relevant properties for additional services with category inspection

type InspectionItem = MainInspectionItem | AdditionalInspectionItem;

// Type guard function
function isMainInspectionItem(item: InspectionItem): item is MainInspectionItem {
    return item.isMainInspection === true;
}

function isAdditionalInspectionItem(item: InspectionItem): item is AdditionalInspectionItem {
    return item.isMainInspection === false && item.category?.toLowerCase() === 'inspection';
}

const OrderDetailsScreen: React.FC = () => {
    const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
    const route = useRoute<OrderDetailsScreenRouteProp>();
    const { orderId } = route.params;
    const { user } = useAuth();

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'inspection' | 'invoice'>('details');
    const [invoice, setInvoice] = useState<any>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [savingToGallery, setSavingToGallery] = useState(false);

    const invoiceRef = useRef<ViewShot>(null);
    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[OrderDetailsScreen] Starting to fetch order details for orderId:', orderId);
            const response = await apiService.getOrderDetails(orderId);
            console.log('[OrderDetailsScreen] Raw API Response:', JSON.stringify(response, null, 2));

            if (!response) {
                console.error('[OrderDetailsScreen] No response received from API');
                setError('No response received from server');
                return;
            }

            if (!response.success) {
                console.error('[OrderDetailsScreen] API returned error:', response.message);
                setError(response.message || 'Failed to fetch order details');
                return;
            }

            if (!response.data || !response.data.order) {
                console.error('[OrderDetailsScreen] No order data in API response');
                setError('No order data received');
                return;
            }

            // Set the order data from the nested structure
            const orderData = response.data.order;
            console.log('[OrderDetailsScreen] Setting order data:', JSON.stringify(orderData, null, 2));
            setOrder(orderData);

            // Check for invoice if order data is successfully fetched and orderId exists
            if (orderData.orderId) {
                console.log('[OrderDetailsScreen] Checking for invoice after fetching order details');
                await checkForInvoice(orderData.orderId);
            } else {
                console.log('[OrderDetailsScreen] No orderId found in response data');
                setInvoice(null);
            }
        } catch (error: any) {
            console.error('[OrderDetailsScreen] Error fetching order details:', error);
            console.error('[OrderDetailsScreen] Error stack:', error?.stack);
            setError(error?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const checkForInvoice = async (orderId: number) => {
        if (!orderId) {
            console.log('[OrderDetailsScreen] No orderId provided for invoice check');
            setInvoice(null);
            return;
        }

        try {
            setLoadingInvoice(true);
            console.log('[OrderDetailsScreen] Checking for invoice for order:', orderId);

            const response = await apiService.getInvoiceById(orderId.toString());
            console.log('[OrderDetailsScreen] Raw invoice response:', JSON.stringify(response, null, 2));

            if (response && response.success && response.data) {
                // Debug the structure of response.data
                console.log('[OrderDetailsScreen] Response data structure:', {
                    hasInvoice: !!response.data.invoice,
                    hasInvoiceItems: !!response.data.invoiceItems,
                    hasNestedInvoiceItems: !!response.data.invoice?.invoiceItems,
                    dataKeys: Object.keys(response.data)
                });

                // Create a safe invoice object
                const invoiceData = {
                    invoice: response.data.invoice || {},
                    customer: response.data.customer || {},
                    vehicle: response.data.vehicle || {},
                    invoiceItems: []
                };

                // Safely extract invoice items
                if (Array.isArray(response.data.invoiceItems)) {
                    invoiceData.invoiceItems = response.data.invoiceItems;
                } else if (Array.isArray(response.data.invoice?.invoiceItems)) {
                    invoiceData.invoiceItems = response.data.invoice.invoiceItems;
                }

                console.log('[OrderDetailsScreen] Processed invoice data:', JSON.stringify(invoiceData, null, 2));
                setInvoice(invoiceData);
                console.log('[OrderDetailsScreen] Invoice data set successfully');
            } else {
                console.log('[OrderDetailsScreen] No invoice found or invalid response');
                setInvoice(null);
            }
        } catch (error: any) {
            console.error('[OrderDetailsScreen] Error checking for invoice:', error);
            console.error('[OrderDetailsScreen] Error stack:', error?.stack);
            setInvoice(null);
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

    const formatShortDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs ${amount?.toFixed(2) || '0.00'}`;
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
                return 'checkmark-circle';
            case 'pending':
                return 'time';
            case 'cancelled':
                return 'close-circle';
            case 'in progress':
            case 'inprogress':
                return 'play-circle';
            case 'paid':
                return 'card';
            case 'issued':
                return 'document-text';
            case 'overdue':
                return 'warning';
            default:
                return 'ellipse-outline';
        }
    };

    const handlePayInvoice = () => {
        if (invoice?.invoice?.invoiceId) {
            Alert.alert('Payment', 'Pay Using Your Web Page On Browser.');
        }
    };

    const handleViewInvoice = () => {
        setShowInvoiceModal(true);
    };

    const saveToGallery = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'We need permission to save the invoice to your gallery');
                return;
            }

            setSavingToGallery(true);

            const viewShot = invoiceRef.current;
            if (viewShot && typeof viewShot.capture === 'function') {
                const uri = await viewShot.capture();
                if (uri) {
                    console.log('Invoice captured, URI:', uri);
                    const asset = await MediaLibrary.createAssetAsync(uri);
                    console.log('Invoice saved to gallery, asset:', asset);
                    Alert.alert('Success', 'Invoice saved to gallery successfully');
                } else {
                    Alert.alert('Error', 'Failed to capture invoice');
                }
            } else {
                Alert.alert('Error', 'Failed to capture invoice');
            }
        } catch (error) {
            console.error('Error saving to gallery:', error);
            Alert.alert('Error', 'Failed to save invoice to gallery');
        } finally {
            setSavingToGallery(false);
        }
    };

    const shareInvoice = async () => {
        try {
            const viewShot = invoiceRef.current;
            if (viewShot && typeof viewShot.capture === 'function') {
                const uri = await viewShot.capture();
                if (uri) {
                    if (!(await Sharing.isAvailableAsync())) {
                        Alert.alert('Error', 'Sharing is not available on this device');
                        return;
                    }

                    await Sharing.shareAsync(uri, {
                        dialogTitle: `Invoice #${invoice?.invoice?.invoiceId || ''}`,
                        mimeType: 'image/png',
                        UTI: 'public.png'
                    });
                } else {
                    Alert.alert('Error', 'Failed to capture invoice for sharing');
                }
            } else {
                Alert.alert('Error', 'Failed to capture invoice for sharing');
            }
        } catch (error) {
            console.error('Error sharing invoice:', error);
            Alert.alert('Error', 'Failed to share invoice');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Order Details</Text>
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
            </View>
        );
    }

    // Invoice Modal UI
    const renderInvoiceModal = () => {
        if (!invoice || !invoice.invoice) return null;

        return (
            <Modal
                visible={showInvoiceModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInvoiceModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.invoiceModalContent}>
                        <View style={styles.invoiceModalHeader}>
                            <TouchableOpacity
                                onPress={() => setShowInvoiceModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.invoiceScrollView}>
                            <ViewShot
                                ref={invoiceRef}
                                options={{ format: 'png', quality: 0.9 }}
                                style={styles.invoiceContainer}
                            >
                                {/* Invoice Header */}
                                <View style={styles.invoiceHeader}>
                                    <View style={styles.invoiceHeaderTop}>
                                        <View style={styles.invoiceLogoContainer}>
                                            <Ionicons name="document-text" size={30} color="#3B82F6" />
                                        </View>
                                        <View style={styles.invoiceTitleContainer}>
                                            <Text style={styles.invoiceTitle}>Invoice #{invoice.invoice.invoiceId}</Text>
                                            <Text style={styles.invoiceDate}>
                                                Issued on {formatDate(invoice.invoice.invoiceDate)}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.invoiceStatusBadge,
                                            { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
                                        ]}>
                                            <Text style={[
                                                styles.invoiceStatusText,
                                                { color: getStatusColor(invoice.invoice.status) }
                                            ]}>
                                                {invoice.invoice.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Customer and Vehicle Information */}
                                <View style={styles.invoiceSection}>
                                    <View style={styles.invoiceRow}>
                                        <View style={styles.invoiceHalf}>
                                            <View style={styles.invoiceSectionHeader}>
                                                <Ionicons name="person" size={18} color="#3B82F6" />
                                                <Text style={styles.invoiceSectionTitle}>Customer Information</Text>
                                            </View>
                                            <View style={styles.invoiceInfoCard}>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>Name</Text>
                                                    <Text style={styles.invoiceInfoValue} numberOfLines={1} ellipsizeMode="tail">
                                                        {invoice.customer?.name || 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>Email</Text>
                                                    <Text style={styles.invoiceInfoValue} numberOfLines={1} ellipsizeMode="tail">
                                                        {invoice.customer?.email || 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>Phone</Text>
                                                    <Text style={styles.invoiceInfoValue}>
                                                        {invoice.customer?.phone || 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>Address</Text>
                                                    <Text style={styles.invoiceInfoValue} numberOfLines={2} ellipsizeMode="tail">
                                                        {invoice.customer?.address || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.invoiceHalf}>
                                            <View style={styles.invoiceSectionHeader}>
                                                <Ionicons name="car" size={18} color="#3B82F6" />
                                                <Text style={styles.invoiceSectionTitle}>Vehicle Information</Text>
                                            </View>
                                            <View style={styles.invoiceInfoCard}>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>Make & Model</Text>
                                                    <Text style={styles.invoiceInfoValue} numberOfLines={1} ellipsizeMode="tail">
                                                        {invoice.vehicle?.make} {invoice.vehicle?.model}
                                                    </Text>
                                                </View>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>Year</Text>
                                                    <Text style={styles.invoiceInfoValue}>
                                                        {invoice.vehicle?.year || 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={styles.invoiceInfoRow}>
                                                    <Text style={styles.invoiceInfoLabel}>License Plate</Text>
                                                    <Text style={styles.invoiceInfoValue}>
                                                        {invoice.vehicle?.licensePlate || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Service Details */}
                                <View style={styles.invoiceSection}>
                                    <View style={styles.invoiceSectionHeader}>
                                        <Ionicons name="list" size={18} color="#3B82F6" />
                                        <Text style={styles.invoiceSectionTitle}>Service Details</Text>
                                    </View>

                                    <View style={styles.invoiceTable}>
                                        <View style={styles.invoiceTableHeader}>
                                            <Text style={[styles.invoiceTableHeaderText, { flex: 2 }]}>Description</Text>
                                            <Text style={[styles.invoiceTableHeaderText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                                            <Text style={[styles.invoiceTableHeaderText, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
                                            <Text style={[styles.invoiceTableHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
                                        </View>

                                        {invoice.invoiceItems?.map((item: any, index: number) => (
                                            <View key={index} style={styles.invoiceTableRow}>
                                                <Text style={[styles.invoiceTableCell, { flex: 2 }]}>{item.description}</Text>
                                                <Text style={[styles.invoiceTableCell, { flex: 0.5, textAlign: 'center' }]}>{item.quantity || 1}</Text>
                                                <Text style={[styles.invoiceTableCell, { flex: 1, textAlign: 'right' }]}>
                                                    {formatCurrency(item.unitPrice)}
                                                </Text>
                                                <Text style={[styles.invoiceTableCell, { flex: 1, textAlign: 'right' }]}>
                                                    {formatCurrency(item.totalPrice)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Invoice Summary */}
                                <View style={styles.invoiceSummary}>
                                    <View style={styles.invoiceSummaryRow}>
                                        <Text style={styles.invoiceSummaryLabel}>Subtotal</Text>
                                        <Text style={styles.invoiceSummaryValue}>{formatCurrency(invoice.invoice.subTotal)}</Text>
                                    </View>
                                    <View style={styles.invoiceSummaryRow}>
                                        <Text style={styles.invoiceSummaryLabel}>Tax (18%)</Text>
                                        <Text style={styles.invoiceSummaryValue}>{formatCurrency(invoice.invoice.taxAmount)}</Text>
                                    </View>
                                    <View style={[styles.invoiceSummaryRow, styles.invoiceTotalRow]}>
                                        <Text style={styles.invoiceTotalLabel}>Total Amount</Text>
                                        <Text style={styles.invoiceTotalValue}>{formatCurrency(invoice.invoice.totalAmount)}</Text>
                                    </View>
                                </View>

                                {/* Payment Information */}
                                <View style={styles.invoiceSection}>
                                    <View style={styles.invoiceSectionHeader}>
                                        <Ionicons name="card" size={18} color="#3B82F6" />
                                        <Text style={styles.invoiceSectionTitle}>Payment Information</Text>
                                    </View>
                                    <View style={styles.paymentInfo}>
                                        <View style={styles.invoiceInfoRow}>
                                            <Text style={styles.invoiceInfoLabel}>Status</Text>
                                            <View style={[
                                                styles.paymentStatusBadge,
                                                { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
                                            ]}>
                                                <Text style={[
                                                    styles.paymentStatusText,
                                                    { color: getStatusColor(invoice.invoice.status) }
                                                ]}>
                                                    {invoice.invoice.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.invoiceInfoRow}>
                                            <Text style={styles.invoiceInfoLabel}>Due Date</Text>
                                            <Text style={styles.invoiceInfoValue}>{formatDate(invoice.invoice.dueDate)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Footer */}
                                <View style={styles.invoiceFooter}>
                                    <Text style={styles.invoiceFooterText}>
                                        Thank you for your business!
                                    </Text>
                                    <Text style={styles.invoiceFooterCompany}>
                                        MotoMate Auto Services
                                    </Text>
                                    <Text style={styles.invoiceFooterContact}>
                                        C43 – Shahra e Faisal, Karachi • MotoM22@gmail.com • +92-336-1800485
                                    </Text>
                                </View>
                            </ViewShot>
                        </ScrollView>

                        <View style={styles.invoiceModalActions}>
                            <TouchableOpacity
                                style={[styles.invoiceAction, styles.invoiceShareAction]}
                                onPress={shareInvoice}
                                disabled={savingToGallery}
                            >
                                <Ionicons name="share-outline" size={20} color="white" />
                                <Text style={styles.invoiceActionText}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.invoiceAction, styles.invoiceSaveAction]}
                                onPress={saveToGallery}
                                disabled={savingToGallery}
                            >
                                {savingToGallery ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="download-outline" size={20} color="white" />
                                        <Text style={styles.invoiceActionText}>Save to Gallery</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>Order #{order.orderId}</Text>
                    <Text style={styles.subtitle}>Placed on {formatDate(order.orderDate)}</Text>
                </View>
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
                        <Text style={styles.amountValue}>{formatCurrency(order.totalAmount)}</Text>
                    </View>
                </View>

                {invoice && (
                    <TouchableOpacity style={styles.invoiceQuickInfo} onPress={() => setActiveTab('invoice')}>
                        <View style={styles.invoiceQuickHeader}>
                            <Ionicons name="receipt" size={16} color="#3B82F6" />
                            <Text style={styles.invoiceQuickTitle}>Invoice #{invoice.invoice.invoiceId}</Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: getStatusColor(invoice.invoice.status), fontSize: 11 }
                                ]}>
                                    {invoice.invoice.status}
                                </Text>
                            </View>
                        </View>
                        {invoice.invoice.status !== 'paid' && (
                            <TouchableOpacity
                                style={styles.quickPayButton}
                                onPress={handlePayInvoice}
                            >
                                <Ionicons name="card" size={16} color="#FFFFFF" />
                                <Text style={styles.quickPayButtonText}>Pay Now</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'details' && styles.activeTabButton,
                        { width: (screenWidth - 48) / 3 }
                    ]}
                    onPress={() => setActiveTab('details')}
                >
                    <Ionicons
                        name="document-text"
                        size={18}
                        color={activeTab === 'details' ? '#3B82F6' : '#6B7280'}
                    />
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'details' && styles.activeTabButtonText
                    ]}>
                        Details
                    </Text>
                </TouchableOpacity>

                {order.includesInspection && order.inspection && (
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'inspection' && styles.activeTabButton,
                            { width: (screenWidth - 48) / 3 }
                        ]}
                        onPress={() => setActiveTab('inspection')}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={18}
                            color={activeTab === 'inspection' ? '#3B82F6' : '#6B7280'}
                        />
                        <Text style={[
                            styles.tabButtonText,
                            activeTab === 'inspection' && styles.activeTabButtonText
                        ]}>
                            Inspection
                        </Text>
                    </TouchableOpacity>
                )}

                {invoice && (
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'invoice' && styles.activeTabButton,
                            { width: (screenWidth - 48) / 3 }
                        ]}
                        onPress={() => setActiveTab('invoice')}
                    >
                        <Ionicons
                            name="receipt"
                            size={18}
                            color={activeTab === 'invoice' ? '#3B82F6' : '#6B7280'}
                        />
                        <Text style={[
                            styles.tabButtonText,
                            activeTab === 'invoice' && styles.activeTabButtonText
                        ]}>
                            Invoice
                        </Text>
                    </TouchableOpacity>
                )}
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
                {activeTab === 'details' && (
                    <View style={styles.tabContent}>
                        {/* Vehicle Information */}
                        {order.vehicle && (
                            <View style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="car" size={20} color="#3B82F6" />
                                    <Text style={styles.sectionTitle}>Vehicle Information</Text>
                                </View>
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
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Vehicle ID</Text>
                                            <Text style={styles.detailValue}>{order.vehicleId}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Service Information (Main Service - if not inspection) */}
                        {order.service && order.service.category?.toLowerCase() !== 'inspection' && (
                            <View style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="construct" size={20} color="#3B82F6" />
                                    <Text style={styles.sectionTitle}>Service Information</Text>
                                </View>
                                <View style={styles.sectionContent}>
                                    <View style={styles.serviceItem}>
                                        <View style={styles.serviceHeader}>
                                            <Text style={styles.serviceName}>{order.service.serviceName || 'N/A'}</Text>
                                            <Text style={styles.servicePrice}>{formatCurrency(order.service.price || 0)}</Text>
                                        </View>
                                        <Text style={styles.serviceCategory}>{order.service.category || 'N/A'}</Text>
                                        {order.service.description && (
                                            <Text style={styles.serviceDescription}>{order.service.description}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Additional Services (non-inspection) */}
                        {order.additionalServices && Array.isArray(order.additionalServices) && order.additionalServices.filter(s => s.category?.toLowerCase() !== 'inspection').length > 0 && (
                            <View style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="add-circle" size={20} color="#3B82F6" />
                                    <Text style={styles.sectionTitle}>Additional Services</Text>
                                </View>
                                <View style={styles.sectionContent}>
                                    {order.additionalServices.filter(s => s.category?.toLowerCase() !== 'inspection').map((service, index) => (
                                        <View key={index} style={[styles.serviceItem, index > 0 && styles.serviceItemBorder]}>
                                            <View style={styles.serviceHeader}>
                                                <Text style={styles.serviceName}>{service.serviceName || 'N/A'}</Text>
                                                <Text style={styles.servicePrice}>{formatCurrency(service.price || 0)}</Text>
                                            </View>
                                            <Text style={styles.serviceCategory}>{service.category || 'N/A'}</Text>
                                            {service.description && (
                                                <Text style={styles.serviceDescription}>{service.description}</Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Inspection Services */}
                        {(() => {
                            const inspectionItems: InspectionItem[] = []; // Explicitly type the array

                            // Add main inspection if it exists and is included
                            if (order?.includesInspection && order?.inspection) {
                                // Construct main inspection item explicitly
                                const mainInspectionItem: MainInspectionItem = {
                                    // Spread properties from original inspection, ensuring status is present
                                    ...order.inspection,
                                    isMainInspection: true,
                                    status: order.inspection.status || 'N/A', // Ensure status exists
                                    // Explicitly include properties needed for rendering, even if optional in original type
                                    notes: order.inspection.notes,
                                    price: order.inspection.price,
                                    serviceName: order.inspection.serviceName,
                                    subCategory: order.inspection.subCategory,
                                    engineCondition: order.inspection.engineCondition,
                                    transmissionCondition: order.inspection.transmissionCondition,
                                    brakeCondition: order.inspection.brakeCondition,
                                    electricalCondition: order.inspection.electricalCondition,
                                    tireCondition: order.inspection.tireCondition,
                                    bodyCondition: order.inspection.bodyCondition,
                                };
                                inspectionItems.push(mainInspectionItem);
                            }

                            // Add additional services that are inspections
                            if (order?.additionalServices && Array.isArray(order.additionalServices)) {
                                order.additionalServices
                                    .filter(s => s.category?.toLowerCase() === 'inspection')
                                    .forEach(s => {
                                        // Construct additional inspection item explicitly
                                        const additionalInspectionItem: AdditionalInspectionItem = {
                                            // Spread properties from original additional service
                                            ...s,
                                            isMainInspection: false,
                                            status: s.status || 'N/A', // Ensure status exists or default to N/A
                                            // Explicitly include properties needed for rendering
                                            description: s.description,
                                            subCategory: s.subCategory,
                                            price: s.price,
                                            serviceId: s.serviceId,
                                            serviceName: s.serviceName,
                                            category: s.category, // Use the original category string
                                        };
                                        inspectionItems.push(additionalInspectionItem);
                                    });
                            }

                            if (inspectionItems.length === 0) {
                                return null; // Don't render section if no inspection items
                            }

                            return (
                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                                        <Text style={styles.sectionTitle}>Inspection Services</Text>
                                    </View>
                                    <View style={styles.sectionContent}>
                                        {inspectionItems.map((item: InspectionItem, index) => (
                                            <View key={index} style={[styles.serviceItem, index > 0 && styles.serviceItemBorder]}>
                                                <View style={styles.serviceHeader}>
                                                    <Text style={styles.serviceName}>
                                                        {isMainInspectionItem(item) ? item.serviceName || 'Inspection Service' : item.serviceName || 'Inspection Service'}
                                                    </Text>
                                                    <Text style={styles.servicePrice}>{formatCurrency(isMainInspectionItem(item) ? item.price || 0 : item.price || 0)}</Text>
                                                </View>
                                                {isMainInspectionItem(item) ? (
                                                    item.subCategory && (
                                                        <Text style={styles.serviceCategory}>
                                                            {item.subCategory}
                                                        </Text>
                                                    )
                                                ) : (
                                                    item.subCategory && (
                                                        <Text style={styles.serviceCategory}>
                                                            {item.subCategory}
                                                        </Text>
                                                    )
                                                )}
                                                {isMainInspectionItem(item) ? (
                                                    <>
                                                        {item.notes && (
                                                            <Text style={styles.serviceDescription}>{item.notes}</Text>
                                                        )}
                                                    </>
                                                ) : (
                                                    item.description && (
                                                        <Text style={styles.serviceDescription}>{item.description}</Text>
                                                    )
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Order Notes */}
                        {order.notes && (
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

                        {/* Price Summary */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="calculator" size={20} color="#3B82F6" />
                                <Text style={styles.sectionTitle}>Price Summary</Text>
                            </View>
                            <View style={styles.sectionContent}>
                                <View style={styles.priceSummaryContainer}>
                                    {/* Main Service Price */}
                                    {order.service && order.service.category?.toLowerCase() !== 'inspection' && (
                                        <View style={styles.priceSummaryRow}>
                                            <Text style={styles.priceSummaryLabel}>Main Service</Text>
                                            <Text style={styles.priceSummaryValue}>{formatCurrency(order.service.price || 0)}</Text>
                                        </View>
                                    )}

                                    {/* Additional Services Price */}
                                    {order.additionalServices && Array.isArray(order.additionalServices) &&
                                        order.additionalServices.filter(s => s.category?.toLowerCase() !== 'inspection').length > 0 && (
                                            <View style={styles.priceSummaryRow}>
                                                <Text style={styles.priceSummaryLabel}>Additional Services</Text>
                                                <Text style={styles.priceSummaryValue}>
                                                    {formatCurrency(order.additionalServices
                                                        .filter(s => s.category?.toLowerCase() !== 'inspection')
                                                        .reduce((sum, service) => sum + (service.price || 0), 0))}
                                                </Text>
                                            </View>
                                        )}

                                    {/* Inspection Services Price */}
                                    {order.includesInspection && order.inspection && (
                                        <View style={styles.priceSummaryRow}>
                                            <Text style={styles.priceSummaryLabel}>Inspection Services</Text>
                                            <Text style={styles.priceSummaryValue}>
                                                {formatCurrency(
                                                    (order.inspection.price || 0) +
                                                    (order.additionalServices?.filter(s => s.category?.toLowerCase() === 'inspection')
                                                        .reduce((sum, service) => sum + (service.price || 0), 0) || 0)
                                                )}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Total */}
                                    <View style={[styles.priceSummaryRow, styles.priceSummaryTotalRow]}>
                                        <Text style={styles.priceSummaryTotalLabel}>Total (Excl. SST)</Text>
                                        <Text style={styles.priceSummaryTotalValue}>{formatCurrency(order.totalAmount)}</Text>
                                    </View>
                                    <Text style={styles.taxNote}>exclusive of 18% SST</Text>

                                    {/* After Tax Total */}
                                    <View style={[styles.priceSummaryRow, styles.afterTaxTotalRow]}>
                                        <Text style={styles.afterTaxTotalLabel}>After Tax Total (Incl. 18% SST)</Text>
                                        {/* Calculate total including 18% SST */}
                                        <Text style={styles.afterTaxTotalValue}>{formatCurrency(order.totalAmount * 1.18)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'inspection' && order.includesInspection && order.inspection && (
                    <View style={styles.tabContent}>
                        {/* Inspection Details */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                                <Text style={styles.sectionTitle}>Inspection Details</Text>
                            </View>
                            <View style={styles.sectionContent}>
                                <View style={styles.detailRows}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Scheduled Date</Text>
                                        <Text style={styles.detailValue}>{formatDate(order.inspection.scheduledDate)}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Time Slot</Text>
                                        <Text style={styles.detailValue}>{order.inspection.timeSlot}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Status</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(order.inspection.status) + '20' }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                { color: getStatusColor(order.inspection.status) }
                                            ]}>
                                                {order.inspection.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Inspection Report */}
                        {order.inspection.status === 'completed' && (
                            <View style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="clipboard" size={20} color="#3B82F6" />
                                    <Text style={styles.sectionTitle}>Inspection Report</Text>
                                </View>
                                <View style={styles.sectionContent}>
                                    <View style={styles.inspectionGrid}>
                                        {[
                                            { label: 'Engine', value: order.inspection?.engineCondition },
                                            { label: 'Transmission', value: order.inspection?.transmissionCondition },
                                            { label: 'Brakes', value: order.inspection?.brakeCondition },
                                            { label: 'Electrical', value: order.inspection?.electricalCondition },
                                            { label: 'Body', value: order.inspection?.bodyCondition },
                                            { label: 'Tires', value: order.inspection?.tireCondition },
                                        ].map((item, index) => (
                                            <View key={index} style={styles.inspectionItem}>
                                                <Text style={styles.inspectionLabel}>{item.label}</Text>
                                                <View style={[
                                                    styles.conditionBadge,
                                                    { backgroundColor: getConditionColor(item.value as any) + '20' }
                                                ]}>
                                                    <Text style={[
                                                        styles.conditionText,
                                                        { color: getConditionColor(item.value as any) }
                                                    ]}>
                                                        {item.value || 'Not Inspected'}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                    {order.inspection.notes && (
                                        <View style={styles.inspectionNotes}>
                                            <Text style={styles.inspectionNotesTitle}>Inspector Notes:</Text>
                                            <Text style={styles.inspectionNotesText}>{order.inspection.notes}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'invoice' && invoice && (
                    <View style={styles.tabContent}>
                        {/* Invoice Summary Card */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="receipt" size={20} color="#3B82F6" />
                                <Text style={styles.sectionTitle}>Invoice Summary</Text>
                            </View>
                            <View style={styles.sectionContent}>
                                <View style={styles.invoiceSummaryCard}>
                                    <View style={styles.invoiceHeaderRow}>
                                        <View>
                                            <Text style={styles.invoiceNumber}>Invoice #{invoice.invoice.invoiceId}</Text>
                                            <Text style={styles.invoiceIssueDate}>
                                                Issued: {formatShortDate(invoice.invoice.invoiceDate)}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.invoiceStatusBadge,
                                            { backgroundColor: getStatusColor(invoice.invoice.status) + '20' }
                                        ]}>
                                            <Text style={[
                                                styles.invoiceStatusText,
                                                { color: getStatusColor(invoice.invoice.status) }
                                            ]}>
                                                {invoice.invoice.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.invoiceAmountSection}>
                                        <View style={styles.amountRow}>
                                            <Text style={styles.amountLabel}>Subtotal</Text>
                                            <Text style={styles.amountValue}>{formatCurrency(invoice.invoice.subTotal)}</Text>
                                        </View>
                                        <View style={styles.amountRow}>
                                            <Text style={styles.amountLabel}>Tax (18%)</Text>
                                            <Text style={styles.amountValue}>{formatCurrency(invoice.invoice.taxAmount)}</Text>
                                        </View>
                                        <View style={[styles.amountRow, styles.totalAmountRow]}>
                                            <Text style={styles.totalLabel}>Total</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(invoice.invoice.totalAmount)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.invoiceActions}>
                                        <TouchableOpacity
                                            style={styles.viewInvoiceButton}
                                            onPress={handleViewInvoice}
                                        >
                                            <Ionicons name="eye" size={20} color="#3B82F6" />
                                            <Text style={styles.viewInvoiceText}>View Full Invoice</Text>
                                        </TouchableOpacity>

                                        {invoice.invoice.status !== 'paid' && (
                                            <TouchableOpacity
                                                style={styles.payInvoiceButton}
                                                onPress={handlePayInvoice}
                                            >
                                                <Ionicons name="card" size={20} color="#FFFFFF" />
                                                <Text style={styles.payInvoiceText}>Pay Now</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Invoice Items */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="list" size={20} color="#3B82F6" />
                                <Text style={styles.sectionTitle}>Invoice Items</Text>
                            </View>
                            <View style={styles.sectionContent}>
                                {(() => {
                                    // Debug current invoice state
                                    console.log('[OrderDetailsScreen] Current invoice state:', {
                                        hasInvoice: !!invoice,
                                        hasInvoiceItems: !!invoice?.invoiceItems,
                                        isArray: Array.isArray(invoice?.invoiceItems),
                                        length: invoice?.invoiceItems?.length
                                    });

                                    if (!invoice) {
                                        return (
                                            <View style={styles.emptyStateContainer}>
                                                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                                                <Text style={styles.emptyStateText}>Loading invoice...</Text>
                                            </View>
                                        );
                                    }

                                    if (!Array.isArray(invoice.invoiceItems) || invoice.invoiceItems.length === 0) {
                                        return (
                                            <View style={styles.emptyStateContainer}>
                                                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                                                <Text style={styles.emptyStateText}>No invoice items found</Text>
                                            </View>
                                        );
                                    }

                                    return invoice.invoiceItems.map((item: any, index: number) => (
                                        <View key={index} style={[styles.invoiceItem, index > 0 && styles.invoiceItemBorder]}>
                                            <View style={styles.invoiceItemHeader}>
                                                <Text style={styles.invoiceItemName}>{item.description || 'No description'}</Text>
                                                <Text style={styles.invoiceItemTotal}>{formatCurrency(item.totalPrice || 0)}</Text>
                                            </View>
                                            <View style={styles.invoiceItemDetails}>
                                                <Text style={styles.invoiceItemQuantity}>Qty: {item.quantity || 1}</Text>
                                                <Text style={styles.invoiceItemPrice}>Unit: {formatCurrency(item.unitPrice || 0)}</Text>
                                            </View>
                                        </View>
                                    ));
                                })()}
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Render Invoice Modal */}
            {renderInvoiceModal()}
        </View>
    );
};

// Helper function for condition colors
const getConditionColor = (condition: string): string => {
    switch (condition?.toLowerCase()) {
        case 'excellent':
        case 'good':
            return '#10B981';
        case 'fair':
        case 'average':
            return '#F59E0B';
        case 'poor':
        case 'bad':
            return '#EF4444';
        default:
            return '#6B7280';
    }
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
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
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
        fontWeight: '600',
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 24,
        marginTop: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    amountInfo: {
        alignItems: 'flex-end',
    },
    amountLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    invoiceQuickInfo: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    invoiceQuickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    invoiceQuickTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
        flex: 1,
    },
    quickPayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    quickPayButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 24,
        marginTop: 16,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: '#EBF4FF',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6,
    },
    activeTabButtonText: {
        color: '#3B82F6',
    },
    scrollView: {
        flex: 1,
        paddingTop: 16,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    tabContent: {
        paddingHorizontal: 24,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 12,
    },
    sectionContent: {
        padding: 20,
    },
    vehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    vehicleIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#EBF4FF',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    vehicleBadges: {
        flexDirection: 'row',
    },
    badge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    detailRows: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    serviceItem: {
        marginBottom: 16,
    },
    serviceItemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 12,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    serviceCategory: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    serviceDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    notesText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 20,
    },
    inspectionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    inspectionItem: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    inspectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    conditionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    inspectionNotes: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inspectionNotesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inspectionNotesText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    invoiceSummaryCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    invoiceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    invoiceNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    invoiceIssueDate: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    invoiceStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    invoiceStatusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    invoiceAmountSection: {
        marginBottom: 20,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    totalAmountRow: {
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        paddingTop: 12,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    invoiceActions: {
        flexDirection: 'row',
        gap: 12,
    },
    viewInvoiceButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    viewInvoiceText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    payInvoiceButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 8,
    },
    payInvoiceText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    invoiceItem: {
        paddingVertical: 12,
    },
    invoiceItemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    invoiceItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    invoiceItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginRight: 12,
    },
    invoiceItemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    invoiceItemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    invoiceItemQuantity: {
        fontSize: 14,
        color: '#6B7280',
    },
    invoiceItemPrice: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Invoice Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    invoiceModalContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginTop: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    invoiceModalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    invoiceScrollView: {
        flex: 1,
    },
    invoiceContainer: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    invoiceHeader: {
        backgroundColor: '#F8FAFC',
        padding: 24,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E2E8F0',
    },
    invoiceHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    invoiceLogoContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#EBF4FF',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    invoiceTitleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    invoiceDate: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    invoiceSection: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    invoiceInfoRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    invoiceHalfInfoBox: {
        flex: 1,
    },
    invoiceInfoBoxContent: {
        backgroundColor: '#FAFBFC',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    invoiceInfoCard: {
        backgroundColor: '#FAFBFC',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 140, // Ensure consistent height
    },
    invoiceInfoRow: {
        flexDirection: 'column',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    invoiceInfoLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    invoiceInfoValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
        lineHeight: 18,
    },
    invoiceHalf: {
        flex: 1,
        paddingHorizontal: 8,
    },
    invoiceRow: {
        flexDirection: 'row',
        marginHorizontal: -8,
    },
    invoiceTable: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
    },
    invoiceTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    invoiceTableHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    },
    invoiceTableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    invoiceTableCell: {
        fontSize: 14,
        color: '#1F2937',
    },
    invoiceSummary: {
        padding: 24,
        backgroundColor: '#F8FAFC',
    },
    invoiceSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    invoiceSummaryLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 8,
    },
    invoiceSummaryValue: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600',
        flexShrink: 0,
    },
    invoiceTotalRow: {
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        paddingTop: 12,
        marginTop: 8,
    },
    invoiceTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    invoiceTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    paymentInfo: {
        backgroundColor: '#FAFBFC',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    paymentStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    paymentStatusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    invoiceFooter: {
        padding: 24,
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
    },
    invoiceFooterText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    invoiceFooterCompany: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 4,
    },
    invoiceFooterContact: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    invoiceModalActions: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    invoiceAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    invoiceShareAction: {
        backgroundColor: '#6B7280',
    },
    invoiceSaveAction: {
        backgroundColor: '#10B981',
    },
    invoiceActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    invoiceSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    invoiceSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    serviceBadges: {
        flexDirection: 'row',
        marginTop: 8,
    },
    inspectionStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    inspectionStatusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    priceSummaryContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    priceSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    priceSummaryLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 8,
    },
    priceSummaryValue: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600',
        flexShrink: 0,
    },
    priceSummaryTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 12,
        paddingTop: 12,
    },
    priceSummaryTotalLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        flexShrink: 1,
        marginRight: 8,
    },
    priceSummaryTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flexShrink: 0,
    },
    taxNote: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right',
        marginTop: 4,
        fontStyle: 'italic',
    },
    afterTaxTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 12,
        paddingTop: 12,
    },
    afterTaxTotalLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        flexShrink: 1,
        marginRight: 8,
    },
    afterTaxTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flexShrink: 0,
    },
});

export default OrderDetailsScreen;