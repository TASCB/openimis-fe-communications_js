import React, { useState } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

// Templates were CRUD-only until now: the Library let people author them and nothing read them
// back. This is the first consumer.
function TemplatePicker({ readOnly, value, onChange, label, withLabel = false }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT, isActive: true });
  const { isLoading, data, error } = useGraphqlQuery(
    `query CommTemplatePicker($search: String, $first: Int, $isActive: Boolean) {
      communicationTemplate(name_Icontains: $search, first: $first, isActive: $isActive) {
        edges { node { id code name channelType subject body } }
      }
    }`, filters,
  );
  const options = data?.communicationTemplate?.edges?.map((e) => e.node) ?? [];
  const text = label || formatMessage('communications.templatePicker');
  return (
    <Autocomplete
      error={error}
      readOnly={readOnly}
      options={options}
      isLoading={isLoading}
      value={value}
      label={text}
      withLabel={withLabel}
      getOptionLabel={(o) => (o ? o.name : '')}
      onChange={(v) => onChange(v, v ? v.name : null)}
      onInputChange={(search) => setFilters({ first: PICKER_LIMIT, isActive: true, search })}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} label={text} />
      )}
    />
  );
}
export default TemplatePicker;
