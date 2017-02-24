import Vue from 'vue'
import Electron from 'vue-electron'
import Router from 'vue-router'
import Vuetify from 'vuetify'

import App from './App'
import routes from './routes'

import 'vuetify/dist/vuetify.min.css'
import 'vuetify/dist/vuetify.min.js'

Vue.use(Electron);
Vue.use(Router);
Vue.use(Vuetify);
Vue.config.debug = true;

const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes
});

/* eslint-disable no-new */
new Vue({
  router,
  ...App
}).$mount('#app');
