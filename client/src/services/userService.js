import axios from "axios";
import { API_URL, authenticatedRequest } from "./http";

export async function syncUser(clerkUser, token) {
  const { data } = await axios.post(`${API_URL}/api/users/sync`, {
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || "",
    imageUrl: clerkUser.imageUrl || "",
  }, authenticatedRequest(token));
  return data;
}
