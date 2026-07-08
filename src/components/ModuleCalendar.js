// Shared, prop-driven calendar used by the Training and Communications modules.
// Keep this file IDENTICAL in both modules (openimis-fe-training_js and
// openimis-fe-communications_js). It is presentational only: the page supplies the
// events, status colours, labels, range-fetch callback and open/create handlers.
import React, {
  useEffect, useState, useMemo,
} from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Paper, Typography, Button, IconButton, Tooltip, Popover, Box,
} from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import ViewListIcon from '@material-ui/icons/ViewList';
import AddIcon from '@material-ui/icons/Add';
import EventBusyIcon from '@material-ui/icons/EventBusy';
import { useTranslations, useModulesManager, ProgressOrError } from '@openimis/fe-core';
import {
  startOfMonth, endOfMonth, startOfWeek, addDays,
} from '../utils/dates';

/* ── colour helpers ── */
const hexToRgb = (hex) => {
  let h = (hex || '#9e9e9e').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgba = (hex, a) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const darken = (hex, amt) => {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => Math.max(0, Math.round(c * (1 - amt)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

const DOW_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const VIEWS = ['month', 'week', 'agenda'];

const useStyles = makeStyles((theme) => ({
  // The page wraps this in `theme.page` (the openIMIS convention) which supplies
  // the standard 16px page inset; add a little extra breathing room at the top
  // so the title clears the app bar.
  root: { paddingTop: theme.spacing(2) },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: theme.spacing(2), marginBottom: theme.spacing(3.5), flexWrap: 'wrap',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: theme.spacing(1.5) },
  iconWrap: {
    width: 44, height: 44, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: rgba(theme.palette.primary.main, 0.12), color: theme.palette.primary.main,
  },
  title: { fontWeight: 600, lineHeight: 1.15 },
  subtitle: { color: theme.palette.text.secondary, fontSize: 13 },
  count: {
    background: rgba(theme.palette.primary.main, 0.1), color: theme.palette.primary.dark || theme.palette.primary.main,
    borderRadius: 999, padding: '3px 12px', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
  },
  card: {
    display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 10,
    minHeight: 'calc(100vh - 285px)',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: theme.spacing(1, 1.5), gap: theme.spacing(1), flexWrap: 'wrap',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  navGroup: { display: 'flex', alignItems: 'center', gap: theme.spacing(0.5) },
  rangeLabel: { fontWeight: 600, marginLeft: theme.spacing(1), minWidth: 150 },
  seg: {
    display: 'inline-flex', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, overflow: 'hidden',
  },
  segBtn: {
    border: 'none', borderRadius: 0, padding: '5px 12px', minWidth: 0,
    textTransform: 'none', fontWeight: 500,
  },
  segActive: { background: theme.palette.primary.main, color: theme.palette.primary.contrastText },
  legend: {
    display: 'flex', flexWrap: 'wrap', gap: theme.spacing(0.75),
    padding: theme.spacing(1, 1.5), borderBottom: `1px solid ${theme.palette.divider}`,
  },
  legendChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
    borderRadius: 999, border: `1px solid ${theme.palette.divider}`, cursor: 'pointer',
    fontSize: 12, userSelect: 'none', transition: 'opacity 150ms, background 150ms',
    '&:hover': { background: theme.palette.action.hover },
  },
  legendOff: { opacity: 0.4 },
  legendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  gridHead: { display: 'flex', borderBottom: `1px solid ${theme.palette.divider}` },
  dow: {
    flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 11.5, letterSpacing: 0.4,
    textTransform: 'uppercase', color: theme.palette.text.secondary, padding: theme.spacing(0.75, 0),
  },
  dowWeekend: { color: theme.palette.text.disabled },
  body: { flex: 1, display: 'flex', flexDirection: 'column' },
  weekRow: { display: 'flex', flex: 1, minHeight: 104 },
  cell: {
    flex: 1, minWidth: 0, borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`, padding: theme.spacing(0.5),
    display: 'flex', flexDirection: 'column', gap: 2, userSelect: 'none',
    transition: 'background 120ms',
    '&:hover': { background: theme.palette.action.hover },
  },
  cellOther: { background: theme.palette.action.hover },
  cellWeekend: { background: rgba('#607d8b', 0.04) },
  cellToday: { background: rgba(theme.palette.primary.main, 0.06) },
  dayNum: {
    fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500,
    alignSelf: 'flex-start', padding: '1px 2px',
  },
  dayNumOther: { color: theme.palette.text.disabled },
  dayNumToday: {
    background: theme.palette.primary.main, color: theme.palette.primary.contrastText,
    borderRadius: '50%', width: 22, height: 22, lineHeight: '22px', textAlign: 'center', padding: 0,
  },
  event: {
    display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
    borderRadius: 4, padding: '2px 6px', fontSize: 11.5, lineHeight: 1.35,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    transition: 'transform 120ms, box-shadow 120ms',
    '&:hover': { transform: 'translateY(-1px)', boxShadow: theme.shadows[2] },
    '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
  },
  eventCode: { fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginRight: 4 },
  more: {
    fontSize: 11, color: theme.palette.primary.main, cursor: 'pointer', fontWeight: 600,
    padding: '0 4px', alignSelf: 'flex-start', background: 'none', border: 'none',
  },
  popDay: { padding: theme.spacing(1.5), maxWidth: 320 },
  popTitle: { fontWeight: 600, marginBottom: theme.spacing(1) },
  agenda: { padding: theme.spacing(1, 0), overflowY: 'auto' },
  agendaDay: { display: 'flex', gap: theme.spacing(2), padding: theme.spacing(1, 2), borderBottom: `1px solid ${theme.palette.divider}` },
  agendaDate: { minWidth: 96, textAlign: 'right', color: theme.palette.text.secondary },
  agendaDateNum: { fontSize: 22, fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1 },
  agendaList: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  agendaRow: {
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px',
    borderRadius: 6, border: `1px solid ${theme.palette.divider}`,
    '&:hover': { background: theme.palette.action.hover },
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: theme.palette.text.secondary, gap: theme.spacing(1.5), padding: theme.spacing(6),
  },
}));

function ModuleCalendar({
  moduleName, events, fetching, error, onFetchRange,
  statusColors, statusList, onOpenEvent, onCreate, title, subtitle,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(moduleName, modulesManager);
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(new Date());
  const [hidden, setHidden] = useState(() => new Set());
  const [dayPop, setDayPop] = useState(null); // { anchorEl, day, events }
  const today = new Date();

  const range = useMemo(() => {
    if (view === 'week') { const from = startOfWeek(cursor); return { from, to: addDays(from, 7) }; }
    if (view === 'agenda') return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
    const from = startOfWeek(startOfMonth(cursor));
    return { from, to: addDays(from, 42) };
  }, [view, cursor]);

  useEffect(() => { onFetchRange(range.from, range.to); }, [range.from && range.from.getTime(), range.to && range.to.getTime()]);

  const tr = (status) => formatMessage(`status.${status}`);
  const color = (status) => statusColors[status] || '#9e9e9e';

  const visibleEvents = useMemo(
    () => (events || []).filter((e) => !hidden.has(e.status)),
    [events, hidden],
  );
  const eventsByDay = useMemo(() => {
    const map = {};
    visibleEvents.forEach((e) => {
      const key = new Date(e.startDatetime).toDateString();
      (map[key] = map[key] || []).push(e);
    });
    return map;
  }, [visibleEvents]);

  const move = (dir) => {
    const d = new Date(cursor);
    if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const rangeLabel = view === 'week'
    ? `${startOfWeek(cursor).toLocaleDateString()} – ${addDays(startOfWeek(cursor), 6).toLocaleDateString()}`
    : cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const toggleStatus = (s) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(s)) next.delete(s); else next.add(s);
    return next;
  });

  const renderEvent = (e, dense = true) => (
    <button
      type="button"
      key={e.id}
      className={classes.event}
      style={{ background: rgba(color(e.status), 0.14), color: darken(color(e.status), 0.35), borderLeft: `3px solid ${color(e.status)}` }}
      title={`${e.code} · ${e.title} — ${tr(e.status)}`}
      onClick={() => onOpenEvent(e)}
      aria-label={`${e.code} ${e.title}, ${tr(e.status)}`}
    >
      <span className={classes.eventCode}>{e.code}</span>
      {dense ? e.title : <span>{e.title} · <em>{tr(e.status)}</em></span>}
    </button>
  );

  const renderCell = (day, inMonth) => {
    const isToday = sameDay(day, today);
    const isWeekend = [0, 6].includes(day.getDay());
    const list = eventsByDay[day.toDateString()] || [];
    const max = view === 'week' ? 99 : 3;
    const cls = [classes.cell];
    if (!inMonth) cls.push(classes.cellOther);
    else if (isToday) cls.push(classes.cellToday);
    else if (isWeekend) cls.push(classes.cellWeekend);
    return (
      <div className={cls.join(' ')} key={day.toISOString()}>
        <span
          className={[classes.dayNum, isToday ? classes.dayNumToday : '', !inMonth ? classes.dayNumOther : ''].join(' ')}
          {...(isToday ? { 'aria-current': 'date' } : {})}
        >
          {day.getDate()}
        </span>
        {list.slice(0, max).map((e) => renderEvent(e))}
        {list.length > max && (
          <button
            type="button"
            className={classes.more}
            onClick={(ev) => setDayPop({ anchorEl: ev.currentTarget, day, events: list })}
          >
            {formatMessageWithValues('calendar.more', { count: list.length - max })}
          </button>
        )}
      </div>
    );
  };

  const monthWeeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(range.from, w * 7 + d)));
  const weekDays = Array.from({ length: 7 }, (_, d) => addDays(startOfWeek(cursor), d));

  const agendaGroups = useMemo(() => {
    const sorted = [...visibleEvents].sort((a, b) => new Date(a.startDatetime) - new Date(b.startDatetime));
    const groups = [];
    sorted.forEach((e) => {
      const key = new Date(e.startDatetime).toDateString();
      let g = groups.find((x) => x.key === key);
      if (!g) { g = { key, day: new Date(e.startDatetime), items: [] }; groups.push(g); }
      g.items.push(e);
    });
    return groups;
  }, [visibleEvents]);

  const isEmpty = !fetching && !error && visibleEvents.length === 0;

  return (
    <div className={classes.root}>
      {/* Header */}
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <div className={classes.iconWrap}><CalendarTodayIcon /></div>
          <div>
            <Typography variant="h5" className={classes.title}>{title}</Typography>
            {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!fetching && !error && (
            <span className={classes.count}>
              {formatMessageWithValues('calendar.count', { count: visibleEvents.length })}
            </span>
          )}
          {onCreate && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onCreate} disableElevation>
              {formatMessage('calendar.new')}
            </Button>
          )}
        </div>
      </div>

      <Paper className={classes.card}>
        {/* Toolbar */}
        <div className={classes.toolbar}>
          <div className={classes.navGroup}>
            <IconButton size="small" onClick={() => move(-1)} aria-label={formatMessage('calendar.prev')}><ChevronLeft /></IconButton>
            <IconButton size="small" onClick={() => move(1)} aria-label={formatMessage('calendar.next')}><ChevronRight /></IconButton>
            <Button size="small" onClick={() => setCursor(new Date())}>{formatMessage('calendar.today')}</Button>
            <Typography variant="subtitle1" className={classes.rangeLabel}>{rangeLabel}</Typography>
          </div>
          <div className={classes.seg}>
            {VIEWS.map((v) => (
              <Button
                key={v}
                className={`${classes.segBtn} ${view === v ? classes.segActive : ''}`}
                startIcon={v === 'month' ? <ViewModuleIcon /> : v === 'week' ? <ViewWeekIcon /> : <ViewListIcon />}
                onClick={() => setView(v)}
              >
                {formatMessage(`calendar.${v}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Legend / filter */}
        <div className={classes.legend} role="group" aria-label={formatMessage('calendar.statusFilter')}>
          {statusList.map((s) => (
            <span
              key={s}
              className={`${classes.legendChip} ${hidden.has(s) ? classes.legendOff : ''}`}
              onClick={() => toggleStatus(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleStatus(s); }}
              aria-pressed={!hidden.has(s)}
            >
              <span className={classes.legendDot} style={{ background: color(s) }} />
              {tr(s)}
            </span>
          ))}
        </div>

        <ProgressOrError progress={fetching} error={error} />

        {!error && !fetching && (
          isEmpty ? (
            <div className={classes.empty}>
              <EventBusyIcon style={{ fontSize: 56, opacity: 0.5 }} />
              <Typography>{formatMessageWithValues('calendar.empty', { range: rangeLabel })}</Typography>
              {onCreate && (
                <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={onCreate}>
                  {formatMessage('calendar.new')}
                </Button>
              )}
            </div>
          ) : view === 'agenda' ? (
            <div className={classes.agenda}>
              {agendaGroups.map((g) => (
                <div className={classes.agendaDay} key={g.key}>
                  <div className={classes.agendaDate}>
                    <div className={classes.agendaDateNum}>{g.day.getDate()}</div>
                    <div>{g.day.toLocaleDateString(undefined, { weekday: 'short', month: 'short' })}</div>
                  </div>
                  <div className={classes.agendaList}>
                    {g.items.map((e) => (
                      <div
                        className={classes.agendaRow}
                        key={e.id}
                        onClick={() => onOpenEvent(e)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') onOpenEvent(e); }}
                      >
                        <span className={classes.legendDot} style={{ background: color(e.status) }} />
                        <span className={classes.eventCode}>{e.code}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                        <span style={{ color: darken(color(e.status), 0.25), fontSize: 12, fontWeight: 600 }}>{tr(e.status)}</span>
                        <span style={{ color: '#888', fontSize: 12 }}>
                          {new Date(e.startDatetime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={classes.body}>
              <div className={classes.gridHead}>
                {DOW_KEYS.map((k, i) => (
                  <div key={k} className={`${classes.dow} ${[5, 6].includes(i) ? classes.dowWeekend : ''}`}>
                    {formatMessage(`calendar.dow.${k}`)}
                  </div>
                ))}
              </div>
              {(view === 'month' ? monthWeeks : [weekDays]).map((wk, i) => (
                <div className={classes.weekRow} key={i} style={view === 'week' ? { minHeight: 320 } : {}}>
                  {wk.map((day) => renderCell(day, view === 'week' || day.getMonth() === cursor.getMonth()))}
                </div>
              ))}
            </div>
          )
        )}
      </Paper>

      {/* "+N more" day popover */}
      <Popover
        open={Boolean(dayPop)}
        anchorEl={dayPop && dayPop.anchorEl}
        onClose={() => setDayPop(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {dayPop && (
          <Box className={classes.popDay}>
            <Typography className={classes.popTitle}>
              {dayPop.day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dayPop.events.map((e) => renderEvent(e, false))}
            </div>
          </Box>
        )}
      </Popover>
    </div>
  );
}

export default ModuleCalendar;
