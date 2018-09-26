# Memory Bot

The memory bot is a tool used to compare the memory consumption of different process
trees. It has built in integration for comparing memory consumption of different load tests.

## How to use
1. On windows, make sure to have build tools installed: ``npm install --global --production windows-build-tools``
2. Install node dependencies:   ``npm install`` 
3. Configure the app. Look at [.sample.env](.sample.env) for configuration options.
4. Start the app:   ``npm run start``
5. Look at the log files generated for memory snapshots. Log files follow the naming convention `PROCESS_NAME.out`.

## Understanding the logs

The log files generated will log out the memory consumption of the named process every second.
Upon triggering a load test via REST request, a event will be appended to the log signifying the start of
the event. With the aggregator configured, metric logs will be sent for aggregator collection, so dashboard can be built
based on the data.