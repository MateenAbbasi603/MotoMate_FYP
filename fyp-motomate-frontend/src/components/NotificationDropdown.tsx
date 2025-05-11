import React, { useEffect, useState } from "react";
import { BellIcon, Trash2Icon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../services/notificationServices";

import { formatDistanceToNow } from "date-fns";
import { Notification } from "../../types/notifications";

interface NotificationResponse {
  $id: string;
  $values: Notification[];
}

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications() as unknown as NotificationResponse;
      setNotifications(data.$values || []);
      console.log("Notifications fetched:", data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(
    (notification) => notification.status === "unread"
  ).length : 0;

  const handleNotificationClick = async (notification: Notification) => {
    // Only mark as read if it's currently unread
    if (notification.status === "unread") {
      try {
        await markNotificationAsRead(notification.notificationId);
        // Update the notification in the local state
        setNotifications(
          notifications.map((n) =>
            n.notificationId === notification.notificationId
              ? { ...n, status: "read" }
              : n
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    try {
      await markAllNotificationsAsRead();
      // Update all notifications in the local state
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          status: "read",
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the notification click handler from firing
    try {
      await deleteNotification(notificationId);
      // Remove the notification from the local state
      setNotifications(
        notifications.filter(
          (notification) => notification.notificationId !== notificationId
        )
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    fetchNotifications();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="py-2 px-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="py-2 px-4 text-center text-sm text-red-500">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-2 px-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            <div className="max-h-[300px] overflow-y-auto">
              {Array.isArray(notifications) && notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.notificationId}
                  className={`flex items-start p-3 gap-2 cursor-pointer ${
                    notification.status === "unread"
                      ? "bg-muted/50 font-medium"
                      : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-1">
                    <p>{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDeleteNotification(notification.notificationId, e)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <div className="p-2 text-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;