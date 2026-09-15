import React, { useRef, useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';
import { IconButton, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  Searcher, useHistory, useModulesManager, useTranslations, journalize, coreConfirm, clearConfirm,
} from '@openimis/fe-core';
import { fetchMediaHouses, deleteMediaHouse } from '../actions';
import {
  DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, RIGHT_MEDIA_HOUSE_UPDATE, RIGHT_MEDIA_HOUSE_DELETE,
  COMMS_ROUTE_MEDIA_HOUSE,
} from '../constants';
import MediaHouseFilter from './MediaHouseFilter';

const useStyles = makeStyles(() => ({
  searcher: {
    '& table th': { whiteSpace: 'nowrap' },
    '& table th:last-child, & table td:last-child': { width: 32 },
  },
}));

function MediaHouseSearcher({
  fetchMediaHouses, deleteMediaHouse, journalize, coreConfirm, clearConfirm, confirmed,
  fetchingMediaHouses, fetchedMediaHouses, errorMediaHouses, mediaHouses,
  mediaHousesPageInfo, mediaHousesTotalCount, submittingMutation, mutation,
}) {
  const history = useHistory();
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('communications', modulesManager);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const [toDelete, setToDelete] = useState(null);
  const [params, setParams] = useState([]);
  const prev = useRef();

  const open = (h) => h?.id && rights.includes(RIGHT_MEDIA_HOUSE_UPDATE)
    && history.push(`/${modulesManager.getRef(COMMS_ROUTE_MEDIA_HOUSE)}/${h.id}`);

  useEffect(() => {
    if (toDelete) {
      coreConfirm(formatMessage('communications.mediaHouse.deleteDialog.title'),
        formatMessageWithValues('communications.mediaHouse.deleteDialog.message', { name: toDelete.name }));
    }
  }, [toDelete]);
  useEffect(() => {
    if (toDelete && confirmed) {
      deleteMediaHouse(toDelete, formatMessageWithValues('communications.mediaHouse.delete.mutationLabel', { name: toDelete.name }));
      setToDelete(null);
    }
    if (confirmed !== null) setToDelete(null);
    return () => confirmed !== null && clearConfirm(false);
  }, [confirmed]);
  useEffect(() => {
    if (prev.current && !submittingMutation) { journalize(mutation); fetchMediaHouses(modulesManager, params); }
  }, [submittingMutation]);
  useEffect(() => { prev.current = submittingMutation; });

  const headers = () => {
    const h = [
      'communications.code', 'communications.mediaHouse.name', 'communications.mediaHouse.category',
      'communications.medium', 'communications.scope', 'communications.mediaHouse.location',
      'communications.mediaHouse.contact', 'communications.mediaHouse.quality',
    ];
    if (rights.includes(RIGHT_MEDIA_HOUSE_DELETE)) h.push('emptyLabel');
    return h;
  };
  const sorts = () => {
    const s = [['code', true], ['name', true], null, null, null, null, null, null];
    if (rights.includes(RIGHT_MEDIA_HOUSE_DELETE)) s.push(null);
    return s;
  };
  const fetch = (p) => { setParams(p); return fetchMediaHouses(modulesManager, p); };
  const itemFormatters = () => {
    const f = [
      (h) => h?.code,
      (h) => h?.name,
      (h) => h?.category?.name ?? '',
      (h) => (h?.category?.medium ? formatMessage(`communications.medium.${h.category.medium}`) : ''),
      (h) => (h?.category?.scope ? formatMessage(`communications.scope.${h.category.scope}`) : ''),
      (h) => h?.location?.name ?? '',
      (h) => [h?.contactPerson, h?.phone].filter(Boolean).join(' · '),
      // derived from rated coverage rows, never a stored score
      (h) => (h?.avgCoverageQuality != null
        ? `${Number(h.avgCoverageQuality).toFixed(1)} / 5 (${h.coverageCount ?? 0})`
        : ''),
    ];
    if (rights.includes(RIGHT_MEDIA_HOUSE_DELETE)) {
      f.push((h) => (
        <Tooltip title={formatMessage('deleteButton.tooltip')}>
          <IconButton onClick={() => setToDelete(h)}><DeleteIcon /></IconButton>
        </Tooltip>
      ));
    }
    return f;
  };
  const filterPane = ({ filters, onChangeFilters }) => <MediaHouseFilter filters={filters} onChangeFilters={onChangeFilters} />;

  return (
    <div className={classes.searcher}>
      <Searcher
        module="communications"
        FilterPane={filterPane}
        fetch={fetch}
        items={mediaHouses}
        itemsPageInfo={mediaHousesPageInfo}
        fetchedItems={fetchedMediaHouses}
        fetchingItems={fetchingMediaHouses}
        errorItems={errorMediaHouses}
        tableTitle={formatMessageWithValues('communications.mediaHouse.searcherResultsTitle', { mediaHousesTotalCount })}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
        rowIdentifier={(h) => h.id}
        onDoubleClick={open}
      />
    </div>
  );
}
const mapState = (state) => ({
  fetchingMediaHouses: state.communications.fetchingMediaHouses,
  fetchedMediaHouses: state.communications.fetchedMediaHouses,
  errorMediaHouses: state.communications.errorMediaHouses,
  mediaHouses: state.communications.mediaHouses,
  mediaHousesPageInfo: state.communications.mediaHousesPageInfo,
  mediaHousesTotalCount: state.communications.mediaHousesTotalCount,
  submittingMutation: state.communications.submittingMutation,
  mutation: state.communications.mutation,
  confirmed: state.core.confirmed,
});
const mapDispatch = (dispatch) => bindActionCreators({
  fetchMediaHouses, deleteMediaHouse, journalize, coreConfirm, clearConfirm,
}, dispatch);
export default connect(mapState, mapDispatch)(MediaHouseSearcher);
