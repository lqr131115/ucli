import path from 'node:path'
import fs from 'node:fs'
import SimpleGit from 'simple-git'
import Command from '@e.ucli/command';
import { getPlatform, initGitPlatform, resetGitConfig, initGitOwner, createGitRepo, createGitIgnoreFile, getLogin, log } from '@e.ucli/utils';

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
    await this.initLocal(opts)
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

  async initLocal(opts) {
    const remoteUrl = this.gitApi.getReposUrl(`${getLogin()}/${this.pkt.name}`)
    this.git2 = SimpleGit(process.cwd())

    const gitDir = path.resolve(process.cwd(), '.git')
    if (!fs.existsSync(gitDir)) {
      await this.git2.init()
      log.success('git init success')
    }
    const remotes = await this.git2.getRemotes()
    if (!(~remotes.findIndex(item => item.name === 'origin'))) {
      await this.git2.addRemote('origin', remoteUrl)
    }

    const status = await this.git2.status()

    await this.git2.pull('origin', 'master').catch((err) => {
      log.error(err)
    })
  }
}

export default function commit(instance) {
  return new CommitCommand(instance);
}

