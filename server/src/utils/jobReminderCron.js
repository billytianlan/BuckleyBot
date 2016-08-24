import { store } from '../bots/main';
import userJobsListener from '../bots/job';
import { startConvo } from '../bots/introduction';
import { CronJob } from 'cron';
import Promise from 'bluebird';
import rp from 'request-promise';
import _ from 'underscore';
import helper from '../bots/helper';
 
const host = process.env.HOST || 'http://localhost:8080';  

let jobCron = new CronJob({
  cronTime: '00 30 08 * * 1-5',
  // cronTime: '20 * * * * *',
  onTick: () => {
    console.log('Cron jobs to dank jobs');
    messageUsers();
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});

let messageUsers = () => {
  rp({
    url: `${host}/api/users/tags`,
    method: 'GET',
    json: true
  })
  .then(users => {
    console.log('in the reminder', users);
    return Promise.all(_.map(users, (user) => {
      const tagArr = _.map(user.tags, (tag) => {
       return tag.id;
      });
      let qs = tagArr.join('+');
      return rp({
        url: `${host}/api/jobs/tags`,
        method: 'GET',
        qs: {
          tags: qs
        },
        json: true
      })
      .then((jobs) => {
        return {
          user: user,
          jobs: jobs
        }
      })
    }))
  })
  .then((data) => {
    _.each(data, (item) => {
      const id = item.user.slackUserId;
      const BUCKLEY = store[item.user.slackTeamId]; 

      let jobsArr = _.map(item.jobs, (job, key) => {
        return {
          title: `:computer: ${job.title}`,
          text: `:office: ${job.company} - ${job.location} \n :link: ${job.link}`,
          callback_id: `clickSaveJobs`,
          attachment_type: `default`,
          actions: [
            {name: `saveJob`, text: `Save`, value: job.id, type: `button`, style: `default`}
          ]
        }
      });

      if (jobsArr.length === 0) {
        BUCKLEY.startPrivateConversation({ user: user.slackUserId }, (err, convo) =>{
          convo.say(`It seems like you don't have any tags! Please type tags and set you filters!`);
          return;
        });
      }

      const message_with_jobs = {
        text: 'Good morning! I found some cool jobs you might be interested in:',
        attachments: sortedJobsArr
      };
      BUCKLEY.startPrivateConversation({ user: user.slackUserId }, (err, convo) => {
        convo.say(message_with_jobs);
      });
    })
  })
  .catch(err => {
    console.log('There was an error:', err);
  });
}

export default jobCron;