import Command from '@e.ucli/command';
import { log } from '@e.ucli/utils';

class CommitCommand extends Command {
  constructor(instance) {
    super(instance);
  }
  get command() {
    return 'commit';
  }
  get description() {
    return 'commit project';
  }
  get options() {
    return [
      ['-f, --force', 'force', false],
    ];
  }
  async action() {
    log.success('commit action')
  }

}

export default function commit(instance) {
  return new CommitCommand(instance);
}

