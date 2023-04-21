#!/usr/bin/env node
import importLocal from 'import-local';
import { log } from '@e.ucli/utils';
import { fileURLToPath } from 'node:url'
import entry from '../lib/index.js'
// import { filename } from 'dirname-filename-esm'
// const __filename = filename(import.meta)

const __filename = fileURLToPath(import.meta.url)

if (importLocal(__filename)) {
    log.info('cli', '正在使用 local 版本');
} else {
    entry(process.argv.slice(2))
}