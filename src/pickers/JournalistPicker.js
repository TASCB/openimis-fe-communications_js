import React, { useState, useEffect } from 'react';
import { TextField } from '@material-ui/core';
import {
  Autocomplete, useModulesManager, useTranslations, useGraphqlQuery,
} from '@openimis/fe-core';
import { PICKER_LIMIT } from '../constants';

/**
 * Journalist autocomplete. Pass `mediaHouseId` to scope the list to one outlet: coverage
 * attribution and a house's primary contact both require the person to work there (freelancers
 * excepted), so offering the full registry would only surface choices the backend rejects.
 */
function JournalistPicker({
  required, readOnly, value, onChange, label, withLabel = false, mediaHouseId = null,
  includeFreelance = true,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const [search, setSearch] = useState(null);
  const [filters, setFilters] = useState({ first: PICKER_LIMIT, isActive: true });

  useEffect(() => {
    setFilters({
      first: PICKER_LIMIT, isActive: true, search, mediaHouse: mediaHouseId || undefined,
    });
  }, [mediaHouseId, search]);

  const { isLoading, data, error } = useGraphqlQuery(
    `query CommJournalistPicker($search: String, $first: Int, $isActive: Boolean, $mediaHouse: ID) {
      journalist(lastName_Icontains: $search, first: $first, isActive: $isActive, mediaHouse: $mediaHouse) {
        edges { node { id code firstName lastName role isFreelance mediaHouse { id name } } }
      }
    }`, filters,
  );
  const houseScoped = data?.journalist?.edges?.map((e) => e.node) ?? [];

  // Freelancers have no house, so a house-scoped query never returns them; fetch them separately.
  const { data: freeData } = useGraphqlQuery(
    `query CommFreelancePicker($search: String, $first: Int) {
      journalist(lastName_Icontains: $search, first: $first, isActive: true, isFreelance: true) {
        edges { node { id code firstName lastName role isFreelance mediaHouse { id name } } }
      }
    }`,
    { first: PICKER_LIMIT, search },
    { skip: !mediaHouseId || !includeFreelance },
  );
  const freelancers = (mediaHouseId && includeFreelance)
    ? (freeData?.journalist?.edges?.map((e) => e.node) ?? []) : [];

  const seen = new Set();
  const options = [...houseScoped, ...freelancers].filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  const labelOf = (o) => (o
    ? `${o.firstName} ${o.lastName}${o.isFreelance ? ' (freelance)' : ''}`
    : '');
  const text = label || formatMessage('communications.journalistPicker');
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
      getOptionLabel={labelOf}
      onChange={(v) => onChange(v, labelOf(v))}
      onInputChange={setSearch}
      renderInput={(inputProps) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <TextField {...inputProps} required={required} label={text} />
      )}
    />
  );
}
export default JournalistPicker;
