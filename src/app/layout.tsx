import type { Metadata } from "next";
import "./globals.css";
import { CommandPalette } from "@/components/ui/command-palette";
import { Providers } from "@/providers/providers";

// Using system font fallbacks to avoid remote Google font fetch during builds
const geistSans = { variable: "--font-geist-sans", className: "font-sans" };
const geistMono = { variable: "--font-geist-mono", className: "font-mono" };

export const metadata: Metadata = {
  title: "NextGen Kiddies OS | Enterprise Retail Ecosystem",
  description: "High-Fidelity Children's Fashion Retail Operating System",
  icons: {
    icon: [
      { url: "/images/logonextgen.png", type: "image/png" },
      { url: "/images/logonextgen.png", sizes: "any" },
    ],
    apple: "/images/logonextgen.png",
    shortcut: "/images/logonextgen.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background selection:bg-brand-navy/30">
        <Providers>
          <CommandPalette />
          {children}
        </Providers>
      </body>
    </html>
  );
}
