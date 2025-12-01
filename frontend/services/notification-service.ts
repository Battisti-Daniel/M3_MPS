import api from "@/lib/api";
import { Notification, PaginatedResponse } from "@/types";

type NotificationResponse = PaginatedResponse<Notification>;

type NotificationResourceResponse = {
  data: Notification;
};

export async function fetchNotifications(params?: Record<string, unknown>) {
  const { data } = await api.get<NotificationResponse>("/notifications", { params });
  return data;
}

export async function markNotificationAsRead(id: number) {
  const { data } = await api.post<NotificationResourceResponse>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsAsRead() {
  await api.post("/notifications/read-all");
}


