'use client'
import { useRef, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { lineVertexShader, lineFragmentShader } from '@/lib/shaders'
import { resolveColor, hexToVec3 } from '@/lib/spectrum'
import type { LineRendererConfig, PaletteConfig } from '@/lib/types'

interface Props {
  lineRenderer: LineRendererConfig
  palette: PaletteConfig
  sourceTarget: THREE.WebGLRenderTarget
}

export function LineRenderer({ lineRenderer, palette, sourceTarget }: Props) {
  const { size } = useThree()
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const toVec3 = (token: string) => new THREE.Vector3(...hexToVec3(resolveColor(token)))

  const lineColorsVec3 = useMemo(() => [
    toVec3(palette.lineOne),
    toVec3(palette.lineTwo),
    toVec3(palette.lineThree),
    toVec3(palette.lineFour),
  ], [palette.lineOne, palette.lineTwo, palette.lineThree, palette.lineFour])

  const uniforms = useMemo(() => ({
    u_texture:          { value: sourceTarget.texture },
    u_resolutionPixels: { value: new THREE.Vector2(size.width, size.height) },
    u_resolution:       { value: lineRenderer.resolution },
    u_scale:            { value: lineRenderer.scale },
    u_contrast:         { value: lineRenderer.contrast },
    u_vertical:         { value: lineRenderer.vertical },
    u_invert:           { value: lineRenderer.invert },
    u_bgColor:          { value: toVec3(palette.backgroundColor) },
    u_fgColor:          { value: toVec3(palette.foregroundColor) },
    u_useColors:        { value: lineRenderer.useColors },
    u_lineColors:       { value: lineColorsVec3 },
    u_blankSpots:       { value: lineRenderer.blankSpots },
    u_showGaps:         { value: lineRenderer.showGaps },
    u_capRoundness:     { value: lineRenderer.capRoundness },
    u_alpha:            { value: lineRenderer.alpha },
    u_showUnderlay:     { value: lineRenderer.showUnderlay },
    u_shapeMode:        { value: ['lines','dots','squares','diamonds'].indexOf(lineRenderer.shapeMode) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  // Sync all uniforms when props change
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u) return
    u.u_resolution.value     = lineRenderer.resolution
    u.u_scale.value          = lineRenderer.scale
    u.u_contrast.value       = lineRenderer.contrast
    u.u_vertical.value       = lineRenderer.vertical
    u.u_invert.value         = lineRenderer.invert
    u.u_blankSpots.value     = lineRenderer.blankSpots
    u.u_showGaps.value       = lineRenderer.showGaps
    u.u_capRoundness.value   = lineRenderer.capRoundness
    u.u_alpha.value          = lineRenderer.alpha
    u.u_showUnderlay.value   = lineRenderer.showUnderlay
    u.u_useColors.value      = lineRenderer.useColors
    u.u_shapeMode.value      = ['lines','dots','squares','diamonds'].indexOf(lineRenderer.shapeMode)
  }, [lineRenderer])

  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u) return
    u.u_bgColor.value    = toVec3(palette.backgroundColor)
    u.u_fgColor.value    = toVec3(palette.foregroundColor)
    u.u_lineColors.value = lineColorsVec3
  }, [palette, lineColorsVec3])

  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u) return
    u.u_resolutionPixels.value.set(size.width, size.height)
    u.u_texture.value = sourceTarget.texture
  }, [size, sourceTarget])

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={lineVertexShader}
        fragmentShader={lineFragmentShader}
        uniforms={uniforms}
        transparent={lineRenderer.alpha}
      />
    </mesh>
  )
}
