'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ctxSerializer = exports.Levels = exports.Modes = undefined;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _bunyanElasticsearch = require('bunyan-elasticsearch');

var _bunyanElasticsearch2 = _interopRequireDefault(_bunyanElasticsearch);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Modes = exports.Modes = {
  console: 'console',
  logstash: 'logstash'
};

var Levels = exports.Levels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error'
};

var ctxSerializer = exports.ctxSerializer = function ctxSerializer(ctx) {
  if (!ctx || !ctx.request || !ctx.response) {
    return ctx;
  }
  ctx = {
    request: {
      method: ctx.request.method,
      url: ctx.request.url
    },
    response: {
      status: ctx.response.status,
      contentType: ctx.response.header['content-type'],
      contentLength: ctx.response.header['content-length']
    }
  };
  return ctx;
};

var isValidMode = function isValidMode(mode) {
  return Modes[mode];
};
var isValidLevel = function isValidLevel(level) {
  return Levels[level];
};
var createLogger = function createLogger(name) {
  var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Modes.console;
  var level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Levels.warn;
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  (0, _assert2.default)(isValidMode(mode), 'Invalid logger mode');
  (0, _assert2.default)(isValidLevel(level), 'Invalid logger level');
  (0, _assert2.default)((0, _lodash.isString)(name), 'Invalid logger name');
  if (options.logstashHost) {
    (0, _assert2.default)((0, _lodash.isString)(options.logstashHost), 'Invalid logstashHost property in Logger options');
  }
  if (options.serializers) {
    (0, _assert2.default)((0, _lodash.isObject)(options.serializers), 'Invalid serializers property in Logger options');
  }
  var setStream = function setStream(mode) {
    if (mode !== 'console') {
      var _stream = new _bunyanElasticsearch2.default({
        indexPattern: '[logstash-]YYYY.MM.DD',
        type: 'logs',
        host: options.logstashHost
      });
      _stream.on('error', function (err) {
        console.log('Elasticsearch Stream Error:', err.stack);
      });
      return _stream;
    }
    var stream = process.stdout;
    return stream;
  };
  return _bunyan2.default.createLogger({
    name: name,
    level: level,
    streams: [{
      level: level,
      stream: setStream(mode)
    }],
    serializers: options.serializers
  });
};

exports.default = createLogger;
