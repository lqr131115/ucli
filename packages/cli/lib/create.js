import path from 'node:path';
import { fileURLToPath } from 'node:url'
import fse from 'fs-extra';
import { Command } from 'commander';
import { log, verify } from '@e.ucli/utils';

const program = new Command();
const __dirname = fileURLToPath(import.meta.url)
const pktPath = path.resolve(__dirname, '../../package.json')
const pkt = fse.readJSONSync(pktPath)

function preAction() {
    checkNodeVersion()
}

function checkNodeVersion() {
    if (!verify.isValidNodeVersion()) {
        throw new Error(`node 版本过低，请升级到 ${process.env.MIN_NODE_VERSION} 以上`)
    }
}

export default function createCLI() {
    program
        .name(Object.keys(pkt.bin)[0])
        .usage('<command> [options]')
        .version(pkt.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .hook('preAction', preAction);

    // 监听指定option
    program.on('option:debug', function () {
        if (program.opts().debug) {
            log.verbose('cli', '开启调试模式')
        }
    })

    // 监听未知命令
    program.on('command:*', function (opts) {
        log.error('cli', `无效的命令：${opts[0]}`)
    })

    return program;
}