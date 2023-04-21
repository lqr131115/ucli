import semver from 'semver'
process.env.MIN_NODE_VERSION = '12.0.0'

function isDebug() {
    return process.argv.includes('-d') || process.argv.includes('--debug')
}

function isValidNodeVersion() {
    return semver.gte(process.version, process.env.MIN_NODE_VERSION)
}

export default {
    isDebug,
    isValidNodeVersion
}