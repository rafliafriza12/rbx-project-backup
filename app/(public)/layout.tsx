"use client";
import { ILayoutProps } from "@/types";
import PublicAppHeader from "@/components/header/public-app-header";
import PublicAppFooter from "@/components/footer/public-app-footer";
import HyperspeedBackground from "@/components/HyperspeedBackground";
import SplashScreen from "@/components/SplashScreen";
import FloatingCartButton from "@/components/FloatingCartButton";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

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

  if (showSplash && isHomepage) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="w-full bg-[#22102A] min-h-screen font-sans text-white relative z-0">
      <div className="fixed z-[-1] h-screen w-screen opacity-[0.6] bg-[url('/main-background.png')] bg-repeat bg-contain lg:bg-none">
        <Image
          src={"/main-background.png"}
          alt="rbxnet"
          fill
          className="relative object-cover hidden lg:block"
        />
      </div>
      <div className="w-full relative z-0">
        <div className="w-full h-[30vh]  bg-gradient-to-b from-[#f63ae6]/80 via-[#f63ae6]/40 to-transparent absolute z-[-1] inset-0 blur-[30px]"></div>
        <PublicAppHeader />
        {isHomepage && <HyperspeedBackground />}
        <div className="w-full flex gap-10 py-10 flex-col mx-auto px-4 md:px-20 min-h-screen overflow-hidden">
          {children}
        </div>
        {/* <div className="w-full h-[50vh] bg-gradient-to-t from-[#f63ae6]/80 via-[#f63ae6]/40 to-transparent absolute z-[-1] bottom-[40vh] left-0 blur-[10px]"></div> */}
        <PublicAppFooter />
      </div>

      {/* Floating Cart Button */}
      <FloatingCartButton />
    </div>
  );
};

export default PublicLayout;
