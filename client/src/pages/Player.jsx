import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MIN_SPEED = 1;
const MAX_SPEED = 10;

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [showControls, setShowControls] = useState(true);

  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const isPlayingRef = useRef(false);
  const speedRef = useRef(3);
  const hideControlsTimer = useRef(null);

  // Load transcript
  useEffect(() => {
    axios
      .get(`/api/transcripts/${id}`)
      .then((res) => setTranscript(res.data))
      .catch(() => setError('Failed to load transcript.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Start at the bottom when content loads (original behaviour: start scrolled to bottom)
  useEffect(() => {
    if (transcript && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Auto-hide controls while playing
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    if (isPlayingRef.current) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, []);

  // RAF scroll loop — scrolls UP (decreasing scrollTop), matching the original jQuery animate behaviour
  const animate = useCallback(() => {
    if (!scrollRef.current || !isPlayingRef.current) return;

    const el = scrollRef.current;
    const nextTop = el.scrollTop - speedRef.current * 0.5;

    if (nextTop <= 0) {
      el.scrollTop = 0;
      isPlayingRef.current = false;
      setIsPlaying(false);
      setShowControls(true);
      clearTimeout(hideControlsTimer.current);
      return;
    }

    el.scrollTop = nextTop;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    resetHideTimer();
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, resetHideTimer]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [play, pause]);

  const restart = useCallback(() => {
    pause();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pause]);

  const jumpToEnd = useCallback(() => {
    pause();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pause]);

  const changeSpeed = useCallback((delta) => {
    setSpeed((prev) => {
      const next = Math.max(MIN_SPEED, Math.min(MAX_SPEED, prev + delta));
      speedRef.current = next;
      return next;
    });
  }, []);

  // Keyboard controls — same keys as the original
  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.keyCode) {
        case 32: // Space
        case 13: // Enter
          e.preventDefault();
          togglePlay();
          break;
        case 37: // ←  restart
          e.preventDefault();
          restart();
          break;
        case 39: // →  jump to end
          e.preventDefault();
          jumpToEnd();
          break;
        case 38: // ↑  speed up
          e.preventDefault();
          changeSpeed(1);
          break;
        case 40: // ↓  speed down
          e.preventDefault();
          changeSpeed(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay, restart, jumpToEnd, changeSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(hideControlsTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin opacity-30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <p className="text-white/50 text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Back to scripts
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/*
        Scrollable container.
        The inner text div has scaleY(-1) applied — this flips the text upside-down
        so it reads correctly when reflected in the teleprompter mirror.
        Scrolling runs from bottom → top (decreasing scrollTop), matching the original.
      */}
      <div
        ref={scrollRef}
        className="w-full h-full overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <div
          style={{
            transform: 'scaleY(-1)',
            paddingTop: '100vh',
            paddingBottom: '100vh',
            paddingLeft: '8vw',
            paddingRight: '8vw',
          }}
        >
          <p
            style={{
              fontSize: '30px',
              lineHeight: '200%',
              color: '#ffffff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {transcript.content}
          </p>
        </div>
      </div>

      {/* Controls overlay — fades out while playing */}
      <div
        className="absolute inset-x-0 bottom-0 transition-opacity duration-500"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Gradient backdrop */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-6 px-6">
          <div className="max-w-2xl mx-auto">
            {/* Title */}
            <p className="text-center text-white/30 text-xs mb-4 tracking-wider uppercase truncate">
              {transcript.title}
            </p>

            {/* Main controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Back home */}
              <button
                onClick={() => navigate('/')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                title="Back to scripts"
              >
                <HomeIcon />
              </button>

              {/* Restart */}
              <button
                onClick={restart}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                title="Restart (←)"
              >
                <RestartIcon />
              </button>

              {/* Speed down */}
              <button
                onClick={() => changeSpeed(-1)}
                disabled={speed <= MIN_SPEED}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-all"
                title="Slower (↓)"
              >
                <MinusIcon />
              </button>

              {/* Speed badge */}
              <div className="flex flex-col items-center min-w-[52px]">
                <span className="text-white text-xl font-bold leading-none">{speed}</span>
                <span className="text-white/30 text-[10px] mt-0.5 uppercase tracking-wider">speed</span>
              </div>

              {/* Speed up */}
              <button
                onClick={() => changeSpeed(1)}
                disabled={speed >= MAX_SPEED}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-all"
                title="Faster (↑)"
              >
                <PlusIcon />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all flex items-center gap-2"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              {/* Jump to end */}
              <button
                onClick={jumpToEnd}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                title="Jump to end (→)"
              >
                <EndIcon />
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center justify-center gap-4 mt-5">
              {[
                ['Space', 'Play/Pause'],
                ['←', 'Restart'],
                ['→', 'End'],
                ['↑ ↓', 'Speed'],
              ].map(([key, label]) => (
                <span key={key} className="flex items-center gap-1.5 text-white/20 text-[10px]">
                  <kbd className="bg-white/10 rounded px-1.5 py-0.5 font-mono text-white/40">{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M4 10a6 6 0 106-6H7M7 2L4 4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EndIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M5 4l7 6-7 6M14 4v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 18v-7h6v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
