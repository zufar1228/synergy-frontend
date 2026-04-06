'use client';

import { useState } from 'react';
import { sendCommand } from '../api/calibration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SESSION_DESCRIPTIONS: Record<string, string> = {
  A: 'Ambient Noise — Derau lingkungan, pintu tertutup, tanpa gangguan',
  B: 'Single Impact — Benturan tunggal (pukulan, senggolan, tendangan)',
  C: 'Chiseling — Pemahatan repetitif (obeng/pahat, simulasi intrusi ringan)',
  D: 'Ramming — Pendobrakan (hantaman kuat berulang, simulasi intrusi berat)',
};

interface Props {
  deviceId: string;
  onCommandSent?: () => void;
}

export default function CalibrationControlPanel({ deviceId, onCommandSent }: Props) {
  const [session, setSession] = useState('A');
  const [trial, setTrial] = useState(1);
  const [note, setNote] = useState('');
  const [markLabel, setMarkLabel] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState('');

  const send = async (cmd: string, extra?: Record<string, unknown>) => {
    if (!deviceId) {
      setLastMessage('Error: Device ID is required');
      return;
    }
    setLoading(cmd);
    try {
      const result = await sendCommand(deviceId, cmd, extra);
      setLastMessage(`✓ ${result.message}`);
      onCommandSent?.();
    } catch (err: any) {
      setLastMessage(`✗ ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calibration Control Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Session</label>
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A — Ambient Noise</SelectItem>
                <SelectItem value="B">B — Single Impact</SelectItem>
                <SelectItem value="C">C — Chiseling</SelectItem>
                <SelectItem value="D">D — Ramming</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{SESSION_DESCRIPTIONS[session]}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Trial #</label>
            <Input
              type="number"
              min={1}
              value={trial}
              onChange={(e) => setTrial(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Note</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., pukulan_tangan_tengah"
          />
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => send('SET_SESSION', { session, trial, note })}
            disabled={loading !== null}
            variant="neutral"
          >
            {loading === 'SET_SESSION' ? '...' : '1. Set Session'}
          </Button>
          <Button
            onClick={() => send('START')}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading === 'START' ? '...' : '2. Start'}
          </Button>
          <Button
            onClick={() => send('STOP')}
            disabled={loading !== null}
            variant="destructive"
          >
            {loading === 'STOP' ? '...' : '3. Stop'}
          </Button>
        </div>

        {/* Mark */}
        <div className="flex gap-2">
          <Input
            value={markLabel}
            onChange={(e) => setMarkLabel(e.target.value)}
            placeholder="Marker label (e.g., mulai_pukul)"
            className="flex-1"
          />
          <Button
            onClick={() => send('MARK', { label: markLabel || 'mark' })}
            disabled={loading !== null}
            variant="neutral"
          >
            {loading === 'MARK' ? '...' : 'Mark'}
          </Button>
        </div>

        {/* Utility */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={() => send('RECAL')}
            disabled={loading !== null}
            variant="neutral"
            size="sm"
          >
            {loading === 'RECAL' ? '...' : 'Recalibrate Baseline'}
          </Button>
        </div>

        {/* Auto-increment trial on STOP */}
        <div className="flex items-center gap-2">
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => setTrial((t) => t + 1)}
          >
            Trial ++ (now: {trial} → {trial + 1})
          </Button>
        </div>

        {/* Status message */}
        {lastMessage && (
          <p className={`text-sm ${lastMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
            {lastMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
