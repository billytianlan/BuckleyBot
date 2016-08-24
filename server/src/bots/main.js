import Botkit from 'botkit';
import userJobsListener from './job';
import helper from './helper';
import rp from 'request-promise';

const store = {};
const server = 'http://localhost:8080';

const connection = Botkit.slackbot({
  //this will make it possible to be interactive with
  //the convo.ask function
  interactive_replies: true,
  debug: false,
});


//Spawn a bot connection for a specific team
const spawnBot = (team) => {
  let temp = connection.spawn({
    token: team.slackBotToken,
    retry: 20
  });
  store[team.slackTeamId] = temp.startRTM();
};

//allow you to do RTM without having to create a new team
//note this is imported to server.js first on server start
const teams = () => {
  console.log('starting instances of bots in database')
  rp({
    url: `${server}/api/teams`,
    json: true
  })
  .then((teams) => {
    teams.forEach((team) => {
      console.log('spanwing bot for', team.slackTeamName);
      spawnBot(team);
    });
  })
  .catch((err) => {
    console.log('Error fetching all teams from /api/teams', err);
  });
};

//Adding key words bot responds to (hears) and event listeners (on)
//Handle different bot listeners
connection.hears(["jobs", "job"], ['direct_message'], function(bot, message) {
  //if there is only one word in the message
  if (message.text.length === 1) {
    //Change this to return the jobs associated with the user tags
    userJobsListener.replyWithJobs(bot, message);
  } else {
    userJobsListener.replyWithJobs(bot, message);
  }
  
});

connection.hears(["change", "update"], ['direct_message'], function(bot, message) {
  bot.startConversation(message, (err, convo) => {
    convo.ask("Where do you want to change your job search location to?", (response, convo) => {
      askLocation(response,convo);
      convo.next();
    });
  });
});

const askLocation = (response, convo) => {
  helper.updateUser(response);
  convo.say(`Great, your location has been updated to ${response.text}!`);
  convo.next();
}

connection.hears(["tag", "filter"], ['direct_message'], (bot, message) => {
  helper.respondWithTags(bot, message);
});

connection.hears("location", ['direct_message'], (bot, message) => {
  bot.reply(message, { 
    text: `Would you like to *view* or *update* your current job search location?`,
    attachments: [
      {
        text: `Choose to view or update`,
        fallback: `This option is disabled`,
        callback_id: `location`,
        color: `#3AA3E3`,
        attachment_type: `default`,
        actions: [
          {
            name: `view`,
            text: `View`,
            type: `button`,
            value: `view`
          },
          {
            name: `update`,
            text: `Update`,
            type: `button`,
            value: `update`
          }
        ]
      }
    ]
  });
});

connection.hears("help", ['direct_message'], (bot, message) => {
  bot.reply(message, `If you would like to change your location, you can type *location*!\n` +
    `If you would like to add filters for your search, type *tags* and toggle the button to add or ` +
    `remove tags!`);
});

connection.hears("weather", ['direct_message'], (bot, message) => {
  console.log('replying to message');
  bot.reply(message, 'Great weather today huh?');
});

connection.hears("", ['direct_message'], (bot, message) => {
  bot.reply(message, `I didn't quite get that. Try asking me about jobs!`);
});

connection.on('rtm_open', (bot) => {
  console.log(`** The RTM api just opened at ${Date.now()}`);
});

connection.on('rtm_close', (bot) => {
  console.log(`** The RTM api just closed at ${Date.now()}`);
});

connection.on('rtm_reconnect_failed', (bot) => {
  console.log(`** The RTM api retry attempts have been exhausted at ${Date.now()}`);
});

export { store, teams, spawnBot, connection };




