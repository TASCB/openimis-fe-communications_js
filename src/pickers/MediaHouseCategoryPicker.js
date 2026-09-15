import React, { useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

function MediaHouseCategoryPicker({
  required, readOnly, value, onChange, label, withLabel = false,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT, isActive: true });
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommMediaHouseCategoryPicker($search: String, $first: Int, $isActive: Boolean) {
      mediaHouseCategory(name_Icontains: $search, first: $first, isActive: $isActive) {
        edges { node { id code name medium scope } }
      }
    }`, filters,
  );
  const options = data?.mediaHouseCategory?.edges?.map((e) => e.node) ?? [];
  const labelOf = (o) => (o ? `${o.name} (${o.medium}/${o.scope})` : '');
  return (
    <Autocomplete
      error={error}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      value={value}
      label={label || formatMessage('communications.mediaHouseCategoryPicker')}
      withLabel={withLabel}
      required={required}
      getOptionLabel={labelOf}
      onChange={(v) => onChange(v, labelOf(v))}
      onInputChange={(search) => setFilters({ first: PICKER_LIMIT, isActive: true, search })}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={label || formatMessage('communications.mediaHouseCategoryPicker')} />
      )}
    />
  );
}
export default MediaHouseCategoryPicker;
