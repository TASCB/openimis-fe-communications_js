import React from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

// Loads the first N users; Autocomplete filters client-side (avoids relying on a
// specific server-side username filter arg).
function StaffUserPicker({
  required, readOnly, value, onChange, label, withLabel = false,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommStaffUserPicker($first: Int) {
      user(first: $first) { edges { node { id username } } }
    }`, { first: PICKER_LIMIT },
  );
  const options = data?.user?.edges?.map((e) => e.node) ?? [];
  return (
    <Autocomplete
      error={error}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      value={value}
      label={label || formatMessage('communications.staffUserPicker')}
      withLabel={withLabel}
      required={required}
      getOptionLabel={(o) => o?.username ?? ''}
      onChange={(v) => onChange(v, v ? v.username : null)}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={label || formatMessage('communications.staffUserPicker')} />
      )}
    />
  );
}
export default StaffUserPicker;
