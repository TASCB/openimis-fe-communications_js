/* eslint-disable import/prefer-default-export */
import React from 'react';
import {
  Announcement, CalendarToday, Dashboard, DynamicFeed, LibraryBooks,
} from '@material-ui/icons';
import { FormattedMessage } from '@openimis/fe-core';

import messages_en from './translations/en.json';
import reducer from './reducer';
import {
  RIGHT_ACTIVITY_SEARCH, RIGHT_DASHBOARD_VIEW, RIGHT_POST_SEARCH, RIGHT_TEMPLATE_SEARCH,
  COMMS_ROUTE_ACTIVITIES, COMMS_ROUTE_ACTIVITY, COMMS_ROUTE_FEED,
  COMMS_ROUTE_CALENDAR, COMMS_ROUTE_DASHBOARD, COMMS_ROUTE_LIBRARY,
} from './constants';

import ActivitiesPage from './pages/ActivitiesPage';
import ActivityPage from './pages/ActivityPage';
import FeedPage from './pages/FeedPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import ActivityCategoryPicker from './pickers/ActivityCategoryPicker';
import ChannelPicker from './pickers/ChannelPicker';
import StakeholderTypePicker from './pickers/StakeholderTypePicker';

const ROUTE_ACTIVITIES = 'communications/activities';
const ROUTE_ACTIVITY = 'communications/activities/activity';
const ROUTE_FEED = 'communications/feed';
const ROUTE_CALENDAR = 'communications/calendar';
const ROUTE_DASHBOARD = 'communications/dashboard';
const ROUTE_LIBRARY = 'communications/library';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'communications', reducer }],
  refs: [
    { key: COMMS_ROUTE_ACTIVITIES, ref: ROUTE_ACTIVITIES },
    { key: COMMS_ROUTE_ACTIVITY, ref: ROUTE_ACTIVITY },
    { key: COMMS_ROUTE_FEED, ref: ROUTE_FEED },
    { key: COMMS_ROUTE_CALENDAR, ref: ROUTE_CALENDAR },
    { key: COMMS_ROUTE_DASHBOARD, ref: ROUTE_DASHBOARD },
    { key: COMMS_ROUTE_LIBRARY, ref: ROUTE_LIBRARY },
    { key: 'communications.ActivityCategoryPicker', ref: ActivityCategoryPicker },
    { key: 'communications.ChannelPicker', ref: ChannelPicker },
    { key: 'communications.StakeholderTypePicker', ref: StakeholderTypePicker },
  ],
  'core.Router': [
    { path: ROUTE_ACTIVITIES, component: ActivitiesPage },
    { path: `${ROUTE_ACTIVITY}/:activity_uuid?`, component: ActivityPage },
    { path: ROUTE_FEED, component: FeedPage },
    { path: ROUTE_CALENDAR, component: CalendarPage },
    { path: ROUTE_DASHBOARD, component: DashboardPage },
    { path: ROUTE_LIBRARY, component: LibraryPage },
  ],
  'communications.MainMenu': [
    {
      text: <FormattedMessage module="communications" id="communications.menu.activities" />,
      icon: <Announcement />,
      route: `/${ROUTE_ACTIVITIES}`,
      filter: (rights) => rights.includes(RIGHT_ACTIVITY_SEARCH),
      id: 'communications.activities',
    },
    {
      text: <FormattedMessage module="communications" id="communications.menu.feed" />,
      icon: <DynamicFeed />,
      route: `/${ROUTE_FEED}`,
      filter: (rights) => rights.includes(RIGHT_POST_SEARCH),
      id: 'communications.feed',
    },
    {
      text: <FormattedMessage module="communications" id="communications.menu.calendar" />,
      icon: <CalendarToday />,
      route: `/${ROUTE_CALENDAR}`,
      filter: (rights) => rights.includes(RIGHT_DASHBOARD_VIEW),
      id: 'communications.calendar',
    },
    {
      text: <FormattedMessage module="communications" id="communications.menu.dashboard" />,
      icon: <Dashboard />,
      route: `/${ROUTE_DASHBOARD}`,
      filter: (rights) => rights.includes(RIGHT_DASHBOARD_VIEW),
      id: 'communications.dashboard',
    },
    {
      text: <FormattedMessage module="communications" id="communications.menu.library" />,
      icon: <LibraryBooks />,
      route: `/${ROUTE_LIBRARY}`,
      filter: (rights) => rights.includes(RIGHT_TEMPLATE_SEARCH),
      id: 'communications.library',
    },
  ],
};

export const CommunicationsModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
