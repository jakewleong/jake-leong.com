// src/components/Character.jsx
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const CHARACTER_MODELS = [
  '/models/jake01.glb',
  '/models/jake02.glb',
  // add more here later, e.g. '/models/jake03.glb',
];

/* ------------- TUNING KNOBS ------------- */

// Baseline factors at ~60fps. They get scaled by delta inside useFrame.

// How fast the character moves toward targetX
const POSITION_LERP = 0.08;

// How fast we smooth the scroll velocity
const VELOCITY_SMOOTH = 0.15;

// Scroll sensitivity for switching animations
const MOVING_THRESHOLD = 0.0002;
const STILL_THRESHOLD = 0.0002;

// How long the gallery must be basically still before we force idle (seconds)
const STILL_TIME_REQUIRED = 0.12;

// How fast the character rotates toward facing direction
const ROTATION_LERP = 0.12;

// Crossfade speed between idle/walk animations (seconds)
const ANIM_FADE_DURATION = 0.4;

/**
 * Props:
 *  - targetX: where along X the character should walk to
 *  - galleryOffsetRef: smoothed scroll offset (to drive walk/idle)
 *  - positionRef: optional ref to expose current x position
 *  - lowPower: optional boolean to tweak smoothing in low-power mode
 */
export default function Character({
  targetX = 0,
  galleryOffsetRef,
  positionRef,
  lowPower = false,
}) {
  const group = useRef();

  // 🔀 Pick a random character model once per mount
  const [modelPath] = useState(() => {
    const index = Math.floor(Math.random() * CHARACTER_MODELS.length);
    return CHARACTER_MODELS[index];
  });

  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, group);

  // Ensure all meshes cast shadows
  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = false;
      }
    });
  }, [scene]);

  const idleNameRef = useRef(null);
  const walkNameRef = useRef(null);
  const currentAction = useRef(null);

  const prevOffset = useRef(0);
  const velRef = useRef(0);
  const facingRef = useRef(1);
  const stillTimeRef = useRef(0); // how long we've effectively been still

  /** Smoothly crossfade between animations */
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

  // Pick animation clips and start idle right away
  useEffect(() => {
    if (!names || names.length === 0) {
      console.warn('No animation clips found in', modelPath);
      return;
    }

    const idleName =
      names.find((n) => n.toLowerCase().includes('idle')) || names[0];
    const walkName =
      names.find((n) => n.toLowerCase().includes('walk')) ||
      names.find((n) => n !== idleName) ||
      idleName;

    idleNameRef.current = idleName;
    walkNameRef.current = walkName;

    // Start immediately in idle to prevent T-pose flash
    const idleAction = actions[idleName];
    if (idleAction) {
      idleAction.reset().play();
      currentAction.current = idleAction;
    }
  }, [actions, names, modelPath]);

  useFrame((_, delta) => {
    if (!group.current) return;

    const idleName = idleNameRef.current;
    const walkName = walkNameRef.current;
    if (!idleName || !walkName) return;

    // Normalise behaviour to ~60fps
    const frameScale = Math.min(delta * 60, 2); // clamp to avoid jumps

    // 1️⃣ Move smoothly toward targetX (delta-based)
    const x = group.current.position.x;
    const posLerp = Math.min(POSITION_LERP * frameScale, 1);
    const newX = THREE.MathUtils.lerp(x, targetX, posLerp);
    group.current.position.x = newX;
    if (positionRef) positionRef.current = newX;

    // 2️⃣ Track gallery velocity to decide animation
    const offset = galleryOffsetRef?.current ?? 0;
    const rawVel = offset - prevOffset.current;
    prevOffset.current = offset;

    // In low power, let velocity settle faster so we don't "walk forever"
    const velSmoothFactor = lowPower ? VELOCITY_SMOOTH * 1.8 : VELOCITY_SMOOTH;
    const velLerp = Math.min(velSmoothFactor * frameScale, 1);
    velRef.current = THREE.MathUtils.lerp(velRef.current, rawVel, velLerp);
    const speed = Math.abs(velRef.current);

    // Track how long we've effectively been still
    if (speed < STILL_THRESHOLD) {
      stillTimeRef.current += delta;
    } else {
      stillTimeRef.current = 0;
    }

    // Determine if we *should* be walking
    let isMoving;
    if (speed > MOVING_THRESHOLD) {
      isMoving = true;
    } else if (stillTimeRef.current > STILL_TIME_REQUIRED) {
      // We've been still long enough → force idle
      isMoving = false;
    } else {
      // In-between zone: keep whatever we're currently doing
      isMoving = currentAction.current === actions[walkName];
    }

    // Update facing direction when there's noticeable movement
    if (speed > STILL_THRESHOLD) {
      facingRef.current = velRef.current > 0 ? 1 : -1;
    }

    // 3️⃣ Blend animations smoothly
    if (isMoving) fadeToAction(walkName);
    else fadeToAction(idleName);

    // 4️⃣ Smooth rotation (delta-based)
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

// Preload all possible Jake variants
CHARACTER_MODELS.forEach((path) => {
  useGLTF.preload(path);
});