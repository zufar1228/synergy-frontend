/**
 * @file CalibrationInsightPanel.tsx
 * @purpose Insight snapshot panel for calibration data with threshold-oriented analytics
 * @usedBy CalibrationPage
 * @deps calibration API (session stats, peak summary, trial peaks), Card/Badge/Button UI
 * @exports CalibrationInsightPanel (default)
 * @sideEffects API calls (read-only) for derived insights
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getPeakSummary,
  getSessionStats,
  getTrialPeaks,
  type CalibrationPeakSummary,
  type CalibrationSessionStat,
  type CalibrationTrialPeak
} from '../api/calibration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type InsightState = {
  sessionStats: CalibrationSessionStat[];
  peakSummary: CalibrationPeakSummary[];
  trialPeaks: CalibrationTrialPeak[];
};

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatG(value: number | null): string {
  if (value === null) return '-';
  return `${value.toFixed(4)} g`;
}

function formatX(value: number | null): string {
  if (value === null) return '-';
  return `${value.toFixed(2)}x`;
}

function formatPercent(value: number | null): string {
  if (value === null) return '-';
  return `${value.toFixed(1)}%`;
}

function buildSessionMap(
  rows: CalibrationPeakSummary[]
): Map<string, CalibrationPeakSummary> {
  return new Map(rows.map((row) => [row.session, row]));
}

function getTopTrial(
  rows: CalibrationTrialPeak[],
  session: string
): CalibrationTrialPeak | null {
  const candidates = rows.filter((row) => row.session === session);
  if (candidates.length === 0) return null;

  return candidates.reduce((best, current) => {
    return Number(current.dg_peak) > Number(best.dg_peak) ? current : best;
  });
}

function InsightMetricCard({
  label,
  value,
  helper,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  helper: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30'
        : tone === 'danger'
          ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30'
          : 'border-border bg-muted/30';

  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg sm:text-xl font-semibold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{helper}</p>
    </div>
  );
}

function SessionBand({
  session,
  peakMin,
  peakMax,
  widthPercent
}: {
  session: string;
  peakMin: number | null;
  peakMax: number | null;
  widthPercent: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Session {session}</span>
        <span className="text-muted-foreground">
          {formatG(peakMin)} - {formatG(peakMax)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
          style={{ width: `${Math.max(4, Math.min(100, widthPercent))}%` }}
        />
      </div>
    </div>
  );
}

export default function CalibrationInsightPanel() {
  const [state, setState] = useState<InsightState>({
    sessionStats: [],
    peakSummary: [],
    trialPeaks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionStatsRes, peakSummaryRes, trialPeaksRes] =
        await Promise.all([
          getSessionStats(),
          getPeakSummary(),
          getTrialPeaks()
        ]);

      setState({
        sessionStats: sessionStatsRes.data,
        peakSummary: peakSummaryRes.data,
        trialPeaks: trialPeaksRes.data
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load calibration insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const computed = useMemo(() => {
    const peakBySession = buildSessionMap(state.peakSummary);

    const peakA = peakBySession.get('A');
    const peakB = peakBySession.get('B');
    const peakC = peakBySession.get('C');

    const noiseCeiling = Math.max(
      toFiniteNumber(peakA?.peak_max) ?? 0,
      toFiniteNumber(peakB?.peak_max) ?? 0
    );

    const intrusionFloor = toFiniteNumber(peakC?.peak_min);
    const intrusionPeakMax = toFiniteNumber(peakC?.peak_max);

    const signalGap =
      intrusionFloor !== null
        ? Number((intrusionFloor - noiseCeiling).toFixed(4))
        : null;

    const separationRatio =
      intrusionFloor !== null && noiseCeiling > 0
        ? Number((intrusionFloor / noiseCeiling).toFixed(2))
        : null;

    const overlapRisk = signalGap !== null ? signalGap <= 0 : true;

    const thresholdBand = (() => {
      if (intrusionFloor === null || noiseCeiling <= 0) return null;

      const lower = Number((noiseCeiling * 1.1).toFixed(4));
      const upper = Number((intrusionFloor * 0.9).toFixed(4));

      if (lower >= upper) return null;
      return { lower, upper };
    })();

    const thresholdMidpoint =
      intrusionFloor !== null
        ? Number(((noiseCeiling + intrusionFloor) / 2).toFixed(4))
        : null;

    const topNoiseTrial = getTopTrial(state.trialPeaks, 'B');
    const topIntrusionTrial = getTopTrial(state.trialPeaks, 'C');

    const maxSessionPeak = Math.max(
      0.0001,
      ...state.peakSummary.map((row) => toFiniteNumber(row.peak_max) ?? 0)
    );

    const sessionBands = state.peakSummary
      .map((row) => {
        const peakMin = toFiniteNumber(row.peak_min);
        const peakMax = toFiniteNumber(row.peak_max);
        return {
          session: row.session,
          peakMin,
          peakMax,
          widthPercent: peakMax ? (peakMax / maxSessionPeak) * 100 : 0
        };
      })
      .sort((a, b) => a.session.localeCompare(b.session));

    const sessionCoverage = state.sessionStats
      .map((row) => Number(row.total_samples))
      .reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);

    const intrusionVariability = toFiniteNumber(peakC?.peak_stddev);

    return {
      noiseCeiling: noiseCeiling > 0 ? Number(noiseCeiling.toFixed(4)) : null,
      intrusionFloor,
      intrusionPeakMax,
      signalGap,
      separationRatio,
      overlapRisk,
      thresholdBand,
      thresholdMidpoint,
      topNoiseTrial,
      topIntrusionTrial,
      sessionBands,
      sessionCoverage,
      intrusionVariability
    };
  }, [state]);

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Insight Snapshot
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Auto-analysis dari statistik sesi untuk membantu presentasi
              kalibrasi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={computed.overlapRisk ? 'warning' : 'success'}>
              {computed.overlapRisk ? 'Overlap Risk' : 'Signal Separated'}
            </Badge>
            <Button size="sm" variant="neutral" onClick={fetchInsights}>
              Refresh Insight
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading insight...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InsightMetricCard
                label="Noise Ceiling (A/B)"
                value={formatG(computed.noiseCeiling)}
                helper="Batas atas sinyal non-intrusi"
                tone="warning"
              />
              <InsightMetricCard
                label="Intrusion Floor (C)"
                value={formatG(computed.intrusionFloor)}
                helper="Batas bawah sinyal intrusi"
                tone="success"
              />
              <InsightMetricCard
                label="Signal Gap"
                value={formatG(computed.signalGap)}
                helper={`Rasio pemisah: ${formatX(computed.separationRatio)}`}
                tone={computed.overlapRisk ? 'danger' : 'success'}
              />
              <InsightMetricCard
                label="Suggested Threshold"
                value={
                  computed.thresholdBand
                    ? `${computed.thresholdBand.lower.toFixed(4)} - ${computed.thresholdBand.upper.toFixed(4)} g`
                    : formatG(computed.thresholdMidpoint)
                }
                helper={
                  computed.thresholdBand
                    ? 'Band aman (antara noise dan intrusi)'
                    : 'Gunakan nilai tengah, perlu data tambahan bila overlap'
                }
                tone={computed.thresholdBand ? 'success' : 'warning'}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Session Peak Range</p>
                  <p className="text-xs text-muted-foreground">
                    Relative vs peak tertinggi
                  </p>
                </div>
                {computed.sessionBands.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada data peak summary.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {computed.sessionBands.map((band) => (
                      <SessionBand
                        key={band.session}
                        session={band.session}
                        peakMin={band.peakMin}
                        peakMax={band.peakMax}
                        widthPercent={band.widthPercent}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-3 sm:p-4 space-y-3">
                <p className="text-sm font-semibold">Narrative Insight</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    Top noise trial (Session B):{' '}
                    <span className="font-semibold">
                      {computed.topNoiseTrial
                        ? `#${computed.topNoiseTrial.trial} (${formatG(
                            toFiniteNumber(computed.topNoiseTrial.dg_peak)
                          )})`
                        : '-'}
                    </span>
                  </li>
                  <li>
                    Top intrusion trial (Session C):{' '}
                    <span className="font-semibold">
                      {computed.topIntrusionTrial
                        ? `#${computed.topIntrusionTrial.trial} (${formatG(
                            toFiniteNumber(computed.topIntrusionTrial.dg_peak)
                          )})`
                        : '-'}
                    </span>
                  </li>
                  <li>
                    Intrusion variability (StdDev peak C):{' '}
                    <span className="font-semibold">
                      {formatG(computed.intrusionVariability)}
                    </span>
                  </li>
                  <li>
                    Coverage total sample:{' '}
                    <span className="font-semibold">
                      {new Intl.NumberFormat('id-ID').format(
                        Math.max(0, computed.sessionCoverage)
                      )}
                    </span>
                  </li>
                  <li>
                    Confidence estimasi threshold:{' '}
                    <span className="font-semibold">
                      {formatPercent(
                        computed.separationRatio !== null
                          ? Math.min(
                              100,
                              Math.max(0, (computed.separationRatio - 1) * 50)
                            )
                          : null
                      )}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
