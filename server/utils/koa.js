"use strict";

const stream = require('./stream.js');
const querystring = require('querystring');

const MAX_ACCEPT_LEN_DATA = require('../data').constants.max_accept_data_len;

/**
 * Mirror back request.
 *
 * Async function.
 *
 * @param {Context} ctx Koa app context.
 *
 * @returns {void}
 */
async function mirror(ctx) {
    const type = ctx.request.type;
    const len = ctx.request.length;

    ctx.body = {
        headers: ctx.request.headers,
        params: ctx.request.query
    };

    ctx.status = 200;

    if (!type || !len) return;

    if (len > MAX_ACCEPT_LEN_DATA) {
        ctx.status = 413;
        return;
    }

    ctx.body.payload = {
        type: ctx.request.type
    };

    if (ctx.request.is('text/*')) {
        ctx.body.payload.data = (await stream.read(ctx.req, len)).toString('utf-8');
    }
    else if (ctx.request.is('json')) {
        ctx.body.payload.data = JSON.parse((await stream.read(ctx.req, len)).toString('utf-8'));
    }
    else if (ctx.request.is('xml')) {
        ctx.body.payload.data = (await stream.read(ctx.req, len)).toString('utf-8');
    }
    else if (ctx.request.is('application/x-www-form-urlencoded')) {
        ctx.body.payload.data = querystring.parse((await stream.read(ctx.req, len)).toString('utf-8'));
    }
    else {
        ctx.body.payload.data = Array.from(await stream.read(ctx.req, len));
    }
}

module.exports = {
    mirror: mirror
};
