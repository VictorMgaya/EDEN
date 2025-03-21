import { useEffect } from 'react';

export const useMetadata = (metadata: {
    title: string;
    description: string;
    image?: string;
    type?: string;
}) => {
    useEffect(() => {
        document.title = metadata.title;

        const metaTags = {
            'description': metadata.description,
            'og:title': metadata.title,
            'og:description': metadata.description,
            'og:image': metadata.image || '/default-image.jpg',
            'og:type': metadata.type || 'website',
            'twitter:card': 'summary_large_image',
            'twitter:title': metadata.title,
            'twitter:description': metadata.description,
            'twitter:image': metadata.image || '/default-image.jpg',
        };

        Object.entries(metaTags).forEach(([key, value]) => {
            const selector = key.startsWith('og:')
                ? `meta[property="${key}"]`
                : `meta[name="${key}"]`;

            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('content', value);
            }
        });
    }, [metadata]);
};
