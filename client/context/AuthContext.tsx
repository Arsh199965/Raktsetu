import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments, SplashScreen } from "expo-router";

const API_URL =
  Platform.OS === "android" ? process.env.API_URL : "http://localhost:5000";
const TOKEN_KEY = "userToken";
const USER_ROLE_KEY = "userRole";

interface AuthContextType {
  token: string | null;
  userRole: "donor" | "client" | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { token: string; role: "donor" | "client" }) => Promise<void>;
  logout: () => Promise<void>;
  // You might want to add user object here later
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"donor" | "client" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        SplashScreen.preventAutoHideAsync(); // Prevent splash screen from hiding until we check auth
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedRole = (await AsyncStorage.getItem(USER_ROLE_KEY)) as
          | "donor"
          | "client"
          | null;

        if (storedToken) {
          setToken(storedToken);
          setUserRole(storedRole);
          // Here you might want to validate the token with your backend
        }
      } catch (e) {
        console.error("Failed to load auth data", e);
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync(); // Hide splash screen once auth check is done
      }
    };

    loadAuthData();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Don't run redirect logic until loading is complete

    // Determine if the current route is an auth screen (login or signup)
    const lastSegment = segments[segments.length - 1];
    const isAuthRoute = lastSegment === "login" || lastSegment === "signup";

    if (token) {
      // User is authenticated
      if (isAuthRoute) {
        // If authenticated and on login/signup, redirect to the main app (home route '/').
        router.replace({ pathname: "/" } as any);
      }
    } else {
      // User is not authenticated
      if (!isAuthRoute) {
        // If not authenticated and not on login/signup, redirect to the login screen.
        router.replace({ pathname: "/login" } as any);
      }
    }
  }, [token, isLoading, segments, router]);

  const login = async (data: { token: string; role: "donor" | "client" }) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_ROLE_KEY, data.role);
      setToken(data.token);
      setUserRole(data.role);
      // Navigation to '/(tabs)' will be handled by the useEffect above once token is set
    } catch (e) {
      console.error("Failed to save auth data on login", e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_ROLE_KEY);
      setToken(null);
      setUserRole(null);
      // Navigation to '/(auth)/login' will be handled by the useEffect above once token is null
    } catch (e) {
      console.error("Failed to remove auth data on logout", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userRole,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
