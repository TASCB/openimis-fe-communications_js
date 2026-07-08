import React from 'react';
import { useIntl } from 'react-intl';
import {
  Paper, Grid, Typography, Avatar, Chip, Divider,
} from '@material-ui/core';
import Campaign from '@material-ui/icons/Announcement';
import Event from '@material-ui/icons/Event';
import EventAvailable from '@material-ui/icons/EventAvailable';
import Room from '@material-ui/icons/Room';
import LocationOn from '@material-ui/icons/LocationOn';
import Category from '@material-ui/icons/Category';
import People from '@material-ui/icons/People';
import Public from '@material-ui/icons/Public';
import Assessment from '@material-ui/icons/Assessment';
import { useModulesManager, useTranslations, formatDateFromISO } from '@openimis/fe-core';
import { useProfileCardStyles, ProfileTile } from '../utils/profileCardStyles';

function ActivityProfileCard({ activity }) {
  const classes = useProfileCardStyles();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const a = activity || {};
  const fmtDate = (v) => (v ? formatDateFromISO(modulesManager, intl, v) : null);
  const statusLabel = a.status ? formatMessage(`communications.status.${a.status}`) : null;
  const typeLabel = a.activityType ? formatMessage(`communications.activityType.${a.activityType}`) : null;
  const variance = (a.actualAudienceCount != null && a.plannedAudienceCount != null)
    ? a.actualAudienceCount - a.plannedAudienceCount : null;

  return (
    <Paper className={classes.card}>
      <div className={classes.header}>
        <Avatar className={classes.avatar}><Campaign fontSize="large" /></Avatar>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <Typography className={classes.code}>{a.code}</Typography>
          <Typography variant="h5" className={classes.title}>{a.title}</Typography>
          {typeLabel && <Typography className={classes.sub}>{typeLabel}</Typography>}
        </div>
        {statusLabel && <Chip label={statusLabel} className={classes.chip} />}
      </div>
      <div className={classes.body}>
        <Grid container spacing={3}>
          <ProfileTile md={4} icon={<Category />} label={formatMessage('communications.category')} value={a.category?.name} />
          <ProfileTile md={4} icon={<Event />} label={formatMessage('communications.startDatetime')} value={fmtDate(a.startDatetime)} />
          <ProfileTile md={4} icon={<EventAvailable />} label={formatMessage('communications.endDatetime')} value={fmtDate(a.endDatetime)} />
          <ProfileTile md={4} icon={<Room />} label={formatMessage('communications.venue')} value={a.venue} />
          <ProfileTile md={4} icon={<Public />} label={formatMessage('communications.virtualPlatform')} value={a.virtualPlatform} />
          <ProfileTile md={4} icon={<LocationOn />} label={formatMessage('communications.location')} value={a.location?.name} />
          <ProfileTile md={4} icon={<People />} label={formatMessage('communications.plannedAudience')} value={a.plannedAudienceCount} />
          <ProfileTile md={4} icon={<People />} label={formatMessage('communications.actualAudience')} value={a.actualAudienceCount} />
          <ProfileTile md={4} icon={<Assessment />} label={formatMessage('communications.audienceVariance')} value={variance} />
          <ProfileTile md={4} icon={<Assessment />} label={formatMessage('communications.mediaHousesInvited')} value={a.mediaHousesInvited} />
          <ProfileTile md={4} icon={<Assessment />} label={formatMessage('communications.mediaHousesReported')} value={a.mediaHousesReported} />
        </Grid>
        {a.objectiveSummary && (
          <>
            <Typography className={classes.sectionTitle} style={{ marginTop: 20 }}>{formatMessage('communications.objectiveSummary')}</Typography>
            <Typography className={classes.block}>{a.objectiveSummary}</Typography>
          </>
        )}
        {a.description && (
          <>
            <Typography className={classes.sectionTitle} style={{ marginTop: 16 }}>{formatMessage('communications.description')}</Typography>
            <Typography className={classes.block}>{a.description}</Typography>
          </>
        )}
      </div>
      {(a.userCreated || a.version != null) && (
        <>
          <Divider />
          <div className={classes.meta}>
            {a.userCreated?.username && (
              <span>
                {formatMessage('communications.profile.createdBy')}
                {': '}
                <b>{a.userCreated.username}</b>
                {a.dateCreated ? ` · ${fmtDate(a.dateCreated)}` : ''}
              </span>
            )}
            {a.version != null && (
              <span>
                {formatMessage('communications.profile.version')}
                {' '}
                <b>{a.version}</b>
              </span>
            )}
          </div>
        </>
      )}
    </Paper>
  );
}
export default ActivityProfileCard;
