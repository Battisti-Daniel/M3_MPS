import api from "@/lib/api";
import { User } from "@/types";

type ProfileResponse = {
  data: User;
};

export async function fetchProfile() {
  const { data } = await api.get<ProfileResponse>("/profile");
  return data.data;
}

export async function updateProfile(payload: Record<string, unknown>) {
  const { data } = await api.put<ProfileResponse>("/profile", payload);
  return data.data;
}

export async function acceptPrivacyPolicy() {
  const { data } = await api.post<{ message: string; user?: User }>("/privacy/accept");
  return data;
}

export async function requestDataErasure() {
  await api.post("/privacy/request-erasure");
}

export async function exportUserData() {
  const response = await api.get("/privacy/export", {
    responseType: "json",
  });
  return response.data;
}


