import path from 'node:path'
import fse from "fs-extra";
import ora from 'ora';
import ejs from 'ejs';
import { glob } from 'glob'
import { pathExistsSync } from "path-exists";
import { printErrorLog, makeList, log } from "@e.ucli/utils";


export default async function installTemplate(selectedTemplate, options) {
    const { force = false } = options
    const { targetPath, name, template } = selectedTemplate
    const rootDir = process.cwd()
    const installDir = path.resolve(rootDir, name)
    fse.ensureDirSync(targetPath)
    if (pathExistsSync(installDir)) {
        if (!force) {
            log.error('当前目录已存在同名项目!!!')
            return
        } else {
            fse.removeSync(installDir)
            fse.ensureDirSync(installDir)
        }
    } else {
        fse.ensureDirSync(installDir)
    }
    copyFiles(targetPath, installDir, template);
    await ejsRender(targetPath, installDir, template, name);
}


function copyFiles(targetPath, installDir, template) {
    const originPath = getCacheFilePath(targetPath, template)
    const originFiles = fse.readdirSync(originPath)
    const spanner = ora('文件正在拷贝中...').start()
    originFiles.forEach((file) => {
        fse.copySync(path.resolve(originPath, file), path.resolve(installDir, file))
    })
    spanner.stop()
}

function getCacheFilePath(targetPath, template) {
    const { npmName } = template
    return path.resolve(targetPath, 'node_modules', npmName, 'template')
}


function getPluginFilePath(targetPath, template) {
    const { npmName } = template
    return path.resolve(targetPath, 'node_modules', npmName, 'plugins', 'index.js')
}

async function ejsRender(targetPath, installDir, template, name) {

    // 插件机制
    let pluginData = {};
    const pluginPath = getPluginFilePath(targetPath, template)
    if (pathExistsSync(pluginPath)) {
        // Only URLs with a scheme in: file, data are supported by the default ESM loader. On Windows, absolute paths must be valid file:// URLs. Received protocol 'c:'
        // const plugin = (await import(pluginPath)).default
        const pluginFn = (await import('file://' + pluginPath)).default
        pluginData = await pluginFn({ makeList })
    }

    const { ignore = [] } = template
    const options = { data: { name, ...pluginData } }
    const files = await glob('**', { cwd: installDir, nodir: true, ignore: [...ignore, 'node_modules/**'] })
    files.forEach((file) => {
        const filename = path.resolve(installDir, file)
        ejs.renderFile(filename, options, (error, result) => {
            if (!error) {
                fse.writeFileSync(filename, result)
            } else {
                printErrorLog(error)
            }
        })
    })
}
