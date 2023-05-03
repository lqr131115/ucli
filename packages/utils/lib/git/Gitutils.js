import path from 'node:path'
import fse from 'fs-extra'
import { printErrorLog, C } from "../index.js";
import log from '../log.js'
import { makeList, makeInput, makeCheckbox } from "../inquirer.js";
import { removeGitCacheFile, createGitCacheFile, getPlatform, getOwner, getLogin } from "./GitServer.js";
import Gitee from "./Gitee.js";
import Github from "./Github.js";



export async function resetGitConfig() {
    removeGitCacheFile()
    createGitCacheFile()
}

export async function initGitPlatform() {
    let gitApi;
    let platform = getPlatform()
    if (!platform) {
        platform = await makeList({
            choices: [{ name: 'Github', value: C.PLAT_GITHUB }, { name: 'Gitee', value: C.PLAT_GITEE }],
            message: '请选择平台'
        })
    }
    if (platform === C.PLAT_GITHUB) {
        gitApi = new Github()
    }
    if (platform === C.PLAT_GITEE) {
        gitApi = new Gitee()
    }

    gitApi.savePlatform(platform)
    await gitApi.init()

    return gitApi
}

export async function initGitOwner(gitApi) {
    let gitOwner = getOwner()
    let gitLogin = getLogin()
    if (!gitLogin) {
        const user = await gitApi.getUser()
        const org = await gitApi.getOrgs()
        if (!gitOwner) {
            gitOwner = await makeList({
                message: '请选择仓库所属',
                choices: [{ name: '个人', value: C.OWNER_USER }, { name: '组织', value: C.OWNER_ORGS }]
            })
        }
        if (gitOwner === C.OWNER_USER) {
            gitLogin = user?.login
        } else {
            const orgsList = org?.map(item => ({ name: item.name, value: item.login }))
            gitLogin = await makeList({
                message: '请选择组织',
                choices: orgsList
            })
        }
        if (!gitLogin) {
            throw new Error('未获取仓库登录名')
        }
    }
    gitApi.saveOwner(gitOwner)
    gitApi.saveLogin(gitLogin)
    return gitLogin
}

export async function createGitRepo(gitApi) {
    async function getInputParameter(pkt) {
        let { name, description } = pkt
        try {
            if (!name) {
                name = await makeInput({
                    message: '请输入仓库名称',
                    validate(v) {
                        if (v.length > 2 && v.length < 21) {
                            return true
                        }
                        return '仓库名称3 - 20个字符'
                    }
                })
            }
            if (!description) {
                description = await makeInput({ message: '请输入仓库描述', defaultValue: 'description' })
            }
        } catch (error) {
            printErrorLog(error)
        }
        return { ...pkt, name, description }
    }

    const dir = process.cwd()
    const pkt = fse.readJSONSync(path.resolve(dir, 'package.json'))
    const { name, description } = await getInputParameter(pkt)
    const exist = await gitApi.getRepo(getLogin(), name)
    if (exist) {
        log.info('远程仓库已存在')
        return
    }
    await gitApi.createRepo({ name, description })
}

export async function createGitIgnoreFile() {
    const gitIgnorePath = path.resolve(process.cwd(), '.gitignore')
    if (!fse.pathExistsSync(gitIgnorePath)) {
        let data = await makeCheckbox({
            message: '请选择需要忽略的文件',
            choices: ["node_modules", "dist"]
        })
        fse.writeFileSync(gitIgnorePath, data.join('\n'))
    }
}