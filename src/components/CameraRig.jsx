// src/components/CameraRig.jsx
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// CAMERA POSITIONS
// ============================================================================

// Walk view (side view)
const WALK_POS = new THREE.Vector3(0, 1.6, 8);
const WALK_LOOK = new THREE.Vector3(0, 1.4, 0);

// Inspect framing
const INSPECT_Z = 2.4;
const INSPECT_Y = 1.2;
const INSPECT_LOOK_Y = 1.8;

// ============================================================================
// ANIMATION SPEEDS (baseline at ~60fps)
// ============================================================================

const WALK_LERP = 0.1;
const INSPECT_LERP = 0.12;

// ============================================================================
// SCROLL THRESHOLDS
// ============================================================================

const EXIT_THRESHOLD = 0.015;

// ============================================================================
// COMPONENT
// ============================================================================

export default function CameraRig({
  scroll,
  mode,
  selectedArtwork,
  onExitInspect,
  lastScrollRef,
  inspectTargetOffsetRef,
  galleryOffsetRef,
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!camera) return;

    const frameScale = Math.min(delta * 60, 2);
    const currentScroll = scroll.offset;
    const targetOffset = inspectTargetOffsetRef.current ?? 0;
    const galleryOffset = galleryOffsetRef.current ?? currentScroll;

    // Exit inspect mode if user scrolls away
    if (mode === 'inspect' && Math.abs(galleryOffset - targetOffset) > EXIT_THRESHOLD) {
      onExitInspect?.();
      return;
    }

    if (mode === 'inspect' && selectedArtwork) {
      // ─── INSPECT VIEW ───
      const inspectPos = new THREE.Vector3(0, INSPECT_Y, INSPECT_Z);
      const inspectLook = new THREE.Vector3(0, INSPECT_LOOK_Y, 0);
      const inspectLerp = Math.min(INSPECT_LERP * frameScale, 1);

      camera.position.lerp(inspectPos, inspectLerp);
      camera.lookAt(inspectLook);
    } else {
      // ─── WALK / APPROACH VIEW ───
      const walkLerp = Math.min(WALK_LERP * frameScale, 1);

      camera.position.lerp(WALK_POS, walkLerp);
      camera.lookAt(WALK_LOOK);
    }
  });

  return null;
}