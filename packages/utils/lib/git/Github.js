import { GitServer } from "./GitServer.js";
import axois from 'axios'

const BASE_URL = 'https://api.github.com'


class Github extends GitServer {
    constructor() {
        super()
        this.service = axois.create({
            baseURL: BASE_URL,
            timeout: 5000
        })
        this.service.interceptors.request.use(
            config => {
                config.headers['Authorization'] = `Bearer ${this.token}`,
                    config.headers['Accept'] = 'application/vnd.github+json'
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
            params,
            headers,
            method: 'get'
        })
    }


    // post(url, data, headers) {
    //     return this.service({
    //         url,
    //         data,
    //         headers,
    //         method: 'post'
    //     })
    // }

    searchRepositories(params) {
        return this.get('/search/repositories', params)
    }

    searchCode(params) {
        return this.get('/search/code', params)
    }
}

export default Github