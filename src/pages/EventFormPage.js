import React from 'react';
import ActivityPage from './ActivityPage';

// The event create/edit form IS the activity form, opened in its event variant: the type picker
// narrows to event formats, media-reach fields are hidden, and Back returns to Events.
// eslint-disable-next-line react/jsx-props-no-spreading
function EventFormPage(props) { return <ActivityPage {...props} variant="event" />; }
export default EventFormPage;
