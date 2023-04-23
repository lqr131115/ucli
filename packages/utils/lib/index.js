import log from './log.js'
import verify from './verify.js'
import { makeList, makeInput, makePassword } from './inquirer.js'
import { getLatestVersion } from './npm.js'
import service from './request.js'
import { GitServer, getPlatform, removeGitCacheFile , createGitCacheFile} from './git/GitServer.js'
import Gitee from './git/Gitee.js'
import Github from './git/Github.js'

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
  makePassword,
  getLatestVersion,
  service,
  GitServer,
  getPlatform,
  removeGitCacheFile,
  createGitCacheFile,
  Gitee,
  Github
};

