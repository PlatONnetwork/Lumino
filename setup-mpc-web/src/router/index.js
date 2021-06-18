import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../pages/home.vue')
  },
  {
    path: '/download',
    name: 'download',
    component: () => import('../pages/download.vue')
  }
]
const createRouter = () =>
  new Router({
    mode: 'history',
    scrollBehavior: () => ({ y: 0 }),
    routes: routes
  })

const router = createRouter()
console.log(router)
export default router
