<template>
  <clock :drawFunc="drawFunc" />
</template>
<script setup lang="ts">
import clock, {PropsType} from './components/clock.vue'
function  drawFunc(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, drawOption: PropsType) {
  ctx.save();
  ctx.beginPath()
  // 绘制圆
  let x = canvas.width / 2
  let y = canvas.height / 2
  let radius = Math.min(drawOption.border.width, drawOption.border.height) / 2 / 2
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.closePath()
  // 填充颜色
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  ctx.fill()
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