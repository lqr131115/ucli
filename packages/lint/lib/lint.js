import path from 'node:path'
import { ESLint } from 'eslint'
import { pathExistsSync } from 'path-exists'
import { execa } from 'execa'
import ora from 'ora'
import jest from 'jest'
import Mocha from 'mocha'
import Command from '@e.ucli/command';
import { log, printErrorLog, makeList } from '@e.ucli/utils';
import vueConfig from './eslint/vueConfig.js';

const TEST_JEST = 'jest'
const TEST_MOCHA = 'mocha'

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
    await this.doTest(opts)
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

  async doTest(opts) {
    const { vpp } = opts
    const cwd = process.cwd()
    const vueProjectPath = path.resolve(cwd, vpp)
    if (!pathExistsSync(vueProjectPath)) {
      log.error('vue项目不存在')
      return
    }
    const testMode = await makeList({
      message: '请选择测试模式',
      choices: [
        { name: 'jest', value: TEST_JEST },
        { name: 'mocha', value: TEST_MOCHA },
      ]
    })

    // TODO: 存储测试模式

    if (testMode === TEST_JEST) {
      await jest.run('test', vueProjectPath)
      log.success('jest测试完成')
    } else {
      const mocha = new Mocha()
      mocha.addFile(path.resolve(vueProjectPath, '__tests__', 'index.js'))
      mocha.run(() => {
        log.success('mocha测试完成')
      })
    }
  }
}

export default function lint(instance) {
  return new LintCommand(instance);
}

