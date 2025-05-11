"use client";

import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationDropdown from "@/components/NotificationDropdown";


const API_URL ="http://localhost:5177";

export default function NotificationsTestPage() {
  const [userId, setUserId] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createTestNotification = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post(`${API_URL}/api/notifications/test`, {
        userId,
        message,
      });

      setSuccess("Notification created successfully!");
      setMessage(""); // Clear the message input
    } catch (error) {
      console.error("Error creating test notification:", error);
      setError("Failed to create notification. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Notifications Test Page</h1>
        <NotificationDropdown />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Create Test Notification</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="userId">
              User ID
            </label>
            <Input
              id="userId"
              type="number"
              value={userId}
              onChange={(e) => setUserId(parseInt(e.target.value) || 0)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="message">
              Message
            </label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full"
              placeholder="Enter notification message"
            />
          </div>
          <Button
            onClick={createTestNotification}
            disabled={loading || !message || userId <= 0}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Notification"}
          </Button>

          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-500 mt-2">{success}</div>}
        </div>
      </div>

      <div className="mt-8 bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter your user ID (the ID of the user who should receive the notification)</li>
          <li>Enter a notification message</li>
          <li>Click "Create Notification" to create a test notification</li>
          <li>The notification will appear in the bell icon dropdown at the top right</li>
          <li>Click on a notification to mark it as read</li>
          <li>Click the trash icon to delete a notification</li>
        </ol>
      </div>
    </div>
  );
}