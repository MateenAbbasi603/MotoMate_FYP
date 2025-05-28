"use client"

import React, { useEffect, useState } from 'react'
import { getAuthToken } from '../../../../../services/authService';

// Define a type for your notification data based on API response
interface Notification {
  notificationId: number; // Assuming the ID is a number based on usage in NotificationDropdown
  message: string;
  status: string; // Assuming status is a string ('read' or 'unread')
  createdAt: string; // Assuming timestamp is named createdAt
  // Add other properties if your notification object has them
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for your backend endpoint
  const NOTIFICATIONS_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + '/api/notifications'; // *** REPLACE WITH YOUR ACTUAL ENDPOINT IF DIFFERENT ***

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
            throw new Error("Authentication token not found.");
        }

        console.log("Fetching notifications from:", NOTIFICATIONS_API_URL);
        const response = await fetch(NOTIFICATIONS_API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Notifications API response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `Failed to fetch notifications: ${response.status} ${response.statusText}`;
          try {
              const errorJson = JSON.parse(errorBody);
              errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch (parseError) {
              console.error("Failed to parse error response:", parseError);
          }
           console.error("API Error Response Body:", errorBody);
           throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Notifications API response data:", data);

        // Assuming your API returns an object with a $values array
        if (data && Array.isArray(data.$values)) {
             setNotifications(data.$values);
        } else if (Array.isArray(data)) { // Fallback for a direct array response
             setNotifications(data);
        } else {
             console.error("API response is not in expected {$values: [...]} or array format:", data);
             setNotifications([]);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch notifications');
        console.error('Error fetching notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      const token = getAuthToken(); 
      if (!token) {
           console.error("Authentication token not found for marking as read.");
           return;
       }

      // Use notificationId in the URL
      const response = await fetch(`${NOTIFICATIONS_API_URL}/${notificationId}/read`, { 
        method: 'POST',
        headers: {
             'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorBody = await response.text();
         let errorMessage = `Failed to mark notification ${notificationId} as read: ${response.status} ${response.statusText}`;
           try {
               // Check if the response is likely JSON before parsing
               const contentType = response.headers.get("content-type");
               if (contentType && contentType.indexOf("application/json") !== -1) {
                 const errorJson = JSON.parse(errorBody);
                 errorMessage = errorJson.message || errorJson.error || errorMessage;
               } else {
                 // If not JSON, use the status text or a generic message
                 errorMessage = `Failed to mark notification ${notificationId} as read: ${response.status} ${response.statusText}`; 
                 if (errorBody) console.error("Non-JSON error response body:", errorBody);
               }
           } catch (parseError) {
               console.error("Failed to parse error response for mark as read:", parseError);
               // Use the default HTTP status message if parsing fails
               errorMessage = `Failed to mark notification ${notificationId} as read: ${response.status} ${response.statusText}`;
           }
        throw new Error(errorMessage);
      }

      // Update local state to mark as read by status
      setNotifications(notifications.map(notif => 
        notif.notificationId === notificationId ? { ...notif, status: "read" } : notif
      ));
      console.log(`Notification ${notificationId} marked as read.`);

    } catch (err: any) {
      console.error('Error marking as read:', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Notifications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li 
              key={notif.notificationId} // Use notificationId as key
              className={`p-4 border rounded-md shadow-sm cursor-pointer transition-colors ${notif.status === "unread" ? 'bg-gray-100 text-gray-600' : 'bg-white hover:bg-gray-50'}`}
              onClick={() => notif.status === "unread" && markAsRead(notif.notificationId)} // Check status and pass notificationId
            >
              <p className={`font-medium ${notif.status === "unread" ? 'text-foreground' : 'text-gray-600'}`}>{notif.message}</p>
              <p className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</p> {/* Use createdAt for date */}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 