import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaishnavi Inn POS",
  description: "Room Service & Billing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider>
          <StoreProvider>
            <Sidebar />
            <main className="pl-20 lg:pl-64 min-h-screen transition-all duration-300">
              <div className="container mx-auto p-4 md:p-8 max-w-[1600px]">
                {children}
              </div>
            </main>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
