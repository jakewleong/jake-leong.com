// src/components/Gallery.jsx
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
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
    id: 'Self',
    slot: 1,
    model: '/models/art/self.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Self',
    subheading: 'Central Saint Martins - Final Major Project',
    detailMedia: [
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54939076794_7808774e96_b.jpg',
        alt: 'Self 1',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54939026078_31a3af5fb3_b.jpg',
        alt: 'Self 2',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54938821066_a0a35481df_b.jpg',
        alt: 'Self 3',
      },
    ],
  },

  {
    id: 'mowalola',
    slot: 2,
    model: '/models/art/mowalola.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Digital Runway',
    subheading: '3D Artist / Art direction',
    detailMedia: [
      {
        type: 'video',
        src: 'https://player.vimeo.com/video/1139654652?h=f562178756',
        alt: 'Mowalola 1',
        orientation: 'portrait',
      },
      {
        type: 'video',
        src: 'https://player.vimeo.com/video/1140600365?h=e1554e4e98',
        alt: 'Mowalola 2',
        orientation: 'portrait',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54960636035_9a95869454_b.jpg',
        alt: 'DigitalRunwayScreenshot1',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54960582309_79cb868bb4_b.jpg',
        alt: 'DigitalRunwayScreenshot2',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54960509513_e3b6f208f1_b.jpg',
        alt: 'DigitalRunwayScreenshot3',
      },
    ],
  },

  {
    id: 'distortedRealities',
    slot: 3,
    model: '/models/art/distortedRealities01.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Distorted Realities',
    subheading: 'Central Saint Martins - MA Final Project',
    detailMedia: [
      {
        type: 'video',
        src: 'https://player.vimeo.com/video/1142593694?h=e06d972c00',
        alt: 'Distorted Realities Video',
        orientation: 'landscape',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54938821111_f9b8b538a5_b.jpg',
        alt: 'Distorted Realities 1',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54939076864_0d39648378_b.jpg',
        alt: 'Distorted Realities 2',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54937942752_bbc1279349_b.jpg',
        alt: 'Distorted Realities 3',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54939026023_ccac085d7b_b.jpg',
        alt: 'Distorted Realities 4',
      },
    ],
  },

  {
    id: 'NYC - Honor Saint Williams',
    slot: 4,
    model: '/models/art/Cas-NYC.glb',
    scale: 1,
    yOffset: 0,
    heading: 'honor saint williams - nyc',
    subheading: 'Music Video / Direction and animation',
    detailMedia: [
      {
        type: 'video',
        src: 'https://www.youtube.com/embed/HYxDnVBtAfE?si=uSllDaEvzZup8YNo',
        alt: 'honor saint williams - nyc',
        orientation: 'landscape',
      },
    ],
  },

  {
    id: 'Elijah Aike',
    slot: 5,
    model: '/models/art/whiterobe.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Elijah Aike',
    subheading: 'Animation and cover art',
    detailMedia: [
      {
        type: 'video',
        src: 'https://www.youtube.com/embed/PvaokeJYT_k?si=bfsFJinNedvwDMjj',
        alt: 'Sunday freestyle video',
        orientation: 'landscape',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54947000586_853a7cce6f_b.jpg',
        alt: 'White Robe',
      },
      {
        type: 'image',
        src: 'https://live.staticflickr.com/65535/54947305810_c576d7b22c_b.jpg',
        alt: 'End of Life',
      },
    ],
  },

  {
    id: 'Labrum_Nomoli',
    slot: 6,
    model: '/models/art/Labrum_Nomoli.glb',
    scale: 1,
    yOffset: 0,
    heading: 'Labrum London',
    subheading: '3D Artist / Animator',
    detailMedia: [
      {
        type: 'video',
        src: 'https://player.vimeo.com/video/1141675551?h=0822cc864f',
        alt: 'Labrum reel',
        orientation: 'portrait',
      },
      {
        type: 'video',
        src: 'https://player.vimeo.com/video/1141706610?h=104397a7ef',
        alt: 'Shoe construction',
        orientation: 'portrait',
      },
    ],
  },
];

// 👉 WIP slot (animated, clickable)
const WIP_MODEL = '/models/art/wip.glb';

// Different spacing for desktop vs mobile
const MODULE_LENGTH_DESKTOP = 19.5;
const MODULE_LENGTH_MOBILE = 9; // ← tweak this for how tight mobile feels

// Scroll tuning
const SCROLL_MULTIPLIER = 1;

// Desktop vs mobile damping
const DESKTOP_DAMPING = 0.03;
const MOBILE_DAMPING = 0.7;

const isMobileWidth = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

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

  const isMobile = isMobileWidth();
  const moduleLength = isMobile ? MODULE_LENGTH_MOBILE : MODULE_LENGTH_DESKTOP;

  const totalDistance = moduleLength * (LAST_SLOT - FIRST_SLOT);

  useFrame(() => {
    const targetScroll = scroll.offset;
    const damping = isMobileWidth() ? MOBILE_DAMPING : DESKTOP_DAMPING;

    smoothScroll.current = THREE.MathUtils.lerp(
      smoothScroll.current,
      targetScroll,
      damping
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
      <BackgroundSlot
        index={FIRST_SLOT - 1}
        galleryScene={galleryScene}
        moduleLength={moduleLength}
      />

      {/* First artwork (title) is NON-clickable */}
      {artworks.map((art, index) =>
        art.id === TITLE_ID ? (
          <StaticArtSlot
            key={art.id}
            art={art}
            galleryScene={galleryScene}
            moduleLength={moduleLength}
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
            autoSelectOnMount={autoFocusFirst && index === 1}
            moduleLength={moduleLength}
          />
        )
      )}

      {/* 🌱 Animated, clickable “Work in progress” tile at the end */}
      <WorkInProgressSlot
        slot={WIP_SLOT}
        model={WIP_MODEL}
        galleryScene={galleryScene}
        totalDistance={totalDistance}
        onSelectArtwork={onSelectArtwork}
        onScrollToArtworkOffset={onScrollToArtworkOffset}
        selectedArtworkId={selectedArtworkId}
        moduleLength={moduleLength}
      />

      {/* Extra background after WIP */}
      <BackgroundSlot
        index={LAST_SLOT + 1}
        galleryScene={galleryScene}
        moduleLength={moduleLength}
      />
    </group>
  );
}

function BackgroundSlot({ index, galleryScene, moduleLength }) {
  const position = [index * moduleLength, 0, 0];
  return (
    <group position={position}>
      <primitive object={galleryScene.clone()} />
    </group>
  );
}

/**
 * Static, non-clickable slot (used for the title model).
 */
function StaticArtSlot({ art, galleryScene, moduleLength }) {
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

  const slotPosition = [art.slot * moduleLength, 0, 0];

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
  moduleLength,
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

  const slotPosition = [art.slot * moduleLength, 0, 0];

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
        detailMedia={art.detailMedia}
        autoSelectOnMount={autoSelectOnMount}
        moduleLength={moduleLength}
      />
    </group>
  );
}

/**
 * Animated, clickable “work in progress” tile.
 */
function WorkInProgressSlot({
  slot,
  model,
  galleryScene,
  totalDistance,
  onSelectArtwork,
  onScrollToArtworkOffset,
  selectedArtworkId,
  moduleLength,
}) {
  const slotGroup = useRef();

  // ⬇️ get scene + animations from the GLB
  const { scene: wipScene, animations } = useGLTF(model);
  const { actions, names } = useAnimations(animations, wipScene);

  // Shadows as before
  useEffect(() => {
    wipScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = false;
      }
    });
  }, [wipScene]);

  // ⬇️ play the first animation clip on loop
  useEffect(() => {
    if (!actions || !names || names.length === 0) return;

    const clipName = names[0];
    const action = actions[clipName];
    if (!action) return;

    action.reset().play();
    action.loop = THREE.LoopRepeat;
    action.clampWhenFinished = false;

    return () => action.stop();
  }, [actions, names]);

  const slotPosition = [slot * moduleLength, 0, 0];

  return (
    <group ref={slotGroup} position={slotPosition}>
      <primitive object={galleryScene.clone()} />

      <ClickableArtwork
        id="wip"
        artScene={wipScene}
        scale={0.7}
        yOffset={0}
        slot={slot}
        totalDistance={totalDistance}
        onSelectArtwork={onSelectArtwork}
        onScrollToArtworkOffset={onScrollToArtworkOffset}
        selectedArtworkId={selectedArtworkId}
        heading="More work coming soon"
        subheading=""
        body={null}
        detailMedia={[]}
        moduleLength={moduleLength}
      />
    </group>
  );
}

/**
 * Fully interactive artwork with a larger invisible hit-area.
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
  detailMedia,
  autoSelectOnMount = false,
  moduleLength,
}) {
  const artGroup = useRef();
  const [hovered, setHovered] = useState(false);
  const originalMaterialsRef = useRef([]);
  const hasAutoSelectedRef = useRef(false);

  // Fixed, non-overlapping hit box per artwork
  const hitBoxCenter = [0, 1.5, 0]; // roughly chest-height
  const hitBoxSize = [3.5, 4, 3.5]; // width, height, depth

  const position = [0, yOffset, 0.5];

  // Save original materials once
  useEffect(() => {
    const originals = [];
    artScene.traverse((obj) => {
      if (obj.isMesh) {
        originals.push({ mesh: obj, material: obj.material });
      }
    });
    originalMaterialsRef.current = originals;

    return () => {
      // restore originals on unmount
      originals.forEach(({ mesh, material }) => {
        mesh.material = material;
      });
    };
  }, [artScene]);

  // Hover effect + cursor (color only, no opacity changes)
  useEffect(() => {
    const originals = originalMaterialsRef.current;
    if (!originals.length) return;

    if (hovered) {
      document.body.style.cursor = 'pointer';

      originals.forEach(({ mesh, material }) => {
        const hoverMat = material.clone();
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
    if (onScrollToArtworkOffset && totalDistance > 0 && moduleLength) {
      const rawOffset =
        (slot * moduleLength) / (totalDistance * SCROLL_MULTIPLIER);
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
      detailMedia,
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
      {/* Invisible, fixed-size hit box – same for every artwork */}
      <mesh
        position={hitBoxCenter}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={hitBoxSize} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
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
