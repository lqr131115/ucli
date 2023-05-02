import log from './log.js'
import verify from './verify.js'
import { makeList, makeInput, makePassword } from './inquirer.js'
import { getLatestVersion } from './npm.js'
import service from './request.js'
import Gitee from './git/Gitee.js'
import Github from './git/Github.js'
import { initGitPlatform, initGitOwner, resetGitConfig } from './git/Gitutils.js'
import { GitServer, getToken, getPlatform, getOwner, getLogin, removeGitCacheFile, createGitCacheFile } from './git/GitServer.js'

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
  initGitPlatform,
  initGitOwner,
  getToken,
  getPlatform,
  getLogin,
  getOwner,
  removeGitCacheFile,
  createGitCacheFile,
  resetGitConfig,
  Gitee,
  Github
};

