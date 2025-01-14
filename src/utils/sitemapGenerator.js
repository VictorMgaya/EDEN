/* eslint-disable @typescript-eslint/no-require-imports */
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');

async function generateSitemap(baseUrl) {
    const links = [
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/crops', changefreq: 'daily', priority: 0.8 },
        { url: '/analysis', changefreq: 'daily', priority: 0.7 },
        { url: '/about', changefreq: 'monthly', priority: 0.5 },
        { url: '/contact', changefreq: 'monthly', priority: 0.5 }
    ];

    const stream = new SitemapStream({ hostname: baseUrl });
    return streamToPromise(Readable.from(links).pipe(stream));
}

module.exports = generateSitemap;
