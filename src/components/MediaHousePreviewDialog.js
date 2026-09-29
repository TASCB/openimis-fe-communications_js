import React from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import EmailOutlined from '@material-ui/icons/EmailOutlined';
import PhoneOutlined from '@material-ui/icons/PhoneOutlined';
import LanguageOutlined from '@material-ui/icons/LanguageOutlined';
import PersonOutline from '@material-ui/icons/PersonOutline';
import EditOutlined from '@material-ui/icons/EditOutlined';
import RadioOutlined from '@material-ui/icons/Radio';
import TvOutlined from '@material-ui/icons/Tv';
import ChromeReaderModeOutlined from '@material-ui/icons/ChromeReaderModeOutlined';
import PublicOutlined from '@material-ui/icons/PublicOutlined';
import ShareOutlined from '@material-ui/icons/ShareOutlined';
import BusinessOutlined from '@material-ui/icons/BusinessOutlined';
import { useModulesManager, useTranslations, formatDateFromISO } from '@openimis/fe-core';
import {
  PreviewDialog, PreviewField, PreviewSection, PreviewText, usePreviewStyles, PREVIEW_BORDER, PREVIEW_INK, PREVIEW_PANEL,
} from '@openimis/fe-tasaf_common';

const MEDIUM_ICON = {
  RADIO: RadioOutlined,
  TV: TvOutlined,
  NEWSPAPER: ChromeReaderModeOutlined,
  WEBSITE: PublicOutlined,
  BLOG: PublicOutlined,
  SOCIAL: ShareOutlined,
};

const withScheme = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  return {
    identity: { alignItems: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 },
    tile: {
      width: 64, height: 64, borderRadius: 16, background: teal, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 32 },
    },
    contacts: { alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
    contact: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
      background: '#fff', border: `1px solid ${PREVIEW_BORDER}`, color: PREVIEW_INK, fontSize: 13.5,
      textDecoration: 'none', minWidth: 0, textAlign: 'left',
      '& svg': { fontSize: 18, color: teal, flex: '0 0 auto' },
      '& span': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    },
    link: { '&:hover': { borderColor: teal } },
    notes: {
      padding: '12px 16px', borderLeft: `3px solid ${teal}`, background: PREVIEW_PANEL, borderRadius: '0 10px 10px 0',
    },
  };
});

function Contact({ classes, href, icon, text, newTab }) {
  const content = (
    <>
      {icon}
      <span>{text}</span>
    </>
  );
  if (!href) return <div className={classes.contact}>{content}</div>;
  return (
    <a
      className={`${classes.contact} ${classes.link}`}
      href={href}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </a>
  );
}

function MediaHousePreviewDialog({ mediaHouse, onClose, onEdit }) {
  const p = usePreviewStyles();
  const classes = useStyles();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  const h = mediaHouse || {};
  const fmtDate = (v) => (v ? formatDateFromISO(modulesManager, intl, v) : null);

  const medium = h.category?.medium;
  const scope = h.category?.scope;
  const MediumIcon = MEDIUM_ICON[medium] || BusinessOutlined;
  const primary = h.primaryContact
    ? `${h.primaryContact.firstName ?? ''} ${h.primaryContact.lastName ?? ''}`.trim() : null;
  const quality = h.avgCoverageQuality != null ? `${Number(h.avgCoverageQuality).toFixed(1)} / 5` : null;

  const aside = (
    <div className={classes.identity}>
      <div className={classes.tile}><MediumIcon /></div>
      <h2 className={p.heading}>{h.name}</h2>
      {h.code && <span className={p.code}>{h.code}</span>}
      <div className={p.tags} style={{ justifyContent: 'center' }}>
        {h.category?.name && <span className={p.tag}>{h.category.name}</span>}
        <span className={p.statusTag}>
          {formatMessage(h.isActive === false ? 'communications.journalist.inactive' : 'communications.journalist.active')}
        </span>
      </div>
      <div className={classes.contacts}>
        {h.contactPerson && <Contact classes={classes} icon={<PersonOutline />} text={h.contactPerson} />}
        {h.phone && <Contact classes={classes} href={`tel:${h.phone}`} icon={<PhoneOutlined />} text={h.phone} />}
        {h.email && <Contact classes={classes} href={`mailto:${h.email}`} icon={<EmailOutlined />} text={h.email} />}
        {h.website && (
          <Contact classes={classes} href={withScheme(h.website)} icon={<LanguageOutlined />} text={h.website} newTab />
        )}
      </div>
    </div>
  );

  const meta = (
    <>
      {h.userCreated?.username && (
        <span>
          {`${formatMessage('communications.profile.createdBy')} ${h.userCreated.username}`}
          {h.dateCreated ? ` · ${fmtDate(h.dateCreated)}` : ''}
        </span>
      )}
      {h.userUpdated?.username && (
        <span>
          {`${formatMessage('communications.profile.updatedBy')} ${h.userUpdated.username}`}
          {h.dateUpdated ? ` · ${fmtDate(h.dateUpdated)}` : ''}
        </span>
      )}
      {h.version != null && <span>{`${formatMessage('communications.profile.version')} ${h.version}`}</span>}
    </>
  );

  return (
    <PreviewDialog
      open={!!mediaHouse}
      onClose={onClose}
      title={formatMessage('communications.mediaHouse.previewTitle')}
      closeLabel={formatMessage('communications.close')}
      aside={aside}
      meta={meta}
      actions={(
        <>
          <Button onClick={onClose} color="primary">{formatMessage('communications.close')}</Button>
          {onEdit && (
            <Button onClick={() => onEdit(h)} color="primary" variant="contained" disableElevation startIcon={<EditOutlined />}>
              {formatMessage('communications.edit')}
            </Button>
          )}
        </>
      )}
    >
      <div className={p.grid}>
        <PreviewField
          label={formatMessage('communications.medium')}
          value={medium ? formatMessage(`communications.medium.${medium}`) : null}
        />
        <PreviewField
          label={formatMessage('communications.scope')}
          value={scope ? formatMessage(`communications.scope.${scope}`) : null}
        />
        <PreviewField label={formatMessage('communications.mediaHouse.location')} value={h.location?.name} />
        <PreviewField label={formatMessage('communications.mediaHouse.language')} value={h.language} />
        <PreviewField
          label={formatMessage('communications.mediaHouse.frequencyOrChannel')}
          value={h.frequencyOrChannel}
        />
        <PreviewField
          label={formatMessage('communications.mediaHouse.primaryContact')}
          value={primary}
          sub={h.primaryContact?.role
            ? formatMessage(`communications.journalistRole.${h.primaryContact.role}`) : null}
        />
        <PreviewField label={formatMessage('communications.mediaHouse.address')} value={h.address} />
        <PreviewField
          label={formatMessage('communications.mediaHouse.quality')}
          value={quality}
          sub={h.coverageCount ? `${h.coverageCount} ${formatMessage('communications.mediaHouse.ratedCoverage')}` : null}
        />
      </div>
      {h.notes && (
        <div style={{ marginTop: 22 }}>
          <PreviewSection label={formatMessage('communications.notes')}>
            <PreviewText className={classes.notes} moreLabel={formatMessage('communications.readMore')} lessLabel={formatMessage('communications.readLess')}>{h.notes}</PreviewText>
          </PreviewSection>
        </div>
      )}
    </PreviewDialog>
  );
}

export default MediaHousePreviewDialog;
