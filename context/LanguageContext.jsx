"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState('en');

    const changeLanguage = (lang) => {
        setCurrentLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;

        const googleTranslate = document.querySelector('.goog-te-combo');
        if (googleTranslate) {
            googleTranslate.value = lang;
            googleTranslate.dispatchEvent(new Event('change'));
        }
    };

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') || 'en';
        setCurrentLanguage(savedLanguage);

        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false,
            }, 'google_translate_element');
        };
    }, []);

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
