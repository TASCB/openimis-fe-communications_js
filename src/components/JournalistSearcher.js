import React, { useRef, useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';
import { IconButton, Tooltip, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import VisibilityIcon from '@material-ui/icons/Visibility';
import {
  Searcher, useHistory, useModulesManager, useTranslations, journalize, coreConfirm, clearConfirm,
} from '@openimis/fe-core';
import { fetchJournalists, deleteJournalist } from '../actions';
import {
  DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, RIGHT_JOURNALIST_UPDATE, RIGHT_JOURNALIST_DELETE,
  COMMS_ROUTE_JOURNALIST,
} from '../constants';
import JournalistFilter from './JournalistFilter';
import JournalistPreviewDialog from './JournalistPreviewDialog';

const useStyles = makeStyles(() => ({
  searcher: {
    '& table th': { whiteSpace: 'nowrap' },
    '& table th:last-child, & table td:last-child': { whiteSpace: 'nowrap', textAlign: 'right' },
  },
}));

function JournalistSearcher({
  fetchJournalists, deleteJournalist, journalize, coreConfirm, clearConfirm, confirmed,
  fetchingJournalists, fetchedJournalists, errorJournalists, journalists,
  journalistsPageInfo, journalistsTotalCount, submittingMutation, mutation,
}) {
  const history = useHistory();
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [toDelete, setToDelete] = useState(null);
  const [viewed, setViewed] = useState(null);
  const [params, setParams] = useState([]);
  const prev = useRef();

  const open = (j) => j?.id && rights.includes(RIGHT_JOURNALIST_UPDATE)
    && history.push(`/${modulesManager.getRef(COMMS_ROUTE_JOURNALIST)}/${j.id}`);

  useEffect(() => {
    if (toDelete) {
      coreConfirm(formatMessage('communications.journalist.deleteDialog.title'),
        formatMessageWithValues('communications.journalist.deleteDialog.message',
          { name: `${toDelete.firstName} ${toDelete.lastName}` }));
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) {
      deleteJournalist(toDelete, formatMessageWithValues('communications.journalist.delete.mutationLabel',
        { name: `${toDelete.firstName} ${toDelete.lastName}` }));
      setToDelete(null);
    }
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);
  useEffect(() => {
    if (prev.current && !submittingMutation) { journalize(mutation); fetchJournalists(modulesManager, params); }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const headers = () => [
    'communications.journalist.name', 'communications.journalist.mediaHouse', 'communications.journalistRole',
    'communications.journalist.contact', 'communications.location', 'communications.actions',
  ];
  const sorts = () => [['lastName', true], null, ['role', true], null, null, null];
  const fetch = (p) => { setParams(p); return fetchJournalists(modulesManager, p); };
  const itemFormatters = () => {
    const f = [
      (j) => `${j?.firstName ?? ''} ${j?.lastName ?? ''}`.trim(),
      (j) => (j?.isFreelance
        ? <Chip size="small" label={formatMessage('communications.journalist.freelance')} />
        : (j?.mediaHouse?.name ?? '')),
      (j) => (j?.role ? formatMessage(`communications.journalistRole.${j.role}`) : ''),
      (j) => [j?.phone, j?.email].filter(Boolean).join(' · '),
      (j) => j?.location?.name ?? '',
      (j) => (
        <>
          <Tooltip title={formatMessage('communications.journalist.view')}>
            <IconButton onClick={() => setViewed(j)}><VisibilityIcon /></IconButton>
          </Tooltip>
          {rights.includes(RIGHT_JOURNALIST_DELETE) && (
            <Tooltip title={formatMessage('deleteButton.tooltip')}>
              <IconButton onClick={() => setToDelete(j)}><DeleteIcon /></IconButton>
            </Tooltip>
          )}
        </>
      ),
    ];
    return f;
  };
  const filterPane = ({ filters, onChangeFilters }) => <JournalistFilter filters={filters} onChangeFilters={onChangeFilters} />;

  return (
    <div className={classes.searcher}>
      <JournalistPreviewDialog
        journalist={viewed}
        onClose={() => setViewed(null)}
        onEdit={rights.includes(RIGHT_JOURNALIST_UPDATE) ? open : null}
      />
      <Searcher
        module="communications"
        FilterPane={filterPane}
        fetch={fetch}
        items={journalists}
        itemsPageInfo={journalistsPageInfo}
        fetchedItems={fetchedJournalists}
        fetchingItems={fetchingJournalists}
        errorItems={errorJournalists}
        tableTitle={formatMessageWithValues('communications.journalist.searcherResultsTitle', { journalistsTotalCount })}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
        rowIdentifier={(j) => j.id}
        onDoubleClick={(j) => setViewed(j)}
      />
    </div>
  );
}
const mapState = (state) => ({
  fetchingJournalists: state.communications.fetchingJournalists,
  fetchedJournalists: state.communications.fetchedJournalists,
  errorJournalists: state.communications.errorJournalists,
  journalists: state.communications.journalists,
  journalistsPageInfo: state.communications.journalistsPageInfo,
  journalistsTotalCount: state.communications.journalistsTotalCount,
  submittingMutation: state.communications.submittingMutation,
  mutation: state.communications.mutation,
  confirmed: state.core.confirmed,
});
const mapDispatch = (dispatch) => bindActionCreators({
  fetchJournalists, deleteJournalist, journalize, coreConfirm, clearConfirm,
}, dispatch);
export default connect(mapState, mapDispatch)(JournalistSearcher);
