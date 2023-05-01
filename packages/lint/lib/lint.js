import path from 'node:path'
import Command from '@e.ucli/command';
import { log, printErrorLog } from '@e.ucli/utils';
import { ESLint } from 'eslint'
import { pathExistsSync } from 'path-exists'
import { execa } from 'execa'
import ora from 'ora'
import vueConfig from './eslint/vueConfig.js';

class LintCommand extends Command {
  constructor(instance) {
    super(instance);
  }
  get command() {
    return 'lint';
  }
  get description() {
    return 'lint project';
  }
  get options() {
    return [
      ['-vpp, --vpp <string>', 'vue项目路径(vueProjectPath)', '../eslint-test'],
    ];
  }
  async action([opts]) {
    await this.doEslint(opts)
  }

  async doEslint(opts) {
    const { vpp } = opts
    const cwd = process.cwd()
    const vueProjectPath = path.resolve(cwd, vpp)
    if (!pathExistsSync(vueProjectPath)) {
      log.error('vue项目不存在')
      return
    }
    const node_modules = path.resolve(vueProjectPath, 'node_modules')
    if (!pathExistsSync(node_modules)) {
      await this.autoVueDepInstall(vueProjectPath)
    }
    const eslint = new ESLint({ cwd: vueProjectPath, overrideConfig: vueConfig })
    const results = await eslint.lintFiles(['./src/**/*.js', './src/**/*.vue'])
    const formatter = await eslint.loadFormatter()
    const resultText = await formatter.format(results)
    log.success(resultText)
  }

  async autoVueDepInstall(cwd) {
    const spanner = ora('正在安装eslint依赖...').start()
    try {
      await execa('npm', ['install', '-D', 'eslint-plugin-vue'], { cwd })
      await execa('npm', ['install', '-D', 'eslint-config-airbnb-base'], { cwd, stdout: 'inherit' })
    } catch (error) {
      printErrorLog(error)
    } finally {
      spanner.stop()
    }
  }

}

export default function lint(instance) {
  return new LintCommand(instance);
}

