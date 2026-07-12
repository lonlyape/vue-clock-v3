<template>
  <clock :drawFunc="drawFunc" />
</template>
<script setup lang="ts">
import clock from './components/clock.vue'
function  drawFunc(canvas: HTMLCanvasElement) {
  console.log(canvas)
}
</script>
<style>
html,body,#app{
  position: absolute;
  background-color: rgb(33, 39, 34);
  top: 0 ;
  bottom: 0 ;
  left: 0;
  right: 0;
  padding: 0;
  margin: 0;
}
</style>