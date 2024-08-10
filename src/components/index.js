import Clock from "./clock.vue";

export const clock = Clock

export default {
  install(app){
    app.component('clock', Clock)
    app.component('clock-lonlyape', Clock)
  }
}