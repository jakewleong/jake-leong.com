// src/components/CameraRig.jsx
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Walk view (side view)
const WALK_POS = new THREE.Vector3(0, 1.6, 8);
const WALK_LOOK = new THREE.Vector3(0, 1.4, 0);

// Inspect framing
const INSPECT_Z = 2.4;       // closer than before
const INSPECT_Y = 1.2;       // camera slightly below middle
const INSPECT_LOOK_Y = 1.8;  // look a bit above mid-height

// Baseline lerp speeds at ~60fps
const WALK_LERP = 0.1;     // bigger = snappier back to walk
const INSPECT_LERP = 0.12; // smoother ease into inspect

// Scroll thresholds
const EXIT_THRESHOLD = 0.015; // how far you can scroll before exiting inspect

export default function CameraRig({
  scroll,
  mode,                     // 'walk' | 'approach' | 'inspect'
  selectedArtwork,
  onExitInspect,
  lastScrollRef,
  inspectTargetOffsetRef,
  galleryOffsetRef,
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!camera) return;

    const frameScale = Math.min(delta * 60, 2); // normalize to ~60fps
    const currentScroll = scroll.offset;
    const targetOffset = inspectTargetOffsetRef.current ?? 0;
    const galleryOffset = galleryOffsetRef.current ?? currentScroll;

    // If user scrolls away while inspecting, exit
    if (
      mode === 'inspect' &&
      Math.abs(galleryOffset - targetOffset) > EXIT_THRESHOLD
    ) {
      onExitInspect && onExitInspect();
      return;
    }

    if (mode === 'inspect' && selectedArtwork) {
      // ── INSPECT VIEW ──
      const inspectPos = new THREE.Vector3(
        0,           // keep camera at center X; char is offset left
        INSPECT_Y,
        INSPECT_Z
      );
      const inspectLook = new THREE.Vector3(
        0,
        INSPECT_LOOK_Y,
        0
      );

      const inspectLerp = Math.min(INSPECT_LERP * frameScale, 1);
      camera.position.lerp(inspectPos, inspectLerp);
      camera.lookAt(inspectLook);
    } else {
      // ── WALK + APPROACH VIEW (side view) ──
      const walkPos = WALK_POS;
      const walkLook = WALK_LOOK;

      const walkLerp = Math.min(WALK_LERP * frameScale, 1);
      camera.position.lerp(walkPos, walkLerp);
      camera.lookAt(walkLook);
    }
  });

  return null;
}