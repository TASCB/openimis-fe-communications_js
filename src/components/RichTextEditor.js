import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { Tooltip } from '@material-ui/core';
import FormatBold from '@material-ui/icons/FormatBold';
import FormatItalic from '@material-ui/icons/FormatItalic';
import FormatUnderlined from '@material-ui/icons/FormatUnderlined';
import StrikethroughS from '@material-ui/icons/StrikethroughS';
import FormatColorText from '@material-ui/icons/FormatColorText';
import LinkIcon from '@material-ui/icons/Link';
import ImageIcon from '@material-ui/icons/Image';
import FormatAlignLeft from '@material-ui/icons/FormatAlignLeft';
import FormatAlignCenter from '@material-ui/icons/FormatAlignCenter';
import FormatAlignRight from '@material-ui/icons/FormatAlignRight';
import FormatListNumbered from '@material-ui/icons/FormatListNumbered';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import { sanitizeHtml } from './htmlSanitize';

const escapeText = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SWATCHES = ['#152219', '#006273', '#c0392b', '#b7791f', '#1b5e20', '#4f46e5', '#475569', '#ffffff'];

const useStyles = makeStyles((theme) => {
  const teal = theme.palette.primary.main;
  const border = '#e2e8e3';
  const ink = '#152219';
  return {
    wrap: {
      border: `1px solid ${border}`, borderRadius: 10, background: '#f6f9f7', overflow: 'hidden',
      transition: 'border-color .15s, box-shadow .15s',
      '&:focus-within': { borderColor: teal, background: '#fff', boxShadow: `0 0 0 3px ${teal}26` },
    },
    toolbar: {
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
      borderBottom: `1px solid ${border}`, background: '#fff', position: 'relative',
    },
    sep: { width: 1, alignSelf: 'stretch', background: border, margin: '4px 6px' },
    btn: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
      border: 0, borderRadius: 7, background: 'none', color: '#41524a', cursor: 'pointer', padding: 0,
      transition: 'background .12s, color .12s',
      '&:hover': { background: '#eef5f2', color: ink },
      '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${teal}40` },
    },
    blockSelect: {
      height: 32, border: `1px solid ${border}`, borderRadius: 7, background: '#fff', color: ink,
      fontSize: 13.5, fontWeight: 700, padding: '0 8px', cursor: 'pointer', fontFamily: 'inherit',
      '&:focus': { outline: 'none', borderColor: teal },
    },
    palette: {
      position: 'absolute', top: 44, left: 8, zIndex: 5, display: 'flex', gap: 6, padding: 8,
      background: '#fff', border: `1px solid ${border}`, borderRadius: 10, boxShadow: '0 6px 20px rgba(16,42,67,.14)',
    },
    swatch: {
      width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(0,0,0,.15)', cursor: 'pointer', padding: 0,
      '&:hover': { transform: 'scale(1.1)' },
    },
    editorHost: { position: 'relative' },
    editor: {
      minHeight: 120, maxHeight: 420, overflowY: 'auto', padding: '12px 14px', fontSize: 15, lineHeight: 1.6,
      color: ink, outline: 'none',
      '& p': { margin: '0 0 8px' },
      '& h2': { fontSize: 20, fontWeight: 800, margin: '4px 0 8px' },
      '& h3': { fontSize: 17, fontWeight: 800, margin: '4px 0 8px' },
      '& ul, & ol': { margin: '0 0 8px', paddingLeft: 22 },
      '& a': { color: teal, textDecoration: 'underline' },
      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 8, margin: '4px 0' },
    },
    placeholder: { position: 'absolute', top: 12, left: 14, color: '#9aa8a0', fontSize: 15, pointerEvents: 'none' },
  };
});

function hasContent(html) {
  if (!html) return false;
  if (/<img[\s>]/i.test(html)) return true;
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0;
}

export default function RichTextEditor({
  value, onChange, placeholder, onImageUpload, ariaLabel, fm,
}) {
  const classes = useStyles();
  const t = (id, def) => (fm ? fm(id) : def);
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const savedRange = useRef(null);
  const [showPalette, setShowPalette] = useState(false);
  const [empty, setEmpty] = useState(!hasContent(value));

  // Sync external value in only when it differs and the editor isn't being edited.
  useEffect(() => {
    const el = editorRef.current;
    if (el && (value || '') !== el.innerHTML && document.activeElement !== el) {
      el.innerHTML = value || '';
      setEmpty(!hasContent(value));
    }
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    let html = el.innerHTML;
    if (html === '<br>' || html === '<div><br></div>') html = '';
    setEmpty(!hasContent(html));
    onChange(html);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0);
    }
  };
  const restoreSelection = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const exec = (cmd, arg) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };
  // For inline marks/lists/alignment: run in mousedown so the editor keeps its selection.
  const cmdBtn = (cmd, arg, label, Icon) => (
    <Tooltip title={label}>
      <button
        type="button" className={classes.btn} aria-label={label}
        onMouseDown={(e) => { e.preventDefault(); exec(cmd, arg); }}
      >
        <Icon style={{ fontSize: 19 }} />
      </button>
    </Tooltip>
  );

  const onBlock = (e) => {
    const v = e.target.value;
    restoreSelection();
    exec('formatBlock', v);
    e.target.selectedIndex = 0;
  };

  const pickColor = (color) => {
    restoreSelection();
    exec('foreColor', color);
    setShowPalette(false);
  };

  const addLink = () => {
    saveSelection();
    // eslint-disable-next-line no-alert
    const url = window.prompt(t('communications.editor.linkPrompt', 'Link URL'));
    if (!url) return;
    restoreSelection();
    exec('createLink', url);
  };

  // Strip foreign markup (classes, site CSS) from pasted content; keep basic formatting.
  const onPaste = (e) => {
    const cb = e.clipboardData;
    if (!cb) return;
    const html = cb.getData('text/html');
    const text = cb.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    const clean = html ? sanitizeHtml(html) : escapeText(text).replace(/\r?\n/g, '<br>');
    document.execCommand('insertHTML', false, clean);
    emit();
  };

  const onImageBtn = () => { saveSelection(); fileRef.current?.click(); };
  const onImageFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !onImageUpload) return;
    const url = await onImageUpload(file);
    if (!url) return;
    restoreSelection();
    exec('insertHTML', `<img src="${url}" alt="" />`);
  };

  return (
    <div className={classes.wrap}>
      <div className={classes.toolbar}>
        {/* eslint-disable-next-line jsx-a11y/no-onchange */}
        <select className={classes.blockSelect} defaultValue="" onMouseDown={saveSelection} onChange={onBlock} aria-label={ariaLabel}>
          <option value="" disabled>{t('communications.editor.text', 'Text')}</option>
          <option value="<p>">{t('communications.editor.normal', 'Normal')}</option>
          <option value="<h2>">{t('communications.editor.heading', 'Heading')}</option>
          <option value="<h3>">{t('communications.editor.subheading', 'Subheading')}</option>
        </select>
        <span className={classes.sep} />
        {cmdBtn('bold', null, t('communications.editor.bold', 'Bold'), FormatBold)}
        {cmdBtn('italic', null, t('communications.editor.italic', 'Italic'), FormatItalic)}
        {cmdBtn('underline', null, t('communications.editor.underline', 'Underline'), FormatUnderlined)}
        {cmdBtn('strikeThrough', null, t('communications.editor.strikethrough', 'Strikethrough'), StrikethroughS)}
        <span className={classes.sep} />
        <Tooltip title={t('communications.editor.color', 'Text colour')}>
          <button
            type="button" className={classes.btn} aria-label={t('communications.editor.color', 'Text colour')}
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowPalette((v) => !v); }}
          >
            <FormatColorText style={{ fontSize: 19 }} />
          </button>
        </Tooltip>
        {showPalette && (
          <div className={classes.palette}>
            {SWATCHES.map((c) => (
              <button
                key={c} type="button" className={classes.swatch} style={{ background: c }} aria-label={c}
                onMouseDown={(e) => { e.preventDefault(); pickColor(c); }}
              />
            ))}
          </div>
        )}
        <span className={classes.sep} />
        <Tooltip title={t('communications.editor.link', 'Insert link')}>
          <button type="button" className={classes.btn} aria-label={t('communications.editor.link', 'Insert link')} onMouseDown={(e) => { e.preventDefault(); addLink(); }}>
            <LinkIcon style={{ fontSize: 19 }} />
          </button>
        </Tooltip>
        {onImageUpload && (
          <Tooltip title={t('communications.editor.image', 'Insert image')}>
            <button type="button" className={classes.btn} aria-label={t('communications.editor.image', 'Insert image')} onMouseDown={(e) => { e.preventDefault(); onImageBtn(); }}>
              <ImageIcon style={{ fontSize: 19 }} />
            </button>
          </Tooltip>
        )}
        <span className={classes.sep} />
        {cmdBtn('justifyLeft', null, t('communications.editor.alignLeft', 'Align left'), FormatAlignLeft)}
        {cmdBtn('justifyCenter', null, t('communications.editor.alignCenter', 'Align centre'), FormatAlignCenter)}
        {cmdBtn('justifyRight', null, t('communications.editor.alignRight', 'Align right'), FormatAlignRight)}
        <span className={classes.sep} />
        {cmdBtn('insertOrderedList', null, t('communications.editor.orderedList', 'Numbered list'), FormatListNumbered)}
        {cmdBtn('insertUnorderedList', null, t('communications.editor.bulletList', 'Bulleted list'), FormatListBulleted)}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
      </div>

      <div className={classes.editorHost}>
        <div
          ref={editorRef}
          className={classes.editor}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          onInput={emit}
          onPaste={onPaste}
          onBlur={saveSelection}
        />
        {empty && placeholder && <div className={classes.placeholder}>{placeholder}</div>}
      </div>
    </div>
  );
}
