import path from 'path';
import teamController from '../controllers/teamController';
import userController from '../controllers/userController';
import profileController from '../controllers/profileController';
import jobController from '../controllers/jobController';
import tagController from '../controllers/tagController'
import jobTagController from '../controllers/jobTagController';
import buttonController from '../controllers/buttonController';
import userJobController from '../controllers/userJobController';

// Passport stuff
import passportConfig from '../utils/passport';
import passport from 'passport';

const requireAuth = passport.authenticate('jwt', { session: false });

export default (app, express) => {

  // API ROUTES

  //////////////////////////////////////////////
  //Handling Team Oauth
  //////////////////////////////////////////////
  app.get('/slack/teams/auth', teamController.addTeam);

  //////////////////////////////////////////////
  //Handling Users
  //////////////////////////////////////////////

  // TODO: fix this so that it is in the userController!
  app.get('/slack/users', userController.findUser);
  app.post('/slack/users', userController.addUser);
  app.delete('/slack/users', userController.deleteUser);

  // Grabbing user data
  app.get('/slack/users/data', requireAuth, userController.getUserData);

  //////////////////////////////////////////////
  //Handling Profile
  //////////////////////////////////////////////
  app.get('/slack/users/profile', profileController.findProfile);
  app.post('/slack/users/profile', profileController.addProfile);
  app.put('/slack/users/profile', profileController.updateProfile);
  app.delete('/slack/users/profile', profileController.deleteProfile);

  //////////////////////////////////////////////
  //Handling Oauth
  //////////////////////////////////////////////
  app.get('/slack/users/auth', userController.checkAuthCode);

  //////////////////////////////////////////////
  //Handling Job
  //////////////////////////////////////////////
  app.post('/api/job', jobController.addJob);

  //////////////////////////////////////////////
  //Handling Tag
  //////////////////////////////////////////////
  app.post('/api/tags/job', tagController.addJobTags);

  // CLIENT SIDE ROUTES

  // Dummy page to test JWT authorization
  app.get('/securepage', requireAuth, (req, res) => {
    res.send('Hi there, you are authorized :)');
  });

  //////////////////////////////////////////////
  //Handling Interactive Buttons
  //////////////////////////////////////////////
  app.post('/slack/receive', buttonController.buttonDispatcher);
  
  //////////////////////////////////////////////
  //Handling Error
  //////////////////////////////////////////////
  app.get('*', (req, res)=>{
    res.sendFile(path.resolve(__dirname + '/../../../client/index.html'));
  });
}
