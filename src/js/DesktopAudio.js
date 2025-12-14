/**
 * Desktop Audio Handler
 *
 * Receives system audio data from Electron main process and feeds it
 * to the Web Audio API for visualization.
 *
 * This class mirrors the Microphone.js interface for compatibility.
 */

export default class DesktopAudio {
  constructor(audioContext, output) {
    this.audioContext = audioContext
    this.output = output
    this.enabled = false

    // Audio processing nodes
    this.sourceNode = null
    this.mediaStream = null

    // Check if running in Electron
    this.isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron

    if (!this.isElectron) {
      console.warn('DesktopAudio: Not running in Electron environment')
    }
  }

  /**
   * Toggle desktop audio capture on/off
   */
  async toggle() {
    if (this.enabled) {
      this.stop()
    } else {
      await this.start()
    }
  }

  /**
   * Start desktop audio capture using Screen Capture API
   */
  async start() {
    if (this.enabled) {
      console.warn('Desktop audio already enabled')
      return true
    }

    try {
      // Use Chromium's getDisplayMedia to capture system audio
      // This will show a picker for the user to select audio source
      const constraints = {
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: 'screen:0:0' // Primary display audio
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            minWidth: 1,
            maxWidth: 1,
            minHeight: 1,
            maxHeight: 1
          }
        }
      }

      // Try to get desktop audio stream
      let stream
      if (this.isElectron && navigator.mediaDevices.getUserMedia) {
        // Electron-specific: Use getUserMedia with desktop capture
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
        } catch (err) {
          // Fallback: Try getDisplayMedia (requires user to pick source)
          console.log('Falling back to getDisplayMedia...')
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true // Required, but we'll use minimal video
          })
        }
      } else {
        // Standard getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true
        })
      }

      // Stop the video track immediately (we only want audio)
      const videoTracks = stream.getVideoTracks()
      videoTracks.forEach(track => track.stop())

      // Get audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio track available in the captured stream')
      }

      // Create MediaStreamSource from the desktop audio
      this.sourceNode = this.audioContext.createMediaStreamSource(stream)
      this.sourceNode.connect(this.output)

      this.mediaStream = stream
      this.enabled = true

      console.log('Desktop audio capture started:', audioTracks[0].label)
      return true

    } catch (error) {
      console.error('Error starting desktop audio:', error)

      // Show user-friendly error
      if (error.name === 'NotAllowedError') {
        alert('Desktop audio capture was denied. Please allow access to capture system audio.')
      } else if (error.name === 'NotFoundError') {
        alert('No audio source found. Make sure audio is playing on your system.')
      }

      this.cleanup()
      return false
    }
  }

  /**
   * Stop desktop audio capture
   */
  stop() {
    if (!this.enabled) {
      return
    }

    this.enabled = false
    this.cleanup()
    console.log('Desktop audio capture stopped')
  }

  /**
   * Clean up audio nodes and streams
   */
  cleanup() {
    // Disconnect source node
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    // Stop all tracks in the media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop()
      })
      this.mediaStream = null
    }
  }

  /**
   * Disconnect from output (for cleanup)
   */
  disconnect() {
    this.stop()
  }
}
