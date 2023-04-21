'use strict';

import path from 'node:path'
import execa from 'execa'

const CLI = path.join(__dirname, '../bin/cli.js');
const bin = () => (...args) => execa(CLI, args);

test('ucli inValid Command', async () => {
    const { stderr } = await bin()('iii')
    expect(stderr).toContain('无效的命令')
});

test('ucli --help', async() =>{
    let err = null
    try {
        await bin()('--help')
    } catch (e) {
        err = e
    }
    expect(err).toBeNull()
})

test('ucli init', async() =>{
    let err = null
    try {
        await bin()('init -f')
    } catch (e) {
        err = e
    }
    expect(err).toBeNull()
})