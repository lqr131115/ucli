
import createInitCommand from '@e.ucli/init';
import createInstallCommand from '@e.ucli/install';
import createLintCommand from '@e.ucli/lint';

import createCLI from './create.js';
import './exception.js'

export default function (args) {
  const program = createCLI()
  createInitCommand(program)
  createInstallCommand(program)
  createLintCommand(program)
  program.parse(process.argv);
}