/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');

async function pingSearchEngines(sitemapUrl) {
    const engines = [
        `http://www.google.com/ping?sitemap=${sitemapUrl}`,
        `http://www.bing.com/ping?sitemap=${sitemapUrl}`
    ];

    return Promise.all(
        engines.map(engine => axios.get(engine))
    );
}

module.exports = pingSearchEngines;
