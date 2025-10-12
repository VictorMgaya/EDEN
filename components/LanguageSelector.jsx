"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as flags from 'country-flag-icons/react/3x2';

const languageMetadata = {
    en: {
        name: 'English',
        Flag: flags.GB,
        code: 'en',
        alt: 'English language selection - United Kingdom flag',
        regions: ['GB', 'US', 'CA', 'AU', 'NZ'],
        ariaLabel: 'Select English language'
    },
    es: {
        name: 'Español',
        Flag: flags.ES,
        code: 'es',
        alt: 'Selección de idioma español - Bandera de España',
        regions: ['ES', 'MX', 'AR', 'CO', 'CL'],
        ariaLabel: 'Seleccionar idioma español'
    },
    fr: {
        name: 'Français',
        Flag: flags.FR,
        code: 'fr',
        alt: 'Sélection de la langue française - Drapeau de la France',
        regions: ['FR', 'CA', 'BE', 'CH', 'LU'],
        ariaLabel: 'Sélectionner la langue française'
    },
    ar: {
        name: 'العربية',
        Flag: flags.SA,
        code: 'ar',
        alt: 'اختيار اللغة العربية - علم المملكة العربية السعودية',
        regions: ['SA', 'AE', 'EG', 'MA', 'KW'],
        ariaLabel: 'اختر اللغة العربية'
    },
    zh: {
        name: '中文',
        Flag: flags.CN,
        code: 'zh-CN',
        alt: '选择中文 - 中国国旗',
        regions: ['CN', 'TW', 'HK', 'SG', 'MY'],
        ariaLabel: '选择中文'
    },
    hi: {
        name: 'हिंदी',
        Flag: flags.IN,
        code: 'hi',
        alt: 'हिंदी भाषा चयन - भारत का झंडा',
        regions: ['IN', 'NP', 'FJ'],
        ariaLabel: 'हिंदी भाषा चुनें'
    },
    sw: {
        name: 'Kiswahili',
        Flag: flags.TZ,
        code: 'sw',
        alt: 'Chagua lugha ya Kiswahili - Bendera ya Tanzania',
        regions: ['TZ', 'KE', 'UG', 'RW', 'BI'],
        ariaLabel: 'Chagua Kiswahili'
    }
    // ...existing languages...
};

const LanguageSelector = () => {
    const [mounted, setMounted] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Add device language detection
    useEffect(() => {
        try {
            // Get device language and clean it (e.g., 'en-US' becomes 'en')
            const deviceLang = navigator.language.split('-')[0];
            // Get previously saved language or use device language if supported
            const savedLang = localStorage.getItem('language');
            const defaultLang = languageMetadata[deviceLang] ? deviceLang : 'en';
            const initialLang = savedLang || defaultLang;

            setCurrentLanguage(initialLang);
            localStorage.setItem('language', initialLang);
            document.documentElement.lang = initialLang;
            setMounted(true);

            // Initialize translation after setting language
            const timer = setTimeout(() => {
                initializeTranslation(initialLang);
            }, 1000);

            return () => clearTimeout(timer);
        } catch (error) {
            console.warn('Language initialization fallback to English');
            setCurrentLanguage('en');
            setMounted(true);
        }
    }, []);

    const initializeTranslation = useCallback((lang) => {
        if (window.google?.translate) return;

        try {
            const script = document.createElement('script');
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;

            window.googleTranslateElementInit = () => {
                try {
                    new window.google.translate.TranslateElement({
                        pageLanguage: lang || 'en',
                        includedLanguages: Object.values(languageMetadata).map(l => l.code).join(','),
                        autoDisplay: false,
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                    }, 'google_translate_element');
                } catch (e) {
                    console.warn('Translation initialization delayed');
                }
            };

            document.body.appendChild(script);
        } catch (error) {
            console.warn('Translation service temporarily unavailable');
        }
    }, []);

    const handleLanguageChange = useCallback((lang) => {
        if (!mounted || isTranslating) return;
        setIsOpen(false);
        setIsTranslating(true);

        try {
            setCurrentLanguage(lang);
            localStorage.setItem('language', lang);

            // Handle translation with retry
            const attemptTranslation = (retries = 3) => {
                const select = document.querySelector('.goog-te-combo');
                if (select) {
                    select.value = languageMetadata[lang].code;
                    select.dispatchEvent(new Event('change'));
                    setIsTranslating(false);
                } else if (retries > 0) {
                    setTimeout(() => attemptTranslation(retries - 1), 500);
                }
            };

            attemptTranslation();
        } catch (error) {
            console.warn('Language switch delayed');
            setIsTranslating(false);
        }
    }, [mounted, isTranslating]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!mounted) {
        return <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-blue-200 dark:border-gray-700 opacity-50">...</div>;
    }

    const CurrentFlag = languageMetadata[currentLanguage]?.Flag;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-gray-700">
            <div
                className="relative"
                ref={dropdownRef}
                role="region"
                aria-label="Language selection"
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isTranslating}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label={languageMetadata[currentLanguage].ariaLabel}
                    className={`flex items-center gap-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-xl px-4 py-3 cursor-pointer hover:shadow-lg transition-all duration-300 w-full ${
                        isTranslating ? 'opacity-50 cursor-wait' : ''
                    }`}
                >
                    {CurrentFlag && (
                        <CurrentFlag
                            className="w-5 h-5"
                            role="img"
                            aria-label={languageMetadata[currentLanguage].alt}
                            title={languageMetadata[currentLanguage].alt}
                        />
                    )}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{languageMetadata[currentLanguage].name}</span>
                    <span className="ml-auto text-gray-500">▼</span>
                </button>

                {isOpen && (
                    <div
                        className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-xl shadow-xl z-50"
                        role="listbox"
                        aria-label="Available languages"
                    >
                        {Object.entries(languageMetadata).map(([code, { name, Flag, alt, ariaLabel }]) => (
                            <button
                                key={code}
                                onClick={() => handleLanguageChange(code)}
                                role="option"
                                aria-selected={currentLanguage === code}
                                lang={code}
                                title={alt}
                                className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors rounded-xl ${
                                    currentLanguage === code ? 'bg-gradient-to-r from-blue-100 to-green-100 dark:from-gray-600 dark:to-gray-500' : ''
                                }`}
                            >
                                <Flag
                                    className="w-5 h-5"
                                    role="img"
                                    aria-label={alt}
                                    title={alt}
                                />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div id="google_translate_element" className="hidden" aria-hidden="true" />
            </div>
        </div>
    );
};

export default LanguageSelector;
