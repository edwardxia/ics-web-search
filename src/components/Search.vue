<template>
  <div class="search">
    <nav class="navbar sticky-top navbar-light bg-faded">
      <div class="container">
        <form class="form-inline" @submit.prevent="submit">
          <div class="input-group">
            <input class="form-control" type="text" placeholder="Search" v-model="query">
            <span class="input-group-btn">
              <button class="btn btn-secondary" type="submit">Go!</button>
            </span>
          </div>
        </form>
      </div>
    </nav>
    <div class="hits container" v-if="hits">
      <p class="my-3"><span v-if="$route.params.page">Page {{ $route.params.page }} of </span>{{ hits.total }} results</p>

      <div v-for="hit in hits.hits">
        <div v-if="hit._type == 'html'">
          <a :href="hit._source.url" v-if="hit._source.title">{{ hit._source.title }}</a>
          <a :href="hit._source.url" v-else>{{ hit._source.url | basename }}</a>
        </div>
        <div v-else-if="hit._type == 'xml'">
          <span class="text-primary">[XML]</span>
          <a :href="hit._source.url">{{ hit._source.url | basename }}</a>
        </div>
        <div v-else-if="hit._type == 'text'">
          <span class="text-primary">[TXT]</span>
          <a :href="hit._source.url">{{ hit._source.url | basename }}</a>
        </div>
        <div class="text-success">
          {{ hit._source.url }}
        </div>
        <p class="text" v-html="hit.highlight.text.join(' … ')"></p>
      </div>

      <nav aria-label="Page navigation">
        <ul class="pagination">
          <router-link tag="li" :to="first" class="page-item" active-class="disabled" exact>
            <a class="page-link" aria-label="First">
              <span aria-hidden="true">&laquo;</span>
              <span class="sr-only">First</span>
            </a>
          </router-link>
          <router-link tag="li" :to="previous" class="page-item" active-class="disabled" exact>
            <a class="page-link" aria-label="Previous">
              <span aria-hidden="true">&lsaquo;</span>
              <span class="sr-only">Previous</span>
            </a>
          </router-link>
          <router-link tag="li" :to="p" class="page-item hidden-sm-down" active-class="active" exact v-for="p in pagination">
            <a class="page-link">{{ p.params.page || 1 }}</a>
          </router-link>
          <router-link tag="li" :to="next" class="page-item" active-class="disabled" exact>
            <a class="page-link" aria-label="Next">
              <span aria-hidden="true">&rsaquo;</span>
              <span class="sr-only">Next</span>
            </a>
          </router-link>
          <router-link tag="li" :to="last" class="page-item" active-class="disabled" exact>
            <a class="page-link" aria-label="Last">
              <span aria-hidden="true">&raquo;</span>
              <span class="sr-only">Last</span>
            </a>
          </router-link>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'search',
  created () {
    this.search()
  },
  computed: {
    page () {
      return Number(this.$route.params.page) || 1
    },
    pagination () {
      var links = []
      links.push(this.to(this.page))

      for (var i = this.page - 1, j = this.page + 1; i >= 1 || j <= this.hits.pages; i--, j++) {
        if (i >= 1 && links.unshift(this.to(i)) >= 10) {
          break
        }
        if (j <= this.hits.pages && links.push(this.to(j)) >= 10) {
          break
        }
      }

      return links
    },
    first () {
      return this.to(1)
    },
    previous () {
      return this.to(this.page - 1)
    },
    next () {
      return this.to(this.page + 1)
    },
    last () {
      return this.to(this.hits.pages)
    }
  },
  data () {
    return {
      query: this.$route.params.query || '',
      hits: null
    }
  },
  filters: {
    basename (value) {
      if (!value) return ''
      return value.match(/[^/]*$/)[0]
    }
  },
  watch: {
    '$route' () {
      this.search()
    }
  },
  methods: {
    search () {
      var self = this
      this.hits = null

      if (this.query === '') {
        document.title = 'Search'
      } else {
        document.title = this.query + ' - Search'

        axios.post('/search?page=' + (this.page - 1), {
          query: this.query
        }).then(function (response) {
          self.hits = response.data.hits
        }).catch(function (error) {
          console.error(error)
        })
      }
    },
    submit () {
      this.$router.push({
        name: 'search',
        params: {
          query: this.query
        }
      })
    },
    to (i) {
      if (i > this.hits.pages) {
        i = this.hits.pages
      }
      if (i <= 1) {
        return {
          name: 'search',
          params: {
            query: this.query
          }
        }
      }
      return {
        name: 'search',
        params: {
          query: this.query,
          page: i
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
* {
  overflow-wrap: break-word;
}
p.text em {
  font-style: normal;
  font-weight: bold;
}
.page-item.active {
  display: list-item!important;
}
</style>
