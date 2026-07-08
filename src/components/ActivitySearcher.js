import React, { useRef, useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  IconButton, Tooltip, Dialog, DialogContent, DialogActions, Button,
} from '@material-ui/core';
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
import ActivityProfileCard from './ActivityProfileCard';

function ActivitySearcher({
  fetchActivities, deleteActivity, journalize, coreConfirm, clearConfirm, confirmed,
  fetchingActivities, fetchedActivities, errorActivities, activities,
  activitiesPageInfo, activitiesTotalCount, submittingMutation, mutation,
}) {
  const history = useHistory();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [toDelete, setToDelete] = useState(null);
  const [viewed, setViewed] = useState(null);
  const [params, setParams] = useState([]);
  const prev = useRef();

  const open = (a) => a?.id && rights.includes(RIGHT_ACTIVITY_SEARCH)
    && history.push(`/${modulesManager.getRef(COMMS_ROUTE_ACTIVITY)}/${a.id}`);

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
    'communications.startDatetime', 'communications.endDatetime', 'communications.venue', 'emptyLabel',
  ];
  const sorts = () => [
    ['code', true], ['title', true], ['activityType', true], ['status', true],
    ['startDatetime', true], ['endDatetime', true], null, null,
  ];
  const fetch = (p) => { setParams(p); return fetchActivities(modulesManager, p); };
  const itemFormatters = () => [
    (a) => a?.code,
    (a) => a?.title,
    (a) => (a?.activityType ? formatMessage(`communications.activityType.${a.activityType}`) : ''),
    (a) => <ActivityStatusChip status={a?.status} />,
    (a) => (a?.startDatetime ? formatDateFromISO(modulesManager, intl, a.startDatetime) : ''),
    (a) => (a?.endDatetime ? formatDateFromISO(modulesManager, intl, a.endDatetime) : ''),
    (a) => a?.venue ?? '',
    (a) => (
      <>
        <Tooltip title={formatMessage('viewDetailsButton.tooltip')}>
          <IconButton onClick={() => setViewed(a)}><VisibilityIcon /></IconButton>
        </Tooltip>
        {rights.includes(RIGHT_ACTIVITY_DELETE) && ![ACTIVITY_STATUS.ARCHIVED].includes(a?.status) && (
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
      <Dialog open={!!viewed} onClose={() => setViewed(null)} maxWidth="md" fullWidth PaperProps={{ style: { borderRadius: 0 } }}>
        <DialogContent style={{ padding: 0 }}>{viewed && <ActivityProfileCard activity={viewed} />}</DialogContent>
        <DialogActions>
          {viewed && rights.includes(RIGHT_ACTIVITY_SEARCH) && (
            <Button color="primary" onClick={() => open(viewed)}>{formatMessage('communications.open')}</Button>
          )}
          <Button onClick={() => setViewed(null)}>{formatMessage('communications.close')}</Button>
        </DialogActions>
      </Dialog>
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
