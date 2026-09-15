import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { Fab } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import {
  Helmet, useTranslations, useModulesManager, useHistory, withTooltip,
} from '@openimis/fe-core';
import {
  MODULE_NAME, RIGHT_JOURNALIST_SEARCH, RIGHT_JOURNALIST_CREATE, COMMS_ROUTE_JOURNALIST,
} from '../constants';
import JournalistSearcher from '../components/JournalistSearcher';

const useStyles = makeStyles((theme) => ({ page: theme.page, fab: theme.fab }));

function JournalistsPage() {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const onCreate = () => history.push(`/${modulesManager.getRef(COMMS_ROUTE_JOURNALIST)}`);
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('communications.journalists.page.title')} />
      {rights.includes(RIGHT_JOURNALIST_SEARCH) && <JournalistSearcher />}
      {rights.includes(RIGHT_JOURNALIST_CREATE) && withTooltip(
        <div className={classes.fab}><Fab color="primary" onClick={onCreate}><AddIcon /></Fab></div>,
        formatMessage('createButton.tooltip'),
      )}
    </div>
  );
}
export default JournalistsPage;
