<template>
  <div id="#app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    mounted () {
      this.$vuetify.init();

      document.getElementById('#app').setAttribute('style', 'width: 100%;');
    }
  }
</script>

<style>
  @import url(https://fonts.googleapis.com/css?family=Lato:300);
  @import url(https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons);

  * {
    margin: 0;
    padding: 0;
  }

  html {
    overflow-y: auto;
  }

  html,
  body { height: 100%; }

  body {
    <!--align-items: center;-->
    background:
      radial-gradient(
        ellipse at center,
        rgba(255, 255, 255, 1) 0%,
        rgba(229, 229, 229, .85) 100%
      );
    background-position: center;
    display: flex;
    font-family: Lato, Helvetica, sans-serif;
    justify-content: center;
    text-align: center;
  }
</style>
