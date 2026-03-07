import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const leagueGothic = localFont({
  src: "../../public/fonts/LeagueGothic-Regular.otf",
  variable: "--font-league-gothic",
  display: "swap",
});

const aldine = localFont({
  src: "../../public/fonts/Aldine721BT-Roman.ttf",
  variable: "--font-aldine",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediaOS",
  description: "Campaign Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${leagueGothic.variable} ${aldine.variable} antialiased`}
        style={{ fontFamily: "'Aldine721 BT', serif" }}
      >
        {children}
      </body>
    </html>
  );
}
