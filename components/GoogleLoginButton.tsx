"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  text?: string;
  width?: "full" | "auto";
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  text = "Masuk dengan Google",
  width = "full",
}: GoogleLoginButtonProps) {
  const { googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        setIsLoading(true);
        await googleLogin(credentialResponse.credential);
        onSuccess?.();
      } catch (error: any) {
        console.error("Google login error:", error);
        onError?.(error.message || "Google login failed");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleError = () => {
    console.error("Google login error");
    onError?.("Google login gagal");
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={`${
          width === "full" ? "w-full" : "w-auto"
        } flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed`}
      >
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
        <span className="text-gray-500 font-medium">Memproses...</span>
      </button>
    );
  }

  return (
    <div className={width === "full" ? "w-full" : "w-auto"}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text="signin_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width={width === "full" ? "384" : undefined}
        locale="id"
      />
    </div>
  );
}
