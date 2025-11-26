// src/App.jsx
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, useProgress, Preload } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import Experience from './Experience';
import Lottie from 'lottie-react';
import scrollThumbAnim from './animations/scroll-thumb.json';


// Small helper: typewriter effect for one line of text
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

// Normalize a field (string | string[] | mixed array) → array of lines
function toLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split('\n');
}

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

/**
 * Fullscreen overlay for media carousel
 * - items: [{ type: 'image' | 'video', src, alt?, orientation? }]
 */
function MediaCarouselOverlay({ items, index, setIndex, onClose }) {
  const dragState = useRef({
    active: false,
    startX: 0,
  });

  const isMobile = useIsMobile();

  if (!items || items.length === 0) return null;

  const current = items[index] || items[0];
  const isVideo = current.type === 'video';
  const orientation = current.orientation || 'landscape'; // default videos to landscape

  const isPortraitVideo = isVideo && orientation === 'portrait';
  const isLandscapeVideo = isVideo && orientation === 'landscape';

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
  };

  const getClientX = (e) => {
    if (e.clientX != null) return e.clientX;
    if (e.touches && e.touches[0]) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches[0])
      return e.changedTouches[0].clientX;
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

  const handleOverlayClick = () => {
    onClose();
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

const maxMediaHeight = isMobile ? '70vh' : '80vh';

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // always center content
        paddingTop: isMobile ? '6vh' : 0, // shift up a bit on mobile
        paddingBottom: isMobile ? '10vh' : 0, // room for Safari bottom bar
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Inner content – clicking here should NOT close overlay */}
      <div
        onClick={stopPropagation}
        style={{
          width: isMobile ? '100vw' : 'min(90vw, 1000px)',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? 0 : 16,
          padding: isMobile ? 0 : '0 12px',
          position: 'relative',
        }}
      >
        {/* Close button – plain white X */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
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
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Left arrow (desktop only – side arrow) */}
        {!isMobile && items.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              padding: 8,
            }}
            aria-label="Previous"
          >
            ‹
          </button>
        )}

        {/* Media – shared wrapper */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={(e) => handlePointerDown(e.nativeEvent)}
          onTouchMove={(e) => handlePointerMove(e.nativeEvent)}
          onTouchEnd={(e) => handlePointerUp(e.nativeEvent)}
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
  key={index}
  style={{
    // For media wrapper
    width: isMobile
      ? '100%'                                   // full width on mobile
      : isVideo
      ? 'min(100%, 960px)'                       // nice wide frame on desktop for video
      : 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: maxMediaHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'carouselSlide 0.25s ease',
    ...(isPortraitVideo
      ? { aspectRatio: '9 / 16' }                // tall frame for vertical video
      : isLandscapeVideo
      ? { aspectRatio: '16 / 9' }                // wide frame for horizontal video
      : {}),
  }}
>
  {isVideo ? (
    <iframe
      title={current.alt || 'Video'}
      src={current.src}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',                          // fill the aspect-ratio box
        display: 'block',
        background: 'black',
      }}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <img
      src={current.src}
      alt={current.alt || ''}
      style={{
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: maxMediaHeight,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )}
</div>


          {/* Overlay arrows on mobile */}
          {isMobile && items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                style={{
                  position: 'absolute',
                  left: 12,
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
                }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                style={{
                  position: 'absolute',
                  right: 12,
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
                }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Right arrow (desktop only – side arrow) */}
        {!isMobile && items.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              padding: 8,
            }}
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>

      {/* Dots underneath, centred */}
      {items.length > 1 && (
        <div
          onClick={stopPropagation}
          style={{
            position: 'absolute',
            bottom: '12vh',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
          }}
        >
          {items.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background:
                  i === index ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeArtwork, setActiveArtwork] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);

  // drei loading progress
  const { progress } = useProgress();
  const [showLoader, setShowLoader] = useState(true);

  // NEW: mobile scroll prompt overlay
  const [showScrollOverlay, setShowScrollOverlay] = useState(false);
  const isMobile = useIsMobile();

  // Small dropdown under hamburger
  const [menuOpen, setMenuOpen] = useState(false);
  // Full-screen overlay section: 'about' | 'contact' | null
  const [overlaySection, setOverlaySection] = useState(null);
  const overlayIsOpen = overlaySection !== null;

  // Media carousel overlay
  const [mediaOverlayOpen, setMediaOverlayOpen] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  const activeHasMedia =
    !!activeArtwork &&
    Array.isArray(activeArtwork.detailMedia) &&
    activeArtwork.detailMedia.length > 0;

  // When loading finishes, fade out loader
  useEffect(() => {
    if (progress === 100) {
      const t = setTimeout(() => setShowLoader(false), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);

  // After loading finishes on mobile, show scroll prompt overlay
  useEffect(() => {
    if (!isMobile) {
      setShowScrollOverlay(false);
      return;
    }
    if (!showLoader && progress === 100) {
      setShowScrollOverlay(true);
    }
  }, [isMobile, showLoader, progress]);

  // Floating hint + scroll overlay disappear on first scroll/touch
  useEffect(() => {
    const handleScrollLike = () => {
      setHasInteracted(true);
      setShowScrollOverlay(false);
    };

    window.addEventListener('wheel', handleScrollLike, { passive: true });
    window.addEventListener('touchmove', handleScrollLike, { passive: true });
    window.addEventListener('touchstart', handleScrollLike, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleScrollLike);
      window.removeEventListener('touchmove', handleScrollLike);
      window.removeEventListener('touchstart', handleScrollLike);
    };
  }, []);

  // Low-power heuristic
  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;
    const saveData = navigator.connection?.saveData;

    const guessLowPower = saveData === true || cores <= 4 || dpr > 2.5;

    setIsLowPower(guessLowPower);
  }, []);

  // Close media overlay when active artwork changes or About/Contact overlay opens
  useEffect(() => {
    setMediaOverlayOpen(false);
    setMediaIndex(0);
  }, [activeArtwork, overlayIsOpen]);

  // Toggle the hamburger / X icon
  const toggleHamburger = () => {
    if (overlayIsOpen) {
      setOverlaySection(null);
      setMenuOpen(true);
    } else {
      setMenuOpen((prev) => !prev);
    }
  };

  // Open About/Contact overlay from dropdown
  const openOverlay = (section) => {
    setOverlaySection(section); // 'about' | 'contact'
    setMenuOpen(true);
  };

  const closeOverlay = () => {
    setOverlaySection(null);
  };

  // Icon is "open" (X) if dropdown or overlay is active
  const iconOpen = menuOpen || overlayIsOpen;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#111',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ================================
          FULLSCREEN LOADING OVERLAY
         ================================ */}
      {showLoader && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 1)',
            backdropFilter: 'blur(22px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            transition: 'opacity 0.5s ease',
            opacity: progress === 100 ? 0 : 1,
            pointerEvents: 'auto',
          }}
        >
          <img
            src="/loading-walk.gif"
            alt="loading"
            style={{
              width: 'clamp(80px, 15vw, 140px)',
              height: 'auto',
              marginBottom: '20px',
              animation: 'walkerBob 1.2s ease-in-out infinite',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          <div
            style={{
              width: 'min(60vw, 220px)',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.16)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#000000',
                transformOrigin: 'left center',
                transition: 'width 0.18s ease-out',
              }}
            />
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '13px',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              opacity: 0.75,
            }}
          >
            {Math.floor(progress)}%
          </div>
        </div>
      )}

      {/* ================================
          MOBILE SCROLL PROMPT OVERLAY
         ================================ */}
      {isMobile && !showLoader && !overlayIsOpen && showScrollOverlay && (
 <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 80,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 10, 10, 0.32)',
      backdropFilter: 'blur(18px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
      pointerEvents: 'none', // let scroll pass through
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '260px',
        gap: 16,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Centered Lottie finger */}
      <Lottie
        animationData={scrollThumbAnim}
        loop
        autoplay
        style={{
          width: 220,      // make it nice and big
          height: 'auto',
        }}
      />

      {/* White text, same font as rest of UI */}
      <p
        style={{
          margin: 0,
          color: '#fff',
          fontSize: 16,
          letterSpacing: '0.12em',
          textAlign: 'center',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          opacity: 0.95,
        }}
      >
        Scroll to view gallery
      </p>
    </div>
  </div>
)}

      {/* ================================
          HAMBURGER / X ICON (NO BG)
         ================================ */}
      {!showLoader && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            zIndex: 40,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              toggleHamburger();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              width: 50,
              height: 50,
              position: 'relative',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              overflow: 'visible',
            }}
          >
            {/* top line */}
            <span
              style={{
                position: 'absolute',
                left: 6,
                right: 6,
                height: 2,
                borderRadius: 999,
                background: '#000',
                transition:
                  'transform 0.2s ease, top 0.2s ease, opacity 0.2s ease',
                top: iconOpen ? 15 : 8,
                transform: iconOpen ? 'rotate(45deg)' : 'none',
              }}
            />
            {/* middle line */}
            <span
              style={{
                position: 'absolute',
                left: 6,
                right: 6,
                height: 2,
                borderRadius: 999,
                background: '#000',
                transition: 'opacity 0.2s ease',
                top: 15,
                opacity: iconOpen ? 0 : 1,
              }}
            />
            {/* bottom line */}
            <span
              style={{
                position: 'absolute',
                left: 6,
                right: 6,
                height: 2,
                borderRadius: 999,
                background: '#000',
                transition:
                  'transform 0.2s ease, top 0.2s ease, opacity 0.2s ease',
                top: iconOpen ? 15 : 22,
                transform: iconOpen ? 'rotate(-45deg)' : 'none',
              }}
            />
          </button>

          {/* Dropdown options directly under the hamburger */}
          {menuOpen && !overlayIsOpen && (
            <div
              style={{
                marginTop: 8,
                padding: 0,
                color: '#000',
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 22,
                fontWeight: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => openOverlay('about')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  color: '#000',
                  textAlign: 'left',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                About me
              </button>

              <button
                type="button"
                onClick={() => openOverlay('contact')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  color: '#000',
                  textAlign: 'left',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                Contact me
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================
          FROSTED OVERLAY FOR ABOUT / CONTACT
         ================================ */}
      {overlayIsOpen && !showLoader && (
        <div
          onClick={closeOverlay}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 35,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#fff',
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            pointerEvents: 'auto',
          }}
        >
          {/* Text content (clicks here don’t close overlay) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '20vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(90vw, 700px)',
              textAlign: 'left',
            }}
          >
            {overlaySection === 'about' && (
              <>
                <h1
                  style={{
                    margin: '0 0 12px',
                    fontSize: 'clamp(22px, 4vw, 32px)',
                    fontWeight: 600,
                  }}
                >
                  About me
                </h1>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: 1.6,
                  }}
                >
                  I&apos;m a 3D artist focused on character-driven work,
                  digital fashion, and playful environments. This gallery is a
                  curated selection of personal pieces, collaborations, and
                  client projects.
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: 1.6,
                  }}
                >
                  I love combining technical 3D workflows with strong art
                  direction, making work that feels tactile and cinematic even
                  when it&apos;s fully digital.
                </p>
              </>
            )}

            {overlaySection === 'contact' && (
              <>
                <h1
                  style={{
                    margin: '0 0 12px',
                    fontSize: 'clamp(22px, 4vw, 32px)',
                    fontWeight: 600,
                  }}
                >
                  Contact me
                </h1>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: 1.6,
                  }}
                >
                  For commissions, collaborations, or studio work:
                </p>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: 1.6,
                  }}
                >
                  Email:{' '}
                  <a
                    href="mailto:jake.w.leong@gmail.com"
                    style={{
                      color: '#aad4ff',
                      textDecoration: 'underline',
                    }}
                  >
                    jake.w.leong@gmail.com
                  </a>
                </p>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: 1.6,
                  }}
                >
                  Instagram:{' '}
                  <a
                    href="https://www.instagram.com/jake__leong/"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#aad4ff',
                      textDecoration: 'underline',
                    }}
                  >
                    @jake__leong
                  </a>
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    lineHeight: 1.6,
                  }}
                >
                  I&apos;m open to freelance, long-term collaborations, and
                  creative direction roles.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================================
          MEDIA CAROUSEL OVERLAY
         ================================ */}
      {mediaOverlayOpen && activeHasMedia && !showLoader && (
        <MediaCarouselOverlay
          items={activeArtwork.detailMedia}
          index={mediaIndex}
          setIndex={setMediaIndex}
          onClose={() => setMediaOverlayOpen(false)}
        />
      )}

      {/* Floating hint (only when not loading, no overlay, and before first scroll) */}
      {!hasInteracted && !showLoader && !overlayIsOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '12vh',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            textAlign: 'center',
            color: '#000',
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 'clamp(12px, 1.7vw, 16px)',
            pointerEvents: 'none',
            animation: 'scrollHintPulse 1.75s ease-in-out infinite',
            padding: '0 12px',
          }}
        >
          <div>Scroll up / down to walk</div>
          <div>Click on an artwork to inspect</div>
          <div style={{ fontSize: '1.4em', marginTop: 2 }}>⇵</div>
        </div>
      )}

      {/* Inspect-mode text overlay (hidden while loading or overlay open) */}
      {activeArtwork && !showLoader && !overlayIsOpen && (
        <div
          style={{
            position: 'absolute',
            top: '15vh',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            textAlign: 'center',
            color: '#000',
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            pointerEvents: 'none',
            padding: '0 16px',
            maxWidth: 'min(90vw, 900px)',
          }}
        >
          {toLines(activeArtwork.heading).map((line, i, arr) => (
            <h1
              key={`heading-${i}`}
              style={{
                margin: i === 0 ? 0 : '0.25em 0 0',
                marginBottom: i === arr.length - 1 ? 8 : 0,
                fontWeight: 700,
                fontSize: 'clamp(22px, 4vw, 36px)',
                lineHeight: 1.1,
              }}
            >
              <TypeLine text={String(line)} />
            </h1>
          ))}

          {toLines(activeArtwork.subheading).map((line, i, arr) => (
            <h2
              key={`sub-${i}`}
              style={{
                margin: i === 0 ? 0 : '0.15em 0 0',
                marginBottom: i === arr.length - 1 ? 12 : 0,
                fontWeight: 400,
                fontSize: 'clamp(14px, 2.3vw, 20px)',
                lineHeight: 1.3,
              }}
            >
              <TypeLine text={String(line)} />
            </h2>
          ))}

          {toLines(activeArtwork.body).map((line, i) => {
            if (line && typeof line === 'object' && line.url) {
              return (
                <p
                  key={`body-${i}`}
                  style={{
                    margin: i === 0 ? 0 : '0.2em 0 0',
                    fontSize: 'clamp(12px, 2vw, 18px)',
                    lineHeight: 1.4,
                  }}
                >
                  <a
                    href={line.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#0070f3',
                      textDecoration: 'underline',
                      pointerEvents: 'auto',
                    }}
                  >
                    <TypeLine text={line.text || line.url} />
                  </a>
                </p>
              );
            }

            return (
              <p
                key={`body-${i}`}
                style={{
                  margin: i === 0 ? 0 : '0.2em 0 0',
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  lineHeight: 1.4,
                }}
              >
                <TypeLine text={String(line)} />
              </p>
            );
          })}

          {/* View work button (opens carousel) */}
          {activeHasMedia && (
            <div
              style={{
                marginTop: 16,
                pointerEvents: 'auto',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMediaIndex(0);
                  setMediaOverlayOpen(true);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  border: '1px solid #000',
                  background: '#000',
                  color: '#fff',
                  fontSize: 'clamp(12px, 1.8vw, 16px)',
                  cursor: 'pointer',
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                }}
              >
                View work
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3D Canvas */}
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
        <ScrollControls pages={8} damping={0.15}>
          <Experience
            onArtworkChange={setActiveArtwork}
            autoFocusFirst={false}
            isLowPower={isLowPower}
          />
           <Preload all />
        </ScrollControls>
      </Canvas>

      {/* CSS keyframes */}
      <style>
        {`
    @keyframes scrollHintPulse {
      0%   { opacity: 0; transform: translate(-50%, 4px); }
      25%  { opacity: 1; transform: translate(-50%, 0); }
      75%  { opacity: 1; transform: translate(-50%, -4px); }
      100% { opacity: 0; transform: translate(-50%, 0); }
    }

    @keyframes walkerBob {
      0%   { transform: translateY(3px); opacity: 0.8; }
      50%  { transform: translateY(-3px); opacity: 1; }
      100% { transform: translateY(3px); opacity: 0.8; }
    }

    @keyframes carouselSlide {
      0% {
        opacity: 0;
        transform: translateX(12px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
        `}
      </style>
    </div>
  );
}
