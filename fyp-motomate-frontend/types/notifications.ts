export interface Notification {
    notificationId: number;
    userId: number;
    message: string;
    status: "read" | "unread";
    createdAt: string;
  }