// src/Experience.jsx
import { useScroll } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import Character from './components/Character';
import Gallery from './components/Gallery';
import CameraRig from './components/CameraRig';

// ============================================================================
// CONSTANTS
// ============================================================================

const CHARACTER_LEFT_X = -1.2;
const CENTER_EPS = 0.01;
const CHAR_EPS = 0.05;

// ============================================================================
// COMPONENT
// ============================================================================

export default function Experience({
  onArtworkChange,
  autoFocusFirst = false,
  isLowPower = false,
  onScrollContainerReady,
}) {
  const scroll = useScroll();

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  const [mode, setMode] = useState('walk'); // 'walk' | 'approach' | 'inspect'
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [characterTargetX, setCharacterTargetX] = useState(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Refs
  // ─────────────────────────────────────────────────────────────────────────

  const characterXRef = useRef(0);
  const lastScroll = useRef(0);
  const galleryOffsetRef = useRef(0);
  const inspectTargetOffsetRef = useRef(scroll.offset);

  // ─────────────────────────────────────────────────────────────────────────
  // Pass scroll container to parent
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (onScrollContainerReady && scroll?.el) {
      onScrollContainerReady(scroll.el);
    }
  }, [scroll, onScrollContainerReady]);

  // ─────────────────────────────────────────────────────────────────────────
  // Scroll helper
  // ─────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────
  // Exit inspect mode
  // ─────────────────────────────────────────────────────────────────────────

  const exitInspect = () => {
    setMode('walk');
    setSelectedArtwork(null);
    inspectTargetOffsetRef.current = scroll.offset;
    setCharacterTargetX(0);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Watch for approach completion
  // ─────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────
  // Notify parent of artwork changes
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof onArtworkChange !== 'function') return;

    if (mode === 'inspect' && selectedArtwork) {
      onArtworkChange(selectedArtwork);
    } else {
      onArtworkChange(null);
    }
  }, [mode, selectedArtwork, onArtworkChange]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          LIGHTING
          ═══════════════════════════════════════════════════════════════════ */}
      <ambientLight intensity={0.5} />
      <hemisphereLight skyColor="#dfeaff" groundColor="#777777" intensity={0.6} />

      <directionalLight
        castShadow
        position={[8, 12, 6]}
        intensity={isLowPower ? 3.2 : 3.8}
        color="#fff9f0"
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

      {/* ═══════════════════════════════════════════════════════════════════
          SHADOW PLANE
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 50]} />
        <shadowMaterial transparent opacity={0.18} />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════
          CHARACTER
          ═══════════════════════════════════════════════════════════════════ */}
      <Character
        targetX={characterTargetX}
        galleryOffsetRef={galleryOffsetRef}
        positionRef={characterXRef}
        lowPower={isLowPower}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          GALLERY
          ═══════════════════════════════════════════════════════════════════ */}
      <Gallery
        scroll={scroll}
        galleryOffsetRef={galleryOffsetRef}
        selectedArtworkId={selectedArtwork?.id || null}
        autoFocusFirst={autoFocusFirst}
        onScrollToArtworkOffset={(targetOffset) => {
          scrollToOffset(targetOffset);
        }}
        onSelectArtwork={(art) => {
          // Toggle off if clicking same artwork while inspecting
          if (mode === 'inspect' && selectedArtwork && selectedArtwork.id === art.id) {
            exitInspect();
            return;
          }

          // Start approach
          setSelectedArtwork(art);
          setMode('approach');
          setCharacterTargetX(CHARACTER_LEFT_X);
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CAMERA
          ═══════════════════════════════════════════════════════════════════ */}
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