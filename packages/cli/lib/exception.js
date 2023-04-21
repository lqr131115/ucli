import { log, verify } from '@e.ucli/utils';


function printErrorLog(err, type) {
    if (verify.isDebug()) {
        log.error(type, err)
    } else {
        log.error(type, err.message)
    }
}

process.on('uncaughtException', (e) => printErrorLog(e, 'uncaughtException'));

// 监听未处理的promise错误
process.on('unhandledRejection', (e) => printErrorLog(e, 'unhandledRejection'))
