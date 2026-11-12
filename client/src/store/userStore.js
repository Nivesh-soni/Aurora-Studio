import { create } from "zustand";
import { syncUser } from "../services/userService";

const useUserStore = create((set) => ({
  user: null,
  isSynced: false,
  isLoading: false,
  error: null,

  syncUserWithBackend: async (clerkUser, getToken) => {
    if (!clerkUser || !getToken) return;

    set({ isLoading: true, error: null });
    try {
      const token = await getToken();
      const response = await syncUser(clerkUser, token);
      if (response.success) {
        set({ user: response.user, isSynced: true });
      }
    } catch (error) {
      set({ error: error.message || "Failed to sync user" });
      console.error("Error in userStore sync:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearUser: () => set({ user: null, isSynced: false, error: null }),
}));

export default useUserStore;
