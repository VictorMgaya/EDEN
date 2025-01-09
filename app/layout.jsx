"use client"; // Add this to make the file a client component

import { Lexend as LexendFont } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Footer from "@/components/footer"

//components
import Header from "@/components/Header";
import Loader from "@/components/Loader"; // Import your loader component

const Lexend = LexendFont({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const Metadata = {
  title: "Eden App",
  description: "{crop.description}",
};

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading delay (e.g., API call)
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-54BWW075M3"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-54BWW075M3');
          `
        }} />
        <meta name="google-adsense-account" content="ca-pub-9431888211578782"></meta>
        <meta name="google-site-verification" content="xhS9AxO9_lnZW5qXS9B3tCziTO-v0E0pAv8OicFMsd4" />
      </head>
      <body
        className={Lexend.variable}
        style={{
          marginTop: "75px",
          position: "relative", // Ensures it doesn't adjust based on other elements
          top: "0", // Prevents any unintentional shifting
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {pathname !== "/auth" && <Header />}
          {loading ? (
            <Loader /> // Display loader when in loading state
          ) : (
            children
          )}
        </ThemeProvider>
        <Footer />
      </body>
    </html>
  );
}
