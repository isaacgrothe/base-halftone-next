import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Halftone",
  description: "Halftone line renderer with WebGL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden bg-[#EFEFEF]">{children}</body>
    </html>
  );
}
