import useUserStore from "../store/userStore.js";
import { SignedIn, UserButton } from "@clerk/clerk-react";

export default function Dashboard() {
  const { user, isLoading } = useUserStore();

  if (isLoading)
    return <p className="text-cyan-400">Loading your profile...</p>;
  if (!user) return <p className="text-red-400">Please log in first.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <SignedIn>
        <UserButton />
      </SignedIn>

      <h1 className="text-2xl font-bold mt-4">Welcome back, {user.name}! 👋</h1>
      <p className="text-slate-400 text-sm mt-1">Email: {user.email}</p>
    </div>
  );
}
