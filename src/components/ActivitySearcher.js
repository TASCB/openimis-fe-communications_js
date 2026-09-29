import React, { useRef, useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  Searcher, useHistory, useModulesManager, useTranslations, journalize, coreConfirm, clearConfirm, formatDateFromISO,
} from '@openimis/fe-core';
import { fetchActivities, deleteActivity } from '../actions';
import {
  DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, RIGHT_ACTIVITY_SEARCH, RIGHT_ACTIVITY_DELETE,
  COMMS_ROUTE_ACTIVITY, ACTIVITY_STATUS,
} from '../constants';
import ActivityFilter from './ActivityFilter';
import ActivityStatusChip from './ActivityStatusChip';
import ActivityPreviewDialog from './ActivityPreviewDialog';

const useStyles = makeStyles(() => ({
  searcher: {
    '& table th': { whiteSpace: 'nowrap' },
    '& table th:last-child, & table td:last-child': { whiteSpace: 'nowrap', textAlign: 'right' },
  },
  sub: { fontSize: 12, color: '#5c6e64', marginTop: 2 },
  when: { whiteSpace: 'nowrap' },
}));

// `extraFilters` pins a fixed server-side filter (the Events page scopes by activity type).
function ActivitySearcher({
  extraFilters = [],
  detailRoute = COMMS_ROUTE_ACTIVITY,
  fetchActivities, deleteActivity, journalize, coreConfirm, clearConfirm, confirmed,
  fetchingActivities, fetchedActivities, errorActivities, activities,
  activitiesPageInfo, activitiesTotalCount, submittingMutation, mutation,
}) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [toDelete, setToDelete] = useState(null);
  const [viewed, setViewed] = useState(null);
  const [params, setParams] = useState([]);
  const prev = useRef();

  const open = (a) => a?.id && rights.includes(RIGHT_ACTIVITY_SEARCH)
    && history.push(`/${modulesManager.getRef(detailRoute)}/${a.id}`);

  useEffect(() => {
    if (toDelete) {
      coreConfirm(formatMessage('communications.deleteDialog.title'),
        formatMessageWithValues('communications.deleteDialog.message', { code: toDelete.code }));
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) {
      deleteActivity(toDelete, formatMessageWithValues('communications.delete.mutationLabel', { code: toDelete.code }));
      setToDelete(null);
    }
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);
  useEffect(() => {
    if (prev.current && !submittingMutation) { journalize(mutation); fetchActivities(modulesManager, params); }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const headers = () => [
    'communications.code', 'communications.title', 'communications.activityType', 'communications.status',
    'communications.activity.when', 'communications.venue', 'communications.actions',
  ];
  const sorts = () => [
    ['code', true], ['title', true], ['activityType', true], ['status', true], ['startDatetime', true], null, null,
  ];
  const fmtDate = (v) => (v ? formatDateFromISO(modulesManager, intl, v) : '');
  const fetch = (p) => {
    const all = [...p, ...extraFilters];
    setParams(all);
    return fetchActivities(modulesManager, all);
  };
  const itemFormatters = () => [
    (a) => a?.code,
    (a) => (
      <>
        <div>{a?.title}</div>
        {a?.category?.name && <div className={classes.sub}>{a.category.name}</div>}
      </>
    ),
    (a) => (a?.activityType ? formatMessage(`communications.activityType.${a.activityType}`) : ''),
    (a) => <ActivityStatusChip status={a?.status} />,
    (a) => (a?.startDatetime ? (
      <span className={classes.when}>
        {fmtDate(a.startDatetime)}
        {a.endDatetime && fmtDate(a.endDatetime) !== fmtDate(a.startDatetime) ? ` → ${fmtDate(a.endDatetime)}` : ''}
      </span>
    ) : ''),
    (a) => (
      <>
        <div>{a?.venue || a?.virtualPlatform || ''}</div>
        {a?.location?.name && <div className={classes.sub}>{a.location.name}</div>}
      </>
    ),
    (a) => (
      <>
        <Tooltip title={formatMessage('viewDetailsButton.tooltip')}>
          <IconButton onClick={() => setViewed(a)}><VisibilityIcon /></IconButton>
        </Tooltip>
        {rights.includes(RIGHT_ACTIVITY_DELETE) && a?.status !== ACTIVITY_STATUS.ARCHIVED && (
          <Tooltip title={formatMessage('deleteButton.tooltip')}>
            <IconButton onClick={() => setToDelete(a)}><DeleteIcon /></IconButton>
          </Tooltip>
        )}
      </>
    ),
  ];
  const filterPane = ({ filters, onChangeFilters }) => <ActivityFilter filters={filters} onChangeFilters={onChangeFilters} />;

  return (
    <>
      <ActivityPreviewDialog
        activity={viewed}
        onClose={() => setViewed(null)}
        onOpen={rights.includes(RIGHT_ACTIVITY_SEARCH) ? open : null}
      />
      <div className={classes.searcher}>
        <Searcher
          module="communications"
          FilterPane={filterPane}
          fetch={fetch}
          items={activities}
          itemsPageInfo={activitiesPageInfo}
          fetchedItems={fetchedActivities}
          fetchingItems={fetchingActivities}
          errorItems={errorActivities}
          tableTitle={formatMessageWithValues('communications.searcherResultsTitle', { activitiesTotalCount })}
          headers={headers}
          itemFormatters={itemFormatters}
          sorts={sorts}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          rowIdentifier={(a) => a.id}
          onDoubleClick={(a) => setViewed(a)}
        />
      </div>
    </>
  );
}
const mapState = (state) => ({
  fetchingActivities: state.communications.fetchingActivities,
  fetchedActivities: state.communications.fetchedActivities,
  errorActivities: state.communications.errorActivities,
  activities: state.communications.activities,
  activitiesPageInfo: state.communications.activitiesPageInfo,
  activitiesTotalCount: state.communications.activitiesTotalCount,
  submittingMutation: state.communications.submittingMutation,
  mutation: state.communications.mutation,
  confirmed: state.core.confirmed,
});
const mapDispatch = (dispatch) => bindActionCreators({ fetchActivities, deleteActivity, journalize, coreConfirm, clearConfirm }, dispatch);
export default connect(mapState, mapDispatch)(ActivitySearcher);
