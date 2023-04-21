import log from './log.js'
import verify from './verify.js'
import { makeList, makeInput} from './inquirer.js'
import {getLatestVersion} from './npm.js'
import service from './request.js'


export function printErrorLog(err, type) {
  if (verify.isDebug()) {
      log.error(type, err)
  } else {
      log.error(type, err.message)
  }
}

export {
  log,
  verify,
  makeList,
  makeInput,
  getLatestVersion,
  service
};

