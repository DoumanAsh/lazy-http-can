"use strict";
const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const querystring = require('querystring');

const test = require('ava');
const sinon = require('sinon');

const stream_to_stub = require('../../server/utils/stream.js');
const utils = require('../../server/utils');
const MAX_ACCEPT_LEN_DATA = require('../../server/data').constants.max_accept_data_len;

class KoaContext {
    constructor(headers, query) {
        this.request = {
            headers: headers,
            query: query,
            is: () => false
        };
    }

    request_body(type, len) {
        this.request.length = len;
        this.request.type = type;
        this.req = "request";
        this.request.is = (type) => this.request.type.includes(type);
        return this;
    }
}

function default_request() {
    const request_headers = {
        test: "value",
        nested: {
            key: 1,
            key_arr: [1, 2]
        }
    };
    const request_query = {
        query1: "val1"
    };

    return {request_headers, request_query};
}

test('koa mirror request without body', async t => {
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);
    await utils.koa.mirror(context);

    t.is(context.status, 200);
    t.not(context.body, undefined);
    t.is(context.body.payload, undefined);
    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);
});

test('koa mirror request without len', async t => {
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);
    context.request.type = 'some';
    await utils.koa.mirror(context);

    t.is(context.status, 200);
    t.not(context.body, undefined);
    t.is(context.body.payload, undefined);
    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);
});

test('koa mirror request with too big len', async t => {
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);
    context.request.type = 'some';
    context.request.length = MAX_ACCEPT_LEN_DATA + 1;
    await utils.koa.mirror(context);

    t.is(context.status, 413);
    t.not(context.body, undefined);
    t.is(context.body.payload, undefined);
    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);
});

test.serial('koa mirror request with some random data', async t => {
    const type = 'random',
          len = 512;
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);

    context.request_body(type, len);

    const request_data = crypto.randomBytes(len);
    const stub_stream_read = sinon.stub(stream_to_stub, "read")
                                  .withArgs(context.req, len)
                                  .returns(request_data);

    await utils.koa.mirror(context);

    t.is(context.status, 200);
    t.not(context.body, undefined);

    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);

    t.true(stub_stream_read.called);
    t.not(context.body.payload, undefined);
    t.is(context.body.payload.type, type);
    t.is(context.body.payload.data.length, len);
    t.deepEqual(context.body.payload.data, Array.from(request_data));

    stream_to_stub.read.restore();
});

test.serial('koa mirror request with some random text', async t => {
    const type = 'text/*',
          len = 512;
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);

    context.request_body(type, len);

    const request_data = Buffer.from("test string", "utf-8");
    const stub_stream_read = sinon.stub(stream_to_stub, "read")
                                  .withArgs(context.req, len)
                                  .returns(request_data);

    await utils.koa.mirror(context.request_body(type, len));

    t.is(context.status, 200);
    t.not(context.body, undefined);

    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);

    t.true(stub_stream_read.called);
    t.not(context.body.payload, undefined);
    t.is(context.body.payload.type, type);
    t.is(context.body.payload.data, request_data.toString('utf-8'));

    stream_to_stub.read.restore();
});

test.serial('koa mirror request with some random json', async t => {
    const type = 'json',
          len = 512;
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);

    context.request_body(type, len);

    const request_data = {
        random: 1,
        nested_random: {
            key: "value"
        }
    };

    const stub_returns = Buffer.from(JSON.stringify(request_data));

    const stub_stream_read = sinon.stub(stream_to_stub, "read")
                                  .withArgs(context.req, len)
                                  .returns(stub_returns);

    await utils.koa.mirror(context.request_body(type, len));

    t.is(context.status, 200);
    t.not(context.body, undefined);

    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);

    t.true(stub_stream_read.called);
    t.not(context.body.payload, undefined);
    t.is(context.body.payload.type, type);
    t.deepEqual(context.body.payload.data, request_data);

    stream_to_stub.read.restore();
});

test.serial('koa mirror request with some random form data', async t => {
    const type = 'application/x-www-form-urlencoded',
          len = 512;
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);

    context.request_body(type, len);

    const request_data = {
        random: "1",
        request: "true"
    };

    const stub_returns = Buffer.from(querystring.stringify(request_data));

    const stub_stream_read = sinon.stub(stream_to_stub, "read")
                                  .withArgs(context.req, len)
                                  .returns(stub_returns);

    await utils.koa.mirror(context.request_body(type, len));

    t.is(context.status, 200);
    t.not(context.body, undefined);

    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);

    t.true(stub_stream_read.called);
    t.not(context.body.payload, undefined);
    t.is(context.body.payload.type, type);
    t.deepEqual(context.body.payload.data, request_data);

    stream_to_stub.read.restore();
});

test.serial('koa mirror request with some random xml', async t => {
    const type = 'xml',
          len = 512;
    const {request_headers, request_query} = default_request();
    const context = new KoaContext(request_headers, request_query);

    context.request_body(type, len);

    const request_data = `
        <test>
            <name>Random XML</name>
        </test>
    `;

    const stub_returns = Buffer.from(request_data);

    const stub_stream_read = sinon.stub(stream_to_stub, "read")
                                  .withArgs(context.req, len)
                                  .returns(stub_returns);

    await utils.koa.mirror(context.request_body(type, len));

    t.is(context.status, 200);
    t.not(context.body, undefined);

    t.deepEqual(context.body.headers, request_headers);
    t.deepEqual(context.body.params, request_query);

    t.true(stub_stream_read.called);
    t.not(context.body.payload, undefined);
    t.is(context.body.payload.type, type);
    t.deepEqual(context.body.payload.data, request_data);

    stream_to_stub.read.restore();
});
