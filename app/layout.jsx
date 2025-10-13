"use client";

import React from 'react';
import { Lexend as LexendFont } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import Header from "@/components/Header";
import Loading from "@/components/Loader";
import LoadingProgressBar from "@/components/LoadingProgressBar"; // Import the new component
import { NextAuthProvider } from "./providers";
import { LanguageProvider } from '@/context/LanguageContext';
import { languageMetadata, seoByRegion } from '@/config/languages';
import SidebarComponent from "@/components/SidebarComponent";

const Lexend = LexendFont({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const defaultMetadata = {
  title: "Eden",
  description: "The Resource Analysis Engine",
  image: "https://edenapp.site/eden.svg",
  type: "App"
};

const seoTranslations = {
  en: {
    title: "Eden - Resource Analysis Engine",
    description: "Advanced resource analysis and management platform",
    keywords: "resource analysis, management, analytics, English"
  },
  es: {
    title: "Eden - Motor de Análisis de Recursos",
    description: "Plataforma avanzada de análisis y gestión de recursos",
    keywords: "análisis de recursos, gestión, análisis, Español"
  },
  fr: {
    title: "Eden - Moteur d'Analyse des Ressources",
    description: "Plateforme avancée d'analyse et de gestion des ressources",
    keywords: "analyse des ressources, gestion, analytique, Français"
  },
  ar: {
    title: "عدن - محرك تحليل الموارد",
    description: "منصة متقدمة لتحليل وإدارة الموارد",
    keywords: "تحليل الموارد، إدارة، تحليلات، العربية"
  },
  zh: {
    title: "Eden - 资源分析引擎",
    description: "高级资源分析和管理平台",
    keywords: "资源分析, 管理, 分析, 中文"
  },
  hi: {
    title: "Eden - संसाधन विश्लेषण इंजन",
    description: "उन्नत संसाधन विश्लेषण और प्रबंधन मंच",
    keywords: "संसाधन विश्लेषण, प्रबंधन, विश्लेषण, हिंदी"
  },
  sw: {
    title: "Eden - Injini ya Uchambuzi wa Rasilimali",
    description: "Jukwaa la hali ya juu la uchambuzi na usimamizi wa rasilimali",
    keywords: "uchambuzi wa rasilimali, usimamizi, uchanganuzi, Kiswahili"
  },
  pt: {
    title: "Eden - Motor de Análise de Recursos",
    description: "Plataforma avançada de análise e gestão de recursos",
    keywords: "análise de recursos, gestão, análise, Português"
  },
  de: {
    title: "Eden - Ressourcenanalyse-Engine",
    description: "Fortschrittliche Plattform für Ressourcenanalyse und -management",
    keywords: "Ressourcenanalyse, Management, Analytik, Deutsch"
  }
};

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true); // Existing full-page loader state
  const [loadingProgress, setLoadingProgress] = useState(0); // New state for progress bar
  const [isProgressBarVisible, setIsProgressBarVisible] = useState(false); // New state for progress bar visibility
  const [pageBlurAmount, setPageBlurAmount] = useState(0); // New state for page blur effect
  const [pageMetadata, setPageMetadata] = useState(defaultMetadata);
  const [currentLang, setCurrentLang] = useState('en');
  const [textDirection, setTextDirection] = useState('ltr');

  useEffect(() => {
    const detectUserLanguage = () => {
      try {
        const deviceLang = navigator.language.split('-')[0];
        const langCode = deviceLang.split('-')[0];

        if (languageMetadata[langCode]) {
          setCurrentLang(langCode);
          setTextDirection(languageMetadata[langCode].dir);
          document.documentElement.lang = langCode;
          document.documentElement.dir = languageMetadata[langCode].dir;
          localStorage.setItem('language', langCode);
        }
      } catch (error) {
        console.warn('Language detection fallback to English');
      }
    };

    detectUserLanguage();

    // Existing full-page loader timeout
    const fullPageLoaderTimeout = setTimeout(() => setLoading(false), 1000);

    // Progress bar and blur logic
    let progressInterval;
    let blurInterval;

    const handleStartProgressBar = () => {
      setIsProgressBarVisible(true);
      setLoadingProgress(0); // Start from 0
      setPageBlurAmount(10); // Start with blur

      progressInterval = setInterval(() => {
        setLoadingProgress(oldProgress => {
          const newProgress = oldProgress + 5; // Smooth increment
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 100); // Update every 100ms

      // Gradually reduce blur as progress increases
      blurInterval = setInterval(() => {
        setPageBlurAmount(oldBlur => {
          const newBlur = oldBlur - 0.5; // Gradually reduce blur
          if (newBlur <= 0) {
            clearInterval(blurInterval);
            return 0;
          }
          return newBlur;
        });
      }, 50); // Update blur more frequently for smoothness
    };

    const handleCompleteProgressBar = () => {
      clearInterval(progressInterval);
      clearInterval(blurInterval);
      setLoadingProgress(100);
      setPageBlurAmount(0); // Ensure no blur at the end
      setTimeout(() => {
        setIsProgressBarVisible(false);
        setLoadingProgress(0); // Reset for next load
      }, 500); // Fade out duration for the bar
    };

    // Trigger progress bar on initial mount and subsequent pathname changes
    handleStartProgressBar();
    // Simulate completion after a fixed duration, or when actual page content is ready
    const routeChangeCompleteTimeout = setTimeout(handleCompleteProgressBar, 2000); // Increased duration for blur effect

    return () => {
      clearTimeout(fullPageLoaderTimeout);
      clearInterval(progressInterval);
      clearInterval(blurInterval);
      clearTimeout(routeChangeCompleteTimeout);
    };
  }, [pathname]); // Re-run effect when pathname changes

  const alternateLanguages = Object.keys(languageMetadata).map(lang => (
    <link
      key={lang}
      rel="alternate"
      hrefLang={lang}
      href={`https://edenapp.site${pathname}?lang=${lang}`}
    />
  ));

  return (
    <html lang={currentLang} dir={textDirection} suppressHydrationWarning>
      <head>
        <title>{seoTranslations[currentLang]?.title || seoTranslations.en.title}</title>
        <meta name="description" content={seoTranslations[currentLang]?.description || seoTranslations.en.description} />
        <meta name="keywords" content={seoTranslations[currentLang]?.keywords || seoTranslations.en.keywords} />

        {/* Language alternate links */}
        {Object.keys(languageMetadata).map(lang => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`https://edenapp.site${pathname}?lang=${lang}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`https://edenapp.site${pathname}`} />

        {/* Structured data for international targeting */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": `https://edenapp.site${pathname}`,
            "name": seoTranslations[currentLang]?.title,
            "description": seoTranslations[currentLang]?.description,
            "inLanguage": currentLang,
            "availableLanguages": Object.keys(languageMetadata),
            "audience": {
              "@type": "Audience",
              "geographicArea": languageMetadata[currentLang]?.regions
            }
          })
        }} />

        {/* Add region-specific meta tags */}
        {languageMetadata[currentLang]?.regions.map(region => (
          <meta
            key={region}
            name="geo.region"
            content={`${seoByRegion[region]?.region || ''}`}
          />
        ))}

        {/* Existing meta tags and scripts */}
        <link
          rel="canonical"
          href={`https://edenapp.site${pathname}`}
        />

        <meta name="description" content={pageMetadata.description} />
        <meta property="og:title" content={pageMetadata.title} />
        <meta property="og:description" content={pageMetadata.description} />
        <meta property="og:image" content={pageMetadata.image} />
        <meta property="og:type" content={pageMetadata.type} />
        <meta property="og:locale" content={currentLang} />
        {alternateLanguages}
        {Object.keys(languageMetadata).map(lang => (
          <meta key={lang} property="og:locale:alternate" content={lang} />
        ))}

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
        <meta name="msvalidate.01" content="3D027736EF5CFEE53D03C112F845FE16" />
        <meta name="yandex-verification" content="ccf10bbb05eec883" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Eden" />
        <meta name="application-name" content="Eden" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA Icons for Apple */}
        <link rel="apple-touch-icon" sizes="180x180" href="/edenlogo.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/edenlogo.svg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/edenlogo.svg" />
        <link rel="apple-touch-icon" sizes="76x76" href="/edenlogo.svg" />

        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(function(registration) {
                    console.log('[SW] Registered successfully with scope:', registration.scope);

                    // Handle updates
                    registration.addEventListener('updatefound', function() {
                      const newWorker = registration.installing;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed') {
                          if (navigator.serviceWorker.controller) {
                            // New content available, notify user
                            if (confirm('New version available! Reload to update?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                              window.location.reload();
                            }
                          }
                        }
                      });
                    });
                  }).catch(function(error) {
                    console.log('[SW] Registration failed:', error);
                  });
              });
            }
          `
        }} />
      </head>
      <body
        className={`${Lexend.variable} h-screen`}
        style={{
          position: "relative",
          top: "0",
          bottom: "0"
        }}
      >
        <LoadingProgressBar progress={loadingProgress} isVisible={isProgressBarVisible} /> {/* Add the progress bar */}
        <NextAuthProvider>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarComponent>
                {pathname !== "/auth" && pathname !== "/" && <Header />}
                <div
                  style={{
                    filter: `blur(${pageBlurAmount}px)`,
                    transition: 'filter 0.5s ease-in-out', // Changed to ease-in-out
                  }}
                >
                  {loading ? <Loading /> : <>{children}</>}
                </div>
                {pathname !== '/auth' && pathname !== '/Experts' && <Footer />}
              </SidebarComponent>
            </ThemeProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
