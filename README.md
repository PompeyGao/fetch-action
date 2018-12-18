# README

- 结合`antd`的`notification`组件和`whatwg-fetch`，快速创建action



```jsx
import { createAction, handleActions } from 'redux-actions';
import createFetchAction from './src/index.js';
//创建 action
const fetchInfoOk = createAction('登录成功');
const API = 'http://xx.xx';
const fetchInfo = createFetchAction(`${API}/api/info/`, [fetchInfoOk], 'GET');
```