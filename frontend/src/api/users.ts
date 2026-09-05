import { apiClient } from "./client";
import type { User, UserSettingsInput } from "../types";

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/api/users/me");
  return data;
}

export async function updateMe(input: UserSettingsInput): Promise<User> {
  const { data } = await apiClient.patch<User>("/api/users/me", input);
  return data;
}
