import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, TextField,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { useModulesManager, useTranslations, journalize } from '@openimis/fe-core';
import { fetchObjectives, saveObjective, deleteObjective } from '../actions';

const EMPTY = { description: '', indicator: '', targetValue: '', achievedValue: '' };
function ObjectivesPanel({
  activityId, readOnly, objectives, submittingMutation, mutation, fetchObjectives, saveObjective, deleteObjective, journalize,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(EMPTY);
  const prev = useRef();
  useEffect(() => { if (activityId) fetchObjectives(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchObjectives(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const add = () => {
    if (!row.description) return;
    saveObjective({ ...row, activityId }, formatMessage('communications.objective.add'));
    setRow(EMPTY);
  };
  const cell = (k, ph) => (<TextField value={row[k]} placeholder={ph} onChange={(e) => setRow({ ...row, [k]: e.target.value })} />);
  return (
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>{formatMessage('communications.objective.description')}</TableCell>
        <TableCell>{formatMessage('communications.objective.indicator')}</TableCell>
        <TableCell>{formatMessage('communications.objective.target')}</TableCell>
        <TableCell>{formatMessage('communications.objective.achieved')}</TableCell>
        <TableCell />
      </TableRow></TableHead>
      <TableBody>
        {(objectives ?? []).map((o) => (
          <TableRow key={o.id}>
            <TableCell>{o.description}</TableCell>
            <TableCell>{o.indicator}</TableCell>
            <TableCell>{o.targetValue}</TableCell>
            <TableCell>{o.achievedValue}</TableCell>
            <TableCell>{!readOnly && (
              <Tooltip title={formatMessage('deleteButton.tooltip')}>
                <IconButton size="small" onClick={() => deleteObjective(o, formatMessage('communications.objective.delete'))}><DeleteIcon /></IconButton>
              </Tooltip>)}
            </TableCell>
          </TableRow>
        ))}
        {!readOnly && (
          <TableRow>
            <TableCell>{cell('description', 'objective')}</TableCell>
            <TableCell>{cell('indicator', 'indicator')}</TableCell>
            <TableCell>{cell('targetValue', 'target')}</TableCell>
            <TableCell>{cell('achievedValue', 'achieved')}</TableCell>
            <TableCell><Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.description}>{formatMessage('addButton')}</Button></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
const mapState = (s) => ({ objectives: s.communications.objectives, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation });
const mapDispatch = (d) => bindActionCreators({ fetchObjectives, saveObjective, deleteObjective, journalize }, d);
export default connect(mapState, mapDispatch)(ObjectivesPanel);
