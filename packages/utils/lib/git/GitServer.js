
import { homedir } from 'node:os'
import path from 'node:path'
import { pathExistsSync } from 'path-exists'
import fse from 'fs-extra'
import { execa } from 'execa'
import { makePassword, log, C } from '../index.js'


const TEMP_GIT = '.git'
const TEMP_TOKEN = '.token'
const TEMP_PLATFORM = '.platform'
const TEMP_OWNER = '.owner'
const TEMP_LOGIN = '.login'


function createTokenPath() {
    return path.resolve(homedir(), C.CACHE_DIR, TEMP_GIT, TEMP_TOKEN)
}

function createPlatformPath() {
    return path.resolve(homedir(), C.CACHE_DIR, TEMP_GIT, TEMP_PLATFORM)
}

function createOwnerPath() {
    return path.resolve(homedir(), C.CACHE_DIR, TEMP_GIT, TEMP_OWNER)
}

function createLoginPath() {
    return path.resolve(homedir(), C.CACHE_DIR, TEMP_GIT, TEMP_LOGIN)
}


function removeGitCacheFile() {
    fse.removeSync(path.resolve(homedir(), C.CACHE_DIR, TEMP_GIT))
}

function createGitCacheFile() {
    const tokenPath = createTokenPath()
    const platformPath = createPlatformPath()
    const ownerPath = createOwnerPath()
    const loginPath = createLoginPath()
    if (!pathExistsSync(tokenPath)) {
        fse.createFileSync(tokenPath)
    }
    if (!pathExistsSync(platformPath)) {
        fse.createFileSync(platformPath)
    }
    if (!pathExistsSync(ownerPath)) {
        fse.createFileSync(ownerPath)
    }
    if (!pathExistsSync(loginPath)) {
        fse.createFileSync(loginPath)
    }
}

function getPlatform(filepath = createPlatformPath()) {
    return pathExistsSync(filepath) ? fse.readFileSync(filepath, 'utf-8') : ''
}

function getToken(filepath = createTokenPath()) {
    return pathExistsSync(filepath) ? fse.readFileSync(filepath, 'utf-8') : ''
}

function getOwner(filepath = createOwnerPath()) {
    return pathExistsSync(filepath) ? fse.readFileSync(filepath, 'utf-8') : ''
}

function getLogin(filepath = createLoginPath()) {
    return pathExistsSync(filepath) ? fse.readFileSync(filepath, 'utf-8') : ''
}

class GitServer {
    constructor() {
        this.tokenPath = createTokenPath()
        this.platformPath = createPlatformPath()
        this.ownerPath = createOwnerPath()
        this.loginPath = createLoginPath()
    }

    async init() {
        await this.initToken()
    }

    async initToken() {
        this.token = fse.readFileSync(this.tokenPath, 'utf-8')
        if (!this.token) {
            this.token = await makePassword(
                {
                    message: '请输入平台token',
                    validate(val) {
                        if (val && val.length > 0) {
                            return true
                        }
                        return 'token不能为空'
                    }
                })
            fse.writeFileSync(this.tokenPath, this.token)
        }
    }

    savePlatform(data) {
        this.platform = data
        fse.writeFileSync(this.platformPath, data)
    }
    saveOwner(data) {
        this.owner = data
        fse.writeFileSync(this.ownerPath, data)
    }
    saveLogin(data) {
        this.login = data
        fse.writeFileSync(this.loginPath, data)
    }

    async cloneRepo(fullName, tag) {
        if (tag) {
            return await execa('git', ['clone', this.getReposUrl(fullName), '-b', tag], { stdout: 'inherit' })
        } else {
            return await execa('git', ['clone', this.getReposUrl(fullName), '-b'], { stdout: 'inherit' })
        }
    }

    async installDep(path) {
        return await execa('npm', ['install', '--registry=http://registry.npmmirror.com'], { cwd: path, stdout: 'inherit' })
    }

    async runRepo(repoPath) {
        const pktPath = path.resolve(repoPath, 'package.json')
        const pkt = fse.readJSONSync(pktPath)
        if (!pkt) {
            throw new Error('package.json 不存在')
        }
        const { name, scripts, bin } = pkt
        if (bin) {
            await execa('npm', ['install', '-g', name, '--registry=http://registry.npmmirror.com'], { cwd: repoPath, stdout: 'inherit' })
        }
        if (scripts) {
            const { dev, start } = scripts
            if (dev) {
                return await execa('npm', ['run', 'dev'], { cwd: repoPath, stdout: 'inherit' })
            } else if (start) {
                return await execa('npm', ['run', 'start'], { cwd: repoPath, stdout: 'inherit' })
            } else {
                log.warn('未找到启动命令 dev 或 start')
            }
        }
    }

    getUser() {
        throw new Error('请实现getUser方法')
    }

    getOrgs() {
        throw new Error('请实现getOrgs方法')
    }

    createRepo() {
        throw new Error('请实现createRepo方法')
    }

}

export {
    GitServer,
    getToken,
    getPlatform,
    getOwner,
    getLogin,
    removeGitCacheFile,
    createGitCacheFile
};