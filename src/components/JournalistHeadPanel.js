import React from 'react';
import { injectIntl } from 'react-intl';
import {
  Checkbox, Divider, FormControlLabel, Grid, Paper, Typography,
} from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  FormattedMessage, FormPanel, PublishedComponent, TextInput,
} from '@openimis/fe-core';
import MediaHousePicker from '../pickers/MediaHousePicker';
import { JournalistRolePicker } from '../pickers/ConstantPickers';

const styles = (theme) => ({ paper: theme.paper.paper,
  tableTitle: theme.table.title, item: theme.paper.item });

class JournalistHeadPanel extends FormPanel {
  render() {
    const { edited, classes, readOnly, intl } = this.props;
    const j = { ...edited };
    // A freelancer has no house: clearing the affiliation alongside the flag keeps the two consistent.
    const onFreelance = (checked) => this.updateAttributes(
      checked ? { isFreelance: true, mediaHouse: null, mediaHouseId: null } : { isFreelance: false },
    );
    return (
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle}>
          <Grid item>
            <Typography><FormattedMessage module="communications" id="communications.journalist.headPanel.title" /></Typography>
          </Grid>
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          {j?.code && (
            <Grid item xs={3} className={classes.item}>
              <TextInput module="communications" label="communications.code" readOnly
                value={j.code} onChange={(v) => this.updateAttribute('code', v)} />
            </Grid>
          )}
          <Grid item xs={j?.code ? 4 : 5} className={classes.item}>
            <TextInput module="communications" label="communications.journalist.firstName" required readOnly={readOnly}
              value={j?.firstName} onChange={(v) => this.updateAttribute('firstName', v)} />
          </Grid>
          <Grid item xs={j?.code ? 5 : 7} className={classes.item}>
            <TextInput module="communications" label="communications.journalist.lastName" required readOnly={readOnly}
              value={j?.lastName} onChange={(v) => this.updateAttribute('lastName', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <MediaHousePicker withLabel readOnly={readOnly || !!j?.isFreelance} value={j?.mediaHouse}
              onChange={(v) => this.updateAttributes({ mediaHouse: v, mediaHouseId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={2} className={classes.item}>
            <FormControlLabel
              control={(
                <Checkbox color="primary" disabled={readOnly} checked={!!j?.isFreelance}
                  onChange={(e) => onFreelance(e.target.checked)} />
              )}
              label={intl.formatMessage({ id: 'communications.journalist.isFreelance' })}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <JournalistRolePicker withLabel readOnly={readOnly} value={j?.role}
              onChange={(v) => this.updateAttribute('role', v)} />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TextInput module="communications" label="communications.journalist.beat" readOnly={readOnly}
              value={j?.beat} onChange={(v) => this.updateAttribute('beat', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.phone" readOnly={readOnly}
              value={j?.phone} onChange={(v) => this.updateAttribute('phone', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.journalist.altPhone" readOnly={readOnly}
              value={j?.altPhone} onChange={(v) => this.updateAttribute('altPhone', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.email" readOnly={readOnly}
              value={j?.email} onChange={(v) => this.updateAttribute('email', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <PublishedComponent pubRef="location.LocationPicker" readOnly={readOnly} value={j?.location}
              onChange={(v) => this.updateAttributes({ location: v, locationId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.journalist.languages" readOnly={readOnly}
              value={j?.languages} onChange={(v) => this.updateAttribute('languages', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.journalist.accreditationNo" readOnly={readOnly}
              value={j?.accreditationNo} onChange={(v) => this.updateAttribute('accreditationNo', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <PublishedComponent pubRef="core.DatePicker" module="communications"
              label="communications.journalist.accreditationExpiry" readOnly={readOnly}
              value={j?.accreditationExpiry} onChange={(v) => this.updateAttribute('accreditationExpiry', v)} />
          </Grid>
          <Grid item xs={12} className={classes.item}>
            <TextInput module="communications" label="communications.notes" readOnly={readOnly}
              value={j?.notes} onChange={(v) => this.updateAttribute('notes', v)} />
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
export default injectIntl(withTheme(withStyles(styles)(JournalistHeadPanel)));
