import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export async function exportMp4(
  canvas: HTMLCanvasElement,
  duration: number,          // seconds
  fps: number = 30,
  onProgress?: (p: number) => void,
): Promise<void> {
  const width  = canvas.width
  const height = canvas.height

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height },
    fastStart: 'in-memory',
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error', e),
  })

  encoder.configure({
    codec: 'avc1.4d0034',   // H.264 High Profile Level 5.2
    width,
    height,
    bitrate: 8_000_000,
    framerate: fps,
  })

  const totalFrames = Math.ceil(duration * fps)
  const frameDuration = 1_000_000 / fps   // microseconds per frame

  // Capture frames from the live canvas using captureStream
  const stream = canvas.captureStream(fps)
  const [track] = stream.getVideoTracks()
  // @ts-expect-error — MediaStreamTrackProcessor is not in lib.dom yet
  const processor = new MediaStreamTrackProcessor({ track })
  const reader = (processor.readable as ReadableStream<VideoFrame>).getReader()

  let frameIndex = 0
  while (frameIndex < totalFrames) {
    const { value: frame, done } = await reader.read()
    if (done || !frame) break

    const keyFrame = frameIndex % (fps * 2) === 0
    encoder.encode(frame, { keyFrame })
    frame.close()

    frameIndex++
    onProgress?.(frameIndex / totalFrames)
  }

  track.stop()
  await encoder.flush()
  muxer.finalize()

  const { buffer } = muxer.target
  const blob = new Blob([buffer], { type: 'video/mp4' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'halftone.mp4'
  a.click()
  URL.revokeObjectURL(a.href)
}
