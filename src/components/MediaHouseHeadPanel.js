import React from 'react';
import { injectIntl } from 'react-intl';
import {
  Divider, Grid, Paper, Typography,
} from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  FormattedMessage, FormPanel, PublishedComponent, TextInput,
} from '@openimis/fe-core';
import MediaHouseCategoryPicker from '../pickers/MediaHouseCategoryPicker';
import JournalistPicker from '../pickers/JournalistPicker';

const styles = (theme) => ({ paper: theme.paper.paper,
  tableTitle: theme.table.title, item: theme.paper.item });

class MediaHouseHeadPanel extends FormPanel {
  render() {
    const { edited, classes, readOnly, intl } = this.props;
    const formatMessage = (id) => intl.formatMessage({ id });
    const h = { ...edited };
    return (
      <Paper className={classes.paper}>
        <Grid container className={classes.tableTitle}>
          <Grid item>
            <Typography><FormattedMessage module="communications" id="communications.mediaHouse.headPanel.title" /></Typography>
          </Grid>
        </Grid>
        <Divider />
        <Grid container className={classes.item}>
          {h?.code && (
            <Grid item xs={3} className={classes.item}>
              <TextInput module="communications" label="communications.code" readOnly
                value={h.code} onChange={(v) => this.updateAttribute('code', v)} />
            </Grid>
          )}
          <Grid item xs={h?.code ? 5 : 8} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.name" required readOnly={readOnly}
              value={h?.name} onChange={(v) => this.updateAttribute('name', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <MediaHouseCategoryPicker withLabel required readOnly={readOnly} value={h?.category}
              onChange={(v) => this.updateAttributes({ category: v, categoryId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <PublishedComponent pubRef="location.LocationPicker" readOnly={readOnly} value={h?.location}
              onChange={(v) => this.updateAttributes({ location: v, locationId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.frequencyOrChannel" readOnly={readOnly}
              value={h?.frequencyOrChannel} onChange={(v) => this.updateAttribute('frequencyOrChannel', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.language" readOnly={readOnly}
              value={h?.language} onChange={(v) => this.updateAttribute('language', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.contactPerson" readOnly={readOnly}
              value={h?.contactPerson} onChange={(v) => this.updateAttribute('contactPerson', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.phone" readOnly={readOnly}
              value={h?.phone} onChange={(v) => this.updateAttribute('phone', v)} />
          </Grid>
          <Grid item xs={4} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.email" readOnly={readOnly}
              value={h?.email} onChange={(v) => this.updateAttribute('email', v)} />
          </Grid>
          <Grid item xs={6} className={classes.item}>
            {/* A named individual belongs in the Journalist registry and is linked here;
                `contact_person` above stays the institutional desk ("News Desk"). */}
            <JournalistPicker withLabel readOnly={readOnly} value={h?.primaryContact}
              mediaHouseId={h?.id ?? null}
              label={formatMessage('communications.mediaHouse.primaryContact')}
              onChange={(v) => this.updateAttributes({ primaryContact: v, primaryContactId: v?.id ?? null })} />
          </Grid>
          <Grid item xs={6} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.website" readOnly={readOnly}
              value={h?.website} onChange={(v) => this.updateAttribute('website', v)} />
          </Grid>
          <Grid item xs={6} className={classes.item}>
            <TextInput module="communications" label="communications.mediaHouse.address" readOnly={readOnly}
              value={h?.address} onChange={(v) => this.updateAttribute('address', v)} />
          </Grid>
          <Grid item xs={12} className={classes.item}>
            <TextInput module="communications" label="communications.notes" readOnly={readOnly}
              value={h?.notes} onChange={(v) => this.updateAttribute('notes', v)} />
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
export default injectIntl(withTheme(withStyles(styles)(MediaHouseHeadPanel)));
