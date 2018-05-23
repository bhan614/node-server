//全局业务配置
const {SSO_URL, UC_URL, PASSPORT_URL} = process.env
module.exports = {
  PACKAGE_PATH: '../../package-modules/',
  moduleName: '',
  privateKey: '',
  secret: '',
  apis: {
    validateToken: `${PASSPORT_URL}checkToken`,
    getAuthority: `${UC_URL}api/permission/queryByRoleIdsAndAppIds`
  },
  PERMISSION_ROUTER: {
    '/': 'ApolloBMS_menu_Root',
    '/Base': 'ApolloBMS_menu_Banner',
    '/Base/Banner': 'ApolloBMS_menu_Banner',
    '/Base/City': 'ApolloBMS_menu_City',
    '/Base/Product': 'ApolloBMS_menu_Product',
    '/Base/Advert': 'ApolloBMS_menu_Product',
    '/Base/Business': 'ApolloBMS_menu_Business',
    '/UserCenter': 'ApolloBMS_menu_UserCenter',
    '/UserCenter/User': 'ApolloBMS_menu_User',
    '/Content': 'ApolloBMS_menu_Content',
    '/Content/Notice': 'ApolloBMS_menu_Notice',
    '/Content/Topic': 'ApolloBMS_menu_Topic',
    '/Content/Hot': 'ApolloBMS_menu_Hot',
    '/Content/Feedback': 'ApolloBMS_menu_Feedback',
    '/Website': 'ApolloBMS_menu_Website',
    '/Website/WebBanner': 'ApolloBMS_menu_WebBanner',
    '/Website/WebProduct': 'ApolloBMS_menu_WebProduct',
    '/Website/WebProduct/WebZuBei': 'ApolloBMS_menu_WebZuBei',
    '/Website/WebProduct/WebDecorate': 'ApolloBMS_menu_Decorate',
    '/Website/WebProduct/WebLive': 'ApolloBMS_menu_Live',
    '/Website/WebUser': 'ApolloBMS_menu_WebUser',
    '/Website/Recruit': 'ApolloBMS_menu_Recruit',
    '/Website/News': 'ApolloBMS_menu_News',
  }
};
