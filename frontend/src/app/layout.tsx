import type { Metadata } from "next";
import { Fraunces, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { ConfigWarning } from "@/components/ConfigWarning";
import { NetworkBanner } from "@/components/NetworkBanner";
import { ActivityProvider } from "@/providers/activity_provider";
import { ThemeProvider } from "@/providers/theme_provider";
import { Providers } from "@/providers/wagmi_provider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StakeProtocol",
  description: "Pre-funded time-based ERC20 staking protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
      >
        <ThemeProvider>
          <Providers>
            <ActivityProvider>
              <ConfigWarning />
              <NetworkBanner />
              {children}
            </ActivityProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
