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
import { NextAuthProvider } from "./providers";
import { LanguageProvider } from '@/context/LanguageContext';
import { languageMetadata, seoByRegion } from '@/config/languages';

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

export default function RootLayout({ children, session }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
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
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

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
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {pathname !== "/auth" && <Header />}
              {loading ? <Loading /> : <>{children}</>}
              {pathname !== "/auth" && <Footer />}
            </ThemeProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}