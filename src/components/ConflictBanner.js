import React, { useEffect, useMemo } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import _debounce from 'lodash/debounce';
import { useModulesManager, useTranslations, useHistory } from '@openimis/fe-core';
import { ConflictPanel } from '@openimis/fe-tasaf_common';
import { fetchConflicts, clearConflicts, decId } from '../actions';
import { DEFAULT_DEBOUNCE_TIME, COMMS_ROUTE_ACTIVITY } from '../constants';
import { toISO } from '../utils/dates';

function ConflictBanner({
  edited, conflicts, assignments, fetchConflicts, clearConflicts,
}) {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const staffUserIds = useMemo(
    () => (assignments ?? []).map((a) => decId(a.staffUser?.id)).filter(Boolean),
    [assignments],
  );
  const debouncedFetch = useMemo(() => _debounce((vars) => fetchConflicts(vars), DEFAULT_DEBOUNCE_TIME), []);
  useEffect(() => {
    if (edited?.startDatetime && edited?.endDatetime) {
      debouncedFetch({
        startDatetime: toISO(edited.startDatetime),
        endDatetime: toISO(edited.endDatetime, true),
        activityId: edited.id ?? null,
        locationId: (() => { const d = decId(edited.locationId ?? edited.location?.id); return d ? Number(d) : null; })(),
        staffUserIds: staffUserIds.length ? staffUserIds : null,
      });
    } else {
      clearConflicts();
    }
  }, [edited?.startDatetime, edited?.endDatetime, edited?.locationId, staffUserIds.length]);

  if (!(conflicts ?? []).length) return null;
  return (
    <Grid container>
      <ConflictPanel
        conflicts={conflicts}
        hardTitle={formatMessage('communications.conflict.hardTitle')}
        softTitle={formatMessage('communications.conflict.softTitle')}
        viewLabel={formatMessage('communications.conflict.open')}
        hrefFor={(c) => (c.conflictingActivityId
          ? history.createHref({ pathname: `/${modulesManager.getRef(COMMS_ROUTE_ACTIVITY)}/${c.conflictingActivityId}` })
          : null)}
      />
    </Grid>
  );
}
const mapState = (state) => ({ conflicts: state.communications.conflicts, assignments: state.communications.assignments });
const mapDispatch = (dispatch) => bindActionCreators({ fetchConflicts, clearConflicts }, dispatch);
export default connect(mapState, mapDispatch)(ConflictBanner);
