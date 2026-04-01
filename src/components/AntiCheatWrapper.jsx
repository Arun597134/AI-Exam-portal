import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';

const AntiCheatWrapper = ({ children, onCheatingDetected, cheatLog, setCheatLog }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const isSubmittingRef = useRef(false);

  // Expose a way for parent to signal submission
  useEffect(() => {
    window.__examSubmitting = isSubmittingRef;
    return () => { delete window.__examSubmitting; };
  }, []);

  const logIncident = (type) => {
    // Don't log if exam is being submitted
    if (isSubmittingRef.current) return;
    
    setCheatLog(prev => {
      const updated = [...prev, { type, timestamp: new Date().toISOString() }];
      if (onCheatingDetected) onCheatingDetected(updated, type);
      return updated;
    });
  };

  useEffect(() => {
    if (!isStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        logIncident('Tab switched or window minimized');
      }
    };

    const handleBlur = () => {
      if (!isSubmittingRef.current) {
        logIncident('Window lost focus');
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      logIncident('Copy/Paste attempt blocked');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // Block copy/paste
      if (e.ctrlKey && ['c', 'v', 'a', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logIncident('Keyboard shortcut blocked: Ctrl+' + e.key.toUpperCase());
      }
      // Block F11
      if (e.key === 'F11') { e.preventDefault(); }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (!isSubmittingRef.current) {
          logIncident('Exited fullscreen mode');
        }
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isStarted]); // eslint-disable-line

  const forceFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setIsStarted(true);
    } catch (err) {
      console.warn('Fullscreen not supported, starting exam anyway');
      setIsFullscreen(true);
      setIsStarted(true);
    }
  };

  if (!isStarted) {
    return (
      <div className="fullscreen-overlay">
        <ShieldAlert size={64} className="text-primary mb-4" />
        <h2 className="text-3xl font-bold mb-2">Ready to Start?</h2>
        <p className="mb-4 text-muted" style={{ maxWidth: 450, lineHeight: 1.7 }}>
          This is a <strong>proctored exam</strong>. The following rules apply:
        </p>
        <ul style={{ textAlign: 'left', maxWidth: 420, marginBottom: '1.5rem', lineHeight: 2.2, color: 'var(--text-muted)', fontSize: '0.875rem', listStyle: 'none', padding: 0 }}>
          <li>🖥️ You must stay in <strong>fullscreen mode</strong></li>
          <li>🚫 <strong>Tab switching</strong> will be recorded as a violation</li>
          <li>📋 <strong>Copy/Paste</strong> is disabled during the exam</li>
          <li>📷 Your <strong>webcam</strong> will monitor for face detection</li>
          <li>⏱️ The timer starts once you click Begin</li>
        </ul>
        <button onClick={forceFullscreen} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
          Enter Fullscreen & Begin Exam
        </button>
      </div>
    );
  }

  return (
    <>
      {!isFullscreen && (
        <div className="fullscreen-overlay">
          <ShieldAlert size={64} className="text-danger mb-4" />
          <h2 className="text-2xl font-bold mb-2">⚠️ Fullscreen Required</h2>
          <p className="mb-6 text-muted" style={{ maxWidth: 400 }}>
            You exited fullscreen. The timer is still running!
            Return immediately to continue.
          </p>
          <button onClick={forceFullscreen} style={{ padding: '0.75rem 2rem' }}>
            Return to Exam
          </button>
        </div>
      )}
      <div style={{ filter: !isFullscreen ? 'blur(10px)' : 'none', pointerEvents: !isFullscreen ? 'none' : 'auto', height: '100%' }}>
        {children}
      </div>
    </>
  );
};

export default AntiCheatWrapper;
