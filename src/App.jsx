// src/App.jsx
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, useProgress, useGLTF } from '@react-three/drei';
import { useState, useEffect, useRef, Suspense } from 'react';
import Experience from './Experience';
import Lottie from 'lottie-react';
import scrollThumbAnim from './animations/scroll-thumb.json';
import desktopScrollAnim from './animations/scroll-desktop.json';
import loadingAnim from './animations/loading-walk.json';

// ============================================================================
// HELPERS
// ============================================================================

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

function TypeLine({ text, speed = 25 }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!text) {
      setShown('');
      return;
    }

    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);

    return () => clearInterval(id);
  }, [text, speed]);

  return <span>{shown}</span>;
}

function toLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split('\n');
}

// ============================================================================
// MEDIA CAROUSEL OVERLAY
// ============================================================================

function MediaCarouselOverlay({ items, index, setIndex, onClose }) {
  const dragState = useRef({ active: false, startX: 0 });
  const isMobile = useIsMobile();

  if (!items || items.length === 0) return null;

  const current = items[index] || items[0];
  const isVideo = current.type === 'video';
  const orientation = current.orientation || 'landscape';
  const isPortraitVideo = isVideo && orientation === 'portrait';
  const isLandscapeVideo = isVideo && orientation === 'landscape';

  const goPrev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);
  const goNext = () => setIndex((prev) => (prev + 1) % items.length);

  const getClientX = (e) => {
    if (e.clientX != null) return e.clientX;
    if (e.touches?.[0]) return e.touches[0].clientX;
    if (e.changedTouches?.[0]) return e.changedTouches[0].clientX;
    return 0;
  };

  const handlePointerDown = (e) => {
    dragState.current.active = true;
    dragState.current.startX = getClientX(e);
  };

  const handlePointerMove = () => {
    if (!dragState.current.active) return;
  };

  const handlePointerUp = (e) => {
    if (!dragState.current.active) return;
    const endX = getClientX(e);
    const dx = endX - dragState.current.startX;
    dragState.current.active = false;

    const THRESHOLD = 40;
    if (Math.abs(dx) > THRESHOLD) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  const maxMediaHeight = isMobile ? '70vh' : '80vh';

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: isMobile ? '6vh' : 0,
    paddingBottom: isMobile ? '10vh' : 0,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  };

  const contentStyle = {
    width: isMobile ? '100vw' : 'min(90vw, 1000px)',
    maxHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? 0 : 16,
    padding: isMobile ? 0 : '0 12px',
    position: 'relative',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: isMobile ? 16 : -8,
    left: isMobile ? 16 : -8,
    width: 36,
    height: 36,
    borderRadius: 999,
    border: 'none',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    lineHeight: 1,
    zIndex: 2,
  };

  const arrowButtonStyle = {
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: 28,
    cursor: 'pointer',
    padding: 8,
  };

  const mobileArrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    width: 32,
    height: 32,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 22,
  };

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={contentStyle}>
        {/* Close button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={closeButtonStyle}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Left arrow (desktop) */}
        {!isMobile && items.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            style={arrowButtonStyle}
            aria-label="Previous"
          >
            ‹
          </button>
        )}

        {/* Media wrapper */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={(e) => handlePointerDown(e.nativeEvent)}
          onTouchMove={(e) => handlePointerMove(e.nativeEvent)}
          onTouchEnd={(e) => handlePointerUp(e.nativeEvent)}
          style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            key={index}
            style={{
              width: isMobile ? '100%' : isVideo ? 'min(100%, 960px)' : 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: maxMediaHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'carouselSlide 0.25s ease',
              ...(isPortraitVideo ? { aspectRatio: '9 / 16' } : isLandscapeVideo ? { aspectRatio: '16 / 9' } : {}),
            }}
          >
            {isVideo ? (
              <iframe
                title={current.alt || 'Video'}
                src={current.src}
                style={{ border: 'none', width: '100%', height: '100%', display: 'block', background: 'black' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={current.src}
                alt={current.alt || ''}
                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: maxMediaHeight, objectFit: 'contain', display: 'block' }}
              />
            )}
          </div>

          {/* Mobile arrows */}
          {isMobile && items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                style={{ ...mobileArrowStyle, left: 12 }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                style={{ ...mobileArrowStyle, right: 12 }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Right arrow (desktop) */}
        {!isMobile && items.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            style={arrowButtonStyle}
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', bottom: '12vh', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}
        >
          {items.map((_, i) => (
            <div
              key={i}
              style={{ width: 6, height: 6, borderRadius: 999, background: i === index ? '#fff' : 'rgba(255,255,255,0.4)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ASSET PRELOADING
// ============================================================================

function AssetWarmup({ onReady }) {
  useGLTF('/models/gallery_base.opt.glb');
  useGLTF('/models/art/title.opt.glb');
  useGLTF('/models/art/self.opt.glb');
  useGLTF('/models/art/mowalola.opt.glb');
  useGLTF('/models/art/distortedRealities01.opt.glb');
  useGLTF('/models/art/Cas-NYC.opt.glb');
  useGLTF('/models/art/whiterobe.opt.glb');
  useGLTF('/models/art/Labrum_Nomoli.opt.glb');
  useGLTF('/models/art/wip.opt.glb');
  useGLTF('/models/jake01.opt.glb');
  useGLTF('/models/jake02.opt.glb');

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return null;
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  const [inputEnabled, setInputEnabled] = useState(false);
  const [activeArtwork, setActiveArtwork] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [warmupReady, setWarmupReady] = useState(false);

  const { progress } = useProgress();
  const [showLoader, setShowLoader] = useState(true);

  const [scrollOverlayVisible, setScrollOverlayVisible] = useState(false);
  const [scrollOverlayDismissed, setScrollOverlayDismissed] = useState(false);

  const isMobile = useIsMobile();
  const [scrollContainer, setScrollContainer] = useState(null);
  const [moveDir, setMoveDir] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const overlayIsOpen = overlaySection !== null;

  const [mediaOverlayOpen, setMediaOverlayOpen] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [hasTappedArtwork, setHasTappedArtwork] = useState(false);

  const activeHasMedia = !!activeArtwork && Array.isArray(activeArtwork.detailMedia) && activeArtwork.detailMedia.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Loader fade-out
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (progress === 100) {
      const t = setTimeout(() => setShowLoader(false), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);

  // ─────────────────────────────────────────────────────────────────────────
  // Enable input after loader
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showLoader) {
      setInputEnabled(false);
      return;
    }

    const delay = isMobile ? 450 : 150;
    let raf1 = null;
    let raf2 = null;

    const t = setTimeout(() => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setInputEnabled(true);
        });
      });
    }, delay);

    return () => {
      clearTimeout(t);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [showLoader, isMobile]);

  // ─────────────────────────────────────────────────────────────────────────
  // Extra mobile preload
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isMobile || progress !== 100) return;

    useGLTF.preload('/models/gallery_base.opt.glb');
    useGLTF.preload('/models/art/title.opt.glb');
    useGLTF.preload('/models/art/self.opt.glb');
    useGLTF.preload('/models/art/mowalola.opt.glb');
    useGLTF.preload('/models/art/distortedRealities01.opt.glb');
    useGLTF.preload('/models/jake01.opt.glb');
    useGLTF.preload('/models/jake02.opt.glb');
  }, [isMobile, progress]);

  // ─────────────────────────────────────────────────────────────────────────
  // Show loader longer on mobile for warmup
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (progress !== 100 || !warmupReady) return;

    const EXTRA_MOBILE_DELAY_MS = 900;
    const BASE_DELAY_MS = 400;
    const delay = isMobile ? BASE_DELAY_MS + EXTRA_MOBILE_DELAY_MS : BASE_DELAY_MS;

    const t = setTimeout(() => setShowLoader(false), delay);
    return () => clearTimeout(t);
  }, [progress, isMobile, warmupReady]);

  // ─────────────────────────────────────────────────────────────────────────
  // Scroll overlay visibility
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showLoader && progress === 100) {
      setScrollOverlayVisible(true);
      setScrollOverlayDismissed(false);
    }
  }, [showLoader, progress]);

  // ─────────────────────────────────────────────────────────────────────────
  // Dismiss scroll overlay on interaction
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showLoader || !scrollOverlayVisible || scrollOverlayDismissed) return;

    const dismissOverlay = () => {
      setHasInteracted(true);
      setScrollOverlayDismissed(true);
    };

    window.addEventListener('wheel', dismissOverlay, { passive: true });
    window.addEventListener('touchmove', dismissOverlay, { passive: true });

    return () => {
      window.removeEventListener('wheel', dismissOverlay);
      window.removeEventListener('touchmove', dismissOverlay);
    };
  }, [showLoader, scrollOverlayVisible, scrollOverlayDismissed]);

  // ─────────────────────────────────────────────────────────────────────────
  // Unmount scroll overlay after animation
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!scrollOverlayDismissed) return;
    const t = setTimeout(() => setScrollOverlayVisible(false), 450);
    return () => clearTimeout(t);
  }, [scrollOverlayDismissed]);

  // ─────────────────────────────────────────────────────────────────────────
  // Low-power detection
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;
    const saveData = navigator.connection?.saveData;
    const guessLowPower = saveData === true || cores <= 4 || dpr > 2.5;
    setIsLowPower(guessLowPower);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Close media overlay when artwork/overlay changes
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setMediaOverlayOpen(false);
    setMediaIndex(0);
  }, [activeArtwork, overlayIsOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // Menu handlers
  // ─────────────────────────────────────────────────────────────────────────

  const toggleHamburger = () => {
    if (overlayIsOpen) {
      setOverlaySection(null);
      setMenuOpen(true);
    } else {
      setMenuOpen((prev) => !prev);
    }
  };

  const openOverlay = (section) => {
    setOverlaySection(section);
    setMenuOpen(true);
  };

  const closeOverlay = () => setOverlaySection(null);

  const iconOpen = menuOpen || overlayIsOpen;

  // ─────────────────────────────────────────────────────────────────────────
  // CHROME FIX: Desktop wheel event handler with {passive: false}
  // This ensures Chrome doesn't treat the scroll container's wheel events
  // as passive by default, which can break scrolling in some Chrome versions.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isMobile || !scrollContainer || overlayIsOpen || mediaOverlayOpen || !inputEnabled) {
      return;
    }

    const onWheel = (e) => {
      // We don't prevent default - we want native scrolling.
      // This handler exists solely to ensure the event listener
      // is registered with {passive: false}.
    };

    scrollContainer.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', onWheel);
    };
  }, [isMobile, scrollContainer, overlayIsOpen, mediaOverlayOpen, inputEnabled]);

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile touch physics
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isMobile || !scrollContainer || overlayIsOpen || mediaOverlayOpen || !inputEnabled) {
      return;
    }

    let startX = 0, startY = 0, lastX = 0, lastY = 0, lastTime = 0;
    let gestureType = 'none';
    let velocity = 0;
    let inertiaFrame = null;

    const SWIPE_STRENGTH = 1.8;
    const FRICTION = 0.985;
    const DEADZONE = 12;
    const AXIS_BIAS = 2;
    const MAX_DELTA_PER_EVENT = 80;
    const MAX_VELOCITY = 2.2;
    const MIN_DT = 8;
    const MAX_DT = 40;

    const stopInertia = () => {
      if (inertiaFrame !== null) {
        cancelAnimationFrame(inertiaFrame);
        inertiaFrame = null;
      }
    };

    const prevTouchAction = scrollContainer.style.touchAction;
    scrollContainer.style.touchAction = 'none';

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      lastX = t.clientX;
      lastY = t.clientY;
      lastTime = performance.now();
      gestureType = 'none';
      velocity = 0;
      stopInertia();
    };

    const onTouchMove = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const now = performance.now();
      const dxTotal = t.clientX - startX;
      const dyTotal = t.clientY - startY;

      if (gestureType === 'none') {
        const dist = Math.hypot(dxTotal, dyTotal);
        if (dist < DEADZONE) return;
        gestureType = Math.abs(dxTotal) > Math.abs(dyTotal) * AXIS_BIAS ? 'horizontal' : 'vertical';
      }

      e.preventDefault();

      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      let dt = now - lastTime || 16;
      dt = Math.min(Math.max(dt, MIN_DT), MAX_DT);

      lastX = t.clientX;
      lastY = t.clientY;
      lastTime = now;

      let deltaScroll = gestureType === 'horizontal' ? dx * SWIPE_STRENGTH : -dy * SWIPE_STRENGTH;
      deltaScroll = Math.max(-MAX_DELTA_PER_EVENT, Math.min(MAX_DELTA_PER_EVENT, deltaScroll));

      scrollContainer.scrollTop += deltaScroll;

      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, deltaScroll / dt));
    };

    const onTouchEnd = () => {
      if (gestureType === 'none' || Math.abs(velocity) < 0.01) {
        gestureType = 'none';
        return;
      }

      let last = performance.now();

      const step = (now) => {
        const dt = Math.min(Math.max(now - last, MIN_DT), 50);
        last = now;
        scrollContainer.scrollTop += velocity * dt;
        velocity *= Math.pow(FRICTION, dt / 16);

        if (Math.abs(velocity) > 0.01) {
          inertiaFrame = requestAnimationFrame(step);
        } else {
          inertiaFrame = null;
        }
      };

      inertiaFrame = requestAnimationFrame(step);
      gestureType = 'none';
    };

    scrollContainer.addEventListener('touchstart', onTouchStart, { passive: false });
    scrollContainer.addEventListener('touchmove', onTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', onTouchEnd);
    scrollContainer.addEventListener('touchcancel', onTouchEnd);

    return () => {
      stopInertia();
      scrollContainer.style.touchAction = prevTouchAction;
      scrollContainer.removeEventListener('touchstart', onTouchStart);
      scrollContainer.removeEventListener('touchmove', onTouchMove);
      scrollContainer.removeEventListener('touchend', onTouchEnd);
      scrollContainer.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isMobile, scrollContainer, overlayIsOpen, mediaOverlayOpen, inputEnabled]);

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop arrow key movement
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isMobile || !scrollContainer || moveDir === 0 || overlayIsOpen || mediaOverlayOpen) return;

    let frameId = null;
    let lastTime = performance.now();

    const step = (now) => {
      const dt = now - lastTime;
      lastTime = now;

      const el = scrollContainer;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) {
        frameId = requestAnimationFrame(step);
        return;
      }

      const RANGE_PER_SECOND = 0.45;
      const delta = moveDir * RANGE_PER_SECOND * (dt / 1000) * maxScroll;
      el.scrollTop = Math.max(0, Math.min(maxScroll, el.scrollTop + delta));
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => { if (frameId !== null) cancelAnimationFrame(frameId); };
  }, [isMobile, scrollContainer, moveDir, overlayIsOpen, mediaOverlayOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // Artwork change handler
  // ─────────────────────────────────────────────────────────────────────────

  const handleArtworkChange = (artwork) => {
    setActiveArtwork(artwork);
    if (artwork && !hasTappedArtwork) setHasTappedArtwork(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111', overflow: 'hidden', position: 'relative' }}>
      
      {/* LOADING OVERLAY */}
      {showLoader && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255, 255, 255, 1)',
          backdropFilter: 'blur(22px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          transition: 'opacity 0.5s ease',
          opacity: progress === 100 ? 0 : 1,
          pointerEvents: 'auto',
        }}>
          <Lottie animationData={loadingAnim} loop autoplay speed={0.7}
            style={{ width: 'clamp(80px, 15vw, 140px)', height: 'auto', marginBottom: '20px', animation: 'walkerBob 1.2s ease-in-out infinite' }} />
          <div style={{ width: 'min(60vw, 220px)', height: '6px', background: 'rgba(255, 255, 255, 0.16)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#000', transition: 'width 0.18s ease-out' }} />
          </div>
          <div style={{ marginTop: '10px', fontSize: '13px', letterSpacing: '0.03em', textTransform: 'uppercase', opacity: 0.75 }}>
            {Math.floor(progress)}%
          </div>
        </div>
      )}

      {/* SCROLL PROMPT OVERLAY */}
      {!showLoader && !overlayIsOpen && scrollOverlayVisible && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 80,
          background: 'rgba(10, 10, 10, 0.32)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          pointerEvents: 'none',
          transform: scrollOverlayDismissed ? 'translateY(-100%)' : 'translateY(0)',
          opacity: scrollOverlayDismissed ? 0 : 1,
          transition: 'transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.4s ease',
        }}>
          <div style={{
            position: 'absolute', left: '50%', bottom: isMobile ? '36vh' : '26vh',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '80vw', maxWidth: 260, gap: 12,
          }}>
            <Lottie animationData={isMobile ? scrollThumbAnim : desktopScrollAnim} loop autoplay
              style={{ width: isMobile ? 220 : 100, height: 'auto' }} />
            <p style={{ margin: 0, color: '#fff', fontSize: 16, letterSpacing: '0.12em', textAlign: 'center', textTransform: 'uppercase', opacity: 0.95 }}>
              Scroll to view gallery
            </p>
          </div>
        </div>
      )}

      {/* HAMBURGER MENU */}
      {!showLoader && (
        <div style={{ position: 'absolute', top: 40, left: 40, zIndex: 40 }}>
          <button type="button" onClick={(e) => { e.currentTarget.blur(); toggleHamburger(); }}
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', width: 50, height: 50, position: 'relative', outline: 'none' }}>
            <span style={{ position: 'absolute', left: 6, right: 6, height: 2, borderRadius: 999, background: '#000', transition: 'all 0.2s ease', top: iconOpen ? 15 : 8, transform: iconOpen ? 'rotate(45deg)' : 'none' }} />
            <span style={{ position: 'absolute', left: 6, right: 6, height: 2, borderRadius: 999, background: '#000', transition: 'opacity 0.2s ease', top: 15, opacity: iconOpen ? 0 : 1 }} />
            <span style={{ position: 'absolute', left: 6, right: 6, height: 2, borderRadius: 999, background: '#000', transition: 'all 0.2s ease', top: iconOpen ? 15 : 22, transform: iconOpen ? 'rotate(-45deg)' : 'none' }} />
          </button>

          {menuOpen && !overlayIsOpen && (
            <div style={{ marginTop: 8, color: '#000', fontFamily: 'system-ui', fontSize: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => openOverlay('about')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: '#000', textAlign: 'left', fontSize: 'inherit' }}>About me</button>
              <button type="button" onClick={() => openOverlay('contact')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: '#000', textAlign: 'left', fontSize: 'inherit' }}>Contact me</button>
            </div>
          )}
        </div>
      )}

      {/* ABOUT / CONTACT OVERLAY */}
      {overlayIsOpen && !showLoader && (
        <div onClick={closeOverlay} style={{
          position: 'absolute', inset: 0, zIndex: 35,
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '20vh', left: '50%', transform: 'translateX(-50%)', width: 'min(90vw, 700px)', textAlign: 'left' }}>
            {overlaySection === 'about' && (
              <>
                <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 600 }}><TypeLine text="About me" /></h1>
                <p style={{ margin: '0 0 8px', fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.6 }}>
                  I&apos;m a 3D artist focused on character-driven work, digital fashion, and playful environments. This gallery is a curated selection of personal pieces, collaborations, and client projects.
                </p>
                <p style={{ margin: 0, fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.6 }}>
                  I love combining technical 3D workflows with strong art direction, making work that feels tactile and cinematic even when it&apos;s fully digital.
                </p>
              </>
            )}
            {overlaySection === 'contact' && (
              <>
                <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 600 }}><TypeLine text="Contact me" /></h1>
                <p style={{ margin: '0 0 8px', fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.6 }}>For commissions, collaborations, or studio work:</p>
                <p style={{ margin: '0 0 6px', fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.6 }}>
                  Email: <a href="mailto:jake.w.leong@gmail.com" style={{ color: '#aad4ff', textDecoration: 'underline' }}>jake.w.leong@gmail.com</a>
                </p>
                <p style={{ margin: '0 0 6px', fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.6 }}>
                  Instagram: <a href="https://www.instagram.com/jake__leong/" target="_blank" rel="noreferrer" style={{ color: '#aad4ff', textDecoration: 'underline' }}>@jake__leong</a>
                </p>
                <p style={{ margin: 0, fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.6 }}>
                  I&apos;m open to freelance, long-term collaborations, and creative direction roles.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* MEDIA CAROUSEL */}
      {mediaOverlayOpen && activeHasMedia && !showLoader && (
        <MediaCarouselOverlay items={activeArtwork.detailMedia} index={mediaIndex} setIndex={setMediaIndex} onClose={() => setMediaOverlayOpen(false)} />
      )}

      {/* TAP HINT */}
      {!showLoader && !overlayIsOpen && !mediaOverlayOpen && !activeArtwork && !hasTappedArtwork && (
        <div style={{
          position: 'absolute', bottom: '20vh', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          padding: '8px 16px', borderRadius: 999, background: 'rgba(0, 0, 0, 0.75)', color: '#fff',
          fontFamily: 'system-ui', fontSize: isMobile ? 'clamp(12px, 3.4vw, 14px)' : 'clamp(12px, 1.2vw, 14px)',
          animation: 'scrollHintPulse 1.75s ease-in-out infinite', whiteSpace: 'nowrap',
        }}>
          Tap an artwork to inspect
        </div>
      )}

      {/* DESKTOP ARROW CONTROLS */}
      {!isMobile && !showLoader && !overlayIsOpen && !mediaOverlayOpen && (
        <>
          <button type="button" onMouseDown={() => setMoveDir(-1)} onMouseUp={() => setMoveDir(0)} onMouseLeave={() => setMoveDir(0)}
            style={{ position: 'absolute', top: '50%', left: 24, transform: 'translateY(-50%)', zIndex: 25, width: 40, height: 40, borderRadius: 999, border: 'none', background: 'rgba(0,0,0,0.75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}
            aria-label="Walk left">‹</button>
          <button type="button" onMouseDown={() => setMoveDir(1)} onMouseUp={() => setMoveDir(0)} onMouseLeave={() => setMoveDir(0)}
            style={{ position: 'absolute', top: '50%', right: 24, transform: 'translateY(-50%)', zIndex: 25, width: 40, height: 40, borderRadius: 999, border: 'none', background: 'rgba(0,0,0,0.75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}
            aria-label="Walk right">›</button>
        </>
      )}

      {/* INSPECT TEXT OVERLAY */}
      {activeArtwork && !showLoader && !overlayIsOpen && (
        <div style={{
          position: 'absolute', top: '15vh', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          textAlign: 'center', color: '#000', fontFamily: 'system-ui', pointerEvents: 'none', padding: '0 16px', maxWidth: 'min(90vw, 900px)',
        }}>
          {toLines(activeArtwork.heading).map((line, i, arr) => (
            <h1 key={`heading-${i}`} style={{ margin: i === 0 ? 0 : '0.25em 0 0', marginBottom: i === arr.length - 1 ? 8 : 0, fontWeight: 700, fontSize: 'clamp(22px, 4vw, 36px)', lineHeight: 1.1 }}>
              <TypeLine text={String(line)} />
            </h1>
          ))}
          {toLines(activeArtwork.subheading).map((line, i, arr) => (
            <h2 key={`sub-${i}`} style={{ margin: i === 0 ? 0 : '0.15em 0 0', marginBottom: i === arr.length - 1 ? 12 : 0, fontWeight: 400, fontSize: 'clamp(14px, 2.3vw, 20px)', lineHeight: 1.3 }}>
              <TypeLine text={String(line)} />
            </h2>
          ))}
          {toLines(activeArtwork.body).map((line, i) => {
            if (line && typeof line === 'object' && line.url) {
              return (
                <p key={`body-${i}`} style={{ margin: i === 0 ? 0 : '0.2em 0 0', fontSize: 'clamp(12px, 2vw, 18px)', lineHeight: 1.4 }}>
                  <a href={line.url} target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'underline', pointerEvents: 'auto' }}>
                    <TypeLine text={line.text || line.url} />
                  </a>
                </p>
              );
            }
            return (
              <p key={`body-${i}`} style={{ margin: i === 0 ? 0 : '0.2em 0 0', fontSize: 'clamp(12px, 2vw, 18px)', lineHeight: 1.4 }}>
                <TypeLine text={String(line)} />
              </p>
            );
          })}
          {activeHasMedia && (
            <div style={{ marginTop: 16, pointerEvents: 'auto' }}>
              <button type="button" onClick={() => { setMediaIndex(0); setMediaOverlayOpen(true); }}
                style={{ padding: '10px 20px', borderRadius: 999, border: '1px solid #000', background: '#000', color: '#fff', fontSize: 'clamp(12px, 1.8vw, 16px)', cursor: 'pointer', fontFamily: 'system-ui' }}>
                View work
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3D CANVAS */}
      <Canvas
        dpr={isLowPower ? [1, 1.25] : [1, 1.5]}
        shadows
        camera={{ fov: 45, position: [0, 1.5, 8] }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ScrollControls pages={isMobile ? 8.5 : 10} damping={isMobile ? 0.06 : 0.15}>
          <Suspense fallback={null}>
            {!warmupReady && <AssetWarmup onReady={() => setWarmupReady(true)} />}
            <Experience
              onArtworkChange={handleArtworkChange}
              autoFocusFirst={false}
              isLowPower={isLowPower}
              onScrollContainerReady={setScrollContainer}
            />
          </Suspense>
        </ScrollControls>
      </Canvas>

      {/* CSS KEYFRAMES */}
      <style>{`
        @keyframes scrollHintPulse {
          0% { opacity: 0; transform: translate(-50%, 4px); }
          25% { opacity: 1; transform: translate(-50%, 0); }
          75% { opacity: 1; transform: translate(-50%, -4px); }
          100% { opacity: 0; transform: translate(-50%, 0); }
        }
        @keyframes walkerBob {
          0% { transform: translateY(3px); opacity: 0.8; }
          50% { transform: translateY(-3px); opacity: 1; }
          100% { transform: translateY(3px); opacity: 0.8; }
        }
        @keyframes carouselSlide {
          0% { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}