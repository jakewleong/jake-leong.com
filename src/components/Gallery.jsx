// src/components/Gallery.jsx
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 👇 Your artwork models + UI text
const artworks = [
  {
    id: 'title',
    slot: 0,
    model: '/models/art/title.glb',
    scale: 1,
    yOffset: 0,
    body: [
      { text: 'Instagram', url: 'https://www.instagram.com/jake__leong/' },
    ],
  },
  {
    id: 'Labrum_Nomoli',
    slot: 1,
    model: '/models/art/Labrum_Nomoli.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Labrum London',
    subheading: '3D Artist / Animator',
    body: [
      {
        text: 'AW25 Animation',
        url: 'https://www.instagram.com/p/DGYA8GYIflD/',
      },
      {
        text: 'Africa Day Animation',
        url: 'https://www.instagram.com/p/DKuWungIQX_/',
      },
    ],
  },
  {
    id: 'mowalola',
    slot: 2,
    model: '/models/art/mowalola.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Mowalola Video',
    subheading: '3D Artist / Art direction',
    body: 'Links to view work',
  },
  {
    id: 'distortedRealities01',
    slot: 3,
    model: '/models/art/distortedRealities01.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Distorted Realities #1',
    subheading: 'Central Saint Martins - MA Final Project',
    body: 'Link to video',
  },
  {
    id: 'distortedRealities02',
    slot: 4,
    model: '/models/art/distortedRealities02.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Distorted Realities #2',
    subheading: 'Central Saint Martins - MA Final Project',
    body: 'Link to video',
  },
];

// 👉 Non-clickable WIP slot
const WIP_MODEL = '/models/art/wip.glb'; // <- your GLB path
const MODULE_LENGTH = 19.5;

// Scroll tuning
const SCROLL_MULTIPLIER = 1;
const DAMPING = 0.03;

// IDs
const TITLE_ID = 'title';

// WIP slot is always one tile after your last artwork
const FIRST_SLOT = artworks[0].slot;
const WIP_SLOT = artworks[artworks.length - 1].slot + 1;
const LAST_SLOT = WIP_SLOT; // gallery extends to include WIP

export default function Gallery({
  scroll,
  onSelectArtwork,
  galleryOffsetRef,
  onScrollToArtworkOffset,
  selectedArtworkId,
  autoFocusFirst = false,
}) {
  const group = useRef();
  const smoothScroll = useRef(0);

  const { scene: galleryScene } = useGLTF('/models/gallery_base.glb');

  // Gallery meshes receive shadows
  useEffect(() => {
    galleryScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = true;
      }
    });
  }, [galleryScene]);

  const totalDistance = MODULE_LENGTH * (LAST_SLOT - FIRST_SLOT);

  useFrame(() => {
    const targetScroll = scroll.offset;

    smoothScroll.current = THREE.MathUtils.lerp(
      smoothScroll.current,
      targetScroll,
      DAMPING
    );

    if (galleryOffsetRef) {
      galleryOffsetRef.current = smoothScroll.current;
    }

    const targetX = -smoothScroll.current * totalDistance * SCROLL_MULTIPLIER;

    if (group.current) {
      group.current.position.x = targetX;
    }
  });

  return (
    <group ref={group}>
      {/* Extra background before first slot */}
      <BackgroundSlot index={FIRST_SLOT - 1} galleryScene={galleryScene} />

      {/* First artwork (title) is NON-clickable */}
      {artworks.map((art, index) =>
        art.id === TITLE_ID ? (
          <StaticArtSlot
            key={art.id}
            art={art}
            galleryScene={galleryScene}
          />
        ) : (
          <ArtSlot
            key={art.id}
            art={art}
            galleryScene={galleryScene}
            totalDistance={totalDistance}
            onSelectArtwork={onSelectArtwork}
            onScrollToArtworkOffset={onScrollToArtworkOffset}
            selectedArtworkId={selectedArtworkId}
            // If you ever re-enable autoFocusFirst, we probably want
            // the *first clickable* artwork (index > 0)
            autoSelectOnMount={autoFocusFirst && index === 1}
          />
        )
      )}

      {/* 🌱 Non-clickable “Work in progress” tile at the end */}
      <WorkInProgressSlot
        slot={WIP_SLOT}
        model={WIP_MODEL}
        galleryScene={galleryScene}
      />

      {/* Extra background after WIP */}
      <BackgroundSlot index={LAST_SLOT + 1} galleryScene={galleryScene} />
    </group>
  );
}

function BackgroundSlot({ index, galleryScene }) {
  const position = [index * MODULE_LENGTH, 0, 0];
  return (
    <group position={position}>
      <primitive object={galleryScene.clone()} />
    </group>
  );
}

/**
 * Static, non-clickable slot (used for the title model).
 */
function StaticArtSlot({ art, galleryScene }) {
  const slotGroup = useRef();
  const { scene: artScene } = useGLTF(art.model);

  useEffect(() => {
    artScene.traverse((obj) => {
      if (obj.isMesh) {
        // title: no floor shadow, no hover behaviour
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
  }, [artScene]);

  const slotPosition = [art.slot * MODULE_LENGTH, 0, 0];

  return (
    <group ref={slotGroup} position={slotPosition}>
      <primitive object={galleryScene.clone()} />
      <group position={[0, art.yOffset, 0.5]} scale={art.scale}>
        <primitive object={artScene} />
      </group>
    </group>
  );
}

function ArtSlot({
  art,
  galleryScene,
  totalDistance,
  onSelectArtwork,
  onScrollToArtworkOffset,
  selectedArtworkId,
  autoSelectOnMount = false,
}) {
  const slotGroup = useRef();
  const { scene: artScene } = useGLTF(art.model);

  // Art meshes cast shadows
  useEffect(() => {
    artScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = false;
      }
    });
  }, [artScene]);

  const slotPosition = [art.slot * MODULE_LENGTH, 0, 0];

  return (
    <group ref={slotGroup} position={slotPosition}>
      <primitive object={galleryScene.clone()} />
      <ClickableArtwork
        id={art.id}
        artScene={artScene}
        scale={art.scale}
        yOffset={art.yOffset}
        slot={art.slot}
        totalDistance={totalDistance}
        onSelectArtwork={onSelectArtwork}
        onScrollToArtworkOffset={onScrollToArtworkOffset}
        selectedArtworkId={selectedArtworkId}
        heading={art.heading}
        subheading={art.subheading}
        body={art.body}
        autoSelectOnMount={autoSelectOnMount}
      />
    </group>
  );
}

/**
 * Non-interactive “work in progress” tile.
 * No hover, no click, just a small hint at future work.
 */
function WorkInProgressSlot({ slot, model, galleryScene }) {
  const slotGroup = useRef();
  const { scene: wipScene } = useGLTF(model);

  useEffect(() => {
    wipScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = false;
      }
    });
  }, [wipScene]);

  const slotPosition = [slot * MODULE_LENGTH, 0, 0];

  return (
    <group ref={slotGroup} position={slotPosition}>
      <primitive object={galleryScene.clone()} />
      <group position={[0, 0, 0.5]} scale={0.7}>
        <primitive object={wipScene} />
      </group>
    </group>
  );
}

/**
 * Fully interactive artwork with a larger invisible hit-area,
 * computed from the model's actual bounds so it's symmetric.
 */
function ClickableArtwork({
  id,
  artScene,
  scale,
  yOffset,
  slot,
  totalDistance,
  onSelectArtwork,
  onScrollToArtworkOffset,
  selectedArtworkId,
  heading,
  subheading,
  body,
  autoSelectOnMount = false,
}) {
  const artGroup = useRef();
  const [hovered, setHovered] = useState(false);
  const originalMaterialsRef = useRef([]);
  const hasAutoSelectedRef = useRef(false);

  // Config for the invisible hit box (computed from model bounds)
  const [hitBoxConfig, setHitBoxConfig] = useState({
    center: [0, 1, 0],
    size: [2, 2, 2],
  });

  const position = [0, yOffset, 0.5];

  // Save original materials + compute bounding box
  useEffect(() => {
    const originals = [];
    artScene.traverse((obj) => {
      if (obj.isMesh) {
        originals.push({ mesh: obj, material: obj.material });
      }
    });
    originalMaterialsRef.current = originals;

    // Compute bounding box of the model for consistent hit area
    const box = new THREE.Box3().setFromObject(artScene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    if (
      Number.isFinite(size.x) &&
      Number.isFinite(size.y) &&
      Number.isFinite(size.z)
    ) {
      const margin = 0.25; // extra padding around the model
      size.addScalar(margin);
      setHitBoxConfig({
        center: [center.x, center.y, center.z],
        size: [size.x, size.y, size.z],
      });
    }
  }, [artScene]);

  // Hover effect + cursor (color only, no opacity changes)
  useEffect(() => {
    const originals = originalMaterialsRef.current;
    if (!originals.length) return;

    if (hovered) {
      document.body.style.cursor = 'pointer';

      originals.forEach(({ mesh, material }) => {
        const hoverMat = material.clone();
        // Slight blue tint but keep original opacity/transparent flags
        const blue = new THREE.Color(0x7fbfff);
        if (hoverMat.color) {
          hoverMat.color.lerp(blue, 0.35);
        }
        hoverMat.transparent = material.transparent;
        hoverMat.opacity = material.opacity;
        mesh.material = hoverMat;
      });
    } else {
      document.body.style.cursor = 'default';
      originals.forEach(({ mesh, material }) => {
        mesh.material = material;
      });
    }

    return () => {
      document.body.style.cursor = 'default';
      originals.forEach(({ mesh, material }) => {
        mesh.material = material;
      });
    };
  }, [hovered]);

  const triggerSelect = () => {
    if (!artGroup.current) return;

    // world position for camera logic
    artGroup.current.updateWorldMatrix(true, true);
    const worldPos = new THREE.Vector3().setFromMatrixPosition(
      artGroup.current.matrixWorld
    );

    // smooth scroll target so this artwork ends up centered
    if (onScrollToArtworkOffset && totalDistance > 0) {
      const rawOffset =
        (slot * MODULE_LENGTH) / (totalDistance * SCROLL_MULTIPLIER);
      const targetOffset = Math.min(Math.max(rawOffset, 0), 1);
      onScrollToArtworkOffset(targetOffset);
    }

    onSelectArtwork({
      id,
      position: worldPos,
      slot,
      heading,
      subheading,
      body,
    });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    triggerSelect();
  };

  // Auto-select (for first artwork on load when autoFocusFirst is true)
  useEffect(() => {
    if (!autoSelectOnMount) return;
    if (hasAutoSelectedRef.current) return;
    if (!artGroup.current) return;

    hasAutoSelectedRef.current = true;
    triggerSelect();
  }, [autoSelectOnMount]);

  return (
    <group
      ref={artGroup}
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* 🔍 Invisible hit box based on model bounds */}
      <mesh
        position={hitBoxConfig.center}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={hitBoxConfig.size} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false} // don't occlude other objects or shadows
          depthTest={false}
        />
      </mesh>

      {/* Actual visual model */}
      <primitive object={artScene} />
    </group>
  );
}

// Preload models
useGLTF.preload('/models/gallery_base.glb');
useGLTF.preload(WIP_MODEL);
artworks.forEach((art) => useGLTF.preload(art.model));
