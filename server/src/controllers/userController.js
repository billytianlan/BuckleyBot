import User from '../models/userModel';
import Job from '../models/jobModel';
import Tag from '../models/tagModel';

// Triggered from 'GET /slack/users/data' after passport middleware finds user
const getUserData = (req, res) => {
  // Check if error
  if (req.error) {
    console.log('Error getting user data:', error);
    res.send(req.error);
  } 

  // Otherwise, send the relevant user data as an object
  User.findById(req.user.id, {
    include: [Job]
  })
  .then(user => {
    let jobs = user.jobs.map(job => {
      let publishDate = job.dataValues.publishDate.toString().slice(0,16);
      return {
        title: job.dataValues.title,
        link: job.dataValues.link,
        location: job.dataValues.location,
        company: job.dataValues.company,
        publishDate: publishDate
      }
    });

    let userData = {
      name: user.dataValues.name,
      location: user.dataValues.location,
      photo: user.dataValues.photo,
      jobs: jobs
    }
    
    res.send(userData);
  })
  .catch(err => res.send('Error retrieving user data', err))

}

// Triggered from 'GET /api/users/:slackUserId'
// Query for single user
const findUser = (req, res) => {
  let slackUserId = req.params.slackUserId;

  User.findOne( {where: {slackUserId}} )
  .then(user => res.send(user))
  .catch(err => res.send('No user found: ', err));

}
 
// Triggered from 'POST /slack/users'
// Create user and make request to profile controller
// NOTE: users need to be passed as a array
// NOTE: accessToken is set to null until user signs in
// NOTE: location is set to San Francisco for default 
const addUsers = (req, res) => {
  let users = req.body.users;

  Promise.all(users.map( ({ name, email, photo, slackUserId, slackTeamId }) => {
    return User.create({
      name, email, photo, slackUserId, slackTeamId 
    })
  }))
  .then((users) => res.send(users))
  .catch(err => res.send(err) )
  .catch((err) => res.send('Error adding user', err));  
}

// Triggered from 'POST /api/users/user' 
// Creates new user or updates existing user's access token
const addUser = (req, res) => {
  let user = req.body.user;
  let name = user.name;
  let email = user.email;
  let photo = user.photo;
  let slackUserId = user.slackUserId;
  let slackTeamId = user.slackTeamId;
  let accessToken = user.accessToken;

  User.findOne({ 
    where: {slackUserId} 
  })
  .then(user => {
    if(user) {
      return user.updateAttributes({ accessToken });
    } else {
      return User.findOrCreate({ 
        where: { name, email, photo, accessToken, slackUserId, slackTeamId } 
      });
    }
  })
  .then(user => {
    res.send(user);
  })
  .catch(err => res.send(err));

}

// Triggered from 'PUT /api/users/location' 
// Updates location when an user interacts with the bot
const updateUser = (req, res) => {
  let slackUserId = req.body.slackUserId;
  let location = req.body.location;

  User.update(
    { location: location },
    { where: {slackUserId: slackUserId } }
  )
  .then(user => {
    res.send('User location updated')
  })
  .catch(err => res.send('Error when updating location', err))
}

const getAllUserTags = (req, res) => {
  console.log('in the usertag');
  User.findAll({
    include: [Tag]
  })
  .then(users => {
    res.send(users);
  })
  .catch(err => {
    console.log(err);
    res.send(err);
  })
}
// const getAllUserData = (req, res) => {
//   //Return all the data for every user 
//   //Include the users tags and the jobs 
//   //assoicated with the tags within the last 24 hours
//   User.findAll({
//     include: [{
//       model: Tag,
//       include: [{
//         model: Job,
//         where: {
//           createdAt: {
//             $gt: new Date(new Date() - 24 * 60 * 60 * 1000)
//           }
//         }
//       }]
//     }]
//   })
//   .then(users => {
//     res.send(users);
//   })
//   .catch(err => {
//     console.log('error retrieving getAllUserData', err)
//     res.send(err);
//   })
// }

// const getUserTagJobs = (req, res) => {
//   let slackUserId = req.params.slackUserId
//   User.findOne({
//     where: { slackUserId: slackUserId },
//     include: [{
//       model: Tag,
//       include: [{
//         model: Job,
//         where: {
//           createdAt: {
//             $gt: new Date(new Date() - 24 * 60 * 60 * 1000)
//           }
//         }
//       }]
//     }]
//   })
//   .then(user => {
//     if (user) {
//       res.send(user);
//     } else {
//       res.status(404).send('Could not find user for given slackUserId');
//     }
//   })
//   .catch(err => {
//     console.log('error retrieving getUserTagJobs', err)
//     res.send(err);
//   })
// }

export default { getUserData, findUser, addUsers, addUser, updateUser, getAllUserTags };
