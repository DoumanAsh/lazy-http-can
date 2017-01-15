"use strict";

const querystring = require('querystring');
const data = require('../server/data');
const utils = require('../server/utils');
const app = require('../server');

const test = require('ava');
const sinon = require('sinon');
const assert_request = require('assert-request')(app.listen());

test('get /-unknown', () => {
    return assert_request.get('/-unknown')
                         .body('<h1>Not Found</h1>')
                         .status(404);
});

test.serial('get / Internal error 500', async t => {
    const expected_response = {
        error: "Internal error"
    };

    const index_stats = sinon.stub(data.index, 'stats', {
        get: function () {
            return new Promise((resolve, reject) => {
                reject(new Error(expected_response.error));
            });
        }
    });

    await assert_request.get('/')
                        .status(500)
                        .json(expected_response);

    t.true(index_stats.get.called);
    index_stats.restore();
});

test('get /', async t => {
    const dummy_stream = "dummy";
    const dummy_stats = {
        mtime: new Date(),
        size: 666
    };
    const expected_etag = `W/"${dummy_stats.size.toString(16)}-${dummy_stats.mtime.getTime().toString(16)}"`;

    const index_stats = sinon.stub(data.index, 'stats', {
        get: function () {
            return new Promise((resolve) => {
                resolve(dummy_stats);
            });
        }
    });
    const index_stream = sinon.stub(data.index, 'stream', {
        get: function () {
            return dummy_stream;
        }
    });

    await assert_request.get('/')
                        .status(200)
                        .header('content-length', dummy_stream.length)
                        .header('etag', expected_etag)
                        .body(dummy_stream);

    t.true(index_stats.get.called);
    t.true(index_stream.get.called);
    index_stats.restore();
    index_stream.restore();
});

test.serial('get / not modified 304', async t => {
    const dummy_stream = "dummy";
    const dummy_stats = {
        mtime: new Date(),
        size: 666
    };

    const expected_etag = `W/"${dummy_stats.size.toString(16)}-${dummy_stats.mtime.getTime().toString(16)}"`;

    const add_headers = {
        "If-Modified-Since": dummy_stats.mtime.toUTCString(),
        "If-None-Match": expected_etag
    };

    const index_stats = sinon.stub(data.index, 'stats', {
        get: function () {
            return new Promise((resolve) => {
                resolve(dummy_stats);
            });
        }
    });
    const index_stream = sinon.stub(data.index, 'stream', {
        get: function () {
            return dummy_stream;
        }
    });

    await assert_request.get('/', {headers: add_headers})
                        .status(304)
                        .header('etag', expected_etag)
                        .body('');

    t.true(index_stats.get.called);
    t.true(!index_stream.get.called);
    index_stats.restore();
    index_stream.restore();
});

test('get /ip', () => {
    const expected_response = {
        ip: "::ffff:127.0.0.1"
    };

    return assert_request.get('/ip')
                         .type('application/json')
                         .status(200)
                         .json(expected_response);
});

test('get /params with NO params', () => {
    const expected_response = {
    };

    return assert_request.get('/params')
                         .type('application/json')
                         .status(200)
                         .json(expected_response);
});

test('get /params with some params', () => {
    const expected_response = {
        param1: "value1",
        param2: "value2"
    };

    return assert_request.get('/params?param1=value1&param2=value2')
                         .type('application/json')
                         .status(200)
                         .json(expected_response);
});

test('get /status Not a number', () => {
    const code = "invalid";
    const expected_response = {
        error: `Invalid status code ${code}. Not a number.`
    };

    return assert_request.get(`/status/${code}`)
                         .type('application/json')
                         .status(400)
                         .json(expected_response);
});

test('get /status Too small', () => {
    const code = 55;
    const expected_response = {
        error: `Status code length should be 3 digits. According to RFC7231`
    };

    return assert_request.get(`/status/${code}`)
                         .type('application/json')
                         .status(400)
                         .json(expected_response);
});

test('get /status Too big', () => {
    const code = 5555;
    const expected_response = {
        error: `Status code length should be 3 digits. According to RFC7231`
    };

    return assert_request.get(`/status/${code}`)
                         .type('application/json')
                         .status(400)
                         .json(expected_response);
});

test('get /status Negative code', () => {
    const code = -55;
    const expected_response = {
        error: "Status code cannot be negative"
    };

    return assert_request.get(`/status/${code}`)
                         .type('application/json')
                         .status(400)
                         .json(expected_response);
});

test('get /status non-existing code', () => {
    const code = 666;
    const expected_response = `${code}`;

    return assert_request.get(`/status/${code}`)
                         .status(code)
                         .body(expected_response);
});

test('get /status existing code', () => {
    const code = 201;
    const expected_response = `Created`;

    return assert_request.get(`/status/${code}`)
                         .status(code)
                         .body(expected_response);
});

test('get /bytes/:invalid', () => {
    const expected_response = {
        error: "Invalid number of bytes :invalid"
    };

    return assert_request.get("/bytes/:invalid")
                         .status(400)
                         .json(expected_response);
});

test('get /bytes/:negative', () => {
    const expected_response = {
        error: "Negative number of bytes is not possible"
    };

    return assert_request.get("/bytes/-1")
                         .status(400)
                         .json(expected_response);
});

test('get /bytes/400', async t => {
    const num = 400;

    const utils_stream_stub = sinon.stub(utils.stream, "RandomData");

    await assert_request.get("/bytes/" + num)
                        .status(200);

    t.true(utils_stream_stub.calledWithNew());
    t.true(utils_stream_stub.calledWith(num));
    utils.stream.RandomData.restore();
});

test('get /headers', () => {
    const add_headers = {
        custom_header: 'custom_value'
    };
    const code = 200;

    return assert_request.get("/headers", {headers: add_headers})
                         .status(code)
                         .body(/\"custom_header\"\s*:\s*\"custom_value\"/);
});

test('get /header/:existing', () => {
    const add_headers = {
        custom_header: 'custom_value'
    };
    const code = 200;

    return assert_request.get("/header/custom_header", {headers: add_headers})
                         .status(code)
                         .json(add_headers);
});

test('get /header/:non_existing', () => {
    const add_headers = {
        custom_header: 'custom_value'
    };
    const code = 200;

    return assert_request.get("/header/non_existing", {headers: add_headers})
                         .status(code)
                         .json({});
});

test('get /response/headers', () => {
    const params = {
        key: "value",
        key2: "value2"
    };
    const code = 200;

    return assert_request.get("/response/headers?" + querystring.stringify(params))
                         .status(code)
                         .header("key", "value")
                         .header("key2", "value2");
});

test('get /response/:invalid', () => {
    const params = {
        key: "value",
        key2: "value2"
    };
    const code = 400;
    const expected_response = {
        error: "Invalid unicode request type invalid"
    };

    return assert_request.get("/response/invalid?" + querystring.stringify(params))
                         .status(code)
                         .json(expected_response);
});

test('get /response/body', () => {
    const params = {
        key: "value",
        key2: "value2"
    };
    const code = 200;

    return assert_request.get("/response/body?" + querystring.stringify(params))
                         .status(code)
                         .json(params);
});

test('get /response/all', () => {
    const params = {
        key: "value",
        key2: "value2"
    };
    const code = 200;

    return assert_request.get("/response/all?" + querystring.stringify(params))
                         .status(code)
                         .header("key", "value")
                         .header("key2", "value2")
                         .json(params);
});

test('get /unicode/invalid', () => {
    const type = "invalid";
    const expected_response = {
        error: `Invalid unicode request type ${type}`
    };

    return assert_request.get(`/unicode/${type}`)
                         .status(400)
                         .json(expected_response);
});

test('get /unicode/text', async t => {
    const type = "text";
    const expected_response = "dummy_text";
    const stub_data = sinon.stub(data.unicode_demo, 'txt' , { get: function () { return expected_response; }});

    await assert_request.get(`/unicode/${type}`)
                        .status(200)
                        .body(expected_response);

    t.true(stub_data.get.called);
    stub_data.restore();
});

test('get /unicode/stream', async t => {
    const type = "stream";
    const expected_response = "dummy_stream";
    const stub_data = sinon.stub(data.unicode_demo, 'stream' , { get: function () { return expected_response; }});

    await assert_request.get(`/unicode/${type}`)
                        .status(200)
                        .body(expected_response);

    t.true(stub_data.get.called);
    stub_data.restore();
});

test('get /unicode/bytes', async () => {
    const old_data_bytes = data.unicode_demo.bytes;
    const type = "bytes";
    const expected_response = "dummy_bytes";

    data.unicode_demo.bytes = expected_response;

    await assert_request.get(`/unicode/${type}`)
                        .status(200)
                        .body(expected_response);

    data.unicode_demo.bytes = old_data_bytes;
});

test('get /delay Invalid timeout not a number', () => {
    const delay = 'g55';
    const expected_response = {
        error: `Invalid delay ${delay}. Not a number.`
    };

    return assert_request.get(`/delay/${delay}`)
                         .status(400)
                         .json(expected_response);

});

test('get /delay Invalid timeout negative', () => {
    const delay = '-55';
    const expected_response = {
        error: `Invalid delay ${delay}. Delay cannobe negative.`
    };

    return assert_request.get(`/delay/${delay}`)
                         .status(400)
                         .json(expected_response);

});

//Here we stub setTimeout so make test serial just to be on a safe side.
test.serial('get /delay 200000ms', async t => {
    const delay = 200000;

    const stub_timer = sinon.stub(global, "setTimeout")
                            .withArgs(sinon.match.any, delay)
                            .callsArg(0);

    const assert = await assert_request.get(`/delay/${delay}`)
                                       .status(200)
                                       .body('');

    t.true(stub_timer.called);
    setTimeout.restore();

    return assert;
});
