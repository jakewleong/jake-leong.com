// src/Experience.jsx
import { useScroll } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import Character from './components/Character';
import Gallery from './components/Gallery';
import CameraRig from './components/CameraRig';

export default function Experience({
  onArtworkChange,
  autoFocusFirst = false,
  isLowPower = false,
}) {
  const scroll = useScroll();

  // 'walk' | 'approach' | 'inspect'
  const [mode, setMode] = useState('walk');
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  const [characterTargetX, setCharacterTargetX] = useState(0);
  const characterXRef = useRef(0);

  const lastScroll = useRef(0);

  // Smoothed gallery offset (0 → 1), written by Gallery
  const galleryOffsetRef = useRef(0);
  // Target scroll offset for inspect (0 → 1)
  const inspectTargetOffsetRef = useRef(scroll.offset);

  // Character stand position in inspect (slightly left of center)
  const CHARACTER_LEFT_X = -1.2;

  // how close gallery must be to target to count as "centered"
  const CENTER_EPS = 0.01;
  // how close character must be to targetX to count as "in position"
  const CHAR_EPS = 0.05;

  // Helper to scroll the HTML container to a specific offset (0 → 1)
  const scrollToOffset = (targetOffset) => {
    const el = scroll.el;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    const clamped = Math.min(Math.max(targetOffset, 0), 1);

    inspectTargetOffsetRef.current = clamped;

    el.scrollTo({
      top: clamped * maxScroll,
      behavior: 'smooth',
    });
  };

  // Centralised helper to exit inspect mode
  const exitInspect = () => {
    setMode('walk');
    setSelectedArtwork(null);
    inspectTargetOffsetRef.current = scroll.offset;
    setCharacterTargetX(0);
  };

  // 🔁 Watch for the moment when gallery & character are both in place
  useEffect(() => {
    if (mode !== 'approach' || !selectedArtwork) return;

    const checkReady = () => {
      if (mode !== 'approach') return;

      const g = galleryOffsetRef.current;
      const targetOffset = inspectTargetOffsetRef.current;
      const galleryCentered = Math.abs(g - targetOffset) < CENTER_EPS;

      const charX = characterXRef.current;
      const charInPlace = Math.abs(charX - CHARACTER_LEFT_X) < CHAR_EPS;

      if (galleryCentered && charInPlace) {
        setMode('inspect');
        lastScroll.current = scroll.offset;
        return;
      }

      requestAnimationFrame(checkReady);
    };

    const id = requestAnimationFrame(checkReady);
    return () => cancelAnimationFrame(id);
  }, [mode, selectedArtwork]);

  /**
   * ▶️ Tell App which artwork is active for the overlay.
   * We only send data when we are *fully* in INSPECT mode.
   */
  useEffect(() => {
    if (typeof onArtworkChange !== 'function') return;

    if (mode === 'inspect' && selectedArtwork) {
      const { heading, subheading, body } = selectedArtwork;
      onArtworkChange({ heading, subheading, body });
    } else {
      onArtworkChange(null);
    }
  }, [mode, selectedArtwork, onArtworkChange]);

  return (
    <>
      {/* LIGHTING */}
      <ambientLight intensity={0.5} />
      <hemisphereLight
        skyColor={'#dfeaff'}
        groundColor={'#777777'}
        intensity={0.6}
      />

      <directionalLight
        castShadow
        position={[8, 12, 6]}
        intensity={isLowPower ? 3.2 : 3.8}
        color={'#fff9f0'}
        shadow-mapSize-width={isLowPower ? 1024 : 2048}
        shadow-mapSize-height={isLowPower ? 1024 : 2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />

      {/* Shadow plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 50]} />
        <shadowMaterial transparent opacity={0.18} />
      </mesh>

      {/* Character */}
      <Character
        targetX={characterTargetX}
        galleryOffsetRef={galleryOffsetRef}
        positionRef={characterXRef}
        lowPower={isLowPower}
      />

      {/* Gallery */}
      <Gallery
        scroll={scroll}
        galleryOffsetRef={galleryOffsetRef}
        selectedArtworkId={selectedArtwork?.id || null}
        autoFocusFirst={autoFocusFirst}
        onScrollToArtworkOffset={(targetOffset) => {
          scrollToOffset(targetOffset);
        }}
        onSelectArtwork={(art) => {
          // If we're already inspecting THIS artwork, clicking it exits inspect
          if (
            mode === 'inspect' &&
            selectedArtwork &&
            selectedArtwork.id === art.id
          ) {
            exitInspect();
            return;
          }

          // Normal behaviour: start approaching the clicked artwork
          setSelectedArtwork(art);
          setMode('approach');
          // Character heads to fixed left position (screen-space)
          setCharacterTargetX(CHARACTER_LEFT_X);
        }}
      />

      {/* Camera controller */}
      <CameraRig
        scroll={scroll}
        mode={mode}
        selectedArtwork={selectedArtwork}
        onExitInspect={exitInspect}
        lastScrollRef={lastScroll}
        inspectTargetOffsetRef={inspectTargetOffsetRef}
        galleryOffsetRef={galleryOffsetRef}
      />
    </>
  );
}
