import React from 'react';
import { Chip } from '@material-ui/core';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { STATUS_COLORS } from '../constants';

function ActivityStatusChip({ status }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  if (!status) return null;
  return (
    <Chip
      size="small"
      label={formatMessage(`communications.status.${status}`)}
      style={{ backgroundColor: STATUS_COLORS[status] || '#9e9e9e', color: '#fff' }}
    />
  );
}
export default ActivityStatusChip;
