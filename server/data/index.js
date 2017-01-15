"use strict";

const fs = require('fs');
const path = require('path');

const index_file_path = path.join(__dirname, 'index.html');
const unicode_demo_file_path = path.join(__dirname, 'UTF-8-demo.txt');
const unicode_demo_file = fs.readFileSync(unicode_demo_file_path);

module.exports = {
    unicode_demo: {
        bytes: unicode_demo_file,
        get txt () {
            return this.bytes.toString('utf-8');
        },
        get stream () {
            return fs.createReadStream(unicode_demo_file_path);
        }
    },
    index: {
        get stream () {
            return fs.createReadStream(index_file_path);
        },
        get stats () {
            return new Promise((resolve, reject) => {
                fs.stat(index_file_path, (error, stats) => {
                    if (error) reject(error);

                    resolve(stats);
                });
            });
        }
    },
    constants: {
        max_accept_data_len: 1e6 //1mb
    }
};
