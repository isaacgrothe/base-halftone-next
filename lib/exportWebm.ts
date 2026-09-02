export async function exportWebm(
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number = 30,
  onProgress?: (p: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = canvas.captureStream(fps)
    const chunks: Blob[] = []

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'halftone.webm'
      a.click()
      URL.revokeObjectURL(a.href)
      resolve()
    }

    recorder.onerror = () => reject(new Error('MediaRecorder error'))
    recorder.start()

    const startTime = performance.now()
    const tick = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000
      onProgress?.(Math.min(elapsed / duration, 0.99))
      if (elapsed >= duration) {
        clearInterval(tick)
        stream.getTracks().forEach((t) => t.stop())
        recorder.stop()
      }
    }, 100)
  })
}
