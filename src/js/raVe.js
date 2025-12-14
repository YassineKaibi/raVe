/* eslint-disable */

import Visualizer from './Visualizer'
import utils from './utils'

let { abs, cos, floor, max, sin, PI } = Math
let tau = 2 * PI

function poly(n = 0, a = 0, r = 1) {
  if (n !== 0) {
    let pin = PI / n
    r *= cos(pin) / cos(((a + 0.5 * PI) % (2 * pin)) - pin)
  }
  return { x: r * cos(a), y: r * sin(a) }
}

// HDR-enhanced color generation for Display P3
function hdrColor(hue, saturation, lightness, boost = 1.3) {
  // Convert HSL to RGB, then boost for HDR
  const h = hue / 60
  const s = saturation / 100
  const l = lightness / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h % 2) - 1))
  const m = l - c / 2

  let r, g, b
  if (h < 1) {
    r = c
    g = x
    b = 0
  } else if (h < 2) {
    r = x
    g = c
    b = 0
  } else if (h < 3) {
    r = 0
    g = c
    b = x
  } else if (h < 4) {
    r = 0
    g = x
    b = c
  } else if (h < 5) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  // Add m and boost for HDR (values can exceed 1.0 in P3)
  r = Math.min((r + m) * boost, 1.5)
  g = Math.min((g + m) * boost, 1.5)
  b = Math.min((b + m) * boost, 1.5)

  // Return Display P3 color
  return `color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`
}

export default class extends Visualizer {
  constructor(options, settings) {
    super(options, settings)
    this.analyzer.setOptions([
      {
        filters: [{ type: 'lowpass', frequency: 5000 }],
        smoothingTimeConstant: 0.2,
        minDecibels: -70,
        maxDecibels: -30,
        dataType: 'byte',
        dataSet: 'both'
      },
      {
        filters: [{ type: 'lowpass', frequency: 100 }],
        dataType: 'float',
        dataSet: 'time'
      }
    ])

    this.buffer = this.createBuffer()

    // Check for HDR support and configure canvas context
    const canvasOptions = { alpha: false }

    // Try to enable HDR with Display P3 color space (wider gamut)
    // Falls back to sRGB if not supported
    try {
      canvasOptions.colorSpace = 'display-p3'
    } catch (e) {
      console.log('HDR/Display P3 not supported, using sRGB')
    }

    this.buf = this.buffer.getContext('2d', canvasOptions)
    this.ctx = this.canvas.getContext('2d', canvasOptions)
    this.bassbuf = new Array(15).fill(0)
    super.render()
  }

  getPolyPoint(a, r, q) {
    let s0 = poly(0, a, r)
    let s1 = poly(6, a, 1.25 * r)
    return {
      x: utils.lerp(s0.x, s1.x, q),
      y: utils.lerp(s0.y, s1.y, q)
    }
  }

  drawInner(ctx, data, bass, white) {
    let R = this.r1
    let h = 0.15 * this.r1
    let l = floor(data[0].time.length / 3)

    let d128 = 1 / 128
    let d2l = 1 / (2 * l)

    ctx.save()

    if (white) {
      // ctx.fillStyle = `hsl(0, 0%, ${this.bassSpike ? 100 : 0}%)`
      ctx.fillStyle = '#000'
      ctx.strokeStyle = '#fff'
    } else {
      let hue = this.tick / 10 + 10 * sin(this.tick / 10)
      let l = (55 - floor(20 * bass)) / this.speed
      // Use HDR color for Display P3 wide gamut
      ctx.strokeStyle = hdrColor(hue % 360, 100, l, 1.4)
      ctx.globalCompositeOperation = 'lighter'
    }

    ctx.lineWidth = this.bassSpike ? (white ? 3 : 5) : 1

    let start = floor(0.5 * l)
    let end = floor(1.5 * l)
    let offset = utils.getMaxes(data[0].time, 1, start, end)[0][0] - start

    let q = 0.5 + 0.5 * cos(this.tick / 500)

    ctx.beginPath()
    for (let j = 0; j < 2 * l; j += 2) {
      let i = ~~abs(l - (j % (2 * l)))
      let t0 = data[0].time[i + offset] * d128 - 1
      let t1 = data[0].time[i + offset + 1] * d128 - 1
      let r = R + h * (t0 + t1) + 2 * h * bass
      let a = tau * (j * d2l) - 0.5 * PI

      let { x, y } = this.getPolyPoint(a, r, q)
      ctx[j == 0 ? 'moveTo' : 'lineTo'](x, y)
    }
    if (white) ctx.fill()
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  drawInnerMask(ctx, data, bass) {
    let R = this.r2 * this.bassMul
    let h = 0.2 * this.r2
    let l = floor(data[0].freq.length / 3)
    let avg = utils.average(data[0].freq, 1, l)
    let rs = 1 + avg / 255

    let d255 = 1 / 255
    let d4l = 1 / (4 * l)

    ctx.save()

    ctx.fillStyle = '#000'
    let q = 0.5 + 0.5 * cos(this.tick / 500)

    ctx.beginPath()
    for (let j = 0; j < 4 * l; j++) {
      let i = ~~abs(l - (j % (2 * l)))
      let f = rs * max(0, data[0].freq[i] - avg) * d255
      let t = data[1].time[i * 2]
      let r = R + h * (t - 0.5 * f) - 2
      let a = tau * j * d4l + 0.5 * PI

      let { x, y } = this.getPolyPoint(a, r, q)
      ctx[j == 0 ? 'moveTo' : 'lineTo'](x, y)
    }

    R -= h * bass ** 2

    for (let j = 0; j < 4 * l; j++) {
      let i = ~~abs(l - (j % (2 * l)))
      let f = rs * max(0, data[0].freq[i] - avg) * d255
      let t = data[1].time[i * 2]
      let r = R + h * (t - 0.5 * f) - 12
      let a = tau - tau * j * d4l + 0.5 * PI

      let { x, y } = this.getPolyPoint(a, r, q)
      ctx[j == 0 ? 'moveTo' : 'lineTo'](x, y)
    }
    ctx.fill()
    ctx.restore()
  }

  drawOuter(ctx, data, bass, white) {
    let R = this.r2 * this.bassMul
    let h = 0.2 * this.r2
    let l = floor(data[0].freq.length / 3)
    let avg = utils.average(data[0].freq, 1, l)
    let rs = 1 + avg / 255

    let d255 = 1 / 255
    let d4l = 1 / (4 * l)

    ctx.save()

    if (white) {
      ctx.fillStyle = '#fff'
    } else {
      let hue = this.tick / 10 + 10 + 10 * sin(this.tick / 10)
      let l = (52 + floor(bass * 5)) / this.speed
      // Use HDR color for Display P3 wide gamut
      ctx.fillStyle = hdrColor(hue % 360, 100, l, 1.4)
      ctx.globalCompositeOperation = 'lighter'
    }

    let q = 0.5 + 0.5 * cos(this.tick / 500)

    ctx.beginPath()
    for (let j = 0; j < 4 * l; j++) {
      let i = ~~abs(l - (j % (2 * l)))
      let f = rs * max(0, data[0].freq[i] - avg) * d255
      let t = data[1].time[i * 2]
      let r = R + h * (f + t)
      let a = tau * j * d4l + 0.5 * PI

      let { x, y } = this.getPolyPoint(a, r, q)
      ctx[j == 0 ? 'moveTo' : 'lineTo'](x, y)
    }

    R -= h * bass ** 2

    for (let j = 0; j < 4 * l; j++) {
      let i = ~~abs(l - (j % (2 * l)))
      let f = rs * max(0, data[0].freq[i] - avg) * d255
      let t = data[1].time[i * 2]
      let r = R + h * (t - 0.5 * f) - 1.5 * white
      let a = tau - tau * j * d4l + 0.5 * PI

      let { x, y } = this.getPolyPoint(a, r, q)
      ctx[j == 0 ? 'moveTo' : 'lineTo'](x, y)
    }
    ctx.fill()
    ctx.restore()
  }

  resize() {
    super.resize()
    this.buffer.width = this.canvas.width
    this.buffer.height = this.canvas.height
    this.r1 = 0.05 * this.canvas.h
    this.r2 = 4 * this.r1
  }

  render() {
    // don't render if paused
    if (!super.render()) return

    let { ctx, buf } = this
    let cv = this.canvas
    let data = this.analyzer.getData()

    let bass = utils.max(data[1].time, abs)
    this.bassMul = 1 + bass / 3

    this.bassbuf.shift()
    this.bassbuf.push(bass)
    let bassAvg = utils.average(this.bassbuf)
    this.bassSpike = bass > 0.3 && bass > 1.3 * bassAvg

    bass += 0.1 * (utils.average(data[0].freq, 0, 2) / 255)

    ctx.clear()
    let s = 1 + 0.04 / this.speed

    // draw buffer scaled up for hyperspace
    ctx.drawImage(this.buffer, -0.5 * cv.w * s, -0.5 * cv.h * s, cv.w * s, cv.h * s)

    ctx.fillStyle = `rgba(0, 0, 0, ${0.05 / this.speed})`
    ctx.fillRect(-0.5 * cv.w, -0.5 * cv.h, cv.w, cv.h)

    // draw color
    this.drawInner(ctx, data, bass, false)
    this.drawInnerMask(ctx, data, bass)
    this.drawOuter(ctx, data, bass, false)

    // copy to buffer
    buf.clear()
    buf.drawImage(cv, 0, 0)

    // draw white
    this.drawInner(ctx, data, bass, true)
    this.drawOuter(ctx, data, bass, true)
  }

  destroy() {
    super.destroy()
    delete this.ctx
    delete this.buf
    delete this.buffer
    delete this.bassbuf
  }
}
