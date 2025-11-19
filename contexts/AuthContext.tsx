// contexts/AuthContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    rememberMe?: boolean
  ) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  adminLogin: (
    email: string,
    password: string,
    rememberMe?: boolean
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
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("=== AUTH CONTEXT DEBUG ===");
        console.log("Response data:", data);
        console.log("User data:", data.user);
        console.log("User resellerTier:", data.user?.resellerTier);
        console.log("User discount from reseller:", data.user?.diskon || 0);
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // Redirect to home or dashboard
        router.push("/");
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
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
          .join("")
      );

      const googleUser = JSON.parse(jsonPayload);

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          sub: googleUser.sub,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // Redirect to home or dashboard
        router.push("/");
      } else {
        throw new Error(data.error || "Google login failed");
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);

        // Check if user is admin
        if (data.user.accessRole === "admin") {
          // Redirect to admin dashboard
          router.push("/admin/dashboard");
        } else {
          throw new Error(
            "Akses ditolak. Hanya admin yang dapat menggunakan halaman ini."
          );
        }
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // Redirect to home or dashboard
        router.push("/");
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        router.push("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateSpending = async (amount: number) => {
    try {
      const response = await fetch("/api/user/update-spending", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        throw new Error(data.error || "Failed to update spending");
      }
    } catch (error: any) {
      console.error("Update spending error:", error);
      throw error;
    }
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
