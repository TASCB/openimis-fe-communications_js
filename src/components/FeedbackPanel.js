import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip, TextField,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { useModulesManager, useTranslations, journalize } from '@openimis/fe-core';
import { fetchFeedback, saveFeedback, deleteFeedback } from '../actions';

const EMPTY = { source: '', respondent: '', rating: '', comment: '' };
function FeedbackPanel({
  activityId, readOnly, feedback, submittingMutation, mutation, fetchFeedback, saveFeedback, deleteFeedback, journalize,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(EMPTY);
  const prev = useRef();
  useEffect(() => { if (activityId) fetchFeedback(activityId); }, [activityId]);
  useEffect(() => { if (prev.current && !submittingMutation) { journalize(mutation); if (activityId) fetchFeedback(activityId); } }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  const add = () => {
    if (!row.comment && !row.source) return;
    saveFeedback({ ...row, activityId }, formatMessage('communications.feedback.add'));
    setRow(EMPTY);
  };
  const cell = (k, ph) => (<TextField value={row[k]} placeholder={ph} onChange={(e) => setRow({ ...row, [k]: e.target.value })} />);
  return (
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>{formatMessage('communications.feedback.source')}</TableCell>
        <TableCell>{formatMessage('communications.feedback.respondent')}</TableCell>
        <TableCell>{formatMessage('communications.feedback.rating')}</TableCell>
        <TableCell>{formatMessage('communications.feedback.comment')}</TableCell>
        <TableCell />
      </TableRow></TableHead>
      <TableBody>
        {(feedback ?? []).map((f) => (
          <TableRow key={f.id}>
            <TableCell>{f.source}</TableCell>
            <TableCell>{f.respondent}</TableCell>
            <TableCell>{f.rating}</TableCell>
            <TableCell>{f.comment}</TableCell>
            <TableCell>{!readOnly && (
              <Tooltip title={formatMessage('deleteButton.tooltip')}>
                <IconButton size="small" onClick={() => deleteFeedback(f, formatMessage('communications.feedback.delete'))}><DeleteIcon /></IconButton>
              </Tooltip>)}
            </TableCell>
          </TableRow>
        ))}
        {!readOnly && (
          <TableRow>
            <TableCell>{cell('source', 'source')}</TableCell>
            <TableCell>{cell('respondent', 'respondent')}</TableCell>
            <TableCell>{cell('rating', '0-5')}</TableCell>
            <TableCell>{cell('comment', 'comment')}</TableCell>
            <TableCell><Button variant="contained" size="small" color="primary" onClick={add}>{formatMessage('addButton')}</Button></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
const mapState = (s) => ({ feedback: s.communications.feedback, submittingMutation: s.communications.submittingMutation, mutation: s.communications.mutation });
const mapDispatch = (d) => bindActionCreators({ fetchFeedback, saveFeedback, deleteFeedback, journalize }, d);
export default connect(mapState, mapDispatch)(FeedbackPanel);
