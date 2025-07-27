import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  ActionSheetIOS,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/AuthContext';
import { apiService } from 'services/apiService';
import { cloudinaryService } from 'services/cloudinaryService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
  });
  const [errors, setErrors] = useState({
    phone: '',
  });

  useEffect(() => {
    loadProfilePicture();
  }, []);

  const loadProfilePicture = async () => {
    try {
      // First try to get from AsyncStorage
      const savedUrl = await AsyncStorage.getItem('profilePictureUrl');
      if (savedUrl) {
        console.log('[ProfileScreen] Loaded profile picture from storage:', savedUrl);
        setProfilePicture(savedUrl);
      } else if (user?.imgUrl) {
        // If not in storage, use the one from user data
        console.log('[ProfileScreen] Using profile picture from user data:', user.imgUrl);
        setProfilePicture(user.imgUrl);
        // Save to AsyncStorage for future use
        await AsyncStorage.setItem('profilePictureUrl', user.imgUrl);
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading profile picture:', error);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleUploadProfilePicture('camera');
          } else if (buttonIndex === 2) {
            await handleUploadProfilePicture('library');
          }
        }
      );
    } else {
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => handleUploadProfilePicture('camera') },
          { text: 'Choose from Library', onPress: () => handleUploadProfilePicture('library') }
        ]
      );
    }
  };

  const handleUploadProfilePicture = async (source: 'camera' | 'library') => {
    try {
      console.log('[ProfileScreen] Starting image upload process with source:', source);
      setUploading(true);
      
      if (!user) {
        console.error('[ProfileScreen] No user data available');
        Alert.alert('Error', 'User data not available. Please try logging in again.');
        return;
      }

      console.log('[ProfileScreen] User data available, proceeding with image upload');
      const result = await cloudinaryService.uploadProfilePicture(source);
      console.log('[ProfileScreen] Cloudinary upload result:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.error('[ProfileScreen] No result from cloudinaryService');
        Alert.alert('Error', 'Failed to upload image');
        return;
      }
      
      if (result.success && result.url) {
        console.log('[ProfileScreen] Image uploaded successfully to Cloudinary, URL:', result.url);
        
        // Only send the imgUrl in the update data
        const updateData = {
          imgUrl: result.url
        };
        console.log('[ProfileScreen] Sending update to backend with data:', JSON.stringify(updateData, null, 2));

        const updateResult = await apiService.updateProfile(updateData);
        console.log('[ProfileScreen] Backend update result:', JSON.stringify(updateResult, null, 2));

        if (updateResult.success) {
          console.log('[ProfileScreen] Backend update successful, updating local state');
          // Update local state and storage
          setProfilePicture(result.url);
          try {
            await AsyncStorage.setItem('profilePictureUrl', result.url);
            console.log('[ProfileScreen] Successfully saved new image URL to storage');
            Alert.alert('Success', 'Profile picture updated successfully');
          } catch (storageError) {
            console.error('[ProfileScreen] Error saving to AsyncStorage:', storageError);
          }
        } else {
          console.error('[ProfileScreen] Backend update failed:', updateResult.message);
          Alert.alert('Error', updateResult.message || 'Failed to update profile picture');
        }
      } else {
        console.error('[ProfileScreen] Cloudinary upload failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('[ProfileScreen] Error in handleUploadProfilePicture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profileImage}
              onError={(e) => {
                console.error('[ProfileScreen] Error loading profile image:', e.nativeEvent.error);
                setProfilePicture(null);
              }}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#6B7280" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Profile Picture Update Button in a separate container */}
      <View style={styles.updatePictureContainer}>
        <TouchableOpacity
          style={styles.updatePictureButton}
          onPress={showImagePickerOptions}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="camera" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.updatePictureText}>Change Profile Picture</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* Navigate to edit profile */}}
        >
          <Ionicons name="person-outline" size={24} color="#3B82F6" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* Navigate to orders */}}
        >
          <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
          <Text style={styles.menuItemText}>My Orders</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* Navigate to vehicles */}}
        >
          <Ionicons name="car-outline" size={24} color="#3B82F6" />
          <Text style={styles.menuItemText}>My Vehicles</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* Navigate to settings */}}
        >
          <Ionicons name="settings-outline" size={24} color="#3B82F6" />
          <Text style={styles.menuItemText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
          {loading ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={[
            styles.inputWrapper,
            errors.phone ? styles.inputError : null
          ]}>
            <View style={styles.phonePrefixContainer}>
              <Image 
                source={{ uri: 'https://flagcdn.com/w20/pk.png' }}
                style={styles.flagImage}
              />
              <Text style={styles.phonePrefix}>+92</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.phoneInput]}
              placeholder="3XXXXXXXXX"
              value={formData.phone}
              onChangeText={(value) => {
                // Only allow digits and ensure it starts with 3
                const cleanValue = value.replace(/\D/g, '');
                if (cleanValue.length === 0 || 
                    (cleanValue.length === 1 && cleanValue === '3') || 
                    (cleanValue.length > 1 && cleanValue.startsWith('3'))) {
                  updateFormData('phone', cleanValue);
                }
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Text style={styles.phoneHelperText}>
            Enter 11-digit Pakistani mobile number starting with 3
          </Text>
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatePictureContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  updatePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  updatePictureText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 20,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    padding: 12,
  },
  phonePrefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  flagImage: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  phonePrefix: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  phoneInput: {
    paddingLeft: 8,
  },
  phoneHelperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProfileScreen; 