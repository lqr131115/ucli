import path from 'node:path'
import { pathExistsSync } from 'path-exists'
import fse from 'fs-extra'
import ora from 'ora'
import { execa } from 'execa'
import { printErrorLog, log } from '@e.ucli/utils'


function makeCacheDir(targetPath) {
    const cache = getCacheDir(targetPath)
    if (!pathExistsSync(cache)) {
        // 如果cache目录下的任何一个文件不存在，就重新创建cache目录
        fse.mkdirpSync(cache)
    }
}

function getCacheDir(targetPath) {
    return path.resolve(targetPath, 'node_modules')
}

async function installTemplate(template, targetPath) {
    const { npmName, version } = template
    const installCommand = 'npm'
    const installArgs = ['install', `${npmName}@${version}`]
    await execa(installCommand, installArgs, { cwd: targetPath })
}


export default async function downloadTemplate(selectedTemplate) {
    const { targetPath, template } = selectedTemplate
    makeCacheDir(targetPath)
    const spanner = ora('正在安装模板...').start()
    try {
        await installTemplate(template, targetPath)
    } catch (e) {
        printErrorLog(e)
    } finally {
        spanner.stop()
    }
}

