"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";

export default function NavbarWrapper({ navbarLogoUrl, brandName }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/staff")) return null;
  return <Navbar navbarLogoUrl={navbarLogoUrl} brandName={brandName} />;
}