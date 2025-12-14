/**
 * Windows Desktop Audio Capture Module
 *
 * This module captures system audio output (WASAPI loopback) on Windows
 * and streams it to the renderer process for visualization.
 *
 * Note: This is a placeholder implementation. For production use, you'll need:
 * 1. Install a Windows audio capture library (e.g., naudiodon with loopback mode)
 * 2. Or create a native addon using N-API with WASAPI
 *
 * Current implementation status: STUB - needs audio capture library
 */

let isCapturing = false
let audioCallback = null
let captureStream = null

/**
 * Start capturing desktop audio
 * @param {Function} callback - Called with audio data chunks (ArrayBuffer)
 */
function start(callback) {
  if (isCapturing) {
    console.warn('Audio capture already running')
    return
  }

  audioCallback = callback
  isCapturing = true

  console.log('Desktop audio capture starting...')

  // Add delay to let renderer fully initialize
  setTimeout(() => {
    if (!isCapturing) return
    console.log('Desktop audio capture started')

  // TODO: Implement actual WASAPI loopback capture
  //
  // Option 1: Use naudiodon (requires native compilation)
  // const portAudio = require('naudiodon')
  // captureStream = new portAudio.AudioIO({
  //   inOptions: {
  //     channelCount: 2,
  //     sampleFormat: portAudio.SampleFormat16Bit,
  //     sampleRate: 44100,
  //     deviceId: -1, // default device
  //     closeOnError: true
  //   }
  // })
  //
  // captureStream.on('data', (chunk) => {
  //   if (audioCallback && isCapturing) {
  //     // Convert chunk to ArrayBuffer
  //     const arrayBuffer = chunk.buffer.slice(
  //       chunk.byteOffset,
  //       chunk.byteOffset + chunk.byteLength
  //     )
  //     audioCallback(arrayBuffer)
  //   }
  // })
  //
  // captureStream.start()

    // TEMPORARY: Stub disabled to avoid IPC errors
    // When you implement real WASAPI capture, this will work properly
    // For now, just log that capture is "active"
    console.log('Desktop audio capture is active (stub - no real audio yet)')

    // captureStream = setInterval(() => {
    //   // Disabled to avoid frame disposal errors in dev mode
    // }, 1000)
  }, 1000) // Wait 1 second before starting
}

/**
 * Stop capturing desktop audio
 */
function stop() {
  if (!isCapturing) {
    return
  }

  isCapturing = false
  audioCallback = null

  if (captureStream) {
    if (typeof captureStream.stop === 'function') {
      captureStream.stop()
    } else if (typeof captureStream === 'number') {
      clearInterval(captureStream)
    }
    captureStream = null
  }

  console.log('Desktop audio capture stopped')
}

/**
 * Check if capture is currently running
 */
function isRunning() {
  return isCapturing
}

module.exports = {
  start,
  stop,
  isRunning
}

/*
 * IMPLEMENTATION NOTES:
 *
 * To implement real Windows audio capture, add one of these to package.json:
 *
 * Option 1 (Recommended): naudiodon
 *   "naudiodon": "^2.3.4"
 *   - Requires node-gyp and Visual Studio Build Tools on Windows
 *   - Supports WASAPI loopback mode
 *   - npm install --save naudiodon
 *   - May need: npm install --global windows-build-tools
 *
 * Option 2: Custom N-API addon
 *   - Write C++ addon using N-API
 *   - Directly use Windows WASAPI APIs (IAudioClient, IAudioCaptureClient)
 *   - Most control but requires C++ knowledge
 *
 * Option 3: Desktop Capturer (Chromium API)
 *   - Use Electron's desktopCapturer.getSources()
 *   - Set chromeMediaSource: 'desktop' with audio: true
 *   - Easier but may have higher latency
 *
 * For production, replace the stub implementation above with actual audio capture.
 */
