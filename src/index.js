import 'whatwg-fetch';
import { notification } from 'antd';

const codeMessage = {
    200: '服务器成功返回请求的数据。',
    201: '新建或修改数据成功。',
    202: '一个请求已经进入后台排队（异步任务）。',
    204: '删除数据成功。',
    400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
    401: '用户没有权限（令牌、用户名、密码错误）。',
    403: '用户得到授权，但是访问是被禁止的。',
    404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
    406: '请求的格式不可得。',
    410: '请求的资源被永久删除，且不会再得到的。',
    422: '当创建一个对象时，发生一个验证错误。',
    500: '服务器发生错误，请检查服务器。',
    502: '网关错误。',
    503: '服务不可用，服务器暂时过载或维护。',
    504: '网关超时。'
};

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }
    const errortext = codeMessage[response.status] || response.statusText;
    notification.error({
        // message: `请求错误 ${response.status}: ${response.url}`,
        message: `请求错误 ${response.status}`,
        description: errortext
    });
    const error = new Error(errortext);
    error.name = response.status;
    error.response = response;
    console.error(error);
    // throw error;
    return response;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {function} [actions] Use redux-actions createAction create a action
 * @param {string} method     The request options, default 'GET'
 * @return {object}           An object containing either "data" or "err"
 */
export default (url, actions, method = 'GET') => {
    let successAction, failAction;
    if (!Array.isArray(actions)) {
        method = actions || 'GET';
    } else {
        [successAction, failAction] = actions;
    }
    method = method.toUpperCase();
    return (pathnames = {}, data = {}, headers = {}) => {
        return dispatch => {
            const params = {
                headers: { 'Content-Type': 'application/json', ...headers },
                method
            };

            let u = encodeURI(getUrl(url, pathnames));
            if (
                (method === 'POST' ||
                    method === 'PATCH' ||
                    method === 'UPDATE' ||
                    method === 'PUT' ||
                    method === 'DELETE') &&
                Object.keys(data).length !== 0
            ) {
                params.body = JSON.stringify(data);
            } else if (method === 'GET') {
                const searchParams = serialize(data);
                if (searchParams) {
                    if (url.indexOf('?') > 0) {
                        u = `${u}&${searchParams}`;
                    } else {
                        u = `${u}?${searchParams}`;
                    }
                }
            }
            return fetch(u, params)
                .then(checkStatus)
                .then(response => {
                    const contentType = response.headers.get('content-type');
                    if (
                        contentType &&
                        contentType.indexOf('application/json') !== -1
                    ) {
                        return response.json();
                    } else if (
                        contentType &&
                        contentType.indexOf('application/octet-stream') !== -1
                    ) {
                        return response.blob();
                    } else {
                        return response.text();
                    }
                })
                .then(
                    result => {
                        typeof successAction === 'function' &&
                            dispatch(successAction(result));
                        return result;
                    },
                    result => {
                        typeof failAction === 'function' &&
                            dispatch(failAction(result));
                    }
                );
        };
    };
};

const getUrl = (template, pathnames = {}) => {
    return template.replace(/\{\{(\w+)}}/g, (literal, key) => {
        if (key in pathnames) {
            return pathnames[key];
        } else {
            return '';
        }
    });
};

const serialize = params => {
    return Object.keys(params)
        .map(
            key =>
                `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        )
        .join('&');
};
