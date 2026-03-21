// contexts/AuthContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  loginAction,
  googleLoginAction,
  registerAction,
  checkAuthAction,
  logoutAction,
} from "@/app/(auth)/actions";

interface MemberRole {
  _id: string;
  member: string;
  diskon: number;
  description?: string;
  isActive: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName?: string; // Optional field
  email: string;
  phone: string;
  countryCode: string;
  accessRole: "user" | "admin";
  resellerTier?: number;
  resellerExpiry?: Date;
  resellerPackageId?: string;
  spendedMoney: number;
  diskon: number;
  isVerified: boolean;
  profilePicture?: string;
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  adminLogin: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateSpending: (amount: number) => Promise<void>;
  isAdmin: () => boolean;
}

interface RegisterData {
  firstName: string;
  lastName?: string; // Optional field
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  googleLogin: async () => {},
  adminLogin: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
  updateSpending: async () => {},
  isAdmin: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { ok, data } = await checkAuthAction();

      if (ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ) => {
    try {
      setLoading(true);
      const { ok, data } = await loginAction(email, password, rememberMe);

      if (ok) {
        setUser(data.user);
        // Redirect to home or dashboard
        router.push("/");
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential: string) => {
    try {
      setLoading(true);
      // Decode the JWT token to get user info
      const base64Url = credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const googleUser = JSON.parse(jsonPayload);

      const { ok, data } = await googleLoginAction({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        sub: googleUser.sub,
      });

      if (ok) {
        setUser(data.user);
        // Redirect to home or dashboard
        router.push("/");
      } else {
        throw new Error(data.error || "Google login failed");
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ) => {
    try {
      setLoading(true);
      const { ok, data } = await loginAction(email, password, rememberMe);

      if (ok) {
        setUser(data.user);

        // Check if user is admin
        if (data.user.accessRole === "admin") {
          // Redirect to admin dashboard
          router.push("/admin/dashboard");
        } else {
          throw new Error(
            "Akses ditolak. Hanya admin yang dapat menggunakan halaman ini.",
          );
        }
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const { ok, data } = await registerAction(userData);

      if (ok) {
        setUser(data.user);
        // Redirect to home or dashboard
        router.push("/");
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { ok } = await logoutAction();

      if (ok) {
        setUser(null);
        router.push("/");
      }
    } catch (error) {}
  };

  const updateSpending = async (_amount: number) => {
    // spendedMoney is now only updated server-side via payment webhooks.
    // Re-fetch auth state to get the latest value from the server.
    await checkAuth();
  };

  const isAdmin = () => {
    return user?.accessRole === "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        adminLogin,
        register,
        logout,
        checkAuth,
        updateSpending,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
