import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Grid, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Typography, Divider,
  Switch, FormControlLabel, Link,
} from '@material-ui/core';
import EditOutlined from '@material-ui/icons/EditOutlined';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import ArrowBack from '@material-ui/icons/ArrowBack';
import {
  useTranslations, useModulesManager, useGraphqlQuery, journalize, TextInput, coreConfirm, clearConfirm,
  graphqlWithVariables, PublishedComponent,
} from '@openimis/fe-core';
import {
  MODULE_NAME, RIGHT_STAKEHOLDER_CREATE, RIGHT_STAKEHOLDER_UPDATE, RIGHT_STAKEHOLDER_DELETE,
} from '../constants';
import {
  saveStakeholderList, deleteStakeholderList, saveStakeholderEntry, deleteStakeholderEntry,
} from '../actions';

const useStyles = makeStyles((theme) => ({
  item: theme.paper.item,
  form: { padding: theme.spacing(1, 0) },
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: theme.spacing(1) },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
  heading: { display: 'flex', alignItems: 'center', gap: theme.spacing(1), padding: theme.spacing(1) },
  rowActions: { whiteSpace: 'nowrap' },
}));

const BLANK_LIST = {
  id: null, code: '', name: '', description: '', isActive: true,
};
const BLANK_MEMBER = {
  id: null, name: '', organization: '', phone: '', email: '', location: null,
};

const MEMBERS_QUERY = `query CommStakeholderMembers($listId: ID, $after: String) {
  stakeholderListEntry(stakeholderListId: $listId, first: 100, after: $after, orderBy: ["name"]) {
    pageInfo { hasNextPage endCursor }
    edges { node { id name organization phone email location { id code name } } }
  }
}`;

function useAllMembers(listId) {
  const dispatch = useDispatch();
  const [state, setState] = useState({ members: [], isLoading: true });
  const load = async () => {
    setState((s) => ({ ...s, isLoading: true }));
    const members = [];
    let after = null;
    do {
      // eslint-disable-next-line no-await-in-loop
      const action = await dispatch(graphqlWithVariables(MEMBERS_QUERY, { listId, after }, 'COMMS_STAKEHOLDER_MEMBERS'));
      const page = action?.payload?.data?.stakeholderListEntry;
      if (!page) break;
      members.push(...page.edges.map((e) => e.node));
      after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    setState({ members, isLoading: false });
  };
  useEffect(() => { load(); }, [listId]);
  return { ...state, refetch: load };
}

function useMutationDone(onDone) {
  const dispatch = useDispatch();
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);
  const prev = useRef();
  useEffect(() => { if (prev.current && !submitting) { dispatch(journalize(mutation)); onDone(); } }, [submitting]);
  useEffect(() => { prev.current = submitting; });
}

function useConfirmedDelete(title, message, onConfirmed) {
  const dispatch = useDispatch();
  const confirmed = useSelector((s) => s.core.confirmed);
  const [target, setTarget] = useState(null);
  useEffect(() => { if (target) dispatch(coreConfirm(title, message(target))); }, [target]);
  useEffect(() => {
    if (target && confirmed) onConfirmed(target);
    if (confirmed !== null) setTarget(null);
    return () => confirmed !== null && dispatch(clearConfirm(false));
  }, [confirmed]);
  return setTarget;
}

function MembersPanel({ stakeholderList, onBack }) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [form, setForm] = useState(BLANK_MEMBER);
  const { members, isLoading, refetch } = useAllMembers(stakeholderList.id);
  useMutationDone(refetch);
  const confirmDelete = useConfirmedDelete(
    formatMessage('communications.stakeholderList.member.deleteDialog.title'),
    (m) => formatMessageWithValues('communications.stakeholderList.member.deleteDialog.message', { name: m.name }),
    (m) => dispatch(deleteStakeholderEntry(m, formatMessage('communications.stakeholderList.member.delete'))),
  );
  const canEdit = rights.includes(form.id ? RIGHT_STAKEHOLDER_UPDATE : RIGHT_STAKEHOLDER_CREATE);
  const canDelete = rights.includes(RIGHT_STAKEHOLDER_DELETE);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) return;
    dispatch(saveStakeholderEntry({ ...form, stakeholderListId: stakeholderList.id },
      formatMessage(form.id ? 'communications.stakeholderList.member.update' : 'communications.stakeholderList.member.add')));
    setForm(BLANK_MEMBER);
  };

  return (
    <>
      <div className={classes.heading}>
        <Button size="small" startIcon={<ArrowBack />} onClick={onBack}>
          {formatMessage('communications.stakeholderList.back')}
        </Button>
        <Typography variant="subtitle1">{stakeholderList.name}</Typography>
      </div>
      <Divider />
      {(canEdit || form.id) && (
        <>
          <Grid container className={classes.form}>
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>
                {formatMessage(form.id ? 'communications.stakeholderList.member.editTitle' : 'communications.stakeholderList.member.add')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.stakeholderList.member.name" required
                value={form.name} onChange={set('name')} />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.stakeholderList.member.organization"
                value={form.organization} onChange={set('organization')} />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <PublishedComponent pubRef="location.LocationPicker" value={form.location} onChange={set('location')} />
            </Grid>
            <Grid item xs={6} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.stakeholderList.member.phone"
                value={form.phone} onChange={set('phone')} />
            </Grid>
            <Grid item xs={6} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.stakeholderList.member.email"
                value={form.email} onChange={set('email')} />
            </Grid>
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              {form.id && <Button onClick={() => setForm(BLANK_MEMBER)}>{formatMessage('communications.template.cancelEdit')}</Button>}
              <Button variant="contained" color="primary" onClick={save} disabled={!canEdit || !form.name.trim()}>
                {formatMessage(form.id ? 'communications.template.saveChanges' : 'communications.stakeholderList.member.add')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('communications.stakeholderList.member.name')}</TableCell>
            <TableCell>{formatMessage('communications.stakeholderList.member.organization')}</TableCell>
            <TableCell>{formatMessage('communications.stakeholderList.member.location')}</TableCell>
            <TableCell>{formatMessage('communications.stakeholderList.member.phone')}</TableCell>
            <TableCell>{formatMessage('communications.stakeholderList.member.email')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading && !members.length && (
            <TableRow>
              <TableCell colSpan={6} className={classes.empty}>{formatMessage('communications.stakeholderList.member.empty')}</TableCell>
            </TableRow>
          )}
          {members.map((m) => (
            <TableRow key={m.id} selected={form.id === m.id}>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.organization}</TableCell>
              <TableCell>{m.location?.name}</TableCell>
              <TableCell>{m.phone}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell align="right" className={classes.rowActions}>
                {rights.includes(RIGHT_STAKEHOLDER_UPDATE) && (
                  <Tooltip title={formatMessage('communications.action.edit')}>
                    <IconButton size="small" onClick={() => setForm({ ...BLANK_MEMBER, ...m, organization: m.organization || '', phone: m.phone || '', email: m.email || '' })}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip title={formatMessage('deleteButton.tooltip')}>
                    <IconButton size="small" onClick={() => confirmDelete(m)}><DeleteOutlineIcon /></IconButton>
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

function ListsPanel({ onOpen }) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [form, setForm] = useState(BLANK_LIST);
  const { data, isLoading, refetch } = useGraphqlQuery(
    `query CommStakeholderLists {
      stakeholderList(first: 100, orderBy: ["name"]) {
        edges { node { id code name description isActive } }
      }
    }`, {},
  );
  useMutationDone(refetch);
  const confirmDelete = useConfirmedDelete(
    formatMessage('communications.stakeholderList.deleteDialog.title'),
    (l) => formatMessageWithValues('communications.stakeholderList.deleteDialog.message', { name: l.name }),
    (l) => dispatch(deleteStakeholderList(l, formatMessage('communications.stakeholderList.delete'))),
  );
  const canEdit = rights.includes(form.id ? RIGHT_STAKEHOLDER_UPDATE : RIGHT_STAKEHOLDER_CREATE);
  const lists = data?.stakeholderList?.edges?.map((e) => e.node) ?? [];
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const ready = !!(form.code.trim() && form.name.trim());
  const save = () => {
    if (!ready) return;
    dispatch(saveStakeholderList(form, formatMessage(form.id ? 'communications.stakeholderList.update' : 'communications.stakeholderList.add')));
    setForm(BLANK_LIST);
  };

  return (
    <>
      {(canEdit || form.id) && (
        <>
          <Grid container className={classes.form}>
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>
                {formatMessage(form.id ? 'communications.stakeholderList.editTitle' : 'communications.stakeholderList.add')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2} className={classes.item}>
              <TextInput module="communications" label="communications.code" required readOnly={!!form.id}
                value={form.code} onChange={set('code')} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <TextInput module="communications" label="communications.stakeholderList.name" required
                value={form.name} onChange={set('name')} />
            </Grid>
            <Grid item xs={12} md={5} className={classes.item}>
              <TextInput module="communications" label="communications.stakeholderList.description"
                value={form.description} onChange={set('description')} />
            </Grid>
            <Grid item xs={12} md={2} className={classes.item}>
              <FormControlLabel
                control={<Switch color="primary" checked={form.isActive} onChange={(e) => set('isActive')(e.target.checked)} />}
                label={formatMessage('communications.template.active')}
              />
            </Grid>
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              {form.id && <Button onClick={() => setForm(BLANK_LIST)}>{formatMessage('communications.template.cancelEdit')}</Button>}
              <Button variant="contained" color="primary" onClick={save} disabled={!canEdit || !ready}>
                {formatMessage(form.id ? 'communications.template.saveChanges' : 'communications.stakeholderList.add')}
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
            <TableCell>{formatMessage('communications.stakeholderList.name')}</TableCell>
            <TableCell>{formatMessage('communications.stakeholderList.description')}</TableCell>
            <TableCell>{formatMessage('communications.template.active')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading && !lists.length && (
            <TableRow>
              <TableCell colSpan={5} className={classes.empty}>{formatMessage('communications.stakeholderList.empty')}</TableCell>
            </TableRow>
          )}
          {lists.map((l) => (
            <TableRow key={l.id} selected={form.id === l.id}>
              <TableCell>{l.code}</TableCell>
              <TableCell>
                <Link component="button" variant="body2" onClick={() => onOpen(l)}>{l.name}</Link>
              </TableCell>
              <TableCell>{l.description}</TableCell>
              <TableCell>{formatMessage(l.isActive === false ? 'communications.template.inactive' : 'communications.template.activeYes')}</TableCell>
              <TableCell align="right" className={classes.rowActions}>
                <Button size="small" color="primary" onClick={() => onOpen(l)}>
                  {formatMessage('communications.stakeholderList.members')}
                </Button>
                {rights.includes(RIGHT_STAKEHOLDER_UPDATE) && (
                  <Tooltip title={formatMessage('communications.action.edit')}>
                    <IconButton size="small" onClick={() => setForm({ ...BLANK_LIST, ...l, description: l.description || '', isActive: l.isActive !== false })}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {rights.includes(RIGHT_STAKEHOLDER_DELETE) && (
                  <Tooltip title={formatMessage('deleteButton.tooltip')}>
                    <IconButton size="small" onClick={() => confirmDelete(l)}><DeleteOutlineIcon /></IconButton>
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

function StakeholderListsTab() {
  const [open, setOpen] = useState(null);
  return open
    ? <MembersPanel key={open.id} stakeholderList={open} onBack={() => setOpen(null)} />
    : <ListsPanel onOpen={setOpen} />;
}
export default StakeholderListsTab;
