import React, { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import useUserStore from "./store/userStore.js";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";

const RootWrapper = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { syncUserWithBackend, clearUser } = useUserStore();

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      syncUserWithBackend(clerkUser);
    } else if (isLoaded && !isSignedIn) {
      clearUser();
    }
  }, [isLoaded, isSignedIn, clerkUser, syncUserWithBackend, clearUser]);

  return (
    <div className="bg-[#07090e] min-h-screen text-white">
      {children}
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
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
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);


const App = () => {
  return (
    <RootWrapper>
      <RouterProvider router={router} />
    </RootWrapper>
  );
};

export default App;
