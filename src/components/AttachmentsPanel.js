import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Link, Grid,
  Typography, Divider, Chip, CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import CloudUploadIcon from '@material-ui/icons/CloudUploadOutlined';
import {
  useModulesManager, useTranslations, journalize, baseApiUrl, formatDateTimeFromISO, TextInput, useToast,
  coreConfirm, clearConfirm,
} from '@openimis/fe-core';
import { fetchAttachments, deleteAttachment, uploadAttachment } from '../actions';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1) },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
  chipFailed: { borderColor: theme.palette.error.main, color: theme.palette.error.main },
}));

function formatBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentsPanel({
  activityId, readOnly, attachments, submittingMutation, mutation, confirmed,
  fetchAttachments, deleteAttachment, journalize, coreConfirm, clearConfirm,
}) {
  const classes = useStyles();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [failed, setFailed] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const prev = useRef();
  const refetch = () => activityId && fetchAttachments(activityId);
  useEffect(() => { refetch(); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); refetch(); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  useEffect(() => {
    if (toDelete) {
      coreConfirm(
        formatMessage('communications.attachment.deleteDialog.title'),
        formatMessageWithValues('communications.attachment.deleteDialog.message', { name: toDelete.fileName }),
      );
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) deleteAttachment(toDelete, formatMessage('communications.attachment.delete'));
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);

  const addFiles = (list) => setFiles((current) => [...current, ...Array.from(list || [])]);
  const removeFile = (index) => setFiles((current) => current.filter((_, i) => i !== index));
  const failureReason = (res) => {
    const reason = res?.error || res?.message || res?.detail || '';
    return /413/.test(reason) ? formatMessage('communications.file.tooLarge') : reason;
  };
  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    const failures = [];
    for (let i = 0; i < files.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await uploadAttachment({ activityId, file: files[i], description });
      if (!res?.success) failures.push({ file: files[i], reason: failureReason(res) });
    }
    setBusy(false);
    setFiles(failures.map((f) => f.file));
    setFailed(failures.map((f) => f.file));
    if (failures.length) {
      toast.showError(failures
        .map((f) => formatMessageWithValues('communications.file.uploadFailed', { name: f.file.name, reason: f.reason }))
        .join(' · '));
    } else {
      setDescription('');
    }
    refetch();
  };

  return (
    <>
      {!readOnly && (
        <>
          <Grid container className={classes.form} alignItems="flex-end">
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>{formatMessage('communications.file.addTitle')}</Typography>
            </Grid>
            <Grid item className={classes.item}>
              <input
                ref={inputRef} type="file" multiple hidden
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <Button variant="outlined" color="primary" startIcon={<AttachFileIcon />} onClick={() => inputRef.current?.click()}>
                {formatMessage('communications.file.choose')}
              </Button>
            </Grid>
            <Grid item xs className={classes.item}>
              <TextInput module="communications" label="communications.file.description" value={description} onChange={setDescription} />
            </Grid>
            <Grid item className={classes.item}>
              <Button
                variant="contained" color="primary" onClick={upload} disabled={!files.length || busy}
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
              >
                {formatMessage('communications.file.upload')}
              </Button>
            </Grid>
            {files.length > 0 && (
              <Grid item xs={12} className={classes.item}>
                <div className={classes.chips}>
                  {files.map((f, i) => (
                    <Chip
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${f.name}-${i}`}
                      variant="outlined"
                      className={failed.includes(f) ? classes.chipFailed : undefined}
                      label={`${f.name} · ${formatBytes(f.size)}`}
                      onDelete={busy ? undefined : () => removeFile(i)}
                    />
                  ))}
                </div>
              </Grid>
            )}
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>{formatMessage('communications.file.name')}</TableCell>
          <TableCell>{formatMessage('communications.file.description')}</TableCell>
          <TableCell>{formatMessage('communications.file.uploadedBy')}</TableCell>
          <TableCell>{formatMessage('communications.file.uploadedDate')}</TableCell>
          <TableCell />
        </TableRow></TableHead>
        <TableBody>
          {!(attachments ?? []).length && (
            <TableRow>
              <TableCell colSpan={5} className={classes.empty}>{formatMessage('communications.attachment.empty')}</TableCell>
            </TableRow>
          )}
          {(attachments ?? []).map((m) => (
            <TableRow key={m.id}>
              <TableCell><Link href={`${baseApiUrl}/communications/attachments/${m.id}/download/`} target="_blank" rel="noopener">{m.fileName}</Link></TableCell>
              <TableCell>{m.description}</TableCell>
              <TableCell>{m.userCreated?.username}</TableCell>
              <TableCell>{m.dateCreated ? formatDateTimeFromISO(modulesManager, intl, m.dateCreated) : ''}</TableCell>
              <TableCell>{!readOnly && (
                <Tooltip title={formatMessage('deleteButton.tooltip')}>
                  <IconButton size="small" onClick={() => setToDelete(m)}><DeleteIcon /></IconButton>
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
  attachments: s.communications.attachments,
  submittingMutation: s.communications.submittingMutation,
  mutation: s.communications.mutation,
  confirmed: s.core.confirmed,
});
const mapDispatch = (d) => bindActionCreators({
  fetchAttachments, deleteAttachment, journalize, coreConfirm, clearConfirm,
}, d);
export default connect(mapState, mapDispatch)(AttachmentsPanel);
