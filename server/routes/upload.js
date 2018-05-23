const request = require('request');
const AuthService = require('../service/auth');

const {
  CONTRACT_URL,
  FINANCEBILL_URL,
  LEDGER_URL,
  OWNERSHIP_URL,
  PERFORMANCE_URL,
  PRODUCT_URL,
  RISKMANAGE_URL,
  SIGN_URL,
  SPARE_URL
} = process.env;

const moduleUrl = {
  contract: CONTRACT_URL,
  financebill: FINANCEBILL_URL,
  ledger: LEDGER_URL,
  ownership: OWNERSHIP_URL,
  performance: PERFORMANCE_URL,
  product: PRODUCT_URL,
  riskmanage: RISKMANAGE_URL,
  sign: SIGN_URL,
  spare: SPARE_URL
}

/**
 *	监听/upload，拦截并转发 post 请求到远程服务器，获取数据后发回客户端，实现自主跨域
 *	请求的参数body直接使用 JSON 格式即可，从客户端获取到的请求是 string，需要 parse 成对象
 */
function listenQuery(app, params) {
  isDev = params.isDev;
  app.use('/upload', (req, res, next) => {
    AuthService
      .checkLogin(req)
      .then((data) => {
        if (data.code === 200) {
          next();
        } else {
          res.json(data);
        }
      })
      .catch((data) => {
        res.json(data);
      })
  }, (req, res, next) => {
    const host = req.headers.origin;
    res.header('Access-Control-Allow-Origin', host);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'POST');
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;
    const {module, path, filter} = body;
    const url = getUrlByModule(module, path);

    if (isDev) {
      console.log('request url: ', url);
      console.log('filter: ', filter);
    }

    const formData = {
      file: request.get(filter.file)
    };
    Object
      .keys(filter)
      .forEach((key) => {
        if (key !== 'file') {
          formData[key] = filter[key];
        }
      });

    request.post(url, {
      formData
    }, (error, response, data) => {
      if (!error && response.statusCode === 200) {
        console.log('post success: ', data);
        res.send(data);
      } else {
        console.log('post error: ', error);
        let errData = {
          "code": -1,
          "msg": '接口错误',
          "data": {
            err: error
          }
        };
        res.send(errData);
      }
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

module.exports = listenQuery;
