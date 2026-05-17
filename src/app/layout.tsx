import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orvion — Goal Setting & Tracking Portal",
  description: "A structured, digital goal setting and tracking portal for organizations. Manage employee goals, quarterly check-ins, and performance visibility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
