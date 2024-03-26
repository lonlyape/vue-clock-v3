<template>
  <div ref="$el" class="lonlyape-clock" :style="clockBoxStyle">
    <canvas ref="canvas"></canvas>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeMount, ref, watch, withDefaults } from 'vue';

interface Time {
  isStatic: boolean //是否为静止时间
  timestamp?: number//时钟的时间，只有 isStatic 为 true 时才起作用
}
interface Border {
  type: 'circle' | 'rectangle' //边界类型（圆、四边形）;circle(圆形) 、 rectangle(四边形)
  width: number //时钟的宽度或直径，如果 type==circle ，则为时钟的直径
  height?: number //时钟的高度，只有 type==rectangle 明有效
  lineWidth: number //边界线的宽度（粗细）
  color: string //边界线的颜色
}
interface Bg {
  color?: string,
  image?: string
}
interface Dial {
  isDial: true, //是否要刻度
  distance: number, //刻度与边界的距离
  maxLength: number,
  minLength: number,
  maxWidth: number,
  minWidth: number,
  color: string
}
interface ClockNumber {
  isNumber: true //是否要数字
  type?: 'arabic' | 'roman' //数字类型，罗马：“roman”；阿拉伯：“arabic”（默认）
  color?: string
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  radius?: number,
}
interface Needle {
  length: number
  color: string
  lineWidth: number
  longOut: number
}

interface PropsType {
  option?:PropsType,
  width?: string | number
  height?: string | number // 默认 400px
  adaptive?: boolean //自适应
  timezone?: string //时区
  time?: Time //时间配置
  border?: Border //边界
  background?: Bg // 背景
  dial?: Dial //刻度
  number?: ClockNumber
  needle?: {
    second?: Needle
    minute?: Needle
    hour?: Needle
  }
}
const defOption: PropsType = {
  adaptive:true,
  timezone: '',
  time: {
    isStatic: false,
    timestamp: 0
  },
  border: {
    type: 'circle', //边界类型（圆、四边形）;circle(圆形) 、 rectangle(四边形)
    width: 300,
    height: 300,
    lineWidth: 2,
    color: '#bbb'
  },
  background: {
    color: '',
    image: ''
  },
  dial: {
    isDial: true, //是否要刻度
    distance: 0, //刻度与边界的距离
    maxLength: 8,
    minLength: 5,
    maxWidth: 3,
    minWidth: 2,
    color: '#888'
  },
  number: {
    isNumber: true, //是否要数字
    type: 'arabic', //数字类型，罗马：“roman”；阿拉伯：“arabic”（默认）
    color: '#777',
    fontSize: '19px',
    fontWeight: 'normal',
    fontFamily: '微软雅黑',
    radius: 125,
  },
  needle: {
    second: {
      length: 110,
      color: '#aaa',
      lineWidth: 3,
      longOut: 5,
    },
    minute: {
      length: 100,
      color: '#999',
      lineWidth: 4,
      longOut: 5,
    },
    hour: {
      length: 70,
      color: '#888',
      lineWidth: 4,
      longOut: 5,
    }
  }
}

const emits = defineEmits(['timeChange'])
const props = withDefaults(defineProps<PropsType>(),{
  adaptive: true
})

const drawOption = ref()

const $el = ref()
const canvas = ref()
const timeAngle = ref()

var context: any = {}
var timeInterval: any = {}
var transitionOption: any = {}

const clockBoxStyle = ref({})


onBeforeMount(() => {
  nextTick(() => {
    context = canvas.value.getContext('2d')
    setClockBoxStyle()
    newData()
    if (!drawOption.value.time.isStatic) {
      timeInterval = setInterval(newData, 1000);
    }

    draw();
    setTimeout(drawAsResize, 100);
  })
})
watch(drawOption,()=>{
  if(drawOption.value.time.isStatic) {
    clearInterval(timeInterval);
  }
  canvas.value && draw();
},{deep: true})
watch(timeAngle,draw)

inigFun()

//================================================================ methods

function inigFun(){
  drawOption.value = getDrawOption()
}

function getDrawOption(){
  let newOption:any = {
    ...props
  }
  Object.keys(newOption).forEach(key=>{
    if (newOption[key] === undefined){
      delete newOption[key]
    }
  })

  var time = {
    ...defOption.time,
    ...newOption.time
  };
  var border = {
    ...defOption.border,
    ...newOption.border
  };
  var background = {
    ...defOption.background,
    ...newOption.background
  };
  var dial = {
    ...defOption.dial,
    ...newOption.dial
  };
  var number = {
    ...defOption.number,
    ...newOption.number
  };
  var needle = {
    second: {
      ...defOption.needle?.second,
      ...newOption.needle?.second
    },
    minute: {
      ...defOption.needle?.minute,
      ...newOption.needle?.minute
    },
    hour: {
      ...defOption.needle?.hour,
      ...newOption.needle?.hour
    },
  };
  return {
    ...props,
    time,
    border,
    background,
    dial,
    number,
    needle,
  }
}

//resize
function drawAsResize() {
  const oldOpthion = JSON.parse(JSON.stringify(drawOption.value));
  const oldW = oldOpthion.border.width;
  //监听元素的变化
  var elObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      let contentRect = entry.contentRect;
      let option = drawOption.value;
      setNumberValue(option, oldOpthion, contentRect.width - 6, oldW);
      setClockBoxStyle();
      draw();
    });
  })
  elObserver.observe($el.value);
}
//自适应参数设置
function setNumberValue(obj: { [x: string]: any; }, oldObj: { [x: string]: any; }, newW: number, oldW: number, level: number = 0) {
  if (!drawOption.value.adaptive) {
    return;
  }
  for (let key in obj) {
    let newVal = obj[key];
    let oldVal = oldObj[key];
    let magnification = newW / oldW < 1 ? newW / oldW : 1;
    if (typeof newVal == 'number') {
      obj[key] = oldVal * magnification;
    } else if (typeof newVal == 'object') {
      setNumberValue(newVal, oldVal, newW, oldW, level+1);
    } else if (key == 'fontSize') {
      obj[key] = oldVal.replace(/^\d*/, (num: number) => {
        return num * magnification;
      })
    }
  }
  if (level === 0){
    drawOption.value = obj
  }
}
//画
function draw() {
  clear();
  setNumberValue(drawOption.value, drawOption.value, canvas.value?.width - 6, (drawOption.value?.border?.width || 1));
  drawBackground();
  drawBorder();
  drawDial();
  drawNumber();
  drawNeedle();
}
//清除
function clear() {
  context?.clearRect(0, 0, canvas.value.width, canvas.value.width);
}
//设置大小
function setClockBoxStyle() {
  var obj: { width?: string, height?: string } = {}
  if (drawOption.value.width){
    if (!/%$/.test(drawOption.value.width as string)) {
      obj.width = Number(drawOption.value.width) + 'px';
    } else {
      obj.width = drawOption.value.width as string;
    }
  }
  if (drawOption.value.height) {
    if (!/%$/.test(drawOption.value.height as string)) {
      obj.height = Number(drawOption.value.height) + 'px';
    } else {
      obj.height = drawOption.value.height as string;
    }
  }else{
    obj.height = '400px'
    if(drawOption.value.border){
      obj.height = drawOption.value.border.width + drawOption.value.border.lineWidth * 2 + 'px';
    }
  }
  clockBoxStyle.value = obj;
  canvas.value.width = obj.width ? Number(obj.width.split('px')[0]) : $el.value.clientWidth
  canvas.value.height = Number(obj.height.split('px')[0])
}
//画边框
function drawBorder() {
  context.save();
  context.translate(canvas.value.width / 2, canvas.value.height / 2);
  context.beginPath();
  let width = drawOption.value.border.width as number
  let height = drawOption.value.border.height as number
  if (drawOption.value.border.type == 'rectangle') {
    context.rect(-width / 2, -height / 2, width, height);
  } else {
    context.arc(0, 0, width / 2, 0, Math.PI * 2, true);
  }
  context.closePath();
  context.strokeStyle = drawOption.value.border.color;
  context.lineWidth = drawOption.value.border.lineWidth;
  context.stroke();
  context.restore();
}
//背景图片
function drawBackground() {
  context.save();
  context.beginPath();
  context.translate(canvas.value.width / 2, canvas.value.height / 2);
  let width = drawOption.value.border.width as number
  let height = drawOption.value.border.height as number
  var x, y;
  if (drawOption.value.border.type == 'rectangle') {
    context.rect(-width / 2, -height / 2, width, height);

    x = -width / 2;
    y = -height / 2;
  } else {
    context.arc(0, 0, width / 2, 0, Math.PI * 2, true);
    x = -width / 2;
    y = -width / 2;
  }
  if (drawOption.value.background.color) {
    context.fillStyle = drawOption.value.background.color;
    context.fill();
  }
  if (drawOption.value.background.image) {
    var image = new Image();

    if (!transitionOption.bgImg) {
      image.src = drawOption.value.background.image;
      image.onload = function () {
        console.log('img loaded');
        transitionOption.bgImg = image
      }
    } else {
      image = transitionOption.bgImg;
    }

    var sx, sy, autow;
    if (image.width >= image.height) {
      sx = (image.width - image.height) / 2;
      sy = 0;
      autow = image.height;
    } else {
      sx = 0;
      sy = (image.height - image.width) / 2;
      autow = image.width;
    }

    context.clip();
    context.drawImage(image, sx, sy, autow, autow, x, y, -x * 2, -y * 2);
  }
  context.closePath();
  context.restore();
}
//画刻度
function drawDial() {
  if (!drawOption.value.dial.isDial) return;
  var degMinute = Math.PI * 2 / 60;
  var degM = 0;
  var border: any = drawOption.value.border || {}
  var dial: any = drawOption.value.dial || {}
  var distance = drawOption.value.dial.distance ? drawOption.value.dial.distance + border.lineWidth / 2 : border.lineWidth / 2;
  if (drawOption.value.dial.distance == 0) distance = border.lineWidth / 2;
  var begainPosition = {
    x: 0,
    y: border.width / 2 - distance
  };
  for (let i = 0; i < 60; i++) {
    degM = degMinute * i;
    context.save();
    context.translate(canvas.value.width / 2, canvas.value.height / 2);
    if (i % 5 == 0) {
      line(begainPosition, degM, dial.maxLength - begainPosition.y, dial.color, dial.maxWidth);
    } else {
      line(begainPosition, degM, dial.minLength - begainPosition.y, dial.color, dial.minWidth);
    }
    context.restore();
  }
}
//画数字
function drawNumber() {
  if (!drawOption.value.number.isNumber) return;
  var num = [];
  for (let i = 1; i < 13; i++) {
    num[i - 1] = i + 3;
    if ((i + 3) > 12) {
      num[i - 1] = 3 - (12 - i);
    }
  }
  if (drawOption.value.number.type == 'roman') {
    for (let i = 0; i < 12; i++) {
      num[i] = intToRoman(num[i] as number);
    }
  }
  var ar = Math.PI / 6;
  context.save();
  context.fillStyle = drawOption.value.number.color;
  context.font = drawOption.value.number.fontWeight + ' ' + drawOption.value.number.fontSize + ' ' + drawOption.value.number.fontFamily;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.translate(canvas.value.width / 2, canvas.value.height / 2);
  for (let i = 0; i < num.length; i++) {
    context.fillText(num[i], (drawOption.value.number.radius || 1) * Math.cos(ar * (i + 1)), (drawOption.value.number.radius || 1) * Math.sin(ar * (i + 1)));
  }
  context.restore();
}
//转罗马数字
function intToRoman(num: number) {
  var roman = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
  var numArr = num.toString().split('');
  for (let i = 0; i < numArr.length; i++) {
    var n = Number(numArr[numArr.length - 1 - i]);
    numArr[numArr.length - 1 - i] = '';
    if (n >= 5 && n < 9) {
      numArr[numArr.length - 1 - i] = roman[2 * i + 1];
      for (let j = 0; j < n - 5; j++) {
        numArr[numArr.length - 1 - i] += roman[2 * i];
      }
    } else if (n == 9) {
      numArr[numArr.length - 1 - i] = roman[2 * i] + roman[2 * i + 2];
    } else if (n == 4) {
      numArr[numArr.length - 1 - i] = roman[2 * i] + roman[2 * i + 1];
    } else {
      for (let j = 0; j < n; j++) {
        numArr[numArr.length - 1 - i] += roman[2 * i];
      }
    }
  }
  return numArr.join('');
}
//画针
function drawNeedle() {
  var h = timeAngle.value.hAngle;
  var m = timeAngle.value.mAngle;
  var s = timeAngle.value.sAngle;
  context.save();
  context.translate(canvas.value.width / 2, canvas.value.height / 2);

  line({
    x: 0,
    y: drawOption.value.needle.hour.longOut
  }, h,
    drawOption.value.needle.hour.length as number,
    drawOption.value.needle.hour.color as string,
    drawOption.value.needle.hour.lineWidth as number); //时针
  line({
    x: 0,
    y: drawOption.value.needle.minute.longOut
  }, m,
    drawOption.value.needle.minute.length as number,
    drawOption.value.needle.minute.color as string,
    drawOption.value.needle.minute.lineWidth as number); //分针
  line({
    x: 0,
    y: drawOption.value.needle.second.longOut
  }, s,
    drawOption.value.needle.second.length as number,
    drawOption.value.needle.second.color as string,
    drawOption.value.needle.second.lineWidth as number); //秒针

  context.restore();
}
//以时区确定时间
function selectTimezone() {
  let timestamp = drawOption.value.time.timestamp || new Date().getTime()
  var d = drawOption.value.time.isStatic ? new Date(timestamp) : new Date();
  //得到1970年一月一日到现在的秒数
  var len = d.getTime();
  //确定时区
  var timezone;
  if (drawOption.value.timezone === undefined || drawOption.value.timezone === '') {
    timezone = -d.getTimezoneOffset() / 60;
  } else {
    timezone = Number(drawOption.value.timezone);
  }
  //本地时间与GMT时间的时间偏移差
  var offset = d.getTimezoneOffset() * 60000;
  //得到现在的格林尼治时间
  var utcTime = len + offset;
  return new Date(utcTime + 3600000 * timezone);
}
//时间计算
function newData() {
  var nd = selectTimezone();
  var hour = nd.getHours();
  var minute = nd.getMinutes();
  var second = nd.getSeconds();
  var sAngle = Math.PI * 2 * (second % 60) / 60;
  var mAngle = Math.PI * 2 * (minute % 60) / 60 + sAngle / 60;
  var hAngle = Math.PI * 2 * (hour % 12) / 12 + mAngle / 12;
  timeAngle.value = {
    sAngle,
    mAngle,
    hAngle
  }

  // console.log({
  //   sAngle,
  //   mAngle,
  //   hAngle
  // })

  //时间事件
  emits('timeChange', nd);

}
//画线（公用）
function line(starp: { x: any; y: any; }, s: number, len: number, col: string, lw: number) {
  context.save();
  context.beginPath();
  context.rotate(s);
  context.moveTo(starp.x, starp.y);
  context.lineTo(0, -len);
  context.strokeStyle = col;
  context.lineWidth = lw;
  context.stroke();
  context.restore();
}


//================================================================ methods end



</script>
<style lang="scss" scoped=""></style>