import MaintenancePage from "@/components/MaintenancePage";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Maintenance() {
  try {
    await dbConnect();
    const settings = await Settings.getSiteSettings();

    // If maintenance mode is off, redirect to home
    if (!settings.maintenanceMode) {
      redirect("/");
    }

    return <MaintenancePage message={settings.maintenanceMessage} />;
  } catch (error) {
    // Don't catch redirect errors (Next.js throws NEXT_REDIRECT)
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Error loading maintenance page:", error);
    return <MaintenancePage />;
  }
}
