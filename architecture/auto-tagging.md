# Auto tagging

1. For each event we have app name and title which we can use for tagging the event
2. Instead of generating tag for each event we will tag one app name and title combo with single auto tag and store it in cache and db
3. When new even comes we will check if we have event with app name and title in cache if it is present we will use that tags else we will keep tags data empty
4. After sometime we will run cron job to tag the app + title.
5. After generating the tags will run a job to tag not autotagged events.
