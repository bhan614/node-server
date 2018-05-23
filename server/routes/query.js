const request = require('request');
const AuthService = require('../service/auth');
const logger = require('../helper/mylogger').Logger;

let isDev = false;

const {
  APOLLO_URL
} = process.env;

const moduleUrl = {
  apollo: APOLLO_URL
}
console.log('原始moduleUrl::', moduleUrl);

/**
 *	监听/query，拦截并转发 post 请求到远程服务器，获取数据后发回客户端，实现自主跨域
 *	请求的参数body直接使用 JSON 格式即可，从客户端获取到的请求是 string，需要 parse 成对象
 */
function listenQuery(app, params) {
  isDev = params.isDev;
  app.use('/query', /*(req, res, next) => {
    AuthService.checkLogin(req).then((data) => {
      if (data.code === 200) {
        next()
      } else {
        res.json(data)
      }
    }).catch((data) => {
      res.json(data)
    })
  },*/ (req, res, next) => {
    const host = req.headers.origin;
    res.header('Access-Control-Allow-Origin', host);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'POST');
    // 默认为非debug模式，不显示详细信息
    // 需要查看详细的请求信息时，在网址里加上 不知道怎么办了 的全拼，
    // 表页用?buzhidao... 详情页用 _buzhidaozenmebanle_(3|4)$ 可以实现
    const referer = req.headers.referer || '';
    const isDebug = referer.indexOf('buzhidaozenmebanle') > 0 ? true : false;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { module, path, filter } = body;
    const url = getUrlByModule(module, path);

    if (isDev) {
      console.log(`request url:: ${url}, \nfilter::\n`, filter);
    }

    const cookie = req.headers.cookie;
    doPost({url, body: filter, isDebug, headers: {
      cookie,
      'X-Requested-With': 'XMLHttpRequest'
    } }, (data) => {
      res.send(data);
      res.end();
    });
  });
}

/**
 *  根据模块名称取得URL
 */
function getUrlByModule(module, path) {
  const url = `${moduleUrl[module].replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  console.log(`使用 ${module} 的地址: ${url}`);
  return url;
}

/**
 *  发送请求
 *  @param options: Object
 *  @param callback: Function
 */
function doPost(options, callback) {
  options = Object.assign({}, {
		method: 'POST',
    json: true,
    timeout: 20000,
  }, options);

  request(options, (error, response, data) => {
    console.log('statusCode: ', response && response.statusCode);
     console.log("+++++", error);
    if (!error && response.statusCode === 200) {
      if (isDev) {
        console.log('Remote server response::\n-------------------------------\n', data);
        console.log('-------------------------------');
      }
      logger.info(options.url);
      //logger.info(data);
	  callback(data);
    } else {
	  // 获取远程数据出错
	  logger.error(options.url);
      logger.error(data);
      let msg = '接口错误';
      let debugInfo = options.isDebug ? `code: ${response ? response.statusCode : 'no response'}. api url: ${options.url}` : '';
			let errData = {
				"code": -1,
				"msg": msg,
				"data": {
          raw: options.body,
          err: error,
        },
			};
      debugInfo === '' || (errData['debug'] = debugInfo);
			callback(errData);
    }
  });
}

module.exports = listenQuery
