"use client";

import { Lexend as LexendFont } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import Header from "@/components/Header";
import Loading from "@/components/Loader";
import { NextAuthProvider } from "./providers";

const Lexend = LexendFont({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

// Define metadata as a constant
const defaultMetadata = {
  title: "Eden",
  description: "The Resource Analysis Engine",
  image: "https://edenapp.site/eden.svg",
  type: "App"
};

export default function RootLayout({ children, session }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [pageMetadata, setPageMetadata] = useState(defaultMetadata);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta property="og:title" content={pageMetadata.title} />
        <meta property="og:description" content={pageMetadata.description} />
        <meta property="og:image" content={pageMetadata.image} />
        <meta property="og:type" content={pageMetadata.type} />

        {/* Your existing meta tags */}
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-54BWW075M3"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-54BWW075M3');
        `}} />
        <meta name="google-adsense-account" content="ca-pub-9431888211578782" />
        <meta name="google-site-verification" content="xhS9AxO9_lnZW5qXS9B3tCziTO-v0E0pAv8OicFMsd4" />
      </head>
      <body
        className={`${Lexend.variable} min-h-screen`}
        style={{
          marginTop: "60px",
          position: "relative",
          top: "0",
        }}
      >
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {pathname !== "/auth" && <Header />}
            {loading ? (
              <Loading />
            ) : (
              <>{children}</>
            )}
          </ThemeProvider>
          {pathname !== "/auth" && <Footer />}
        </NextAuthProvider>
      </body>
    </html>
  );
}