/**
 * @file CalibrationDataTable.tsx
 * @purpose Data table displaying calibration raw data and session statistics
 * @usedBy CalibrationPage
 * @deps calibration API, Table UI
 * @exports CalibrationDataTable (default)
 * @sideEffects API calls (fetchRawData, fetchSessions)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getStatistics,
  getSessionStats,
  getRawData,
  getSessions,
  getSummaryData,
  getTrialPeaks,
  getPeakSummary,
  type CalibrationStatistic,
  type CalibrationSessionStat,
  type CalibrationRaw,
  type CalibrationSummary,
  type CalibrationTrialPeak,
  type CalibrationPeakSummary
} from '../api/calibration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function CalibrationDataTable() {
  const [tab, setTab] = useState<
    'stats' | 'session-stats' | 'raw' | 'summary' | 'peaks' | 'peak-summary'
  >('session-stats');

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Calibration Data</CardTitle>
        <div className="flex gap-1.5 flex-wrap sm:gap-2">
          <Button
            size="sm"
            variant={tab === 'session-stats' ? 'default' : 'neutral'}
            onClick={() => setTab('session-stats')}
          >
            Session Stats
          </Button>
          <Button
            size="sm"
            variant={tab === 'summary' ? 'default' : 'neutral'}
            onClick={() => setTab('summary')}
          >
            Summary (A)
          </Button>
          <Button
            size="sm"
            variant={tab === 'stats' ? 'default' : 'neutral'}
            onClick={() => setTab('stats')}
          >
            Per-Trial
          </Button>
          <Button
            size="sm"
            variant={tab === 'peaks' ? 'default' : 'neutral'}
            onClick={() => setTab('peaks')}
          >
            Trial Peaks
          </Button>
          <Button
            size="sm"
            variant={tab === 'peak-summary' ? 'default' : 'neutral'}
            onClick={() => setTab('peak-summary')}
          >
            Peak Summary
          </Button>
          <Button
            size="sm"
            variant={tab === 'raw' ? 'default' : 'neutral'}
            onClick={() => setTab('raw')}
          >
            Raw Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {tab === 'session-stats' && <SessionStatsView />}
        {tab === 'summary' && <SummaryDataView />}
        {tab === 'stats' && <TrialStatsView />}
        {tab === 'peaks' && <TrialPeaksView />}
        {tab === 'peak-summary' && <PeakSummaryView />}
        {tab === 'raw' && <RawDataView />}
      </CardContent>
    </Card>
  );
}

// ---- Summary Data View (Session A periodic summaries) ----
function SummaryDataView() {
  const [data, setData] = useState<CalibrationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0
  });

  const fetchData = (offset = 0) => {
    setLoading(true);
    getSummaryData({ limit: 50, offset })
      .then((r) => {
        setData(r.data);
        setPagination(r.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(0);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button size="sm" variant="neutral" onClick={() => fetchData(0)}>
          Refresh
        </Button>
        <p className="text-xs text-muted-foreground">
          Showing {data.length} of {pagination.total} summaries (offset:{' '}
          {pagination.offset})
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">
          No summary data yet — Session A generates periodic 5-second summaries
        </p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Max Δg</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.session}</TableCell>
                  <TableCell>{row.trial}</TableCell>
                  <TableCell className="text-xs">{row.summary_type}</TableCell>
                  <TableCell>{row.n_samples}</TableCell>
                  <TableCell className="font-mono">
                    {Number(row.dg_max).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs">{row.window_ms}ms</TableCell>
                  <TableCell className="text-xs">
                    {new Date(row.created_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="neutral"
          disabled={pagination.offset === 0}
          onClick={() =>
            fetchData(Math.max(0, pagination.offset - pagination.limit))
          }
        >
          ← Prev
        </Button>
        <Button
          size="sm"
          variant="neutral"
          disabled={pagination.offset + pagination.limit >= pagination.total}
          onClick={() => fetchData(pagination.offset + pagination.limit)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

// ---- Session Stats View ----
function SessionStatsView() {
  const [data, setData] = useState<CalibrationSessionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionStats()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (data.length === 0)
    return <p className="text-muted-foreground">No session data yet</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Trials</TableHead>
            <TableHead>Samples</TableHead>
            <TableHead>Max Δg</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.session}>
              <TableCell className="font-medium">{row.session}</TableCell>
              <TableCell>{row.n_trials}</TableCell>
              <TableCell>{row.total_samples}</TableCell>
              <TableCell>{row.dg_max}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---- Trial Stats View ----
function TrialStatsView() {
  const [data, setData] = useState<CalibrationStatistic[]>([]);
  const [session, setSession] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStatistics(session === 'all' ? undefined : session)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <label className="text-sm">Filter session:</label>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No trial data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Max Δg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.session}</TableCell>
                  <TableCell>{row.trial}</TableCell>
                  <TableCell>{row.n_samples}</TableCell>
                  <TableCell>{row.dg_max}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ---- Trial Peaks View ----
function TrialPeaksView() {
  const [data, setData] = useState<CalibrationTrialPeak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrialPeaks()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (data.length === 0)
    return <p className="text-muted-foreground">No trial peak data yet</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Trial</TableHead>
            <TableHead>Peak Δg</TableHead>
            <TableHead>Samples</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{row.session}</TableCell>
              <TableCell>{row.trial}</TableCell>
              <TableCell className="font-mono">
                {Number(row.dg_peak).toFixed(4)}
              </TableCell>
              <TableCell>{row.n_samples}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---- Peak Summary View ----
function PeakSummaryView() {
  const [data, setData] = useState<CalibrationPeakSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPeakSummary()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (data.length === 0)
    return <p className="text-muted-foreground">No peak summary data yet</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Trials</TableHead>
            <TableHead>Peak Max</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.session}>
              <TableCell className="font-medium">{row.session}</TableCell>
              <TableCell>{row.n_trials}</TableCell>
              <TableCell className="font-mono">
                {Number(row.peak_max).toFixed(4)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---- Raw Data View ----
function RawDataView() {
  const [data, setData] = useState<CalibrationRaw[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [session, setSession] = useState('all');
  const [trial, setTrial] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0
  });

  // Load available sessions
  useEffect(() => {
    getSessions()
      .then((r) => setSessions(r.data))
      .catch(console.error);
  }, []);

  const fetchData = (offset = 0) => {
    setLoading(true);
    getRawData({
      session: session === 'all' ? undefined : session,
      trial: trial ? parseInt(trial) : undefined,
      limit: 50,
      offset
    })
      .then((r) => {
        setData(r.data);
        setPagination(r.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(0);
  }, [session, trial]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-sm">Session:</label>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="text-sm">Trial:</label>
        <Input
          className="w-20"
          value={trial}
          onChange={(e) => setTrial(e.target.value)}
          placeholder="All"
          type="number"
          min={1}
        />
        <Button size="sm" variant="neutral" onClick={() => fetchData(0)}>
          Refresh
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {data.length} of {pagination.total} records (offset:{' '}
        {pagination.offset})
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No raw data for this filter</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Δg</TableHead>
                <TableHead>Marker</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.marker ? 'bg-yellow-50 dark:bg-yellow-950' : ''
                  }
                >
                  <TableCell className="text-xs">{row.session}</TableCell>
                  <TableCell>{row.trial}</TableCell>
                  <TableCell className="font-mono">
                    {Number(row.delta_g).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {row.marker && (
                      <span className="text-yellow-600 font-medium">
                        📌 {row.marker}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{row.note}</TableCell>
                  <TableCell className="text-xs">
                    {row.ts_iso || row.ts_device}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="neutral"
          disabled={pagination.offset === 0}
          onClick={() =>
            fetchData(Math.max(0, pagination.offset - pagination.limit))
          }
        >
          ← Prev
        </Button>
        <Button
          size="sm"
          variant="neutral"
          disabled={pagination.offset + pagination.limit >= pagination.total}
          onClick={() => fetchData(pagination.offset + pagination.limit)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
