import Clock from "./clock.vue";

export const clock = Clock

export default {
  install(app){
    app.component('clock', Clock)
  }
}