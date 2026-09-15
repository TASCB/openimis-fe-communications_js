import React from 'react';
import { Chip } from '@material-ui/core';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { STATUS_CHIP_COLOR } from '../constants';

function ActivityStatusChip({ status }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('communications', modulesManager);
  if (!status) return null;
  return (
    <Chip
      size="small"
      label={formatMessage(`communications.status.${status}`)}
      style={{ backgroundColor: STATUS_CHIP_COLOR, color: '#fff' }}
    />
  );
}
export default ActivityStatusChip;
