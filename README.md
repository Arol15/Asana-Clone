# Asana-Clone
a/A Week 12 Full Stack Project - Asana Clone

## Starting up the application
- Development: npm run start:development
- Production: npm start

## Github Workflow

### Pull to update local branch to include master
- git checkout master
- git pull
- git checkout 'local branch'
- git merge master
- handle merge conflicts to finish merge

### Pushing local changes
- git add 'files to add'
- git commit -m 'message'
- git push
- select on compare changes menu (base: master  compare: 'local branch name')
- create pull request on github and leave comments
- wait for 1 team member to approve
- merge changes
- delete local branch

## Heroku Workflow
- git push heroku master

### Provision a database for Heroku
- heroku addons:create heroku-postgresql:hobby-dev

### Optional: Deploy local branch to Heroku
- git push heroku branchname:master


### For Changes to DB:
- heroku run npx sequelize-cli db:seed:undo:all
- heroku run npx sequelize-cli db:migrate:undo:all
- heroku run npx sequelize-cli db:migrate
- heroku run npx sequelize-cli db:seed:all

### Monitor Logs on Heroku
- heroku logs --tail

### Access Heroku psql instance
- heroku pg:psql

### Setup autocomplete for Heroku
- heroku autocomplete
