"use strict";

const Koa = require('koa');
const helmet = require('koa-helmet');
const router = require('./router.js');

const app = new Koa();

app.use(helmet());

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.body = { error: err.message };
        ctx.status = err.status || 500;
    }
});

app.use(router());

app.use(async (ctx, next) => {
    if (!ctx.route) {
        ctx.body = "<h1>Not Found</h1>";
        ctx.status = 404;
    }

    await next();
});

module.exports = app;
