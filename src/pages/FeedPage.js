import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import {
  Paper, IconButton, Tooltip, CircularProgress, Grid, Button, Divider, Typography,
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
  Helmet, useTranslations, useModulesManager, useHistory, journalize, ProgressOrError,
  formatMessageWithValues, baseApiUrl, TextInput,
} from '@openimis/fe-core';
import {
  MODULE_NAME, RIGHT_POST_MANAGE, RIGHT_POST_PUBLISH, COMMS_ROUTE_FEED,
} from '../constants';
import {
  fetchPosts, savePost, deletePost, setPostPublished,
  uploadPostAttachment, deletePostAttachment, uploadPostInlineImage, submitPostForApproval,
} from '../actions';
import RichTextEditor from '../components/RichTextEditor';
import TemplatePicker from '../components/TemplatePicker';
import { PostTypePicker } from '../pickers/ConstantPickers';
import RichText from '../components/RichText';
import { htmlToText } from '../components/htmlSanitize';
import { parseDate, relTime } from '../utils/dates';

const TYPES = ['ANNOUNCEMENT', 'UPDATE', 'MEDIA_HIGHLIGHT', 'NEWSLETTER'];
const TYPE_ICONS = {
  ANNOUNCEMENT: VolumeUpOutlined,
  UPDATE: FlashOnOutlined,
  MEDIA_HIGHLIGHT: PermMediaOutlined,
  NEWSLETTER: EmailOutlined,
};
const MAX_LEN = 1200;
const STATE_LABELS = {
  published: 'communications.post.published',
  pending: 'communications.approval.status.pending',
  rejected: 'communications.approval.status.rejected',
  draft: 'communications.post.draft',
};
function postState(p) {
  if (p.isPublished) return 'published';
  if (p.approvalStatus === 'PENDING') return 'pending';
  if (p.approvalStatus === 'REJECTED') return 'rejected';
  return 'draft';
}
const postAttachmentUrl = (att, inline) => `${baseApiUrl}/communications/post-attachments/${att.uuid}/download/${inline ? '?inline=1' : ''}`;

function formatBytes(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
  const b = Number(n);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(name, type) {
  const ext = (name || '').split('.').pop().toLowerCase();
  const t = (type || '').toLowerCase();
  if (t.includes('pdf') || ext === 'pdf') return 'PDF';
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'IMG';
  if (t.includes('sheet') || t.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'XLS';
  if (t.includes('word') || ['doc', 'docx'].includes(ext)) return 'DOC';
  if (t.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return 'PPT';
  if (['zip', 'rar', '7z', 'gz'].includes(ext)) return 'ZIP';
  return (ext || 'FILE').slice(0, 4).toUpperCase();
}
const isImage = (att) => fileKind(att.fileName, att.fileType) === 'IMG'
  || (att.fileType || '').toLowerCase().includes('pdf');

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  const border = '#e2e8e3';
  const muted = '#5c6e64';
  const ink = '#152219';
  return {
    page: { ...theme.page, width: '100%' },
    paper: theme.paper.paper,
    tableTitle: theme.table.title,
    item: theme.paper.item,
    composer: { marginBottom: 24 },
    composerFooter: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' },
    fieldCaption: { display: 'block', color: teal, fontSize: '0.75rem', marginBottom: 8 },

    header: { display: 'flex', alignItems: 'flex-start', gap: 16, margin: '4px 0 20px', flexWrap: 'wrap' },
    headerText: { flex: 1, minWidth: 240 },
    h1: { fontSize: 30, fontWeight: 800, color: ink, margin: '4px 0 4px', lineHeight: 1.1 },
    subtitle: { color: muted, fontSize: 14.5, margin: 0 },
    headerAction: { alignSelf: 'center' },

    composerPrompt: {
      flex: 1, textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid rgba(0,0,0,.42)',
      width: '100%', padding: '8px 0', fontSize: 15, color: muted, cursor: 'text', fontFamily: 'inherit',
      '&:hover': { borderBottomColor: ink },
      '&:focus-visible': { outline: 'none', borderBottom: `2px solid ${teal}` },
    },
    templateNote: { color: muted, fontSize: 13, marginTop: 6 },

    counter: { color: muted, fontSize: 12.5, fontWeight: 600 },
    counterOver: { color: '#c0392b' },

    footerHint: { color: muted, fontSize: 13 },
    btnGhost: {
      background: '#fff', color: teal, border: `1px solid ${teal}`, borderRadius: 10, padding: '11px 18px',
      fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
      '&:hover': { background: `${teal}0d` },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40` },
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

    card: { background: '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 2px rgba(16,42,67,.05)', scrollMarginTop: 96 },
    cardFocused: { borderColor: teal, boxShadow: `0 0 0 3px ${teal}33` },
    singleBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16,
      padding: '10px 16px', borderRadius: 10, background: '#eef5f2', border: `1px solid ${border}`, fontSize: 13.5, color: ink,
    },
    cardTop: { display: 'flex', alignItems: 'flex-start', gap: 12 },
    typeIcon: {
      width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: `${teal}14`, color: teal,
    },
    pinActive: { color: teal },
    cardMain: { flex: 1, minWidth: 0 },
    titleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    cardTitle: { fontSize: 17, fontWeight: 800, color: ink, margin: 0 },
    badge: { fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '2px 8px', letterSpacing: 0.3 },
    badge_published: { color: '#1b5e20', background: '#e3f4e6' },
    badge_pending: { color: '#8a5a00', background: '#fef3c7' },
    badge_rejected: { color: theme.palette.error.main, background: '#fdecea' },
    badge_draft: { color: muted, background: '#eef1ef' },
    pinnedBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: teal, background: `${teal}14`, borderRadius: 6, padding: '2px 8px' },
    metaLine: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: muted, fontSize: 13, margin: '6px 0 0' },
    typeTag: { fontWeight: 800, color: ink },
    dot: { color: '#c3cec8' },
    actions: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
    body: {
      color: '#25322c', fontSize: 14.5, lineHeight: 1.6, margin: '12px 0 0',
      '& p': { margin: '0 0 8px' },
      '& h2': { fontSize: 19, fontWeight: 800, margin: '4px 0 8px' },
      '& h3': { fontSize: 16.5, fontWeight: 800, margin: '4px 0 8px' },
      '& ul, & ol': { margin: '0 0 8px', paddingLeft: 22 },
      '& a': { color: teal, textDecoration: 'underline' },
      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 8, margin: '4px 0' },
    },
    bodyClamp: { maxHeight: 132, overflow: 'hidden', maskImage: 'linear-gradient(#000 70%, transparent)', WebkitMaskImage: 'linear-gradient(#000 70%, transparent)' },
    cardFooter: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}`, color: muted, fontSize: 13 },
    footerItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
    delHover: { '&:hover': { color: '#c0392b', background: 'rgba(192,57,43,.08)' } },

    // ---- attachments (composer + card) ----
    staged: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    attachHeader: { display: 'inline-flex', alignItems: 'center', gap: 6, color: muted, fontWeight: 800, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', margin: '16px 0 10px' },
    attachList: { display: 'flex', flexWrap: 'wrap', gap: 10 },
    attachCard: {
      display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${border}`, borderRadius: 10,
      padding: '8px 10px', background: '#fafcfb', maxWidth: 340, minWidth: 220,
    },
    attachBadge: {
      flexShrink: 0, width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${teal}14`, color: teal, fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
    },
    rejection: {
      marginTop: 12, padding: 12, borderRadius: 4, border: `1px solid ${border}`, background: '#fafafa',
    },
    rejectionLabel: { color: theme.palette.error.main, fontWeight: 700, fontSize: 13, marginBottom: 4 },
    rejectionText: { color: ink, fontSize: 14, lineHeight: 1.5 },
    attachInfo: { minWidth: 0, flex: 1 },
    attachName: { fontWeight: 700, color: ink, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    attachSub: { color: muted, fontSize: 11.5, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
    attachActions: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
  };
});

function AttachmentCard({
  classes, fm, att, onDelete,
}) {
  const kind = fileKind(att.fileName, att.fileType);
  const sub = [formatBytes(att.fileSize), kind].filter(Boolean).join(' · ');
  return (
    <div className={classes.attachCard}>
      <span className={classes.attachBadge}>{kind}</span>
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
    classes, fm, fmv, canManage, canPublish, onPin, onEdit, onArchive, onDelete, onDeleteAttachment, onSubmitForApproval,
    focusUuid,
  } = ctx;
  const attachments = post.attachments || [];
  const focused = !!focusUuid && post.uuid === focusUuid;
  const [expanded, setExpanded] = useState(focused);
  const Icon = TYPE_ICONS[post.postType] || TYPE_ICONS.ANNOUNCEMENT;
  const published = post.isPublished;
  const state = postState(post);
  const long = htmlToText(post.body).length > 260 || /<(img|h2|h3|ul|ol)[\s>]/i.test(post.body || '');

  return (
    <Paper elevation={0} id={`post-${post.uuid}`} className={`${classes.card} ${focused ? classes.cardFocused : ''}`}>
      <div className={classes.cardTop}>
        <span className={classes.typeIcon}>
          <Icon style={{ fontSize: 20 }} />
        </span>
        <div className={classes.cardMain}>
          <div className={classes.titleRow}>
            <h3 className={classes.cardTitle}>{post.title}</h3>
            {post.isPinned && (
              <span className={classes.pinnedBadge}><FlagOutlined style={{ fontSize: 13 }} />{fm('communications.post.pinnedBadge')}</span>
            )}
            <Tooltip title={state === 'pending' ? fm('communications.post.pendingApproval') : ''}>
              <span className={`${classes.badge} ${classes[`badge_${state}`]}`}>
                {fm(STATE_LABELS[state])}
              </span>
            </Tooltip>
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
                  className={post.isPinned ? classes.pinActive : undefined}
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

      {post.rejectionReason && (
        <div className={classes.rejection}>
          <div className={classes.rejectionLabel}>
            {fm('communications.post.rejectionReason')}
          </div>
          <div className={classes.rejectionText}>
            {post.rejectionReason}
          </div>
        </div>
      )}

      {post.body && (
        <>
          <RichText html={post.body} className={`${classes.body} ${!expanded && long ? classes.bodyClamp : ''}`} />
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
        <span className={classes.footerItem}><PeopleOutline style={{ fontSize: 16 }} />{fm('communications.audience.allStaff')}</span>
        {!published && canManage && !canPublish && onSubmitForApproval && (
          <button type="button" className={classes.btnGhost} onClick={() => onSubmitForApproval(post)}>
            {fm('communications.post.submitForApproval')}
          </button>
        )}
      </div>
    </Paper>
  );
}

function FeedPage({ match }) {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const history = useHistory();
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

  const emptyDraft = { id: null, title: '', body: '', postType: 'ANNOUNCEMENT', files: [] };
  const [draft, setDraft] = useState(emptyDraft);
  const [composerOpen, setComposerOpen] = useState(false);
  const [template, setTemplate] = useState(null);
  const [templateUndo, setTemplateUndo] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const prev = useRef();
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);
  const pending = useRef(null);

  const focusUuid = match?.params?.post_uuid;
  const [singleView, setSingleView] = useState(false);
  const scrolledTo = useRef(null);

  const refetch = () => dispatch(fetchPosts(modulesManager, ['first: 100']));
  useEffect(() => { refetch(); }, []);
  useEffect(() => {
    if (!focusUuid || fetching || !posts) return;
    if (posts.some((p) => p.uuid === focusUuid)) {
      if (scrolledTo.current === focusUuid) return;
      scrolledTo.current = focusUuid;
      setFilter('ALL');
      setSearch('');
      setTimeout(() => {
        const el = document.getElementById(`post-${focusUuid}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } else if (!singleView) {
      setSingleView(true);
      dispatch(fetchPosts(modulesManager, [`id: "${focusUuid}"`]));
    }
  }, [focusUuid, posts, fetching]); // eslint-disable-line react-hooks/exhaustive-deps
  const showAll = () => {
    setSingleView(false);
    history.push(`/${modulesManager.getRef(COMMS_ROUTE_FEED)}`);
    refetch();
  };
  useEffect(() => {
    if (prev.current && !submitting) { dispatch(journalize(mutation)); refetch(); }
  }, [submitting]);
  useEffect(() => { prev.current = submitting; });

  useEffect(() => {
    const intent = pending.current;
    if (!intent || fetching) return;
    const list = posts || [];
    const target = intent.id
      ? list.find((p) => p.id === intent.id)
      : list.filter((p) => p.title === intent.title)
        .sort((a, b) => parseDate(b.dateCreated) - parseDate(a.dateCreated))[0];
    if (!target) return;
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
        refetch();
      }
    })();
  }, [posts, fetching]); // eslint-disable-line react-hooks/exhaustive-deps

  const bodyLen = htmlToText(draft.body).length;
  const hasBody = bodyLen > 0 || /<img[\s>]/i.test(draft.body || '');
  const valid = draft.title.trim() && hasBody && bodyLen <= MAX_LEN;
  const blocker = () => {
    if (!draft.title.trim()) return fm('communications.composer.needTitle');
    if (!canPublish) return null;
    if (!hasBody) return fm('communications.composer.needMessage');
    if (bodyLen > MAX_LEN) return fmv('communications.composer.tooLong', { max: MAX_LEN });
    return null;
  };
  const resetDraft = () => {
    setDraft(emptyDraft);
    setComposerOpen(false);
    setTemplate(null);
    setTemplateUndo(null);
  };
  const hasDraft = !!(draft.title.trim() || hasBody || (draft.files || []).length);
  const open = composerOpen || !!draft.id;
  const openComposer = () => {
    setComposerOpen(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  };
  const applyTemplate = (t) => {
    if (!t) {
      setTemplate(null);
      setTemplateUndo(null);
      return;
    }
    setTemplateUndo({ title: draft.title, body: draft.body });
    setTemplate(t);
    setDraft((d) => ({
      ...d,
      title: d.title.trim() ? d.title : (t.subject || t.name || ''),
      body: htmlToText(d.body || '').length ? d.body : (t.body || ''),
    }));
  };
  const undoTemplate = () => {
    setDraft((d) => ({ ...d, title: templateUndo.title, body: templateUndo.body }));
    setTemplate(null);
    setTemplateUndo(null);
  };

  const uploadInlineImage = async (file) => {
    const res = await uploadPostInlineImage({ file });
    if (res && res.success && res.id) return postAttachmentUrl({ uuid: res.id }, true);
    return null;
  };

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
      id: p.id, title: p.title || '', body: p.body || '', postType: p.postType, isPinned: p.isPinned, files: [],
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
  const submitForApproval = (p) => dispatch(submitPostForApproval(p.id, fm('communications.post.submitForApproval')));
  const archive = () => {};

  const counts = useMemo(() => {
    const list = posts || [];
    const c = { ALL: list.length };
    TYPES.forEach((t) => { c[t] = list.filter((p) => p.postType === t).length; });
    return c;
  }, [posts]);
  const awaiting = (posts || []).filter((p) => postState(p) === 'pending').length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (posts || []).filter((p) => {
      if (filter !== 'ALL' && p.postType !== filter) return false;
      if (pendingOnly && postState(p) !== 'pending') return false;
      if (q && !(`${p.title} ${htmlToText(p.body)}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, filter, search, pendingOnly]);
  const pinned = visible.filter((p) => p.isPinned);
  const recent = visible.filter((p) => !p.isPinned);

  const cardCtx = {
    classes, fm, fmv, canManage, canPublish, onPin: togglePin, onEdit: startEdit, onArchive: archive, onDelete: del, onDeleteAttachment: delAttachment, onSubmitForApproval: submitForApproval,
    focusUuid,
  };

  const segments = [['ALL', fm('communications.filter.all')], ...TYPES.map((t) => [t, fm(`communications.postType.${t}`)])];

  return (
    <div className={classes.page}>
      <Helmet title={fm('communications.feed.page.title')} />

      <div className={classes.header}>
        <div className={classes.headerText}>
          <h1 className={classes.h1}>{fm('communications.feed.page.title')}</h1>
          <p className={classes.subtitle}>{fm('communications.feed.subtitle')}</p>
        </div>
        {(awaiting > 0 || pendingOnly) && (
          <Button
            className={classes.headerAction}
            color="primary"
            variant={pendingOnly ? 'contained' : 'outlined'}
            onClick={() => setPendingOnly((v) => !v)}
            aria-pressed={pendingOnly}
          >
            {fmv('communications.feed.awaitingApproval', { count: awaiting })}
          </Button>
        )}
      </div>

      {canManage && !open && (
        <Paper className={`${classes.paper} ${classes.composer}`}>
          <div className={classes.item}>
            <button type="button" className={classes.composerPrompt} onClick={openComposer}>
              {fm(hasDraft ? 'communications.composer.continue' : 'communications.composer.prompt')}
            </button>
          </div>
        </Paper>
      )}

      {canManage && open && (
        <Paper className={`${classes.paper} ${classes.composer}`}>
          <Grid container className={classes.tableTitle} justifyContent="space-between" alignItems="center">
            <Grid item><Typography>{fm('communications.composer.title')}</Typography></Grid>
            <Grid item><Typography variant="caption">{fmv('communications.composer.postingAs', { name: userName })}</Typography></Grid>
          </Grid>
          <Divider />
          <Grid container className={classes.item}>
            <Grid item xs={12} md={4} className={classes.item}>
              <TemplatePicker value={template} label={fm('communications.composer.fromTemplate')} onChange={applyTemplate} />
              {templateUndo && (
                <div className={classes.templateNote}>
                  {fm('communications.composer.templateApplied')}
                  {' · '}
                  <button type="button" className={classes.linkBtn} onClick={undoTemplate}>{fm('communications.composer.undo')}</button>
                </div>
              )}
            </Grid>
            <Grid item xs={12} md={5} className={classes.item}>
              <TextInput
                module={MODULE_NAME}
                label="communications.post.title"
                required
                inputRef={titleRef}
                value={draft.title}
                placeholder={fm('communications.composer.titlePlaceholder')}
                onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
              />
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <PostTypePicker
                withLabel
                required
                value={draft.postType}
                onChange={(v) => setDraft((d) => ({ ...d, postType: v || 'ANNOUNCEMENT' }))}
              />
            </Grid>
            <Grid item xs={12} className={classes.item}>
              <span className={classes.fieldCaption}>{fm('communications.post.body')}</span>
              <RichTextEditor
                value={draft.body}
                onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
                onImageUpload={uploadInlineImage}
                placeholder={fm('communications.composer.messagePlaceholder')}
                ariaLabel={fm('communications.post.body')}
                fm={fm}
              />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <span className={`${classes.counter} ${bodyLen > MAX_LEN ? classes.counterOver : ''}`}>
                  {bodyLen}
                  {' / '}
                  {MAX_LEN}
                </span>
              </div>
            </Grid>
            <Grid item xs={12} className={classes.item}>
              <span className={classes.fieldCaption}>{fm('communications.composer.attachments')}</span>
              <input
                ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <Button startIcon={<AttachFileOutlined />} onClick={() => fileInputRef.current?.click()}>
                {fm('communications.composer.attachFiles')}
              </Button>
              {(draft.files || []).length > 0 && (
                <div className={classes.staged}>
                  {draft.files.map((f, idx) => {
                    const kind = fileKind(f.name, f.type);
                    return (
                      <div className={classes.attachCard} key={`${f.name}-${idx}`}>
                        <span className={classes.attachBadge}>{kind}</span>
                        <div className={classes.attachInfo}>
                          <div className={classes.attachName} title={f.name}>{f.name}</div>
                          <div className={classes.attachSub}>{[formatBytes(f.size), kind].filter(Boolean).join(' · ')}</div>
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
            </Grid>
          </Grid>
          <Divider />
          <div className={`${classes.item} ${classes.composerFooter}`}>
            {blocker() && <span className={classes.footerHint} role="status">{blocker()}</span>}
            {draft.id && <span className={classes.footerHint}>{fm('communications.composer.editingBanner')}</span>}
            <Button onClick={draft.id ? resetDraft : () => setComposerOpen(false)}>
              {fm(draft.id ? 'communications.composer.cancelEdit' : 'communications.composer.close')}
            </Button>
            <Button onClick={saveDraft} disabled={!draft.title.trim()}>
              {fm('communications.composer.saveDraft')}
            </Button>
            {canPublish && (
              <Button
                variant="contained"
                color="primary"
                onClick={publish}
                disabled={!valid || submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
              >
                {fm('communications.post.publish')}
              </Button>
            )}
          </div>
        </Paper>
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
          {singleView && (
            <div className={classes.singleBar}>
              <span>{fm('communications.feed.singlePost')}</span>
              <button type="button" className={classes.btnGhost} onClick={showAll}>{fm('communications.feed.showAll')}</button>
            </div>
          )}
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
