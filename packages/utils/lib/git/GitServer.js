
import { homedir } from 'node:os'
import path from 'node:path'
import { pathExistsSync } from 'path-exists'
import fse from 'fs-extra'
import { execa } from 'execa'
import { makePassword } from '../index.js'

const CACHE_DIR = 'ucli-cache'
const TEMP_GIT = '.git'
const TEMP_TOKEN = '.token'
const TEMP_PLATFORM = '.platform'


function createTokenPath() {
    return path.resolve(homedir(), CACHE_DIR, TEMP_GIT, TEMP_TOKEN)
}

function createPlatformPath() {
    return path.resolve(homedir(), CACHE_DIR, TEMP_GIT, TEMP_PLATFORM)
}

function removeGitCacheFile() {
    fse.removeSync(path.resolve(homedir(), CACHE_DIR, TEMP_GIT))
}

function createGitCacheFile() {
    const tokenPath = createTokenPath()
    const platformPath = createPlatformPath()
    if (!pathExistsSync(tokenPath)) {
        fse.createFileSync(tokenPath)
    }
    if (!pathExistsSync(platformPath)) {
        fse.createFileSync(platformPath)
    }
}

function getPlatform(filepath = createPlatformPath()) {
    return pathExistsSync(filepath) ? fse.readFileSync(filepath, 'utf-8') : ''
}

class GitServer {
    constructor() {
        this.tokenPath = createTokenPath()
        this.platformPath = createPlatformPath()
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

    async cloneRepo(fullName, tag) {
        if (tag) {
            return await execa('git', ['clone', this.getReposUrl(fullName), '-b', tag])
        } else {
            return await execa('git', ['clone', this.getReposUrl(fullName), '-b'])
        }
    }

    async installDep(path) {
        return await execa('npm', ['install', '--registry=http://registry.npmmirror.com'], { cwd: path, stdout: 'inherit' })
    }

    async runRepo(path, type) {
        return await execa('npm', ['run', type], { cwd: path, stdout: 'inherit' })
    }

}

export {
    GitServer,
    getPlatform,
    removeGitCacheFile,
    createGitCacheFile
};