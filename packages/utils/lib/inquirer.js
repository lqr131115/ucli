import inquirer from 'inquirer';

// 创建默认得inquirer
function make({
    choices = [],
    defaultValue,
    message = '请选择',
    type = 'list',
    require = true,
    mask = '*',
    validate,
    pageSize = 10,
    loop = false,
}) {
    const options = {
        name: 'name',
        default: defaultValue,
        message,
        type,
        require,
        mask,
        validate,
        pageSize,
        loop,
    }
    if (type === 'list' || type === 'checkbox') {
        options.choices = choices;
    }
    return inquirer.prompt(options).then(answers => answers.name);
}

export function makeList(params) {
    return make(params);
}

export function makeInput(params) {
    return make({ ...params, type: 'input' });
}

export function makePassword(params) {
    return make({ ...params, type: 'password' });
}

export function makeCheckbox(params) {
    return make({ ...params, type: 'checkbox' });
}