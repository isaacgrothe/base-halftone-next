'use client'
import { useMemo, useRef, useEffect } from 'react'
import { useThree, useFrame, createPortal } from '@react-three/fiber'
import * as THREE from 'three'
import { LineRenderer } from './LineRenderer'
import { imageVertexShader, imageFragmentShader } from '@/lib/shaders'
import type { AppState, ImageConfig, VideoConfig } from '@/lib/types'

// ─── Source plane helpers ─────────────────────────────────────────────────────
// These meshes live in a virtual off-screen scene. SceneWrapper renders that
// scene into a render target each frame; LineRenderer reads the result.

function ImageMesh({ config, onAspect }: { config: ImageConfig; onAspect?: (ar: number) => void }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const reportedSrc = useRef<string>('')

  const texture = useMemo(() => {
    if (!config.src) return null
    const loader = new THREE.TextureLoader()
    const tex = loader.load(config.src)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [config.src])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.u_blurPx.value = config.blurPx
  }, [config.blurPx])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.u_texture.value = texture
    reportedSrc.current = ''
  }, [texture])

  const { size } = useThree()

  const uniforms = useMemo(() => ({
    u_texture:    { value: texture },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_blurPx:     { value: config.blurPx },
    u_aspect:     { value: 1 },
    u_viewAspect: { value: size.width / size.height },
    u_scale:      { value: new THREE.Vector2(1, 1) },
    u_offset:     { value: new THREE.Vector2(0, 0) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.u_viewAspect.value = size.width / size.height
  }, [size])

  useFrame(() => {
    if (!materialRef.current || !texture) return
    const img = texture.image as HTMLImageElement | undefined
    if (img?.width) {
      materialRef.current.uniforms.u_aspect.value = img.width / img.height
      if (reportedSrc.current !== config.src) {
        reportedSrc.current = config.src
        onAspect?.(img.width / img.height)
      }
    }
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={imageVertexShader}
        fragmentShader={imageFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

function VideoMesh({ config, onAspect, onDuration }: { config: VideoConfig; onAspect?: (ar: number) => void; onDuration?: (d: number) => void }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const textureRef = useRef<THREE.VideoTexture | null>(null)
  const reportedSrc = useRef<string>('')

  const { size } = useThree()
  const uniforms = useMemo(() => ({
    u_texture:    { value: null as THREE.Texture | null },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_blurPx:     { value: config.blurPx },
    u_aspect:     { value: 16 / 9 },
    u_viewAspect: { value: size.width / size.height },
    u_scale:      { value: new THREE.Vector2(1, 1) },
    u_offset:     { value: new THREE.Vector2(0, 0) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    reportedSrc.current = ''
    const video = document.createElement('video')
    video.src = config.src
    video.loop = config.loop
    video.muted = config.muted
    video.autoplay = config.autoPlay
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.style.display = 'none'
    document.body.appendChild(video)
    video.addEventListener('loadedmetadata', () => { if (video.duration) onDuration?.(video.duration) })
    if (config.autoPlay) video.play().catch(() => {})

    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    videoRef.current = video
    textureRef.current = tex
    if (materialRef.current) {
      materialRef.current.uniforms.u_texture.value = tex
    }

    return () => {
      video.pause()
      video.remove()
      tex.dispose()
      videoRef.current = null
      textureRef.current = null
    }
  }, [config.src, config.loop, config.muted, config.autoPlay])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.u_viewAspect.value = size.width / size.height
  }, [size])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.u_blurPx.value = config.blurPx
  }, [config.blurPx])

  useFrame(() => {
    if (!materialRef.current) return
    const vid = videoRef.current
    if (vid?.videoWidth) {
      materialRef.current.uniforms.u_aspect.value = vid.videoWidth / vid.videoHeight
      if (reportedSrc.current !== config.src) {
        reportedSrc.current = config.src
        onAspect?.(vid.videoWidth / vid.videoHeight)
      }
    }
    if (textureRef.current) textureRef.current.needsUpdate = true
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={imageVertexShader}
        fragmentShader={imageFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

// ─── Main scene wrapper ───────────────────────────────────────────────────────

function Inner({ state, onAspect, onDuration }: { state: AppState; onAspect?: (ar: number) => void; onDuration?: (d: number) => void }) {
  const { gl, size } = useThree()

  // Off-screen scene and camera for the source media
  const sourceScene = useMemo(() => new THREE.Scene(), [])
  const sourceCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 10),
    []
  )
  useEffect(() => { sourceCamera.position.set(0, 0, 1) }, [sourceCamera])

  const sourceTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(size.width, size.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height]
  )

  // Render source scene into the render target before the main render pass
  useFrame(() => {
    gl.setRenderTarget(sourceTarget)
    gl.clear()
    gl.render(sourceScene, sourceCamera)
    gl.setRenderTarget(null)
  }, -1)

  return (
    <>
      {/* Source media rendered into virtual scene → render target */}
      {createPortal(
        state.global.mediaMode === 'image'
          ? <ImageMesh config={state.image} onAspect={onAspect} />
          : <VideoMesh config={state.video} onAspect={onAspect} onDuration={onDuration} />,
        sourceScene
      )}

      {/* Halftone post-process reads sourceTarget, draws to screen */}
      <LineRenderer
        lineRenderer={state.lineRenderer}
        palette={state.palette}
        sourceTarget={sourceTarget}
      />
    </>
  )
}

export function SceneWrapper({ state, onAspect, onDuration }: { state: AppState; onAspect?: (ar: number) => void; onDuration?: (d: number) => void }) {
  return <Inner state={state} onAspect={onAspect} onDuration={onDuration} />
}
