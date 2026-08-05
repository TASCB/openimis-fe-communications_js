export const MODULE_NAME = 'communications';

// rights (match openimis-be-communications_py apps.py)
export const RIGHT_ACTIVITY_SEARCH = 220101;
export const RIGHT_ACTIVITY_CREATE = 220102;
export const RIGHT_ACTIVITY_UPDATE = 220103;
export const RIGHT_ACTIVITY_DELETE = 220104;
export const RIGHT_ACTIVITY_APPROVE = 220110;
export const RIGHT_CHANNEL_SEARCH = 220301;
export const RIGHT_DISPATCH = 220305;
export const RIGHT_ACTIVITY_CHANNEL_MANAGE = 220402;
export const RIGHT_OBJECTIVE_MANAGE = 220502;
export const RIGHT_ASSIGNMENT_MANAGE = 220602;
export const RIGHT_ATTACHMENT_SEARCH = 220701;
export const RIGHT_ATTACHMENT_UPLOAD = 220702;
export const RIGHT_FEEDBACK_MANAGE = 220802;
export const RIGHT_TEMPLATE_SEARCH = 220901;
export const RIGHT_TEMPLATE_MANAGE = 220902;
export const RIGHT_STAKEHOLDER_SEARCH = 221001;
export const RIGHT_STAKEHOLDER_MANAGE = 221002;
export const RIGHT_LIBRARY_SEARCH = 221101;
export const RIGHT_LIBRARY_UPLOAD = 221102;
export const RIGHT_DASHBOARD_VIEW = 221201;
export const RIGHT_STAKEHOLDER_TYPE_SEARCH = 221301;
export const RIGHT_STAKEHOLDER_TYPE_MANAGE = 221302;
export const RIGHT_AUDIENCE_MANAGE = 221402;
export const RIGHT_POST_SEARCH = 221501;
export const RIGHT_POST_MANAGE = 221502;
export const RIGHT_POST_PUBLISH = 221505;

export const COMMS_ROUTE_ACTIVITIES = 'communications.route.activities';
export const COMMS_ROUTE_ACTIVITY = 'communications.route.activity';
export const COMMS_ROUTE_FEED = 'communications.route.feed';
export const COMMS_ROUTE_CALENDAR = 'communications.route.calendar';
export const COMMS_ROUTE_DASHBOARD = 'communications.route.dashboard';
export const COMMS_ROUTE_LIBRARY = 'communications.route.library';

export const DEFAULT_DEBOUNCE_TIME = 500;
export const DEFAULT_PAGE_SIZE = 10;
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const CONTAINS_LOOKUP = 'Icontains';
export const EMPTY_STRING = '';
export const PICKER_LIMIT = 50;

export const ACTIVITY_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
  CANCELLED: 'CANCELLED',
};
export const ACTIVITY_STATUS_LIST = Object.values(ACTIVITY_STATUS);

export const STATUS_COLORS = {
  DRAFT: '#9e9e9e',
  SUBMITTED: '#1976d2',
  APPROVED: '#0288d1',
  REJECTED: '#d32f2f',
  SCHEDULED: '#7b1fa2',
  ONGOING: '#ed6c02',
  COMPLETED: '#2e7d32',
  CLOSED: '#455a64',
  ARCHIVED: '#5d4037',
  CANCELLED: '#c62828',
};

export const ACTIVITY_TYPE_LIST = [
  'MEDIA_MISSION', 'PRESS_RELEASE', 'PRESS_CONFERENCE',
  'IMPACT_CASE_STUDY', 'NEWSLETTER', 'ANNUAL_REPORT',
  'COMMUNITY_AWARENESS', 'STAKEHOLDER_BRIEFING', 'OTHER',
];
export const CHANNEL_TYPE_LIST = [
  'EMAIL', 'SMS', 'SOCIAL', 'RADIO', 'TV', 'PRINT', 'WEB', 'EVENT', 'OTHER',
];
export const DISPATCH_STATUS_LIST = ['PENDING', 'QUEUED', 'SENT', 'FAILED', 'SKIPPED'];
export const ASSIGNMENT_ROLE_LIST = ['OWNER', 'CONTRIBUTOR', 'REVIEWER', 'APPROVER', 'SUPPORT'];
export const ASSIGNMENT_STATUS_LIST = ['ASSIGNED', 'CONFIRMED', 'DECLINED', 'REPLACED'];
export const STAKEHOLDER_LEVEL_LIST = ['NATIONAL', 'REGIONAL', 'PAA', 'COMMUNITY', 'OTHER'];
export const ASSET_TYPE_LIST = ['TEMPLATE', 'BRAND', 'IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER'];
export const POST_TYPE_LIST = ['ANNOUNCEMENT', 'UPDATE', 'MEDIA_HIGHLIGHT', 'NEWSLETTER'];

// status -> available workflow actions (action + required right)
export const STATUS_ACTIONS = {
  DRAFT: [{ action: 'submit', right: RIGHT_ACTIVITY_UPDATE }, { action: 'cancel', right: RIGHT_ACTIVITY_UPDATE }],
  SUBMITTED: [{ action: 'approve', right: RIGHT_ACTIVITY_APPROVE }, { action: 'reject', right: RIGHT_ACTIVITY_APPROVE }],
  REJECTED: [{ action: 'revise', right: RIGHT_ACTIVITY_UPDATE }],
  APPROVED: [{ action: 'schedule', right: RIGHT_ACTIVITY_UPDATE }, { action: 'cancel', right: RIGHT_ACTIVITY_UPDATE }],
  SCHEDULED: [{ action: 'start', right: RIGHT_ACTIVITY_UPDATE }, { action: 'cancel', right: RIGHT_ACTIVITY_UPDATE }],
  ONGOING: [{ action: 'complete', right: RIGHT_ACTIVITY_UPDATE }, { action: 'cancel', right: RIGHT_ACTIVITY_UPDATE }],
  COMPLETED: [{ action: 'close', right: RIGHT_ACTIVITY_UPDATE }],
  CLOSED: [{ action: 'archive', right: RIGHT_ACTIVITY_UPDATE }],
  CANCELLED: [{ action: 'archive', right: RIGHT_ACTIVITY_UPDATE }],
  ARCHIVED: [],
};

export const RIGHT_UNIFIED_CALENDAR_VIEW = 251602;

export const CALENDAR_SOURCE_COLORS = {
  TRAINING: '#00695C',
  COORDINATION: '#1565C0',
  COMMUNICATIONS: '#EF6C00',
};
