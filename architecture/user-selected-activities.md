# User selected activities

Currently we are storing all user data and showing it to user. It will be okay to show all user activities to user but not to admin. User might not feel okay to share all of his data to admin. To make user feel more comfortable we are adding User selected Activities. We will show only user selected data to admin.

Instead of following UI similar to timely we are thinking of simple approach where user selects activities which are grouped by app name and title. It is simple to implement and reason about.

## Implementation

### In place update

1. Add a new field to activities called user selected which will be updated when user has submitted selected data

### Cron Job for event merging

1. We will run a cron job at the end of day which merge all the events with same user id, app name, title into single db event
2. This way we will have less amount to query
