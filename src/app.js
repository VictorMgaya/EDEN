/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const sitemapRouter = require('./routes/sitemap');

const app = express();

// Other middleware and routes...
app.use('/', sitemapRouter);
