import Command from '@e.ucli/command';
import { makeList, Github, Gitee, getPlatform, removeGitCacheFile, createGitCacheFile, makeInput } from '@e.ucli/utils';

const PLAT_GITHUB_VAL = 'github'
const PLAT_GITEE_VAL = 'gitee'

const SEARCH_MODE_PROP = 'repositories'
const SEARCH_MODE_CODE = 'code'

const GITHUB_TOKEN = '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'
const GITEE_TOKEN = 'f8414b9698b368f3616cfa6d61d53738'

class InstallCommand extends Command {
  constructor(instance) {
    super(instance);
  }
  get command() {
    return 'install [name]';
  }
  get description() {
    return 'install registry';
  }
  get options() {
    return [
      ['-r, --reset', '是否重置平台配置', false]
    ]
  }
  async action([_, opts]) {
    const { reset } = opts
    if (reset) {
      this.resetGitApi()
    }
    await this.initGitApi(opts)
    await this.doSearch()
  }

  async initGitApi(opts) {

    let gitApi;
    let mode = SEARCH_MODE_PROP
    let platform = getPlatform()
    if (!platform) {
      if (!opts?.reset) {
        this.resetGitApi()
      }
      platform = await makeList({
        choices: [{ name: 'Github', value: PLAT_GITHUB_VAL }, { name: 'Gitee', value: PLAT_GITEE_VAL }],
        message: '请选择搜索平台'
      })
    }

    if (platform === PLAT_GITHUB_VAL) {
      mode = await makeList({
        choices: [{ name: '仓库', value: SEARCH_MODE_PROP }, { name: '源码', value: SEARCH_MODE_CODE }],
        message: '请选择搜索模式'
      })
      gitApi = new Github()
    } else {
      gitApi = new Gitee()
    }
    gitApi.savePlatform(platform)
    await gitApi.init()

    this.gitApi = gitApi
    this.mode = mode
    this.platform = platform
  }

  async doSearch() {
    const params = {
      sort: 'stars',
      order: 'desc',
      per_page: 2,
      page: 1
    }
    let q = await makeInput({
      message: '请输入搜索关键字',
      defaultValue: '',
      validate(v) {
        if (v && v.length > 0) {
          return true
        }
        return '项目名称不能为空'
      }
    })
    let language;
    const res = await this.gitApi.searchRepositories({
      ...params,
      q
    })
    console.log(res)
  }

  resetGitApi() {
    removeGitCacheFile()
    createGitCacheFile()
  }
}

export default function install(instance) {
  return new InstallCommand(instance);
}

