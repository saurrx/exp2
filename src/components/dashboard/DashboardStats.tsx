import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/DashboardChrome";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, RotateCcw, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  PRODUCT_CARD_CLASS,
  PRODUCT_CARD_TITLE_CLASS,
} from "@/components/ui/product-surfaces";
import { ProductChip } from "@/components/ui/product-chip";
import {
  Tooltip as ProductTooltip,
  TooltipContent as ProductTooltipContent,
  TooltipProvider as ProductTooltipProvider,
  TooltipTrigger as ProductTooltipTrigger,
} from "@/components/ui/tooltip";

const CARD_CLASS = PRODUCT_CARD_CLASS;
const NUMS: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
const CHART_NAVY = "#11103C";
const CHART_TEAL = "#2F8D70";

/* ---------------------------------- shared bits --------------------------------- */

const StatLabel = ({ children }: { children: React.ReactNode }) => (
  <div className={PRODUCT_CARD_TITLE_CLASS}>
    {children}
  </div>
);

/**
 * What a card shows when its data did not arrive.
 *
 * There was no such state. Every dashboard query swallowed its own error and
 * resolved with `undefined`, and the cards rendered the zeros that `?? 0`
 * produces — so a failed request and a firm with no patents looked identical.
 * Reproduced on demo by failing /v1/dashboard once: "0 Total patents, Granted
 * 0 · 0%" for a portfolio of 14,260. A number nobody can distrust is worse
 * than a gap.
 *
 * Deliberately small and in-card: the rest of the dashboard is still true, and
 * blanking the page over one failed panel trades one wrong impression for
 * another.
 */
const CardError = ({ onRetry, label = "Could not load this" }: {
  onRetry?: () => void;
  label?: string;
}) => (
  <div
    role="status"
    className="flex flex-1 flex-col items-start justify-center gap-2 py-6 text-[13px] text-[var(--pulse-ink-muted)]"
  >
    <span>{label}</span>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--pulse-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--pulse-ink)] transition-colors hover:bg-[var(--pulse-surface-subtle)]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Retry
      </button>
    )}
  </div>
);

/* -------------------------------- Portfolio motion ------------------------------- */

type MotionPoint = {
  day: string;
  ideas: number;
  filings: number;
  filing_levels?: number[];
  ideasThisWeek?: number;
};
type MotionClientOption = { id: string; name: string };

const CHART_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const chartDateLabel = (value: string, index: number, total: number) => {
  if (/^W\d+$/i.test(value)) {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const daysSinceMonday = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(
      weekStart.getDate() - daysSinceMonday - (total - index - 1) * 7,
    );
    return CHART_DATE_FORMATTER.format(weekStart);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : CHART_DATE_FORMATTER.format(parsed);
};

const FilingDots = ({ cx, cy, payload }: any) => {
  const count = Math.max(0, Number(payload?.filings) || 0);
  if (!count || cx == null || cy == null) return null;

  const spacing = 8;
  return (
    <g aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <circle
          key={index}
          cx={cx + (index - (count - 1) / 2) * spacing}
          cy={cy}
          r={4}
          fill={CHART_TEAL}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
};

const IdeasAndFilingsTooltip = ({ active, label, payload }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as MotionPoint | undefined;
  const ideas = point?.ideasThisWeek ?? 0;
  const filings = point?.filings ?? 0;

  return (
    <div className="rounded-xs border border-[var(--pulse-line)] bg-white px-3 py-2 font-sans text-xs text-[var(--pulse-ink)] shadow-sm">
      Week of {label} · {ideas} idea{ideas === 1 ? "" : "s"} · {filings} filing{filings === 1 ? "" : "s"}
    </div>
  );
};

const PortfolioMotion = ({
  ideas30,
  filings90,
  series,
  ideasLabel = "Ideas received",
  clientOptions = [],
  selectedClientIds,
  onClientSelectionChange,
  hasError = false,
  onRetry,
}: {
  ideas30: number;
  filings90: number;
  /** The series did not arrive. A flat line at zero is not a trend. */
  hasError?: boolean;
  onRetry?: () => void;
  /** Role-aware: admins see "Ideas received", inventors "Ideas submitted". */
  ideasLabel?: string;
  series?: MotionPoint[];
  clientOptions?: MotionClientOption[];
  /** Null means every available client is selected. */
  selectedClientIds?: string[] | null;
  onClientSelectionChange?: (clientIds: string[] | null) => void;
}) => {
  // Cumulative view: at 5-15 ideas/month, per-week counts are all 0s and 1s.
  // Running totals show progress instead of noise.
  const data: MotionPoint[] = React.useMemo(() => {
    const weekly = series ?? [];
    let ideasSum = 0;
    return weekly.map((p, index) => {
      ideasSum += p.ideas;
      return {
        day: chartDateLabel(p.day, index, weekly.length),
        ideas: ideasSum,
        filings: Number(p.filings) || 0,
        filing_levels: p.filing_levels,
        ideasThisWeek: Number(p.ideas) || 0,
      };
    });
  }, [series]);

  const latestPoint = data[data.length - 1];
  const ideasPeriodTotal = latestPoint?.ideas ?? ideas30;
  const filingsPeriodTotal = data.length
    ? data.reduce((sum, point) => sum + point.filings, 0)
    : filings90;
  const yAxisStep = Math.max(1, Math.ceil(ideasPeriodTotal / 5));
  const yAxisMax = Math.max(yAxisStep, Math.ceil(ideasPeriodTotal / yAxisStep) * yAxisStep);
  const yAxisTicks = Array.from(
    { length: yAxisMax / yAxisStep + 1 },
    (_, index) => index * yAxisStep,
  );
  const xAxisInterval = Math.max(0, Math.ceil(data.length / 8) - 1);
  // Filings are event markers on the cumulative ideas series, not a separate
  // measure. Anchor each week's dots to the line so the relationship reads
  // correctly even when a filing is not linked to an in-window idea record.
  const filingMarkers = data
    .filter((point) => point.filings > 0)
    .map((point) => ({
      day: point.day,
      level: point.ideas,
      filings: point.filings,
    }));

  const allClientIds = clientOptions.map((client) => client.id);
  const isAllClients = selectedClientIds == null;
  const selectionLabel = isAllClients
    ? "All clients"
    : selectedClientIds.length === 1
      ? clientOptions.find((client) => client.id === selectedClientIds[0])
          ?.name || "1 client"
      : `${selectedClientIds.length} clients`;

  const toggleClient = (clientId: string, checked: boolean) => {
    if (!onClientSelectionChange) return;
    const current = isAllClients ? [...allClientIds] : [...selectedClientIds];
    const next = checked
      ? [...new Set([...current, clientId])]
      : current.filter((id) => id !== clientId);

    // Keep at least one client selected so the chart never falls into an
    // ambiguous empty state. Selecting every client collapses back to All.
    if (next.length === 0) return;
    onClientSelectionChange(
      next.length === allClientIds.length ? null : next,
    );
  };

  if (hasError) {
    return (
      <div className={`${CARD_CLASS} flex h-full min-h-[320px] flex-col`}>
        <div>
          <StatLabel>Ideas and filings</StatLabel>
          <p className="mt-1 text-xs text-[var(--pulse-ink-muted)]">Cumulative, last 3 months</p>
        </div>
        <CardError onRetry={onRetry} label="Could not load the trend." />
      </div>
    );
  }

  return (
    <div className={`${CARD_CLASS} flex h-full min-h-[320px] flex-col`}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <StatLabel>Ideas and filings</StatLabel>
          <p className="mt-1 text-xs text-[var(--pulse-ink-muted)]">
            Cumulative, last 3 months
          </p>
        </div>
        {clientOptions.length > 1 && onClientSelectionChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 min-w-[150px] items-center justify-between gap-3 rounded-sm border border-[var(--pulse-line)] bg-white px-3 text-xs font-medium text-[var(--pulse-ink-secondary)] transition-colors hover:border-[var(--pulse-line-strong)] hover:text-[var(--pulse-ink)]"
                aria-label={`Filter chart by client: ${selectionLabel}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[var(--pulse-ink-muted)]" />
                  <span className="max-w-[150px] truncate">{selectionLabel}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--pulse-ink-muted)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filter clients</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={isAllClients}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) => {
                  if (checked) onClientSelectionChange(null);
                }}
              >
                All clients
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {clientOptions.map((client) => (
                <DropdownMenuCheckboxItem
                  key={client.id}
                  checked={isAllClients || selectedClientIds.includes(client.id)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) =>
                    toggleClient(client.id, checked === true)
                  }
                >
                  {client.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        className="mt-5 flex items-center gap-3 border-y border-[var(--pulse-line)] py-3 text-xs text-[var(--pulse-ink-secondary)]"
        aria-label={`Ideas ${ideasPeriodTotal}; filings ${filingsPeriodTotal}`}
      >
        <span className="h-0.5 w-6 rounded-full bg-[var(--pulse-data-primary)]" aria-hidden="true" />
        <span>Ideas <strong className="font-semibold text-[var(--pulse-ink)]" style={NUMS}>{ideasPeriodTotal}</strong></span>
        <span className="text-[var(--pulse-ink-muted)]" aria-hidden="true">·</span>
        <span className="h-2 w-2 rounded-full bg-[var(--pulse-data-success)]" aria-hidden="true" />
        <span>Filings <strong className="font-semibold text-[var(--pulse-ink)]" style={NUMS}>{filingsPeriodTotal}</strong></span>
      </div>

      <div
        className="mt-4"
        style={{ height: 190 }}
        role="img"
        aria-label={`${ideasLabel}: ${ideasPeriodTotal} cumulative over the last 3 months. ${filingsPeriodTotal} filings are marked as green dots.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 28, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#F5F5F5" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontFamily: "Instrument Sans", fontSize: 13, fill: "#73736b" }}
              axisLine={{ stroke: "#E8E8E8" }}
              tickLine={false}
              minTickGap={20}
              interval={xAxisInterval}
            />
            <YAxis
              tick={{ fontFamily: "Instrument Sans", fontSize: 13, fill: "#73736b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
            />
            <Tooltip content={<IdeasAndFilingsTooltip />} />
            <Line
              type="stepAfter"
              dataKey="ideas"
              name="Ideas (cumulative)"
              stroke={CHART_NAVY}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: "#FFFFFF", stroke: CHART_NAVY, strokeWidth: 2 }}
            />
            {filingMarkers.map((marker) => (
                <ReferenceDot
                  key={`${marker.day}-${marker.level}`}
                  x={marker.day}
                  y={marker.level}
                  ifOverflow="visible"
                  isFront
                  shape={(props: any) => (
                    <FilingDots
                      {...props}
                      payload={{ filings: marker.filings }}
                    />
                  )}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* --------------------------------- Idea pipeline --------------------------------- */

const PipelinePeriodControl = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options?: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}) => {
  if (!options?.length || !value || !onChange) {
    return <span className="mt-1 block text-xs font-medium text-[var(--pulse-ink-muted)]">{label}</span>;
  }
  return (
    <label className="relative mt-1 inline-flex items-center text-xs font-medium text-[var(--pulse-ink-muted)]">
      <span className="sr-only">Pipeline period</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none border-0 bg-transparent py-0 pl-0 pr-5 font-sans text-xs font-medium text-[var(--pulse-ink-muted)] outline-none focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5" aria-hidden="true" />
    </label>
  );
};

const IdeaPipeline = ({
  submitted,
  reviewPending,
  sentToOC,
  filed,
  granted,
  title = "Idea pipeline",
  onStageClick,
  clientOptions = [],
  selectedClientIds,
  onClientSelectionChange,
  hasError = false,
  onRetry,
  periodLabel,
  periodOptions,
  selectedPeriod,
  onPeriodChange,
  oldestWaitingDays,
  heading = "div",
  loading = false,
}: {
  submitted: number;
  reviewPending: number;
  sentToOC: number;
  filed: number;
  granted: number;
  /** DSN-0002: the window the stages count, shown beside the title ("All time"). */
  periodLabel?: string;
  /** DSN-0002: real server-aggregated windows available to the pipeline. */
  periodOptions?: Array<{ value: string; label: string }>;
  selectedPeriod?: string;
  onPeriodChange?: (value: string) => void;
  /** DSN-0002: the sublabel under Review pending, "oldest waiting 56d". */
  oldestWaitingDays?: number | null;
  /** DSN-0002: render the title as a section heading. */
  heading?: "div" | "h2";
  /** DSN-0002: the counts have not arrived; skeleton rows, never zeros. */
  loading?: boolean;
  /** The numbers did not arrive. Renders a stated failure, never zeros. */
  hasError?: boolean;
  onRetry?: () => void;
  /** "My pipeline" on the inventor dashboard; company-wide default elsewhere. */
  title?: string;
  /** When provided, each stage row links to the filtered list. */
  onStageClick?: (stageKey: string) => void;
  clientOptions?: MotionClientOption[];
  /** Null means every available client is selected. */
  selectedClientIds?: string[] | null;
  onClientSelectionChange?: (clientIds: string[] | null) => void;
}) => {
  const stages: Array<{ key: string; label: string; count: number; color: string; sub?: string }> = [
    { key: "submitted", label: "Submitted", count: submitted, color: "var(--pulse-data-primary)" },
    { key: "review", label: heading === "h2" ? "Review pending" : "Review Pending", count: reviewPending, color: "var(--pl-amber)", sub: oldestWaitingDays ? `oldest waiting ${oldestWaitingDays}d` : undefined },
    { key: "sent_to_oc", label: "Sent to Photon Legal", count: sentToOC, color: "var(--pulse-data-ai)", sub: heading === "h2" ? "with outside counsel" : undefined },
    { key: "filed", label: "Filed", count: filed, color: "var(--pulse-data-cyan)", sub: heading === "h2" ? "usually 1–2 months" : undefined },
    { key: "granted", label: "Granted", count: granted, color: "var(--pulse-data-success)", sub: heading === "h2" ? "company average: 9 months" : undefined },
  ];
  const maxStageCount = Math.max(1, ...stages.map((stage) => stage.count));
  const allClientIds = clientOptions.map((client) => client.id);
  const isAllClients = selectedClientIds == null;
  const selectionLabel = isAllClients
    ? "All clients"
    : selectedClientIds.length === 1
      ? clientOptions.find((client) => client.id === selectedClientIds[0])
          ?.name || "1 client"
      : `${selectedClientIds.length} clients`;

  const toggleClient = (clientId: string, checked: boolean) => {
    if (!onClientSelectionChange) return;
    const current = isAllClients ? [...allClientIds] : [...selectedClientIds];
    const next = checked
      ? [...new Set([...current, clientId])]
      : current.filter((id) => id !== clientId);
    if (next.length === 0) return;
    onClientSelectionChange(
      next.length === allClientIds.length ? null : next,
    );
  };

  if (hasError) {
    return (
      <div className={`${CARD_CLASS} flex h-full min-h-[320px] flex-col`}>
        <div>
          <StatLabel>{title}</StatLabel>
          {heading === "h2" && periodLabel ? (
            <PipelinePeriodControl label={periodLabel} options={periodOptions} value={selectedPeriod} onChange={onPeriodChange} />
          ) : (
            <p className="mt-1 text-xs text-[var(--pulse-ink-muted)]">Ideas by stage</p>
          )}
        </div>
        <CardError onRetry={onRetry} label="Could not load the pipeline." />
      </div>
    );
  }

  return (
    <div className={`${CARD_CLASS} flex h-full min-h-[320px] flex-col`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {heading === "h2" ? <h2 className={PRODUCT_CARD_TITLE_CLASS}>{title}</h2> : <StatLabel>{title}</StatLabel>}
          {heading === "h2" && periodLabel ? (
            <PipelinePeriodControl label={periodLabel} options={periodOptions} value={selectedPeriod} onChange={onPeriodChange} />
          ) : (
            <p className="mt-1 text-xs text-[var(--pulse-ink-muted)]">Ideas by stage</p>
          )}
        </div>
        {periodLabel && heading !== "h2" && (
          <span className="inline-flex h-8 items-center rounded-xs border border-[var(--pulse-line)] bg-[var(--pulse-surface-subtle)] px-2.5 text-xs font-medium text-[var(--pulse-ink-secondary)]" title="The window these counts cover">
            {periodLabel}
          </span>
        )}
        {clientOptions.length > 1 && onClientSelectionChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 min-w-[150px] items-center justify-between gap-3 rounded-sm border border-[var(--pulse-line)] bg-white px-3 text-xs font-medium text-[var(--pulse-ink-secondary)] transition-colors hover:border-[var(--pulse-line-strong)] hover:text-[var(--pulse-ink)]"
                aria-label={`Filter pipeline by client: ${selectionLabel}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[var(--pulse-ink-muted)]" />
                  <span className="max-w-[150px] truncate">{selectionLabel}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--pulse-ink-muted)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filter clients</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={isAllClients}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) => {
                  if (checked) onClientSelectionChange(null);
                }}
              >
                All clients
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {clientOptions.map((client) => (
                <DropdownMenuCheckboxItem
                  key={client.id}
                  checked={isAllClients || selectedClientIds.includes(client.id)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) =>
                    toggleClient(client.id, checked === true)
                  }
                >
                  {client.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {loading ? (
        <div className="mt-5 flex flex-1 flex-col justify-between gap-3" role="status" aria-busy="true" aria-label="Loading the pipeline">
          {stages.map((s) => <div key={s.key} className="h-8 animate-pulse rounded-xs bg-[var(--pulse-surface-subtle)]" />)}
        </div>
      ) : (
      <div className={`relative mt-4 flex flex-col ${heading === "h2" ? "justify-start before:absolute before:bottom-[45px] before:left-[5px] before:top-[17px] before:w-px before:bg-[var(--pulse-line)]" : "flex-1 justify-between"}`}>
        {stages.map((s, i) => {
          if (heading === "h2") {
            const timelineInner = (
              <>
                <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-[var(--pl-navy-2)]">{s.label}</span>
                  {s.sub && <span className="mt-1 block text-xs text-[var(--pulse-ink-muted)]" style={NUMS}>{s.sub}</span>}
                </span>
                <span className="shrink-0 self-center text-lg font-semibold text-[var(--pl-navy-2)]" style={NUMS}>{s.count}</span>
              </>
            );
            const timelineRow = `relative flex min-h-[64px] w-full items-start gap-4 py-3 text-left ${
              i > 0 ? "before:absolute before:left-6 before:right-0 before:top-0 before:h-px before:bg-[var(--pulse-line)]" : ""
            }`;
            return onStageClick ? (
              <button key={s.key} type="button" onClick={() => onStageClick(s.key)} className={`${timelineRow} rounded-xs transition-colors hover:bg-[var(--pulse-surface-subtle)]`}>
                {timelineInner}
              </button>
            ) : (
              <div key={s.key} className={timelineRow}>{timelineInner}</div>
            );
          }
          const inner = (
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--pulse-ink-secondary)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="text-base font-semibold text-[var(--pulse-ink)]" style={NUMS}>{s.count}</span>
              </span>
              {s.sub && (
                <span className="mt-0.5 block text-xs text-[var(--pulse-ink-muted)]" style={NUMS}>{s.sub}</span>
              )}
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[var(--pulse-surface-subtle)]">
                <span
                  className="block h-full rounded-full transition-[width]"
                  style={{
                    width: `${Math.max(6, (s.count / maxStageCount) * 100)}%`,
                    background: s.color,
                  }}
                />
              </span>
            </span>
          );
          const rowCls = `flex w-full items-center gap-3 py-2 ${
            i > 0 ? "border-t border-[var(--pulse-line)]" : ""
          }`;
          return onStageClick ? (
            <button
              key={s.key}
              type="button"
              onClick={() => onStageClick(s.key)}
              className={`${rowCls} rounded-xs text-left transition-colors hover:bg-[var(--pulse-surface-subtle)]`}
            >
              {inner}
            </button>
          ) : (
            <div key={s.key} className={rowCls}>
              {inner}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

/* -------------------------------- Needs your review ------------------------------ */

const QueueScoreChip = ({ score }: { score: number | null | undefined }) => {
  const value = score != null ? (score / 10).toFixed(1) : null;
  return (
    <span
      className="inline-flex shrink-0 items-baseline justify-end whitespace-nowrap text-right text-[13px] font-semibold text-[var(--pulse-ink)]"
      style={NUMS}
    >
      {value ?? "—"}
      <span className="ml-0.5 text-xs font-normal text-[var(--pulse-ink-muted)]">/10</span>
    </span>
  );
};

export type ReviewQueueRow = {
  id: string;
  title: string;
  secondary?: string;
  score?: number | null;
  waitingDays: number;
  submittedAt?: string;
  resubmitted?: boolean;
};

const SUBMITTED_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const NeedsReview = ({
  rows,
  laterCount,
  onOpen,
  onReviewAll,
  onViewAll,
  title = "Needs your review",
  actionLabel = "Review all",
  showScore = true,
  waitingLabel = "waiting",
  hasError = false,
  onRetry,
  v0,
}: {
  /** Ideas waiting on the viewer, oldest first. */
  rows: ReviewQueueRow[];
  /**
   * The queue did not load. An empty list and a failed request both used to
   * render "This queue is clear" — the most reassuring possible way to be
   * wrong about a reviewer's workload.
   */
  hasError?: boolean;
  onRetry?: () => void;
  /** Ideas already past review, for the caught-up empty state. */
  laterCount: number;
  onOpen: (id: string) => void;
  /** Header CTA. Omitted where the role has no "review all" surface. */
  onReviewAll?: () => void;
  /** Where the overflow row goes. Falls back to onReviewAll. */
  onViewAll?: () => void;
  title?: string;
  actionLabel?: string;
  showScore?: boolean;
  waitingLabel?: string;
  /**
   * The Workspace Admin queue of DSN-0002: titled "Review Inventor Ideas", six
   * rows then "Review all", age as "56d" and red only past the aging threshold
   * (with the word "waiting" so colour never carries it alone), a dash with
   * accessible text for an unevaluated idea, the caught-up state's own copy.
   */
  v0?: {
    /** The rows have not arrived yet: skeleton rows, never the caught-up copy. */
    loading?: boolean;
    /** Days after which a wait is overdue. */
    agingThresholdDays: number;
    /** Copy for an empty queue, and where its link goes. */
    empty: { text: string; linkLabel?: string; to?: string };
    onEmptyLink?: () => void;
  };
}) => {
  const [sort, setSort] = React.useState<{ column: "score" | "submitted"; direction: "ascending" | "descending" }>({
    column: "score",
    direction: "descending",
  });
  const oldestWait = Math.max(0, ...rows.map((row) => row.waitingDays));
  // The card sits in a fixed-height dashboard row beside the pipeline. Rendering
  // every queued idea stretched it — 124 rows tall on a real workspace — which
  // dragged the whole grid row with it and distorted the pipeline next to it.
  // Show a card's worth and let the overflow row carry the rest.
  const VISIBLE_ROWS = v0 ? 6 : 5;
  const sortedRows = React.useMemo(() => {
    if (!v0) return rows;
    const direction = sort.direction === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const primary = sort.column === "score"
        ? ((a.score ?? -1) - (b.score ?? -1)) * direction
        : (new Date(a.submittedAt ?? 0).getTime() - new Date(b.submittedAt ?? 0).getTime()) * direction;
      return primary || a.waitingDays - b.waitingDays;
    });
  }, [rows, sort, v0]);
  const visibleRows = sortedRows.slice(0, VISIBLE_ROWS);
  const hiddenCount = sortedRows.length - visibleRows.length;
  const sortBy = (column: "score" | "submitted") => {
    setSort((current) => current.column === column
      ? { column, direction: current.direction === "ascending" ? "descending" : "ascending" }
      : { column, direction: column === "score" ? "descending" : "ascending" });
  };
  const rowColumns = showScore
    ? "grid-cols-[minmax(0,1fr)_120px_64px_94px]"
    : "grid-cols-[minmax(0,1fr)_120px_94px]";

  return (
  <div className={`${CARD_CLASS} relative flex h-full min-h-[320px] flex-col overflow-hidden`}>
    {!v0 && <span
      className="absolute inset-x-0 top-0 h-[3px] rounded-t-md"
      style={{
        background:
          "linear-gradient(90deg, var(--pulse-data-accent) 0 34%, var(--pulse-data-risk) 34% 52%, var(--pulse-data-ai) 52% 70%, var(--pulse-data-cyan) 70% 84%, var(--pulse-data-success) 84% 100%)",
      }}
      aria-hidden="true"
    />}
    <div className="flex items-start justify-between gap-5 border-b border-[var(--pulse-line)] pb-4">
      <div>
        {v0 ? <h2 className={PRODUCT_CARD_TITLE_CLASS}>{title}</h2> : <StatLabel>{title === "Needs your review" ? "Review queue" : title}</StatLabel>}
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--pulse-ink-muted)]">
          {hasError ? <span>Not loaded</span> : v0 ? (
            <span>{v0.loading ? "Loading" : `${rows.length} awaiting decision`}</span>
          ) : (<>
            <span>{rows.length} awaiting decision</span>
            <span aria-hidden="true">·</span>
            <span>Oldest {oldestWait > 0 ? `${oldestWait}d` : "—"}</span>
          </>)}
        </p>
      </div>
      {onReviewAll && (
        <button
          type="button"
          onClick={onReviewAll}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-sm bg-[var(--pulse-brand)] px-3.5 text-xs font-semibold text-[var(--pulse-ink)] shadow-[0_1px_0_rgba(0,0,0,0.08)] transition-colors hover:bg-[var(--pulse-brand-hover)]"
        >
          {actionLabel === "Review all" ? "Open queue" : actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    {hasError ? (
      // Never "all caught up" for a request that failed.
      <CardError onRetry={onRetry} label="Could not load the review queue." />
    ) : v0?.loading ? (
      <div className="mt-3 flex flex-1 flex-col gap-3" role="status" aria-busy="true" aria-label="Loading the queue">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="h-9 animate-pulse rounded-xs bg-[var(--pulse-surface-subtle)]" />
        ))}
      </div>
    ) : rows.length === 0 && v0 ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
        <div className="text-[15px] font-semibold text-[var(--pulse-ink)]">{v0.empty.text}</div>
        {v0.empty.linkLabel && (
          <button
            type="button"
            onClick={v0.onEmptyLink}
            className="text-[13px] font-medium text-[var(--pulse-ink-secondary)] underline underline-offset-2 hover:text-[var(--pulse-ink)]"
          >
            {v0.empty.linkLabel}
          </button>
        )}
      </div>
    ) : rows.length === 0 ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
        <div className="text-base font-semibold text-[#0C0C0C]">
          You're all caught up ✓
        </div>
        <div className="text-xs text-[#727272]">
          {laterCount} idea{laterCount === 1 ? "" : "s"} in later stages
        </div>
      </div>
    ) : v0 ? (
      <div className="mt-2 flex flex-1 flex-col">
        <ProductTooltipProvider delayDuration={150}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs font-medium text-[var(--pulse-ink-muted)]">
              <th scope="col" className="px-3 pb-1 pt-1 font-medium">Ideas</th>
              <th scope="col" className="w-[140px] px-3 pb-1 pt-1 font-medium">Inventor</th>
              <th scope="col" aria-sort={sort.column === "score" ? sort.direction : undefined} className="w-[76px] px-3 pb-1 pt-1 font-medium">
                <button type="button" onClick={() => sortBy("score")} className="ml-auto flex items-center justify-end gap-1 hover:text-[var(--pulse-ink)] focus-visible:rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]">
                  Score
                  {sort.column === "score" && (sort.direction === "descending" ? <ArrowDown className="h-3 w-3" aria-hidden="true" /> : <ArrowUp className="h-3 w-3" aria-hidden="true" />)}
                  {sort.column === "score" && <span className="sr-only">sorted {sort.direction === "descending" ? "highest first" : "lowest first"}</span>}
                </button>
              </th>
              <th scope="col" aria-sort={sort.column === "submitted" ? sort.direction : undefined} className="w-[164px] px-3 pb-1 pt-1 font-medium">
                <button type="button" onClick={() => sortBy("submitted")} className="ml-auto flex items-center justify-end gap-1 hover:text-[var(--pulse-ink)] focus-visible:rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]">
                  Submitted
                  {sort.column === "submitted" && (sort.direction === "ascending" ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />)}
                  {sort.column === "submitted" && <span className="sr-only">sorted {sort.direction === "ascending" ? "oldest first" : "newest first"}</span>}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => {
              const overdue = r.waitingDays > v0.agingThresholdDays;
              const relativeSubmitted = r.waitingDays === 0 ? "today" : `${r.waitingDays} day${r.waitingDays === 1 ? "" : "s"} ago`;
              const absoluteSubmitted = r.submittedAt ? SUBMITTED_DATE.format(new Date(r.submittedAt)) : "date unavailable";
              return (
                <tr
                  key={r.id}
                  className="group cursor-pointer border-t border-[var(--pulse-line)] transition-colors hover:bg-[var(--pulse-surface-subtle)] focus-within:bg-[var(--pulse-surface-subtle)]"
                  onClick={() => onOpen(r.id)}
                >
                  <td className="max-w-0 px-3 py-3">
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(r.id); }}
                      className="block min-h-6 truncate text-sm font-normal text-[var(--pulse-ink)] no-underline group-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)] focus-visible:ring-offset-1"
                      title={r.title}
                    >
                      {r.title}
                    </a>
                  </td>
                  <td className="max-w-0 truncate px-3 py-3 text-xs text-[var(--pulse-ink-secondary)]" title={r.secondary}>{r.secondary}</td>
                  <td className="px-3 py-3 text-right text-[13px] text-[var(--pulse-ink)]" style={NUMS}>
                    {typeof r.score === "number" ? (
                      <span className="font-semibold">{(r.score / 10).toFixed(1)}</span>
                    ) : (
                      <span role="img" aria-label="Not evaluated">—</span>
                    )}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-3 text-right text-xs"
                    style={NUMS}
                    aria-label={`${r.resubmitted ? "resubmitted, " : ""}${relativeSubmitted}${overdue ? ", past 30 day threshold" : ""}, submitted ${absoluteSubmitted}`}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {r.resubmitted && (
                        <ProductTooltip>
                          <ProductTooltipTrigger asChild>
                            <span tabIndex={0} className="inline-flex text-[var(--pulse-ink-muted)] focus-visible:rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]">
                              <RotateCcw className="h-3 w-3" aria-hidden="true" />
                              <span className="sr-only">Resubmitted, </span>
                            </span>
                          </ProductTooltipTrigger>
                          <ProductTooltipContent side="top" className="text-xs">Resubmitted</ProductTooltipContent>
                        </ProductTooltip>
                      )}
                      <ProductTooltip>
                        <ProductTooltipTrigger asChild>
                          <span tabIndex={0} className={`${overdue ? "font-medium text-[var(--pl-red-text)]" : "font-normal text-[var(--pulse-ink-muted)]"} focus-visible:rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]`}>
                            {relativeSubmitted}
                          </span>
                        </ProductTooltipTrigger>
                        <ProductTooltipContent side="top" className="text-xs">{absoluteSubmitted}</ProductTooltipContent>
                      </ProductTooltip>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </ProductTooltipProvider>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={onViewAll ?? onReviewAll ?? (() => onOpen(rows[0].id))}
            className="mt-auto flex w-full items-center justify-between gap-3 rounded-xs border-t border-[var(--pulse-line)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--pulse-ink-secondary)] transition-colors hover:bg-[var(--pulse-surface-subtle)]"
          >
            <span style={NUMS}>Showing {visibleRows.length} of {rows.length}</span>
            <span className="text-xs text-[var(--pulse-ink-muted)]">Review all →</span>
          </button>
        )}
      </div>
    ) : (
      <div className="mt-2 flex flex-1 flex-col">
        <div className={`grid ${rowColumns} gap-3 px-3 pb-1 pt-1 text-xs font-medium text-[var(--pulse-ink-muted)]`}>
          <span>Ideas</span>
          <span>Inventor</span>
          {showScore && <span className="text-right">Score</span>}
          <span className="text-right">Age</span>
        </div>
        {visibleRows.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onOpen(r.id)}
            className={`grid min-h-11 ${rowColumns} w-full items-center gap-3 rounded-xs px-3 py-2.5 text-left transition-colors hover:bg-[var(--pulse-surface-subtle)] ${i > 0 ? "border-t border-[var(--pulse-line)]" : ""}`}
          >
            <span
              className="min-w-0 truncate text-[13px] font-medium text-[var(--pulse-ink)]"
              title={r.title}
            >
              {r.title}
            </span>
            <span className="truncate text-xs text-[var(--pulse-ink-secondary)]">
              {r.secondary}
            </span>
            {showScore && <QueueScoreChip score={r.score} />}
            <span className="inline-flex items-center justify-end whitespace-nowrap text-right text-xs text-[var(--pulse-ink-muted)]" style={NUMS}>
              {waitingLabel} {r.waitingDays}d
            </span>
          </button>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={onViewAll ?? onReviewAll ?? (() => onOpen(rows[0].id))}
            className="mt-auto flex w-full items-center justify-between gap-3 rounded-xs border-t border-[var(--pulse-line)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--pulse-ink-secondary)] transition-colors hover:bg-[var(--pulse-surface-subtle)]"
          >
            <span style={NUMS}>{hiddenCount}+ pending {hiddenCount === 1 ? "action" : "actions"}</span>
            <span className="text-xs text-[var(--pulse-ink-muted)]">{actionLabel} →</span>
          </button>
        )}
      </div>
    )}
  </div>
  );
};

/* ----------------------------------- My Ideas ----------------------------------- */

// Chip pairs match the Patents table chip system: tinted wash (marker @ 8%),
// square marker, mono caps. Amber = action pending, blue = in-flight,
// green = terminal success, red = blocked, grey = draft.
const IDEA_CHIPS: Record<string, { label: string; marker: string; text: string }> = {
  IN_DRAFT: { label: "In Draft", marker: "#727272", text: "#444444" },
  SENT_TO_IHC: { label: "Submitted", marker: "#11103C", text: "#11103C" },
  UNDER_REVIEW: { label: "Review Pending", marker: "#F9B418", text: "#7E5A00" },
  UPDATE_REQUEST: { label: "Update Requested", marker: "#F9B418", text: "#7E5A00" },
  UPDATE_REQUEST_BY_OC: { label: "Update Requested", marker: "#F9B418", text: "#7E5A00" },
  SEND_TO_OC: { label: "Sent to Photon Legal", marker: "#7057C7", text: "#5943A8" },
  FILED: { label: "Filed", marker: "#25A9B8", text: "#14717C" },
  GRANTED: { label: "Granted", marker: "#2F8D70", text: "#226D57" },
  REJECT_BY_IHC: { label: "Rejected", marker: "#C96558", text: "#98443A" },
  REJECT_BY_OC: { label: "Rejected", marker: "#C96558", text: "#98443A" },
};

const IdeaStatusChip = ({ status }: { status?: string }) => {
  const meta =
    IDEA_CHIPS[status?.toUpperCase() ?? ""] ??
    ({ label: status || "—", marker: "#727272", text: "#444444" } as const);
  return (
    <ProductChip
      kind="status"
      marker
      markerColor={meta.marker}
      textColor={meta.text}
    >
      {meta.label}
    </ProductChip>
  );
};

const daysAgo = (date?: string) => {
  if (!date) return null;
  const d = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 86400000),
  );
  return d;
};

type MyIdea = {
  id: string;
  title: string;
  reference_number?: string;
  status?: string;
  score?: number | null;
  submission_date?: string;
  IdeaPatentLink?: { patent?: { id?: string; application_number?: string } }[];
};

const inventorStep = (idea: MyIdea) => {
  switch (idea.status) {
    case "IN_DRAFT": return typeof idea.score === "number"
      ? { state: "Evaluation available", meaning: "Your assessment is ready. You can submit for review at any score.", action: "Review idea" }
      : { state: "In draft", meaning: "Continue your disclosure when you’re ready.", action: "Continue draft" };
    case "UPDATE_REQUEST": return { state: "Changes requested", meaning: "Your Workspace Admin has feedback for you to address.", action: "Review feedback" };
    case "SENT_TO_IHC":
    case "UNDER_REVIEW": return { state: "In review", meaning: "Your Workspace Admin has the next step. No action needed from you.", action: "View status" };
    case "SEND_TO_OC": return { state: "Sent to Photon Legal", meaning: "Photon Legal is preparing the next steps for filing.", action: "View status" };
    case "FILED": return { state: "Filed", meaning: "Your idea has reached patent filing.", action: "View filing" };
    case "REJECT_BY_IHC": return { state: "Not proceeding", meaning: "Your Workspace Admin has recorded the decision and its reason.", action: "View decision" };
    default: return { state: "Idea saved", meaning: "Open your idea to see its latest status.", action: "View idea" };
  }
};

const MyIdeas = ({ ideas, onSubmit, onOpenIdea, onViewAll, onOpenPatent, onSendIdea, loading = false, hasError = false, onRetry }: {
  ideas: MyIdea[];
  onSubmit: () => void;
  onOpenIdea: (id: string) => void;
  onViewAll: () => void;
  onOpenPatent: (patentId: string) => void;
  onSendIdea?: (id: string) => Promise<void>;
  loading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}) => {
  const [sending, setSending] = React.useState<MyIdea | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sendError, setSendError] = React.useState(false);
  const priority = (idea: MyIdea) => idea.status === "UPDATE_REQUEST" ? 0 : idea.status === "IN_DRAFT" ? 1 : 2;
  const recent = [...ideas].sort((a, b) => priority(a) - priority(b)).slice(0, 5);
  return (
    <section data-inventor-home aria-labelledby="inventor-ideas-heading" className="min-w-0">
      <PageHeader title="Home" actions={<>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="md:hidden">Navigation <ChevronDown aria-hidden="true" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link to="/">Home</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/ideas">My ideas</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/patents">Patents</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" onClick={onSubmit}>Submit an idea <ArrowRight aria-hidden="true" /></Button>
      </>} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="inventor-ideas-heading" className="text-2xl font-semibold tracking-tight text-[var(--pulse-ink)]">My ideas</h2>
          <p className="mt-2 max-w-prose text-sm text-[var(--pulse-ink-muted)]">Start a draft with your notes. You choose when to submit for review.</p>
        </div>
      </div>
      <div className="mt-6 min-h-80">
        {hasError ? <div role="alert" className="flex min-h-64 flex-col items-start justify-center gap-3 border-y border-[var(--pulse-line)]">
          <h3 className="text-base font-semibold">Your ideas couldn’t be loaded</h3>
          <p className="text-sm text-[var(--pulse-ink-muted)]">Try again, or start a new idea above.</p>
          <Button size="sm" variant="outline" onClick={onRetry}>Retry ideas</Button>
        </div> : loading ? <div role="status" aria-label="Loading your ideas" className="space-y-6 py-4">
          {[0, 1, 2].map((n) => <div key={n} className="space-y-3"><span aria-hidden="true" className="block rounded-sm bg-muted motion-safe:animate-pulse h-5 w-2/3" /><span aria-hidden="true" className="block rounded-sm bg-muted motion-safe:animate-pulse h-4 w-1/2" /></div>)}
        </div> : recent.length === 0 ? <div className="flex min-h-80 flex-col items-start justify-center border-y border-[var(--pulse-line)] py-8">
          <h3 className="text-xl font-semibold text-[var(--pulse-ink)]">Every idea starts somewhere.</h3>
          <p className="mt-3 max-w-prose text-base text-[var(--pulse-ink-secondary)]">A rough note, a technical document or a few slides is enough to begin.</p>
          <p className="mt-3 text-sm text-[var(--pulse-ink-muted)]">Your drafts and review updates will appear here.</p>
        </div> : <ul aria-label="Your ideas" className="divide-y divide-[var(--pulse-line)] border-y border-[var(--pulse-line)]">
          {recent.map((idea) => {
            const step = inventorStep(idea);
            const patent = idea.IdeaPatentLink?.[0]?.patent;
            return <li key={idea.id} className="flex min-w-0 flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--pulse-ink-muted)]">
                  {idea.reference_number && <span>{idea.reference_number}</span>}
                  <span className="font-medium text-[var(--pulse-ink-secondary)]">{step.state}</span>
                </div>
                <h3 className="break-words text-base font-semibold text-[var(--pulse-ink)]">{idea.title}</h3>
                <p className="mt-1 text-sm text-[var(--pulse-ink-muted)]">{step.meaning}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <Button variant="ghost" size="sm" onClick={() => patent?.id ? onOpenPatent(patent.id) : onOpenIdea(idea.id)} aria-label={`${step.action}: ${idea.title}`}>
                  {step.action}<ArrowRight aria-hidden="true" />
                </Button>
                {idea.status === "IN_DRAFT" && typeof idea.score === "number" && onSendIdea && <Button variant="outline" size="sm" onClick={() => { setSending(idea); setSendError(false); }}>Submit for review</Button>}
              </div>
            </li>;
          })}
        </ul>}
        {!loading && !hasError && ideas.length > 0 && <Button variant="link" size="sm" className="mt-3 px-0" onClick={onViewAll}>View all my ideas <ArrowRight aria-hidden="true" /></Button>}
      </div>
      <Dialog open={!!sending} onOpenChange={(open) => { if (!open && !busy) setSending(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit this idea for review?</DialogTitle><DialogDescription>Your Workspace Admin will review your disclosure and decide the next step. Evaluation is advisory; every score can be submitted.</DialogDescription></DialogHeader>
          <p className="text-sm font-medium">{sending?.title}</p>
          {sendError && <p role="alert" className="text-sm text-destructive">Your idea wasn’t submitted. Your draft is still saved. Try again.</p>}
          <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setSending(null)}>Keep editing</Button><Button disabled={busy} onClick={async () => {
            if (!sending || !onSendIdea) return;
            setBusy(true); setSendError(false);
            try { await onSendIdea(sending.id); setSending(null); } catch { setSendError(true); } finally { setBusy(false); }
          }}>{busy ? "Submitting…" : "Submit for review"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

/* ----------------------------- Portfolio composition ----------------------------- */

export type PortfolioStatus = {
  label: string;
  count: number;
  color?: string;
};

const PORTFOLIO_STATUS_COLORS = [
  "#2F8D70",
  "var(--pl-amber)",
  "var(--pl-slate)",
  "#7057C7",
  "#25A9B8",
  "#C96558",
];

const PortfolioComposition = ({
  total,
  granted,
  pending,
  inactive,
  statuses,
  hasError = false,
  onRetry,
}: {
  total: number;
  granted: number;
  pending: number;
  inactive: number;
  /** The numbers did not arrive. Renders a stated failure, never zeros. */
  hasError?: boolean;
  onRetry?: () => void;
  /** Optional client-specific legal statuses. The compact layout supports 3–6 cleanly. */
  statuses?: PortfolioStatus[];
}) => {
  const statusSource = statuses?.length
    ? statuses
    : [
        { label: "Granted", count: granted },
        { label: "Pending", count: pending },
        { label: "Inactive", count: inactive },
      ];
  const segments = statusSource.map((status, index) => ({
    ...status,
    color: status.color ?? PORTFOLIO_STATUS_COLORS[index % PORTFOLIO_STATUS_COLORS.length],
  }));
  const hasData = total > 0;
  const pieData = hasData
    ? segments.filter((s) => s.count > 0)
    : [{ label: "Empty", count: 1, color: "#F5F5F5" }];
  // The legend used to render EVERY segment, so a portfolio with nothing granted
  // read "Granted 0 · 0%" — a row whose only content is its own absence, and a
  // reader has to check each one to learn there is nothing there. The donut has
  // always filtered; the legend now agrees with it.
  //
  // Filtered from `segments` AFTER colours are assigned by index above, or the
  // donut and the legend would disagree about which colour means what. When the
  // portfolio is empty the donut shows its grey placeholder and this is empty
  // too — nothing to caption.
  const legend = segments.filter((s) => s.count > 0);
  const useCompactLegend = legend.length > 3;

  if (hasError) {
    return (
      <div className={`${CARD_CLASS} flex h-full min-h-0 flex-col`}>
        <div>
          <StatLabel>Patent portfolio</StatLabel>
          <p className="mt-1 text-xs text-[var(--pulse-ink-muted)]">By legal status</p>
        </div>
        <CardError onRetry={onRetry} label="Could not load the portfolio." />
      </div>
    );
  }

  return (
    <div className={`${CARD_CLASS} flex h-full min-h-0 flex-col`}>
      <div>
        <StatLabel>Patent portfolio</StatLabel>
        <p className="mt-1 text-xs text-[var(--pulse-ink-muted)]">By legal status</p>
      </div>
      <div className="relative mx-auto mt-1" style={{ width: 160, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={75}
              startAngle={90}
              endAngle={-270}
              stroke="#FFFFFF"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {pieData.map((seg) => (
                <Cell key={seg.label} fill={seg.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-[32px] font-semibold leading-none text-[#0C0C0C]"
            style={NUMS}
          >
            {total.toLocaleString()}
          </div>
          <div className="mt-1 text-[13px] font-medium text-[#727272]">
            Total patents
          </div>
        </div>
      </div>
      <div className={`mt-2 grid ${useCompactLegend ? "grid-cols-2 gap-x-5" : "grid-cols-1"}`}>
        {legend.map((seg, i) => (
          <div
            key={seg.label}
            className={`flex min-w-0 items-center justify-between gap-3 py-2 ${
              useCompactLegend
                ? i > 1 ? "border-t border-[#E8E8E8]" : ""
                : i > 0 ? "border-t border-[#E8E8E8]" : ""
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-[#0C0C0C]">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: seg.color }}
              />
              <span className="truncate" title={seg.label}>{seg.label}</span>
            </span>
            <span className="shrink-0 text-right text-[13px] font-semibold text-[#0C0C0C]" style={NUMS}>
              {seg.count.toLocaleString()}
              <span className="ml-1 font-normal text-[#727272]">
                · {total > 0 ? Math.round((seg.count / total) * 100) : 0}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export {
  PortfolioMotion,
  IdeaPipeline,
  PortfolioComposition,
  MyIdeas,
  NeedsReview,
};
