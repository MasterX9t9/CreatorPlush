import { cookies } from "next/headers";
import { LandingPage } from "@/components/landing/LandingPage";
import { AuthenticatedRoot } from "@/components/dashboard/AuthenticatedRoot";

export const metadata = {
  title: "CreatorPulse | YouTube Creator Intelligence & Outlier Radar",
  description:
    "Discover 10x viral outliers, verify channel monetization, estimate real RPM ad revenue, and scale your YouTube channel with verified data.",
};

export default function RootPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("cp_session");

  // If no session cookie exists, render the public landing page instantly
  if (!sessionCookie?.value) {
    return <LandingPage />;
  }

  // If session cookie exists, render the authenticated root
  return <AuthenticatedRoot />;
}
