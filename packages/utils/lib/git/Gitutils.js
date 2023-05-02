import { makeList } from "../inquirer.js";
import { removeGitCacheFile, createGitCacheFile } from "./GitServer.js";
import Gitee from "./Gitee.js";
import Github from "./Github.js";

const PLAT_GITHUB = 'github'
const PLAT_GITEE = 'gitee'

export async function resetGitConfig() {
    removeGitCacheFile()
    createGitCacheFile()
}

export async function initGitPlatform() {
    let gitApi;
    const platform = await makeList({
        choices: [{ name: 'Github', value: PLAT_GITHUB }, { name: 'Gitee', value: PLAT_GITEE }],
        message: '请选择平台'
    })
    if (platform === PLAT_GITHUB) {
        gitApi = new Github()
    }
    if (platform === PLAT_GITEE) {
        gitApi = new Gitee()
    }

    gitApi.savePlatform(platform)
    await gitApi.init()

    return gitApi
}


export async function initGitUser() {

}