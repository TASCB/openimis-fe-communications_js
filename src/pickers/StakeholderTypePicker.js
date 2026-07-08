import React, { useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

function StakeholderTypePicker({
  required, readOnly, value, onChange, label, withLabel = false,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT, isActive: true });
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommStakeholderTypePicker($search: String, $first: Int, $isActive: Boolean) {
      stakeholderType(name_Icontains: $search, first: $first, isActive: $isActive) {
        edges { node { id code name level } }
      }
    }`, filters,
  );
  const options = data?.stakeholderType?.edges?.map((e) => e.node) ?? [];
  return (
    <Autocomplete
      error={error}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      value={value}
      label={label || formatMessage('communications.stakeholderTypePicker')}
      withLabel={withLabel}
      required={required}
      getOptionLabel={(o) => `${o.name} (${o.level})`}
      onChange={(v) => onChange(v, v ? `${v.name} (${v.level})` : null)}
      onInputChange={(search) => setFilters({ first: PICKER_LIMIT, isActive: true, search })}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={label || formatMessage('communications.stakeholderTypePicker')} />
      )}
    />
  );
}
export default StakeholderTypePicker;
