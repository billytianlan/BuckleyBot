import { connection } from '../bot.js';
import User from '../models/userModel';
import Team from '../models/teamModel';
import Tag from '../models/tagModel';
import rp from 'request-promise';

const helper =  {
  updateUser: (response) => {
    let slackUserId = response.user;
    let location = response.text;
    let usersData = { 
      url: 'http://localhost:8080/slack/users',
      method: 'PUT',
      json: { slackUserId, location } 
    }
    
    rp(usersData)
      .catch(err => console.log(err))

  },
  findTags: (message) => {
    //given a string of text, split the string by spaces
    //loop through the array and check if the tag exists
    //for now we will not consider new tags that the users 
    //want to add 

    //with splitting, how would be handle .js
    let words = message.text.split(/[\\.,\\ !;?:]/);
    let match = [];

    return Tag.findAll()
    .then(tags => {

      tags.forEach(item => {
        if (words.indexOf(item.dataValues.name) !== -1) {
          match.push(item.dataValues.name)
        }
      })
  
      console.log('this is match, ', match);
      return match;
    })
    .catch(err => {
      console.log('Error: ', err);
    })

  }
};

export default helper;