import Command from '@e.ucli/command';
import { getPlatform, initGitPlatform, resetGitConfig, initGitOwner, log, createGitRepo } from '@e.ucli/utils';

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
  }

  async createRemoteRepo(opts) {
    const platform = getPlatform()
    if (!platform && opts?.reset) {
      resetGitConfig()
    }
    this.gitApi = await initGitPlatform()
    this.gitLogin = await initGitOwner(this.gitApi)
    this.repo = await createGitRepo(this.gitApi)
  }
}

export default function commit(instance) {
  return new CommitCommand(instance);
}
