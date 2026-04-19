/**
 * @file CalibrationControlPanel.tsx
 * @purpose Control panel UI for calibration session management (start/stop/mark)
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Trial presets from test plan (FASE 2) ──────────────────────────

interface TrialPreset {
  trial: number;
  note: string;
  label: string;
  desc: string;
}

const TRIAL_PRESETS: Record<string, TrialPreset[]> = {
  A: [
    {
      trial: 1,
      note: 'ambient_baseline_5min',
      label: '1. Baseline',
      desc: 'Rekam derau lingkungan tanpa gangguan'
    }
  ],
  B: [
    {
      trial: 1,
      note: 'pukulan_tangan_tengah',
      label: '1. Pukulan Tengah',
      desc: 'Pukulan tangan tengah pintu'
    },
    {
      trial: 2,
      note: 'pukulan_tangan_pinggir',
      label: '2. Pukulan Pinggir',
      desc: 'Pukulan tangan pinggir pintu'
    },
    {
      trial: 3,
      note: 'senggolan_bahu',
      label: '3. Senggolan Bahu',
      desc: 'Senggolan bahu seperti orang lewat'
    },
    {
      trial: 4,
      note: 'tendangan_kuat',
      label: '4. Tendangan Kuat',
      desc: 'Tendangan kuat pada pintu'
    },
    {
      trial: 5,
      note: 'tendangan_ringan',
      label: '5. Tendangan Ringan',
      desc: 'Tendangan ringan bawah pintu'
    },
    {
      trial: 6,
      note: 'pukulan_keras',
      label: '6. Pukulan Keras',
      desc: 'Pukulan tangan keras 1x'
    },
    {
      trial: 7,
      note: 'ketukan_jari',
      label: '7. Ketukan Jari',
      desc: 'Ketukan jari keras 1x'
    }
  ],
  C: [
    {
      trial: 1,
      note: 'sela_kusen_kanan',
      label: '1. Sela Kusen Kanan',
      desc: 'Pemahatan sela kusen kanan'
    },
    {
      trial: 2,
      note: 'sela_bawah_pintu',
      label: '2. Sela Bawah Pintu',
      desc: 'Pemahatan sela bawah pintu'
    },
    {
      trial: 3,
      note: 'sela_kusen_kiri',
      label: '3. Sela Kusen Kiri',
      desc: 'Pemahatan sela kusen kiri'
    },
    {
      trial: 4,
      note: 'sela_kusen_atas',
      label: '4. Sela Kusen Atas',
      desc: 'Pemahatan sela kusen atas'
    },
    {
      trial: 5,
      note: 'kusen_kanan',
      label: '5. Kusen Kanan',
      desc: 'Pemahatan kusen kanan'
    },
    {
      trial: 6,
      note: 'kusen_kiri',
      label: '6. Kusen Kiri',
      desc: 'Pemahatan kusen kiri'
    }
  ]
};

const SESSION_DESCRIPTIONS: Record<string, string> = {
  A: 'Ambient Noise — Derau lingkungan, pintu tertutup',
  B: 'Ramming — Pendobrakan (hantaman kuat berulang)',
  C: 'Chiseling — Pemahatan repetitif (obeng/pahat)'
};

// ── Audio cue system (#7) ──────────────────────────────────────────

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
  const [activeSession, setActiveSession] = useState('B');
  const [loading, setLoading] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState('');
  const [completedTrials, setCompletedTrials] = useState<Set<string>>(
    new Set()
  );
  const [manualNote, setManualNote] = useState('');
  const [manualTrial, setManualTrial] = useState(1);
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

  // Quick-action: SET_SESSION → START in one tap (#5)
  const quickStart = async (session: string, trial: number, note: string) => {
    if (!deviceId) {
      setLastMessage('✗ Device ID is required');
      return;
    }
    const key = `${session}-${trial}`;
    setLoading(key);
    try {
      await sendCommand(deviceId, 'SET_SESSION', { session, trial, note });
      await sendCommand(deviceId, 'START');
      setLastMessage(`✓ ${session}/${trial} started — ${note}`);
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`✗ ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const sendStop = async () => {
    setLoading('STOP');
    try {
      await sendCommand(deviceId, 'STOP');
      setLastMessage('✓ Recording stopped');
      audio.playStop();
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`✗ ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const sendMark = async (label: string) => {
    setLoading('MARK');
    try {
      await sendCommand(deviceId, 'MARK', { label });
      setLastMessage(`✓ Marker: ${label}`);
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`✗ ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const sendRecalibrate = async () => {
    setLoading('RECAL');
    try {
      await sendCommand(deviceId, 'RECAL');
      setLastMessage('✓ Baseline recalibrated');
      onCommandSent?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLastMessage(`✗ ${msg}`);
      audio.playError();
    } finally {
      setLoading(null);
    }
  };

  const markTrialDone = (session: string, trial: number) => {
    setCompletedTrials((prev) => new Set(prev).add(`${session}-${trial}`));
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
            {loading === 'STOP' ? 'Stopping...' : '⏹ STOP'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status message */}
        {lastMessage && (
          <div
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              lastMessage.startsWith('✓')
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
                <div className="text-4xl sm:text-5xl font-black">⏱</div>
                <div className="text-sm font-semibold mt-1">
                  Hitung mundur — Jangan sentuh pintu!
                </div>
              </>
            )}
            {deviceCalState === 'CALIBRATING' && (
              <>
                <div className="text-base sm:text-lg font-bold">
                  📐 Kalibrasi Baseline...
                </div>
                <div className="text-sm mt-1">
                  Sensor mengukur kondisi diam — Jangan sentuh pintu!
                </div>
              </>
            )}
            {deviceCalState === 'RECORDING' && (
              <>
                <div className="text-2xl sm:text-3xl font-black">🟢 MULAI!</div>
                <div className="text-sm font-semibold mt-1">
                  Lakukan simulasi sekarang
                </div>
              </>
            )}
            {deviceCalState === 'PAUSED' && (
              <>
                <div className="text-base sm:text-lg font-bold">⏸ PAUSED</div>
                <div className="text-sm mt-1">
                  Recording dijeda — pintu terbuka
                </div>
              </>
            )}
          </div>
        )}

        {/* Session tabs with trial preset buttons (#5, #6, #8) */}
        <Tabs value={activeSession} onValueChange={setActiveSession}>
          <TabsList className="w-full">
            <TabsTrigger value="A" className="flex-1">
              <span className="sm:hidden">A</span>
              <span className="hidden sm:inline">A — Ambient</span>
            </TabsTrigger>
            <TabsTrigger value="B" className="flex-1">
              <span className="sm:hidden">B</span>
              <span className="hidden sm:inline">B — Ramming</span>
            </TabsTrigger>
            <TabsTrigger value="C" className="flex-1">
              <span className="sm:hidden">C</span>
              <span className="hidden sm:inline">C — Chisel</span>
            </TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground mt-1">
            {SESSION_DESCRIPTIONS[activeSession]}
          </p>

          {(['A', 'B', 'C'] as const).map((sess) => (
            <TabsContent key={sess} value={sess} className="space-y-3 mt-3">
              {/* Large touch-friendly preset grid (#8) */}
              <div
                className={`grid gap-2 ${sess === 'A' ? 'grid-cols-1' : 'grid-cols-2'}`}
              >
                {TRIAL_PRESETS[sess].map((preset) => {
                  const key = `${sess}-${preset.trial}`;
                  const isCompleted = completedTrials.has(key);
                  const isLoading = loading === key;
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        quickStart(sess, preset.trial, preset.note)
                      }
                      disabled={loading !== null}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all min-h-[72px] disabled:opacity-50 ${
                        isLoading
                          ? 'animate-pulse border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : isCompleted
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 opacity-70'
                            : 'border-border hover:border-foreground/50 hover:bg-accent active:scale-[0.98]'
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {preset.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {preset.desc}
                      </div>
                      {isCompleted && (
                        <Badge
                          variant="success"
                          className="absolute top-2 right-2 text-[10px]"
                        >
                          Done
                        </Badge>
                      )}
                      {isLoading && (
                        <span className="absolute top-2 right-2 text-xs animate-pulse">
                          Starting...
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick mark-done buttons */}
              <div className="flex flex-wrap gap-1">
                {TRIAL_PRESETS[sess].map((preset) => {
                  const key = `${sess}-${preset.trial}`;
                  const isCompleted = completedTrials.has(key);
                  return (
                    <Button
                      key={`done-${key}`}
                      variant={isCompleted ? 'default' : 'neutral'}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => markTrialDone(sess, preset.trial)}
                    >
                      {isCompleted ? `✓ T${preset.trial}` : `T${preset.trial}`}
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Manual control (collapsible fallback) */}
        <details className="border rounded-lg p-3">
          <summary className="text-sm font-medium cursor-pointer">
            Manual Control &amp; Markers
          </summary>
          <div className="space-y-3 mt-3">
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
                Set + Start Manual
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
        </details>
      </CardContent>
    </Card>
  );
}
