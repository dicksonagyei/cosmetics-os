import { useEffect, useRef, useState, useCallback } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxKeyIntervalMs?: number; // Threshold between keystrokes for hardware barcode gun (default: 35ms)
  minBarcodeLength?: number; // Minimum length for valid barcode (default: 3)
  enableAudioFeedback?: boolean;
}

export function useBarcodeScanner({
  onScan,
  maxKeyIntervalMs = 40,
  minBarcodeLength = 3,
  enableAudioFeedback = true,
}: UseBarcodeScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const isGunTypingRef = useRef<boolean>(false);
  const timeoutRef = useRef<number | null>(null);

  // Play synthetic scanner beep on successful barcode scan
  const playBeep = useCallback((success: boolean = true) => {
    if (!enableAudioFeedback || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note - high crisp beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context might fail if user has not interacted with DOM yet
    }
  }, [enableAudioFeedback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = performance.now();
      const interval = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Ignore modifier keys
      if (
        event.key === 'Shift' ||
        event.key === 'Control' ||
        event.key === 'Alt' ||
        event.key === 'Meta' ||
        event.key === 'CapsLock' ||
        event.key === 'Tab'
      ) {
        return;
      }

      // Check if user is currently typing in a text input or textarea
      const target = event.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Barcode scanners type very quickly (<35-40ms between keys)
      if (interval <= maxKeyIntervalMs) {
        isGunTypingRef.current = true;
        setIsScanning(true);
      } else {
        // If slow typing occurred, reset buffer
        bufferRef.current = [];
        isGunTypingRef.current = false;
        setIsScanning(false);
      }

      // If scanner fires 'Enter' to terminate barcode
      if (event.key === 'Enter') {
        const fullBarcode = bufferRef.current.join('').trim();

        if (fullBarcode.length >= minBarcodeLength && isGunTypingRef.current) {
          // Prevent form submit or newline if in input
          event.preventDefault();
          event.stopPropagation();

          playBeep(true);
          setLastScanned(fullBarcode);
          setScanCount((c) => c + 1);
          onScan(fullBarcode);
        }

        // Reset buffer
        bufferRef.current = [];
        isGunTypingRef.current = false;
        setIsScanning(false);
        return;
      }

      // Only accumulate single character keys (letters, digits, symbols)
      if (event.key.length === 1) {
        // If an input is focused and this is human typing (interval > maxKeyIntervalMs), do not intercept
        if (isInputFocused && !isGunTypingRef.current && bufferRef.current.length === 0) {
          return;
        }

        bufferRef.current.push(event.key);

        // Schedule auto-reset buffer if no subsequent keys arrive in 120ms
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          bufferRef.current = [];
          isGunTypingRef.current = false;
          setIsScanning(false);
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [maxKeyIntervalMs, minBarcodeLength, onScan, playBeep]);

  // Method to manually simulate a hardware scan (useful for dev & testing)
  const simulateScan = useCallback((barcode: string) => {
    playBeep(true);
    setLastScanned(barcode);
    setScanCount((c) => c + 1);
    onScan(barcode);
  }, [onScan, playBeep]);

  return {
    isScanning,
    lastScanned,
    scanCount,
    simulateScan,
    playBeep,
  };
}
