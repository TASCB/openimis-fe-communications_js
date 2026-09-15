import React, { useEffect, useState, useRef } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Helmet, Form, useTranslations, useModulesManager, useHistory, journalize,
} from '@openimis/fe-core';
import {
  MODULE_NAME, EMPTY_STRING, RIGHT_JOURNALIST_CREATE, RIGHT_JOURNALIST_UPDATE,
  COMMS_ROUTE_JOURNALIST,
} from '../constants';
import {
  fetchJournalist, clearJournalist, createJournalist, updateJournalist, decId,
} from '../actions';
import JournalistHeadPanel from '../components/JournalistHeadPanel';

const useStyles = makeStyles((theme) => ({ page: theme.page }));

function JournalistPage({ journalistUuid }) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const journalist = useSelector((s) => s.communications.journalist);
  const mutation = useSelector((s) => s.communications.mutation);
  const submittingMutation = useSelector((s) => s.communications.submittingMutation);

  const [edited, setEdited] = useState({ isActive: true, isFreelance: false, role: 'REPORTER' });
  const [resetKey, setResetKey] = useState(0);
  const prev = useRef();

  const isNew = !journalistUuid;
  const canEdit = isNew ? rights.includes(RIGHT_JOURNALIST_CREATE) : rights.includes(RIGHT_JOURNALIST_UPDATE);

  useEffect(() => {
    if (journalistUuid) dispatch(fetchJournalist(modulesManager, [`id: "${journalistUuid}"`]));
    return () => dispatch(clearJournalist());
  }, [journalistUuid]);

  useEffect(() => {
    if (journalist) {
      setEdited(journalist);
      setResetKey((k) => k + 1);
      if (isNew && journalist.id) history.replace(`/${modulesManager.getRef(COMMS_ROUTE_JOURNALIST)}/${journalist.id}`);
    }
  }, [journalist]);

  useEffect(() => {
    if (prev.current && !submittingMutation) {
      dispatch(journalize(mutation));
      if (mutation?.clientMutationId) {
        dispatch(fetchJournalist(modulesManager, [`clientMutationId: "${mutation.clientMutationId}"`]));
      }
    }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const titleParams = (j) => ({ name: `${j?.firstName ?? EMPTY_STRING} ${j?.lastName ?? EMPTY_STRING}`.trim() });
  const save = (data) => {
    const label = formatMessageWithValues(
      isNew ? 'communications.journalist.create.mutationLabel' : 'communications.journalist.update.mutationLabel',
      titleParams(data),
    );
    if (isNew) dispatch(createJournalist(data, label));
    else dispatch(updateJournalist(data, label));
  };
  // A staff journalist needs a house; a freelancer is complete without one.
  const affiliationOk = edited?.isFreelance || !!(edited?.mediaHouseId || edited?.mediaHouse?.id);
  const canSave = () => canEdit && edited?.firstName && edited?.lastName && affiliationOk;

  return (
    <div className={classes.page}>
      <Helmet title={formatMessageWithValues('communications.JournalistPage.title', titleParams(edited))} />
      <Form
        key={resetKey}
        module="communications"
        title="communications.JournalistPage.title"
        titleParams={titleParams(edited)}
        edited={edited}
        edited_id={journalistUuid}
        reset={resetKey}
        openDirty
        onEditedChanged={setEdited}
        back={() => history.goBack()}
        save={save}
        canSave={canSave}
        saveTooltip={formatMessage('saveButton.tooltip')}
        HeadPanel={JournalistHeadPanel}
        readOnly={!canEdit}
        rights={rights}
      />
    </div>
  );
}
const mapStateToProps = (state, props) => ({
  journalistUuid: props.match.params.journalist_uuid ? decId(props.match.params.journalist_uuid) : undefined,
});
export default connect(mapStateToProps, null)(JournalistPage);
