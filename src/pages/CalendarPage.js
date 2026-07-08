import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Helmet, useTranslations, useModulesManager, useHistory,
} from '@openimis/fe-core';
import ModuleCalendar from '../components/ModuleCalendar';
import {
  MODULE_NAME, STATUS_COLORS, ACTIVITY_STATUS_LIST,
  COMMS_ROUTE_ACTIVITY, RIGHT_ACTIVITY_CREATE,
} from '../constants';
import { fetchCalendar } from '../actions';
import { toISO } from '../utils/dates';

const useStyles = makeStyles((theme) => ({ page: theme.page }));

function CalendarPage() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const events = useSelector((s) => s.communications.calendar);
  const fetching = useSelector((s) => s.communications.fetchingCalendar);
  const error = useSelector((s) => s.communications.errorCalendar);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);

  const detailRef = modulesManager.getRef(COMMS_ROUTE_ACTIVITY);

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('communications.calendar.page.title')} />
      <ModuleCalendar
        moduleName={MODULE_NAME}
        events={events}
        fetching={fetching}
        error={error}
        onFetchRange={(from, to) => dispatch(fetchCalendar({ dateFrom: toISO(from), dateTo: toISO(to, true) }))}
        statusColors={STATUS_COLORS}
        statusList={ACTIVITY_STATUS_LIST}
        onOpenEvent={(e) => history.push(`/${detailRef}/${e.id}`)}
        onCreate={rights.includes(RIGHT_ACTIVITY_CREATE) ? () => history.push(`/${detailRef}`) : null}
        title={formatMessage('communications.calendar.page.title')}
        subtitle={formatMessage('communications.calendar.subtitle')}
      />
    </div>
  );
}

export default CalendarPage;
