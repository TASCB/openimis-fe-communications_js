import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

/**
 * Shared visual language for the module's profile cards (Training / Trainer /
 * Attendance). Everything is derived from the configured BRAND theme
 * (theme.palette.primary, set via the Django-admin / ModuleConfiguration theme) —
 * no hard-coded colours — so all cards look identical and on-brand.
 */
export const useProfileCardStyles = makeStyles((theme) => {
  const main = theme.palette.primary.main;
  const contrast = theme.palette.primary.contrastText || '#fff';
  return {
    card: {
      overflow: 'hidden', borderRadius: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', margin: 0,
    },
    header: {
      padding: theme.spacing(2.5, 3),
      color: contrast,
      display: 'flex',
      alignItems: 'center',
      backgroundColor: main,
    },
    avatar: {
      backgroundColor: 'rgba(255,255,255,0.25)', color: contrast, width: 56, height: 56, marginRight: theme.spacing(2),
    },
    code: {
      textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85, fontSize: 12, fontWeight: 600,
    },
    title: { fontWeight: 700, lineHeight: 1.15 },
    sub: { opacity: 0.9, fontSize: 13 },
    headChips: {
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: theme.spacing(0.5),
    },
    chip: { backgroundColor: 'rgba(255,255,255,0.92)', color: main, fontWeight: 700 },
    body: { padding: theme.spacing(3) },
    tile: { display: 'flex', alignItems: 'flex-start' },
    tileIcon: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(1.5),
      backgroundColor: `${main}14`,
      color: main,
      flexShrink: 0,
    },
    label: {
      fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.palette.text.secondary, fontWeight: 600,
    },
    value: { fontSize: 15, fontWeight: 500, wordBreak: 'break-word' },
    sectionTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: theme.palette.text.secondary,
      fontWeight: 700,
      margin: theme.spacing(0.5, 0, 1, 0),
    },
    block: {
      backgroundColor: theme.palette.grey[50],
      borderLeft: `4px solid ${main}`,
      borderRadius: 4,
      padding: theme.spacing(1.5, 2),
      whiteSpace: 'pre-wrap',
    },
    meta: {
      padding: theme.spacing(1.5, 3),
      backgroundColor: theme.palette.grey[50],
      color: theme.palette.text.secondary,
      fontSize: 12,
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
    },
  };
});

export function ProfileTile({
  icon, label, value, sm = 6, md,
}) {
  const classes = useProfileCardStyles();
  if (value === undefined || value === null || value === '') return null;
  return (
    <Grid item xs={12} sm={sm} md={md} className={classes.tile}>
      <div className={classes.tileIcon}>{icon}</div>
      <div>
        <Typography className={classes.label}>{label}</Typography>
        <Typography className={classes.value}>{value}</Typography>
      </div>
    </Grid>
  );
}
