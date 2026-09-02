import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import { product } from "@/lib/config";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: product.name,
  description: product.tagline,
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen bg-[#0B0B0C] text-[#F3F2EE] antialiased">
      <AuthProvider>
        <Navbar />
        {children}
      </AuthProvider>
      </body>
      </html>
  );
}