import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { formatMessage } from '@openimis/fe-core';
import { fetchAnnouncements, dismissAnnouncement } from '../actions';
import LoginAnnouncementModal from './LoginAnnouncementModal';

// Contributed to core.Boot, which fe-core mounts once per session as soon as the
// user is authenticated — the announcement backlog is fetched from there.
function LoginAnnouncements() {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const announcements = useSelector((state) => state.communications?.announcements ?? []);
  const fetching = useSelector((state) => state.communications?.fetchingAnnouncements ?? false);
  const fetched = useSelector((state) => state.communications?.fetchedAnnouncements ?? false);

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, []);

  useEffect(() => {
    if (fetched && announcements.length) setOpen(true);
  }, [fetched]);

  const label = formatMessage(intl, 'communications', 'communications.announcement.read');
  const onDismiss = (postId) => dispatch(dismissAnnouncement(postId, label));

  if (!open) return null;
  return (
    <LoginAnnouncementModal
      announcements={announcements}
      loading={fetching}
      open={open}
      onDismiss={onDismiss}
      onClose={() => setOpen(false)}
      intl={intl}
    />
  );
}

export default LoginAnnouncements;
