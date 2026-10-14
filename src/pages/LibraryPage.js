import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Paper, Grid, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Tooltip, Link, Typography, Divider, Switch, FormControlLabel,
} from '@material-ui/core';
import EditOutlined from '@material-ui/icons/EditOutlined';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import {
  Helmet, useTranslations, useModulesManager, journalize, baseApiUrl, TextInput, useToast,
  coreConfirm, clearConfirm,
} from '@openimis/fe-core';
import { UploadBar } from '@openimis/fe-tasaf_common';
import {
  MODULE_NAME, RIGHT_TEMPLATE_MANAGE, RIGHT_LIBRARY_UPLOAD, RIGHT_STAKEHOLDER_SEARCH,
} from '../constants';
import {
  fetchTemplates, saveTemplate, deleteTemplate,
  fetchLibraryAssets, deleteLibraryAsset, uploadLibraryAsset,
} from '../actions';
import { ChannelTypePicker, AssetTypePicker } from '../pickers/ConstantPickers';
import RichTextEditor from '../components/RichTextEditor';
import StakeholderListsTab from '../components/StakeholderListsTab';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  tabs: { display: 'flex', alignItems: 'center' },
  selectedTab: { borderBottom: '4px solid white' },
  unselectedTab: { borderBottom: '4px solid transparent' },
  content: { padding: theme.spacing(2) },
  item: theme.paper.item,
  form: { padding: theme.spacing(1, 0) },
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  caption: { display: 'block', color: theme.palette.primary.main, fontSize: '0.75rem', marginBottom: 8 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: theme.spacing(1) },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
}));

const BLANK_TEMPLATE = {
  id: null, code: '', name: '', channelType: 'EMAIL', subject: '', body: '', isActive: true,
};

const BLANK_ASSET = {
  code: '', name: '', assetType: 'DOCUMENT', description: '', file: null,
};

function TemplatesTab() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const items = useSelector((s) => s.communications.templates);
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);
  const confirmed = useSelector((s) => s.core.confirmed);
  const [form, setForm] = useState(BLANK_TEMPLATE);
  const [toDelete, setToDelete] = useState(null);
  const prev = useRef();
  const refetch = () => dispatch(fetchTemplates(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => { if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); } }, [submitting]);
  useEffect(() => { prev.current = submitting; });
  useEffect(() => {
    if (toDelete) {
      dispatch(coreConfirm(
        formatMessage('communications.template.deleteDialog.title'),
        formatMessageWithValues('communications.template.deleteDialog.message', { name: toDelete.name }),
      ));
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) dispatch(deleteTemplate(toDelete, formatMessage('communications.template.delete')));
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && dispatch(clearConfirm(false));
  }, [confirmed]);

  const canManage = rights.includes(RIGHT_TEMPLATE_MANAGE);
  const ready = !!(form.code.trim() && form.name.trim());
  const save = () => {
    if (!ready) return;
    dispatch(saveTemplate(form, formatMessage(form.id ? 'communications.template.update' : 'communications.template.add')));
    setForm(BLANK_TEMPLATE);
  };
  const edit = (t) => setForm({
    id: t.id,
    code: t.code || '',
    name: t.name || '',
    channelType: t.channelType || BLANK_TEMPLATE.channelType,
    subject: t.subject || '',
    body: t.body || '',
    isActive: t.isActive !== false,
  });
  const list = items ?? [];

  return (
    <>
      {canManage && (
        <>
          <Grid container className={classes.form}>
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>
                {formatMessage(form.id ? 'communications.template.editTitle' : 'communications.template.add')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2} className={classes.item}>
              <TextInput module="communications" label="communications.code" required readOnly={!!form.id}
                value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.template.name" required
                value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <ChannelTypePicker withLabel value={form.channelType}
                onChange={(v) => setForm((f) => ({ ...f, channelType: v || BLANK_TEMPLATE.channelType }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <FormControlLabel
                control={<Switch color="primary" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />}
                label={formatMessage('communications.template.active')}
              />
            </Grid>
            <Grid item xs={12} className={classes.item}>
              <TextInput module="communications" label="communications.template.subject"
                value={form.subject} onChange={(v) => setForm((f) => ({ ...f, subject: v }))} />
            </Grid>
            <Grid item xs={12} className={classes.item}>
              <span className={classes.caption}>{formatMessage('communications.template.body')}</span>
              <RichTextEditor
                value={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                placeholder={formatMessage('communications.template.bodyHint')}
                ariaLabel={formatMessage('communications.template.body')}
                fm={formatMessage}
              />
            </Grid>
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              {form.id && (
                <Button onClick={() => setForm(BLANK_TEMPLATE)}>{formatMessage('communications.template.cancelEdit')}</Button>
              )}
              <Button variant="contained" color="primary" onClick={save} disabled={!ready}>
                {formatMessage(form.id ? 'communications.template.saveChanges' : 'communications.template.add')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('communications.code')}</TableCell>
            <TableCell>{formatMessage('communications.template.name')}</TableCell>
            <TableCell>{formatMessage('communications.channelType')}</TableCell>
            <TableCell>{formatMessage('communications.template.subject')}</TableCell>
            <TableCell>{formatMessage('communications.template.active')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {!list.length && (
            <TableRow>
              <TableCell colSpan={6} className={classes.empty}>{formatMessage('communications.template.empty')}</TableCell>
            </TableRow>
          )}
          {list.map((t) => (
            <TableRow key={t.id} selected={form.id === t.id}>
              <TableCell>{t.code}</TableCell>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.channelType ? formatMessage(`communications.channelType.${t.channelType}`) : ''}</TableCell>
              <TableCell>{t.subject}</TableCell>
              <TableCell>{formatMessage(t.isActive === false ? 'communications.template.inactive' : 'communications.template.activeYes')}</TableCell>
              <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                {canManage && (
                  <>
                    <Tooltip title={formatMessage('communications.action.edit')}>
                      <IconButton size="small" onClick={() => edit(t)}><EditOutlined fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={formatMessage('deleteButton.tooltip')}>
                      <IconButton size="small" onClick={() => setToDelete(t)}><DeleteOutlineIcon /></IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function AssetsTab() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const toast = useToast();
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const items = useSelector((s) => s.communications.libraryAssets);
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);
  const confirmed = useSelector((s) => s.core.confirmed);
  const [form, setForm] = useState(BLANK_ASSET);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const prev = useRef();
  const refetch = () => dispatch(fetchLibraryAssets(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => { if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); } }, [submitting]);
  useEffect(() => { prev.current = submitting; });
  useEffect(() => {
    if (toDelete) {
      dispatch(coreConfirm(
        formatMessage('communications.asset.deleteDialog.title'),
        formatMessageWithValues('communications.asset.deleteDialog.message', { name: toDelete.name }),
      ));
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) dispatch(deleteLibraryAsset(toDelete, formatMessage('communications.asset.delete')));
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && dispatch(clearConfirm(false));
  }, [confirmed]);

  const canUpload = rights.includes(RIGHT_LIBRARY_UPLOAD);
  const ready = !!(form.file && form.code.trim() && form.name.trim());
  const upload = async () => {
    if (!ready) return;
    setBusy(true);
    const res = await uploadLibraryAsset(form);
    setBusy(false);
    if (res?.success) {
      setForm(BLANK_ASSET);
      setFailed(false);
      refetch();
    } else {
      const reason = res?.error || res?.message || res?.detail || '';
      setFailed(true);
      toast.showError(formatMessageWithValues('communications.file.uploadFailed', {
        name: form.file.name,
        reason: /413/.test(reason) ? formatMessage('communications.file.tooLarge') : reason,
      }));
    }
  };
  const list = items ?? [];

  return (
    <>
      {canUpload && (
        <UploadBar
          title={formatMessage('communications.asset.add')}
          chooseLabel={formatMessage('communications.asset.chooseFile')}
          uploadLabel={formatMessage('communications.file.upload')}
          descriptionLabel={formatMessage('communications.file.description')}
          multiple={false}
          files={form.file ? [form.file] : []}
          failed={failed && form.file ? [form.file] : []}
          canUpload={ready}
          busy={busy}
          description={form.description}
          onDescriptionChange={(v) => setForm((f) => ({ ...f, description: v }))}
          onAddFiles={(list) => {
            const file = list[0] ?? null;
            setFailed(false);
            setForm((f) => ({ ...f, file, name: f.name || (file ? file.name.replace(/\.[^.]+$/, '') : '') }));
          }}
          onRemoveFile={() => { setForm((f) => ({ ...f, file: null })); setFailed(false); }}
          onUpload={upload}
        >
          <Grid item xs={12} md={2} className={classes.item}>
            <TextInput module="communications" label="communications.code" required
              value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
          </Grid>
          <Grid item xs={12} md={6} className={classes.item}>
            <TextInput module="communications" label="communications.asset.name" required
              value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          </Grid>
          <Grid item xs={12} md={4} className={classes.item}>
            <AssetTypePicker withLabel value={form.assetType}
              onChange={(v) => setForm((f) => ({ ...f, assetType: v || BLANK_ASSET.assetType }))} />
          </Grid>
        </UploadBar>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('communications.code')}</TableCell>
            <TableCell>{formatMessage('communications.asset.name')}</TableCell>
            <TableCell>{formatMessage('communications.assetType')}</TableCell>
            <TableCell>{formatMessage('communications.asset.file')}</TableCell>
            <TableCell>{formatMessage('communications.file.description')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {!list.length && (
            <TableRow>
              <TableCell colSpan={6} className={classes.empty}>{formatMessage('communications.asset.empty')}</TableCell>
            </TableRow>
          )}
          {list.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.code}</TableCell>
              <TableCell>{a.name}</TableCell>
              <TableCell>{a.assetType ? formatMessage(`communications.assetType.${a.assetType}`) : ''}</TableCell>
              <TableCell><Link href={`${baseApiUrl}/communications/library/${a.id}/download/`} target="_blank" rel="noopener">{a.fileName}</Link></TableCell>
              <TableCell>{a.description}</TableCell>
              <TableCell>
                {canUpload && (
                  <Tooltip title={formatMessage('deleteButton.tooltip')}>
                    <IconButton size="small" onClick={() => setToDelete(a)}><DeleteOutlineIcon /></IconButton>
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

function LibraryPage() {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [active, setActive] = useState(0);
  const tabs = [
    { key: 'templates', label: 'communications.library.templates', render: () => <TemplatesTab /> },
    rights.includes(RIGHT_STAKEHOLDER_SEARCH)
      && { key: 'stakeholders', label: 'communications.library.stakeholderLists', render: () => <StakeholderListsTab /> },
    { key: 'assets', label: 'communications.library.assets', render: () => <AssetsTab /> },
  ].filter(Boolean);
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('communications.library.page.title')} />
      <Paper className={classes.paper} style={{ marginTop: 8 }}>
        <Grid container className={`${classes.tableTitle} ${classes.tabs}`}>
          {tabs.map((t, i) => (
            <Tab key={t.key} onClick={() => setActive(i)} selected={i === active}
              className={i === active ? classes.selectedTab : classes.unselectedTab} label={formatMessage(t.label)} />
          ))}
        </Grid>
        <div className={classes.content}>{tabs[active].render()}</div>
      </Paper>
    </div>
  );
}
export default LibraryPage;
