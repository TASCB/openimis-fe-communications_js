import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip,
  TextField, Typography, Box,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  useModulesManager, useTranslations, journalize, PublishedComponent,
} from '@openimis/fe-core';
import { fetchParticipants, saveParticipant, deleteParticipant } from '../actions';
import StakeholderTypePicker from '../pickers/StakeholderTypePicker';
import { GenderPicker, AttendanceStatusPicker } from '../pickers/ConstantPickers';

const BLANK = {
  fullName: '', gender: null, stakeholderType: null, organization: '',
  title: '', phone: '', attendanceStatus: 'ATTENDED', individual: null,
};

function ParticipantsPanel({
  activityId, readOnly, participants, submittingMutation, mutation,
  fetchParticipants, saveParticipant, deleteParticipant, journalize,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(BLANK);
  const prev = useRef();

  useEffect(() => { if (activityId) fetchParticipants(activityId); }, [activityId]);
  useEffect(() => {
    if (prev.current && !submittingMutation) {
      journalize(mutation);
      if (activityId) fetchParticipants(activityId);
    }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const add = () => {
    if (!row.fullName) return;
    saveParticipant({
      activityId,
      fullName: row.fullName,
      gender: row.gender,
      stakeholderTypeId: row.stakeholderType?.id,
      organization: row.organization,
      title: row.title,
      phone: row.phone,
      attendanceStatus: row.attendanceStatus,
      individualId: row.individual?.id,
    }, formatMessage('communications.participant.add'));
    setRow(BLANK);
  };

  // Attendance is the field that changes most after the event, so it is editable in place.
  const setStatus = (p, value) => saveParticipant({
    id: p.id, activityId, fullName: p.fullName, attendanceStatus: value,
  }, formatMessage('communications.participant.update'));

  const items = participants ?? [];
  const attended = items.filter((p) => p.attendanceStatus === 'ATTENDED').length;

  return (
    <>
      <Box px={1} pt={1}>
        <Typography variant="body2" color="textSecondary">
          {formatMessage('communications.participant.summary')
            .replace('{total}', items.length).replace('{attended}', attended)}
        </Typography>
      </Box>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>{formatMessage('communications.participant.name')}</TableCell>
          <TableCell>{formatMessage('communications.gender')}</TableCell>
          <TableCell>{formatMessage('communications.participant.stakeholderType')}</TableCell>
          <TableCell>{formatMessage('communications.participant.organization')}</TableCell>
          <TableCell>{formatMessage('communications.participant.contact')}</TableCell>
          <TableCell>{formatMessage('communications.attendanceStatus')}</TableCell>
          <TableCell />
        </TableRow></TableHead>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                {p.fullName}
                {p.individual && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    {formatMessage('communications.participant.linkedBeneficiary')}
                  </div>
                )}
              </TableCell>
              <TableCell>{p.gender ? formatMessage(`communications.gender.${p.gender}`) : ''}</TableCell>
              <TableCell>{p.stakeholderType?.name ?? ''}</TableCell>
              <TableCell>{[p.title, p.organization].filter(Boolean).join(', ')}</TableCell>
              <TableCell>{[p.phone, p.email].filter(Boolean).join(' · ')}</TableCell>
              <TableCell>
                <AttendanceStatusPicker readOnly={readOnly} value={p.attendanceStatus}
                  onChange={(v) => setStatus(p, v)} />
              </TableCell>
              <TableCell>{!readOnly && (
                <Tooltip title={formatMessage('deleteButton.tooltip')}>
                  <IconButton size="small" onClick={() => deleteParticipant(p, formatMessage('communications.participant.delete'))}><DeleteIcon /></IconButton>
                </Tooltip>)}
              </TableCell>
            </TableRow>
          ))}
          {!readOnly && (
            <TableRow>
              <TableCell>
                <TextField value={row.fullName} placeholder={formatMessage('communications.participant.name')}
                  onChange={(e) => setRow({ ...row, fullName: e.target.value })} />
              </TableCell>
              <TableCell>
                <GenderPicker withNull value={row.gender} onChange={(v) => setRow({ ...row, gender: v })} />
              </TableCell>
              <TableCell>
                <StakeholderTypePicker value={row.stakeholderType} onChange={(v) => setRow({ ...row, stakeholderType: v })} />
              </TableCell>
              <TableCell>
                <TextField value={row.organization} placeholder={formatMessage('communications.participant.organization')}
                  onChange={(e) => setRow({ ...row, organization: e.target.value })} />
              </TableCell>
              <TableCell>
                <TextField value={row.phone} placeholder={formatMessage('communications.mediaHouse.phone')}
                  onChange={(e) => setRow({ ...row, phone: e.target.value })} />
              </TableCell>
              <TableCell>
                <AttendanceStatusPicker value={row.attendanceStatus} onChange={(v) => setRow({ ...row, attendanceStatus: v })} />
              </TableCell>
              <TableCell>
                <Button variant="contained" size="small" color="primary" onClick={add} disabled={!row.fullName}>
                  {formatMessage('addButton')}
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!readOnly && (
        <Box px={1} pb={1} display="flex" alignItems="center" style={{ gap: 8 }}>
          <Typography variant="caption" color="textSecondary">
            {formatMessage('communications.participant.linkBeneficiary')}
          </Typography>
          {/* Beneficiaries are SELECTED here, never created — an attendance list must not
              mint Individual rows. */}
          <PublishedComponent pubRef="individual.IndividualPicker" withLabel={false}
            value={row.individual} onChange={(v) => setRow({ ...row, individual: v })} />
        </Box>
      )}
    </>
  );
}
const mapState = (s) => ({
  participants: s.communications.participants,
  submittingMutation: s.communications.submittingMutation,
  mutation: s.communications.mutation,
});
const mapDispatch = (d) => bindActionCreators({
  fetchParticipants, saveParticipant, deleteParticipant, journalize,
}, d);
export default connect(mapState, mapDispatch)(ParticipantsPanel);
