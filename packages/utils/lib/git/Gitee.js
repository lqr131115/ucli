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
            config => config,
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
            data,
            headers,
            method: 'post'
        })
    }

    searchRepositories(url, params) {
        return this.get(url, params)
    }
}

export default Gitee