/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const generateSitemap = require('../utils/sitemapGenerator');

router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const sitemap = await generateSitemap(baseUrl);

        res.header('Content-Type', 'application/xml');
        res.send(sitemap.toString());
    } catch (error) {
        res.status(500).end();
    }
});

module.exports = router;
