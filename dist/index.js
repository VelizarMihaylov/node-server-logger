import assert from 'assert'
import bunyan from 'bunyan'
import Elasticsearch from 'bunyan-elasticsearch'
import { isString, isObject } from 'lodash'

export const Modes = {
  console: 'console',
  logstash: 'logstash'
}

export const Levels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error'
}

export const ctxSerializer = function (ctx) {
  if (!ctx || !ctx.request || !ctx.response) {
    return ctx
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
  }
  return ctx
}

const isValidMode = (mode) => (Modes[mode])
const isValidLevel = (level) => (Levels[level])
const createLogger = (name, mode = Modes.console, level = Levels.warn, options = {}) => {
  assert(isValidMode(mode), 'Invalid logger mode')
  assert(isValidLevel(level), 'Invalid logger level')
  assert(isString(name), 'Invalid logger name')
  if (options.logstashHost) {
    assert(isString(options.logstashHost), 'Invalid logstashHost property in Logger options')
  }
  if (options.serializers) {
    assert(isObject(options.serializers), 'Invalid serializers property in Logger options')
  }
  const setStream = (mode) => {
    if (mode !== 'console') {
      const stream = new Elasticsearch({
        indexPattern: '[logstash-]YYYY.MM.DD',
        type: 'logs',
        host: options.logstashHost
      })
      stream.on('error', function (err) {
        console.log('Elasticsearch Stream Error:', err.stack)
      })
      return stream
    }
    const stream = process.stdout
    return stream
  }
  return bunyan.createLogger({
    name,
    level,
    streams: [
      {
        level: level,
        stream: setStream(mode)
      }
    ],
    serializers: options.serializers
  })
}

export default createLogger
