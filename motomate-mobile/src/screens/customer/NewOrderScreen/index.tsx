import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/AuthContext';
import { apiService } from 'services/apiService';
import DateTimePicker from '@react-native-community/datetimepicker';



// Interfaces
interface Vehicle {
  vehicleId: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Service {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description?: string;
  subCategory?: string;
}

interface SelectedSubcategory {
  serviceId: number;
  serviceName: string;
  price: number;
  description?: string;
}

interface TimeSlotInfo {
  timeSlot: string;
  availableSlots: number;
  totalSlots: number;
}

const NewOrderScreen = () => {
  const { user } = useAuth();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inspectionServices, setInspectionServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotInfo[]>([]);
  
  // Form selections
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<SelectedSubcategory[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [includeService, setIncludeService] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [additionalServices, setAdditionalServices] = useState<Service[]>([]);
  const [notes, setNotes] = useState('');
  
  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'online' | null>(null);

  // Progress calculation
  const getProgress = () => {
    let progress = 0;
    if (selectedVehicle) progress += 20;
    if (selectedSubcategories.length > 0) progress += 20;
    if (selectedDate && selectedTimeSlot) progress += 20;
    if (includeService ? selectedService : true) progress += 20;
    if (notes || !includeService) progress += 20;
    return progress;
  };

  // Step titles
  const stepTitles = [
    'Select Vehicle',
    'Choose Inspections',
    'Schedule Appointment',
    'Additional Services',
    'Review & Submit'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      
      const [vehiclesResponse, servicesResponse] = await Promise.all([
        apiService.getVehicles(),
        apiService.getServices()
      ]);

      if (vehiclesResponse.success) {
        setVehicles(vehiclesResponse.data || []);
      } else {
        Alert.alert('Error', vehiclesResponse.message || 'Failed to fetch vehicles');
      }

      if (servicesResponse.success) {
        const allServices = servicesResponse.data || [];
        
        // Separate inspection services from regular services
        const inspections = allServices.filter((service: Service) => 
          service.category.toLowerCase() === 'inspection'
        );
        const regularServices = allServices.filter((service: Service) => 
          service.category.toLowerCase() !== 'inspection'
        );
        
        setInspectionServices(inspections);
        setServices(regularServices);
      } else {
        Alert.alert('Error', servicesResponse.message || 'Failed to fetch services');
      }

      // Load time slots for today
      await fetchTimeSlots(new Date());
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchTimeSlots = async (date: Date) => {
    try {
      console.log('[NewOrderScreen] Fetching time slots for date:', date);
       // Format date to YYYY-MM-DD for the backend
       const formattedDate = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
       
       const response = await apiService.getTimeSlotsInfo(formattedDate);
       
       console.log('[NewOrderScreen] Time slots API response:', response);
       
       if (response.success && response.timeSlotInfos) {
         setTimeSlots(response.timeSlotInfos);
       } else {
         console.error('[NewOrderScreen] Failed to fetch time slots:', response.message);
         setTimeSlots([]); // Clear time slots on error or no data
         Alert.alert('Error', response.message || 'Failed to load time slots');
       }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTimeSlots([]); // Clear time slots on error
      Alert.alert('Error', 'Failed to fetch time slots');
    }
  };

  const toggleSubcategorySelection = (service: Service) => {
    const isSelected = selectedSubcategories.some(
      item => item.serviceId === service.serviceId
    );

    if (isSelected) {
      setSelectedSubcategories(
        selectedSubcategories.filter(item => item.serviceId !== service.serviceId)
      );
    } else {
      setSelectedSubcategories([
        ...selectedSubcategories,
        {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          price: service.price,
          description: service.description
        }
      ]);
    }
  };

  const handleAddAdditionalService = (service: Service) => {
    if (additionalServices.find(s => s.serviceId === service.serviceId)) {
      Alert.alert('Error', 'Service already added');
      return;
    }
    
    if (selectedService && selectedService.serviceId === service.serviceId) {
      Alert.alert('Error', 'This service is already selected as your main service');
      return;
    }
    
    setAdditionalServices([...additionalServices, service]);
    setShowServiceModal(false);
  };

  const removeAdditionalService = (serviceId: number) => {
    setAdditionalServices(additionalServices.filter(s => s.serviceId !== serviceId));
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Add inspection costs
    total += selectedSubcategories.reduce((sum, sub) => sum + sub.price, 0);
    
    // Add main service cost
    if (includeService && selectedService) {
      total += selectedService.price;
    }
    
    // Add additional services cost
    total += additionalServices.reduce((sum, service) => sum + service.price, 0);
    
    return total;
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return selectedVehicle !== null;
      case 1:
        return selectedSubcategories.length > 0;
      case 2:
        return selectedDate && selectedTimeSlot;
      case 3:
        return includeService ? selectedService !== null : true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        // Show payment modal on final step
        setShowPaymentModal(true);
      }
    } else {
      Alert.alert('Error', 'Please complete all required fields');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitOrder = async (paymentMethod: 'cash' | 'online') => {
    if (selectedSubcategories.length === 0) {
      Alert.alert('Error', 'Please select at least one inspection');
      return;
    }
  
    setLoading(true);
    setShowPaymentModal(false);
  
    try {
      // Create a single order with all selected subcategories
      const orderData = {
        vehicleId: selectedVehicle!.vehicleId,
        inspectionTypeId: selectedSubcategories[0].serviceId, // Primary inspection
        serviceId: includeService && selectedService ? selectedService.serviceId : null,
        inspectionDate: formatBackendDate(selectedDate),
        timeSlot: selectedTimeSlot,
        notes: notes || '',
        paymentMethod: paymentMethod,
        orderType: paymentMethod === 'online' ? 'Online' : 'Cash',
        totalAmount: calculateTotal(),
        includesInspection: true,
        subCategory: selectedSubcategories[0].serviceName, // Primary subcategory
        // Include all selected subcategories as additional services
        additionalServiceIds: [
          ...selectedSubcategories.slice(1).map(sub => sub.serviceId),
          ...additionalServices.map(service => service.serviceId)
        ]
      };
  
      console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        Alert.alert('Success', 'Your order has been placed successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              resetForm();
            }
          }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setSelectedVehicle(null);
    setSelectedSubcategories([]);
    setSelectedDate(new Date());
    setSelectedTimeSlot('');
    setIncludeService(false);
    setSelectedService(null);
    setAdditionalServices([]);
    setNotes('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // New helper function to format date for backend
  const formatBackendDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    // Format: YYYY-MM-DDTHH:mm:ss
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const renderServiceModalContent = () => (
    <ScrollView style={styles.modalBody}>
      <Text style={styles.modalSubtitle}>Select Main Service</Text>
      {services.map((service) => (
        <TouchableOpacity
          key={service.serviceId}
          style={[
            styles.serviceModalCard,
            selectedService?.serviceId === service.serviceId && styles.selectedServiceCard
          ]}
          onPress={() => {
            setSelectedService(service);
            setShowServiceModal(false);
          }}
        >
          <View style={styles.serviceModalInfo}>
            <Text style={styles.serviceModalName}>{service.serviceName}</Text>
            {service.description && (
              <Text style={styles.serviceModalDescription}>{service.description}</Text>
            )}
          </View>
          <Text style={styles.serviceModalPrice}>PKR {service.price}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.modalSubtitle, { marginTop: 20 }]}>Add Additional Services</Text>
      {services.map((service) => (
        <TouchableOpacity
          key={service.serviceId}
          style={[
            styles.serviceModalCard,
            additionalServices.find(s => s.serviceId === service.serviceId) && styles.selectedServiceCard
          ]}
          onPress={() => handleAddAdditionalService(service)}
        >
          <View style={styles.serviceModalInfo}>
            <Text style={styles.serviceModalName}>{service.serviceName}</Text>
            {service.description && (
              <Text style={styles.serviceModalDescription}>{service.description}</Text>
            )}
          </View>
          <Text style={styles.serviceModalPrice}>PKR {service.price}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const ServiceSelectionModal = () => (
    <Modal
      visible={showServiceModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowServiceModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Services</Text>
            <TouchableOpacity onPress={() => setShowServiceModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {renderServiceModalContent()}
        </View>
      </View>
    </Modal>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading order form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>New Service Order</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {stepTitles.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
          </View>
        </View>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{stepTitles[currentStep]}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 0: Vehicle Selection */}
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Select Your Vehicle</Text>
            <Text style={styles.sectionDescription}>
              Choose the vehicle that needs service
            </Text>
            
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.vehicleId}
                style={[
                  styles.optionCard,
                  selectedVehicle?.vehicleId === vehicle.vehicleId && styles.selectedOption
                ]}
                onPress={() => setSelectedVehicle(vehicle)}
              >
                <Ionicons name="car" size={24} color="#3B82F6" />
                <View style={styles.optionDetails}>
                  <Text style={styles.optionTitle}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.optionSubtitle}>Plate: {vehicle.licensePlate}</Text>
                </View>
                {selectedVehicle?.vehicleId === vehicle.vehicleId && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 1: Inspection Selection */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Choose Inspection Types</Text>
            <Text style={styles.sectionDescription}>
              Select the inspection services you need
            </Text>
            
            {inspectionServices.map((service) => {
              const isSelected = selectedSubcategories.some(
                item => item.serviceId === service.serviceId
              );
              
              return (
                <TouchableOpacity
                  key={service.serviceId}
                  style={[
                    styles.inspectionCard,
                    isSelected && styles.selectedInspection
                  ]}
                  onPress={() => toggleSubcategorySelection(service)}
                >
                  <View style={styles.inspectionHeader}>
                    <View style={styles.inspectionInfo}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkedBox
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <View style={styles.inspectionDetails}>
                        <Text style={styles.inspectionTitle}>{service.serviceName}</Text>
                        {service.description && (
                          <Text style={styles.inspectionDescription}>{service.description}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.priceBadge, isSelected && styles.selectedPriceBadge]}>
                      <Text style={[styles.priceText, isSelected && styles.selectedPriceText]}>
                        PKR {service.price}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Selected Inspections Summary */}
            {selectedSubcategories.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Selected Inspections</Text>
                {selectedSubcategories.map((sub) => (
                  <View key={sub.serviceId} style={styles.summaryItem}>
                    <Text style={styles.summaryItemText}>{sub.serviceName}</Text>
                    <Text style={styles.summaryItemPrice}>PKR {sub.price}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Step 2: Schedule Appointment */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Schedule Your Appointment</Text>
            <Text style={styles.sectionDescription}>
              Choose a convenient date and time
            </Text>

            {/* Date Selection */}
            <TouchableOpacity
              style={styles.dateTimeCard}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={24} color="#3B82F6" />
              <View style={styles.dateTimeInfo}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDate(selectedDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Time Slot Selection */}
            <TouchableOpacity
              style={styles.dateTimeCard}
              onPress={() => setShowTimeSlotModal(true)}
            >
              <Ionicons name="time" size={24} color="#3B82F6" />
              <View style={styles.dateTimeInfo}>
                <Text style={styles.dateTimeLabel}>Time Slot</Text>
                <Text style={styles.dateTimeValue}>
                  {selectedTimeSlot || 'Select a time slot'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Additional Services */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Additional Services</Text>
            <Text style={styles.sectionDescription}>
              Add a service now or wait for inspection results
            </Text>

            {/* Include Service Toggle */}
            <TouchableOpacity
              style={styles.toggleCard}
              onPress={() => setIncludeService(!includeService)}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Add a service to your order</Text>
                <Text style={styles.toggleDescription}>
                  You can add a service now or wait for inspection results
                </Text>
              </View>
              <View style={[styles.toggle, includeService && styles.toggleActive]}>
                {includeService && <View style={styles.toggleDot} />}
              </View>
            </TouchableOpacity>

            {/* Service Selection */}
            {includeService && (
              <>
                <TouchableOpacity
                  style={styles.serviceSelectCard}
                  onPress={() => setShowServiceModal(true)}
                >
                  <Ionicons name="construct" size={24} color="#3B82F6" />
                  <View style={styles.serviceSelectInfo}>
                    <Text style={styles.serviceSelectLabel}>Primary Service</Text>
                    <Text style={styles.serviceSelectValue}>
                      {selectedService ? selectedService.serviceName : 'Select a service'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Additional Services */}
                {additionalServices.length > 0 && (
                  <View style={styles.additionalServicesCard}>
                    <Text style={styles.additionalServicesTitle}>Additional Services</Text>
                    {additionalServices.map((service) => (
                      <View key={service.serviceId} style={styles.additionalServiceItem}>
                        <Text style={styles.additionalServiceName}>{service.serviceName}</Text>
                        <View style={styles.additionalServiceActions}>
                          <Text style={styles.additionalServicePrice}>PKR {service.price}</Text>
                          <TouchableOpacity
                            onPress={() => removeAdditionalService(service.serviceId)}
                          >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Additional Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any specific concerns or requests?"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Text style={styles.sectionDescription}>
              Review your order before submitting
            </Text>

            {/* Vehicle Summary */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>Vehicle</Text>
              <Text style={styles.reviewCardValue}>
                {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
              </Text>
            </View>

            {/* Inspections Summary */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>Inspections</Text>
              {selectedSubcategories.map((sub) => (
                <View key={sub.serviceId} style={styles.reviewItem}>
                  <Text style={styles.reviewItemName}>{sub.serviceName}</Text>
                  <Text style={styles.reviewItemPrice}>PKR {sub.price}</Text>
                </View>
              ))}
            </View>

            {/* Appointment Summary */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>Appointment</Text>
              <Text style={styles.reviewCardValue}>{formatDate(selectedDate)}</Text>
              <Text style={styles.reviewCardValue}>{selectedTimeSlot}</Text>
            </View>

            {/* Services Summary */}
            {(selectedService || additionalServices.length > 0) && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewCardTitle}>Services</Text>
                {selectedService && (
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewItemName}>{selectedService.serviceName}</Text>
                    <Text style={styles.reviewItemPrice}>PKR {selectedService.price}</Text>
                  </View>
                )}
                {additionalServices.map((service) => (
                  <View key={service.serviceId} style={styles.reviewItem}>
                    <Text style={styles.reviewItemName}>{service.serviceName}</Text>
                    <Text style={styles.reviewItemPrice}>PKR {service.price}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>PKR {calculateTotal()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !validateCurrentStep() && styles.nextButtonDisabled,
            currentStep === 0 && styles.nextButtonFull
          ]}
          onPress={handleNext}
          disabled={!validateCurrentStep()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 4 ? 'Place Order' : 'Continue'}
          </Text>
          {currentStep < 4 && <Ionicons name="arrow-forward" size={20} color="white" />}
        </TouchableOpacity>
      </View>

      {/* Time Slot Modal */}
      <Modal
        visible={showTimeSlotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time Slot</Text>
              <TouchableOpacity onPress={() => setShowTimeSlotModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.timeSlot}
                  style={[
                    styles.timeSlotCard,
                    slot.availableSlots === 0 && styles.timeSlotDisabled
                  ]}
                  onPress={() => {
                    if (slot.availableSlots > 0) {
                      setSelectedTimeSlot(slot.timeSlot);
                      setShowTimeSlotModal(false);
                    }
                  }}
                  disabled={slot.availableSlots === 0}
                >
                  <Text style={[
                    styles.timeSlotText,
                    slot.availableSlots === 0 && styles.timeSlotTextDisabled
                  ]}>
                    {slot.timeSlot}
                  </Text>
                  <View style={[
                    styles.availabilityBadge,
                    { backgroundColor: slot.availableSlots === 0 ? '#EF4444' : 
                                      slot.availableSlots === 1 ? '#F59E0B' : '#10B981' }
                  ]}>
                    <Text style={styles.availabilityText}>
                      {slot.availableSlots}/{slot.totalSlots}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Selection Modal */}
      <ServiceSelectionModal />

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'cash' && styles.selectedPaymentOption
                ]}
                onPress={() => setSelectedPaymentMethod('cash')}
              >
                <Ionicons name="wallet" size={24} color="#3B82F6" />
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionTitle}>Cash Payment</Text>
                  <Text style={styles.paymentOptionDescription}>Pay at the workshop</Text>
                </View>
                {selectedPaymentMethod === 'cash' && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'online' && styles.selectedPaymentOption
                ]}
                onPress={() => setSelectedPaymentMethod('online')}
              >
                <Ionicons name="card" size={24} color="#3B82F6" />
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionTitle}>Online Payment</Text>
                  <Text style={styles.paymentOptionDescription}>Pay now with card</Text>
                </View>
                {selectedPaymentMethod === 'online' && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmPaymentButton,
                !selectedPaymentMethod && styles.confirmPaymentButtonDisabled,
                loading && styles.confirmPaymentButtonDisabled
              ]}
              onPress={() => selectedPaymentMethod && handleSubmitOrder(selectedPaymentMethod)}
              disabled={!selectedPaymentMethod || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.confirmPaymentButtonText}>Confirm Order</Text>
                  <Ionicons name="checkmark" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              fetchTimeSlots(date);
              setSelectedTimeSlot('');
            }
          }}
          minimumDate={new Date()}
        />
      )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
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
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 12,
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionDetails: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  inspectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectedInspection: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  inspectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  inspectionDetails: {
    flex: 1,
  },
  inspectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inspectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedPriceBadge: {
    backgroundColor: '#3B82F6',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedPriceText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryItemText: {
    fontSize: 14,
    color: '#374151',
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 12,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
    alignItems: 'flex-end',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  serviceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    gap: 12,
  },
  serviceSelectInfo: {
    flex: 1,
  },
  serviceSelectLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceSelectValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 2,
  },
  additionalServicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  additionalServicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  additionalServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  additionalServiceName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  additionalServiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  additionalServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  reviewCardValue: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reviewItemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  reviewItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  totalCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  timeSlotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotDisabled: {
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  serviceModalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceModalInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceModalName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  serviceModalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceModalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  paymentOptions: {
    padding: 20,
    gap: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  selectedPaymentOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmPaymentButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmPaymentButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedServiceCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
});

export default NewOrderScreen;