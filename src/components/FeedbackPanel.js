import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Grid, Typography, Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import {
  useModulesManager, useTranslations, journalize, TextInput, coreConfirm, clearConfirm,
} from '@openimis/fe-core';
import { fetchFeedback, saveFeedback, deleteFeedback } from '../actions';
import ChannelPicker from '../pickers/ChannelPicker';
import { RATING_MIN, RATING_MAX } from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  caption: { display: 'block', color: theme.palette.primary.main, fontSize: '0.75rem' },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
  star: { color: theme.palette.warning.main },
  starButton: { padding: 2 },
}));

const EMPTY = {
  source: '', respondent: '', channel: null, rating: null, comment: '',
};
const STARS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i);

function Stars({
  value, onChange, classes, label,
}) {
  return (
    <span role={onChange ? 'radiogroup' : 'img'} aria-label={label}>
      {STARS.map((n) => {
        const Icon = value && n <= value ? StarIcon : StarBorderIcon;
        if (!onChange) return <Icon key={n} fontSize="small" className={classes.star} />;
        return (
          <IconButton
            key={n} size="small" className={classes.starButton} role="radio" aria-checked={value === n} aria-label={String(n)}
            onClick={() => onChange(value === n ? null : n)}
          >
            <Icon fontSize="small" className={classes.star} />
          </IconButton>
        );
      })}
    </span>
  );
}

function FeedbackPanel({
  activityId, readOnly, feedback, submittingMutation, mutation, confirmed,
  fetchFeedback, saveFeedback, deleteFeedback, journalize, coreConfirm, clearConfirm,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);
  const prev = useRef();
  useEffect(() => { if (activityId) fetchFeedback(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchFeedback(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  useEffect(() => {
    if (toDelete) {
      coreConfirm(formatMessage('communications.feedback.deleteDialog.title'), formatMessage('communications.feedback.deleteDialog.message'));
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) deleteFeedback(toDelete, formatMessage('communications.feedback.delete'));
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);

  const canAdd = !!(row.comment.trim() || row.source.trim() || row.rating);
  const add = () => {
    if (!canAdd) return;
    saveFeedback({
      activityId,
      channelId: row.channel?.id,
      source: row.source,
      respondent: row.respondent,
      rating: row.rating,
      comment: row.comment,
    }, formatMessage('communications.feedback.add'));
    setRow(EMPTY);
  };
  const items = feedback ?? [];

  return (
    <>
      {!readOnly && (
        <>
          <Grid container className={classes.form}>
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>{formatMessage('communications.feedback.add')}</Typography>
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <TextInput module="communications" label="communications.feedback.source"
                placeholder={formatMessage('communications.feedback.sourceHint')}
                value={row.source} onChange={(v) => setRow((r) => ({ ...r, source: v }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <TextInput module="communications" label="communications.feedback.respondent"
                value={row.respondent} onChange={(v) => setRow((r) => ({ ...r, respondent: v }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <ChannelPicker withLabel value={row.channel} onChange={(v) => setRow((r) => ({ ...r, channel: v }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <span className={classes.caption}>{formatMessage('communications.feedback.rating')}</span>
              <Stars classes={classes} value={row.rating} label={formatMessage('communications.feedback.rating')}
                onChange={(v) => setRow((r) => ({ ...r, rating: v }))} />
            </Grid>
            <Grid item xs={12} className={classes.item}>
              <TextInput module="communications" label="communications.feedback.comment" multiline
                value={row.comment} onChange={(v) => setRow((r) => ({ ...r, comment: v }))} />
            </Grid>
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              <Button variant="contained" color="primary" onClick={add} disabled={!canAdd}>
                {formatMessage('communications.feedback.add')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('communications.feedback.source')}</TableCell>
            <TableCell>{formatMessage('communications.feedback.respondent')}</TableCell>
            <TableCell>{formatMessage('communications.channelPicker')}</TableCell>
            <TableCell>{formatMessage('communications.feedback.rating')}</TableCell>
            <TableCell>{formatMessage('communications.feedback.comment')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {!items.length && (
            <TableRow>
              <TableCell colSpan={6} className={classes.empty}>{formatMessage('communications.feedback.empty')}</TableCell>
            </TableRow>
          )}
          {items.map((f) => (
            <TableRow key={f.id}>
              <TableCell>{f.source}</TableCell>
              <TableCell>{f.respondent}</TableCell>
              <TableCell>{f.channel?.name}</TableCell>
              <TableCell>
                {f.rating ? <Stars classes={classes} value={f.rating} label={`${f.rating}/${RATING_MAX}`} /> : ''}
              </TableCell>
              <TableCell style={{ whiteSpace: 'pre-wrap' }}>{f.comment}</TableCell>
              <TableCell>{!readOnly && (
                <Tooltip title={formatMessage('deleteButton.tooltip')}>
                  <IconButton size="small" onClick={() => setToDelete(f)}><DeleteIcon /></IconButton>
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
  feedback: s.communications.feedback,
  submittingMutation: s.communications.submittingMutation,
  mutation: s.communications.mutation,
  confirmed: s.core.confirmed,
});
const mapDispatch = (d) => bindActionCreators({
  fetchFeedback, saveFeedback, deleteFeedback, journalize, coreConfirm, clearConfirm,
}, d);
export default connect(mapState, mapDispatch)(FeedbackPanel);
