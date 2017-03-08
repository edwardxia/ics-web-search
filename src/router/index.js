import Vue from 'vue'
import Router from 'vue-router'
import Search from '@/components/Search'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/:query?/:page?',
      name: 'search',
      component: Search
    },
    { path: '/:query?/1',
      component: Search,
      alias: '/:query'
    }
  ]
})
