import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';

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

interface NewVehicleData {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
}

const VehiclesScreen = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<NewVehicleData>({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await apiService.getVehicles();
      
      console.log('Vehicles API Response:', response);
      
      if (response.success) {
        const vehiclesData = Array.isArray(response.data) ? response.data : [];
        console.log('Vehicles data:', vehiclesData);
        setVehicles(vehiclesData);
      } else {
        console.error('Failed to fetch vehicles:', response.message);
        Alert.alert('Error', response.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'An unexpected error occurred while fetching vehicles');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!newVehicle.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!newVehicle.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!newVehicle.year.trim()) {
      newErrors.year = 'Year is required';
    } else {
      const year = parseInt(newVehicle.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
      }
    }

    if (!newVehicle.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    } else if (newVehicle.licensePlate.length < 2) {
      newErrors.licensePlate = 'License plate is too short';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = async () => {
    if (!validateForm()) {
      return;
    }

    setAddingVehicle(true);
    try {
      const vehicleData = {
        make: newVehicle.make.trim(),
        model: newVehicle.model.trim(),
        year: parseInt(newVehicle.year),
        licensePlate: newVehicle.licensePlate.trim().toUpperCase(),
      };

      console.log('Adding vehicle:', vehicleData);

      const response = await apiService.addVehicle(vehicleData);
      
      if (response.success) {
        // Refresh the vehicles list
        await fetchVehicles();
        setShowAddModal(false);
        setNewVehicle({ make: '', model: '', year: '', licensePlate: '' });
        setErrors({});
        Alert.alert('Success', 'Vehicle added successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to add vehicle');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Error', 'Failed to add vehicle. Please try again.');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number, vehicleName: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiService.deleteVehicle(vehicleId);
              
              if (response.success) {
                // Remove vehicle from local state
                setVehicles(vehicles.filter(v => v.vehicleId !== vehicleId));
                Alert.alert('Success', 'Vehicle deleted successfully!');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete vehicle');
              }
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const updateFormData = (field: keyof NewVehicleData, value: string) => {
    setNewVehicle(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getVehicleName = (vehicle: Vehicle): string => {
    return `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
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

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Ionicons name="car" size={24} color="#3B82F6" />
          <View>
            <Text style={styles.vehicleName}>{getVehicleName(item)}</Text>
            <Text style={styles.vehiclePlate}>Plate: {item.licensePlate}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteVehicle(item.vehicleId, getVehicleName(item))}
        >
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.vehicleDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Make</Text>
          <Text style={styles.detailValue}>{item.make}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Model</Text>
          <Text style={styles.detailValue}>{item.model}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Year</Text>
          <Text style={styles.detailValue}>{item.year}</Text>
        </View>
      </View>

      {item.createdAt && (
        <View style={styles.vehicleFooter}>
          <Text style={styles.createdDate}>Added: {formatDate(item.createdAt)}</Text>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Vehicles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.vehicleId?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No vehicles found</Text>
            <Text style={styles.emptySubtext}>Add your first vehicle to get started</Text>
            <TouchableOpacity 
              style={styles.addFirstVehicleButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addFirstVehicleButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Vehicle Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vehicle</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewVehicle({ make: '', model: '', year: '', licensePlate: '' });
                  setErrors({});
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {/* Make Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Make *</Text>
                <TextInput
                  style={[styles.input, errors.make && styles.inputError]}
                  placeholder="e.g., Toyota, Honda, BMW"
                  value={newVehicle.make}
                  onChangeText={(text) => updateFormData('make', text)}
                  autoCapitalize="words"
                />
                {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
              </View>

              {/* Model Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Model *</Text>
                <TextInput
                  style={[styles.input, errors.model && styles.inputError]}
                  placeholder="e.g., Camry, Civic, X5"
                  value={newVehicle.model}
                  onChangeText={(text) => updateFormData('model', text)}
                  autoCapitalize="words"
                />
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
              </View>

              {/* Year Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Year *</Text>
                <TextInput
                  style={[styles.input, errors.year && styles.inputError]}
                  placeholder="e.g., 2020"
                  value={newVehicle.year}
                  onChangeText={(text) => updateFormData('year', text)}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
              </View>

              {/* License Plate Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>License Plate *</Text>
                <TextInput
                  style={[styles.input, errors.licensePlate && styles.inputError]}
                  placeholder="e.g., ABC-123, XYZ789"
                  value={newVehicle.licensePlate}
                  onChangeText={(text) => updateFormData('licensePlate', text)}
                  autoCapitalize="characters"
                />
                {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, addingVehicle && styles.submitButtonDisabled]}
                onPress={handleAddVehicle}
                disabled={addingVehicle}
              >
                {addingVehicle ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Vehicle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    
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
  addButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
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
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  detailItem: {
    flex: 1,
    minWidth: 80,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  vehicleFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
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
  addFirstVehicleButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstVehicleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    margin: 16,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
  },
});

export default VehiclesScreen;