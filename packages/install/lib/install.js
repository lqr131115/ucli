import path from 'node:path';
import ora from 'ora'
import { pathExistsSync } from 'path-exists'
import Command from '@e.ucli/command';
import { log, makeList, getPlatform, resetGitConfig, makeInput, printErrorLog, initGitPlatform } from '@e.ucli/utils';

const PLAT_GITHUB = 'github'
const PLAT_GITEE = 'gitee'

const SEARCH_MODE_PROP = 'repositories'
const SEARCH_MODE_CODE = 'code'

// TODO: 根据总数量计算页数，先给默认值10
const TOTAL_PAGE = 10

const GITEE_LANGUAGES = ['Java', 'JavaScript', 'TypeScript', 'HTML', 'CSS']
const GITHUB_LANGUAGES = ['java', 'javascript', 'typeScript', 'html', 'css']

class InstallCommand extends Command {
  constructor(instance) {
    super(instance);
  }
  get command() {
    return 'install';
  }
  get description() {
    return 'install project';
  }
  get options() {
    return [
      ['-r, --reset', '是否重置平台配置', false],
      ['-o, --order', '默认排列顺序', 'desc'],
      ['-s, --sort', '默认排序指标', 'stars'],
      ['-p, --page <number>', '默认页码', 1],
      ['-ps, --pagesize <number>', '默认页大小', 5],
      ['-a, --auto', '是否自动安装依赖和启动项目', false],
    ]
  }
  
  async action([opts]) {
    if (opts && opts.reset) {
      resetGitConfig()
    }
    await this.initGitApi(opts)
    await this.searchGitApi(opts)
    await this.installRepo({ ...opts, keyword: this.keyword, q: this.q, language: this.language })
  }

  async initGitApi(opts) {

    let mode = SEARCH_MODE_PROP
    let platform = getPlatform()
    if (!platform) {
      if (!opts?.reset) {
        resetGitConfig()
      }
      this.gitApi = await initGitPlatform()
    }

    platform = getPlatform()
    if (platform === PLAT_GITHUB) {
      mode = await makeList({
        choices: [{ name: '仓库', value: SEARCH_MODE_PROP }, { name: '源码', value: SEARCH_MODE_CODE }],
        message: '请选择搜索模式'
      })
    }

    this.mode = mode
    this.platform = platform
    this.searchPage = opts.page || 1
    this.tagsPage = opts.page || 1
  }

  async searchGitApi(opts) {
    const { q, language } = await this.getInputQuery()
    const params = { ...opts, q, language }
    await this.doSearch(params)

    this.q = q
    this.language = language
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
    if (this.searchPage <= TOTAL_PAGE) {
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
    this.keyword = keyword
  }

  async getInputQuery() {
    let q, language, choices = [];
    if (this.platform === PLAT_GITEE) {
      choices = GITEE_LANGUAGES.map((lan) => ({ name: lan, value: lan }))
    }
    else if (this.platform === PLAT_GITHUB) {
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
    const { sort, pagesize, q, language } = params
    if (this.platform === PLAT_GITEE) {
      params = { ...params, sort: `${sort}_count`, per_page: pagesize }
    }
    else if (this.platform === PLAT_GITHUB) {
      params = { ...params, per_page: pagesize, q: `${q}+language:${language}` }
    }
    let searchResult = await this.gitApi.searchRepositories(params)
    if (this.platform === PLAT_GITHUB) {
      searchResult = searchResult.items
    }
    return searchResult.map(item => {
      return {
        name: `${item.full_name} (${item.description})`,
        value: item.full_name
      }
    })
  }

  async doSearchCode(params) {
    const { pagesize, q, language } = params
    if (this.platform === PLAT_GITHUB) {
      params = { ...params, per_page: pagesize, q: `${q}+language:${language}` }
    }
    let searchResult = await this.gitApi.searchCode(params)
    if (this.platform === PLAT_GITHUB) {
      searchResult = searchResult.items
    }

    return searchResult.map(item => {
      return {
        name: `${item.repository.full_name} (${item.repository.description})`,
        value: item.repository.full_name
      }
    })
  }

  async installRepo(params) {
    let spanner;
    const tag = await this.getRepositoryTag(params)
    try {
      const repoName = this.keyword.split('/').pop()
      const repoPath = path.resolve(process.cwd(), repoName)
      if (pathExistsSync(repoPath)) {
        throw new Error(`项目 ${repoName} 已存在`)
      }
      spanner = ora('项目克隆中...').start()
      await this.gitApi.cloneRepo(this.keyword, tag)
      spanner.stop()

      if (params && params.auto) {
        // 自动安装依赖 但过程耗时可能较长 且中断不停止安装过程
        spanner = ora('项目依赖安装中...').start()
        await this.gitApi.installDep(repoPath)
        spanner.stop()

        // 自动启动项目
        spanner = ora('项目启动中...').start()
        await this.gitApi.runRepo(repoPath)
        spanner.stop()
      }
    } catch (error) {
      spanner.stop()
      printErrorLog(error)
    }
  }

  async getRepositoryTag(params) {

    let tags;
    const { keyword, pagesize, q, language } = params
    if (this.platform === PLAT_GITEE) {
      tags = await this.gitApi.getReposTags(keyword)
    }
    else if (this.platform === PLAT_GITHUB) {
      tags = await this.gitApi.getReposTags(keyword, { per_page: pagesize, q: `${q}+language:${language}` })
    }
    const choices = tags.map((t) => ({ name: t.name, value: t.name }))

    // 只有Github 可分页 
    if (this.platform === PLAT_GITHUB) {
      if (this.tagsPage > 1) {
        choices.push({ name: '上一页', value: 'prev' })
      }
      if (this.tagsPage <= TOTAL_PAGE) {
        choices.push({ name: '下一页', value: 'next' })
      }
    }
    const tag = await makeList({
      choices,
      message: '请选择仓库版本'
    })
    if (tag === 'next') {
      await this.nextTagsPage(params)
    } else if (tag === 'prev') {
      await this.prevTagsPage(params)
    }
    return tag
  }

  async nextSearchPage(params) {
    this.searchPage += 1
    await this.doSearch({ ...params, page: this.searchPage })
  }

  async prevSearchPage(params) {
    this.searchPage -= 1
    await this.doSearch({ ...params, page: this.searchPage })
  }

  async nextTagsPage(params) {
    this.tagsPage += 1
    await this.getRepositoryTag({ ...params, page: this.tagsPage })
  }

  async prevTagsPage(params) {
    this.tagsPage -= 1
    await this.getRepositoryTag({ ...params, page: this.tagsPage })
  }

}

export default function install(instance) {
  return new InstallCommand(instance);
}

