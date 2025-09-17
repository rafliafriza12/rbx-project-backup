import { ILayoutProps } from "@/types";
import PublicAppHeader from "@/components/header/public-app-header";
import PublicAppFooter from "@/components/footer/public-app-footer";
const PublicLayout: React.FC<ILayoutProps> = ({ children }) => {
  return (
    <div className=" w-full bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white min-h-screen font-sans text-gray-800">
      <PublicAppHeader />
      <div className="w-full flex gap-10 py-10 flex-col mx-auto px-4 md:px-20 min-h-screen">
        {children}
      </div>
      <PublicAppFooter />
    </div>
  );
};

export default PublicLayout;
