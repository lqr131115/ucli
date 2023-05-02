import { GitServer } from "./GitServer.js";
import axois from 'axios'

const BASE_URL = 'https://gitee.com/api/v5'

class Gitee extends GitServer {
    constructor() {
        super()
        this.service = axois.create({
            baseURL: BASE_URL,
            timeout: 5000
        })
        this.service.interceptors.request.use(
            config => {
                return config
            },
            error => Promise.reject(error)
        )
        this.service.interceptors.response.use(
            response => {
                return response.data
            },
            error => Promise.reject(error)
        )
    }

    get(url, params, headers) {
        return this.service({
            url,
            params: {
                ...params,
                access_token: this.token,
            },
            headers,
            method: 'get'
        })
    }

    post(url, data, headers) {
        return this.service({
            url,
            data: {
                ...data,
                access_token: this.token,
            },
            headers,
            method: 'post'
        })
    }

    searchRepositories(params) {
        return this.get('/search/repositories', params)
    }

    getReposTags(fullName) {
        return this.get(`/repos/${fullName}/tags`)
    }

    getReposUrl(fullName) {
        return `https://gitee.com/${fullName}.git`
    }

    getUser() {
        return this.get(`/user`)
    }

    getOrgs(params) {
        return this.get('/user/orgs', params)
    }

    createRepo(data) {
        // if (this.owner === 'user') {
        //     return this.post(`/user/repos`, data)
        // } else {
        //     return this.post(`/orgs/${this.login}/repos`, data)
        // }
    }
}

export default Gitee