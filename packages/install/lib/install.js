import Command from '@e.ucli/command';
import { log, makeList, Github, Gitee, getPlatform, removeGitCacheFile, createGitCacheFile, makeInput, printErrorLog } from '@e.ucli/utils';

const PLAT_GITHUB_VAL = 'github'
const PLAT_GITEE_VAL = 'gitee'

const SEARCH_MODE_PROP = 'repositories'
const SEARCH_MODE_CODE = 'code'

const GITEE_LANGUAGES = ['Java', 'JavaScript', 'TypeScript', 'HTML', 'CSS']
const GITHUB_LANGUAGES = ['java', 'javascript', 'typeScript', 'html', 'css']

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
    await this.searchGitApi(opts)
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

    this.searchPage = opts.page ?? 1
    this.searchPagesize = opts.pagesize ?? 5
  }

  async searchGitApi(opts) {
    const { q, language } = await this.getInputQuery()
    const params = { ...opts, q, language }
    await this.doSearch(params)
  }

  async doSearch(params) {
    let list;
    if (this.mode === SEARCH_MODE_PROP) {
      list = await this.doSearchRepositories(params)
    }
    else if (this.mode === SEARCH_MODE_CODE) {
      list = await this.doSearchCode(params)
    }
    else {
      list = []
    }
    if (list.length === 0) {
      log.info('没有搜索到内容')
      return
    }
    if (this.searchPage > 1) {
      list.push({ name: '上一页', value: 'prev' })
    }
    if (this.searchPage <= 10) {
      list.push({ name: '下一页', value: 'next' })
    }
    let keyword = await makeList({
      choices: list
    })
    if (keyword === 'next') {
      await this.nextSearchPage(params)
    }
    else if (keyword === 'prev') {
      await this.prevSearchPage(params)
    }
  }

  async getInputQuery() {
    let q, language, choices = [];
    if (this.platform === PLAT_GITEE_VAL) {
      choices = GITEE_LANGUAGES.map((lan) => ({ name: lan, value: lan }))
    }
    else if (this.platform === PLAT_GITHUB_VAL) {
      choices = GITHUB_LANGUAGES.map((lan) => ({ name: lan, value: lan }))
    }
    try {
      q = await makeInput({
        message: '请输入搜索关键字',
        validate(v) {
          if (v && v.length > 0) {
            return true
          }
          return '项目名称不能为空'
        }
      })
      language = await makeList({
        choices,
        message: '请选择开发语言',
      })
    } catch (error) {
      printErrorLog(error)
    }
    return { q, language }
  }

  async doSearchRepositories(params) {
    const { sort, pagesize, page, q, language } = params
    if (this.platform === PLAT_GITEE_VAL) {
      params = { ...params, sort: `${sort}_count`, per_page: pagesize }
    }
    else if (this.platform === PLAT_GITHUB_VAL) {
      params = { ...params, per_page: pagesize, page: page, q: `${q}+language:${language}` }
    }
    console.log('doSearchRepositories params', params)
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
    const { pagesize, q, language } = params
    if (this.platform === PLAT_GITHUB_VAL) {
      params = { ...params, per_page: pagesize, q: `${q}+language:${language}` }
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
  }

  async nextSearchPage(params) {
    this.searchPage += 1
    await this.doSearch({ ...params, page: this.searchPage })
  }

  async prevSearchPage(params) {
    this.searchPage -= 1
    await this.doSearch({ ...params, page: this.searchPage })
  }

  resetGitApi() {
    removeGitCacheFile()
    createGitCacheFile()
  }
}

export default function install(instance) {
  return new InstallCommand(instance);
}

