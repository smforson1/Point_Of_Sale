import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ConnectivityProvider } from "@/components/shared/ConnectivityProvider";
import { PWARegistration } from "../components/shared/PWARegistration";
import { SettingsInitializer } from "../components/shared/SettingsInitializer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('settings').select('store_name').single();
  const storeName = settings?.store_name || "POS Master Pro";

  return {
    title: storeName,
    description: `Next.js Point of Sale System for ${storeName}`,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: storeName,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConnectivityProvider>
            <PWARegistration />
            <SettingsInitializer />
            {children}
            <Toaster position="top-right" />
          </ConnectivityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
