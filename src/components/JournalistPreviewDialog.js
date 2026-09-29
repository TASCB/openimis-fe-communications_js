import React from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import EmailOutlined from '@material-ui/icons/EmailOutlined';
import PhoneOutlined from '@material-ui/icons/PhoneOutlined';
import EditOutlined from '@material-ui/icons/EditOutlined';
import { useModulesManager, useTranslations, formatDateFromISO } from '@openimis/fe-core';
import {
  PreviewDialog, PreviewField, PreviewSection, PreviewText, usePreviewStyles, PREVIEW_BORDER, PREVIEW_INK, PREVIEW_PANEL,
} from '@openimis/fe-tasaf_common';

const initials = (j) => [j.firstName, j.lastName].filter(Boolean).map((p) => p[0]).join('').toUpperCase() || '?';

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  return {
    identity: { alignItems: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 },
    avatar: {
      width: 76, height: 76, borderRadius: '50%', background: teal, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800,
    },
    contacts: { alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
    contact: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
      background: '#fff', border: `1px solid ${PREVIEW_BORDER}`, color: PREVIEW_INK, fontSize: 13.5,
      textDecoration: 'none', minWidth: 0,
      '& svg': { fontSize: 18, color: teal, flex: '0 0 auto' },
      '& span': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      '&:hover': { borderColor: teal },
    },
    notes: {
      padding: '12px 16px', borderLeft: `3px solid ${teal}`, background: PREVIEW_PANEL, borderRadius: '0 10px 10px 0',
    },
  };
});

function ContactLink({ classes, href, icon, text }) {
  return (
    <a className={classes.contact} href={href}>
      {icon}
      <span>{text}</span>
    </a>
  );
}

function JournalistPreviewDialog({ journalist, onClose, onEdit }) {
  const p = usePreviewStyles();
  const classes = useStyles();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const j = journalist || {};
  const name = `${j.firstName ?? ''} ${j.lastName ?? ''}`.trim() || j.fullName;
  const fmtDate = (v) => (v ? formatDateFromISO(modulesManager, intl, v) : null);

  const mediaHouse = j.isFreelance ? formatMessage('communications.journalist.freelance') : j.mediaHouse?.name;
  const stories = j.storiesFiled || j.avgCoverageQuality != null
    ? `${j.storiesFiled ?? 0} ${formatMessage('communications.journalist.stories')}` : null;
  const quality = j.avgCoverageQuality != null ? `${Number(j.avgCoverageQuality).toFixed(1)} / 5` : null;
  const accreditationExpiry = j.accreditationExpiry
    ? `${formatMessage('communications.journalist.accreditationExpiry')}: ${fmtDate(j.accreditationExpiry)}` : null;

  const aside = (
    <div className={classes.identity}>
      <div className={classes.avatar}>{initials(j)}</div>
      <h2 className={p.heading}>{name}</h2>
      {j.code && <span className={p.code}>{j.code}</span>}
      <div className={p.tags} style={{ justifyContent: 'center' }}>
        {j.role && <span className={p.tag}>{formatMessage(`communications.journalistRole.${j.role}`)}</span>}
        <span className={p.statusTag}>
          {formatMessage(j.isActive === false ? 'communications.journalist.inactive' : 'communications.journalist.active')}
        </span>
      </div>
      <div className={classes.contacts}>
        {j.phone && <ContactLink classes={classes} href={`tel:${j.phone}`} icon={<PhoneOutlined />} text={j.phone} />}
        {j.altPhone && <ContactLink classes={classes} href={`tel:${j.altPhone}`} icon={<PhoneOutlined />} text={j.altPhone} />}
        {j.email && <ContactLink classes={classes} href={`mailto:${j.email}`} icon={<EmailOutlined />} text={j.email} />}
      </div>
    </div>
  );

  const meta = (
    <>
      {j.userCreated?.username && (
        <span>
          {`${formatMessage('communications.profile.createdBy')} ${j.userCreated.username}`}
          {j.dateCreated ? ` · ${fmtDate(j.dateCreated)}` : ''}
        </span>
      )}
      {j.userUpdated?.username && (
        <span>
          {`${formatMessage('communications.profile.updatedBy')} ${j.userUpdated.username}`}
          {j.dateUpdated ? ` · ${fmtDate(j.dateUpdated)}` : ''}
        </span>
      )}
      {j.version != null && <span>{`${formatMessage('communications.profile.version')} ${j.version}`}</span>}
    </>
  );

  return (
    <PreviewDialog
      open={!!journalist}
      onClose={onClose}
      title={formatMessage('communications.journalist.previewTitle')}
      closeLabel={formatMessage('communications.close')}
      aside={aside}
      meta={meta}
      actions={(
        <>
          <Button onClick={onClose} color="primary">{formatMessage('communications.close')}</Button>
          {onEdit && (
            <Button onClick={() => onEdit(j)} color="primary" variant="contained" disableElevation startIcon={<EditOutlined />}>
              {formatMessage('communications.edit')}
            </Button>
          )}
        </>
      )}
    >
      <div className={p.grid}>
        <PreviewField
          label={formatMessage('communications.journalist.mediaHouse')}
          value={mediaHouse}
          sub={!j.isFreelance ? j.mediaHouse?.category?.name : null}
        />
        <PreviewField label={formatMessage('communications.journalist.beat')} value={j.beat} />
        <PreviewField label={formatMessage('communications.location')} value={j.location?.name} />
        <PreviewField label={formatMessage('communications.journalist.languages')} value={j.languages} />
        <PreviewField
          label={formatMessage('communications.journalist.accreditationNo')}
          value={j.accreditationNo}
          sub={accreditationExpiry}
        />
        <PreviewField
          label={formatMessage('communications.journalist.performance')}
          value={stories}
          sub={[quality, j.lastCoverageDate
            ? `${formatMessage('communications.journalist.lastCoverage')}: ${fmtDate(j.lastCoverageDate)}` : null]
            .filter(Boolean).join(' · ') || null}
        />
      </div>
      {j.notes && (
        <div style={{ marginTop: 22 }}>
          <PreviewSection label={formatMessage('communications.notes')}>
            <PreviewText className={classes.notes} moreLabel={formatMessage('communications.readMore')} lessLabel={formatMessage('communications.readLess')}>{j.notes}</PreviewText>
          </PreviewSection>
        </div>
      )}
    </PreviewDialog>
  );
}

export default JournalistPreviewDialog;
