import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style/index.scss'

Vue.config.productionTip = false

function resizeFn() {
  const htmlWidth = document.documentElement.clientWidth || document.body.clientWidth
  const htmlDom = document.getElementsByTagName('html')[0]
  htmlDom.style.fontSize = htmlWidth / 19.2 + 'px'
}

resizeFn()

window.onresize = () => {
  resizeFn()
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
