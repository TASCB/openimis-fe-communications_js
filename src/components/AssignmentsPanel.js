import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, Grid, Typography, Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import { useModulesManager, useTranslations, journalize, TextInput } from '@openimis/fe-core';
import { fetchAssignments, saveAssignment, deleteAssignment } from '../actions';
import StaffUserPicker, { staffUserName } from '../pickers/StaffUserPicker';
import { AssignmentRolePicker, AssignmentStatusPicker } from '../pickers/ConstantPickers';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  actions: { display: 'flex', justifyContent: 'flex-end' },
}));

const BLANK = {
  staffUser: null, role: 'CONTRIBUTOR', status: 'ASSIGNED', notes: '',
};

function AssignmentsPanel({
  activityId, readOnly, assignments, submittingMutation, mutation, fetchAssignments, saveAssignment, deleteAssignment, journalize,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(BLANK);
  const prev = useRef();
  useEffect(() => { if (activityId) fetchAssignments(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchAssignments(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const add = () => {
    if (!row.staffUser) return;
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
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              <Button variant="contained" color="primary" onClick={add} disabled={!row.staffUser}>
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
          {(assignments ?? []).map((a) => (
            <TableRow key={a.id}>
              <TableCell>{staffUserName(a.staffUser)}</TableCell>
              <TableCell>{a.role ? formatMessage(`communications.role.${a.role}`) : ''}</TableCell>
              <TableCell>{a.status ? formatMessage(`communications.assignmentStatus.${a.status}`) : ''}</TableCell>
              <TableCell>{a.notes}</TableCell>
              <TableCell>{!readOnly && (
                <Tooltip title={formatMessage('deleteButton.tooltip')}>
                  <IconButton size="small" onClick={() => deleteAssignment(a, formatMessage('communications.assignment.delete'))}><DeleteIcon /></IconButton>
                </Tooltip>)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
const mapState = (s) => ({ assignments: s.communications.assignments, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation });
const mapDispatch = (d) => bindActionCreators({ fetchAssignments, saveAssignment, deleteAssignment, journalize }, d);
export default connect(mapState, mapDispatch)(AssignmentsPanel);
