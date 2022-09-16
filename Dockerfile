FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

RUN yarn ci

# Bundle app source
COPY . .
RUN yarn run clean:build

EXPOSE 3000
CMD yarn run start


# 1. Briefly describe the cloud architecture that you would use to host this service in a scalable manner (> 3,000 requests per second). (0-300 words)
#
# For hosting the container I would pick Fargate, as it looks like the way, that abstracts the infrastructure mostly.
# However since it's more expensive for long running and cpu/ram intesive tasks, depends on expected traffic, ECS might
# be a lot cheaper option, if that's the goal then it would be a better pick.
#
# Since all of the data about orders is stored in process memory, there is no point in autoscaling containers horizontally,
# as it will break the data consistency, due to load balancing of requests. In that case we need to either scale vertically
# or change the architecture, to store the orders data in external database. Still I believe it should be able to handle
# 3000 RPS with big enough instance, however it would need to be benchmarked.
#
# From high availability point of view, using the current architecture is not the best way, since we would be losing
# all of the data, each time application has to shuts down for any reason. Because of that, I believe that using external
# database is a requirement, to make this application production ready.
#
# For that simple logic, I believe DynamoDB should work fine, we would just need to make sure, that receiving top
# ask/bid offers, wouldn't require to scan the table. We should be storing this data in separate table/index, so it's
# easy to find offer to match. However it causes additional issue - the data would be eventually consistent (time to
# write the data to separate table and time needed for index replication).
#
# In that case when we would have external database, we would be able to scale horizontally, which would make the
# application scalable and also high available. The last issue to overcome is load balancing and configuring correct
# desired task count for Fargate. For LB we would need to put something, that would route the traffic to correct nodes,
# using Application Load Balancer.
#
# However personally I would avoid using containers and Express and I would simply use API Gateway in that case,
# so later all we need to worry is mostly DynamoDB design.
#
# 2. Assuming the service is deployed with the above configuration, describe the continuous integration pipeline that you would design for this service. (0-300 words)
#
# I would most probably use repository built-in pipeline for running the pipeline. There would be per-branch envs, that
# would be created when changes to a new branch is pushed and removed when branch is deleted.
#
# Firstly it would be running `check-all` script from package.json and I would also add some lightweight tests for CDK resources (snapshot check
# should be enough). After that there would be a deployment of cloud resources using CDK. If the deployment is successful,
# then there should be running some sort of tests that interact with the deployed API (contract tests for example)
#
# After merging branch to master, the same process would be started to deploy changes on dev env, then later I would
# add manual accept step, to start the deployment for prod env, which should be on a separate AWS acc.
#
# For prod deployment strategy, I would apply A/B deployment, so the traffic would be routed to a new env.
# After running some basic smoke tests (that API seems to work at least), the traffic could be shifted to a new version.
# We should be also collecting some metrics about service health (requests/errors etc.) and basing on that, automatic
# rollback could be configured.
#
# Since this service stores everything about orders in the process memory, we would need to implement mechanism, to keep
# that data after deployment, but this topic was covered in 1.
#
