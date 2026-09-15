/* eslint-disable import/prefer-default-export */
import React from 'react';
import {
  Announcement, CalendarToday, Dashboard, DynamicFeed, LibraryBooks, RecordVoiceOver, People,
  Event,
} from '@material-ui/icons';
import { FormattedMessage } from '@openimis/fe-core';

import messages_en from './translations/en.json';
import reducer from './reducer';
import {
  RIGHT_ACTIVITY_SEARCH, RIGHT_DASHBOARD_VIEW, RIGHT_POST_SEARCH, RIGHT_TEMPLATE_SEARCH,
  RIGHT_MEDIA_HOUSE_SEARCH, RIGHT_JOURNALIST_SEARCH,
  COMMS_ROUTE_EVENTS, COMMS_ROUTE_EVENT,
  COMMS_ROUTE_ACTIVITIES, COMMS_ROUTE_ACTIVITY, COMMS_ROUTE_FEED,
  COMMS_ROUTE_CALENDAR, COMMS_ROUTE_DASHBOARD, COMMS_ROUTE_LIBRARY,
  COMMS_ROUTE_MEDIA_HOUSES, COMMS_ROUTE_MEDIA_HOUSE,
  COMMS_ROUTE_JOURNALISTS, COMMS_ROUTE_JOURNALIST,
} from './constants';

import ActivitiesPage from './pages/ActivitiesPage';
import ActivityPage from './pages/ActivityPage';
import FeedPage from './pages/FeedPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import MediaHousesPage from './pages/MediaHousesPage';
import MediaHousePage from './pages/MediaHousePage';
import JournalistsPage from './pages/JournalistsPage';
import JournalistPage from './pages/JournalistPage';
import LoginAnnouncements from './components/LoginAnnouncements';
import ActivityCategoryPicker from './pickers/ActivityCategoryPicker';
import ChannelPicker from './pickers/ChannelPicker';
import StakeholderTypePicker from './pickers/StakeholderTypePicker';
import MediaHousePicker from './pickers/MediaHousePicker';
import MediaHouseCategoryPicker from './pickers/MediaHouseCategoryPicker';
import JournalistPicker from './pickers/JournalistPicker';

const ROUTE_ACTIVITIES = 'communications/activities';
const ROUTE_ACTIVITY = 'communications/activities/activity';
const ROUTE_FEED = 'communications/feed';
const ROUTE_CALENDAR = 'communications/calendar';
const ROUTE_DASHBOARD = 'communications/dashboard';
const ROUTE_LIBRARY = 'communications/library';
const ROUTE_EVENTS = 'communications/events';
const ROUTE_EVENT = 'communications/events/event';
const ROUTE_MEDIA_HOUSES = 'communications/media-houses';
const ROUTE_MEDIA_HOUSE = 'communications/media-houses/media-house';
const ROUTE_JOURNALISTS = 'communications/journalists';
const ROUTE_JOURNALIST = 'communications/journalists/journalist';

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
    { key: COMMS_ROUTE_EVENTS, ref: ROUTE_EVENTS },
    { key: COMMS_ROUTE_EVENT, ref: ROUTE_EVENT },
    { key: COMMS_ROUTE_MEDIA_HOUSES, ref: ROUTE_MEDIA_HOUSES },
    { key: COMMS_ROUTE_MEDIA_HOUSE, ref: ROUTE_MEDIA_HOUSE },
    { key: COMMS_ROUTE_JOURNALISTS, ref: ROUTE_JOURNALISTS },
    { key: COMMS_ROUTE_JOURNALIST, ref: ROUTE_JOURNALIST },
    { key: 'communications.ActivityCategoryPicker', ref: ActivityCategoryPicker },
    { key: 'communications.ChannelPicker', ref: ChannelPicker },
    { key: 'communications.StakeholderTypePicker', ref: StakeholderTypePicker },
    { key: 'communications.MediaHousePicker', ref: MediaHousePicker },
    { key: 'communications.MediaHouseCategoryPicker', ref: MediaHouseCategoryPicker },
    { key: 'communications.JournalistPicker', ref: JournalistPicker },
  ],
  'core.Boot': [LoginAnnouncements],
  'core.Router': [
    { path: ROUTE_ACTIVITIES, component: ActivitiesPage },
    { path: `${ROUTE_ACTIVITY}/:activity_uuid?`, component: ActivityPage },
    { path: ROUTE_FEED, component: FeedPage },
    { path: ROUTE_CALENDAR, component: CalendarPage },
    { path: ROUTE_DASHBOARD, component: DashboardPage },
    { path: ROUTE_LIBRARY, component: LibraryPage },
    { path: `${ROUTE_EVENT}/:activity_uuid?`, component: EventFormPage },
    { path: ROUTE_EVENTS, component: EventsPage },
    { path: ROUTE_MEDIA_HOUSES, component: MediaHousesPage },
    { path: `${ROUTE_MEDIA_HOUSE}/:media_house_uuid?`, component: MediaHousePage },
    { path: ROUTE_JOURNALISTS, component: JournalistsPage },
    { path: `${ROUTE_JOURNALIST}/:journalist_uuid?`, component: JournalistPage },
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
      text: <FormattedMessage module="communications" id="communications.menu.events" />,
      icon: <Event />,
      route: `/${ROUTE_EVENTS}`,
      filter: (rights) => rights.includes(RIGHT_ACTIVITY_SEARCH),
      id: 'communications.events',
    },
    {
      text: <FormattedMessage module="communications" id="communications.menu.mediaHouses" />,
      icon: <RecordVoiceOver />,
      route: `/${ROUTE_MEDIA_HOUSES}`,
      filter: (rights) => rights.includes(RIGHT_MEDIA_HOUSE_SEARCH),
      id: 'communications.mediaHouses',
    },
    {
      text: <FormattedMessage module="communications" id="communications.menu.journalists" />,
      icon: <People />,
      route: `/${ROUTE_JOURNALISTS}`,
      filter: (rights) => rights.includes(RIGHT_JOURNALIST_SEARCH),
      id: 'communications.journalists',
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
