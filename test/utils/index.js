"use strict";

const test = require('ava');

const Buffer = require('buffer').Buffer;
const utils = require('../../server/utils');

function read_stream(stream) {
    return new Promise(resolve => {
        let result = Buffer.alloc(0);

        stream.on('data', (data) => {
            result = Buffer.concat([result, data], result.length + data.length);
        });
        stream.on('end', () => {
            resolve(result);
        });
    });

}

test('stream RandomData & read', async t => {
    async function tester(data_len) {
        let stream = new utils.stream.RandomData(data_len);
        const buffer = await read_stream(stream);
        stream = new utils.stream.RandomData(data_len);
        const buffer_utils = await utils.stream.read(stream, data_len);

        t.is(buffer.length, data_len);
        t.is(buffer.length, buffer_utils.length);
    }

    for (let data_len of [0, 2, 4, 512, 1024, 5000]) {
        await tester(data_len);
    }
});
