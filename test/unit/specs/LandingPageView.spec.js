import Vue from 'vue'
import MainView from 'renderer/components/MainView'

describe('MainView.vue', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(MainView)
    }).$mount()

    expect(vm.$el.querySelector('h1').textContent).to.contain('Welcome.')
  })
})
