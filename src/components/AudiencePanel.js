import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, TextField,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { useModulesManager, useTranslations, journalize } from '@openimis/fe-core';
import { fetchAudiences, saveAudience, deleteAudience } from '../actions';
import StakeholderTypePicker from '../pickers/StakeholderTypePicker';

function AudiencePanel({
  activityId, readOnly, resultsOnly, audiences, submittingMutation, mutation, fetchAudiences, saveAudience, deleteAudience, journalize,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState({ stakeholderType: null, plannedCount: '', actualCount: '' });
  const [editing, setEditing] = useState(null);
  const save = () => {
    saveAudience({
      id: editing.id, activityId, stakeholderType: editing.stakeholderType,
      plannedCount: editing.plannedCount, actualCount: editing.actualCount, notes: editing.notes,
    }, formatMessage('communications.audience.update'));
    setEditing(null);
  };
  const prev = useRef();
  useEffect(() => { if (activityId) fetchAudiences(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchAudiences(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const add = () => {
    if (!row.stakeholderType) return;
    saveAudience({ activityId, stakeholderTypeId: row.stakeholderType.id, plannedCount: row.plannedCount, actualCount: row.actualCount }, formatMessage('communications.audience.add'));
    setRow({ stakeholderType: null, plannedCount: '', actualCount: '' });
  };
  return (
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>{formatMessage('communications.audience.stakeholder')}</TableCell>
        <TableCell>{formatMessage('communications.audience.level')}</TableCell>
        <TableCell>{formatMessage('communications.audience.planned')}</TableCell>
        <TableCell>{formatMessage('communications.audience.actual')}</TableCell>
        <TableCell />
      </TableRow></TableHead>
      <TableBody>
        {(audiences ?? []).map((a) => (
          <TableRow key={a.id}>
            <TableCell>{a.stakeholderType?.name}</TableCell>
            <TableCell>{a.stakeholderType?.level ? formatMessage(`communications.level.${a.stakeholderType.level}`) : ''}</TableCell>
            {editing?.id === a.id ? (
              <>
                <TableCell>
                  <TextField value={editing.plannedCount ?? ''} disabled={resultsOnly}
                    onChange={(e) => setEditing({ ...editing, plannedCount: e.target.value })} />
                </TableCell>
                <TableCell>
                  <TextField value={editing.actualCount ?? ''} onChange={(e) => setEditing({ ...editing, actualCount: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Button size="small" color="primary" variant="contained" onClick={save}>{formatMessage('communications.save')}</Button>
                  <Button size="small" onClick={() => setEditing(null)}>{formatMessage('communications.cancel')}</Button>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>{a.plannedCount}</TableCell>
                <TableCell>{a.actualCount}</TableCell>
                <TableCell>{!readOnly && (
                  <>
                    <Tooltip title={formatMessage('communications.audience.update')}>
                      <IconButton size="small" onClick={() => setEditing({ ...a })}><EditIcon /></IconButton>
                    </Tooltip>
                    {!resultsOnly && (
                      <Tooltip title={formatMessage('deleteButton.tooltip')}>
                        <IconButton size="small" onClick={() => deleteAudience(a, formatMessage('communications.audience.delete'))}><DeleteIcon /></IconButton>
                      </Tooltip>
                    )}
                  </>)}
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
        {!readOnly && !resultsOnly && (
          <TableRow>
            <TableCell colSpan={2}><StakeholderTypePicker withLabel value={row.stakeholderType} onChange={(v) => setRow({ ...row, stakeholderType: v })} /></TableCell>
            <TableCell><TextField value={row.plannedCount} placeholder="planned" onChange={(e) => setRow({ ...row, plannedCount: e.target.value })} /></TableCell>
            <TableCell><TextField value={row.actualCount} placeholder="actual" onChange={(e) => setRow({ ...row, actualCount: e.target.value })} /></TableCell>
            <TableCell><Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.stakeholderType}>{formatMessage('addButton')}</Button></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
const mapState = (s) => ({ audiences: s.communications.audiences, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation });
const mapDispatch = (d) => bindActionCreators({ fetchAudiences, saveAudience, deleteAudience, journalize }, d);
export default connect(mapState, mapDispatch)(AudiencePanel);
