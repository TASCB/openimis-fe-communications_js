import React, { useMemo } from 'react';
import { sanitizeHtml } from './htmlSanitize';

// Renders sanitized post-body HTML. Body is sanitized server-side on write (bleach);
// this re-sanitizes on read as defence in depth before dangerouslySetInnerHTML.
export default function RichText({ html, className }) {
  const clean = useMemo(() => sanitizeHtml(html || ''), [html]);
  if (!clean) return null;
  // eslint-disable-next-line react/no-danger
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
