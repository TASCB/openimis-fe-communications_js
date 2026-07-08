import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import { useModulesManager, useTranslations, journalize } from '@openimis/fe-core';
import {
  fetchActivityChannels, saveActivityChannel, deleteActivityChannel, dispatchActivityChannel,
} from '../actions';
import ChannelPicker from '../pickers/ChannelPicker';
import { RIGHT_DISPATCH } from '../constants';

function ChannelsPanel({
  activityId, readOnly, activityChannels, submittingMutation, mutation,
  fetchActivityChannels, saveActivityChannel, deleteActivityChannel, dispatchActivityChannel, journalize,
}) {
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
        {!readOnly && (
          <TableRow>
            <TableCell><ChannelPicker withLabel value={row.channel} onChange={(v) => setRow({ ...row, channel: v })} /></TableCell>
            <TableCell colSpan={2}>
              <input value={row.target} placeholder="handle / target" onChange={(e) => setRow({ ...row, target: e.target.value })} />
            </TableCell>
            <TableCell>
              <Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.channel}>{formatMessage('addButton')}</Button>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
const mapState = (s) => ({
  activityChannels: s.communications.activityChannels, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation,
});
const mapDispatch = (d) => bindActionCreators({
  fetchActivityChannels, saveActivityChannel, deleteActivityChannel, dispatchActivityChannel, journalize,
}, d);
export default connect(mapState, mapDispatch)(ChannelsPanel);
