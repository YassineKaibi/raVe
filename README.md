# **raVe** Desktop - Real-time Audio Visualizer Experience

![raVe screenshot](public/preview.jpg)

> **Electron desktop app fork** of [raVe by ajm13](https://github.com/ajm13/raVe) with native Windows desktop audio capture and HDR support.

## What is raVe?

**raVe** stands for **real-time audio visualizer experience**.

Most music visualizers available right now, such as the ones found in iTunes and Windows Media Player, don't offer true "music visualization," but rather "music synched visuals." They typically have a predetermined animation, where different aspects of it will change when a beat is detected in the song.

**raVe** isn't an animation that reacts to the beat, but rather a true visualization of the audio data itself. The frequencies and waveforms of the incoming audio are used to generate **raVe**'s rings, and the previous frames expand out from the center to display the history of the audio.

Because **raVe** uses all of the audio data available to it for visualization, every song is visually unique. The same goes for the vocals; singers' voices are visually distinct as they contain different harmonics and waveform types. Unique sounds in songs look amazing, and in my opinion, the best songs to watch on **raVe** are chill songs with not too much going on.

## Desktop App Features

This Electron desktop version adds:

- **Native Desktop Audio Capture** - Visualize system audio from Spotify, YouTube, games, or any application
- **HDR Display Support** - Enhanced color gamut (Display P3) with boosted saturation for compatible monitors
- **No Configuration Required** - No need for Stereo Mix or audio loopback software
- **Native Performance** - Standalone desktop application optimized for Windows
- **Keyboard Shortcuts** - F (fullscreen), Escape (hide controls)

## Technical Details

**raVe** uses the **Web Audio API** and **Canvas API** to collect and draw the audio data in real-time.

With **Web Audio API**, you can create different types of nodes to route audio through, including **AnalyserNode** and **BiquadFilterNode**. These two nodes are the key pieces to making **raVe** work.

**AnalyserNode** is a wonderful little piece of **Web Audio API** that allows you to sample frequency and time domain data from the audio source. Frequency data gives the amplitudes of frequency bins starting at 0&nbsp;Hz up to about 22&nbsp;KHz, with a bin width of about 22&nbsp;Hz. Time domain data is the waveform of the audio, or how the speaker film would vibrate to output the audio.

**BiquadFilterNode** is a node that you can connect audio through to apply different biquad filters, such as highpass or lowpass. These filters allow **raVe** to filter out different frequencies to make the visuals more aesthetic. For example, the entire audio source is run through a lowpass filter of 5&nbsp;KHz, so that snares and "sss" noises don't brighten **raVe** too much.

## Anatomy of **raVe**

**raVe** generates 2 rings from the audio data, and both rings slowly morph between a circle and hexagon.

The inner ring is the audio waveform applied to the ring's shape, and mirrored along the y-axis.

The outer ring is made up of both frequency and time domain data, and is symmetric over both the x and y axes. The frequency data goes from 0&nbsp;Hz at the horizon to about 7&nbsp;KHz at the top and bottom. The time domain data used for the outer ring is filtered to only show bass frequencies.

## Running raVe Desktop

### Development Mode

```bash
yarn install
yarn electron:serve
```

The Electron app will launch automatically once the dev server is ready.

### Building for Production

```bash
yarn install
yarn electron:build
```

This creates a Windows installer at `dist_electron/raVe-Setup-1.0.0.exe`.

### Using Desktop Audio Capture

1. Launch the app
2. Click "enter raVe"
3. Click the speaker icon in the controls
4. Select an audio source (screen/window/tab) from the dialog
5. Play music from any application and watch it visualize!

## Original Project

This is a fork of the original [raVe web app by ajm13](https://github.com/ajm13/raVe).

### Changes from Original

- Converted to Electron desktop application
- Added native desktop audio capture using Screen Capture API
- Implemented HDR color support (Display P3 color space)
- Removed web analytics and Setup page (no longer needed)
- Added desktop-specific UI controls and keyboard shortcuts
