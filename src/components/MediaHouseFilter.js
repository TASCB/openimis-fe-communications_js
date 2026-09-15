import React from 'react';
import { injectIntl } from 'react-intl';
import { PublishedComponent, TextInput } from '@openimis/fe-core';
import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import _debounce from 'lodash/debounce';
import { defaultFilterStyles } from '../utils/styles';
import { DEFAULT_DEBOUNCE_TIME, EMPTY_STRING, CONTAINS_LOOKUP } from '../constants';
import { MediaMediumPicker, MediaScopePicker, ActiveStatusPicker } from '../pickers/ConstantPickers';
import MediaHouseCategoryPicker from '../pickers/MediaHouseCategoryPicker';

function MediaHouseFilter({ classes, filters, onChangeFilters }) {
  const debounced = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);
  const fv = (k) => filters?.[k]?.value;
  const ft = (k) => filters?.[k]?.value ?? EMPTY_STRING;
  const onText = (name) => (value) => debounced([{ id: name, value, filter: `${name}_${CONTAINS_LOOKUP}: "${value}"` }]);
  return (
    <Grid container className={classes.form}>
      <Grid item xs={3} className={classes.item}>
        <TextInput module="communications" label="communications.code" value={ft('code')} onChange={onText('code')} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <TextInput module="communications" label="communications.mediaHouse.name" value={ft('name')} onChange={onText('name')} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <MediaMediumPicker withNull label="communications.medium" value={fv('medium')}
          onChange={(v) => onChangeFilters([{ id: 'medium', value: v, filter: v ? `category_Medium: ${v}` : '' }])} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <MediaScopePicker withNull label="communications.scope" value={fv('scope')}
          onChange={(v) => onChangeFilters([{ id: 'scope', value: v, filter: v ? `category_Scope: ${v}` : '' }])} />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <MediaHouseCategoryPicker withLabel value={fv('categoryObj')}
          onChange={(v) => onChangeFilters([{ id: 'categoryObj', value: v, filter: v ? `category: "${v.id}"` : '' }])} />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <ActiveStatusPicker withNull label="communications.isActive" value={fv('isActive')}
          onChange={(v) => onChangeFilters([{ id: 'isActive', value: v, filter: v ? `isActive: ${v === 'ACTIVE'}` : '' }])} />
      </Grid>
      <Grid item xs={12} className={classes.item}>
        <PublishedComponent pubRef="location.DetailedLocationFilter" withNull anchor="parentLocation"
          filters={filters} onChangeFilters={onChangeFilters} />
      </Grid>
    </Grid>
  );
}
export default injectIntl(withTheme(withStyles(defaultFilterStyles)(MediaHouseFilter)));
