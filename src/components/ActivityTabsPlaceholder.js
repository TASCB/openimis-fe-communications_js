import React from 'react';
import { Paper, Grid, Tab, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useModulesManager, useTranslations } from '@openimis/fe-core';

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  tabs: { display: 'flex', alignItems: 'center', opacity: 0.45 },
  unselectedTab: { borderBottom: '4px solid transparent' },
  content: { padding: theme.spacing(2) },
}));

// Shown while creating. The child sections only exist once the activity has an id, so without
// this the create page looks like the entire form and there is no sign that participants,
// coverage and materials are captured later.
const PENDING_TABS = [
  'communications.tab.channels', 'communications.tab.objectives', 'communications.tab.audience',
  'communications.tab.participants', 'communications.tab.media', 'communications.tab.assignments',
  'communications.tab.attachments', 'communications.tab.feedback',
];

function ActivityTabsPlaceholder() {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  return (
    <Paper className={classes.paper} style={{ marginTop: 8 }}>
      <Grid container className={`${classes.tableTitle} ${classes.tabs}`}>
        {PENDING_TABS.map((t) => (
          <Tab key={t} disabled className={classes.unselectedTab} label={formatMessage(t)} />
        ))}
      </Grid>
      <Box className={classes.content}>
        <Typography variant="body2" color="textSecondary">
          {formatMessage('communications.tabs.saveFirst')}
        </Typography>
      </Box>
    </Paper>
  );
}
export default ActivityTabsPlaceholder;
