import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClarityProvider } from "@/components/providers/clarity-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DrVet",
  description:
    "Sistema completo de gestão para clínicas veterinárias e veterinários autônomos.",
  icons: {
    icon: "/images/logo.jpeg",
    shortcut: "/images/logo.jpeg",
    apple: "/images/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased`}
      >
        <ClarityProvider />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
