import Command from '@e.ucli/command';
import { log, makeList, Github, Gitee, getPlatform, removeGitCacheFile, createGitCacheFile, makeInput } from '@e.ucli/utils';

const PLAT_GITHUB_VAL = 'github'
const PLAT_GITEE_VAL = 'gitee'

const SEARCH_MODE_PROP = 'repositories'
const SEARCH_MODE_CODE = 'code'

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
      ['-r, --reset', '是否重置平台配置', false],
      ['-o, --order', '默认排列顺序', 'desc'],
      ['-s, --sort', '默认排序指标', 'stars'],
      ['-p, --page <number>', '默认页码', 1],
      ['-ps, --pagesize <number>', '默认页大小', 5],
    ]
  }
  async action([_, opts]) {
    const { reset } = opts
    if (reset) {
      this.resetGitApi()
    }
    await this.initGitApi(opts)
    await this.doSearch(opts)
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

  async doSearch(opts) {
    let list;
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
    if (this.mode === SEARCH_MODE_PROP) {
      list = await this.doSearchRepositories({ ...opts, q })
    }
    else if (this.mode === SEARCH_MODE_CODE) {
      list = await this.doSearchCode({ ...opts, q })
    }
    else {
      list = []
    }
    let repository = await makeList({
      choices: list
    })
  }

  async doSearchRepositories(params) {
    const { sort, pagesize, page } = params
    if (this.platform === PLAT_GITEE_VAL) {
      params = { ...params, sort: `${sort}_count`, per_page: pagesize }
    }
    else if (this.platform === PLAT_GITHUB_VAL) {
      params = { ...params, per_page: pagesize, page: +page }
    }
    let searchResult = await this.gitApi.searchRepositories(params)
    if (this.platform === PLAT_GITHUB_VAL) {
      searchResult = searchResult.items
    }
    return searchResult.map(item => {
      return {
        name: `${item.full_name}(${item.description})`,
        value: item.id
      }
    })
  }

  async doSearchCode(params) {
    const { pagesize } = params
    if (this.platform === PLAT_GITHUB_VAL) {
      params = { ...params, per_page: pagesize }
    }
    let searchResult = await this.gitApi.searchCode(params)
    if (this.platform === PLAT_GITHUB_VAL) {
      searchResult = searchResult.items
    }
    return searchResult.map(item => {
      return {
        name: `${item.repository.full_name}(${item.repository.description})`,
        value: item.repository.id
      }
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

