import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FactuResto",
  description: "Application de facturation pour restaurant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased bg-stone-50 min-h-screen`}>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
