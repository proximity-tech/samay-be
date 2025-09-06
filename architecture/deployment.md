# AWS & Deployment

Requirements

1. Automatic deployment after pr merge to `main` branch
2. DB Migrations
3. Staging env and Prod env

## Automatic deployment using AWS Code pipeline and AWS Beanstalk

### AWS BeanStalk

We are using AWS Beanstalk for hosting the backend application

#### Setup

1. Go to AWS > Create environment
2. Enter application name, environment name, domain name
3. Select Application sample application, Presets Single Instance
4. Leave other params as default

### Code Pipeline

We are using AWS Code pipeline for automatically deploying the backend application

#### Setup

1. Go to AWS > Code pipeline > Create Pipeline
2. Select Build Custom Pipeline > Next
3. Choose pipeline settings
4. Enter pipeline name > Next
5. Choose Github app as service provider
6. We need to create Github connection for that we need Github owner access
7. Select Repo name and default branch main
8. Click next
9. Skip build stage and test stage
10. In deploy stage select AWS Beanstalk as service provider
11. Select Beanstalk application and environment
12. Click Next Review and save

## How does deployment and application work on beanstalk

1. When we push any changes to main repo AWS app which we configured on repo will be triggered thru webhook
2. AWS code pipeline will deploy whole repo in aws beanstalk EC2 instance
3. Then it will Procfile
4. Procfile will start.sh file which installs, builds and runs application
