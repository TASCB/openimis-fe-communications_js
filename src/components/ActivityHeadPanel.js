import React from 'react';
import { injectIntl } from 'react-intl';
import {
  Divider, Grid, Paper, Typography,
} from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { Checkbox, FormControlLabel } from '@material-ui/core';
import {
  FormattedMessage, FormPanel, PublishedComponent, TextInput, NumberInput, withModulesManager,
} from '@openimis/fe-core';
import { ActivityTypePicker, EventTypePicker } from '../pickers/ConstantPickers';
import { ACTIVITY_TYPE_EVENT } from '../constants';
import ActivityCategoryPicker from '../pickers/ActivityCategoryPicker';
import ActivityProfileCard from './ActivityProfileCard';

const styles = (theme) => ({ paper: theme.paper.paper,
  tableTitle: theme.table.title, item: theme.paper.item });

class ActivityHeadPanel extends FormPanel {
  render() {
    const {
      edited, classes, readOnly, variant, outcomeReadOnly = true,
    } = this.props;
    const a = { ...edited };
    const isEvent = variant === 'event';
    const showEventType = a?.activityType === ACTIVITY_TYPE_EVENT;
    const hasRegister = (a?.participantCount ?? 0) > 0;
    const hasCoverage = (a?.coverageCount ?? 0) > 0;
    const hasAudience = (a?.audienceCount ?? 0) > 0;
    const num = (k) => (v) => this.updateAttribute(k, v ?? null);
    // The checkbox both reveals the platform field and clears it.
    const isVirtual = !!a?.virtualPlatform;
    const toggleVirtual = (on) => this.updateAttribute('virtualPlatform', on ? ' ' : null);
    return (
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle}>
          <Grid item>
            <Typography><FormattedMessage module="communications" id="communications.headPanel.planning" /></Typography>
          </Grid>
        </Grid>
        <Divider />
        {readOnly && <ActivityProfileCard activity={edited} hideOutcome />}
        {!readOnly && (
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
              onChange={(v) => this.updateAttributes({
                activityType: v,
                // the sub-type only means anything for an EVENT
                eventType: v === ACTIVITY_TYPE_EVENT ? a?.eventType : null,
              })} />
          </Grid>
          {showEventType && (
            <Grid item xs={4} className={classes.item}>
              <EventTypePicker withLabel readOnly={readOnly} value={a?.eventType}
                onChange={(v) => this.updateAttribute('eventType', v)} />
            </Grid>
          )}
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
          {/* Narrative only. Who actually attends is the Audience tab (planned, per stakeholder
              type) and the Participants register (named people). */}
          <Grid item xs={12} className={classes.item}>
            <TextInput module="communications" label="communications.audienceNotes" readOnly={readOnly}
              value={a?.targetAudience} onChange={(v) => this.updateAttribute('targetAudience', v)} />
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
            <FormControlLabel
              control={(
                <Checkbox color="primary" disabled={readOnly} checked={isVirtual}
                  onChange={(e) => toggleVirtual(e.target.checked)} />
              )}
              label={<FormattedMessage module="communications" id="communications.isVirtual" />}
            />
          </Grid>
          {isVirtual && (
            <Grid item xs={3} className={classes.item}>
              <TextInput module="communications" label="communications.virtualPlatform" readOnly={readOnly}
                value={a?.virtualPlatform} onChange={(v) => this.updateAttribute('virtualPlatform', v)} />
            </Grid>
          )}
          <Grid item xs={4} className={classes.item}>
            <PublishedComponent pubRef="location.LocationPicker" readOnly={readOnly} value={a?.location}
              onChange={(v) => this.updateAttributes({ location: v, locationId: v?.id ?? null })} />
          </Grid>
          {/* Derived from the Audience tab once it has rows — a free-typed total could only
              ever disagree with the per-stakeholder-type breakdown. */}
          <Grid item xs={3} className={classes.item}>
            <NumberInput module="communications" label="communications.plannedAudience" min={0} allowDecimals={false}
              readOnly={readOnly || hasAudience} value={a?.plannedAudienceCount}
              onChange={num('plannedAudienceCount')} />
          </Grid>
          {hasAudience && (
            <Grid item xs={9} className={classes.item}>
              <Typography variant="caption" color="textSecondary">
                <FormattedMessage module="communications" id="communications.headPanel.derivedFromAudience" />
              </Typography>
            </Grid>
          )}
        </Grid>
        )}

        {/* Outcome is recorded AFTER the activity runs, so it follows the post-event rule
            (editable until archived/cancelled) rather than the planning rule (Draft only).
            Previously these fields sat in the planning block and could only ever be filled in
            before the event had happened. */}
        <Grid container className={classes.tableTitle} style={{ marginTop: 8 }}>
          <Grid item>
            <Typography><FormattedMessage module="communications" id="communications.headPanel.outcome" /></Typography>
          </Grid>
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          <Grid item xs={3} className={classes.item}>
            <NumberInput module="communications" label="communications.actualAudience" min={0} allowDecimals={false}
              readOnly={outcomeReadOnly || hasRegister} value={a?.actualAudienceCount}
              onChange={num('actualAudienceCount')} />
          </Grid>
          {hasRegister && (
            <Grid item xs={9} className={classes.item}>
              <Typography variant="caption" color="textSecondary">
                <FormattedMessage module="communications" id="communications.headPanel.derivedFromRegister" />
              </Typography>
            </Grid>
          )}
          {!isEvent && (
            <>
              <Grid item xs={3} className={classes.item}>
                <NumberInput module="communications" label="communications.mediaHousesInvited" min={0} allowDecimals={false}
                  readOnly={outcomeReadOnly || hasCoverage} value={a?.mediaHousesInvited} onChange={num('mediaHousesInvited')} />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <NumberInput module="communications" label="communications.mediaHousesReported" min={0} allowDecimals={false}
                  readOnly={outcomeReadOnly || hasCoverage} value={a?.mediaHousesReported} onChange={num('mediaHousesReported')} />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(ActivityHeadPanel))));
