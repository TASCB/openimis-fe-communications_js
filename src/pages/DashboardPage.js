import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { Grid, Box } from '@material-ui/core';
import {
  Helmet, useTranslations, useModulesManager, ProgressOrError, useHistory,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';
import { fetchSummary } from '../actions';
import DonutLargeIcon from '@material-ui/icons/DonutLarge';
import CategoryIcon from '@material-ui/icons/Category';
import RecordVoiceOverIcon from '@material-ui/icons/RecordVoiceOver';
import GroupIcon from '@material-ui/icons/Group';
import EditIcon from '@material-ui/icons/Edit';
import SendIcon from '@material-ui/icons/Send';
import CheckIcon from '@material-ui/icons/Check';
import EventIcon from '@material-ui/icons/Event';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import BlockIcon from '@material-ui/icons/Block';
import PeopleIcon from '@material-ui/icons/People';
import VisibilityIcon from '@material-ui/icons/Visibility';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import {
  DashboardHeader, StatCard, SectionCard, PipelineFlow, RankedList,
} from '@openimis/fe-tasaf_common';

const STATUS_FLOW = [
  ['DRAFT', <EditIcon />], ['SUBMITTED', <SendIcon />], ['APPROVED', <CheckIcon />],
  ['SCHEDULED', <EventIcon />], ['ONGOING', <PlayCircleOutlineIcon />],
  ['COMPLETED', <DoneAllIcon />], ['CLOSED', <LockOutlinedIcon />],
  ['CANCELLED', <BlockIcon />],
];

const useStyles = makeStyles((theme) => ({ page: theme.page }));

function DashboardPage() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const summary = useSelector((s) => s.communications.summary);
  const fetching = useSelector((s) => s.communications.fetchingSummary);
  const error = useSelector((s) => s.communications.errorSummary);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const refresh = () => { dispatch(fetchSummary({})); setRefreshedAt(new Date()); };
  useEffect(() => { refresh(); }, []);

  const t = (k) => formatMessage(k);
  const empty = t('communications.dashboard.empty');

  const history = useHistory();
  const goActivities = () => history.push('/communications/activities');

  const planned = summary?.plannedAudienceTotal ?? 0;
  const actual = summary?.actualAudienceTotal ?? 0;
  const reachAchieved = planned > 0 ? `${Math.round((actual / planned) * 100)}%` : '–';

  const cards = [
    ['communications.dashboard.total', summary?.totalActivities],
    ['communications.dashboard.thisWeek', summary?.activitiesThisWeek],
    ['communications.dashboard.upcoming', summary?.upcomingActivities],
    ['communications.dashboard.reachAchieved', reachAchieved],
  ];

  const audienceStages = [
    { key: 'planned', icon: <PeopleIcon />, label: t('communications.dashboard.plannedAudience'), value: planned },
    { key: 'actual', icon: <VisibilityIcon />, label: t('communications.dashboard.actualAudience'), value: actual },
  ];
  const mediaStages = [
    { key: 'invited', icon: <MailOutlineIcon />, label: t('communications.dashboard.mediaInvited'), value: summary?.mediaHousesInvited ?? 0 },
    { key: 'reported', icon: <AssignmentTurnedInIcon />, label: t('communications.dashboard.mediaReported'), value: summary?.mediaHousesReported ?? 0 },
  ];

  const counts = Object.fromEntries((summary?.byStatus ?? []).map((r) => [r.status, r.count]));
  const statusStages = STATUS_FLOW.map(([code, icon]) => ({
    key: code, icon, label: t(`communications.status.${code}`), value: counts[code] ?? 0,
  }));
  const byType = (summary?.byType ?? []).map((r) => ({
    key: r.activityType, label: t(`communications.activityType.${r.activityType}`), value: r.count,
  }));
  const byChannel = (summary?.byChannel ?? []).map((r) => ({
    key: r.channelType, label: t(`communications.channelType.${r.channelType}`), value: r.count,
  }));
  const reachByLevel = (summary?.reachByLevel ?? []).map((r) => ({
    key: r.level, label: t(`communications.level.${r.level}`), value: r.actual,
    right: `${(r.planned ?? 0).toLocaleString()} / ${(r.actual ?? 0).toLocaleString()}`,
  }));

  return (
    <div className={classes.page}>
      <Helmet title={t('communications.dashboard.page.title')} />
      <DashboardHeader
        title={t('communications.dashboard.page.title')}
        subtitle={t('communications.dashboard.subtitle')}
        refreshedLabel={refreshedAt ? `${t('communications.dashboard.lastRefreshed')} · ${refreshedAt.toLocaleString([], { hour: '2-digit', minute: '2-digit' })}` : null}
        onRefresh={refresh}
        refreshing={fetching}
        refreshTooltip={t('communications.dashboard.refresh')}
      />

      <ProgressOrError progress={fetching && !summary} error={error} />

      {!error && (
        <>
          <Grid container spacing={3}>
            {cards.map(([l, v]) => (
              <Grid item xs={12} sm={6} md={3} key={l}>
                <StatCard label={t(l)} value={v} caption={t(`${l}.caption`)} onClick={goActivities} />
              </Grid>
            ))}
          </Grid>

          <Box mt={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionCard title={t('communications.dashboard.byStatus')} icon={<DonutLargeIcon />}>
                  <PipelineFlow stages={statusStages} emptyText={empty} maxPerRow={4} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.audience')} icon={<PeopleIcon />}>
                  <PipelineFlow stages={audienceStages} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.mediaCoverage')} icon={<MailOutlineIcon />}>
                  <PipelineFlow stages={mediaStages} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.byType')} icon={<CategoryIcon />}>
                  <RankedList items={byType} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.byChannel')} icon={<RecordVoiceOverIcon />}>
                  <RankedList items={byChannel} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.reachByLevel')} icon={<GroupIcon />}>
                  <RankedList items={reachByLevel} emptyText={empty} />
                </SectionCard>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </div>
  );
}
export default DashboardPage;
