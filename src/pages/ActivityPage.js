import React, { useEffect, useState, useRef } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { Button } from '@material-ui/core';
import {
  Helmet, Form, useTranslations, useModulesManager, useHistory, journalize,
} from '@openimis/fe-core';
import {
  MODULE_NAME, EMPTY_STRING, ACTIVITY_STATUS, STATUS_ACTIONS,
  RIGHT_ACTIVITY_UPDATE, RIGHT_ACTIVITY_CREATE, COMMS_ROUTE_ACTIVITY,
  COMMS_ROUTE_EVENT, COMMS_ROUTE_EVENTS, COMMS_ROUTE_ACTIVITIES, EVENT_DEFAULT_TYPE,
} from '../constants';
import {
  fetchActivity, clearActivity, createActivity, updateActivity, transitionActivity, decId,
} from '../actions';
import ActivityHeadPanel from '../components/ActivityHeadPanel';
import ConflictBanner from '../components/ConflictBanner';
import ActivityTabs from '../components/ActivityTabs';
import ActivityTabsPlaceholder from '../components/ActivityTabsPlaceholder';

const useStyles = makeStyles((theme) => ({ page: theme.page }));

// One form, two variants: an event IS an activity. See the guide before splitting them.
function ActivityPage({ activityUuid, variant }) {
  const isEvent = variant === 'event';
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const activity = useSelector((s) => s.communications.activity);
  const mutation = useSelector((s) => s.communications.mutation);
  const submittingMutation = useSelector((s) => s.communications.submittingMutation);
  const conflicts = useSelector((s) => s.communications.conflicts);

  const [edited, setEdited] = useState({
    status: ACTIVITY_STATUS.DRAFT,
    activityType: isEvent ? EVENT_DEFAULT_TYPE : 'OTHER',
  });
  const [resetKey, setResetKey] = useState(0);
  const prev = useRef();

  const isNew = !activityUuid;
  // Planning locks at submit; outcome is recorded after the activity runs.
  const canEditOutcome = !isNew && rights.includes(RIGHT_ACTIVITY_UPDATE)
    && ![ACTIVITY_STATUS.ARCHIVED, ACTIVITY_STATUS.CANCELLED].includes(edited?.status);
  const canEditDetails = (isNew && rights.includes(RIGHT_ACTIVITY_CREATE))
    || (rights.includes(RIGHT_ACTIVITY_UPDATE)
        && [ACTIVITY_STATUS.DRAFT, ACTIVITY_STATUS.REJECTED].includes(edited?.status));

  useEffect(() => {
    if (activityUuid) dispatch(fetchActivity(modulesManager, [`id: "${activityUuid}"`]));
    return () => dispatch(clearActivity());
  }, [activityUuid]);

  useEffect(() => {
    if (activity) {
      setEdited(activity);
      setResetKey((k) => k + 1);
      if (isNew && activity.id) {
        const route = modulesManager.getRef(isEvent ? COMMS_ROUTE_EVENT : COMMS_ROUTE_ACTIVITY);
        history.replace(`/${route}/${activity.id}`);
      }
    }
  }, [activity]);

  useEffect(() => {
    if (prev.current && !submittingMutation) {
      dispatch(journalize(mutation));
      if (mutation?.clientMutationId) dispatch(fetchActivity(modulesManager, [`clientMutationId: "${mutation.clientMutationId}"`]));
    }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const titleParams = (a) => ({ code: a?.code ?? EMPTY_STRING });
  const back = () => history.push(
    `/${modulesManager.getRef(isEvent ? COMMS_ROUTE_EVENTS : COMMS_ROUTE_ACTIVITIES)}`,
  );
  const save = (data) => {
    const label = formatMessageWithValues(isNew ? 'communications.create.mutationLabel' : 'communications.update.mutationLabel', titleParams(data));
    if (isNew) dispatch(createActivity(data, label));
    else dispatch(updateActivity(data, label));
  };
  const onAction = (action) => dispatch(transitionActivity(
    action, edited, formatMessageWithValues(`communications.action.${action}.mutationLabel`, titleParams(edited)),
  ));

  const hasHardConflict = (conflicts ?? []).some((c) => c.hard);
  const mandatoryFilled = edited?.title && edited?.startDatetime && edited?.endDatetime;
  const canSave = () => (canEditDetails || canEditOutcome) && mandatoryFilled && !hasHardConflict;

  const actions = (!isNew ? (STATUS_ACTIONS[edited?.status] || []) : [])
    .filter((a) => rights.includes(a.right))
    .map((a) => ({
      onlyIfNotDirty: true,
      tooltip: formatMessage(`communications.action.${a.action}`),
      button: (
        <Button variant="contained" color="primary" onClick={() => onAction(a.action)}>
          {formatMessage(`communications.action.${a.action}`)}
        </Button>
      ),
    }));

  const getPanels = () => {
    const panels = [ConflictBanner];
    // Child sections need an id, so on create they show disabled rather than hidden.
    panels.push(isNew ? ActivityTabsPlaceholder : ActivityTabs);
    return panels;
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessageWithValues(
        isEvent ? 'communications.EventPage.title' : 'communications.ActivityPage.title',
        titleParams(edited))} />
      <Form
        key={resetKey}
        module="communications"
        title={isEvent ? 'communications.EventPage.title' : 'communications.ActivityPage.title'}
        titleParams={titleParams(edited)}
        edited={edited}
        edited_id={activityUuid}
        reset={resetKey}
        openDirty
        onEditedChanged={setEdited}
        back={back}
        save={save}
        canSave={canSave}
        saveTooltip={formatMessage('saveButton.tooltip')}
        HeadPanel={ActivityHeadPanel}
        Panels={getPanels()}
        actions={actions}
        readOnly={!canEditDetails}
        activityId={activityUuid}
        variant={variant}
        outcomeReadOnly={!canEditOutcome}
        rights={rights}
      />
    </div>
  );
}
// The route param is already the raw UUID (searcher + calendar navigate with the decoded `.id`),
// so `decId` passes it through; it also tolerates an encoded id without throwing on atob. The
// backend `id` filter (UUIDField) and child panels (which re-encode via encodeId) both need the raw UUID.
const mapStateToProps = (state, props) => ({
  activityUuid: props.match.params.activity_uuid ? decId(props.match.params.activity_uuid) : undefined,
});
export default connect(mapStateToProps, null)(ActivityPage);
