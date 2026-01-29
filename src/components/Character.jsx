// src/components/Character.jsx
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// CHARACTER MODELS
// ============================================================================

const CHARACTER_MODELS = [
  '/models/jake01.opt.glb',
  '/models/jake02.opt.glb',
];

// ============================================================================
// TUNING CONSTANTS (baseline at ~60fps)
// ============================================================================

const POSITION_LERP = 0.08;
const VELOCITY_SMOOTH = 0.15;
const MOVING_THRESHOLD = 0.0002;
const STILL_THRESHOLD = 0.0002;
const STILL_TIME_REQUIRED = 0.12;
const ROTATION_LERP = 0.12;
const ANIM_FADE_DURATION = 0.4;

// ============================================================================
// COMPONENT
// ============================================================================

export default function Character({
  targetX = 0,
  galleryOffsetRef,
  positionRef,
  lowPower = false,
}) {
  const group = useRef();

  // Pick a random character model once per mount
  const [modelPath] = useState(() => {
    const index = Math.floor(Math.random() * CHARACTER_MODELS.length);
    return CHARACTER_MODELS[index];
  });

  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, group);

  // Refs for animation state
  const idleNameRef = useRef(null);
  const walkNameRef = useRef(null);
  const currentAction = useRef(null);

  // Refs for movement tracking
  const prevOffset = useRef(0);
  const velRef = useRef(0);
  const facingRef = useRef(1);
  const stillTimeRef = useRef(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Enable shadows on all meshes
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = false;
      }
    });
  }, [scene]);

  // ─────────────────────────────────────────────────────────────────────────
  // Animation crossfade helper
  // ─────────────────────────────────────────────────────────────────────────

  const fadeToAction = (name, duration = ANIM_FADE_DURATION) => {
    if (!actions || !actions[name]) return;

    const newAction = actions[name];
    if (currentAction.current === newAction) return;

    const prev = currentAction.current;
    currentAction.current = newAction;

    if (prev) {
      prev.crossFadeTo(newAction, duration, false);
      newAction.reset().fadeIn(duration).play();
    } else {
      newAction.reset().play();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize animations
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!names || names.length === 0) {
      console.warn('No animation clips found in', modelPath);
      return;
    }

    const idleName = names.find((n) => n.toLowerCase().includes('idle')) || names[0];
    const walkName =
      names.find((n) => n.toLowerCase().includes('walk')) ||
      names.find((n) => n !== idleName) ||
      idleName;

    idleNameRef.current = idleName;
    walkNameRef.current = walkName;

    // Start in idle to prevent T-pose flash
    const idleAction = actions[idleName];
    if (idleAction) {
      idleAction.reset().play();
      currentAction.current = idleAction;
    }
  }, [actions, names, modelPath]);

  // ─────────────────────────────────────────────────────────────────────────
  // Frame loop: position, velocity, animation, rotation
  // ─────────────────────────────────────────────────────────────────────────

  useFrame((_, delta) => {
    if (!group.current) return;

    const idleName = idleNameRef.current;
    const walkName = walkNameRef.current;
    if (!idleName || !walkName) return;

    const frameScale = Math.min(delta * 60, 2);

    // 1. Move toward targetX
    const x = group.current.position.x;
    const posLerp = Math.min(POSITION_LERP * frameScale, 1);
    const newX = THREE.MathUtils.lerp(x, targetX, posLerp);
    group.current.position.x = newX;
    if (positionRef) positionRef.current = newX;

    // 2. Track gallery velocity
    const offset = galleryOffsetRef?.current ?? 0;
    const rawVel = offset - prevOffset.current;
    prevOffset.current = offset;

    const velSmoothFactor = lowPower ? VELOCITY_SMOOTH * 1.8 : VELOCITY_SMOOTH;
    const velLerp = Math.min(velSmoothFactor * frameScale, 1);
    velRef.current = THREE.MathUtils.lerp(velRef.current, rawVel, velLerp);
    const speed = Math.abs(velRef.current);

    // Track stillness duration
    if (speed < STILL_THRESHOLD) {
      stillTimeRef.current += delta;
    } else {
      stillTimeRef.current = 0;
    }

    // 3. Determine movement state
    let isMoving;
    if (speed > MOVING_THRESHOLD) {
      isMoving = true;
    } else if (stillTimeRef.current > STILL_TIME_REQUIRED) {
      isMoving = false;
    } else {
      isMoving = currentAction.current === actions[walkName];
    }

    // Update facing direction
    if (speed > STILL_THRESHOLD) {
      facingRef.current = velRef.current > 0 ? 1 : -1;
    }

    // 4. Blend animations
    if (isMoving) {
      fadeToAction(walkName);
    } else {
      fadeToAction(idleName);
    }

    // 5. Smooth rotation
    const yawRight = -Math.PI / 2;
    const yawLeft = Math.PI / 2;
    const desiredYaw = facingRef.current === 1 ? yawRight : yawLeft;
    const rotLerp = Math.min(ROTATION_LERP * frameScale, 1);

    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      desiredYaw,
      rotLerp
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive
        object={scene}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.5}
        castShadow
      />
    </group>
  );
}

// ============================================================================
// PRELOAD
// ============================================================================

CHARACTER_MODELS.forEach((path) => {
  useGLTF.preload(path);
});