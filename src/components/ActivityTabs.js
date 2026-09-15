import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Paper, Grid, Tab } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import {
  RIGHT_ATTACHMENT_SEARCH, RIGHT_ACTIVITY_CHANNEL_MANAGE, RIGHT_OBJECTIVE_MANAGE,
  RIGHT_AUDIENCE_MANAGE, RIGHT_ASSIGNMENT_MANAGE, RIGHT_FEEDBACK_MANAGE,
  RIGHT_ACTIVITY_UPDATE, RIGHT_MEDIA_HOUSE_SEARCH, ACTIVITY_STATUS,
  RIGHT_PARTICIPANT_SEARCH, RIGHT_PARTICIPANT_CREATE,
} from '../constants';
import ChannelsPanel from './ChannelsPanel';
import ObjectivesPanel from './ObjectivesPanel';
import AudiencePanel from './AudiencePanel';
import MediaPanel from './MediaPanel';
import ParticipantsPanel from './ParticipantsPanel';
import AssignmentsPanel from './AssignmentsPanel';
import AttachmentsPanel from './AttachmentsPanel';
import FeedbackPanel from './FeedbackPanel';

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  tabs: { display: 'flex', alignItems: 'center' },
  selectedTab: { borderBottom: '4px solid white' },
  unselectedTab: { borderBottom: '4px solid transparent' },
  content: { padding: theme.spacing(1) },
}));

// Coverage and attendance are recorded AFTER the event, so these two tabs compute their own
// readOnly instead of inheriting the form's Draft-only lock.
const COVERAGE_LOCKED_STATUSES = [ACTIVITY_STATUS.ARCHIVED, ACTIVITY_STATUS.CANCELLED];

function ActivityTabs({ activityId, readOnly, edited }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);

  const afterEventLocked = COVERAGE_LOCKED_STATUSES.includes(edited?.status);
  const coverageReadOnly = !rights.includes(RIGHT_ACTIVITY_UPDATE) || afterEventLocked;
  const participantsReadOnly = !rights.includes(RIGHT_PARTICIPANT_CREATE) || afterEventLocked;

  const tabs = useMemo(() => [
    { key: 'channels', label: 'communications.tab.channels', ro: !rights.includes(RIGHT_ACTIVITY_CHANNEL_MANAGE), render: (ro) => <ChannelsPanel activityId={activityId} readOnly={ro} /> },
    { key: 'objectives', label: 'communications.tab.objectives', ro: !rights.includes(RIGHT_OBJECTIVE_MANAGE), render: (ro) => <ObjectivesPanel activityId={activityId} readOnly={ro} /> },
    { key: 'audience', label: 'communications.tab.audience', ro: !rights.includes(RIGHT_AUDIENCE_MANAGE), render: (ro) => <AudiencePanel activityId={activityId} readOnly={ro} /> },
    ...(rights.includes(RIGHT_PARTICIPANT_SEARCH) ? [{ key: 'participants', label: 'communications.tab.participants', ownReadOnly: true, ro: participantsReadOnly, render: (ro) => <ParticipantsPanel activityId={activityId} readOnly={ro} /> }] : []),
    ...(rights.includes(RIGHT_MEDIA_HOUSE_SEARCH) ? [{ key: 'media', label: 'communications.tab.media', ownReadOnly: true, ro: coverageReadOnly, render: (ro) => <MediaPanel activityId={activityId} readOnly={ro} /> }] : []),
    { key: 'assignments', label: 'communications.tab.assignments', ro: !rights.includes(RIGHT_ASSIGNMENT_MANAGE), render: (ro) => <AssignmentsPanel activityId={activityId} readOnly={ro} /> },
    ...(rights.includes(RIGHT_ATTACHMENT_SEARCH) ? [{ key: 'attachments', label: 'communications.tab.attachments', ro: false, render: (ro) => <AttachmentsPanel activityId={activityId} readOnly={ro} /> }] : []),
    { key: 'feedback', label: 'communications.tab.feedback', ro: !rights.includes(RIGHT_FEEDBACK_MANAGE), render: (ro) => <FeedbackPanel activityId={activityId} readOnly={ro} /> },
  ], [activityId, rights, coverageReadOnly, participantsReadOnly]);

  const [active, setActive] = useState(0);
  const index = Math.min(active, tabs.length - 1);
  const current = tabs[index];
  return (
    <Paper className={classes.paper} style={{ marginTop: 8 }}>
      <Grid container className={`${classes.tableTitle} ${classes.tabs}`}>
        {tabs.map((t, i) => (
          <Tab key={t.key} onClick={() => setActive(i)} selected={i === index}
            className={i === index ? classes.selectedTab : classes.unselectedTab}
            label={formatMessage(t.label)} />
        ))}
      </Grid>
      <div className={classes.content}>
        {current && current.render(current.ownReadOnly ? current.ro : (readOnly || current.ro))}
      </div>
    </Paper>
  );
}
export default ActivityTabs;
