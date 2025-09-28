"use client";
import { ILayoutProps } from "@/types";
import PublicAppHeader from "@/components/header/public-app-header";
import PublicAppFooter from "@/components/footer/public-app-footer";
import HyperspeedBackground from "@/components/HyperspeedBackground";
import { usePathname } from "next/navigation";

const PublicLayout: React.FC<ILayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
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
  );
};

export default PublicLayout;
