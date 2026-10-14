import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useDispatch } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Grid, Typography, Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import {
  useModulesManager, useTranslations, journalize, TextInput, coreConfirm, clearConfirm, graphqlWithVariables,
  useHistory,
} from '@openimis/fe-core';
import { ConflictPanel } from '@openimis/fe-tasaf_common';
import {
  fetchAssignments, saveAssignment, deleteAssignment, decId,
} from '../actions';
import { COMMS_ROUTE_ACTIVITY } from '../constants';
import { toISO } from '../utils/dates';
import StaffUserPicker, { staffUserName } from '../pickers/StaffUserPicker';
import { AssignmentRolePicker, AssignmentStatusPicker } from '../pickers/ConstantPickers';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
}));

const STAFF_CLASH_QUERY = `query ($startDatetime: DateTime!, $endDatetime: DateTime!, $activityId: UUID, $staffUserIds: [UUID]) {
  activityConflicts(startDatetime: $startDatetime, endDatetime: $endDatetime, activityId: $activityId, staffUserIds: $staffUserIds) {
    type hard message conflictingActivityId
  }
}`;

const BLANK = {
  staffUser: null, role: 'CONTRIBUTOR', status: 'ASSIGNED', notes: '',
};

function AssignmentsPanel({
  activityId, edited, readOnly, assignments, submittingMutation, mutation, confirmed,
  fetchAssignments, saveAssignment, deleteAssignment, journalize, coreConfirm, clearConfirm,
}) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(BLANK);
  const [clashes, setClashes] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const prev = useRef();
  useEffect(() => { if (activityId) fetchAssignments(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchAssignments(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const candidateId = decId(row.staffUser?.id);
  useEffect(() => {
    if (!candidateId || !edited?.startDatetime || !edited?.endDatetime) {
      setClashes([]);
      return undefined;
    }
    let alive = true;
    dispatch(graphqlWithVariables(STAFF_CLASH_QUERY, {
      startDatetime: toISO(edited.startDatetime),
      endDatetime: toISO(edited.endDatetime, true),
      activityId: edited.id ?? null,
      staffUserIds: [candidateId],
    }, 'COMMS_STAFF_CLASH')).then((action) => {
      if (alive) setClashes((action?.payload?.data?.activityConflicts ?? []).filter((c) => c.type === 'STAFF'));
    });
    return () => { alive = false; };
  }, [candidateId, edited?.startDatetime, edited?.endDatetime]);
  const blocked = clashes.some((c) => c.hard);

  useEffect(() => {
    if (toDelete) {
      coreConfirm(
        formatMessage('communications.assignment.deleteDialog.title'),
        formatMessageWithValues('communications.assignment.deleteDialog.message', { name: staffUserName(toDelete.staffUser) }),
      );
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) deleteAssignment(toDelete, formatMessage('communications.assignment.delete'));
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);

  const setStatus = (a, status) => status && saveAssignment({
    id: a.id, activityId, staffUserId: a.staffUser?.id, role: a.role, status, notes: a.notes,
  }, formatMessage('communications.assignment.update'));
  const items = assignments ?? [];

  const add = () => {
    if (!row.staffUser || blocked) return;
    saveAssignment({ activityId, staffUserId: row.staffUser.id, role: row.role, status: row.status, notes: row.notes }, formatMessage('communications.assignment.add'));
    setRow(BLANK);
  };
  return (
    <>
      {!readOnly && (
        <>
          <Grid container className={classes.form}>
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>{formatMessage('communications.assignment.add')}</Typography>
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <StaffUserPicker withLabel required value={row.staffUser} onChange={(v) => setRow((r) => ({ ...r, staffUser: v }))} />
            </Grid>
            <Grid item xs={6} md={2} className={classes.item}>
              <AssignmentRolePicker withLabel value={row.role} onChange={(v) => setRow((r) => ({ ...r, role: v || BLANK.role }))} />
            </Grid>
            <Grid item xs={6} md={2} className={classes.item}>
              <AssignmentStatusPicker withLabel value={row.status} onChange={(v) => setRow((r) => ({ ...r, status: v || BLANK.status }))} />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.assignment.notes"
                value={row.notes} onChange={(v) => setRow((r) => ({ ...r, notes: v }))} />
            </Grid>
            {clashes.length > 0 && (
              <Grid item xs={12} className={classes.item}>
                <Grid container>
                  <ConflictPanel
                    conflicts={clashes}
                    hardTitle={formatMessage('communications.conflict.hardTitle')}
                    softTitle={formatMessage('communications.conflict.softTitle')}
                    viewLabel={formatMessage('communications.conflict.open')}
                    hrefFor={(c) => (c.conflictingActivityId
                      ? history.createHref({ pathname: `/${modulesManager.getRef(COMMS_ROUTE_ACTIVITY)}/${c.conflictingActivityId}` })
                      : null)}
                  />
                </Grid>
              </Grid>
            )}
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              <Button variant="contained" color="primary" onClick={add} disabled={!row.staffUser || blocked}>
                {formatMessage('communications.assignment.add')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
        </>
      )}
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>{formatMessage('communications.assignment.staff')}</TableCell>
          <TableCell>{formatMessage('communications.assignment.role')}</TableCell>
          <TableCell>{formatMessage('communications.assignment.status')}</TableCell>
          <TableCell>{formatMessage('communications.assignment.notes')}</TableCell>
          <TableCell />
        </TableRow></TableHead>
        <TableBody>
          {!items.length && (
            <TableRow>
              <TableCell colSpan={5} className={classes.empty}>{formatMessage('communications.assignment.empty')}</TableCell>
            </TableRow>
          )}
          {items.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{staffUserName(a.staffUser)}</TableCell>
              <TableCell>{a.role ? formatMessage(`communications.role.${a.role}`) : ''}</TableCell>
              <TableCell>
                <AssignmentStatusPicker readOnly={readOnly} value={a.status} onChange={(v) => setStatus(a, v)} />
              </TableCell>
              <TableCell>{a.notes}</TableCell>
              <TableCell>{!readOnly && (
                <Tooltip title={formatMessage('deleteButton.tooltip')}>
                  <IconButton size="small" onClick={() => setToDelete(a)}><DeleteIcon /></IconButton>
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
  assignments: s.communications.assignments,
  submittingMutation: s.communications.submittingMutation,
  mutation: s.communications.mutation,
  confirmed: s.core.confirmed,
});
const mapDispatch = (d) => bindActionCreators({
  fetchAssignments, saveAssignment, deleteAssignment, journalize, coreConfirm, clearConfirm,
}, d);
export default connect(mapState, mapDispatch)(AssignmentsPanel);
