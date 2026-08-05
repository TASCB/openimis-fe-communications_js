import {
  graphql, formatMutation, formatPageQueryWithCount, graphqlWithVariables, baseApiUrl,
  decodeId,
} from '@openimis/fe-core';
import { CLEAR, ERROR, REQUEST, SUCCESS } from './utils/action-type';
import { ACTION_TYPE } from './reducer';
import { toISO } from './utils/dates';

const ACTIVITY_LIST_PROJECTION = () => [
  'id', 'code', 'title', 'status', 'activityType', 'startDatetime', 'endDatetime',
  'venue', 'virtualPlatform', 'plannedAudienceCount', 'actualAudienceCount',
  'mediaHousesInvited', 'mediaHousesReported', 'objectiveSummary', 'targetAudience', 'description',
  'category { id code name }', 'location { id code name }',
  'dateCreated', 'dateUpdated', 'userCreated { username }', 'userUpdated { username }', 'version',
];

const ACTIVITY_CHANNEL_PROJECTION = () => [
  'id', 'target', 'dispatchStatus', 'sentAt', 'channel { id code name channelType }', 'activity { id }',
];
const OBJECTIVE_PROJECTION = () => ['id', 'description', 'indicator', 'unit', 'targetValue', 'achievedValue'];
const AUDIENCE_PROJECTION = () => ['id', 'plannedCount', 'actualCount', 'notes', 'stakeholderType { id code name level }'];
const ASSIGNMENT_PROJECTION = () => ['id', 'role', 'status', 'notes', 'staffUser { id username }'];
const ATTACHMENT_PROJECTION = () => ['id', 'fileName', 'fileType', 'description', 'fileUrl', 'dateCreated', 'userCreated { username }'];
const FEEDBACK_PROJECTION = () => ['id', 'source', 'respondent', 'rating', 'comment', 'channel { id name }'];
const TEMPLATE_PROJECTION = () => ['id', 'code', 'name', 'channelType', 'subject', 'body', 'isActive'];
const STAKEHOLDER_LIST_PROJECTION = () => ['id', 'code', 'name', 'description', 'isActive'];
const LIBRARY_PROJECTION = () => ['id', 'code', 'name', 'assetType', 'fileName', 'fileType', 'fileUrl', 'description', 'isActive'];
const POST_ATTACHMENT_PROJECTION = () => ['id', 'uuid', 'fileName', 'fileType', 'fileSize', 'description', 'dateCreated', 'userCreated { username }'];
const POST_PROJECTION = () => [
  'id', 'title', 'body', 'postType', 'isPublished', 'isPinned', 'publishedAt',
  'dateCreated', 'userCreated { username }', 'activity { id code title }',
  `attachments { ${POST_ATTACHMENT_PROJECTION().join(' ')} }`,
];

// JSON.stringify emits a correctly-escaped GraphQL string literal (quotes, backslashes,
// newlines). fe-core's formatGQLString double-escapes quotes (\\") and breaks rich-HTML bodies.
const str = (k, v) => (v !== undefined && v !== null && v !== '' ? `${k}: ${JSON.stringify(String(v))}` : '');
const raw = (k, v) => (v !== undefined && v !== null && v !== '' ? `${k}: ${v}` : '');
const list = (k, v) => (Array.isArray(v) && v.length ? `${k}: [${v.map((x) => `"${x}"`).join(',')}]` : '');

export const decId = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v);
  if (/^\d+$/.test(s)) return s;
  if (/^[0-9a-f-]{36}$/i.test(s)) return s;
  try { return decodeId(s); } catch (e) { return s; }
};

export const encId = (typeName, v) => {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v);
  if (/^[0-9a-f-]{36}$/i.test(s)) return btoa(`${typeName}:${s}`);
  return s;
};

const graphqlMutation = (payload, type, meta) => graphql(
  payload,
  [REQUEST(ACTION_TYPE.MUTATION), SUCCESS(type), ERROR(ACTION_TYPE.MUTATION)],
  meta,
);

// ---- Activities -----------------------------------------------------------
export function fetchActivities(modulesManager, params) {
  const payload = formatPageQueryWithCount('communicationActivity', params, ACTIVITY_LIST_PROJECTION());
  return graphql(payload, ACTION_TYPE.SEARCH_ACTIVITIES, { gqlField: 'communicationActivity' });
}
export function fetchActivity(modulesManager, params) {
  const payload = formatPageQueryWithCount('communicationActivity', params, ACTIVITY_LIST_PROJECTION());
  return graphql(payload, ACTION_TYPE.GET_ACTIVITY);
}
export const clearActivity = () => (dispatch) => dispatch({ type: CLEAR(ACTION_TYPE.GET_ACTIVITY) });

function formatActivityGQL(a, includeCode = true) {
  return [
    str('id', a?.id),
    includeCode ? str('code', a?.code) : null,
    str('title', a?.title),
    str('description', a?.description),
    str('objectiveSummary', a?.objectiveSummary),
    str('categoryId', decId(a?.categoryId ?? a?.category?.id)),
    raw('activityType', a?.activityType),
    str('startDatetime', toISO(a?.startDatetime)),
    str('endDatetime', toISO(a?.endDatetime, true)),
    str('venue', a?.venue),
    str('virtualPlatform', a?.virtualPlatform),
    raw('locationId', decId(a?.locationId ?? a?.location?.id)),
    str('targetAudience', a?.targetAudience),
    raw('plannedAudienceCount', a?.plannedAudienceCount),
    raw('actualAudienceCount', a?.actualAudienceCount),
    raw('mediaHousesInvited', a?.mediaHousesInvited),
    raw('mediaHousesReported', a?.mediaHousesReported),
    raw('status', a?.status),
  ].filter(Boolean).join('\n');
}

export function createActivity(a, label) {
  const m = formatMutation('createCommunicationActivity', formatActivityGQL(a, false), label);
  return graphqlMutation(m.payload, ACTION_TYPE.CREATE_ACTIVITY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, requestedDateTime: new Date() });
}
export function updateActivity(a, label) {
  const m = formatMutation('updateCommunicationActivity', formatActivityGQL(a, true), label);
  return graphqlMutation(m.payload, ACTION_TYPE.UPDATE_ACTIVITY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, requestedDateTime: new Date() });
}
export function deleteActivity(a, label) {
  const m = formatMutation('deleteCommunicationActivity', list('ids', [a.id]), label);
  return graphqlMutation(m.payload, ACTION_TYPE.DELETE_ACTIVITY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, requestedDateTime: new Date() });
}
export function transitionActivity(action, a, label, reason = null) {
  const serviceName = `${action}Activity`;
  const input = [str('id', a.id), str('reason', reason)].filter(Boolean).join('\n');
  const m = formatMutation(serviceName, input, label);
  return graphqlMutation(m.payload, ACTION_TYPE.TRANSITION_ACTIVITY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName, requestedDateTime: new Date() });
}

// ---- reference pickers ----------------------------------------------------
export function fetchCategories(modulesManager, params = ['first: 100', 'isActive: true']) {
  return graphql(formatPageQueryWithCount('activityCategory', params, ['id', 'code', 'name']), ACTION_TYPE.SEARCH_CATEGORIES);
}
export function fetchChannels(modulesManager, params = ['first: 100', 'isActive: true']) {
  return graphql(formatPageQueryWithCount('channel', params, ['id', 'code', 'name', 'channelType']), ACTION_TYPE.SEARCH_CHANNELS);
}
export function fetchStakeholderTypes(modulesManager, params = ['first: 200', 'isActive: true']) {
  return graphql(formatPageQueryWithCount('stakeholderType', params, ['id', 'code', 'name', 'level']), ACTION_TYPE.SEARCH_STAKEHOLDER_TYPES);
}

// ---- generic child collections (per activity) -----------------------------
const childFetch = (field, projection, type, activityId) => graphql(
  formatPageQueryWithCount(field, [`activityId: "${encId('CommunicationActivityGQLType', activityId)}"`, 'first: 200'], projection()),
  type,
);
const childSave = (createName, updateName, gql, obj, label) => {
  const serviceName = obj.id ? updateName : createName;
  const m = formatMutation(serviceName, gql(obj), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_CHILD,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName, requestedDateTime: new Date() });
};
const childDelete = (deleteName, item, label) => {
  const m = formatMutation(deleteName, list('ids', [item.id]), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_CHILD,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: deleteName, requestedDateTime: new Date() });
};

export const fetchActivityChannels = (id) => childFetch('activityChannel', ACTIVITY_CHANNEL_PROJECTION, ACTION_TYPE.SEARCH_ACTIVITY_CHANNELS, id);
export const fetchObjectives = (id) => childFetch('activityObjective', OBJECTIVE_PROJECTION, ACTION_TYPE.SEARCH_OBJECTIVES, id);
export const fetchAudiences = (id) => childFetch('activityAudience', AUDIENCE_PROJECTION, ACTION_TYPE.SEARCH_AUDIENCES, id);
export const fetchAssignments = (id) => childFetch('activityAssignment', ASSIGNMENT_PROJECTION, ACTION_TYPE.SEARCH_ASSIGNMENTS, id);
export const fetchAttachments = (id) => childFetch('activityAttachment', ATTACHMENT_PROJECTION, ACTION_TYPE.SEARCH_ATTACHMENTS, id);
export const fetchFeedback = (id) => childFetch('activityFeedback', FEEDBACK_PROJECTION, ACTION_TYPE.SEARCH_FEEDBACK, id);

export const saveActivityChannel = (c, label) => childSave('createActivityChannel', 'updateActivityChannel', (x) => [
  str('id', x?.id), str('activityId', x?.activityId), str('channelId', decId(x?.channelId ?? x?.channel?.id)),
  str('target', x?.target), raw('dispatchStatus', x?.dispatchStatus),
].filter(Boolean).join('\n'), c, label);
export const deleteActivityChannel = (c, label) => childDelete('deleteActivityChannel', c, label);
export const dispatchActivityChannel = (c, label) => {
  const m = formatMutation('dispatchActivityChannel', str('id', c.id), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_CHILD,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'dispatchActivityChannel', requestedDateTime: new Date() });
};

export const saveObjective = (o, label) => childSave('createActivityObjective', 'updateActivityObjective', (x) => [
  str('id', x?.id), str('activityId', x?.activityId), str('description', x?.description), str('indicator', x?.indicator),
  str('unit', x?.unit), raw('targetValue', x?.targetValue), raw('achievedValue', x?.achievedValue),
].filter(Boolean).join('\n'), o, label);
export const deleteObjective = (o, label) => childDelete('deleteActivityObjective', o, label);

export const saveAudience = (a, label) => childSave('createActivityAudience', 'updateActivityAudience', (x) => [
  str('id', x?.id), str('activityId', x?.activityId), str('stakeholderTypeId', decId(x?.stakeholderTypeId ?? x?.stakeholderType?.id)),
  raw('plannedCount', x?.plannedCount), raw('actualCount', x?.actualCount), str('notes', x?.notes),
].filter(Boolean).join('\n'), a, label);
export const deleteAudience = (a, label) => childDelete('deleteActivityAudience', a, label);

export const saveAssignment = (a, label) => childSave('createActivityAssignment', 'updateActivityAssignment', (x) => [
  str('id', x?.id), str('activityId', x?.activityId), str('staffUserId', decId(x?.staffUserId ?? x?.staffUser?.id)),
  raw('role', x?.role), raw('status', x?.status), str('notes', x?.notes),
].filter(Boolean).join('\n'), a, label);
export const deleteAssignment = (a, label) => childDelete('deleteActivityAssignment', a, label);

export const saveFeedback = (f, label) => childSave('createActivityFeedback', 'updateActivityFeedback', (x) => [
  str('id', x?.id), str('activityId', x?.activityId), str('channelId', decId(x?.channelId ?? x?.channel?.id)),
  str('source', x?.source), str('respondent', x?.respondent), raw('rating', x?.rating), str('comment', x?.comment),
].filter(Boolean).join('\n'), f, label);
export const deleteFeedback = (f, label) => childDelete('deleteActivityFeedback', f, label);

export const deleteAttachment = (a, label) => childDelete('deleteActivityAttachment', a, label);
function uploadFile(path, form) {
  return fetch(`${baseApiUrl}${path}`, { method: 'POST', body: form, credentials: 'include' }).then((r) => r.json());
}
export function uploadAttachment({ activityId, file, description }) {
  const f = new FormData();
  f.append('activity_id', activityId); f.append('file', file);
  if (description) f.append('description', description);
  return uploadFile('/communications/attachments/upload/', f);
}

// ---- feed post attachments (binary upload via DRF; delete via GraphQL) -----
export function uploadPostAttachment({ postId, file, description }) {
  const f = new FormData();
  f.append('post_id', postId); f.append('file', file);
  if (description) f.append('description', description);
  return uploadFile('/communications/post-attachments/upload/', f);
}
// Inline image embedded in the post body (no post_id — uploaded while composing).
export function uploadPostInlineImage({ file }) {
  const f = new FormData();
  f.append('is_inline', '1'); f.append('file', file);
  return uploadFile('/communications/post-attachments/upload/', f);
}
export const deletePostAttachment = (a, label) => childDelete('deleteCommunicationPostAttachment', a, label);

// ---- internal feed (posts) ------------------------------------------------
export function fetchPosts(modulesManager, params) {
  return graphql(formatPageQueryWithCount('communicationPost', params, POST_PROJECTION()),
    ACTION_TYPE.SEARCH_POSTS, { gqlField: 'communicationPost' });
}
export function savePost(p, label) {
  const serviceName = p.id ? 'updateCommunicationPost' : 'createCommunicationPost';
  const gql = [
    str('id', p?.id), str('title', p?.title), str('body', p?.body), raw('postType', p?.postType),
    str('activityId', decId(p?.activityId ?? p?.activity?.id)), raw('isPinned', p?.isPinned),
  ].filter(Boolean).join('\n');
  const m = formatMutation(serviceName, gql, label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_POST,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName, requestedDateTime: new Date() });
}
export function deletePost(p, label) {
  const m = formatMutation('deleteCommunicationPost', list('ids', [p.id]), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_POST,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'deleteCommunicationPost', requestedDateTime: new Date() });
}
export function setPostPublished(p, published, label) {
  const serviceName = published ? 'publishCommunicationPost' : 'unpublishCommunicationPost';
  const m = formatMutation(serviceName, str('id', p.id), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_POST,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName, requestedDateTime: new Date() });
}

// ---- library: templates / stakeholder lists / assets ----------------------
export function fetchTemplates(modulesManager, params) {
  return graphql(formatPageQueryWithCount('communicationTemplate', params, TEMPLATE_PROJECTION()),
    ACTION_TYPE.SEARCH_TEMPLATES, { gqlField: 'communicationTemplate' });
}
export function saveTemplate(t, label) {
  const serviceName = t.id ? 'updateCommunicationTemplate' : 'createCommunicationTemplate';
  const gql = [
    str('id', t?.id), str('code', t?.code), str('name', t?.name), raw('channelType', t?.channelType),
    str('subject', t?.subject), str('body', t?.body), raw('isActive', t?.isActive),
  ].filter(Boolean).join('\n');
  const m = formatMutation(serviceName, gql, label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_LIBRARY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName, requestedDateTime: new Date() });
}
export function deleteTemplate(t, label) {
  const m = formatMutation('deleteCommunicationTemplate', list('ids', [t.id]), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_LIBRARY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'deleteCommunicationTemplate', requestedDateTime: new Date() });
}
export function fetchStakeholderLists(modulesManager, params) {
  return graphql(formatPageQueryWithCount('stakeholderList', params, STAKEHOLDER_LIST_PROJECTION()),
    ACTION_TYPE.SEARCH_STAKEHOLDER_LISTS, { gqlField: 'stakeholderList' });
}
export function saveStakeholderList(s, label) {
  const serviceName = s.id ? 'updateStakeholderList' : 'createStakeholderList';
  const gql = [str('id', s?.id), str('code', s?.code), str('name', s?.name), str('description', s?.description), raw('isActive', s?.isActive)].filter(Boolean).join('\n');
  const m = formatMutation(serviceName, gql, label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_LIBRARY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName, requestedDateTime: new Date() });
}
export function deleteStakeholderList(s, label) {
  const m = formatMutation('deleteStakeholderList', list('ids', [s.id]), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_LIBRARY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'deleteStakeholderList', requestedDateTime: new Date() });
}
export function fetchLibraryAssets(modulesManager, params) {
  return graphql(formatPageQueryWithCount('libraryAsset', params, LIBRARY_PROJECTION()),
    ACTION_TYPE.SEARCH_LIBRARY_ASSETS, { gqlField: 'libraryAsset' });
}
export function deleteLibraryAsset(a, label) {
  const m = formatMutation('deleteLibraryAsset', list('ids', [a.id]), label);
  return graphqlMutation(m.payload, ACTION_TYPE.MANAGE_LIBRARY,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'deleteLibraryAsset', requestedDateTime: new Date() });
}
export function uploadLibraryAsset({
  code, name, assetType, file, description,
}) {
  const f = new FormData();
  f.append('code', code); f.append('name', name); f.append('file', file);
  if (assetType) f.append('asset_type', assetType);
  if (description) f.append('description', description);
  return uploadFile('/communications/library/upload/', f);
}

// ---- dashboard / calendar / conflicts -------------------------------------
export function fetchSummary(variables = {}) {
  return graphqlWithVariables(
    `query ($dateFrom: DateTime, $dateTo: DateTime, $locationId: Int) {
      activitySummary(dateFrom: $dateFrom, dateTo: $dateTo, locationId: $locationId) {
        totalActivities activitiesThisWeek upcomingActivities ongoingActivities completedActivities cancelledActivities
        plannedAudienceTotal actualAudienceTotal mediaHousesInvited mediaHousesReported
        byStatus { status count } byType { activityType count }
        byCategory { categoryId categoryName count } byChannel { channelType count }
        reachByLevel { level planned actual }
      }
    }`, variables, ACTION_TYPE.GET_SUMMARY,
  );
}
export function fetchUnifiedCalendar(variables) {
  return graphqlWithVariables(
    `query ($dateFrom: DateTime!, $dateTo: DateTime!, $status: String, $sources: [String]) {
      coordinationUnifiedCalendar(dateFrom: $dateFrom, dateTo: $dateTo, status: $status, sources: $sources) {
        id code title status startDatetime endDatetime source department
      }
    }`,
    variables,
    ACTION_TYPE.GET_UNIFIED_CALENDAR,
  );
}

export function fetchCalendar(variables) {
  return graphqlWithVariables(
    `query ($dateFrom: DateTime!, $dateTo: DateTime!, $status: String, $categoryId: UUID, $locationId: Int) {
      activityCalendar(dateFrom: $dateFrom, dateTo: $dateTo, status: $status, categoryId: $categoryId, locationId: $locationId) {
        id code title status startDatetime endDatetime venue activityType
      }
    }`, variables, ACTION_TYPE.GET_CALENDAR,
  );
}
export function fetchConflicts(variables) {
  return graphqlWithVariables(
    `query ($startDatetime: DateTime!, $endDatetime: DateTime!, $activityId: UUID, $locationId: Int, $staffUserIds: [UUID]) {
      activityConflicts(startDatetime: $startDatetime, endDatetime: $endDatetime, activityId: $activityId, locationId: $locationId, staffUserIds: $staffUserIds) {
        type hard message conflictingActivityCode subjectLabel
      }
    }`, variables, ACTION_TYPE.GET_CONFLICTS,
  );
}
export const clearConflicts = () => (dispatch) => dispatch({ type: CLEAR(ACTION_TYPE.GET_CONFLICTS) });

// Announcements (login modal)
export function fetchAnnouncements(modulesManager) {
  const query = `query { communicationPostsUnread { id title body postType isPublished isPinned publishedAt dateCreated userCreated { username } attachments { id uuid fileName fileType fileSize } } }`;
  return graphql(query, ACTION_TYPE.SEARCH_ANNOUNCEMENTS, { gqlField: 'communicationPostsUnread' });
}

export function dismissAnnouncement(postId, label) {
  const m = formatMutation('dismissAnnouncement', str('postId', postId), label);
  return graphqlMutation(m.payload, ACTION_TYPE.DISMISS_ANNOUNCEMENT,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'dismissAnnouncement', requestedDateTime: new Date() });
}

export function submitPostForApproval(postId, label) {
  const m = formatMutation('submitPostForApproval', str('postId', postId), label);
  return graphqlMutation(m.payload, ACTION_TYPE.SUBMIT_POST_FOR_APPROVAL,
    { clientMutationId: m.clientMutationId, clientMutationLabel: label, serviceName: 'submitPostForApproval', requestedDateTime: new Date() });
}
