import React, { useEffect, useState, useRef } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Helmet, Form, useTranslations, useModulesManager, useHistory, journalize,
} from '@openimis/fe-core';
import {
  MODULE_NAME, EMPTY_STRING, RIGHT_MEDIA_HOUSE_CREATE, RIGHT_MEDIA_HOUSE_UPDATE,
  COMMS_ROUTE_MEDIA_HOUSE,
} from '../constants';
import {
  fetchMediaHouse, clearMediaHouse, createMediaHouse, updateMediaHouse, decId,
} from '../actions';
import MediaHouseHeadPanel from '../components/MediaHouseHeadPanel';

const useStyles = makeStyles((theme) => ({ page: theme.page }));

function MediaHousePage({ mediaHouseUuid }) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const mediaHouse = useSelector((s) => s.communications.mediaHouse);
  const mutation = useSelector((s) => s.communications.mutation);
  const submittingMutation = useSelector((s) => s.communications.submittingMutation);

  const [edited, setEdited] = useState({ isActive: true });
  const [resetKey, setResetKey] = useState(0);
  const prev = useRef();

  const isNew = !mediaHouseUuid;
  const canEdit = isNew ? rights.includes(RIGHT_MEDIA_HOUSE_CREATE) : rights.includes(RIGHT_MEDIA_HOUSE_UPDATE);

  useEffect(() => {
    if (mediaHouseUuid) dispatch(fetchMediaHouse(modulesManager, [`id: "${mediaHouseUuid}"`]));
    return () => dispatch(clearMediaHouse());
  }, [mediaHouseUuid]);

  useEffect(() => {
    if (mediaHouse) {
      setEdited(mediaHouse);
      setResetKey((k) => k + 1);
      if (isNew && mediaHouse.id) history.replace(`/${modulesManager.getRef(COMMS_ROUTE_MEDIA_HOUSE)}/${mediaHouse.id}`);
    }
  }, [mediaHouse]);

  useEffect(() => {
    if (prev.current && !submittingMutation) {
      dispatch(journalize(mutation));
      if (mutation?.clientMutationId) {
        dispatch(fetchMediaHouse(modulesManager, [`clientMutationId: "${mutation.clientMutationId}"`]));
      }
    }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const titleParams = (h) => ({ name: h?.name ?? EMPTY_STRING });
  const save = (data) => {
    const label = formatMessageWithValues(
      isNew ? 'communications.mediaHouse.create.mutationLabel' : 'communications.mediaHouse.update.mutationLabel',
      titleParams(data),
    );
    if (isNew) dispatch(createMediaHouse(data, label));
    else dispatch(updateMediaHouse(data, label));
  };
  const canSave = () => canEdit && edited?.name && (edited?.categoryId || edited?.category?.id);

  return (
    <div className={classes.page}>
      <Helmet title={formatMessageWithValues('communications.MediaHousePage.title', titleParams(edited))} />
      <Form
        key={resetKey}
        module="communications"
        title="communications.MediaHousePage.title"
        titleParams={titleParams(edited)}
        edited={edited}
        edited_id={mediaHouseUuid}
        reset={resetKey}
        openDirty
        onEditedChanged={setEdited}
        back={() => history.goBack()}
        save={save}
        canSave={canSave}
        saveTooltip={formatMessage('saveButton.tooltip')}
        Panels={[MediaHouseHeadPanel]}
        readOnly={!canEdit}
        rights={rights}
      />
    </div>
  );
}
const mapStateToProps = (state, props) => ({
  mediaHouseUuid: props.match.params.media_house_uuid ? decId(props.match.params.media_house_uuid) : undefined,
});
export default connect(mapStateToProps, null)(MediaHousePage);
