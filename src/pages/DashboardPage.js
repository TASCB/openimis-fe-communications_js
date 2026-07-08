import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import { Grid, Box } from '@material-ui/core';
import {
  Helmet, useTranslations, useModulesManager, ProgressOrError,
} from '@openimis/fe-core';
import { MODULE_NAME } from '../constants';
import { fetchSummary } from '../actions';
import {
  DashboardHeader, StatCard, SectionCard, Breakdown, RankedList,
} from '../components/DashboardKit';

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

  const primary = [
    ['communications.dashboard.total', summary?.totalActivities],
    ['communications.dashboard.thisWeek', summary?.activitiesThisWeek],
    ['communications.dashboard.upcoming', summary?.upcomingActivities],
    ['communications.dashboard.ongoing', summary?.ongoingActivities],
  ];
  const secondary = [
    ['communications.dashboard.completed', summary?.completedActivities],
    ['communications.dashboard.cancelled', summary?.cancelledActivities],
    ['communications.dashboard.plannedAudience', summary?.plannedAudienceTotal],
    ['communications.dashboard.actualAudience', summary?.actualAudienceTotal],
    ['communications.dashboard.mediaInvited', summary?.mediaHousesInvited],
    ['communications.dashboard.mediaReported', summary?.mediaHousesReported],
  ];

  const byStatus = (summary?.byStatus ?? []).map((r) => ({
    key: r.status, label: t(`communications.status.${r.status}`), value: r.count,
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
            {primary.map(([l, v]) => (
              <Grid item xs={6} md={3} key={l}>
                <StatCard primary label={t(l)} value={v} />
              </Grid>
            ))}
          </Grid>

          <Box mt={2}>
            <Grid container spacing={2}>
              {secondary.map(([l, v]) => (
                <Grid item xs={6} sm={4} md={2} key={l}>
                  <StatCard label={t(l)} value={v} />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box mt={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.byStatus')}>
                  <Breakdown items={byStatus} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.byType')}>
                  <RankedList items={byType} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.byChannel')}>
                  <RankedList items={byChannel} emptyText={empty} />
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard title={t('communications.dashboard.reachByLevel')}>
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
