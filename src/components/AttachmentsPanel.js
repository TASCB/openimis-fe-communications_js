import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Link, Grid, TextField,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  useModulesManager, useTranslations, journalize, baseApiUrl, formatDateTimeFromISO,
} from '@openimis/fe-core';
import { fetchAttachments, deleteAttachment, uploadAttachment } from '../actions';

function AttachmentsPanel({
  activityId, readOnly, attachments, submittingMutation, mutation, fetchAttachments, deleteAttachment, journalize,
}) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const prev = useRef();
  const refetch = () => activityId && fetchAttachments(activityId);
  useEffect(() => { refetch(); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); refetch(); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const upload = async () => {
    if (!file) return;
    setBusy(true);
    await uploadAttachment({ activityId, file, description });
    setBusy(false); setFile(null); setDescription(''); refetch();
  };
  return (
    <>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>{formatMessage('communications.file.name')}</TableCell>
          <TableCell>{formatMessage('communications.file.description')}</TableCell>
          <TableCell>{formatMessage('communications.file.uploadedBy')}</TableCell>
          <TableCell>{formatMessage('communications.file.uploadedDate')}</TableCell>
          <TableCell />
        </TableRow></TableHead>
        <TableBody>
          {(attachments ?? []).map((m) => (
            <TableRow key={m.id}>
              <TableCell><Link href={`${baseApiUrl}/communications/attachments/${m.id}/download/`} target="_blank" rel="noopener">{m.fileName}</Link></TableCell>
              <TableCell>{m.description}</TableCell>
              <TableCell>{m.userCreated?.username}</TableCell>
              <TableCell>{m.dateCreated ? formatDateTimeFromISO(modulesManager, intl, m.dateCreated) : ''}</TableCell>
              <TableCell>{!readOnly && (
                <Tooltip title={formatMessage('deleteButton.tooltip')}>
                  <IconButton size="small" onClick={() => deleteAttachment(m, formatMessage('communications.attachment.delete'))}><DeleteIcon /></IconButton>
                </Tooltip>)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!readOnly && (
        <Grid container alignItems="center" spacing={2} style={{ padding: 12 }}>
          <Grid item><input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Grid>
          <Grid item style={{ minWidth: 220 }}>
            <TextField fullWidth label={formatMessage('communications.file.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={upload} disabled={!file || busy}>{formatMessage('communications.file.upload')}</Button>
          </Grid>
        </Grid>
      )}
    </>
  );
}
const mapState = (s) => ({ attachments: s.communications.attachments, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation });
const mapDispatch = (d) => bindActionCreators({ fetchAttachments, deleteAttachment, journalize }, d);
export default connect(mapState, mapDispatch)(AttachmentsPanel);
