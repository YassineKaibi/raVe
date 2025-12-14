import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import rave from '@/components/rave'
Vue.component('rave', rave)

Vue.config.productionTip = false

router.beforeEach((to, from, next) => {
  const { autoEnter } = store.state.settings
  if (autoEnter && to.name === 'home') {
    if (from.name === 'visualizer') {
      store.commit('setAutoEnter', false)
    } else {
      return next('/visualizer')
    }
  }
  next()
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
