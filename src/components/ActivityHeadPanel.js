import React from 'react';
import { injectIntl } from 'react-intl';
import { Divider, Grid, Typography } from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  FormattedMessage, FormPanel, PublishedComponent, TextInput, NumberInput, withModulesManager,
} from '@openimis/fe-core';
import { ActivityTypePicker, ActivityStatusPicker } from '../pickers/ConstantPickers';
import ActivityCategoryPicker from '../pickers/ActivityCategoryPicker';
import ActivityProfileCard from './ActivityProfileCard';

const styles = (theme) => ({ tableTitle: theme.table.title, item: theme.paper.item });

class ActivityHeadPanel extends FormPanel {
  render() {
    const { edited, classes, readOnly } = this.props;
    const a = { ...edited };
    if (readOnly) return <ActivityProfileCard activity={edited} />;
    const num = (k) => (v) => this.updateAttribute(k, v ?? null);
    return (
      <>
        <Grid container className={classes.tableTitle}>
          <Grid item><Typography><FormattedMessage module="communications" id="communications.headPanel.title" /></Typography></Grid>
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          {a?.code && (
            <Grid item xs={3} className={classes.item}>
              <TextInput module="communications" label="communications.code" readOnly
                value={a.code} onChange={(v) => this.updateAttribute('code', v)} />
            </Grid>
          )}
          <Grid item xs={a?.code ? 5 : 6} className={classes.item}>
            <TextInput module="communications" label="communications.title" required readOnly={readOnly}
              value={a?.title} onChange={(v) => this.updateAttribute('title', v)} />
          </Grid>
          <Grid item xs={a?.code ? 4 : 6} className={classes.item}>
            <ActivityTypePicker readOnly={readOnly} withLabel value={a?.activityType}
              onChange={(v) => this.updateAttribute('activityType', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <ActivityCategoryPicker withLabel readOnly={readOnly} value={a?.category}
              onChange={(v) => this.updateAttributes({ category: v, categoryId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={8} className={classes.item}>
            <TextInput module="communications" label="communications.objectiveSummary" readOnly={readOnly}
              value={a?.objectiveSummary} onChange={(v) => this.updateAttribute('objectiveSummary', v)} />
          </Grid>
          <Grid item xs={12} className={classes.item}>
            <TextInput module="communications" label="communications.description" readOnly={readOnly}
              value={a?.description} onChange={(v) => this.updateAttribute('description', v)} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent pubRef="core.DatePicker" module="communications" label="communications.startDatetime" required
              readOnly={readOnly} value={a?.startDatetime} onChange={(v) => this.updateAttribute('startDatetime', v)} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent pubRef="core.DatePicker" module="communications" label="communications.endDatetime" required
              readOnly={readOnly} value={a?.endDatetime} onChange={(v) => this.updateAttribute('endDatetime', v)} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TextInput module="communications" label="communications.venue" readOnly={readOnly}
              value={a?.venue} onChange={(v) => this.updateAttribute('venue', v)} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TextInput module="communications" label="communications.virtualPlatform" readOnly={readOnly}
              value={a?.virtualPlatform} onChange={(v) => this.updateAttribute('virtualPlatform', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <PublishedComponent pubRef="location.LocationPicker" readOnly={readOnly} value={a?.location}
              onChange={(v) => this.updateAttributes({ location: v, locationId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={8} className={classes.item}>
            <TextInput module="communications" label="communications.targetAudience" readOnly={readOnly}
              value={a?.targetAudience} onChange={(v) => this.updateAttribute('targetAudience', v)} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <NumberInput module="communications" label="communications.plannedAudience" min={0} allowDecimals={false}
              readOnly={readOnly} value={a?.plannedAudienceCount} onChange={num('plannedAudienceCount')} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <NumberInput module="communications" label="communications.actualAudience" min={0} allowDecimals={false}
              readOnly={readOnly} value={a?.actualAudienceCount} onChange={num('actualAudienceCount')} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <NumberInput module="communications" label="communications.mediaHousesInvited" min={0} allowDecimals={false}
              readOnly={readOnly} value={a?.mediaHousesInvited} onChange={num('mediaHousesInvited')} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <NumberInput module="communications" label="communications.mediaHousesReported" min={0} allowDecimals={false}
              readOnly={readOnly} value={a?.mediaHousesReported} onChange={num('mediaHousesReported')} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <ActivityStatusPicker required readOnly withNull={false} label="communications.status"
              value={a?.status} onChange={(v) => this.updateAttribute('status', v)} />
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(ActivityHeadPanel))));
