#!/usr/bin/env node

const fs = require('fs')
const spawnSync = require('child_process').spawnSync

const axios = require('axios').create({
  baseURL: 'http://localhost:9200'
})
const eachLimit = require('async').eachLimit
const jsdom = require('jsdom')

jsdom.defaultDocumentFeatures = {
  FetchExternalResources: false,
  ProcessExternalResources: false,
  SkipExternalResources: true
}

axios.interceptors.request.use(function (config) {
  console.log(config.method.toUpperCase(), config.url)
  return config
})

var resetIndex = function (callback) {
  axios.head('/index').then(function (response) {
    axios.delete('/index').then(function () {
      createMappings(callback)
    })
  }).catch(function () {
    createMappings(callback)
  })
}

var createMappings = function (callback) {
  axios.put('/index', {
    'mappings': {
      'html': {
        'properties': {
          'meta.keywords': {
            'type': 'keyword'
          }
        }
      }
    }
  }).then(callback).catch(function (err) {
    console.error(err.response.data)
    throw err
  })
}

var book = JSON.parse(fs.readFileSync('./bookkeeping.json').toString())

resetIndex(function () {
  eachLimit(Object.keys(book), 1, function (file, done) {
    var url = 'http://' + book[file]
    console.log(file, url)

    var fileType = spawnSync('file', ['-b', file]).stdout.toString()

    if (/text/.test(fileType)) {
      var type = 'text'
      var data = {
        url,
        text: fs.readFileSync(file).toString().replace(/\s+/g, ' ')
      }

      if (/HTML|XML/.test(fileType)) {
        var document = jsdom.jsdom(data.text, {
          url
        })
        var root = document.documentElement

        type = (document.doctype || root.tagName === 'HTML') ? 'html' : 'xml'

        var body = document.body

        data.text = (body || root).textContent

        if (document.title != null) {
          data.title = document.title
        }

        var canonical = root.querySelector('link[rel=canonical]')
        if (canonical && canonical.href) {
          data.url = canonical.href
        }

        var names = ['description', 'keywords', 'author']
        for (var i in names) {
          var el = root.querySelector('meta[name=' + names[i] + ']')
          if (el && el.content) {
            if (data.meta == null) {
              data.meta = {}
            }
            if (names[i] === 'keywords') {
              data.meta[names[i]] = el.content.split(',').map(function (keyword) {
                return keyword.replace(/^\s+|\s+$/g, '')
              })
            } else {
              data.meta[names[i]] = el.content
            }
          }
        }

        if (body) {
          var tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'em', 'b', 'strong']
          for (var j in tags) {
            var tag = tags[j]
            var els = body.getElementsByTagName(tag)

            if (els.length) {
              if (data.tags == null) {
                data.tags = {}
              }
              if (data.tags[tag] == null) {
                data.tags[tag] = []
              }
              for (var k in els) {
                data.tags[tag].push(els[k].textContent)
              }
            }
          }
        }
      }

      axios.post('/index/' + type + '/', data).then(function (response) {
        done()
      }).catch(function (err) {
        console.error(err)
        done()
      })
    } else {
      done()
    }
  })
})
