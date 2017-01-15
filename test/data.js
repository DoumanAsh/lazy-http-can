"use strict";

const fs = require('fs');
const path = require('path');

const test = require('ava');
const sinon = require('sinon');

const data = require('../server/data');
const utils = require('../server/utils');

const INDEX_PATH = path.join(__dirname, '../server/data/index.html');

test('unicode demo', async t => {
    const bytes = data.unicode_demo.bytes;
    const string = data.unicode_demo.txt;
    const stream = data.unicode_demo.stream;

    t.is(bytes.toString('utf-8'), string, "Bytes representation differs from string representation");
    const stream_to_bytes = await utils.stream.read(stream, bytes.length);
    t.is(bytes.toString('utf-8'), stream_to_bytes.toString('utf-8'));
});

function fs_stats(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (error, stats) => {
            if (error) reject(error);

            resolve(stats);
        });
    });
}

test('index stats', async t => {
    const expected_stats = await fs_stats(INDEX_PATH);
    const stats = await data.index.stats;

    t.deepEqual(stats, expected_stats);
});

test('index stream', t => {
    const dummyStream = 1;
    const stub = sinon.stub(fs, "createReadStream")
                      .withArgs(INDEX_PATH)
                      .returns(dummyStream);

    const result = data.index.stream;

    t.true(stub.called);
    t.is(result, dummyStream);

    fs.createReadStream.restore();
});

//Serial tests are run one by one to ensure stability since mocks are used.
test.serial('index stats throws', async t => {
    sinon.stub(fs, "stat", function(_, callback) {
        callback(true);
    });

    t.throws(data.index.stats);

    fs.stat.restore();
});


