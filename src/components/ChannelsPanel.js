import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Grid, Typography, Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import {
  useModulesManager, useTranslations, journalize, TextInput,
} from '@openimis/fe-core';
import {
  fetchActivityChannels, saveActivityChannel, deleteActivityChannel, dispatchActivityChannel,
} from '../actions';
import ChannelPicker from '../pickers/ChannelPicker';
import { RIGHT_DISPATCH } from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
}));

const TARGET_TYPES = ['EMAIL', 'SMS', 'SOCIAL', 'RADIO', 'TV', 'PRINT', 'WEB'];
const targetKind = (channel) => (TARGET_TYPES.includes(channel?.channelType) ? channel.channelType : 'OTHER');

function ChannelsPanel({
  activityId, readOnly, activityChannels, submittingMutation, mutation,
  fetchActivityChannels, saveActivityChannel, deleteActivityChannel, dispatchActivityChannel, journalize,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [row, setRow] = useState({ channel: null, target: '' });
  const prev = useRef();
  useEffect(() => { if (activityId) fetchActivityChannels(activityId); }, [activityId]);
  useEffect(() => {
    if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchActivityChannels(activityId); }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const add = () => {
    if (!row.channel) return;
    saveActivityChannel({ activityId, channelId: row.channel.id, target: row.target }, formatMessage('communications.channel.add'));
    setRow({ channel: null, target: '' });
  };
  return (
    <>
      {!readOnly && (
        <>
          <Grid container className={classes.form} alignItems="flex-end">
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>{formatMessage('communications.channel.add')}</Typography>
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <ChannelPicker withLabel required value={row.channel} onChange={(v) => setRow((r) => ({ ...r, channel: v }))} />
            </Grid>
            <Grid item xs={12} md={6} className={classes.item}>
              <TextInput module="communications" label={`communications.channel.target.${targetKind(row.channel)}`}
                placeholder={formatMessage(`communications.channel.targetHint.${targetKind(row.channel)}`)}
                value={row.target} onChange={(v) => setRow((r) => ({ ...r, target: v }))} />
            </Grid>
            <Grid item xs={12} md={2} className={classes.item}>
              <Button variant="contained" color="primary" fullWidth onClick={add} disabled={!row.channel}>
                {formatMessage('addButton')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('communications.channel.channel')}</TableCell>
            <TableCell>{formatMessage('communications.channel.target')}</TableCell>
            <TableCell>{formatMessage('communications.channel.dispatchStatus')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {!(activityChannels ?? []).length && (
            <TableRow>
              <TableCell colSpan={4} className={classes.empty}>{formatMessage('communications.channel.empty')}</TableCell>
            </TableRow>
          )}
          {(activityChannels ?? []).map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.channel ? `${c.channel.name}` : ''}</TableCell>
              <TableCell>{c.target}</TableCell>
              <TableCell>{c.dispatchStatus ? formatMessage(`communications.dispatchStatus.${c.dispatchStatus}`) : ''}</TableCell>
              <TableCell>
                {!readOnly && rights.includes(RIGHT_DISPATCH) && (
                  <Tooltip title={formatMessage('communications.channel.dispatch')}>
                    <IconButton size="small" onClick={() => dispatchActivityChannel(c, formatMessage('communications.channel.dispatch'))}><SendIcon /></IconButton>
                  </Tooltip>
                )}
                {!readOnly && (
                  <Tooltip title={formatMessage('deleteButton.tooltip')}>
                    <IconButton size="small" onClick={() => deleteActivityChannel(c, formatMessage('communications.channel.delete'))}><DeleteIcon /></IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
const mapState = (s) => ({
  activityChannels: s.communications.activityChannels, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation,
});
const mapDispatch = (d) => bindActionCreators({
  fetchActivityChannels, saveActivityChannel, deleteActivityChannel, dispatchActivityChannel, journalize,
}, d);
export default connect(mapState, mapDispatch)(ChannelsPanel);
