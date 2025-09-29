"use client";
import { ILayoutProps } from "@/types";
import PublicAppHeader from "@/components/header/public-app-header";
import PublicAppFooter from "@/components/footer/public-app-footer";
import HyperspeedBackground from "@/components/HyperspeedBackground";
import SplashScreen from "@/components/SplashScreen";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const PublicLayout: React.FC<ILayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [showSplash, setShowSplash] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Show splash screen only on first homepage visit in this session
    if (isHomepage && isInitialLoad) {
      setShowSplash(true);
      setIsInitialLoad(false);
    }
  }, [isHomepage, isInitialLoad]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && isHomepage ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <div className="w-full bg-[#22102A] min-h-screen font-sans text-white relative ">
          <div className="relative z-10">
            <PublicAppHeader />
            {isHomepage && <HyperspeedBackground />}
            <div className="w-full flex gap-10 py-10 flex-col mx-auto px-4 md:px-20 min-h-screen">
              {children}
            </div>
            <PublicAppFooter />
          </div>
        </div>
      )}
    </>
  );
};

export default PublicLayout;
