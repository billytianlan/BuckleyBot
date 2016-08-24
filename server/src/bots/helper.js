import { connection } from './main';
import rp from 'request-promise';
import _ from 'underscore';

const server = process.env.HOST || 'http://localhost:8080';

const helper =  {
  updateUser: (response) => {
    let slackUserId = response.user;
    let location = response.text;
    let usersData = { 
      url: `${server}/api/users`,
      method: 'PUT',
      json: { slackUserId, location } 
    }
    rp(usersData)
    .catch(err => console.log(err));
  },

  findJobTags: (message) => {
    //given a string of text, split the string by spaces
    //loop through the array and check if the tag exists
    //for now we will not consider new tags that the users 
    //want to add 

    //with splitting, how would be handle .js
    let words = message.text.split(/[\\.,\\ !;?:]/);
    let match;

    return rp({
      url: `${server}/api/tags`,
      json: true
    })
    .then(tags => {
      match = tags.filter((tag) => {
        return words.indexOf(tag.name) !== -1;
      });
      console.log('this is match, ', match);
      return match.length > 0 ? match : tags;
    })
    .catch(err => {
      console.log('Error: ', err);
    });
  },

  listUserTags: (message) => {
    let userData = {
      url: `http://localhost:8080/api/users/tags/${message.user}`,
      method: 'GET',
      json: true
    };
    return rp(userData);
  },

  listAllTags: () => {
    let tagData = {
      url: `http://localhost:8080/api/tags`,
      method: `GET`,
      json: true
    };
    return rp(tagData);
  },

  respondWithTags: (bot, message) => {
  //find all tags
    helper.listAllTags()
    .then(allTags => {
      //find all user tags
      helper.listUserTags(message)
      .then(res => {
        //all user tags
        let userTagObj = {}; 
        _.each(res, item => {
          userTagObj[item.tagId] = true
        });

        let attachments = [];

        //how can i loop through the user tags
        //if the user has the tag, have a delete button
        //otherwise, have a button to add

        allTags.forEach(({id, name}) => {
          let addButton =  {
            name: `addTag`,
            text: `Add Tag`,
            value: id,
            type: `button`,
            style: `primary`
          }; 
          let deleteButton = {
            name: `deleteTag`, 
            text: `Delete Tag`, 
            value: id, 
            type: `button`, 
            style: `danger`,
            confirm: {
              title: `Are you sure?`,
              text: `Confirmation to delete tag?`,
              ok_text: `Yes, delete it!`,
              dismiss_text: `No, don't delete!`
            } 
          };
          
          //does tag(user tag) exist in tags(tag table)
          let button = (!!userTagObj[id]) ? deleteButton : addButton;
              
          let attachment = {
            text: `${name}`,
            callback_id: `userTag`,
            fallback: `This option is disabled`,
            attachment_type: `default`,
            color: `#3AA3E3`,
            actions: [button]
          };
          attachments.push(attachment);
        });

        let response = {
          text: `Here are a list of your tags: `,
          fallback: `Unable to show tags`,
          color: `#3AA3E3`,
          attachments
        };

        bot.reply(message, response);
      });
    });
  },
  filterJobs: (jobs) => {
    let filterJobs = _.filter(jobs, (job) => {
      //TODO: Need to do further filtering to ensure that the 
      //user's saved job does not show up in slack
      
      let jobTitle = job.title.toLowerCase();

      return jobTitle.indexOf('lead') === -1 && 
        jobTitle.indexOf('senior') === -1 && 
        jobTitle.indexOf('manager') === -1 &&
        jobTitle.indexOf('sr.') === -1 &&
        jobTitle.indexOf('principal') === -1;
    });
    return filterJobs;
    console.log("# of filtered jobs:", filterJobs.length);
  },
  listAllUserRelatedJobs: (message) => {
    let userData = {
      url: `http://localhost:8080/api/users/tags/jobs/${message.user}`,
      method: 'GET',
      json: true
    };
    return rp(userData);
  }
};

export default helper;