import log from './log.js'
import verify from './verify.js'
import { makeList, makeInput, makePassword, makeCheckbox } from './inquirer.js'
import { getLatestVersion } from './npm.js'
import service from './request.js'
import Gitee from './git/Gitee.js'
import Github from './git/Github.js'
import { initGitPlatform, initGitOwner, resetGitConfig, createGitRepo , createGitIgnoreFile} from './git/Gitutils.js'
import { GitServer, getToken, getPlatform, getOwner, getLogin, removeGitCacheFile, createGitCacheFile } from './git/GitServer.js'
import * as C from './constants.js'

export function printErrorLog(err, type) {
  if (verify.isDebug()) {
    log.error(type, err)
  } else {
    log.error(type, err.message)
  }
}

export {
  C,
  log,
  verify,
  makeList,
  makeInput,
  makePassword,
  makeCheckbox,
  getLatestVersion,
  service,
  GitServer,
  initGitPlatform,
  initGitOwner,
  createGitRepo,
  createGitIgnoreFile,
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

