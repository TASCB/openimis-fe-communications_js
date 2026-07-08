import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, TextField,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { useModulesManager, useTranslations, journalize } from '@openimis/fe-core';
import { fetchAssignments, saveAssignment, deleteAssignment } from '../actions';
import StaffUserPicker from '../pickers/StaffUserPicker';
import { AssignmentRolePicker, AssignmentStatusPicker } from '../pickers/ConstantPickers';

function AssignmentsPanel({
  activityId, readOnly, assignments, submittingMutation, mutation, fetchAssignments, saveAssignment, deleteAssignment, journalize,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState({ staffUser: null, role: 'CONTRIBUTOR', status: 'ASSIGNED', notes: '' });
  const prev = useRef();
  useEffect(() => { if (activityId) fetchAssignments(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchAssignments(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const add = () => {
    if (!row.staffUser) return;
    saveAssignment({ activityId, staffUserId: row.staffUser.id, role: row.role, status: row.status, notes: row.notes }, formatMessage('communications.assignment.add'));
    setRow({ staffUser: null, role: 'CONTRIBUTOR', status: 'ASSIGNED', notes: '' });
  };
  return (
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
            <TableCell>{a.staffUser?.username}</TableCell>
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
        {!readOnly && (
          <TableRow>
            <TableCell><StaffUserPicker withLabel value={row.staffUser} onChange={(v) => setRow({ ...row, staffUser: v })} /></TableCell>
            <TableCell><AssignmentRolePicker value={row.role} onChange={(v) => setRow({ ...row, role: v })} /></TableCell>
            <TableCell><AssignmentStatusPicker value={row.status} onChange={(v) => setRow({ ...row, status: v })} /></TableCell>
            <TableCell><TextField value={row.notes} onChange={(e) => setRow({ ...row, notes: e.target.value })} /></TableCell>
            <TableCell><Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.staffUser}>{formatMessage('addButton')}</Button></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
const mapState = (s) => ({ assignments: s.communications.assignments, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation });
const mapDispatch = (d) => bindActionCreators({ fetchAssignments, saveAssignment, deleteAssignment, journalize }, d);
export default connect(mapState, mapDispatch)(AssignmentsPanel);
