import * as flags from 'country-flag-icons/react/3x2';

export const languageMetadata = {
    en: {
        name: 'English',
        Flag: flags.GB,
        code: 'en',
        alt: 'English language selection - United Kingdom flag',
        regions: ['GB', 'US', 'CA', 'AU', 'NZ'],
        ariaLabel: 'Select English language',
        dir: 'ltr'
    },
    es: {
        name: 'Español',
        Flag: flags.ES,
        code: 'es',
        alt: 'Selección de idioma español - Bandera de España',
        regions: ['ES', 'MX', 'AR', 'CO', 'CL'],
        ariaLabel: 'Seleccionar idioma español',
        dir: 'ltr'
    },
    // ...other languages with same structure
};

export const seoByRegion = {
    GB: { region: 'United Kingdom', market: 'UK Market' },
    US: { region: 'United States', market: 'US Market' },
    ES: { region: 'Spain', market: 'Spanish Market' },
    // ...other regions
};
