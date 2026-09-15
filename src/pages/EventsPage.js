import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { Fab } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import {
  Helmet, useTranslations, useModulesManager, useHistory, withTooltip,
} from '@openimis/fe-core';
import {
  MODULE_NAME, RIGHT_ACTIVITY_SEARCH, RIGHT_ACTIVITY_CREATE, COMMS_ROUTE_EVENT,
  ACTIVITY_TYPE_EVENT,
} from '../constants';
import ActivitySearcher from '../components/ActivitySearcher';

const useStyles = makeStyles((theme) => ({ page: theme.page, fab: theme.fab }));

// Events are CommunicationActivities of a gathering-shaped type — the same entity behind a
// purpose-built view, so they stay on the unified calendar and in the activity dashboards
// rather than becoming a parallel record nothing else knows about.
// Choice fields are GraphQL ENUMS: unquoted literal, not a string.
const EVENT_FILTER = [`activityType: ${ACTIVITY_TYPE_EVENT}`];

function EventsPage() {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const onCreate = () => history.push(`/${modulesManager.getRef(COMMS_ROUTE_EVENT)}`);
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('communications.events.page.title')} />
      {rights.includes(RIGHT_ACTIVITY_SEARCH) && <ActivitySearcher extraFilters={EVENT_FILTER} detailRoute={COMMS_ROUTE_EVENT} />}
      {rights.includes(RIGHT_ACTIVITY_CREATE) && withTooltip(
        <div className={classes.fab}><Fab color="primary" onClick={onCreate}><AddIcon /></Fab></div>,
        formatMessage('createButton.tooltip'),
      )}
    </div>
  );
}
export default EventsPage;
