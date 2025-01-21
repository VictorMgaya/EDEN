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
import { Menu } from "lucide-react";

const Lexend = LexendFont({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const languages = {
  // European Languages
  en: { name: "English", dir: "ltr" },
  es: { name: "Español", dir: "ltr" },
  fr: { name: "Français", dir: "ltr" },
  de: { name: "Deutsch", dir: "ltr" },
  it: { name: "Italiano", dir: "ltr" },
  pt: { name: "Português", dir: "ltr" },
  nl: { name: "Nederlands", dir: "ltr" },
  pl: { name: "Polski", dir: "ltr" },
  ru: { name: "Русский", dir: "ltr" },
  uk: { name: "Українська", dir: "ltr" },
  sv: { name: "Svenska", dir: "ltr" },
  no: { name: "Norsk", dir: "ltr" },
  fi: { name: "Suomi", dir: "ltr" },
  da: { name: "Dansk", dir: "ltr" },
  cs: { name: "Čeština", dir: "ltr" },
  hu: { name: "Magyar", dir: "ltr" },
  ro: { name: "Română", dir: "ltr" },
  el: { name: "Ελληνικά", dir: "ltr" },

  // Asian Languages
  zh: { name: "中文", dir: "ltr" },
  ja: { name: "日本語", dir: "ltr" },
  ko: { name: "한국어", dir: "ltr" },
  vi: { name: "Tiếng Việt", dir: "ltr" },
  th: { name: "ไทย", dir: "ltr" },
  hi: { name: "हिन्दी", dir: "ltr" },
  bn: { name: "বাংলা", dir: "ltr" },
  id: { name: "Bahasa Indonesia", dir: "ltr" },
  ms: { name: "Bahasa Melayu", dir: "ltr" },
  tl: { name: "Filipino", dir: "ltr" },

  // Middle Eastern Languages
  ar: { name: "العربية", dir: "rtl" },
  fa: { name: "فارسی", dir: "rtl" },
  he: { name: "עברית", dir: "rtl" },
  tr: { name: "Türkçe", dir: "ltr" },
  ur: { name: "اردو", dir: "rtl" },

  // African Languages
  sw: { name: "Kiswahili", dir: "ltr" },
  am: { name: "አማርኛ", dir: "ltr" },
  ha: { name: "Hausa", dir: "ltr" },
  zu: { name: "isiZulu", dir: "ltr" },

  // Other Languages
  km: { name: "ខ្មែរ", dir: "ltr" },     // Khmer
  my: { name: "မြန်မာ", dir: "ltr" },   // Burmese
  ne: { name: "नेपाली", dir: "ltr" },    // Nepali
  si: { name: "සිංහල", dir: "ltr" },    // Sinhala
  ka: { name: "ქართული", dir: "ltr" },  // Georgian
  hy: { name: "Հայերեն", dir: "ltr" },  // Armenian
  ml: { name: "മലയാളം", dir: "ltr" },   // Malayalam
  ta: { name: "தமிழ்", dir: "ltr" },     // Tamil
  te: { name: "తెలుగు", dir: "ltr" },    // Telugu
  kn: { name: "ಕನ್ನಡ", dir: "ltr" },    // Kannada
};



export const Metadata = {
  title: "Eden App ",
  description: "The Resource Analysis Engine",
};

export default function RootLayout({ children, session }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Detect user's language based on IP
  useEffect(() => {
    async function detectUserLanguage() {
      try {
        const response = await fetch('https://api.ipapi.com/api/check?access_key=dcc9e593e0bba13644493c89b9ef291b');
        const data = await response.json();
        const userLang = data.languages?.code || 'en';
        if (languages[userLang]) {
          setCurrentLang(userLang);
          document.documentElement.lang = userLang;
          document.documentElement.dir = languages[userLang].dir;
        }
      } catch (error) {
        console.error('Error detecting language:', error);
      }
    }
    detectUserLanguage();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLang(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = languages[lang].dir;
    setShowLangMenu(false);
  };

  return (
    <html lang={currentLang} suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-9431888211578782" />
        <meta name="google-site-verification" content="xhS9AxO9_lnZW5qXS9B3tCziTO-v0E0pAv8OicFMsd4" />
      </head>
      <body
        className={`${Lexend.variable} min-h-screen`}
        style={{
          marginTop: "75px",
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

            {/* Language Selector */}
            <div className="fixed top-4 right-4 z-50">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800"
              >
                {languages[currentLang].name}
                <Menu size={16} />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg">
                  {Object.entries(languages).map(([code, { name }]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

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