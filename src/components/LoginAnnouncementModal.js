import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, Typography, Box, Chip, CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CloseIcon from '@material-ui/icons/Close';
import { formatMessageWithValues } from '@openimis/fe-core';
import RichText from './RichText';
import { relTime } from '../utils/dates';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      minWidth: 500,
      maxWidth: 600,
    },
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  emptyState: {
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  chip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  body: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  meta: {
    display: 'flex',
    gap: theme.spacing(1),
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
}));

export default function LoginAnnouncementModal({
  announcements = [],
  loading = false,
  open = false,
  onDismiss,
  onClose,
  intl,
}) {
  const fm = (key, vals) => formatMessageWithValues(intl, 'communications', key, vals);
  const classes = useStyles();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (open) setCurrentIndex(0);
  }, [open]);

  const current = announcements[currentIndex];
  const hasNext = currentIndex < announcements.length - 1;

  if (!current) return null;

  const handleDismiss = () => {
    if (onDismiss) onDismiss(current.id);
    if (hasNext) setCurrentIndex(currentIndex + 1);
    else if (onClose) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      className={classes.dialog}
      maxWidth="sm"
    >
      <DialogTitle className={classes.title}>
        <span>{fm('communications.announcement.title')}</span>
        <Button
          color="inherit"
          size="small"
          onClick={handleDismiss}
          style={{ minWidth: 'auto' }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box className={classes.content}>
            <CircularProgress size={40} />
          </Box>
        )}

        {!loading && current && (
          <>
            <Card style={{ padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <Box>
                <Typography variant="h6" component="div" gutterBottom>
                  {current.title}
                </Typography>
                <Chip
                  label={fm(`communications.postType.${current.postType}`)}
                  size="small"
                  variant="outlined"
                  className={classes.chip}
                />
              </Box>

              <Box className={classes.body}>
                <RichText html={current.body} />
              </Box>

              <Box className={classes.meta}>
                <span>{current.userCreated?.username || '—'}</span>
                <span>·</span>
                <span>{relTime(current.publishedAt || current.dateCreated)}</span>
              </Box>
            </Card>

            {announcements.length > 1 && (
              <Typography variant="caption" style={{ marginTop: 16, display: 'block' }}>
                {fm('communications.announcement.progress', { current: currentIndex + 1, total: announcements.length })}
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleDismiss} color="primary" variant="contained">
          {hasNext ? fm('communications.announcement.readAndNext') : fm('communications.announcement.read')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
