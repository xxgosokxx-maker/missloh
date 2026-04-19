import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miss Loh Tutoring",
  description: "AI picture-book language learning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
