import React from 'react';
import { ConstantBasedPicker } from '@openimis/fe-core';
import {
  ACTIVITY_STATUS_LIST, ACTIVITY_TYPE_LIST, CHANNEL_TYPE_LIST, DISPATCH_STATUS_LIST,
  ASSIGNMENT_ROLE_LIST, ASSIGNMENT_STATUS_LIST, STAKEHOLDER_LEVEL_LIST, ASSET_TYPE_LIST, POST_TYPE_LIST,
} from '../constants';

function makePicker(pickerLabel, constants) {
  return function Picker({
    required, withNull, readOnly, onChange, value, nullLabel, withLabel, label,
  }) {
    return (
      <ConstantBasedPicker
        module="communications"
        label={label || pickerLabel}
        constants={constants}
        required={required}
        withNull={withNull}
        readOnly={readOnly}
        onChange={onChange}
        value={value}
        nullLabel={nullLabel}
        withLabel={withLabel}
      />
    );
  };
}

export const ActivityStatusPicker = makePicker('communications.status', ACTIVITY_STATUS_LIST);
export const ActivityTypePicker = makePicker('communications.activityType', ACTIVITY_TYPE_LIST);
export const ChannelTypePicker = makePicker('communications.channelType', CHANNEL_TYPE_LIST);
export const DispatchStatusPicker = makePicker('communications.dispatchStatus', DISPATCH_STATUS_LIST);
export const AssignmentRolePicker = makePicker('communications.role', ASSIGNMENT_ROLE_LIST);
export const AssignmentStatusPicker = makePicker('communications.assignmentStatus', ASSIGNMENT_STATUS_LIST);
export const StakeholderLevelPicker = makePicker('communications.level', STAKEHOLDER_LEVEL_LIST);
export const AssetTypePicker = makePicker('communications.assetType', ASSET_TYPE_LIST);
export const PostTypePicker = makePicker('communications.postType', POST_TYPE_LIST);
