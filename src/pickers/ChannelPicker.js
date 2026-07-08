import React, { useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

function ChannelPicker({
  required, readOnly, value, onChange, label, withLabel = false,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT, isActive: true });
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommChannelPicker($search: String, $first: Int, $isActive: Boolean) {
      channel(name_Icontains: $search, first: $first, isActive: $isActive) {
        edges { node { id code name channelType } }
      }
    }`, filters,
  );
  const options = data?.channel?.edges?.map((e) => e.node) ?? [];
  return (
    <Autocomplete
      error={error}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      value={value}
      label={label || formatMessage('communications.channelPicker')}
      withLabel={withLabel}
      required={required}
      getOptionLabel={(o) => `${o.name}`}
      onChange={(v) => onChange(v, v ? v.name : null)}
      onInputChange={(search) => setFilters({ first: PICKER_LIMIT, isActive: true, search })}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={label || formatMessage('communications.channelPicker')} />
      )}
    />
  );
}
export default ChannelPicker;
