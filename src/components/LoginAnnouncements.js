import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { formatMessage, useModulesManager } from '@openimis/fe-core';
import { fetchAnnouncements, dismissAnnouncement } from '../actions';
import LoginAnnouncementModal from './LoginAnnouncementModal';
import { COMMS_ROUTE_FEED, RIGHT_POST_SEARCH } from '../constants';

// Contributed to core.Boot, which fe-core mounts once per session as soon as the
// user is authenticated — the announcement backlog is fetched from there.
// core.Boot renders outside the router, so navigation goes through the browser history
// and a popstate event, which BrowserRouter listens to.
function LoginAnnouncements() {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const canOpenFeed = useSelector((state) => (state.core?.user?.i_user?.rights ?? []).includes(RIGHT_POST_SEARCH));
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
  const onOpen = (post) => {
    const path = `${process.env.PUBLIC_URL || ''}/${modulesManager.getRef(COMMS_ROUTE_FEED)}/${post.uuid}`;
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  };

  if (!open) return null;
  return (
    <LoginAnnouncementModal
      announcements={announcements}
      loading={fetching}
      open={open}
      onDismiss={onDismiss}
      onOpen={canOpenFeed ? onOpen : null}
      onClose={() => setOpen(false)}
      intl={intl}
    />
  );
}

export default LoginAnnouncements;
