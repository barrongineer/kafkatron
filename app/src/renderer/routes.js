export default [
    {
        path: '/',
        name: 'connections',
        component: require('components/ConnectionsView')
    },
    {
        path: '/main',
        name: 'main',
        component: require('components/MainView')
    },
    {
        path: '*',
        redirect: '/'
    }
]
