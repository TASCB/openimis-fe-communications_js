import React, { useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

function StakeholderListPicker({
  required, readOnly, value, onChange, label, withLabel = false,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT, isActive: true });
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommStakeholderListPicker($search: String, $first: Int, $isActive: Boolean) {
      stakeholderList(name_Icontains: $search, first: $first, isActive: $isActive, orderBy: ["name"]) {
        edges { node { id code name } }
      }
    }`, filters,
  );
  const options = data?.stakeholderList?.edges?.map((e) => e.node) ?? [];
  const text = label || formatMessage('communications.stakeholderList.picker');
  return (
    <Autocomplete
      error={error}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      value={value}
      label={text}
      withLabel={withLabel}
      required={required}
      getOptionLabel={(o) => o.name}
      onChange={(v) => onChange(v, v?.name ?? null)}
      onInputChange={(search) => setFilters({ first: PICKER_LIMIT, isActive: true, search })}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={text} />
      )}
    />
  );
}
export default StakeholderListPicker;
