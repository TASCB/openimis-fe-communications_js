import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import {
  Paper, IconButton, Tooltip, CircularProgress,
} from '@material-ui/core';
import VolumeUpOutlined from '@material-ui/icons/VolumeUpOutlined';
import FlashOnOutlined from '@material-ui/icons/FlashOnOutlined';
import PermMediaOutlined from '@material-ui/icons/PermMediaOutlined';
import EmailOutlined from '@material-ui/icons/EmailOutlined';
import FlagOutlined from '@material-ui/icons/FlagOutlined';
import ScheduleOutlined from '@material-ui/icons/ScheduleOutlined';
import EditOutlined from '@material-ui/icons/EditOutlined';
import ArchiveOutlined from '@material-ui/icons/ArchiveOutlined';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import SearchOutlined from '@material-ui/icons/SearchOutlined';
import PeopleOutline from '@material-ui/icons/PeopleOutline';
import Send from '@material-ui/icons/Send';
import AttachFileOutlined from '@material-ui/icons/AttachFileOutlined';
import VisibilityOutlined from '@material-ui/icons/VisibilityOutlined';
import GetAppOutlined from '@material-ui/icons/GetAppOutlined';
import Close from '@material-ui/icons/Close';
import {
  Helmet, useTranslations, useModulesManager, journalize, ProgressOrError,
  formatMessageWithValues, baseApiUrl,
} from '@openimis/fe-core';
import { MODULE_NAME, RIGHT_POST_MANAGE, RIGHT_POST_PUBLISH } from '../constants';
import {
  fetchPosts, savePost, deletePost, setPostPublished,
  uploadPostAttachment, deletePostAttachment,
} from '../actions';

// Backend PostType enum, styled per design (Alert/Event/General are not backend types).
const TYPES = ['ANNOUNCEMENT', 'UPDATE', 'MEDIA_HIGHLIGHT', 'NEWSLETTER'];
const TYPE_META = {
  ANNOUNCEMENT: { color: '#006273', Icon: VolumeUpOutlined },
  UPDATE: { color: '#b7791f', Icon: FlashOnOutlined },
  MEDIA_HIGHLIGHT: { color: '#4f46e5', Icon: PermMediaOutlined },
  NEWSLETTER: { color: '#475569', Icon: EmailOutlined },
};
// UI-only until post audience support is added to the backend model.
const AUDIENCES = ['allStaff', 'regional', 'ict'];
const MAX_LEN = 1200;
const CLAMP = 3;
const postAttachmentUrl = (att, inline) => `${baseApiUrl}/communications/post-attachments/${att.uuid}/download/${inline ? '?inline=1' : ''}`;

function formatBytes(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
  const b = Number(n);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// A short type badge (PDF / IMG / XLS …) + colour, from the filename extension or MIME type.
function fileKind(name, type) {
  const ext = (name || '').split('.').pop().toLowerCase();
  const t = (type || '').toLowerCase();
  if (t.includes('pdf') || ext === 'pdf') return { label: 'PDF', color: '#d64545' };
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return { label: 'IMG', color: '#0d9488' };
  if (t.includes('sheet') || t.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return { label: 'XLS', color: '#217346' };
  if (t.includes('word') || ['doc', 'docx'].includes(ext)) return { label: 'DOC', color: '#2b579a' };
  if (t.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return { label: 'PPT', color: '#c43e1c' };
  if (['zip', 'rar', '7z', 'gz'].includes(ext)) return { label: 'ZIP', color: '#8a6d3b' };
  return { label: (ext || 'FILE').slice(0, 4).toUpperCase(), color: '#5c6e64' };
}
const isImage = (att) => fileKind(att.fileName, att.fileType).label === 'IMG'
  || (att.fileType || '').toLowerCase().includes('pdf');

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  const border = '#e2e8e3';
  const muted = '#5c6e64';
  const ink = '#152219';
  return {
    page: { ...theme.page, width: '100%' },

    header: { display: 'flex', alignItems: 'flex-start', gap: 16, margin: '4px 0 20px', flexWrap: 'wrap' },
    headerText: { flex: 1, minWidth: 240 },
    eyebrow: { color: teal, fontWeight: 700, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
    h1: { fontSize: 30, fontWeight: 800, color: ink, margin: '4px 0 4px', lineHeight: 1.1 },
    subtitle: { color: muted, fontSize: 14.5, margin: 0 },
    pill: {
      alignSelf: 'center', background: '#fff', border: `1px solid ${border}`, borderRadius: 999,
      padding: '8px 16px', fontSize: 13.5, fontWeight: 700, color: ink, whiteSpace: 'nowrap',
    },

    composer: { border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 24, background: '#fff' },
    composerHead: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#eef5f2', borderBottom: `1px solid ${border}` },
    avatar: {
      width: 38, height: 38, borderRadius: 19, background: teal, color: '#fff', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0,
    },
    composerTitle: { fontWeight: 800, color: ink, fontSize: 15, lineHeight: 1.2 },
    postingAs: { color: muted, fontSize: 13 },
    composerBody: { padding: 20 },
    fieldLabel: { display: 'block', fontSize: 11.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: muted, margin: '0 0 8px' },
    fieldGroup: { marginBottom: 18 },
    filled: {
      width: '100%', background: '#f6f9f7', border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px',
      fontSize: 15, color: ink, fontFamily: 'inherit', transition: 'border-color .15s, box-shadow .15s',
      '&::placeholder': { color: '#9aa8a0' },
      '&:hover': { borderColor: '#c9d4cd' },
      '&:focus': { outline: 'none', borderColor: teal, background: '#fff', boxShadow: `0 0 0 3px ${teal}26` },
    },
    textarea: { resize: 'vertical', minHeight: 92, lineHeight: 1.5 },

    chips: { display: 'flex', flexWrap: 'wrap', gap: 10 },
    chip: {
      display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
      border: `1px solid ${border}`, background: '#fff', color: ink, fontSize: 13.5, fontWeight: 700,
      transition: 'background .15s, color .15s, border-color .15s',
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40` },
    },
    chipIcon: { fontSize: 17 },
    counter: { color: muted, fontSize: 12.5, fontWeight: 600 },
    counterOver: { color: '#c0392b' },

    composerFooter: {
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between',
      padding: '14px 20px', borderTop: `1px solid ${border}`, background: '#fafcfb',
    },
    visibleWrap: { display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${border}`, borderRadius: 10, padding: '6px 12px', background: '#fff' },
    visibleLabel: { color: muted, fontSize: 13 },
    select: { border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: ink, cursor: 'pointer' },
    footerActions: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    editingBanner: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: teal, fontWeight: 700, marginRight: 4 },
    btnGhost: {
      background: '#fff', color: teal, border: `1px solid ${teal}`, borderRadius: 10, padding: '11px 18px',
      fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
      '&:hover': { background: `${teal}0d` },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40` },
    },
    btnPrimary: {
      display: 'inline-flex', alignItems: 'center', gap: 8, background: teal, color: '#fff', border: 0, borderRadius: 10,
      padding: '11px 20px', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
      '&:hover': { background: '#01515f' },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}55` },
      '&:disabled': { background: '#b9c6c0', cursor: 'default' },
    },
    linkBtn: {
      background: 'none', border: 0, color: teal, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
      '&:hover': { textDecoration: 'underline' },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40`, borderRadius: 4 },
    },

    filterBar: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    segment: { display: 'inline-flex', flexWrap: 'wrap', gap: 4, background: '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: 4 },
    segBtn: {
      display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, background: 'none', borderRadius: 9, padding: '8px 14px',
      fontSize: 13.5, fontWeight: 700, color: muted, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s, color .15s',
      '&:hover': { background: '#f0f5f3' },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40` },
    },
    segBtnActive: { background: teal, color: '#fff', '&:hover': { background: teal } },
    segCount: { fontSize: 12, fontWeight: 800, background: 'rgba(0,0,0,.08)', borderRadius: 999, padding: '1px 8px' },
    segCountActive: { background: 'rgba(255,255,255,.25)' },
    search: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: '8px 14px', minWidth: 220, flex: '0 1 320px' },
    searchInput: { border: 'none', outline: 'none', background: 'none', fontSize: 14, flex: 1, color: ink, fontFamily: 'inherit' },

    sectionHead: { display: 'flex', alignItems: 'center', gap: 8, color: muted, fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', margin: '20px 0 12px' },
    empty: { textAlign: 'center', color: muted, padding: '40px 16px', background: '#fff', border: `1px dashed ${border}`, borderRadius: 14 },

    card: { background: '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 2px rgba(16,42,67,.05)' },
    cardTop: { display: 'flex', alignItems: 'flex-start', gap: 12 },
    typeIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardMain: { flex: 1, minWidth: 0 },
    titleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    cardTitle: { fontSize: 17, fontWeight: 800, color: ink, margin: 0 },
    badge: { fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '2px 8px', letterSpacing: 0.3 },
    pinnedBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: teal, background: `${teal}14`, borderRadius: 6, padding: '2px 8px' },
    metaLine: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: muted, fontSize: 13, margin: '6px 0 0' },
    typeTag: { fontWeight: 800, color: ink },
    dot: { color: '#c3cec8' },
    actions: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
    body: { color: '#25322c', fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '12px 0 0' },
    bodyClamp: { display: '-webkit-box', WebkitLineClamp: CLAMP, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    cardFooter: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}`, color: muted, fontSize: 13 },
    footerItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
    delHover: { '&:hover': { color: '#c0392b', background: 'rgba(192,57,43,.08)' } },

    // ---- attachments (composer + card) ----
    attachBtn: {
      display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: teal,
      border: `1px solid ${teal}`, borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 800,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
      '&:hover': { background: `${teal}0d` },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40` },
    },
    staged: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    attachHeader: { display: 'inline-flex', alignItems: 'center', gap: 6, color: muted, fontWeight: 800, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', margin: '16px 0 10px' },
    attachList: { display: 'flex', flexWrap: 'wrap', gap: 10 },
    attachCard: {
      display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${border}`, borderRadius: 10,
      padding: '8px 10px', background: '#fafcfb', maxWidth: 340, minWidth: 220,
    },
    attachBadge: {
      flexShrink: 0, width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
    },
    attachInfo: { minWidth: 0, flex: 1 },
    attachName: { fontWeight: 700, color: ink, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    attachSub: { color: muted, fontSize: 11.5, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
    attachActions: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
  };
});

function relTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (Number.isNaN(diff)) return '';
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const hhmm = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800) return `Yesterday · ${hhmm}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function AttachmentCard({
  classes, fm, att, onDelete,
}) {
  const kind = fileKind(att.fileName, att.fileType);
  const sub = [formatBytes(att.fileSize), kind.label].filter(Boolean).join(' · ');
  return (
    <div className={classes.attachCard}>
      <span className={classes.attachBadge} style={{ background: kind.color }}>{kind.label}</span>
      <div className={classes.attachInfo}>
        <div className={classes.attachName} title={att.fileName}>{att.fileName}</div>
        <div className={classes.attachSub}>{sub}</div>
      </div>
      <div className={classes.attachActions}>
        {isImage(att) && (
          <Tooltip title={fm('communications.attachment.view')}>
            <IconButton size="small" component="a" href={postAttachmentUrl(att, true)} target="_blank" rel="noopener" aria-label={fm('communications.attachment.view')}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={fm('communications.attachment.download')}>
          <IconButton size="small" component="a" href={postAttachmentUrl(att, false)} aria-label={fm('communications.attachment.download')}>
            <GetAppOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        {onDelete && (
          <Tooltip title={fm('communications.attachment.delete')}>
            <IconButton size="small" className={classes.delHover} onClick={() => onDelete(att)} aria-label={fm('communications.attachment.delete')}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function PostCard({ ctx, post }) {
  const {
    classes, fm, fmv, canManage, canPublish, onPin, onEdit, onArchive, onDelete, onDeleteAttachment,
  } = ctx;
  const attachments = post.attachments || [];
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[post.postType] || TYPE_META.ANNOUNCEMENT;
  const { Icon } = meta;
  const published = post.isPublished;
  const long = (post.body || '').length > 220 || (post.body || '').split('\n').length > CLAMP;

  return (
    <Paper elevation={0} className={classes.card}>
      <div className={classes.cardTop}>
        <span className={classes.typeIcon} style={{ background: `${meta.color}14`, color: meta.color }}>
          <Icon style={{ fontSize: 20 }} />
        </span>
        <div className={classes.cardMain}>
          <div className={classes.titleRow}>
            <h3 className={classes.cardTitle}>{post.title}</h3>
            {post.isPinned && (
              <span className={classes.pinnedBadge}><FlagOutlined style={{ fontSize: 13 }} />{fm('communications.post.pinnedBadge')}</span>
            )}
            <span
              className={classes.badge}
              style={published ? { color: '#1b5e20', background: '#e3f4e6' } : { color: '#475569', background: '#eef1f4' }}
            >
              {fm(published ? 'communications.post.published' : 'communications.post.draft')}
            </span>
          </div>
          <p className={classes.metaLine}>
            <span>{post.userCreated?.username || '—'}</span>
            <span className={classes.dot}>·</span>
            <span>{relTime(post.publishedAt || post.dateCreated)}</span>
            <span className={classes.dot}>·</span>
            <span className={classes.typeTag}>{fm(`communications.postType.${post.postType}`)}</span>
          </p>
        </div>
        {canManage && (
          <div className={classes.actions}>
            {canPublish && (
              <Tooltip title={fm(post.isPinned ? 'communications.action.unpin' : 'communications.action.pin')}>
                <IconButton
                  size="small"
                  aria-label={fm(post.isPinned ? 'communications.action.unpin' : 'communications.action.pin')}
                  onClick={() => onPin(post)}
                  style={post.isPinned ? { color: TYPE_META.ANNOUNCEMENT.color } : undefined}
                >
                  <FlagOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={fm('communications.action.edit')}>
              <IconButton size="small" aria-label={fm('communications.action.edit')} onClick={() => onEdit(post)}><EditOutlined fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title={fm('communications.action.archive')}>
              <IconButton size="small" aria-label={fm('communications.action.archive')} onClick={() => onArchive(post)}><ArchiveOutlined fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title={fm('communications.action.delete')}>
              <IconButton size="small" className={classes.delHover} aria-label={fm('communications.action.delete')} onClick={() => onDelete(post)}><DeleteOutline fontSize="small" /></IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      {post.body && (
        <>
          <div className={`${classes.body} ${!expanded && long ? classes.bodyClamp : ''}`}>{post.body}</div>
          {long && (
            <button type="button" className={classes.linkBtn} style={{ marginTop: 8 }} onClick={() => setExpanded((v) => !v)}>
              {fm(expanded ? 'communications.readLess' : 'communications.readMore')}
            </button>
          )}
        </>
      )}

      {attachments.length > 0 && (
        <>
          <div className={classes.attachHeader}>
            <AttachFileOutlined style={{ fontSize: 13 }} />
            {fmv('communications.post.attachmentCount', { count: attachments.length })}
          </div>
          <div className={classes.attachList}>
            {attachments.map((a) => (
              <AttachmentCard
                key={a.uuid || a.id} classes={classes} fm={fm} att={a}
                onDelete={canManage ? onDeleteAttachment : null}
              />
            ))}
          </div>
        </>
      )}

      <div className={classes.cardFooter}>
        {/* No per-post audience field: "All staff" is the truthful default. View counts omitted (no field). */}
        <span className={classes.footerItem}><PeopleOutline style={{ fontSize: 16 }} />{fm('communications.audience.allStaff')}</span>
      </div>
    </Paper>
  );
}

function FeedPage() {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const fm = (id) => formatMessage(id);
  const fmv = (id, values) => formatMessageWithValues(intl, MODULE_NAME, id, values);

  const user = useSelector((s) => s.core.user);
  const rights = useSelector((s) => s.core.user.i_user.rights ?? []);
  const posts = useSelector((s) => s.communications.posts);
  const fetching = useSelector((s) => s.communications.fetchingPosts);
  const error = useSelector((s) => s.communications.errorPosts);
  const submitting = useSelector((s) => s.communications.submittingMutation);
  const mutation = useSelector((s) => s.communications.mutation);

  const canManage = rights.includes(RIGHT_POST_MANAGE);
  const canPublish = rights.includes(RIGHT_POST_PUBLISH);

  const userName = user?.i_user?.other_names
    ? `${user.i_user.other_names} ${user.i_user.last_name || ''}`.trim()
    : (user?.i_user?.login_name || user?.login_name || 'User');
  const initial = (userName[0] || 'U').toUpperCase();

  const emptyDraft = { id: null, title: '', body: '', postType: 'ANNOUNCEMENT', audience: 'allStaff', files: [] };
  const [draft, setDraft] = useState(emptyDraft);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const prev = useRef();
  const fileInputRef = useRef(null);
  // After a save lands, upload staged files to the resolved post, then publish if requested.
  const pending = useRef(null); // { id?, title, publish, files: [File] }

  const refetch = () => dispatch(fetchPosts(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => {
    if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); }
  }, [submitting]);
  useEffect(() => { prev.current = submitting; });

  // After a create/update lands: upload staged files to the resolved post, then publish it.
  useEffect(() => {
    const intent = pending.current;
    if (!intent || fetching) return;
    const list = posts || [];
    const target = intent.id
      ? list.find((p) => p.id === intent.id)
      : list.filter((p) => p.title === intent.title)
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))[0];
    if (!target) return; // wait until the saved post appears in the refetch
    pending.current = null;
    (async () => {
      const files = intent.files || [];
      for (let i = 0; i < files.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await uploadPostAttachment({ postId: target.id, file: files[i] });
      }
      if (intent.publish && !target.isPublished) {
        dispatch(setPostPublished(target, true, fm('communications.post.publish')));
      } else if (files.length) {
        refetch(); // surface the freshly uploaded attachments
      }
    })();
  }, [posts, fetching]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = draft.title.trim() && draft.body.trim() && draft.body.length <= MAX_LEN;
  const resetDraft = () => setDraft(emptyDraft);

  const saveDraft = () => {
    if (!draft.title.trim()) return;
    const files = draft.files || [];
    if (files.length) pending.current = { id: draft.id, title: draft.title.trim(), publish: false, files };
    dispatch(savePost(draft, fm('communications.post.saveDraft.label')));
    resetDraft();
  };
  const publish = () => {
    if (!valid) return;
    pending.current = {
      id: draft.id, title: draft.title.trim(), publish: true, files: draft.files || [],
    };
    dispatch(savePost(draft, fm('communications.post.add')));
    resetDraft();
  };
  const startEdit = (p) => {
    setDraft({
      id: p.id, title: p.title || '', body: p.body || '', postType: p.postType, audience: 'allStaff', isPinned: p.isPinned, files: [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const addFiles = (list) => {
    const picked = Array.from(list || []);
    if (picked.length) setDraft((d) => ({ ...d, files: [...(d.files || []), ...picked] }));
  };
  const removeStaged = (idx) => setDraft((d) => ({ ...d, files: (d.files || []).filter((_, i) => i !== idx) }));
  const togglePin = (p) => dispatch(savePost(
    { id: p.id, title: p.title, body: p.body, postType: p.postType, isPinned: !p.isPinned },
    fm(p.isPinned ? 'communications.post.unpin.label' : 'communications.post.pin.label'),
  ));
  const del = (p) => dispatch(deletePost(p, fm('communications.post.delete')));
  const delAttachment = (att) => dispatch(deletePostAttachment({ id: att.uuid }, fm('communications.attachment.delete')));
  const archive = () => {};

  const counts = useMemo(() => {
    const list = posts || [];
    const c = { ALL: list.length };
    TYPES.forEach((t) => { c[t] = list.filter((p) => p.postType === t).length; });
    return c;
  }, [posts]);
  const published = (posts || []).filter((p) => p.isPublished).length;
  const drafts = (posts || []).filter((p) => !p.isPublished).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (posts || []).filter((p) => {
      if (filter !== 'ALL' && p.postType !== filter) return false;
      if (q && !(`${p.title} ${p.body || ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, filter, search]);
  const pinned = visible.filter((p) => p.isPinned);
  const recent = visible.filter((p) => !p.isPinned);

  const cardCtx = {
    classes, fm, fmv, canManage, canPublish, onPin: togglePin, onEdit: startEdit, onArchive: archive, onDelete: del, onDeleteAttachment: delAttachment,
  };

  const segments = [['ALL', fm('communications.filter.all')], ...TYPES.map((t) => [t, fm(`communications.postType.${t}`)])];

  return (
    <div className={classes.page}>
      <Helmet title={fm('communications.feed.page.title')} />

      <div className={classes.header}>
        <div className={classes.headerText}>
          <div className={classes.eyebrow}>{fm('communications.feed.eyebrow')}</div>
          <h1 className={classes.h1}>{fm('communications.feed.page.title')}</h1>
          <p className={classes.subtitle}>{fm('communications.feed.subtitle')}</p>
        </div>
        <span className={classes.pill}>{fmv('communications.feed.counts', { published, draft: drafts })}</span>
      </div>

      {canManage && (
        <div className={classes.composer}>
          <div className={classes.composerHead}>
            <span className={classes.avatar}>{initial}</span>
            <div>
              <div className={classes.composerTitle}>{fm('communications.composer.title')}</div>
              <div className={classes.postingAs}>{fmv('communications.composer.postingAs', { name: userName })}</div>
            </div>
          </div>
          <div className={classes.composerBody}>
            <div className={classes.fieldGroup}>
              <label className={classes.fieldLabel} htmlFor="cf-title">{fm('communications.post.title')}</label>
              <input
                id="cf-title" className={classes.filled} value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder={fm('communications.composer.titlePlaceholder')}
              />
            </div>

            <div className={classes.fieldGroup}>
              <span className={classes.fieldLabel}>{fm('communications.postType')}</span>
              <div className={classes.chips} role="radiogroup" aria-label={fm('communications.postType')}>
                {TYPES.map((t) => {
                  const m = TYPE_META[t];
                  const active = draft.postType === t;
                  const M = m.Icon;
                  return (
                    <button
                      key={t} type="button" role="radio" aria-checked={active}
                      className={classes.chip}
                      style={active ? { background: m.color, color: '#fff', borderColor: m.color } : undefined}
                      onClick={() => setDraft({ ...draft, postType: t })}
                    >
                      <M className={classes.chipIcon} style={{ color: active ? '#fff' : m.color }} />
                      {fm(`communications.postType.${t}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={classes.fieldGroup}>
              <label className={classes.fieldLabel} htmlFor="cf-body">{fm('communications.post.body')}</label>
              <textarea
                id="cf-body" className={`${classes.filled} ${classes.textarea}`} value={draft.body} maxLength={MAX_LEN}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder={fm('communications.composer.messagePlaceholder')}
              />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <span className={`${classes.counter} ${draft.body.length > MAX_LEN ? classes.counterOver : ''}`}>
                  {draft.body.length}
                  {' / '}
                  {MAX_LEN}
                </span>
              </div>
            </div>

            <div className={classes.fieldGroup} style={{ marginBottom: 0 }}>
              <span className={classes.fieldLabel}>{fm('communications.composer.attachments')}</span>
              <input
                ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <button type="button" className={classes.attachBtn} onClick={() => fileInputRef.current?.click()}>
                <AttachFileOutlined style={{ fontSize: 17 }} />
                {fm('communications.composer.attachFiles')}
              </button>
              {(draft.files || []).length > 0 && (
                <div className={classes.staged}>
                  {draft.files.map((f, idx) => {
                    const kind = fileKind(f.name, f.type);
                    return (
                      <div className={classes.attachCard} key={`${f.name}-${idx}`}>
                        <span className={classes.attachBadge} style={{ background: kind.color }}>{kind.label}</span>
                        <div className={classes.attachInfo}>
                          <div className={classes.attachName} title={f.name}>{f.name}</div>
                          <div className={classes.attachSub}>{[formatBytes(f.size), kind.label].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div className={classes.attachActions}>
                          <Tooltip title={fm('communications.attachment.remove')}>
                            <IconButton size="small" className={classes.delHover} onClick={() => removeStaged(idx)} aria-label={fm('communications.attachment.remove')}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={classes.composerFooter}>
            {/* Visible-to is UI-only (no backend audience field yet). */}
            <div className={classes.visibleWrap}>
              <PeopleOutline style={{ fontSize: 18, color: '#5c6e64' }} />
              <span className={classes.visibleLabel}>{fm('communications.composer.visibleTo')}</span>
              <select
                className={classes.select} value={draft.audience}
                aria-label={fm('communications.composer.visibleTo')}
                onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
              >
                {AUDIENCES.map((a) => <option key={a} value={a}>{fm(`communications.audience.${a}`)}</option>)}
              </select>
            </div>
            <div className={classes.footerActions}>
              {draft.id && (
                <span className={classes.editingBanner}>
                  <EditOutlined style={{ fontSize: 15 }} />
                  {fm('communications.composer.editingBanner')}
                  <button type="button" className={classes.linkBtn} onClick={resetDraft}>{fm('communications.composer.cancelEdit')}</button>
                </span>
              )}
              <button type="button" className={classes.btnGhost} onClick={saveDraft} disabled={!draft.title.trim()}>
                {fm('communications.composer.saveDraft')}
              </button>
              {canPublish && (
                <button type="button" className={classes.btnPrimary} onClick={publish} disabled={!valid || submitting}>
                  {submitting ? <CircularProgress size={16} style={{ color: '#fff' }} /> : <Send style={{ fontSize: 17 }} />}
                  {fm('communications.post.publish')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={classes.filterBar}>
        <div className={classes.segment} role="tablist" aria-label={fm('communications.filter.all')}>
          {segments.map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key} type="button" role="tab" aria-selected={active}
                className={`${classes.segBtn} ${active ? classes.segBtnActive : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className={`${classes.segCount} ${active ? classes.segCountActive : ''}`}>{counts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <div className={classes.search}>
          <SearchOutlined style={{ fontSize: 18, color: '#5c6e64' }} />
          <input
            className={classes.searchInput} value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={fm('communications.filter.search')} aria-label={fm('communications.filter.search')}
          />
        </div>
      </div>

      <ProgressOrError progress={fetching} error={error} />

      {!fetching && !error && (
        <>
          {pinned.length > 0 && (
            <>
              <div className={classes.sectionHead}><FlagOutlined style={{ fontSize: 15 }} />{fm('communications.section.pinned')}</div>
              {pinned.map((p) => <PostCard key={p.id} ctx={cardCtx} post={p} />)}
            </>
          )}
          {recent.length > 0 && (
            <>
              <div className={classes.sectionHead}><ScheduleOutlined style={{ fontSize: 15 }} />{fm('communications.section.recent')}</div>
              {recent.map((p) => <PostCard key={p.id} ctx={cardCtx} post={p} />)}
            </>
          )}
          {visible.length === 0 && <div className={classes.empty}>{fm('communications.empty')}</div>}
        </>
      )}
    </div>
  );
}

export default FeedPage;
