const express = require('express')
const request = require('request');
const router = express.Router()
const {decorationContractVersion, leaseContractVersion} = require('../global')
const {
  APOLLO_URL
} = process.env
// const timeTrans = (value) => {
//      const arr = new Date(parseInt(value, 10)).toLocaleString().replace(/:\d{1,2}$/, ' ').split(',')[0].split('/');
//      //return arr.splice(2, 1).concat(arr).join('-')
//      return arr.join('-')
// }

router.get('/newsPreview', function ( req, res, next ) {
    res.set('Cache-Control', 'no-store,no-cache')
    const url = `${APOLLO_URL}news/getDetail`
    const body = req.query
    body.id = Number(body.id)
    const cookie = req.headers.cookie
    
    doPost1({
        url,
        body,
        headers: {
            cookie,
            'X-Requested-With': 'XMLHttpRequest'
        }
    }).then( data => {
        //console.log(data)
        let finaldata = {}
        if (data.status === 200) {
            finalData = data.data
        }
        console.log(finalData)
        res.render('preview', finalData)
    }).catch( error => {
        next({
            status:404
        })
    })
  })

  function doPost1(options, extra) {
    console.log(`传入参数：${JSON.stringify(options.body)}`)
    options = Object.assign({}, {
        method: 'POST',
        json: true,
        timeout: 30000,
    }, options);
    return new Promise((resolve, reject) => {
        request(options, (error, response, data) => {
            console.log(`调用接口：${options.url}`);
            console.log(`状态码statusCode: ${response && response.statusCode}`);
            if (!error && response.statusCode === 200) {
                console.log(`返回数据：${JSON.stringify(data)}`)
                //logger.info(data);
                //data.createTime = timeTrans(data.createTime)
                console.log(`creatTime是：${data.createTime}`)
                resolve(data);
            } else {
                console.log(`报错信息：${JSON.stringify(error)}`)
                // 获取远程数据出错
                logger.error(options.url);
                logger.error(data);
                let msg = '远端服务访问出错';
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
                reject(errData);
            }

          /*
            //该数据用于日志系统
            request({
              method: 'POST',
              json: true,
              url: 'http://172.29.80.149:1995/logSource',
              body: {
                module: extra.module,
                req: {
                  url: options.url,
                  date: extra.date,
                  headers: options.headers,
                  body: options.body,
                },
                res: {
                  statusCode: response ? response.statusCode : -1,
                  body: error ? error : data
                }
              }
            })
          */
        })
    })
}

module.exports = router