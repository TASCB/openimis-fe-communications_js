import React from 'react';
import { injectIntl } from 'react-intl';
import { PublishedComponent, TextInput } from '@openimis/fe-core';
import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import _debounce from 'lodash/debounce';
import { defaultFilterStyles } from '../utils/styles';
import { DEFAULT_DEBOUNCE_TIME, EMPTY_STRING, CONTAINS_LOOKUP } from '../constants';
import { JournalistRolePicker, MediaMediumPicker, ActiveStatusPicker } from '../pickers/ConstantPickers';
import MediaHousePicker from '../pickers/MediaHousePicker';

function JournalistFilter({ classes, filters, onChangeFilters }) {
  const debounced = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);
  const fv = (k) => filters?.[k]?.value;
  const ft = (k) => filters?.[k]?.value ?? EMPTY_STRING;
  const onText = (name) => (value) => debounced([{ id: name, value, filter: `${name}_${CONTAINS_LOOKUP}: "${value}"` }]);
  return (
    <Grid container className={classes.form}>
      <Grid item xs={3} className={classes.item}>
        <TextInput module="communications" label="communications.journalist.firstName" value={ft('firstName')} onChange={onText('firstName')} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <TextInput module="communications" label="communications.journalist.lastName" value={ft('lastName')} onChange={onText('lastName')} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <JournalistRolePicker withNull label="communications.journalistRole" value={fv('role')}
          onChange={(v) => onChangeFilters([{ id: 'role', value: v, filter: v ? `role: ${v}` : '' }])} />
      </Grid>
      <Grid item xs={3} className={classes.item}>
        <TextInput module="communications" label="communications.journalist.beat" value={ft('beat')} onChange={onText('beat')} />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <MediaHousePicker withLabel value={fv('mediaHouseObj')}
          onChange={(v) => onChangeFilters([{ id: 'mediaHouseObj', value: v, filter: v ? `mediaHouse: "${v.id}"` : '' }])} />
      </Grid>
      <Grid item xs={4} className={classes.item}>
        <MediaMediumPicker withNull label="communications.medium" value={fv('medium')}
          onChange={(v) => onChangeFilters([{ id: 'medium', value: v, filter: v ? `mediaHouse_Category_Medium: ${v}` : '' }])} />
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
export default injectIntl(withTheme(withStyles(defaultFilterStyles)(JournalistFilter)));
