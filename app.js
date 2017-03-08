#!/usr/bin/env node

const express = require('express')
const path = require('path')
const axios = require('axios')
const send = require('send')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: false
}))

app.post('/search', function (req, res) {
  const size = 10
  var query = req.body.query.replace(/\W/g, ' ')

  axios.post('http://localhost:9200/index/_search?size=' + size + '&from=' + ((req.query.page || 0) * size), {
    'query': {
      'bool': {
        'must': {
          'query_string': {
            'default_field': 'text',
            'query': query
          }
        },
        'should': [
          {
            'query_string': {
              'fields': ['title', 'meta.description', 'meta.keywords', 'meta.author'],
              'query': query,
              'boost': 10
            }
          },
          {
            'query_string': {
              'fields': ['tags.h1', 'tags.h2', 'tags.h3', 'tags.h4', 'tags.h5', 'tags.h6'],
              'query': query,
              'boost': 5
            }
          },
          {
            'query_string': {
              'fields': ['tags.i', 'tags.em', 'tags.b', 'tags.strong'],
              'query': query,
              'boost': 3
            }
          },
          {
            'query_string': {
              'fields': ['url'],
              'query': query,
              'boost': 1
            }
          }
        ]
      }
    },
    'highlight': {
      'fragment_size': 140,
      'number_of_fragments': 3,
      'fields': {
        'text': {}
      }
    }
  }).then(function (response) {
    if (response.data.hits) {
      for (var i = 0; i < response.data.hits.hits.length; i++) {
        delete response.data.hits.hits[i]._source.text
      }
      response.data.hits.pages = Math.ceil(response.data.hits.total / size)
    }
    res.send(response.data)
  }).catch(function (error) {
    console.error(error)
    res.status(502)
    res.send({
      message: 'Bad Gateway'
    })
  })
})

app.use(express.static(path.join(__dirname, 'dist'), {
  fallthrough: true
}))

app.use(function (req, res, next) {
  send(req, 'dist/index.html').pipe(res)
})

app.listen(3000, function () {
  console.log('App listening on port 3000!')
})
