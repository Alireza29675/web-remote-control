import chalk from 'chalk'
import clear from 'clear'
import moment from 'moment'
import Server from '../../src/server'

clear()
console.log(chalk`{green Server re-started at} {yellow [${moment().format(`mm:ss`)}]}`)

const server = new Server()