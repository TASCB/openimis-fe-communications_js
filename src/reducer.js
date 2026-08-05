/* eslint-disable default-param-last */
import {
  dispatchMutationErr, dispatchMutationReq, dispatchMutationResp,
  formatGraphQLError, formatServerError, pageInfo, parseData, decodeId,
} from '@openimis/fe-core';
import {
  CLEAR, ERROR, REQUEST, SUCCESS,
} from './utils/action-type';

export const ACTION_TYPE = {
  MUTATION: 'COMMS_MUTATION',
  SEARCH_ACTIVITIES: 'COMMS_ACTIVITIES',
  GET_ACTIVITY: 'COMMS_ACTIVITY',
  SEARCH_CATEGORIES: 'COMMS_CATEGORIES',
  SEARCH_CHANNELS: 'COMMS_CHANNELS',
  SEARCH_STAKEHOLDER_TYPES: 'COMMS_STAKEHOLDER_TYPES',
  SEARCH_ACTIVITY_CHANNELS: 'COMMS_ACTIVITY_CHANNELS',
  SEARCH_OBJECTIVES: 'COMMS_OBJECTIVES',
  SEARCH_AUDIENCES: 'COMMS_AUDIENCES',
  SEARCH_ASSIGNMENTS: 'COMMS_ASSIGNMENTS',
  SEARCH_ATTACHMENTS: 'COMMS_ATTACHMENTS',
  SEARCH_FEEDBACK: 'COMMS_FEEDBACK',
  SEARCH_TEMPLATES: 'COMMS_TEMPLATES',
  SEARCH_STAKEHOLDER_LISTS: 'COMMS_STAKEHOLDER_LISTS',
  SEARCH_LIBRARY_ASSETS: 'COMMS_LIBRARY_ASSETS',
  SEARCH_POSTS: 'COMMS_POSTS',
  SEARCH_ANNOUNCEMENTS: 'COMMS_ANNOUNCEMENTS',
  DISMISS_ANNOUNCEMENT: 'COMMS_DISMISS_ANNOUNCEMENT',
  SUBMIT_POST_FOR_APPROVAL: 'COMMS_SUBMIT_POST_FOR_APPROVAL',
  GET_SUMMARY: 'COMMS_SUMMARY',
  GET_CALENDAR: 'COMMS_CALENDAR',
  GET_UNIFIED_CALENDAR: 'COMMS_UNIFIED_CALENDAR',
  GET_CONFLICTS: 'COMMS_CONFLICTS',
  CREATE_ACTIVITY: 'COMMS_CREATE_ACTIVITY',
  UPDATE_ACTIVITY: 'COMMS_UPDATE_ACTIVITY',
  DELETE_ACTIVITY: 'COMMS_DELETE_ACTIVITY',
  TRANSITION_ACTIVITY: 'COMMS_TRANSITION_ACTIVITY',
  MANAGE_CHILD: 'COMMS_MANAGE_CHILD',
  MANAGE_POST: 'COMMS_MANAGE_POST',
  MANAGE_LIBRARY: 'COMMS_MANAGE_LIBRARY',
};

const STORE_STATE = {
  submittingMutation: false,
  mutation: {},
  fetchingActivities: false, fetchedActivities: false, errorActivities: null,
  activities: [], activitiesPageInfo: {}, activitiesTotalCount: 0,
  fetchingActivity: false, fetchedActivity: false, activity: null, errorActivity: null,
  categories: [], fetchingCategories: false,
  channels: [], fetchingChannels: false,
  stakeholderTypes: [], fetchingStakeholderTypes: false,
  activityChannels: [], objectives: [], audiences: [], assignments: [], attachments: [], feedback: [],
  templates: [], templatesPageInfo: {}, templatesTotalCount: 0, fetchingTemplates: false, fetchedTemplates: false, errorTemplates: null,
  stakeholderLists: [], stakeholderListsPageInfo: {}, stakeholderListsTotalCount: 0, fetchingStakeholderLists: false, fetchedStakeholderLists: false, errorStakeholderLists: null,
  libraryAssets: [], libraryAssetsPageInfo: {}, libraryAssetsTotalCount: 0, fetchingLibraryAssets: false, fetchedLibraryAssets: false, errorLibraryAssets: null,
  posts: [], postsPageInfo: {}, postsTotalCount: 0, fetchingPosts: false, fetchedPosts: false, errorPosts: null,
  announcements: [], fetchingAnnouncements: false, fetchedAnnouncements: false, errorAnnouncements: null,
  summary: null, fetchingSummary: false, errorSummary: null,
  calendar: [], fetchingCalendar: false, errorCalendar: null,
  conflicts: [], fetchingConflicts: false,
};

const mapList = (payload, key) => parseData(payload.data[key])?.map((x) => ({ ...x, id: decodeId(x.id) }));

function listReducer(state, action, type, key, listName) {
  switch (action.type) {
    case REQUEST(type):
      return {
        ...state, [`fetching${listName}`]: true, [`fetched${listName}`]: false, [key]: [], [`error${listName}`]: null,
      };
    case SUCCESS(type):
      return {
        ...state,
        [`fetching${listName}`]: false,
        [`fetched${listName}`]: true,
        [key]: mapList(action.payload, action.meta?.gqlField ?? key),
        [`${key}PageInfo`]: pageInfo(action.payload.data[action.meta?.gqlField ?? key]),
        [`${key}TotalCount`]: action.payload.data[action.meta?.gqlField ?? key]?.totalCount ?? 0,
        [`error${listName}`]: formatGraphQLError(action.payload),
      };
    case ERROR(type):
      return { ...state, [`fetching${listName}`]: false, [`error${listName}`]: formatServerError(action.payload) };
    default:
      return state;
  }
}

// simple (non-paginated) child list
function childReducer(state, action, type, gqlField, key) {
  switch (action.type) {
    case REQUEST(type):
      return { ...state, [`fetching${key}`]: true };
    case SUCCESS(type):
      return { ...state, [`fetching${key}`]: false, [key]: mapList(action.payload, gqlField) };
    case ERROR(type):
      return { ...state, [`fetching${key}`]: false };
    default:
      return state;
  }
}

function reducer(state = STORE_STATE, action) {
  switch (action.type) {
    case REQUEST(ACTION_TYPE.SEARCH_ACTIVITIES):
    case SUCCESS(ACTION_TYPE.SEARCH_ACTIVITIES):
    case ERROR(ACTION_TYPE.SEARCH_ACTIVITIES):
      return listReducer(state, action, ACTION_TYPE.SEARCH_ACTIVITIES, 'activities', 'Activities');
    case REQUEST(ACTION_TYPE.SEARCH_TEMPLATES):
    case SUCCESS(ACTION_TYPE.SEARCH_TEMPLATES):
    case ERROR(ACTION_TYPE.SEARCH_TEMPLATES):
      return listReducer(state, action, ACTION_TYPE.SEARCH_TEMPLATES, 'templates', 'Templates');
    case REQUEST(ACTION_TYPE.SEARCH_STAKEHOLDER_LISTS):
    case SUCCESS(ACTION_TYPE.SEARCH_STAKEHOLDER_LISTS):
    case ERROR(ACTION_TYPE.SEARCH_STAKEHOLDER_LISTS):
      return listReducer(state, action, ACTION_TYPE.SEARCH_STAKEHOLDER_LISTS, 'stakeholderLists', 'StakeholderLists');
    case REQUEST(ACTION_TYPE.SEARCH_LIBRARY_ASSETS):
    case SUCCESS(ACTION_TYPE.SEARCH_LIBRARY_ASSETS):
    case ERROR(ACTION_TYPE.SEARCH_LIBRARY_ASSETS):
      return listReducer(state, action, ACTION_TYPE.SEARCH_LIBRARY_ASSETS, 'libraryAssets', 'LibraryAssets');
    case REQUEST(ACTION_TYPE.SEARCH_POSTS):
    case SUCCESS(ACTION_TYPE.SEARCH_POSTS):
    case ERROR(ACTION_TYPE.SEARCH_POSTS):
      return listReducer(state, action, ACTION_TYPE.SEARCH_POSTS, 'posts', 'Posts');

    case REQUEST(ACTION_TYPE.GET_ACTIVITY):
      return {
        ...state, fetchingActivity: true, fetchedActivity: false, activity: null, errorActivity: null,
      };
    case SUCCESS(ACTION_TYPE.GET_ACTIVITY):
      return {
        ...state, fetchingActivity: false, fetchedActivity: true,
        activity: mapList(action.payload, 'communicationActivity')?.[0],
        errorActivity: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_ACTIVITY):
      return { ...state, fetchingActivity: false, errorActivity: formatServerError(action.payload) };
    case CLEAR(ACTION_TYPE.GET_ACTIVITY):
      return {
        ...state, fetchingActivity: false, fetchedActivity: false, activity: null, errorActivity: null,
      };

    case REQUEST(ACTION_TYPE.SEARCH_CATEGORIES):
    case SUCCESS(ACTION_TYPE.SEARCH_CATEGORIES):
    case ERROR(ACTION_TYPE.SEARCH_CATEGORIES):
      return childReducer(state, action, action.type, 'activityCategory', 'categories');
    case REQUEST(ACTION_TYPE.SEARCH_CHANNELS):
    case SUCCESS(ACTION_TYPE.SEARCH_CHANNELS):
    case ERROR(ACTION_TYPE.SEARCH_CHANNELS):
      return childReducer(state, action, action.type, 'channel', 'channels');
    case REQUEST(ACTION_TYPE.SEARCH_STAKEHOLDER_TYPES):
    case SUCCESS(ACTION_TYPE.SEARCH_STAKEHOLDER_TYPES):
    case ERROR(ACTION_TYPE.SEARCH_STAKEHOLDER_TYPES):
      return childReducer(state, action, action.type, 'stakeholderType', 'stakeholderTypes');
    case REQUEST(ACTION_TYPE.SEARCH_ACTIVITY_CHANNELS):
    case SUCCESS(ACTION_TYPE.SEARCH_ACTIVITY_CHANNELS):
    case ERROR(ACTION_TYPE.SEARCH_ACTIVITY_CHANNELS):
      return childReducer(state, action, action.type, 'activityChannel', 'activityChannels');
    case REQUEST(ACTION_TYPE.SEARCH_OBJECTIVES):
    case SUCCESS(ACTION_TYPE.SEARCH_OBJECTIVES):
    case ERROR(ACTION_TYPE.SEARCH_OBJECTIVES):
      return childReducer(state, action, action.type, 'activityObjective', 'objectives');
    case REQUEST(ACTION_TYPE.SEARCH_AUDIENCES):
    case SUCCESS(ACTION_TYPE.SEARCH_AUDIENCES):
    case ERROR(ACTION_TYPE.SEARCH_AUDIENCES):
      return childReducer(state, action, action.type, 'activityAudience', 'audiences');
    case REQUEST(ACTION_TYPE.SEARCH_ASSIGNMENTS):
    case SUCCESS(ACTION_TYPE.SEARCH_ASSIGNMENTS):
    case ERROR(ACTION_TYPE.SEARCH_ASSIGNMENTS):
      return childReducer(state, action, action.type, 'activityAssignment', 'assignments');
    case REQUEST(ACTION_TYPE.SEARCH_ATTACHMENTS):
    case SUCCESS(ACTION_TYPE.SEARCH_ATTACHMENTS):
    case ERROR(ACTION_TYPE.SEARCH_ATTACHMENTS):
      return childReducer(state, action, action.type, 'activityAttachment', 'attachments');
    case REQUEST(ACTION_TYPE.SEARCH_FEEDBACK):
    case SUCCESS(ACTION_TYPE.SEARCH_FEEDBACK):
    case ERROR(ACTION_TYPE.SEARCH_FEEDBACK):
      return childReducer(state, action, action.type, 'activityFeedback', 'feedback');

    case REQUEST(ACTION_TYPE.GET_SUMMARY):
      return { ...state, fetchingSummary: true, errorSummary: null };
    case SUCCESS(ACTION_TYPE.GET_SUMMARY):
      return { ...state, fetchingSummary: false, summary: action.payload.data.activitySummary };
    case ERROR(ACTION_TYPE.GET_SUMMARY):
      return { ...state, fetchingSummary: false, errorSummary: formatServerError(action.payload) };

    case REQUEST(ACTION_TYPE.GET_CALENDAR):
      return { ...state, fetchingCalendar: true, errorCalendar: null };
    case SUCCESS(ACTION_TYPE.GET_CALENDAR):
      return {
        ...state, fetchingCalendar: false,
        calendar: (action.payload.data.activityCalendar ?? []).map((x) => ({ ...x, id: decodeId(x.id) })),
      };
    case ERROR(ACTION_TYPE.GET_CALENDAR):
      return { ...state, fetchingCalendar: false, errorCalendar: formatServerError(action.payload) };

    case REQUEST(ACTION_TYPE.GET_UNIFIED_CALENDAR):
      return { ...state, fetchingCalendar: true, errorCalendar: null };
    case SUCCESS(ACTION_TYPE.GET_UNIFIED_CALENDAR):
      // Ids arrive raw (plain String on the unified type), so they must not be decoded.
      return {
        ...state, fetchingCalendar: false,
        calendar: action.payload.data.coordinationUnifiedCalendar ?? [],
      };
    case ERROR(ACTION_TYPE.GET_UNIFIED_CALENDAR):
      return { ...state, fetchingCalendar: false, errorCalendar: formatServerError(action.payload) };

    case REQUEST(ACTION_TYPE.GET_CONFLICTS):
      return { ...state, fetchingConflicts: true };
    case SUCCESS(ACTION_TYPE.GET_CONFLICTS):
      return { ...state, fetchingConflicts: false, conflicts: action.payload.data.activityConflicts ?? [] };
    case ERROR(ACTION_TYPE.GET_CONFLICTS):
    case CLEAR(ACTION_TYPE.GET_CONFLICTS):
      return { ...state, fetchingConflicts: false, conflicts: [] };

    case REQUEST(ACTION_TYPE.SEARCH_ANNOUNCEMENTS):
      return { ...state, fetchingAnnouncements: true, fetchedAnnouncements: false, errorAnnouncements: null };
    case SUCCESS(ACTION_TYPE.SEARCH_ANNOUNCEMENTS):
      return {
        ...state,
        fetchingAnnouncements: false,
        fetchedAnnouncements: true,
        announcements: (action.payload.data?.communicationPostsUnread ?? []).map((x) => ({ ...x, id: decodeId(x.id) })),
        errorAnnouncements: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.SEARCH_ANNOUNCEMENTS):
      return { ...state, fetchingAnnouncements: false, errorAnnouncements: formatServerError(action.payload) };

    case REQUEST(ACTION_TYPE.MUTATION):
      return dispatchMutationReq(state, action);
    case ERROR(ACTION_TYPE.MUTATION):
      return dispatchMutationErr(state, action);
    case SUCCESS(ACTION_TYPE.CREATE_ACTIVITY):
      return dispatchMutationResp(state, 'createCommunicationActivity', action);
    case SUCCESS(ACTION_TYPE.UPDATE_ACTIVITY):
      return dispatchMutationResp(state, 'updateCommunicationActivity', action);
    case SUCCESS(ACTION_TYPE.DELETE_ACTIVITY):
      return dispatchMutationResp(state, 'deleteCommunicationActivity', action);
    case SUCCESS(ACTION_TYPE.TRANSITION_ACTIVITY):
      return dispatchMutationResp(state, action.meta?.serviceName ?? 'transition', action);
    case SUCCESS(ACTION_TYPE.MANAGE_CHILD):
      return dispatchMutationResp(state, action.meta?.serviceName ?? 'child', action);
    case SUCCESS(ACTION_TYPE.MANAGE_POST):
    case SUCCESS(ACTION_TYPE.DISMISS_ANNOUNCEMENT):
    case SUCCESS(ACTION_TYPE.SUBMIT_POST_FOR_APPROVAL):
      return dispatchMutationResp(state, action.meta?.serviceName ?? 'post', action);
    case SUCCESS(ACTION_TYPE.MANAGE_LIBRARY):
      return dispatchMutationResp(state, action.meta?.serviceName ?? 'library', action);
    default:
      return state;
  }
}

export default reducer;
