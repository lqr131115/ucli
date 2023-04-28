import Command from '@e.ucli/command';
import { log } from '@e.ucli/utils';

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
      ['-f, --force', '是否强制', false],
    ];
  }
  async action([opts]) {
    log.verbose('opts', opts)
  }
}

export default function lint(instance) {
  return new LintCommand(instance);
}

