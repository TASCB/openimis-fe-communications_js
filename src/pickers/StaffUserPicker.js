import React, { useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

export const staffUserName = (u) => {
  if (!u) return '';
  const name = [u.otherNames, u.lastName].filter(Boolean).join(' ');
  return name ? `${name} (${u.username})` : u.username;
};

function StaffUserPicker({
  required, readOnly, value, onChange, label, withLabel = false,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT });
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommStaffUserPicker($first: Int, $str: String) {
      users(first: $first, str: $str) { edges { node { id username otherNames lastName } } }
    }`, filters,
  );
  const options = data?.users?.edges?.map((e) => e.node) ?? [];
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
      getOptionLabel={staffUserName}
      onChange={(v) => onChange(v, v ? staffUserName(v) : null)}
      onInputChange={(search) => setFilters(search ? { first: PICKER_LIMIT, str: search } : { first: PICKER_LIMIT })}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={label || formatMessage('communications.staffUserPicker')} />
      )}
    />
  );
}
export default StaffUserPicker;
