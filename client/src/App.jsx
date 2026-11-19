import { lazy, Suspense, useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import useUserStore from "./store/userStore.js";
import Toaster from "./components/ui/Toaster";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Editor = lazy(() => import("./pages/Editor"));

function RootWrapper({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const syncUserWithBackend = useUserStore((s) => s.syncUserWithBackend);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser)
      syncUserWithBackend(clerkUser, getToken);
    if (isLoaded && !isSignedIn) clearUser();
  }, [
    isLoaded,
    isSignedIn,
    clerkUser,
    getToken,
    syncUserWithBackend,
    clearUser,
  ]);

  return (
    <div className="min-h-screen bg-[#101211] text-slate-100">{children}</div>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    path: "/dashboard",
    element: (
      <>
        <SignedIn>
          <Dashboard />
        </SignedIn>
        <SignedOut>
          <Navigate to="/" replace />
        </SignedOut>
      </>
    ),
  },
  {
    path: "/editor/:projectId?",
    element: (
      <>
        <SignedIn>
          <Editor />
        </SignedIn>
        <SignedOut>
          <Navigate to="/" replace />
        </SignedOut>
      </>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <RootWrapper>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#080a0e] text-sm text-cyan-300">
            Loading Aurora Studio…
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </RootWrapper>
  );
}
