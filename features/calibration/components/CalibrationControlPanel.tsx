/**
 * @file CalibrationControlPanel.tsx
 * @purpose Control panel UI for calibration session management (mark/stop)
 * @usedBy CalibrationPage
 * @deps calibration API, Card/Button UI
 * @exports CalibrationControlPanel (default)
 * @sideEffects API calls (sendCalibrationCommand)
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { sendCommand } from '../api/calibration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SESSION_DESCRIPTIONS: Record<string, string> = {
  A: 'Ambient Noise — Derau lingkungan, pintu tertutup',
  B: 'Extreme Noise — Gangguan getaran/suara ekstrem (non-intrusi)',
  C: 'Intrusion — Simulasi intrusi atau pembongkaran paksa'
};

// ── Audio cue system ──────────────────────────────────────────────

function useAudioCues() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine') => {
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + duration
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        /* audio not available */
      }
    },
    [getCtx]
  );

  return {
    playBeep: useCallback(() => playTone(660, 0.08), [playTone]),
    playStart: useCallback(() => {
      playTone(880, 0.15);
      setTimeout(() => playTone(1100, 0.15), 180);
    }, [playTone]),
    playStop: useCallback(() => playTone(600, 0.2), [playTone]),
    playError: useCallback(() => playTone(200, 0.3, 'sawtooth'), [playTone])
  };
}

// ── Component ──────────────────────────────────────────────────────

interface Props {
  deviceId: string;
  /** Realtime calibration state from SSE (IDLE, COUNTDOWN, CALIBRATING, RECORDING, PAUSED) */
  calState: string;
  onCommandSent?: () => void;
}

export default function CalibrationControlPanel({
  deviceId,
  calState: deviceCalState,
  onCommandSent
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualTrial, setManualTrial] = useState(1);
  const [activeSession, setActiveSession] = useState('B');
  const audio = useAudioCues();

  // ── Audio cues on state transitions (driven by SSE calState prop) ──
  const prevStateRef = useRef<string>('IDLE');

  useEffect(() => {
    if (deviceCalState !== prevStateRef.current) {
      if (deviceCalState === 'RECORDING') audio.playStart();
      else if (
        deviceCalState === 'IDLE' &&
        prevStateRef.current === 'RECORDING'
      )
        audio.playStop();
      else if (deviceCalState === 'COUNTDOWN') audio.playBeep();
      prevStateRef.current = deviceCalState;
    }
  }, [deviceCalState, audio]);

  const quickStart = async (session: string, trial: number, note: string) => {
    if (!deviceId) {
      setLastMessage('[ERROR] Device ID is required');
      return;
    }
    setLoading(`${session}-${trial}`);
    try {
      await sendCommand(deviceId, 'SET_SESSION', { session, trial, note });
      await sendCommand(deviceId, 'START');
      setLastMessage(`[OK] ${session}/${trial} started — ${note}`);
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`[ERROR] ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const sendStop = async () => {
    setLoading('STOP');
    try {
      await sendCommand(deviceId, 'STOP');
      setLastMessage('[OK] Recording stopped');
      audio.playStop();
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`[ERROR] ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const sendMark = async (label: string) => {
    setLoading('MARK');
    try {
      await sendCommand(deviceId, 'MARK', { label });
      setLastMessage(`[OK] Marker: ${label}`);
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`[ERROR] ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const sendRecalibrate = async () => {
    setLoading('RECAL');
    try {
      await sendCommand(deviceId, 'RECAL');
      setLastMessage('[OK] Baseline recalibrated');
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`[ERROR] ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Calibration Control</span>
          <Button
            variant="destructive"
            onClick={sendStop}
            disabled={loading !== null}
            className="h-12 px-8 text-base font-bold"
          >
            {loading === 'STOP' ? 'Stopping...' : 'STOP'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status message */}
        {lastMessage && (
          <div
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              lastMessage.startsWith('[OK]')
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {lastMessage}
          </div>
        )}

        {/* ── Recording phase indicator (synced with device) ── */}
        {deviceCalState !== 'IDLE' && (
          <div
            className={`text-center rounded-xl p-4 sm:p-5 transition-colors ${
              deviceCalState === 'COUNTDOWN'
                ? 'bg-yellow-500 text-yellow-950 animate-pulse'
                : deviceCalState === 'CALIBRATING'
                  ? 'bg-blue-500 text-white'
                  : deviceCalState === 'RECORDING'
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white'
            }`}
          >
            {deviceCalState === 'COUNTDOWN' && (
              <>
                <div className="text-4xl sm:text-5xl font-black">--:--</div>
                <div className="text-sm font-semibold mt-1">
                  Hitung mundur — Jangan sentuh pintu!
                </div>
              </>
            )}
            {deviceCalState === 'CALIBRATING' && (
              <>
                <div className="text-base sm:text-lg font-bold">
                  Kalibrasi Baseline...
                </div>
                <div className="text-sm mt-1">
                  Sensor mengukur kondisi diam — Jangan sentuh pintu!
                </div>
              </>
            )}
            {deviceCalState === 'RECORDING' && (
              <>
                <div className="text-2xl sm:text-3xl font-black">MULAI!</div>
                <div className="text-sm font-semibold mt-1">
                  Lakukan simulasi sekarang
                </div>
              </>
            )}
            {deviceCalState === 'PAUSED' && (
              <>
                <div className="text-base sm:text-lg font-bold">PAUSED</div>
                <div className="text-sm mt-1">
                  Recording dijeda — pintu terbuka
                </div>
              </>
            )}
          </div>
        )}

        {/* Session tabs for manual control */}
        <Tabs value={activeSession} onValueChange={setActiveSession}>
          <TabsList className="w-full">
            <TabsTrigger value="A" className="flex-1">
              <span className="sm:hidden">A</span>
              <span className="hidden sm:inline">A — Ambient</span>
            </TabsTrigger>
            <TabsTrigger value="B" className="flex-1">
              <span className="sm:hidden">B</span>
              <span className="hidden sm:inline">B — Extreme Noise</span>
            </TabsTrigger>
            <TabsTrigger value="C" className="flex-1">
              <span className="sm:hidden">C</span>
              <span className="hidden sm:inline">C — Intrusion</span>
            </TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            {SESSION_DESCRIPTIONS[activeSession]}
          </p>
        </Tabs>

        {/* Manual Control & Markers */}
        <div className="border rounded-lg p-3 space-y-3">
          <p className="text-sm font-medium">Manual Control &amp; Markers ({activeSession})</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Trial #</label>
              <Input
                type="number"
                min={1}
                value={manualTrial}
                onChange={(e) =>
                  setManualTrial(parseInt(e.target.value) || 1)
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium">Note</label>
              <Input
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="custom_note"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() =>
                quickStart(
                  activeSession,
                  manualTrial,
                  manualNote || `manual_trial_${manualTrial}`
                )
              }
              disabled={loading !== null}
            >
              Set + Start
            </Button>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => sendMark(manualNote || 'mark')}
              disabled={loading !== null}
            >
              Mark
            </Button>
            <Button
              variant="neutral"
              size="sm"
              onClick={sendRecalibrate}
              disabled={loading !== null}
            >
              Recalibrate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
