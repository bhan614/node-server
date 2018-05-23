/**
 * 入口文件
 */
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('./helper/mylogger').Logger;
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(bodyParser.json({limit: '20mb'}));//设置前端post提交最大内容
app.use(bodyParser.urlencoded({limit: '20mb', extended: false}));
app.use(bodyParser.text({limit: '20mb'}));
app.use(cookieParser());

app.use('/news', require('./routes/news'));

app.use(require('./helper/requestLogger').create(logger));

const staticUrl = path.join(__dirname, '../public');
console.log('start', staticUrl, __dirname);
app.use('/public', express.static(staticUrl));

// listen /query
require('./routes/query')(app, {isDev: process.env.NODE_ENV === 'development'});
require('./routes/file')(app);
require('./routes/upload')(app, {isDev: process.env.NODE_ENV === 'development'});

// load routers
require('./boot')(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  //不处理 map 和 json 格式的数据
  if (/\.(map|json)$/.test(req.url)) {
    return next();
  }
  const err = new Error(`${req.url},Not Found`);
  err.status = 404;
  next(err);
});

// error handlers
// will print stacktrace
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    layout: false,
    title: 'Error',
    message: err.message,
    error: err
  });
});

module.exports = app;
