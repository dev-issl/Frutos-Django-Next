"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";

export default function NavbarWrapper({ navbarLogoUrl, brandName, navLinks }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <Navbar navbarLogoUrl={navbarLogoUrl} brandName={brandName} navLinks={navLinks} />;
}