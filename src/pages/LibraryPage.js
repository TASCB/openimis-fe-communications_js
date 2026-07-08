import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Paper, Grid, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Tooltip, TextField, Link,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  Helmet, useTranslations, useModulesManager, journalize, baseApiUrl,
} from '@openimis/fe-core';
import {
  MODULE_NAME, RIGHT_TEMPLATE_MANAGE, RIGHT_STAKEHOLDER_MANAGE, RIGHT_LIBRARY_UPLOAD,
} from '../constants';
import {
  fetchTemplates, saveTemplate, deleteTemplate,
  fetchStakeholderLists, saveStakeholderList, deleteStakeholderList,
  fetchLibraryAssets, deleteLibraryAsset, uploadLibraryAsset,
} from '../actions';
import { ChannelTypePicker } from '../pickers/ConstantPickers';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  tabs: { display: 'flex', alignItems: 'center' },
  selectedTab: { borderBottom: '4px solid white' },
  unselectedTab: { borderBottom: '4px solid transparent' },
  content: { padding: theme.spacing(2) },
  addRow: { padding: theme.spacing(1, 0) },
}));

function TemplatesTab({ classes }) {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const items = useSelector((s) => s.communications.templates);
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);
  const [row, setRow] = useState({ code: '', name: '', channelType: 'EMAIL' });
  const prev = useRef();
  const refetch = () => dispatch(fetchTemplates(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => { if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); } }, [submitting]);
  useEffect(() => { prev.current = submitting; });
  const canManage = rights.includes(RIGHT_TEMPLATE_MANAGE);
  const add = () => { if (row.code && row.name) { dispatch(saveTemplate({ ...row, isActive: true }, formatMessage('communications.template.add'))); setRow({ code: '', name: '', channelType: 'EMAIL' }); } };
  return (
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>{formatMessage('communications.code')}</TableCell>
        <TableCell>{formatMessage('communications.template.name')}</TableCell>
        <TableCell>{formatMessage('communications.channelType')}</TableCell>
        <TableCell />
      </TableRow></TableHead>
      <TableBody>
        {(items ?? []).map((t) => (
          <TableRow key={t.id}>
            <TableCell>{t.code}</TableCell>
            <TableCell>{t.name}</TableCell>
            <TableCell>{t.channelType ? formatMessage(`communications.channelType.${t.channelType}`) : ''}</TableCell>
            <TableCell>{canManage && <Tooltip title={formatMessage('deleteButton.tooltip')}><IconButton size="small" onClick={() => dispatch(deleteTemplate(t, formatMessage('communications.template.delete')))}><DeleteIcon /></IconButton></Tooltip>}</TableCell>
          </TableRow>
        ))}
        {canManage && (
          <TableRow>
            <TableCell><TextField value={row.code} placeholder="code" onChange={(e) => setRow({ ...row, code: e.target.value })} /></TableCell>
            <TableCell><TextField value={row.name} placeholder="name" onChange={(e) => setRow({ ...row, name: e.target.value })} /></TableCell>
            <TableCell><ChannelTypePicker value={row.channelType} onChange={(v) => setRow({ ...row, channelType: v })} /></TableCell>
            <TableCell><Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.code || !row.name}>{formatMessage('addButton')}</Button></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function StakeholderListsTab() {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const items = useSelector((s) => s.communications.stakeholderLists);
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);
  const [row, setRow] = useState({ code: '', name: '' });
  const prev = useRef();
  const refetch = () => dispatch(fetchStakeholderLists(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => { if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); } }, [submitting]);
  useEffect(() => { prev.current = submitting; });
  const canManage = rights.includes(RIGHT_STAKEHOLDER_MANAGE);
  const add = () => { if (row.code && row.name) { dispatch(saveStakeholderList({ ...row, isActive: true }, formatMessage('communications.stakeholderList.add'))); setRow({ code: '', name: '' }); } };
  return (
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>{formatMessage('communications.code')}</TableCell>
        <TableCell>{formatMessage('communications.stakeholderList.name')}</TableCell>
        <TableCell />
      </TableRow></TableHead>
      <TableBody>
        {(items ?? []).map((s) => (
          <TableRow key={s.id}>
            <TableCell>{s.code}</TableCell>
            <TableCell>{s.name}</TableCell>
            <TableCell>{canManage && <Tooltip title={formatMessage('deleteButton.tooltip')}><IconButton size="small" onClick={() => dispatch(deleteStakeholderList(s, formatMessage('communications.stakeholderList.delete')))}><DeleteIcon /></IconButton></Tooltip>}</TableCell>
          </TableRow>
        ))}
        {canManage && (
          <TableRow>
            <TableCell><TextField value={row.code} placeholder="code" onChange={(e) => setRow({ ...row, code: e.target.value })} /></TableCell>
            <TableCell><TextField value={row.name} placeholder="name" onChange={(e) => setRow({ ...row, name: e.target.value })} /></TableCell>
            <TableCell><Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.code || !row.name}>{formatMessage('addButton')}</Button></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function AssetsTab() {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const items = useSelector((s) => s.communications.libraryAssets);
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);
  const [form, setForm] = useState({ code: '', name: '', file: null });
  const [busy, setBusy] = useState(false);
  const prev = useRef();
  const refetch = () => dispatch(fetchLibraryAssets(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => { if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); } }, [submitting]);
  useEffect(() => { prev.current = submitting; });
  const canUpload = rights.includes(RIGHT_LIBRARY_UPLOAD);
  const upload = async () => {
    if (!form.file || !form.code || !form.name) return;
    setBusy(true);
    await uploadLibraryAsset(form);
    setBusy(false); setForm({ code: '', name: '', file: null }); refetch();
  };
  return (
    <>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>{formatMessage('communications.code')}</TableCell>
          <TableCell>{formatMessage('communications.asset.name')}</TableCell>
          <TableCell>{formatMessage('communications.asset.file')}</TableCell>
          <TableCell />
        </TableRow></TableHead>
        <TableBody>
          {(items ?? []).map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.code}</TableCell>
              <TableCell>{a.name}</TableCell>
              <TableCell><Link href={`${baseApiUrl}/communications/library/${a.id}/download/`} target="_blank" rel="noopener">{a.fileName}</Link></TableCell>
              <TableCell>{canUpload && <Tooltip title={formatMessage('deleteButton.tooltip')}><IconButton size="small" onClick={() => dispatch(deleteLibraryAsset(a, formatMessage('communications.asset.delete')))}><DeleteIcon /></IconButton></Tooltip>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canUpload && (
        <Grid container alignItems="center" spacing={2} style={{ padding: 12 }}>
          <Grid item><TextField label="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Grid>
          <Grid item><TextField label="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
          <Grid item><input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} /></Grid>
          <Grid item><Button variant="contained" color="primary" onClick={upload} disabled={busy || !form.file || !form.code || !form.name}>{formatMessage('communications.file.upload')}</Button></Grid>
        </Grid>
      )}
    </>
  );
}

function LibraryPage() {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const [active, setActive] = useState(0);
  const tabs = [
    { key: 'templates', label: 'communications.library.templates', render: () => <TemplatesTab classes={classes} /> },
    { key: 'stakeholders', label: 'communications.library.stakeholderLists', render: () => <StakeholderListsTab /> },
    { key: 'assets', label: 'communications.library.assets', render: () => <AssetsTab /> },
  ];
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
