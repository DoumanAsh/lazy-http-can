"use strict";
const Router = require('koa-better-router');
const router = Router().loadMethods();

const data = require('./data');
const utils = require('./utils');

router.get('/', async (ctx) => {
    await data.index.stats.then((stats) => {
        ctx.response.lastModified = stats.mtime;
        ctx.response.type = 'text/html';
        ctx.response.length = stats.size;

        ctx.response.etag = `W/"${stats.size.toString(16)}-${stats.mtime.getTime().toString(16)}"`;

        ctx.response.status = 200; //should be set before fresh check

        if (ctx.request.fresh) {
            ctx.response.status = 304;
        }
        else {
            ctx.response.body = data.index.stream;
        }
    });

}).get('/ip', async (ctx) => {
    ctx.response.body = {ip: ctx.request.ip};

}).get('/mirror', utils.koa.mirror)
  .put('/mirror', utils.koa.mirror)
  .post('/mirror', utils.koa.mirror)
  .del('/mirror', utils.koa.mirror)
  .get('/params', async (ctx) => {
    ctx.body = ctx.query;

}).get('/status/:code', async (ctx) => {
    ctx.assert(!isNaN(ctx.params.code), 400, `Invalid status code ${ctx.params.code}. Not a number.`);
    ctx.assert(ctx.params.code.length === 3, 400, `Status code length should be 3 digits. According to RFC7231`);

    const status_code = parseInt(ctx.params.code);

    ctx.assert(status_code > 0, 400, `Status code cannot be negative`);

    // Bypass as otherwise it is a bad request.
    ctx.res.statusCode = status_code;

}).get('/bytes/:num', async (ctx) => {
    ctx.assert(!isNaN(ctx.params.num), 400, `Invalid number of bytes ${ctx.params.num}`);
    const num = parseInt(ctx.params.num);

    ctx.assert(num >= 0, 400, `Negative number of bytes is not possible`);
    ctx.body = new utils.stream.RandomData(num);

}).get('/headers', async (ctx) => {
    ctx.response.body = ctx.request.headers;

}).get('/header/:header', async (ctx) => {
    const header = ctx.params.header.toLowerCase();
    ctx.response.status = 200;

    if (header in ctx.request.headers) {
        ctx.response.body = { [header]: ctx.request.headers[header] };
    }
    else {
        ctx.response.body = {};
    }

}).get('/response/:type', async (ctx) => {
    const type = ctx.params.type.toLowerCase();
    const response_map = {
        'headers': () =>  {
            for (let key in ctx.query) {
                ctx.response.set(key, ctx.query[key]);
            }
            ctx.body = '';
        },
        'body': () => ctx.body = ctx.query,
        'all': function() {
            this.headers();
            this.body();
        }
    };

    ctx.assert(type in response_map, 400, `Invalid unicode request type ${type}`);

    response_map[type]();

    ctx.status = 200;

}).get('/unicode/:type', async (ctx) => {
    const type = ctx.params.type.toLowerCase();
    const body_map = {
        'text': data.unicode_demo.txt,
        'bytes': data.unicode_demo.bytes,
        'stream': data.unicode_demo.stream
    };

    ctx.assert(type in body_map, 400, `Invalid unicode request type ${type}`);

    ctx.body = body_map[type];
    ctx.status = 200;

}).get('/delay/:ms', async (ctx) => {
    ctx.assert(!isNaN(ctx.params.ms), 400, `Invalid delay ${ctx.params.ms}. Not a number.`);

    const delay = parseInt(ctx.params.ms);

    ctx.assert(delay >= 0, 400, `Invalid delay ${ctx.params.ms}. Delay cannobe negative.`);

    ctx.status = 200;
    ctx.body = '';
    await new Promise(resolve => {
        setTimeout(()=> {
            resolve();
        }, delay);
    });
});

module.exports = () => {
    return router.middleware();
};
