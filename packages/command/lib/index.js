'use strict';

 class Command {
  constructor(instance) {
    if (!instance) {
      throw new Error('Command instance is required');
    }
    this.program = instance
    const cmd = this.program.command(this.command)
    cmd.description(this.description)
    if (this.options && this.options.length > 0) {
      this.options.forEach(option => {
        cmd.option(...option);
      })
    }
    cmd.action((...params) => { this.action(params) })
    cmd.hook('preAction', () => { this.preAction() })
    cmd.hook('postAction', () => { this.postAction() })
  }

  get command() {
    throw new Error('command is required');
  }

  get description() {
    throw new Error('description is required');
  }

  get options() {
    return [];
  }

  get action() {
    throw new Error('action is required');
  }

  preAction() {
  }

  postAction() {
  }

}

export default Command;