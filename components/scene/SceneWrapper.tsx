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

function ImageMesh({ config }: { config: ImageConfig }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

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

  useFrame(() => {
    if (!materialRef.current || !texture) return
    const img = texture.image as HTMLImageElement | undefined
    if (img?.width) {
      materialRef.current.uniforms.u_aspect.value = img.width / img.height
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

function VideoMesh({ config }: { config: VideoConfig }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const textureRef = useRef<THREE.VideoTexture | null>(null)

  const { size } = useThree()
  const uniforms = useMemo(() => ({
    u_texture:    { value: null as THREE.Texture | null },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_blurPx:     { value: 0 },
    u_aspect:     { value: 16 / 9 },
    u_viewAspect: { value: size.width / size.height },
    u_scale:      { value: new THREE.Vector2(1, 1) },
    u_offset:     { value: new THREE.Vector2(0, 0) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    const video = document.createElement('video')
    video.src = config.src
    video.loop = config.loop
    video.muted = config.muted
    video.autoplay = config.autoPlay
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.style.display = 'none'
    document.body.appendChild(video)
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

  useFrame(() => {
    if (!materialRef.current) return
    const vid = videoRef.current
    if (vid?.videoWidth) {
      materialRef.current.uniforms.u_aspect.value = vid.videoWidth / vid.videoHeight
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

function Inner({ state }: { state: AppState }) {
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
          ? <ImageMesh config={state.image} />
          : <VideoMesh config={state.video} />,
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

export function SceneWrapper({ state }: { state: AppState }) {
  return <Inner state={state} />
}
