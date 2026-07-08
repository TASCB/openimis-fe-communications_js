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
} from '../constants';
import {
  fetchActivity, clearActivity, createActivity, updateActivity, transitionActivity,
} from '../actions';
import ActivityHeadPanel from '../components/ActivityHeadPanel';
import ConflictBanner from '../components/ConflictBanner';
import ActivityTabs from '../components/ActivityTabs';

const useStyles = makeStyles((theme) => ({ page: theme.page }));

function ActivityPage({ activityUuid }) {
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

  const [edited, setEdited] = useState({ status: ACTIVITY_STATUS.DRAFT, activityType: 'OTHER' });
  const [resetKey, setResetKey] = useState(0);
  const prev = useRef();

  const isNew = !activityUuid;
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
      if (isNew && activity.id) history.replace(`/${modulesManager.getRef(COMMS_ROUTE_ACTIVITY)}/${activity.id}`);
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
  const back = () => history.goBack();
  const save = (data) => {
    const label = formatMessageWithValues(isNew ? 'communications.create.mutationLabel' : 'communications.update.mutationLabel', titleParams(data));
    if (isNew) dispatch(createActivity(data, label));
    else dispatch(updateActivity(data, label));
  };
  const onAction = (action) => dispatch(transitionActivity(
    action, edited, formatMessageWithValues(`communications.action.${action}.mutationLabel`, titleParams(edited)),
  ));

  const hasHardConflict = (conflicts ?? []).some((c) => c.hard);
  const mandatoryFilled = edited?.code && edited?.title && edited?.startDatetime && edited?.endDatetime;
  const canSave = () => canEditDetails && mandatoryFilled && !hasHardConflict;

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
    if (!isNew) panels.push(ActivityTabs);
    return panels;
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessageWithValues('communications.ActivityPage.title', titleParams(edited))} />
      <Form
        key={resetKey}
        module="communications"
        title="communications.ActivityPage.title"
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
        rights={rights}
      />
    </div>
  );
}
const mapStateToProps = (state, props) => ({ activityUuid: props.match.params.activity_uuid });
export default connect(mapStateToProps, null)(ActivityPage);
