import React, { useEffect, useMemo } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import _debounce from 'lodash/debounce';
import { WarningBox, useModulesManager, useTranslations } from '@openimis/fe-core';
import { fetchConflicts, clearConflicts, decId } from '../actions';
import { DEFAULT_DEBOUNCE_TIME } from '../constants';
import { toISO } from '../utils/dates';

function ConflictBanner({
  edited, conflicts, assignments, fetchConflicts, clearConflicts,
}) {
  const modulesManager = useModulesManager();
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

  const hard = (conflicts ?? []).filter((c) => c.hard);
  const soft = (conflicts ?? []).filter((c) => !c.hard);
  if (!hard.length && !soft.length) return null;
  const HARD = { backgroundColor: '#fdecea', borderLeft: '5px solid #c62828' };
  return (
    <Grid container>
      {hard.length > 0 && (
        <WarningBox title={formatMessage('communications.conflict.hardTitle')} description={hard.map((c) => c.message).join('  •  ')} styles={HARD} />
      )}
      {soft.length > 0 && (
        <WarningBox title={formatMessage('communications.conflict.softTitle')} description={soft.map((c) => c.message).join('  •  ')} />
      )}
    </Grid>
  );
}
const mapState = (state) => ({ conflicts: state.communications.conflicts, assignments: state.communications.assignments });
const mapDispatch = (dispatch) => bindActionCreators({ fetchConflicts, clearConflicts }, dispatch);
export default connect(mapState, mapDispatch)(ConflictBanner);
