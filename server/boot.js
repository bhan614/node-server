/**
 * 自动加载路由页面
 */
const fs = require('fs');
const path = require('path');
const {PACKAGE_PATH, PERMISSION_ROUTER} = require('./global');
const AuthService = require('./service/auth');
const config = require('./config');

/**
 * 拼接用户数据
 * @param userinfo
 * @param authority
 * @returns {{}}
 */
const generateUserInfo = (userinfo, authlist) => {
  const finalData = {};
  finalData.USER_INFO = userinfo;
  finalData.AUTH_LIST = authlist;
  return finalData;
}
/**
 * 检查是否登录
 * @param req
 * @param res
 * @param next
 * @param returnUrl
 */
const checkLoginStatus = ( req, res, next ) => {
  const returnUrl = `${encodeURIComponent(`${req.protocol}://${req.headers.host}${req.originalUrl}`)}` || '';
  const ssoUrl = process.env.SSO_URL;

  AuthService.checkLogin(req).then(doc => {
    if (doc.code === 200){
      const userInfo = doc.data;
      const appIds = config.APPIDS;
      const { path } = req;
      const routerPath = PERMISSION_ROUTER[path];
      req.userInfo = generateUserInfo(userInfo, [])
      if (!routerPath) {
        return next();
      }
      const roleIds = (userInfo.roleDTOList || []).map((item, index) => {
        return item.id
      });
      const params = {
        roleIds,
        appIds
      };
      //roleid为空时不能请求uc
      if (roleIds.length === 0) {
        return res.redirect('/no-permission');
      }
      AuthService.getAuthDetail(params, req).then(authdoc => {
        //将用户信息写入req中
        const {data} = authdoc;
        if (data[0]) {
          const permission = data[0].permission;
          let {menuList, buttonList, apiList} = permission;
          menuList = menuList && menuList.map(item => item.permissionCode).join(',');
          buttonList = buttonList && buttonList.map(item => item.permissionCode).join(',');
          apiList = apiList && apiList.map(item => item.permissionCode).join(',');
          console.log('routerPath', routerPath);
          console.log('menuList', menuList);
          if (menuList && menuList.includes(routerPath)) {
            const permission = {menuList, buttonList, apiList}
            req.userInfo = generateUserInfo(userInfo, permission)
            return next();
          }
          return res.redirect('/no-permission');
        }
        return res.redirect('/no-permission');
      }).catch(err => {
        console.log(err);
      })
    } else {
      res.redirect( `${ssoUrl}login?returnUrl=${returnUrl}` );
    }
  }).catch(err => {
    console.log(err);
    res.redirect( `${ssoUrl}login?returnUrl=${returnUrl}` );
  });
}

const Page = require('./routes/page'); //页面的路由

global.package = {};
/**
* 自动添加package包的路由
*/
function addPackageRoute(app){
  const packageRouterPath = path.join(__dirname,PACKAGE_PATH);
  fs.readdirSync(packageRouterPath).forEach(function(name){
    var filePath = path.join(packageRouterPath,name);
    if(fs.statSync(filePath).isDirectory()){
      var config = {}
      try {
        config = require(filePath+'/mapping.json')
      } catch (e) {
        console.log(e)
      } finally {
        global.package[name] = config;
        if(name !== 'layout'){
          app.use('/'+name, checkLoginStatus, Page);
        }
      }
    }
  });
}

module.exports = function(app){
  addPackageRoute(app); //自动处理package包的路由
  app.use('/', Page); //页面级别路由
};
