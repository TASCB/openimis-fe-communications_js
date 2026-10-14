import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip,
  TextField, Checkbox, Link, MenuItem, Grid, Typography, Divider, FormControlLabel, Chip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import { useModulesManager, useTranslations, journalize, TextInput } from '@openimis/fe-core';
import {
  fetchActivityMediaHouses, saveActivityMediaHouse, deleteActivityMediaHouse,
} from '../actions';
import MediaHousePicker from '../pickers/MediaHousePicker';
import JournalistPicker from '../pickers/JournalistPicker';
import { CoverageTypePicker } from '../pickers/ConstantPickers';
import { RATING_MIN, RATING_MAX } from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  caption: { display: 'block', color: theme.palette.primary.main, fontSize: '0.75rem' },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  muted: { fontSize: '0.75rem', color: theme.palette.text.secondary },
  progress: { display: 'flex', flexWrap: 'wrap', gap: theme.spacing(0.5) },
}));

const BLANK = {
  mediaHouse: null, journalist: null, invited: true, attended: false, reported: false,
  coverageType: null, coverageUrl: '', coverageQuality: '',
};
const PROGRESS = ['invited', 'attended', 'reported'];

const journalistName = (j) => (j ? [j.firstName, j.lastName].filter(Boolean).join(' ') : '');

function MediaPanel({
  activityId, readOnly, activityMediaHouses, submittingMutation, mutation,
  fetchActivityMediaHouses, saveActivityMediaHouse, deleteActivityMediaHouse, journalize,
}) {
  const classes = useStyles();
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

  const save = (item, patch) => saveActivityMediaHouse({
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
  }, formatMessage('communications.media.update'));

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
    <>
      {!readOnly && (
        <>
          <Grid container className={classes.form} alignItems="flex-end">
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>{formatMessage('communications.media.add')}</Typography>
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <MediaHousePicker withLabel required value={row.mediaHouse}
                onChange={(v) => setRow((r) => ({ ...r, mediaHouse: v, journalist: null }))} />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <JournalistPicker withLabel label={formatMessage('communications.media.filedBy')} value={row.journalist}
                mediaHouseId={row.mediaHouse?.id ?? null} onChange={(v) => setRow((r) => ({ ...r, journalist: v }))} />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <CoverageTypePicker withLabel withNull value={row.coverageType}
                onChange={(v) => setRow((r) => ({ ...r, coverageType: v || null }))} />
            </Grid>
            <Grid item xs={12} md={5} className={classes.item}>
              <TextInput module="communications" label="communications.media.coverageUrl" placeholder="https://"
                value={row.coverageUrl} onChange={(v) => setRow((r) => ({ ...r, coverageUrl: v }))} />
            </Grid>
            <Grid item xs={4} md={2} className={classes.item}>
              <TextField select fullWidth label={formatMessage('communications.media.quality')} value={row.coverageQuality}
                onChange={(e) => setRow((r) => ({ ...r, coverageQuality: e.target.value }))}>
                <MenuItem value="">-</MenuItem>
                {ratingOptions.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={8} md={5} className={classes.item}>
              <span className={classes.caption}>{formatMessage('communications.media.progress')}</span>
              {PROGRESS.map((k) => (
                <FormControlLabel
                  key={k}
                  control={<Checkbox color="primary" size="small" checked={row[k]} onChange={(e) => setRow((r) => ({ ...r, [k]: e.target.checked }))} />}
                  label={formatMessage(`communications.media.${k}`)}
                />
              ))}
            </Grid>
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              <Button variant="contained" color="primary" onClick={add} disabled={!row.mediaHouse}>
                {formatMessage('communications.media.add')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('communications.media.house')}</TableCell>
            <TableCell>{formatMessage('communications.media.filedBy')}</TableCell>
            <TableCell>{formatMessage('communications.media.progress')}</TableCell>
            <TableCell>{formatMessage('communications.media.coverage')}</TableCell>
            <TableCell>{formatMessage('communications.media.quality')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(activityMediaHouses ?? []).map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                {c.mediaHouse?.name}
                {c.mediaHouse?.category?.medium && (
                  <div className={classes.muted}>{formatMessage(`communications.medium.${c.mediaHouse.category.medium}`)}</div>
                )}
              </TableCell>
              <TableCell>{journalistName(c.journalist)}</TableCell>
              <TableCell>
                <div className={classes.progress}>
                  {PROGRESS.map((k) => (
                    <Chip
                      key={k}
                      size="small"
                      label={formatMessage(`communications.media.${k}`)}
                      color={c[k] ? 'primary' : 'default'}
                      variant={c[k] ? 'default' : 'outlined'}
                      onClick={readOnly ? undefined : () => save(c, { [k]: !c[k] })}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {c.coverageType ? formatMessage(`communications.coverageType.${c.coverageType}`) : ''}
                {c.coverageUrl && (
                  <div>
                    <Link href={c.coverageUrl} target="_blank" rel="noopener">{formatMessage('communications.media.openCoverage')}</Link>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <TextField select disabled={readOnly} value={c.coverageQuality ?? ''} style={{ minWidth: 64 }}
                  onChange={(e) => save(c, { coverageQuality: e.target.value === '' ? null : Number(e.target.value) })}>
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
        </TableBody>
      </Table>
    </>
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
