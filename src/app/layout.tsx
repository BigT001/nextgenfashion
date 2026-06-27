import type { Metadata } from "next";
import "./globals.css";
import { CommandPalette } from "@/components/ui/command-palette";
import { Providers } from "@/providers/providers";
import { prisma } from "@/services/prisma.service";
import Script from "next/script";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch configurations from the database
  let pixelId = "1355267316673789"; // Default fallback Pixel ID
  let isTrackingEnabled = true;     // Default fallback status

  try {
    const [pixelIdSetting, enabledSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: "metaPixelId" } }),
      prisma.settings.findUnique({ where: { key: "metaTrackingEnabled" } }),
    ]);
    if (pixelIdSetting?.value?.trim()) {
      pixelId = pixelIdSetting.value.trim();
    }
    if (enabledSetting) {
      isTrackingEnabled = enabledSetting.value === "true";
    }
  } catch (error) {
    console.error("[RootLayout] Failed to load Meta Pixel configuration from database:", error);
  }

  return (
    <html lang="en" className={`h-full antialiased`} suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'production' && isTrackingEnabled && pixelId && (
          <>
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  if (typeof window !== 'undefined') {
                    var host = window.location.hostname;
                    if (host.indexOf('localhost') !== -1 || host === '127.0.0.1' || host === '0.0.0.0') {
                      console.log('[Meta Pixel] Local development hostname detected. Tracking script initialization skipped.');
                    } else {
                      console.log('[Meta Pixel] Production environment detected (' + host + '). Initializing tracking...');
                      !function(f,b,e,v,n,t,s)
                      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                      n.queue=[];t=b.createElement(e);t.async=!0;
                      t.src=v;s=b.getElementsByTagName(e)[0];
                      s.parentNode.insertBefore(t,s)}(window, document,'script',
                      'https://connect.facebook.net/en_US/fbevents.js');
                      fbq('init', '${pixelId}');
                    }
                  }
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-background selection:bg-brand-navy/30">
        <Providers>
          <CommandPalette />
          {children}
        </Providers>
      </body>
    </html>
  );
}

