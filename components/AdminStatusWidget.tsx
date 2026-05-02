"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface AdminStatusData {
  adminStatusMode: string;
  operationalHourStart: string;
  operationalHourEnd: string;
}

export default function AdminStatusWidget() {
  const [statusData, setStatusData] = useState<AdminStatusData | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch settings from API
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/public/admin-status");
        if (res.ok) {
          const data = await res.json();
          setStatusData(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin status", error);
      }
    };
    fetchStatus();
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Update live clock
  useEffect(() => {
    setCurrentTime(new Date());
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Determine online status based on time
  useEffect(() => {
    if (!statusData || !currentTime) return;

    if (statusData.adminStatusMode === "online") {
      setIsOnline(true);
    } else if (statusData.adminStatusMode === "offline") {
      setIsOnline(false);
    } else {
      // Auto mode based on WIB (UTC+7)
      const options = { timeZone: "Asia/Jakarta", hour12: false };
      const wibTimeString = currentTime.toLocaleTimeString("en-US", options); // "14:30:00"
      
      const currentH = parseInt(wibTimeString.split(":")[0]);
      const currentM = parseInt(wibTimeString.split(":")[1]);
      const currentTotalMins = currentH * 60 + currentM;

      const [startH, startM] = statusData.operationalHourStart.split(":").map(Number);
      const startTotalMins = startH * 60 + startM;

      const [endH, endM] = statusData.operationalHourEnd.split(":").map(Number);
      let endTotalMins = endH * 60 + endM;

      // Handle crossing midnight (e.g. 10:00 - 02:00)
      if (endTotalMins < startTotalMins) {
        if (currentTotalMins >= startTotalMins || currentTotalMins <= endTotalMins) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } else {
        if (currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      }
    }
  }, [statusData, currentTime]);

  if (!statusData || !currentTime) return null;

  // Format time for display (HH:mm:ss)
  const formattedTime = currentTime.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="fixed z-50 
      lg:top-24 lg:left-8 lg:bottom-auto lg:right-auto 
      bottom-20 left-4 right-4 lg:w-auto"
    >
      <div className="bg-[#1a1f2e]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center justify-between lg:justify-start gap-4 shadow-xl">
        {/* Status Section */}
        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
          <div className="relative flex items-center justify-center">
            {isOnline ? (
              <>
                <div className="absolute w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-3 h-3 bg-green-500 rounded-full border border-green-300"></div>
              </>
            ) : (
              <div className="relative w-3 h-3 bg-gray-500 rounded-full border border-gray-400"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">
              Admin {isOnline ? "Online" : "Offline"}
            </span>
            <span className="text-[10px] text-white/60 font-medium">
              {statusData.operationalHourStart} - {statusData.operationalHourEnd}
            </span>
          </div>
        </div>

        {/* Clock Section */}
        <div className="flex items-center gap-2 pl-2">
          <Clock className="w-4 h-4 text-white/70" />
          <span className="font-mono text-sm font-semibold tracking-wider text-white">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}
