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
        return <div className="language-selector-container opacity-50">...</div>;
    }

    const CurrentFlag = languageMetadata[currentLanguage]?.Flag;

    return (
        <div
            className="language-selector-container relative"
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
                className={`flex items-center gap-2 bg-transparent border border-green-500 rounded px-3 py-1 cursor-pointer 
                    hover:bg-green-500/10 transition-colors w-full
                    ${isTranslating ? 'opacity-50 cursor-wait' : ''}`}
            >
                {CurrentFlag && (
                    <CurrentFlag
                        className="w-4 h-4"
                        role="img"
                        aria-label={languageMetadata[currentLanguage].alt}
                        title={languageMetadata[currentLanguage].alt}
                    />
                )}
                <span>{languageMetadata[currentLanguage].name}</span>
                <span className="ml-auto">▼</span>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-green-500 rounded-md shadow-lg z-50"
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
                            className={`flex items-center gap-2 w-full px-3 py-2 hover:bg-green-500/10 transition-colors
                                ${currentLanguage === code ? 'bg-green-500/5' : ''}`}
                        >
                            <Flag
                                className="w-4 h-4"
                                role="img"
                                aria-label={alt}
                                title={alt}
                            />
                            <span>{name}</span>
                        </button>
                    ))}
                </div>
            )}
            <div id="google_translate_element" className="hidden" aria-hidden="true" />
        </div>
    );
};

export default LanguageSelector;