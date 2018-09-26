# Memory Bot

The memory bot is a tool used to compare the memory consumption of different process
trees. It has built in integration for comparing memory consumption of different load tests.

## How to use
1. On windows, make sure to have build tools installed: ``npm install --global --production windows-build-tools``
2. Install node dependencies:   ``npm install`` 
3. Configure the app. Look at [.sample.env](.sample.env) for configuration options.
4. Start the app:   ``npm run start``
5. By configuring the aggregator url, all periodic snapshots can be visualized in a Grafana dashboard.