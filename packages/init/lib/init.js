import Command from '@e.ucli/command';
import { log } from '@e.ucli/utils';
import createTemplate from './createTemplate.js';
import downloadTemplate from './downloadTemplate.js';
import copyTemplate from './copyTemplate.js';

class InitCommand extends Command {
  constructor(instance) {
    super(instance);
  }
  get command() {
    return 'init [name]';
  }
  get description() {
    return 'init project';
  }
  get options() {
    return [
      ['-f, --force', '是否强制初始化', false],
      ['-t, --type <type>', '项目类型(值: project|page)'],
      ['-tmp, --template <template>', '项目模板']
    ];
  }
  async action([name, opts]) {
    log.verbose('init:', name, opts)
    // 1. 生成项目模板安装信息
    const selectedTemplate = await createTemplate(name, opts)
    // 2. 安装下载项目模板至缓存目录
    await downloadTemplate(selectedTemplate)
    // 3.拷贝项目模板至项目目录
    await copyTemplate(selectedTemplate, opts)
  }
}

export default function init(instance) {
  return new InitCommand(instance);
}

