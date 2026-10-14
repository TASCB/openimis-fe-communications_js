import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Tooltip,
  Typography, Box, Grid, Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  useModulesManager, useTranslations, journalize, PublishedComponent, TextInput, coreConfirm, clearConfirm,
} from '@openimis/fe-core';
import {
  fetchParticipants, saveParticipant, deleteParticipant, addParticipantsFromList,
} from '../actions';
import StakeholderTypePicker from '../pickers/StakeholderTypePicker';
import StakeholderListPicker from '../pickers/StakeholderListPicker';
import { GenderPicker, AttendanceStatusPicker } from '../pickers/ConstantPickers';
import { GENDER_LIST, RIGHT_STAKEHOLDER_SEARCH } from '../constants';

const useStyles = makeStyles((theme) => ({
  form: { padding: theme.spacing(1, 0) },
  item: theme.paper.item,
  formTitle: { color: theme.palette.primary.main, fontWeight: 500 },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  empty: { color: theme.palette.text.secondary, textAlign: 'center', padding: theme.spacing(3) },
}));

function beneficiaryGender(individual) {
  let ext = individual?.jsonExt;
  if (typeof ext === 'string') {
    try { ext = JSON.parse(ext); } catch (e) { ext = null; }
  }
  const g = ext?.gender;
  return GENDER_LIST.includes(g) ? g : null;
}

const BLANK = {
  fullName: '', gender: null, stakeholderType: null, organization: '',
  title: '', phone: '', email: '', attendanceStatus: 'ATTENDED', individual: null,
};

function ParticipantsPanel({
  activityId, readOnly, participants, submittingMutation, mutation, confirmed, rights,
  fetchParticipants, saveParticipant, deleteParticipant, addParticipantsFromList, journalize, coreConfirm, clearConfirm,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const [row, setRow] = useState(BLANK);
  const [toDelete, setToDelete] = useState(null);
  const [fromList, setFromList] = useState(null);
  const canUseLists = (rights ?? []).includes(RIGHT_STAKEHOLDER_SEARCH);
  const prev = useRef();

  useEffect(() => { if (activityId) fetchParticipants(activityId); }, [activityId]);
  useEffect(() => {
    if (prev.current && !submittingMutation) {
      journalize(mutation);
      if (activityId) fetchParticipants(activityId);
    }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });
  useEffect(() => {
    if (toDelete) {
      coreConfirm(
        formatMessage('communications.participant.deleteDialog.title'),
        formatMessageWithValues('communications.participant.deleteDialog.message', { name: toDelete.fullName }),
      );
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) deleteParticipant(toDelete, formatMessage('communications.participant.delete'));
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);

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
      email: row.email,
      attendanceStatus: row.attendanceStatus,
      individualId: row.individual?.id,
    }, formatMessage('communications.participant.add'));
    setRow(BLANK);
  };

  const setStatus = (p, value) => value && saveParticipant({
    id: p.id, activityId, fullName: p.fullName, attendanceStatus: value,
  }, formatMessage('communications.participant.update'));

  const pickBeneficiary = (v) => setRow((r) => {
    if (!v) return { ...r, individual: null };
    const name = [v.firstName, v.lastName].filter(Boolean).join(' ');
    const gender = beneficiaryGender(v);
    return {
      ...r, individual: v, fullName: name || r.fullName, gender: gender || r.gender,
    };
  });

  const items = participants ?? [];
  const importList = () => {
    addParticipantsFromList(activityId, fromList.id,
      formatMessageWithValues('communications.participant.inviteListLabel', { name: fromList.name }));
    setFromList(null);
  };
  const attended = items.filter((p) => p.attendanceStatus === 'ATTENDED').length;

  return (
    <>
      {!readOnly && (
        <>
          <Grid container className={classes.form}>
            <Grid item xs={12} className={classes.item}>
              <Typography className={classes.formTitle}>{formatMessage('communications.participant.add')}</Typography>
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <PublishedComponent
                pubRef="individual.IndividualPicker"
                withLabel
                label={formatMessage('communications.participant.linkBeneficiary')}
                value={row.individual}
                onChange={pickBeneficiary}
              />
            </Grid>
            <Grid item xs={12} md={4} className={classes.item}>
              <TextInput module="communications" label="communications.participant.name" required
                value={row.fullName} onChange={(v) => setRow((r) => ({ ...r, fullName: v }))} />
            </Grid>
            <Grid item xs={6} md={2} className={classes.item}>
              <GenderPicker withLabel withNull value={row.gender} onChange={(v) => setRow((r) => ({ ...r, gender: v || null }))} />
            </Grid>
            <Grid item xs={6} md={2} className={classes.item}>
              <AttendanceStatusPicker withLabel value={row.attendanceStatus}
                onChange={(v) => setRow((r) => ({ ...r, attendanceStatus: v || 'ATTENDED' }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <StakeholderTypePicker withLabel value={row.stakeholderType} onChange={(v) => setRow((r) => ({ ...r, stakeholderType: v }))} />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <TextInput module="communications" label="communications.participant.organisationOnly"
                value={row.organization} onChange={(v) => setRow((r) => ({ ...r, organization: v }))} />
            </Grid>
            <Grid item xs={6} md={2} className={classes.item}>
              <TextInput module="communications" label="communications.participant.designation"
                value={row.title} onChange={(v) => setRow((r) => ({ ...r, title: v }))} />
            </Grid>
            <Grid item xs={6} md={2} className={classes.item}>
              <TextInput module="communications" label="communications.participant.phone"
                value={row.phone} onChange={(v) => setRow((r) => ({ ...r, phone: v }))} />
            </Grid>
            <Grid item xs={12} md={2} className={classes.item}>
              <TextInput module="communications" label="communications.participant.email"
                value={row.email} onChange={(v) => setRow((r) => ({ ...r, email: v }))} />
            </Grid>
            <Grid item xs={12} className={`${classes.item} ${classes.actions}`}>
              <Button variant="contained" color="primary" onClick={add} disabled={!row.fullName}>
                {formatMessage('communications.participant.add')}
              </Button>
            </Grid>
          </Grid>
          <Divider />
          {canUseLists && (
            <>
              <Grid container className={classes.form} alignItems="center">
                <Grid item xs={12} className={classes.item}>
                  <Typography className={classes.formTitle}>{formatMessage('communications.participant.fromList')}</Typography>
                </Grid>
                <Grid item xs={12} md={6} className={classes.item}>
                  <StakeholderListPicker withLabel value={fromList} onChange={(v) => setFromList(v)} />
                </Grid>
                <Grid item xs={12} md={6} className={`${classes.item} ${classes.actions}`}>
                  <Button variant="outlined" color="primary" disabled={!fromList} onClick={importList}>
                    {formatMessage('communications.participant.inviteList')}
                  </Button>
                </Grid>
              </Grid>
              <Divider />
            </>
          )}
        </>
      )}
      <Box px={1} pt={1}>
        <Typography variant="body2" color="textSecondary">
          {formatMessageWithValues('communications.participant.summary', { total: items.length, attended })}
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
          {!items.length && (
            <TableRow>
              <TableCell colSpan={7} className={classes.empty}>{formatMessage('communications.participant.empty')}</TableCell>
            </TableRow>
          )}
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
                  <IconButton size="small" onClick={() => setToDelete(p)}><DeleteIcon /></IconButton>
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
  participants: s.communications.participants,
  submittingMutation: s.communications.submittingMutation,
  rights: s.core.user?.i_user?.rights,
  mutation: s.communications.mutation,
  confirmed: s.core.confirmed,
});
const mapDispatch = (d) => bindActionCreators({
  fetchParticipants, saveParticipant, deleteParticipant, addParticipantsFromList, journalize, coreConfirm, clearConfirm,
}, d);
export default connect(mapState, mapDispatch)(ParticipantsPanel);
