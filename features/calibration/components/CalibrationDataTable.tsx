'use client';

import { useState, useEffect } from 'react';
import {
  getStatistics,
  getSessionStats,
  getRawData,
  type CalibrationStatistic,
  type CalibrationSessionStat,
  type CalibrationRaw,
} from '../api/calibration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CalibrationDataTable() {
  const [tab, setTab] = useState<'stats' | 'session-stats' | 'raw'>('session-stats');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calibration Data</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant={tab === 'session-stats' ? 'default' : 'neutral'} onClick={() => setTab('session-stats')}>
            Session Stats
          </Button>
          <Button size="sm" variant={tab === 'stats' ? 'default' : 'neutral'} onClick={() => setTab('stats')}>
            Per-Trial
          </Button>
          <Button size="sm" variant={tab === 'raw' ? 'default' : 'neutral'} onClick={() => setTab('raw')}>
            Raw Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'session-stats' && <SessionStatsView />}
        {tab === 'stats' && <TrialStatsView />}
        {tab === 'raw' && <RawDataView />}
      </CardContent>
    </Card>
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
  if (data.length === 0) return <p className="text-muted-foreground">No session data yet</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Trials</TableHead>
            <TableHead>Samples</TableHead>
            <TableHead>Min Δg</TableHead>
            <TableHead>Max Δg</TableHead>
            <TableHead>Mean Δg</TableHead>
            <TableHead>StdDev</TableHead>
            <TableHead>Median</TableHead>
            <TableHead>P95</TableHead>
            <TableHead>P99</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.session}>
              <TableCell className="font-medium">{row.session}</TableCell>
              <TableCell>{row.n_trials}</TableCell>
              <TableCell>{row.total_samples}</TableCell>
              <TableCell>{row.dg_min}</TableCell>
              <TableCell>{row.dg_max}</TableCell>
              <TableCell>{row.dg_mean}</TableCell>
              <TableCell>{row.dg_stddev}</TableCell>
              <TableCell>{row.dg_median}</TableCell>
              <TableCell>{row.dg_p95}</TableCell>
              <TableCell>{row.dg_p99}</TableCell>
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
                <TableHead>Min Δg</TableHead>
                <TableHead>Max Δg</TableHead>
                <TableHead>Mean Δg</TableHead>
                <TableHead>StdDev</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.session}</TableCell>
                  <TableCell>{row.trial}</TableCell>
                  <TableCell>{row.n_samples}</TableCell>
                  <TableCell>{row.dg_min}</TableCell>
                  <TableCell>{row.dg_max}</TableCell>
                  <TableCell>{row.dg_mean}</TableCell>
                  <TableCell>{row.dg_stddev}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ---- Raw Data View ----
function RawDataView() {
  const [data, setData] = useState<CalibrationRaw[]>([]);
  const [session, setSession] = useState('B');
  const [trial, setTrial] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });

  const fetchData = (offset = 0) => {
    setLoading(true);
    getRawData(session, {
      trial: trial ? parseInt(trial) : undefined,
      limit: 50,
      offset,
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
      <div className="flex gap-2 items-center">
        <label className="text-sm">Session:</label>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
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
        Showing {data.length} of {pagination.total} records (offset: {pagination.offset})
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
                <TableHead>Trial</TableHead>
                <TableHead>Δg</TableHead>
                <TableHead>Marker</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} className={row.marker ? 'bg-yellow-50 dark:bg-yellow-950' : ''}>
                  <TableCell>{row.trial}</TableCell>
                  <TableCell className="font-mono">{Number(row.delta_g).toFixed(4)}</TableCell>
                  <TableCell>{row.marker && <span className="text-yellow-600 font-medium">📌 {row.marker}</span>}</TableCell>
                  <TableCell className="text-xs">{row.note}</TableCell>
                  <TableCell className="text-xs">{row.ts_iso || row.ts_device}</TableCell>
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
          onClick={() => fetchData(Math.max(0, pagination.offset - pagination.limit))}
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
