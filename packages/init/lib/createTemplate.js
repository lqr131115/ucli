
import path from 'node:path'
import { homedir } from 'node:os'
import { log, makeList, makeInput, getLatestVersion, service, printErrorLog, C } from '@e.ucli/utils'

const ADD_TYPE_PROJECT = 'project';
const ADD_TYPE_PAGE = 'page';
const ADD_TYPE = [
    {
        name: '项目',
        value: ADD_TYPE_PROJECT,
    },
    {
        name: '页面',
        value: ADD_TYPE_PAGE,
    }
];
// const ADD_TEMPLATE = [
//     {
//         "name": "vue3项目模板",
//         "value": "template-vue3",
//         "npmName": "@e.ucli/template-vue3",
//         "version": "1.0.5",
//         "team": "PC",
//         "ignore": [
//             "public/**"
//         ]
//     }
// ]
function getAddType() {
    return makeList({
        choices: ADD_TYPE,
        message: '请选择创建类型',
        defaultValue: ADD_TYPE_PROJECT,
    })
}

function getAddName() {
    return makeInput({
        message: '请输入项目名称',
        defaultValue: '',
        validate(v) {
            if (v && v.length > 0) {
                return true
            }
            return '项目名称不能为空'
        }
    })
}

function getAddTemplate(templateList) {
    return makeList({
        choices: templateList,
        message: '请选择项目模板'
    })
}

function getAddTeam(teamList) {
    teamList = teamList.map(item => ({ name: item + ' Team', value: item }))
    return makeList({
        choices: teamList,
        message: '请选择团队'
    })
}


// 安装缓存目录
function makeTargetPath() {
    return path.resolve(homedir(), C.CACHE_DIR, 'template')
}

async function getTemplateFromAPI() {
    try {
        const data = await service({
            url: '/v1/project',
            method: 'get'
        })
        return data
    } catch (e) {
        printErrorLog(e)
        return null
    }
}

export default async function createTemplate(name, options) {
    const { type = '', template = '' } = options
    let addType;
    let addName;
    let addTemplate;
    let addTeam;
    if (type) {
        addType = type
    } else {
        addType = await getAddType()
    }
    let templateList = await getTemplateFromAPI()
    if (!templateList) {
        throw new Error('API获取模板失败')
    }
    log.verbose('addType: ', addType)
    if (addType === ADD_TYPE_PROJECT) {
        if (name) {
            addName = name
        } else {
            addName = await getAddName()
        }
        log.verbose('addName: ', addName)

        const teamList = templateList.map(item => item.team)
        addTeam = await getAddTeam([...new Set(teamList)])
        log.verbose('addTeam: ', addTeam)
        templateList = templateList.filter(item => item.team === addTeam)

        if (template) {
            addTemplate = template
        } else {
            addTemplate = await getAddTemplate(templateList)
        }
        log.verbose('addTemplate: ', addTemplate)

        const selectedTemp = templateList.find(item => item.value === addTemplate)
        if (!selectedTemp) {
            throw new Error(`项目模板:${addTemplate} 不存在!`)
        }
        // 获取最新的版本号 先注释掉(请求超时)

        try {
            // const latestVersion = await getLatestVersion(selectedTemp.npmName)
            // selectedTemp.version = latestVersion
            selectedTemp.version = 'latest'
        } catch (error) {
            printErrorLog(error)
        }

        // C:\Users\admin\ucli-cache\template
        const targetPath = makeTargetPath()
        return {
            name: addName,
            type: addType,
            template: selectedTemp,
            targetPath
        }
    } else {
        throw new Error(`项目类型:${addType} 不存在!`)
    }
}