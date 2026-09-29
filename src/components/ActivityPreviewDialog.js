import React from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CampaignIcon from '@material-ui/icons/RecordVoiceOverOutlined';
import EventIcon from '@material-ui/icons/EventOutlined';
import MeetingRoomOutlined from '@material-ui/icons/MeetingRoomOutlined';
import VideocamOutlined from '@material-ui/icons/VideocamOutlined';
import PublicOutlined from '@material-ui/icons/PublicOutlined';
import PeopleOutline from '@material-ui/icons/PeopleOutline';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useModulesManager, useTranslations, formatDateFromISO } from '@openimis/fe-core';
import {
  PreviewDialog, PreviewField, PreviewSection, PreviewText, usePreviewStyles, PREVIEW_INK, PREVIEW_MUTED,
} from '@openimis/fe-tasaf_common';

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  return {
    tile: {
      width: 46, height: 46, borderRadius: 12, background: teal, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    facts: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
    fact: {
      display: 'flex', gap: 10, alignItems: 'flex-start',
      '& > svg': { fontSize: 18, color: teal, marginTop: 2, flex: '0 0 auto' },
    },
    factValue: { fontSize: 14, color: PREVIEW_INK, fontWeight: 600, wordBreak: 'break-word' },
    factSub: { fontSize: 12, color: PREVIEW_MUTED, marginTop: 1 },
    none: { color: '#9aa8a0', fontSize: 14 },
  };
});

function Fact({ classes, icon, value, sub }) {
  if (!value) return null;
  return (
    <div className={classes.fact}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <div className={classes.factValue}>{value}</div>
        {sub && <div className={classes.factSub}>{sub}</div>}
      </div>
    </div>
  );
}

function ActivityPreviewDialog({ activity, onClose, onOpen }) {
  const p = usePreviewStyles();
  const classes = useStyles();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const a = activity || {};
  const isEvent = a.activityType === 'EVENT';
  const fmtDate = (v) => (v ? formatDateFromISO(modulesManager, intl, v) : null);

  let days = null;
  if (a.startDatetime && a.endDatetime) {
    const d = Math.round((new Date(a.endDatetime) - new Date(a.startDatetime)) / 86400000) + 1;
    if (d > 0) days = `${d} ${formatMessage(d === 1 ? 'communications.activity.day' : 'communications.activity.days')}`;
  }
  const when = a.startDatetime ? `${fmtDate(a.startDatetime)} → ${fmtDate(a.endDatetime) || '—'}` : null;
  const audience = a.plannedAudienceCount != null || a.actualAudienceCount != null
    ? `${a.actualAudienceCount ?? '—'} / ${a.plannedAudienceCount ?? '—'}` : null;
  const media = a.mediaHousesInvited != null || a.mediaHousesReported != null
    ? `${a.mediaHousesReported ?? 0} / ${a.mediaHousesInvited ?? 0}` : null;
  const Icon = isEvent ? EventIcon : CampaignIcon;

  const aside = (
    <>
      <div className={classes.tile}><Icon /></div>
      <h2 className={p.heading}>{a.title}</h2>
      {a.code && <span className={p.code}>{a.code}</span>}
      <div className={p.tags}>
        {a.status && <span className={p.statusTag}>{formatMessage(`communications.status.${a.status}`)}</span>}
        {a.activityType && <span className={p.tag}>{formatMessage(`communications.activityType.${a.activityType}`)}</span>}
        {isEvent && a.eventType && <span className={p.tag}>{formatMessage(`communications.eventType.${a.eventType}`)}</span>}
      </div>
      <div className={classes.facts}>
        <Fact classes={classes} icon={<EventIcon />} value={when} sub={days} />
        <Fact classes={classes} icon={<MeetingRoomOutlined />} value={a.venue} />
        <Fact classes={classes} icon={<VideocamOutlined />} value={a.virtualPlatform} />
        <Fact classes={classes} icon={<PublicOutlined />} value={a.location?.name} />
        <Fact
          classes={classes}
          icon={<PeopleOutline />}
          value={audience}
          sub={audience ? formatMessage('communications.activity.audienceActualPlanned') : null}
        />
      </div>
    </>
  );

  const meta = (
    <>
      {a.userCreated?.username && (
        <span>
          {`${formatMessage('communications.profile.createdBy')} ${a.userCreated.username}`}
          {a.dateCreated ? ` · ${fmtDate(a.dateCreated)}` : ''}
        </span>
      )}
      {a.userUpdated?.username && (
        <span>
          {`${formatMessage('communications.profile.updatedBy')} ${a.userUpdated.username}`}
          {a.dateUpdated ? ` · ${fmtDate(a.dateUpdated)}` : ''}
        </span>
      )}
      {a.version != null && <span>{`${formatMessage('communications.profile.version')} ${a.version}`}</span>}
    </>
  );

  return (
    <PreviewDialog
      open={!!activity}
      onClose={onClose}
      title={formatMessage(isEvent ? 'communications.event.previewTitle' : 'communications.activity.previewTitle')}
      closeLabel={formatMessage('communications.close')}
      aside={aside}
      meta={meta}
      actions={(
        <>
          <Button onClick={onClose} color="primary">{formatMessage('communications.close')}</Button>
          {onOpen && (
            <Button onClick={() => onOpen(a)} color="primary" variant="contained" disableElevation startIcon={<OpenInNewIcon />}>
              {formatMessage('communications.open')}
            </Button>
          )}
        </>
      )}
    >
      <div className={p.grid}>
        <PreviewField label={formatMessage('communications.category').trim()} value={a.category?.name} />
        <PreviewField label={formatMessage('communications.targetAudience')} value={a.targetAudience} />
        <PreviewField
          label={formatMessage('communications.activity.mediaReported')}
          value={media}
          sub={a.coverageCount ? `${a.coverageCount} ${formatMessage('communications.activity.coverageRecords')}` : null}
        />
        <PreviewField
          label={formatMessage('communications.activity.registered')}
          value={a.participantCount || a.audienceCount
            ? [a.participantCount ? `${a.participantCount} ${formatMessage('communications.activity.participants')}` : null,
              a.audienceCount ? `${a.audienceCount} ${formatMessage('communications.activity.audienceGroups')}` : null]
              .filter(Boolean).join(' · ')
            : null}
        />
      </div>
      <div style={{ marginTop: 22 }}>
        <PreviewSection label={formatMessage('communications.objectiveSummary')}>
          {a.objectiveSummary
            ? <PreviewText collapsedHeight={72} moreLabel={formatMessage('communications.readMore')} lessLabel={formatMessage('communications.readLess')}>{a.objectiveSummary}</PreviewText>
            : <div className={classes.none}>—</div>}
        </PreviewSection>
        <PreviewSection label={formatMessage('communications.description')}>
          {a.description
            ? <PreviewText moreLabel={formatMessage('communications.readMore')} lessLabel={formatMessage('communications.readLess')}>{a.description}</PreviewText>
            : <div className={classes.none}>{formatMessage('communications.activity.noDescription')}</div>}
        </PreviewSection>
      </div>
    </PreviewDialog>
  );
}

export default ActivityPreviewDialog;
