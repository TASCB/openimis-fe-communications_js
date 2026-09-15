import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip,
  TextField, Checkbox, Link, MenuItem,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { useModulesManager, useTranslations, journalize } from '@openimis/fe-core';
import {
  fetchActivityMediaHouses, saveActivityMediaHouse, deleteActivityMediaHouse,
} from '../actions';
import MediaHousePicker from '../pickers/MediaHousePicker';
import JournalistPicker from '../pickers/JournalistPicker';
import { CoverageTypePicker } from '../pickers/ConstantPickers';
import { RATING_MIN, RATING_MAX } from '../constants';

const BLANK = { mediaHouse: null, journalist: null, invited: true, attended: false, reported: false, coverageType: null, coverageUrl: '', coverageQuality: '' };

function MediaPanel({
  activityId, readOnly, activityMediaHouses, submittingMutation, mutation,
  fetchActivityMediaHouses, saveActivityMediaHouse, deleteActivityMediaHouse, journalize,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(BLANK);
  const prev = useRef();

  useEffect(() => { if (activityId) fetchActivityMediaHouses(activityId); }, [activityId]);
  useEffect(() => {
    if (prev.current && !submittingMutation) {
      journalize(mutation);
      if (activityId) fetchActivityMediaHouses(activityId);
    }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const save = (item, patch, label) => saveActivityMediaHouse({
    id: item.id,
    activityId,
    mediaHouseId: item.mediaHouse?.id,
    journalistId: item.journalist?.id,
    invited: item.invited,
    attended: item.attended,
    reported: item.reported,
    coverageType: item.coverageType,
    coverageUrl: item.coverageUrl,
    coverageQuality: item.coverageQuality,
    ...patch,
  }, label);

  const add = () => {
    if (!row.mediaHouse) return;
    saveActivityMediaHouse({
      activityId,
      mediaHouseId: row.mediaHouse.id,
      journalistId: row.journalist?.id,
      invited: row.invited,
      attended: row.attended,
      reported: row.reported,
      coverageType: row.coverageType,
      coverageUrl: row.coverageUrl,
      coverageQuality: row.coverageQuality === '' ? null : Number(row.coverageQuality),
    }, formatMessage('communications.media.add'));
    setRow(BLANK);
  };

  const ratingOptions = [];
  for (let i = RATING_MIN; i <= RATING_MAX; i += 1) ratingOptions.push(i);

  return (
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>{formatMessage('communications.media.house')}</TableCell>
        <TableCell>{formatMessage('communications.media.filedBy')}</TableCell>
        <TableCell padding="checkbox">{formatMessage('communications.media.invited')}</TableCell>
        <TableCell padding="checkbox">{formatMessage('communications.media.attended')}</TableCell>
        <TableCell padding="checkbox">{formatMessage('communications.media.reported')}</TableCell>
        <TableCell>{formatMessage('communications.coverageType')}</TableCell>
        <TableCell>{formatMessage('communications.media.coverageUrl')}</TableCell>
        <TableCell>{formatMessage('communications.media.quality')}</TableCell>
        <TableCell />
      </TableRow></TableHead>
      <TableBody>
        {(activityMediaHouses ?? []).map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              {c.mediaHouse?.name}
              {c.mediaHouse?.category?.medium && (
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {formatMessage(`communications.medium.${c.mediaHouse.category.medium}`)}
                </div>
              )}
            </TableCell>
            <TableCell>
              <JournalistPicker readOnly={readOnly} value={c.journalist}
                mediaHouseId={c.mediaHouse?.id ?? null}
                onChange={(v) => save(c, { journalistId: v?.id ?? null }, formatMessage('communications.media.update'))} />
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox color="primary" disabled={readOnly} checked={!!c.invited}
                onChange={(e) => save(c, { invited: e.target.checked }, formatMessage('communications.media.update'))} />
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox color="primary" disabled={readOnly} checked={!!c.attended}
                onChange={(e) => save(c, { attended: e.target.checked }, formatMessage('communications.media.update'))} />
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox color="primary" disabled={readOnly} checked={!!c.reported}
                onChange={(e) => save(c, { reported: e.target.checked }, formatMessage('communications.media.update'))} />
            </TableCell>
            <TableCell>{c.coverageType ? formatMessage(`communications.coverageType.${c.coverageType}`) : ''}</TableCell>
            <TableCell>
              {c.coverageUrl
                ? <Link href={c.coverageUrl} target="_blank" rel="noopener">{formatMessage('communications.media.openCoverage')}</Link>
                : ''}
            </TableCell>
            <TableCell>
              <TextField select disabled={readOnly} value={c.coverageQuality ?? ''} style={{ minWidth: 64 }}
                onChange={(e) => save(c, { coverageQuality: e.target.value === '' ? null : Number(e.target.value) },
                  formatMessage('communications.media.update'))}>
                <MenuItem value="">-</MenuItem>
                {ratingOptions.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </TableCell>
            <TableCell>{!readOnly && (
              <Tooltip title={formatMessage('deleteButton.tooltip')}>
                <IconButton size="small" onClick={() => deleteActivityMediaHouse(c, formatMessage('communications.media.delete'))}><DeleteIcon /></IconButton>
              </Tooltip>)}
            </TableCell>
          </TableRow>
        ))}
        {!readOnly && (
          <TableRow>
            <TableCell>
              <MediaHousePicker withLabel value={row.mediaHouse} onChange={(v) => setRow({ ...row, mediaHouse: v, journalist: null })} />
            </TableCell>
            <TableCell>
              <JournalistPicker value={row.journalist} mediaHouseId={row.mediaHouse?.id ?? null}
                onChange={(v) => setRow({ ...row, journalist: v })} />
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox color="primary" checked={row.invited} onChange={(e) => setRow({ ...row, invited: e.target.checked })} />
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox color="primary" checked={row.attended} onChange={(e) => setRow({ ...row, attended: e.target.checked })} />
            </TableCell>
            <TableCell padding="checkbox">
              <Checkbox color="primary" checked={row.reported} onChange={(e) => setRow({ ...row, reported: e.target.checked })} />
            </TableCell>
            <TableCell>
              <CoverageTypePicker withNull value={row.coverageType} onChange={(v) => setRow({ ...row, coverageType: v })} />
            </TableCell>
            <TableCell>
              <TextField value={row.coverageUrl} placeholder="https://" onChange={(e) => setRow({ ...row, coverageUrl: e.target.value })} />
            </TableCell>
            <TableCell>
              <TextField select value={row.coverageQuality} style={{ minWidth: 64 }}
                onChange={(e) => setRow({ ...row, coverageQuality: e.target.value })}>
                <MenuItem value="">-</MenuItem>
                {ratingOptions.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </TableCell>
            <TableCell>
              <Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.mediaHouse}>
                {formatMessage('addButton')}
              </Button>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
const mapState = (s) => ({
  activityMediaHouses: s.communications.activityMediaHouses,
  submittingMutation: s.communications.submittingMutation,
  mutation: s.communications.mutation,
});
const mapDispatch = (d) => bindActionCreators({
  fetchActivityMediaHouses, saveActivityMediaHouse, deleteActivityMediaHouse, journalize,
}, d);
export default connect(mapState, mapDispatch)(MediaPanel);
