import { useEffect } from 'react';
import {
  Scale,
  X,
  Activity,
  Timer,
  Gauge,
  Ban,
  Repeat,
  TriangleAlert,
  ArrowUpRight,
} from 'lucide-react';
import { useObservabilityStore } from '../../stores/observabilityStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, SheetContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import StatCard, { StatGrid } from './StatCard';

const selectClass =
  'h-8 cursor-pointer rounded-md border border-input bg-background px-2.5 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

function DistributionCard({ title, rows }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-xs">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3 space-y-2.5">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        {rows.map(({ label, value, pct }) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground tabular-nums">{value}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand-app" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-label text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cn('flex items-center justify-between py-1.5 text-sm', strong && 'font-medium')}>
      <span className={strong ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </div>
  );
}

/** Evaluations tab: retrieval and answer quality across recent runs, with per-trace details. */
export default function EvaluationsView() {
  const {
    metrics,
    traces,
    pagination,
    selectedTrace,
    filters,
    fetchMetrics,
    fetchTraces,
    fetchTraceDetails,
    closeTraceDetails,
    runAIJudge,
    isJudging,
  } = useObservabilityStore();

  useEffect(() => {
    fetchMetrics();
    fetchTraces();
  }, [fetchMetrics, fetchTraces]);

  const sample = metrics?.sampleSize || 1;
  const strategyRows = Object.entries(metrics?.strategyDistribution || {}).map(([strat, count]) => {
    const pct = Math.round((count / sample) * 100);
    return { label: strat.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), value: `${count} (${pct}%)`, pct };
  });
  const maxChannel = Math.max(...Object.values(metrics?.channelUsage || {}), 1);
  const channelRows = Object.entries(metrics?.channelUsage || {}).map(([chan, count]) => ({
    label: chan === 'VECTOR' ? 'Meaning search (vectors)' : chan === 'BM25' ? 'Keyword search (BM25)' : 'Hypothetical-answer search',
    value: `${count} queries`,
    pct: Math.round((count / maxChannel) * 100),
  }));

  return (
    <div className="space-y-3">
      <StatGrid className="grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Activity} label="Total runs" value={metrics?.totalRuns ?? '—'} note={`Sample of ${metrics?.sampleSize || 0} traces`} />
        <StatCard
          icon={Timer}
          label="Avg latency"
          value={metrics?.avgDurationMs ? `${metrics.avgDurationMs}ms` : '—'}
          note={`Retrieval ${metrics?.avgRetrievalMs || 0}ms · answer ${metrics?.avgGenerationMs || 0}ms`}
        />
        <StatCard icon={Gauge} label="Context grade" value={metrics?.avgGradeScore ? `${metrics.avgGradeScore}/10` : '—'} note="Target 6.0 or higher" />
        <StatCard icon={Ban} label="Refusal rate" value={metrics?.refusalRate || '0%'} note="Low-confidence fallbacks" />
        <StatCard icon={Repeat} label="Retry rate" value={metrics?.retryRate || '0%'} note="Corrective search loops" />
        <StatCard icon={TriangleAlert} label="Error rate" value={metrics?.errorRate || '0%'} note="Stream or pipeline faults" />
      </StatGrid>

      {metrics && (
        <div className="grid gap-3 md:grid-cols-2">
          <DistributionCard title="Query strategies" rows={strategyRows} />
          <DistributionCard title="Search channels" rows={channelRows} />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Traces</h2>
            <Badge variant="muted" className="tabular-nums">
              {pagination.total ?? traces.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.strategy || ''}
              onChange={(e) => fetchTraces({ strategy: e.target.value, page: 1 })}
              className={selectClass}
              aria-label="Filter by strategy"
            >
              <option value="">All strategies</option>
              <option value="FACTUAL_SPECIFIC">Factual / specific</option>
              <option value="BROAD_SUMMARY">Broad summary</option>
              <option value="DIRECT_ANSWER">Direct answer</option>
              <option value="COMPLEX_DECOMPOSE">Complex / decompose</option>
            </select>
            <select
              value={filters.hasError || ''}
              onChange={(e) => fetchTraces({ hasError: e.target.value, page: 1 })}
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="false">Healthy</option>
              <option value="true">Errors only</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Question</th>
                  <th className="px-4 py-2.5 font-medium">Strategy</th>
                  <th className="px-4 py-2.5 font-medium">Duration</th>
                  <th className="px-4 py-2.5 font-medium">Grade</th>
                  <th className="px-4 py-2.5 font-medium">Retries</th>
                  <th className="px-4 py-2.5 font-medium">AI judge</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {traces.map((trace) => {
                  const rm = trace.retrievalMetrics || {};
                  const grade = rm.contextGradeScore;
                  return (
                    <tr key={trace.traceId} onClick={() => fetchTraceDetails(trace.traceId)} className="cursor-pointer transition-colors hover:bg-muted/40">
                      <td className="max-w-[320px] px-4 py-3">
                        <p className="truncate font-medium text-foreground">{trace.query}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{trace.traceId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal">
                          {(rm.strategy || 'Unknown').replaceAll('_', ' ').toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{trace.duration ? `${trace.duration}ms` : '—'}</td>
                      <td className="px-4 py-3">
                        {typeof grade === 'number' ? (
                          <Badge variant={grade >= 6 ? 'success' : 'warning'} className="tabular-nums">
                            {grade}/10
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{rm.correctiveRetries || 0}</td>
                      <td className="px-4 py-3">
                        {trace.aiJudge ? (
                          <Badge variant="success" className="tabular-nums">
                            {trace.aiJudge.faithfulness ?? trace.aiJudge.groundedness}/10
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not run</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchTraceDetails(trace.traceId);
                          }}
                        >
                          Inspect <ArrowUpRight />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {traces.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No traces match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

{/* Trace details sheet (Radix handles Escape, focus and outside click) */}
      <Dialog open={Boolean(selectedTrace)} onOpenChange={(open) => !open && closeTraceDetails()}>
        {selectedTrace && (
          <SheetContent>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm font-semibold">Trace details</DialogTitle>
                <DialogDescription className="truncate font-mono text-xs">{selectedTrace.traceId}</DialogDescription>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={closeTraceDetails} aria-label="Close">
                <X />
              </Button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <Section title="Question">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">{selectedTrace.query}</div>
              </Section>

              <Section title="Latency">
                <div className="divide-y divide-border rounded-lg border border-border px-3">
                  <Row label="Memory lookup" value={`${selectedTrace.stepDurations?.memoryMs || 0}ms`} />
                  <Row label="Retrieval pipeline" value={`${selectedTrace.stepDurations?.retrievalMs || 0}ms`} />
                  <Row label="Answer generation" value={`${selectedTrace.stepDurations?.generationMs || 0}ms`} />
                  <Row label="Total" value={`${selectedTrace.duration}ms`} strong />
                </div>
              </Section>

              <Section title="Retrieval funnel">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Candidates', selectedTrace.retrievalMetrics?.candidateCount || 0],
                    ['After relevance floor', selectedTrace.retrievalMetrics?.afterFloorCount || 0],
                    ['After re-ranking', selectedTrace.retrievalMetrics?.afterRerankCount || 0],
                    ['Context grade', `${selectedTrace.retrievalMetrics?.contextGradeScore ?? '—'}/10`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="AI judge">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedTrace.aiJudge ? 'Scores for this answer.' : 'Score context relevance, faithfulness and answer relevance.'}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => runAIJudge(selectedTrace.traceId)} disabled={isJudging}>
                    <Scale className={cn(isJudging && 'animate-spin')} /> {isJudging ? 'Evaluating…' : 'Run judge'}
                  </Button>
                </div>
                {selectedTrace.aiJudge && (
                  <div className="divide-y divide-border rounded-lg border border-border px-3">
                    <Row label="Context relevance" value={`${selectedTrace.aiJudge.contextRelevance}/10`} />
                    <Row label="Faithfulness" value={`${selectedTrace.aiJudge.faithfulness ?? selectedTrace.aiJudge.groundedness}/10`} />
                    <Row label="Answer relevance" value={`${selectedTrace.aiJudge.answerRelevance}/10`} />
                    {selectedTrace.aiJudge.reasoning && (
                      <p className="py-2.5 text-sm leading-relaxed text-muted-foreground">{selectedTrace.aiJudge.reasoning}</p>
                    )}
                  </div>
                )}
              </Section>

              <Section title="Answer">
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                  {selectedTrace.response || 'No answer recorded.'}
                </div>
              </Section>
            </div>
          </SheetContent>
        )}
      </Dialog>
    </div>
  );
}
