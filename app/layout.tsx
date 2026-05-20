import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKG TRAVEL | Delete Account",
  description:
    "Request deletion of your SKG TRAVEL user or driver account and associated data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
