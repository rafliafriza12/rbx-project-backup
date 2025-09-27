import { ILayoutProps } from "@/types";
import PublicAppHeader from "@/components/header/public-app-header";
import PublicAppFooter from "@/components/footer/public-app-footer";
const PublicLayout: React.FC<ILayoutProps> = ({ children }) => {
  return (
    <div className="w-full bg-[#3E1E68] min-h-screen font-sans text-white relative">
      <PublicAppHeader />
      <div className="w-full flex gap-10 py-10 flex-col mx-auto px-4 md:px-20 min-h-screen">
        {children}
      </div>
      <PublicAppFooter />
    </div>
  );
};

export default PublicLayout;
