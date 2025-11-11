// src/App.jsx
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { useState, useEffect } from 'react';
import Experience from './Experience';

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
  if (Array.isArray(value)) return value; // can include strings OR { text, url }
  return String(value).split('\n'); // support "a\nb"
}

function App() {
  // { heading, subheading, body } while in INSPECT mode, else null
  const [activeArtwork, setActiveArtwork] = useState(null);

  // Floating hint: disappears after first scroll/touch
  const [hasInteracted, setHasInteracted] = useState(false);

  // Low-power mode flag
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    const handleScrollLike = () => {
      setHasInteracted(true);
    };

    window.addEventListener('wheel', handleScrollLike, { passive: true });
    window.addEventListener('touchmove', handleScrollLike, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleScrollLike);
      window.removeEventListener('touchmove', handleScrollLike);
    };
  }, []);

  // 🔍 Simple low-power heuristic
  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;
    const saveData = navigator.connection?.saveData;

    const guessLowPower =
      saveData === true || cores <= 4 || dpr > 2.5;

    setIsLowPower(guessLowPower);
  }, []);

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
      {/* 🔻 Floating hint (only before first scroll / touch) */}
      {!hasInteracted && (
        <div
          style={{
            position: 'absolute',
            bottom: '6vh',
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

      {/* 2D TEXT OVERLAY (inspect mode) */}
      {activeArtwork && (
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
            pointerEvents: 'none', // so scroll still exits inspect
            padding: '0 16px',
            maxWidth: 'min(90vw, 900px)',
          }}
        >
          {/* Heading */}
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

          {/* Subheading */}
          {toLines(activeArtwork.subheading).length > 0 &&
            toLines(activeArtwork.subheading).map((line, i, arr) => (
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

          {/* Body: supports strings, string[], and { text, url } objects */}
          {toLines(activeArtwork.body).length > 0 &&
            toLines(activeArtwork.body).map((line, i) => {
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
                        pointerEvents: 'auto', // clickable even though parent is none
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
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        dpr={isLowPower ? [1, 1.25] : [1, 1.5]} // slightly lower res in low power
        shadows
        camera={{ fov: 45, position: [0, 1.5, 8] }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <ScrollControls pages={5} damping={0.15}>
          {/* autoFocusFirst makes the first model "selected" on load */}
          <Experience
            onArtworkChange={setActiveArtwork}
            autoFocusFirst={true}
            isLowPower={isLowPower}
          />
        </ScrollControls>
      </Canvas>

      {/* Keyframes for the scroll hint animation */}
      <style>
        {`
          @keyframes scrollHintPulse {
            0%   { opacity: 0; transform: translate(-50%, 4px); }
            25%  { opacity: 1; transform: translate(-50%, 0); }
            75%  { opacity: 1; transform: translate(-50%, -4px); }
            100% { opacity: 0; transform: translate(-50%, 0); }
          }
        `}
      </style>
    </div>
  );
}

export default App;
