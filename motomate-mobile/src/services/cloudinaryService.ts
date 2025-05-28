import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dmdmxrllc'; // Your cloud name
const CLOUDINARY_UPLOAD_PRESET = 'motomate'; // Your upload preset

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface ImageAsset {
  uri: string;
  type: string;
  name: string;
}

class CloudinaryService {
  private async getUploadUrl(): Promise<string> {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log('[CloudinaryService] Generated upload URL:', url);
    return url;
  }

  async pickImage(source: 'camera' | 'library'): Promise<ImageAsset | null> {
    try {
      console.log('[CloudinaryService] Starting image picker with source:', source);
      
      // Request permissions first
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('[CloudinaryService] Camera permission status:', status);
        if (status !== 'granted') {
          console.error('[CloudinaryService] Camera permission not granted');
          return null;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[CloudinaryService] Media library permission status:', status);
        if (status !== 'granted') {
          console.error('[CloudinaryService] Media library permission not granted');
          return null;
        }
      }

      const options = {
        mediaTypes: 'images' as const,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.7,
        exif: false,
      };

      console.log('[CloudinaryService] Launching image picker with options:', options);
      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      console.log('[CloudinaryService] Image picker result:', JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log('[CloudinaryService] Image picker cancelled');
        return null;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('[CloudinaryService] No image selected');
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        console.error('[CloudinaryService] No URI in selected asset');
        return null;
      }

      // Ensure the URI is properly formatted for Android
      const uri = Platform.OS === 'android' 
        ? asset.uri 
        : asset.uri.replace('file://', '');

      console.log('[CloudinaryService] Processed image URI:', uri);

      return {
        uri,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      };
    } catch (error) {
      console.error('[CloudinaryService] Error picking image:', error);
      return null;
    }
  }

  async uploadImage(imageAsset: ImageAsset): Promise<UploadResponse> {
    try {
      if (!imageAsset.uri) {
        console.error('[CloudinaryService] No image URI provided');
        throw new Error('No image URI provided');
      }

      console.log('[CloudinaryService] Starting image upload with URI:', imageAsset.uri);

      const formData = new FormData();
      
      // Create the file object for Android
      const fileToUpload = {
        uri: imageAsset.uri,
        type: imageAsset.type,
        name: imageAsset.name,
      };

      console.log('[CloudinaryService] File to upload:', JSON.stringify(fileToUpload, null, 2));
      
      formData.append('file', fileToUpload as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('timestamp', Date.now().toString());

      const uploadUrl = await this.getUploadUrl();
      console.log('[CloudinaryService] Uploading to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[CloudinaryService] Upload response status:', response.status);
      const responseText = await response.text();
      console.log('[CloudinaryService] Raw response text:', responseText);

      if (!response.ok) {
        console.error('[CloudinaryService] Upload failed with status:', response.status);
        console.error('[CloudinaryService] Upload response:', responseText);
        throw new Error(`Upload failed with status ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[CloudinaryService] Parsed response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('[CloudinaryService] Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!data.secure_url) {
        console.error('[CloudinaryService] No secure_url in response:', data);
        throw new Error('No secure URL in response');
      }

      const imageUrl = data.secure_url;
      console.log('[CloudinaryService] Successfully generated image URL:', imageUrl);
      
      return {
        success: true,
        url: imageUrl,
      };
    } catch (error) {
      console.error('[CloudinaryService] Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  async uploadProfilePicture(source: 'camera' | 'library' = 'library'): Promise<UploadResponse> {
    try {
      console.log('[CloudinaryService] Starting profile picture upload process');
      const imageAsset = await this.pickImage(source);
      
      if (!imageAsset) {
        console.log('[CloudinaryService] No image selected');
        return {
          success: false,
          error: 'No image selected',
        };
      }

      console.log('[CloudinaryService] Image selected, proceeding with upload');
      const uploadResult = await this.uploadImage(imageAsset);
      console.log('[CloudinaryService] Upload result:', uploadResult);
      
      if (uploadResult.success && uploadResult.url) {
        try {
          console.log('[CloudinaryService] Upload successful, saving URL to storage:', uploadResult.url);
          await AsyncStorage.setItem('profilePictureUrl', uploadResult.url);
        } catch (storageError) {
          console.error('[CloudinaryService] Error saving to AsyncStorage:', storageError);
          // Don't fail the whole operation if storage fails
        }
      }

      return uploadResult;
    } catch (error) {
      console.error('[CloudinaryService] Error in uploadProfilePicture:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload profile picture',
      };
    }
  }
}

export const cloudinaryService = new CloudinaryService(); 