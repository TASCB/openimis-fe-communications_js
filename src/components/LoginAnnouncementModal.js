import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, IconButton, Tooltip, CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import VolumeUpOutlined from '@material-ui/icons/VolumeUpOutlined';
import FlashOnOutlined from '@material-ui/icons/FlashOnOutlined';
import PermMediaOutlined from '@material-ui/icons/PermMediaOutlined';
import EmailOutlined from '@material-ui/icons/EmailOutlined';
import { formatMessageWithValues } from '@openimis/fe-core';
import RichText from './RichText';
import { sanitizeHtml } from './htmlSanitize';
import { relTime } from '../utils/dates';

const TYPE_META = {
  ANNOUNCEMENT: { color: '#006273', Icon: VolumeUpOutlined },
  UPDATE: { color: '#b7791f', Icon: FlashOnOutlined },
  MEDIA_HIGHLIGHT: { color: '#4f46e5', Icon: PermMediaOutlined },
  NEWSLETTER: { color: '#475569', Icon: EmailOutlined },
};

const BORDER = '#e2e8e3';
const MUTED = '#5c6e64';
const INK = '#152219';

// Pulls the body's images out so they can be shown beside the text instead of inline.
function splitBody(html) {
  const clean = sanitizeHtml(html || '');
  if (!clean || typeof DOMParser === 'undefined') return { text: clean, images: [] };
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  const root = doc.body.firstChild;
  const images = [];
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) images.push({ src, alt: img.getAttribute('alt') || '' });
    const parent = img.parentElement;
    img.remove();
    if (parent && parent !== root && !parent.textContent.trim() && !parent.querySelector('img')) parent.remove();
  });
  return { text: root.textContent.trim() ? root.innerHTML : '', images };
}

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  return {
    paper: { borderRadius: 14, overflow: 'hidden' },
    titleBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px 14px 24px', borderBottom: `1px solid ${BORDER}`, background: '#eef5f2',
    },
    titleText: { fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: teal },
    content: { padding: 0, '&:first-child': { paddingTop: 0 } },
    loading: { minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' },

    layout: {
      display: 'flex', minHeight: 340,
      [theme.breakpoints.down('sm')]: { flexDirection: 'column' },
    },
    media: {
      flex: '0 0 48%', display: 'flex', flexDirection: 'column', gap: 10, padding: 16,
      background: '#f6f9f7', borderRight: `1px solid ${BORDER}`,
      [theme.breakpoints.down('sm')]: { borderRight: 0, borderBottom: `1px solid ${BORDER}` },
    },
    mainImageWrap: {
      position: 'relative', flex: 1, minHeight: 240, maxHeight: 380, display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: '#fff',
      border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in',
    },
    mainImage: { maxWidth: '100%', maxHeight: 380, objectFit: 'contain', display: 'block' },
    openFull: {
      position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.92)',
      border: `1px solid ${BORDER}`, padding: 6, '&:hover': { background: '#fff' },
    },
    thumbs: { display: 'flex', gap: 8, overflowX: 'auto' },
    thumb: {
      width: 64, height: 48, flex: '0 0 auto', objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
      border: `2px solid ${BORDER}`, background: '#fff',
    },
    thumbActive: { borderColor: teal },

    main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '20px 24px' },
    header: { display: 'flex', gap: 14, alignItems: 'flex-start' },
    typeTile: {
      width: 42, height: 42, borderRadius: 12, flex: '0 0 auto', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#fff',
    },
    headline: { minWidth: 0 },
    postTitle: { margin: 0, fontSize: 19, fontWeight: 800, lineHeight: 1.25, color: INK, wordBreak: 'break-word' },
    metaRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12.5, color: MUTED },
    typeTag: {
      borderRadius: 999, padding: '2px 10px', fontSize: 11.5, fontWeight: 800,
      letterSpacing: 0.3, border: '1px solid currentColor',
    },
    body: {
      marginTop: 16, paddingRight: 6, overflowY: 'auto', flex: 1, maxHeight: '46vh',
      fontSize: 14.5, lineHeight: 1.65, color: INK, wordBreak: 'break-word',
      '& p': { margin: '0 0 10px' },
      '& a': { color: teal },
      '& ul, & ol': { paddingLeft: 22, margin: '0 0 10px' },
    },
    bodyWithMedia: { maxHeight: 300 },

    actions: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', borderTop: `1px solid ${BORDER}`, background: '#fafcfb',
    },
    progress: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: MUTED },
    dots: { display: 'flex', gap: 5 },
    dot: { width: 7, height: 7, borderRadius: '50%', background: '#cbd5cf' },
    dotDone: { background: `${teal}80` },
    dotActive: { background: teal, width: 18, borderRadius: 4 },
    nav: { display: 'flex', alignItems: 'center', gap: 8 },
  };
});

export default function LoginAnnouncementModal({
  announcements = [],
  loading = false,
  open = false,
  onDismiss,
  onClose,
  onOpen,
  intl,
}) {
  const fm = (key, vals) => formatMessageWithValues(intl, 'communications', key, vals);
  const classes = useStyles();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setDismissed(new Set());
    }
  }, [open]);

  useEffect(() => {
    setImageIndex(0);
  }, [currentIndex]);

  const current = announcements[currentIndex];
  const { text, images } = useMemo(() => splitBody(current?.body), [current?.body]);

  if (!current) return null;

  const hasNext = currentIndex < announcements.length - 1;
  const typeMeta = TYPE_META[current.postType] || TYPE_META.ANNOUNCEMENT;
  const TypeIcon = typeMeta.Icon;
  const image = images[imageIndex];
  const openImage = () => image && window.open(image.src, '_blank', 'noopener');

  const markRead = () => {
    if (dismissed.has(current.id)) return;
    if (onDismiss) onDismiss(current.id);
    setDismissed(new Set(dismissed).add(current.id));
  };
  const handleNext = () => {
    markRead();
    setCurrentIndex(currentIndex + 1);
  };
  const handlePrevious = () => setCurrentIndex(currentIndex - 1);
  const handleClose = () => {
    markRead();
    if (onClose) onClose();
  };
  const handleRead = () => {
    handleClose();
    if (onOpen && current.uuid) onOpen(current);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      classes={{ paper: classes.paper }}
    >
      <div className={classes.titleBar}>
        <span className={classes.titleText}>{fm('communications.announcement.title')}</span>
        <IconButton size="small" onClick={handleClose} aria-label={fm('communications.announcement.close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className={classes.content}>
        {loading ? (
          <div className={classes.loading}><CircularProgress size={40} /></div>
        ) : (
          <div className={classes.layout}>
            {image && (
              <div className={classes.media}>
                <div className={classes.mainImageWrap} onClick={openImage} role="presentation">
                  <img src={image.src} alt={image.alt} className={classes.mainImage} />
                  <Tooltip title={fm('communications.announcement.openImage')}>
                    <IconButton
                      size="small"
                      className={classes.openFull}
                      onClick={(e) => { e.stopPropagation(); openImage(); }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
                {images.length > 1 && (
                  <div className={classes.thumbs}>
                    {images.map((img, idx) => (
                      <img
                        key={img.src}
                        src={img.src}
                        alt={img.alt}
                        role="presentation"
                        onClick={() => setImageIndex(idx)}
                        className={`${classes.thumb} ${idx === imageIndex ? classes.thumbActive : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={classes.main}>
              <div className={classes.header}>
                <div className={classes.typeTile} style={{ background: typeMeta.color }}>
                  <TypeIcon fontSize="small" />
                </div>
                <div className={classes.headline}>
                  <h2 className={classes.postTitle}>{current.title}</h2>
                  <div className={classes.metaRow}>
                    <span className={classes.typeTag} style={{ color: typeMeta.color }}>
                      {fm(`communications.postType.${current.postType}`)}
                    </span>
                    <span>{current.userCreated?.username || '—'}</span>
                    <span>·</span>
                    <span>{relTime(current.publishedAt || current.dateCreated)}</span>
                  </div>
                </div>
              </div>
              {text && (
                <RichText html={text} className={`${classes.body} ${image ? classes.bodyWithMedia : ''}`} />
              )}
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions className={classes.actions}>
        <div className={classes.progress}>
          {announcements.length > 1 && (
            <>
              <div className={classes.dots}>
                {announcements.map((a, idx) => (
                  <span
                    key={a.id}
                    className={`${classes.dot} ${idx < currentIndex ? classes.dotDone : ''} ${idx === currentIndex ? classes.dotActive : ''}`}
                  />
                ))}
              </div>
              <span>
                {fm('communications.announcement.progress', { current: currentIndex + 1, total: announcements.length })}
              </span>
            </>
          )}
        </div>
        <div className={classes.nav}>
          {currentIndex > 0 && (
            <Button onClick={handlePrevious} color="primary" variant="outlined" startIcon={<ChevronLeftIcon />}>
              {fm('communications.announcement.previous')}
            </Button>
          )}
          {hasNext ? (
            <Button onClick={handleNext} color="primary" variant="contained" disableElevation endIcon={<ChevronRightIcon />}>
              {fm('communications.announcement.next')}
            </Button>
          ) : (
            <Button onClick={handleRead} color="primary" variant="contained" disableElevation>
              {fm('communications.announcement.read')}
            </Button>
          )}
        </div>
      </DialogActions>
    </Dialog>
  );
}
