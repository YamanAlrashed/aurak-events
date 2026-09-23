import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AURAK Events & Marketing",
    template: "%s | AURAK Events & Marketing",
  },
  description:
    "Campus Events and Marketing Events platform for the American University of Ras Al Khaimah.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7b1e28",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}