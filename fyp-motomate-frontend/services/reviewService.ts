// src/services/reviewService.ts

import apiClient from "./apiClient";


export interface ReviewSubmission {
  orderId: number;
  mechanicRating: number;
  mechanicComments?: string;
  workshopRating?: number;
  workshopComments?: string;
}

export interface MechanicRating {
  mechanicId: number;
  mechanicName: string;
  totalReviews: number;
  averageRating: number;
}

export interface WorkshopRating {
  totalReviews: number;
  averageRating: number;
}

export interface PendingReviewOrder {
  orderId: number;
  status: string;
  orderDate: string;
  totalAmount: number;
  vehicle: {
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
    description?: string;
  };
  mechanic?: {
    mechanicId: number;
    name: string;
  };
}

export interface PendingReviewsResponse {
  success: boolean;
  pendingReviewCount: number;
  orders: PendingReviewOrder[];
}

let cachedPendingReviews: PendingReviewsResponse | null = null;
let lastCheckedTime = 0;
const CACHE_EXPIRATION = 60000; // 1 minute cache

const reviewService = {
  // Submit a review for an order
  submitReview: async (review: ReviewSubmission) => {
    try {
      const response = await apiClient.post('/api/Reviews/SubmitOrderReview', review);
      
      // Invalidate cache after submitting a review
      cachedPendingReviews = null;
      
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // Check if the user has already reviewed an order
  hasReviewed: async (orderId: number) => {
    try {
      const response = await apiClient.get(`/api/Reviews/HasReviewed/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking if order is reviewed:', error);
      return { success: false, hasReviewed: false };
    }
  },

  // Get the rating for a specific mechanic
  getMechanicRating: async (mechanicId: number): Promise<MechanicRating> => {
    try {
      const response = await apiClient.get(`/api/Reviews/MechanicRating/${mechanicId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting mechanic rating:', error);
      return {
        mechanicId,
        mechanicName: 'Unknown',
        totalReviews: 0,
        averageRating: 0
      };
    }
  },

  // Get the overall workshop rating
  getWorkshopRating: async (): Promise<WorkshopRating> => {
    try {
      const response = await apiClient.get('/api/Reviews/WorkshopRating');
      return response.data;
    } catch (error) {
      console.error('Error getting workshop rating:', error);
      return {
        totalReviews: 0,
        averageRating: 0
      };
    }
  },

  // Get orders that need review - with caching
  getPendingReviews: async (forceRefresh = false): Promise<PendingReviewsResponse> => {
    const now = Date.now();
    
    // Use cached data if available and not expired
    if (!forceRefresh && cachedPendingReviews && (now - lastCheckedTime < CACHE_EXPIRATION)) {
      return cachedPendingReviews;
    }
    
    try {
      const response = await apiClient.get('/api/Reviews/PendingReviews');
      
      // Update cache
      cachedPendingReviews = response.data;
      lastCheckedTime = now;
      
      return response.data;
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      
      // Return empty data on error
      return {
        success: false,
        pendingReviewCount: 0,
        orders: []
      };
    }
  },

  // Check if user has any pending reviews - optimized for quick checks
  checkPendingReviews: async (): Promise<boolean> => {
    try {
      const { pendingReviewCount } = await reviewService.getPendingReviews();
      return pendingReviewCount > 0;
    } catch (error) {
      console.error('Error checking pending reviews:', error);
      return false;
    }
  },
  
  // Clear the cache
  clearCache: () => {
    cachedPendingReviews = null;
    lastCheckedTime = 0;
  }
};

export default reviewService;