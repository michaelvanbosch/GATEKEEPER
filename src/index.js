require('dotenv').config();

const util = require('util');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const qs = require('querystring');
const message = require('./postMessage');
const signature = require('./verifySignature');
const channels = require('./channels');
const commandsController = require('./commandsController');
const app = express();

const apiUrl = 'https://slack.com/api';
const announcements = {};
let bot = '';

/*
 * Parse application/x-www-form-urlencoded && application/json
 * Use body-parser's `verify` callback to export a parsed raw body
 * that you need to use to verify the signature
 */

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.get('/', (req, res) => {
  res.send('<h2>The Approval Flow app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your' +
  ' environment variables.</p>');
});

/*
 * Endpoint to receive events from Slack's Events API.
 * It handles `message.im` event callbacks.
 */

app.post('/events', (req, res) => {
  // console.log(req.body);
  commandsController.run(req,res);
});
  
/*
 * Endpoint to receive events from interactive message and a dialog on Slack. 
 * Verify the signing secret before continuing.
 */
app.post('/interactions', async(req, res) => {

  if(!signature.isVerified(req)) {
    res.sendStatus(404); 
    return;
  } else {
    const { type, user, trigger_id, callback_id, actions, response_url, submission } = JSON.parse(req.body.payload);

    /* Button press event 
     * Check `callback_id` / `value` when handling multiple buttons in an app
     */

    if(type === 'interactive_message') { 

      // Initial button interaction - Start creatng an announcement
      if(callback_id === 'registerTeam') {
        try {
          const result = await openDialog(trigger_id);
          if(result.data.error) {
            res.sendStatus(500);
          } else {
            message.sendShortMessage(user.id, 'Thanks!');
            res.sendStatus(200);
          }
        } catch(err) {
          res.sendStatus(500);
        }
      }
      else if(callback_id === 'setStatusAsIn') {
        message.sendShortMessage(user.id, 'Thanks! Don\'t forget to sign out when you leave');
        res.sendStatus(200);
        //#TODO
        //POST TO SERVER that they are in
      }
      else if(callback_id === 'setStatusAsOut') {
        message.sendShortMessage(user.id, 'Thanks! Have a great rest of your day.');
        res.sendStatus(200);
        //#TODO
        //POST TO SERVER that they are in
      } 

      // Admin approved. Post the announcement.
      else if (callback_id.match(/adminApprove:/)) {
        res.sendStatus(200);

        let match = callback_id.match(/adminApprove:(.*)/) // Extract the approver's user id stored as a part of the callback_id!
        let requester = match[1]; 

        if(actions[0].value === 'approve') { console.log(announcements)
          message.postAnnouncement(requester, announcements[requester]);
        } else {
          message.sendShortMessage(requester, 'The request was denied.');
          message.sendShortMessage(user.id, 'Thanks. I am letting the requester know!');
        }
      }
    } 
    
    /* Dialog submission event */
    
    else if(type === 'dialog_submission') {
      // immediately respond with a empty 200 response to let Slack know the command was received
      res.send('');

      // Store it temporary until the announcement is posted
      announcements[user.id] = submission;
      console.log(submission);
      //#TODO
      //post_registration(submission);
      // message.requestApproval(user.id, submission);
    }
  } 
});

/*
 * Endpoint of loading an "external" select menu list for the dialog.
 * Use `users.conversations` method to grab all channlels where the bot is added.
 * that this app has the permission to post, and create a JSON list of the available channels.
 * 
 * The dynamically loading data wil look like:
 * 
   options: [
      {
        label: 'channel name',
        value: 'channel id'
      }, ...
    ]

 */
app.post('/channels', async(req, res) => {
  const rawList = await channels.findAuthedChannels(bot);
  
  let finalList = rawList.map(o => {
    return {value: o.id, label: `#${o.name}`};
  });
  
  res.send(JSON.stringify({options: finalList}));
});

// open the dialog by calling dialogs.open method and sending the payload
const openDialog = async(trigger_id) => {

  const dialogData = {
    token: process.env.SLACK_ACCESS_TOKEN,
    trigger_id: trigger_id,
    dialog: JSON.stringify({
      title: 'Create a Team',
      callback_id: 'setup_team',
      submit_label: 'Request',
      text: 'Its time to nominate the channel of the week',
      
      elements: [
        {
          type: 'text',
          name: 'title',
          label: 'Team Name',
        },
        
        {
          type: 'select',
          name: 'team',
          label: 'Your team\'s slack channel',
          data_source: 'channels',
        },
        {
          type: 'text', 
          name: 'time',
          label: 'Working Hours?',
          placeholder: '7:30-4:00'
        }
      ]
    })
  };

  // open the dialog by calling dialogs.open method and sending the payload
  return axios.post(`${apiUrl}/dialog.open`, qs.stringify(dialogData));
};

  
const server = app.listen(process.env.PORT || 80, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});