"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * MaintenanceChecker component
 * Checks maintenance mode status from database via API
 * Sets cookie for middleware to read on subsequent requests
 * Also handles immediate client-side redirect
 */
export default function MaintenanceChecker() {
  const pathname = usePathname();
  const router = useRouter();

  const checkMaintenance = useCallback(async () => {
    // Skip check for admin routes only
    if (pathname?.startsWith("/admin")) {
      return;
    }

    try {
      const response = await fetch("/api/maintenance", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.maintenanceMode === true) {
          // Set cookie for middleware to read on next requests
          // Cookie expires in 5 minutes - will be refreshed by periodic check
          document.cookie = `maintenance_mode=true; path=/; max-age=300; SameSite=Lax`;

          // Immediate redirect to maintenance page
          if (pathname !== "/maintenance") {
            router.replace("/maintenance");
          }
        } else {
          // Clear the cookie if maintenance is off
          document.cookie = `maintenance_mode=; path=/; max-age=0; SameSite=Lax`;

          // If we're on maintenance page but maintenance is off, redirect to home
          if (pathname === "/maintenance") {
            router.replace("/");
          }
        }
      }
    } catch (error) {
      // Silently fail - don't block user if check fails
      // Clear cookie on error to prevent false maintenance state
      document.cookie = `maintenance_mode=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [pathname, router]);

  useEffect(() => {
    // Initial check
    checkMaintenance();

    // Check periodically (every 10 seconds for faster response)
    const interval = setInterval(checkMaintenance, 10000);

    return () => clearInterval(interval);
  }, [checkMaintenance]);

  return null; // This component doesn't render anything
}
