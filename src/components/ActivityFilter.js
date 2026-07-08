import React from 'react';
import { injectIntl } from 'react-intl';
import { PublishedComponent, TextInput } from '@openimis/fe-core';
import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import _debounce from 'lodash/debounce';
import { defaultFilterStyles } from '../utils/styles';
import { DEFAULT_DEBOUNCE_TIME, EMPTY_STRING, CONTAINS_LOOKUP } from '../constants';
import { ActivityStatusPicker, ActivityTypePicker } from '../pickers/ConstantPickers';
import ActivityCategoryPicker from '../pickers/ActivityCategoryPicker';

function ActivityFilter({ classes, filters, onChangeFilters }) {
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
        <TextInput module="communications" label="communications.title" value={ft('title')} onChange={onText('title')} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <ActivityStatusPicker withNull label="communications.status" value={fv('status')}
          onChange={(v) => onChangeFilters([{ id: 'status', value: v, filter: v ? `status: "${v}"` : '' }])} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <ActivityTypePicker withNull label="communications.activityType" value={fv('activityType')}
          onChange={(v) => onChangeFilters([{ id: 'activityType', value: v, filter: v ? `activityType: "${v}"` : '' }])} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <ActivityCategoryPicker withLabel value={fv('categoryObj')}
          onChange={(v) => onChangeFilters([{ id: 'category_Id', value: v, filter: v ? `categoryId: "${v.id}"` : '' }])} />
      </Grid>
      <Grid item xs={12} className={classes.item}>
        <PublishedComponent pubRef="location.DetailedLocationFilter" withNull anchor="parentLocation"
          filters={filters} onChangeFilters={onChangeFilters} />
      </Grid>
    </Grid>
  );
}
export default injectIntl(withTheme(withStyles(defaultFilterStyles)(ActivityFilter)));
