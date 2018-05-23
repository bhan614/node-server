const express = require('express')
const router = express.Router()
const Busboy = require('busboy')
const concat = require('concat-stream')
const request = require('request')
const Jimp = require("jimp");
const Promise = require('bluebird')
const AuthService = require('../service/auth');
const url = ''
const {
    CONTRACT_URL,
    FINANCEBILL_URL,
    LEDGER_URL,
    OWNERSHIP_URL,
    PERFORMANCE_URL,
    PRODUCT_URL,
    RISKMANAGE_URL,
    SIGN_URL,
    SPARE_URL,
    COMMISSION_URL,
    FINANCE_URL,
    ASSETMANAGE_URL,
    INFORMATION_URL,
    KE_URL
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
    spare: SPARE_URL,
    commission: COMMISSION_URL,
    finance: FINANCE_URL,
    assetmanage: ASSETMANAGE_URL,
    information: INFORMATION_URL,
    ke: KE_URL
}
/**
 * 检测是否登录
 * @param req
 * @param res
 * @param next
 */
const checkLogin = (req, res, next) => {
    AuthService.checkLogin(req).then((data) => {
        if (data.code === 200) {
            next()
        } else {
            res.json(data)
        }
    }).catch((data) => {
        res.json(data)
    })
}
/**
 * 设置跨域相应请求头
 * @param req
 * @param res
 * @param next
 */
const setAccessControlAllow = (req, res, next) => {
    const host = req.headers.origin;
    res.header('Access-Control-Allow-Origin', host);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'POST');
    next()
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
 *  发送请求，返回值为流对象
 *  @param options: Object
 *  @param callback: Function
 */
function doPost(options) {
    options = Object.assign({}, {
        method: 'POST',
        json: true,
        timeout: 3000,
    }, options);
    return request(options, (error, response, data) => {
    });
}

/**
 * 上传图片
 * @param formData
 */
const upload = (formData) => {
    return new Promise(function (resolve, reject) {
        request.post(formData, function (err, response, body) {
            if (err) {
                return reject({
                    code: -1,
                    msg: err
                })
            }
            resolve(JSON.parse(body))
        })
    })
}
/**
 * 处理图片 生成两个地址，一个原图，一个缩略图
 * @param fileName
 * @param mimeType
 * @returns {Function}
 */
const handleImage = (fileName, mimeType) => res => callback => fileBuffer => {
    const promiseJimp = new Promise((resolve, reject) => {
        //将原图压缩
        Jimp.read(fileBuffer, function (err, data) {
            if (err) return reject(err)
            const length = fileBuffer.length
            let quality
            if (length < 100000) {
                //小于100kb
                quality = 100
            } else if (length < 200000) {
                //小于200kb
                quality = 80
            } else if (length < 1000000) {
                //小于1mb
                quality = 60
            } else if (length < 2000000) {
                //小于2mb
                quality = 20
            } else {
                quality = 10
            }
            data.quality(quality)
            console.log(`mimeType：${mimeType}`)
            console.log(`quality: ${quality}`)
            if (mimeType === 'image/png') {
                data.rgba(true);             // set whether PNGs are saved as RGBA (true, default) or RGB (false)
                data.filterType(-1);     // set the filter type for the saved PNG （-1-4）
                data.deflateLevel(9);   // set the deflate level for the saved PNG (0-9)
                data.deflateStrategy(0); // set the deflate for the saved PNG (0-3)
                data.scale(0.5)
            }
            data.exifRotate()
            data.getBuffer(Jimp.AUTO, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    })
    //压缩后的原图再生成缩略图
    promiseJimp.then((buffer) => {
        Jimp.read(buffer, function (err, data) {
            if (err) return res.json(err)
            const newPromise = new Promise((resolve, reject) => {
                data.resize(Jimp.AUTO, 150, Jimp.RESIZE_BICUBIC)
                data.exifRotate()
                data.quality(50)
                data.getBuffer(Jimp.AUTO, function (nothing, image) {
                    resolve(image)
                });
            })
            return newPromise.then(data => {
                //缩略图
                const formDataOne = {
                    key: '&9KJASVPYM8XO2HC',
                    uploadFiles: {
                        value: data,
                        options: {
                            filename: fileName,
                            contentType: mimeType
                        }
                    }
                }
                //原图
                const formDataTwo = {
                    key: '&9KJASVPYM8XO2HC',
                    uploadFiles: {
                        value: buffer,
                        options: {
                            filename: fileName,
                            contentType: mimeType
                        }
                    }
                }
                const promiseOne = upload({
                    url,
                    formData: formDataOne
                })
                const promiseTwo = upload({
                    url,
                    formData: formDataTwo
                })
                Promise.all([promiseOne, promiseTwo]).then(arr => {
                    if (arr[0].code === 200 && arr[1].code === 200) {
                        const data = {}
                        data.breviary = arr[0].data
                        data.originData = arr[1].data
                        //上传成功后，需要进行其他的操作
                        if (callback) {
                            return callback(data.originData.url, data.breviary.url)
                                .then(data => {
                                    if (data.code === 1) {
                                        return res.json({
                                            code: 1,
                                            msg: 'success',
                                            data: data.data
                                        })
                                    }
                                }).catch(err => {
                                    return Promise.reject({
                                        code: -1,
                                        data: null,
                                        msg: err
                                    })
                                })
                        }
                        return res.json({code: 1, msg: 'success', data: data});
                    } else {
                        return Promise.reject({
                            code: -1,
                            data: null,
                            msg: arr
                        })
                    }
                }).catch(err => {
                    return res.json({code: -1, msg: err, data: null})
                })
            })
        })
    })
        .catch(err => {
            res.send(err)
            res.end()
        })
}

/**
 * 备件上传图片接口
 *
 */
router.post('/img/upload', checkLogin, (req, res, next) => {
    const busboy = new Busboy({
        headers: req.headers
    })
    busboy.on('file', function (fieldName, fileStream, fileName, encoding, mimeType) {
        fileStream.pipe(concat(handleImage(fileName, mimeType)(res)()))
    })
    req.pipe(busboy)
})

/**
 * 根据参数的文件链接，将文件拉取下来后，提交到后台
 */
router.post('/upload', checkLogin, setAccessControlAllow, (req, res, next) => {
    const body = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;
    const {module, path, filter} = body;
    const url = getUrlByModule(module, path);
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
                "msg": 'QUERY API ERROR.',
                "data": {
                    err: error
                }
            };
            res.send(errData);
        }
    });
})

/**
 * 获取文件接口
 */
router.post('/file', checkLogin, setAccessControlAllow, (req, res, next) => {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {module, path} = body;
    const url = getUrlByModule(module, path);
    const queryParam = Object.assign({}, body);
    delete queryParam.path;
    delete queryParam.module;
    const cookie = req.headers.cookie;
    doPost({
        url, body: queryParam, headers: {
            cookie,
            'X-Requested-With': 'XMLHttpRequest'
        }
    }).pipe(res);

})


/**
 * ke转发文件接口
 */
router.post('/keUpload', checkLogin, setAccessControlAllow, (req, res, next) => {
  const busboy = new Busboy({
      headers: req.headers,
  })
  const sendBuffer = (fileName, mimeType) => (fileBuffer) => {
    const formData = {
      uploadFile: {
          value: fileBuffer,
          options: {
              filename: fileName,
              contentType: mimeType
          }
      }
    }
    request.post({
      url: `${moduleUrl.ke}app/v1/payback/upload`,
      formData
    }, function (err, response, body) {

    }).pipe(res)
  }
  busboy.on('file', function (fieldName, fileStream, fileName, encoding, mimeType) {
      fileStream.pipe(concat(sendBuffer(fileName, mimeType)))
  })
  req.pipe(busboy)
});

module.exports = router
