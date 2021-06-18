import axios from 'axios'
axios.defaults.timeout = 50000 // 暂时关闭请求超时
axios.defaults.withCredentials = true
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
axios.defaults.baseURL = process.env.VUE_APP_BASE_API // process.env.NODE_ENV == "production" ? : '/apis';

export default axios
