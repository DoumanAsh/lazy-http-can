"use strict";
const Buffer = require('buffer').Buffer;
const Readable = require('stream').Readable;

const crypto = require('crypto');

/**
 * Stream with random data generation.
 */
class RandomData extends Readable {
    /**
     * @constructor
     *
     * @param {Number} len Number of bytes to generate.
     * @param {Object} options stream.Readable options.
     */
    constructor(len, options) {
        super(options);
        this._to_bytes = len;
        this._read_len = 512;
    }

    _read() {
        if (this._to_bytes > 0) {
            if (this._to_bytes < this._read_len) {
                this.push(crypto.randomBytes(this._to_bytes));
                this.push(null);
            }
            else {
                this.push(crypto.randomBytes(this._read_len));
                this._to_bytes -= this._read_len;
            }
        }
        else {
            this.push(null);
        }
    }
}

/**
 * Promises to read data from stream and returns buffer.
 *
 * @param {Stream} stream Node.js readable stream.
 * @param {Number} len Length of data to read. Used to pre-allocated result buffer.
 *
 * @returns {Buffer} Content of stream.
 */
function read_stream(stream, len) {
    return new Promise(resolve => {
        let cursor = 0;
        const result = Buffer.allocUnsafe(len);

        stream.on('data', (data) => {
            cursor += data.copy(result, cursor);
        });
        stream.on('end', () => {
            resolve(result);
        });
    });
}

module.exports = {
    read: read_stream,
    RandomData: RandomData
};
