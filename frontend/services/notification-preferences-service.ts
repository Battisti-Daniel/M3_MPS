import api from "@/lib/api";
import { NotificationPreferenceMap } from "@/types";

type PreferencesResponse = {
  data: NotificationPreferenceMap;
};

type PreferencePayload = {
  channel: string;
  type: string;
  enabled: boolean;
};

export async function fetchNotificationPreferences() {
  const { data } = await api.get<PreferencesResponse>("/notifications/preferences");
  return data.data;
}

export async function updateNotificationPreferences(preferences: PreferencePayload[]) {
  await api.put("/notifications/preferences", { preferences });
}


