import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { readSessionHandle } from "@/lib/session";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Open Avatar",
  description:
    "Claimable public identity + local likeness/voice studio. Open Identity Card for people and agents.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const handle = await readSessionHandle();
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibm.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav handle={handle} />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
