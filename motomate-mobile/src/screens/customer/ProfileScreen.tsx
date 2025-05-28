import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { apiService } from 'services/apiService';
import { useAuth } from 'context/AuthContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<any, 'Profile'>;

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  imgUrl?: string;
  role: string;
  createdAt?: string;
}

interface TabButtonProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.activeTab]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons 
      name={icon} 
      size={18} 
      color={isActive ? '#3B82F6' : '#6B7280'} 
    />
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { logout } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const result = await apiService.getCurrentUser();
      
      if (result.success) {
        setUser(result.data);
        setProfileData({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          address: result.data.address || '',
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to load profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfileForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (profileData.phone && !/^\+?[\d\s\-\(\)]+$/.test(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await apiService.updateProfile(profileData);
      
      if (result.success) {
        setUser(result.data);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword:passwordData.confirmPassword
      });
      
      if (result.success) {
        Alert.alert('Success', 'Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const requestImagePickerPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to change your profile picture.');
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadProfileImage(result.assets[0].uri);
    }
    setShowImagePicker(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera permissions to take your profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadProfileImage(result.assets[0].uri);
    }
    setShowImagePicker(false);
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsSaving(true);
      const result = await apiService.updateProfile({
        imgUrl: imageUri
      });
      
      if (result.success) {
        setUser(prev => prev ? { ...prev, imgUrl: imageUri } : null);
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to upload image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.navigate('Login');
          }
        },
      ]
    );
  };

  const updateProfileData = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updatePasswordData = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Ionicons name="person-circle" size={24} color="#3B82F6" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <Text style={styles.cardSubtitle}>View and update your personal details</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          {/* Profile Picture Section */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() => setShowImagePicker(true)}
              activeOpacity={0.7}
            >
              {user?.imgUrl ? (
                <Image source={{ uri: user.imgUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageInitials}>
                    {user?.name ? getInitials(user.name) : '?'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconOverlay}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageText}>Tap to change photo</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                value={profileData.name}
                onChangeText={(value) => updateProfileData('name', value)}
                autoCapitalize="words"
              />
            </View>
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={profileData.email}
                onChangeText={(value) => updateProfileData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={[styles.inputWrapper, errors.phone ? styles.inputError : null]}>
              <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                value={profileData.phone}
                onChangeText={(value) => updateProfileData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { minHeight: 60 }]}
                placeholder="Enter your address"
                value={profileData.address}
                onChangeText={(value) => updateProfileData('address', value)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleUpdateProfile}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Update Profile</Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSecurityTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Account Security</Text>
              <Text style={styles.cardSubtitle}>Manage your password and security settings</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={[styles.inputWrapper, errors.currentPassword ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChangeText={(value) => updatePasswordData('currentPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={[styles.inputWrapper, errors.newPassword ? styles.inputError : null]}>
              <Ionicons name="key-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChangeText={(value) => updatePasswordData('newPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChangeText={(value) => updatePasswordData('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Change Password</Text>
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Security Tips */}
          <View style={styles.securityTips}>
            <Text style={styles.securityTipsTitle}>Security Tips</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Use strong passwords with mixed characters</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Update your password regularly</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Don't reuse passwords across services</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1E40AF']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name="person" size={40} color="white" />
          <Text style={styles.headerTitle}>My Account</Text>
          <Text style={styles.headerSubtitle}>Manage your profile and settings</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Profile Details"
          icon="person-outline"
          isActive={activeTab === 'profile'}
          onPress={() => setActiveTab('profile')}
        />
        <TabButton
          title="Security"
          icon="key-outline"
          isActive={activeTab === 'security'}
          onPress={() => setActiveTab('security')}
        />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'profile' ? renderProfileTab() : renderSecurityTab()}
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color="#3B82F6" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={pickImageFromGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={24} color="#3B82F6" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowImagePicker(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
    },
    header: {
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 20,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      top: 60,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      alignItems: 'center',
      marginTop: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 15,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#F9FAFB',
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 12,
      padding: 4,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    activeTab: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6B7280',
    },
    activeTabText: {
      color: '#3B82F6',
      fontWeight: '600',
    },
    scrollContainer: {
      flex: 1,
    },
    tabContent: {
      padding: 20,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    cardHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    cardSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 2,
    },
    cardContent: {
      padding: 20,
      gap: 20,
    },
    profileImageSection: {
      alignItems: 'center',
      marginBottom: 10,
    },
    profileImageContainer: {
      position: 'relative',
      marginBottom: 8,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: '#3B82F6',
    },
    profileImagePlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: '#3B82F6',
    },
    profileImageInitials: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#6B7280',
    },
    cameraIconOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'white',
    },
    profileImageText: {
      fontSize: 14,
      color: '#6B7280',
    },
    inputContainer: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 12,
      paddingHorizontal: 16,
      minHeight: 52,
    },
    inputError: {
      borderColor: '#EF4444',
      backgroundColor: '#FEF2F2',
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: '#111827',
    },
    errorText: {
      fontSize: 14,
      color: '#EF4444',
      marginTop: 4,
    },
    saveButton: {
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 10,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    securityTips: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    securityTipsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 12,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    tipText: {
      fontSize: 14,
      color: '#6B7280',
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 20,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      gap: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    modalOptionText: {
      fontSize: 16,
      color: '#374151',
      flex: 1,
    },
    modalCancel: {
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
    },
  });