/**
 * 前台首页路由设置
 */

'use strict'
const express = require('express');
const router = express.Router();
const {moduleName} = require('../global');

/**
 * 获取css结构
 */
function getCss (key) {
  const fileMapping = global.package[key];
  const buildLink = function (href) {
    return `<link href="${href}" rel="stylesheet">\n`
  };
  if (fileMapping) {
    return `${buildLink(fileMapping[`${key}.css`])}`
  }
  return ''
};

/**
 * 获取js结构
 */
function getJs (key) {
  const fileMapping = global.package[key];
  const buildScript = function (src) {
    return `<script src="${src}"></script>\n`;
  };
  if (fileMapping) {
      let vendorjs, keyjs, vendordlljs, editorjs
      vendorjs = fileMapping[`vendor.js`]
      keyjs = fileMapping[`${key}.js`]
      vendordlljs = keyjs.replace(new RegExp(`/${key}/.*$`), `/${key}/dll/vendor.dll.js`)
      editorjs = keyjs.replace(new RegExp(`/${key}/.*$`), `/${key}/ckeditor/ckeditor.js`)
      return `${buildScript(vendordlljs)}${buildScript(keyjs)}${buildScript(editorjs)}`;
    }
    return ''
  };

/**
 * 获取title
 */
function getTitle (key) {
  const fileMapping = global.package[key];
  if (fileMapping) {
    return fileMapping['title'] || 'title';
  }
  return ''
};

/**
 * 获取Render的数据结构
 */
function getRenderData(moduleName, userInfo = {}){
  const links = getCss(moduleName);
  const scripts = getJs(moduleName);
  const title = getTitle(moduleName);
  return {
    title: title,
    links: links,
    scripts: scripts,
    data: JSON.stringify(userInfo)
  }
}

/**
 * package包进入
 */
router.get('/',function(req, res, next){
  const {userInfo} = req
  try {
    const ret = getRenderData(moduleName, userInfo);
    res.render('page', ret);
  } catch (err) {
    console.log(err)
  }
});

/**
 * 拦截package的页面
 */
router.get('*',function (req,res,next) {
  const {userInfo} = req
  try {
    const ret = getRenderData(moduleName, userInfo);
    res.render('page', ret);
  } catch (err) {
    console.log(err)
  }
})

module.exports = router;
