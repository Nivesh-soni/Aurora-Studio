import { create } from 'zustand';
import axios from 'axios';

const useUserStore = create((set) => ({
  user: null,
  isSynced: false,
  isLoading: false,
  error: null,

  syncUserWithBackend: async (clerkUser) => {
    if (!clerkUser) return;

    set({ isLoading: true });
    try {
      const response = await axios.post("http://localhost:3000/api/users/sync", {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || "",
        imageUrl: clerkUser.imageUrl || ""
      });

      if (response.data.success) {
        set({ 
          user: response.data.user, 
          isSynced: true, 
          isLoading: false 
        });
        console.log("🚀 User state centralized and synced to MongoDB via Zustand!");
      }
    } catch (err) {
      set({ 
        error: err.message || "Failed to sync user", 
        isLoading: false 
      });
      console.error("Error in userStore sync:", err);
    }
  },

  clearUser: () => set({ user: null, isSynced: false, error: null })
}));

export default useUserStore;
