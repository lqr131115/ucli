
import createInitCommand from '@e.ucli/init';
import createCLI from './create.js';
import './exception.js'

export default function (args) {
  const program = createCLI()
  createInitCommand(program)
  program.parse(process.argv);
}