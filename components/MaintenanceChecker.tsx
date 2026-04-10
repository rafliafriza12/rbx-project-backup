"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { checkMaintenanceStatus } from "@/app/lib/actions";

/**
 * MaintenanceChecker component
 * Checks maintenance mode status from database via API
 * Handles client-side redirect to/from maintenance page
 * No cookies needed — purely client-side polling approach
 */
export default function MaintenanceChecker() {
  const pathname = usePathname();
  const router = useRouter();

  const checkMaintenance = useCallback(async () => {
    // Skip check for admin routes
    if (pathname?.startsWith("/admin")) {
      return;
    }

    try {
      const data = await checkMaintenanceStatus();

      if (data.maintenanceMode === true) {
        // Redirect to maintenance page if not already there
        if (pathname !== "/maintenance") {
          router.replace("/maintenance");
        }
      } else {
        // If we're on maintenance page but maintenance is off, redirect to home
        if (pathname === "/maintenance") {
          router.replace("/");
        }
      }
    } catch (error) {
      // Silently fail - don't block user if check fails
    }
  }, [pathname, router]);

  useEffect(() => {
    // Initial check
    checkMaintenance();

    // Check periodically (every 10 seconds)
    const interval = setInterval(checkMaintenance, 10000);

    return () => clearInterval(interval);
  }, [checkMaintenance]);

  return null;
}
