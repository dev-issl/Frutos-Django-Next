"use client";
import { usePathname } from "next/navigation";
import Footer from "@/app/components/Footer";

export default function FooterWrapper({ config }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/staff")) return null;
  return <Footer config={config} />;
}