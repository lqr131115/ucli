import path from 'node:path'
import fs from 'node:fs'
import fse from 'fs-extra'
import SimpleGit from 'simple-git'
import semver from 'semver'
import Command from '@e.ucli/command';
import { getPlatform, initGitPlatform, resetGitConfig, initGitOwner, createGitRepo, createGitIgnoreFile, getLogin, log, makeInput, makeList } from '@e.ucli/utils';

class CommitCommand extends Command {
  constructor(instance) {
    super(instance);
  }
  get command() {
    return 'commit';
  }
  get description() {
    return 'commit project';
  }
  get options() {
    return [
      ['-r, --reset', '是否重置平台配置', false],
    ];
  }
  async action([opts]) {
    if (opts && opts.reset) {
      resetGitConfig()
    }
    await this.createRemoteRepo(opts)
    await this.initLocal()
  }

  async createRemoteRepo(opts) {
    const platform = getPlatform()
    if (!platform && opts?.reset) {
      resetGitConfig()
    }
    this.gitApi = await initGitPlatform()
    await initGitOwner(this.gitApi)
    this.pkt = await createGitRepo(this.gitApi)
    await createGitIgnoreFile()
  }

  async initLocal() {

    this.git2 = SimpleGit(process.cwd())
    const gitDir = path.resolve(process.cwd(), '.git')
    if (!fs.existsSync(gitDir)) {
      await this.git2.init()
      log.success('git init')
    }
    await this.addRemoteMap()

    await this.commit()
  }

  async addRemoteMap() {
    const remotes = await this.git2.getRemotes()
    if (!(~remotes.findIndex(item => item.name === 'origin'))) {
      const remoteUrl = this.gitApi.getReposUrl(`${getLogin()}/${this.pkt.name}`)
      await this.git2.addRemote('origin', remoteUrl)
      log.success('添加git remote', remoteUrl)

      await this.checkNotCommitted()
      await this.checkOriginMasterExisted()
    }
  }

  async checkNotCommitted() {
    const status = await this.git2.status()
    const { not_added } = status
    if (not_added.length) {
      await this.git2.add('.')
    }
    const message = await makeInput({
      message: '请输入提交信息',
      validate: (v) => {
        if (!v) {
          return '提交信息不能为空'
        }
        return true
      }
    })
    await this.git2.commit(message)
  }

  async checkOriginMasterExisted() {
    // 等价于执行 git ls-remote --refs
    const tags = await this.git2.listRemote(['--refs'])
    if (~tags.indexOf('refs/heads/master')) {
      await this.git2.pull('origin', 'master').catch((err) => {
        log.error('git pull err', err.message)
      })
    } else {
      await this.git2.push('origin', 'master').catch((err) => {
        log.error('git push err', err.message)
      })
    }
  }

  async commit() {
    await this.genCurrentVersion()
  }

  async genCurrentVersion() {
    let releaseVersion;
    const list = await this.getBranchList('release')
    if (list && list.length) {
      releaseVersion = list[0]
    }
    const devVersion = this.pkt.version || '0.0.0'
    if (!releaseVersion) {
      this.branch = `dev/${devVersion}`
    } else if (semver.gte(devVersion, releaseVersion)) {
      log.info(`本地版本大于线上最新版本 (${devVersion} >= ${releaseVersion})`)
      this.branch = `dev/${devVersion}`
    } else {
      log.info(`本地版本小于线上最新版本 (${devVersion} < ${releaseVersion}))`)
      const incType = await makeList({
        message: '请选择版本升级类型',
        defaultValue: 'patch',
        choices: [
          {
            name: `小版本 (${releaseVersion} -> ${semver.inc(releaseVersion, 'patch')})`,
            value: 'patch'
          },
          {
            name: `中版本 (${releaseVersion} -> ${semver.inc(releaseVersion, 'minor')})`,
            value: 'minor'
          },
          {
            name: `大版本 (${releaseVersion} -> ${semver.inc(releaseVersion, 'major')})`,
            value: 'major'
          }
        ]
      })
      const incVersion = semver.inc(releaseVersion, incType)
      this.branch = `release/${incVersion}`
      this.pkt = { ...this.pkt, version: incVersion }
      this.syncVersion2PackageJSON()
    }
  }

  async getBranchList(type) {
    let reg;
    const listStr = await this.git2.listRemote(['--refs'])
    if (type === 'release') {
      reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g
    } else {
      reg = /.+?refs\/tags\/dev\/(\d+\.\d+\.\d+)/g
    }
    return listStr.split('\n').map(item => {
      const match = reg.exec(item)
      reg.lastIndex = 0
      if (match && semver.valid(match[1])) {
        return match[1]
      }
    }).filter(_ => _).sort((v1, v2) => (semver.gt(v1, v2) ? -1 : 1))
  }

  syncVersion2PackageJSON() {
    const dir = process.cwd()
    const pktPath = path.resolve(dir, 'package.json')
    const pkt = fse.readJSONSync(pktPath)
    if (pkt.version !== this.pkt.version) {
      pkt.version = this.pkt.version
      fse.writeJSONSync(pktPath, pkt, { spaces: 2 })
    }
  }
}

export default function commit(instance) {
  return new CommitCommand(instance);
}

