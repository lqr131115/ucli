import log from 'npmlog';

if (process.argv.includes('--debug') || process.argv.includes('-d')) {
    log.level = 'verbose';  // 1000 'verbose'权重1000
} else {
    log.level = 'info'; // 2000 'info'权重2000
}

log.heading = 'ucli';

// success 权重2000  不低于log.level 即可打印
log.addLevel('success', 2000, { fg: 'green', bold: true })

export default log