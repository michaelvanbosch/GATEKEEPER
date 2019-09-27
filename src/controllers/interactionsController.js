const message = require('./postMessage');
const signature = require('./verifySignature');
const axios = require('axios');
const qs = require('querystring');
const apiUrl = 'https://slack.com/api';


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
let handleInteractions = async function(req, res) {
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
      
    } 
    
    /* Dialog submission event */
    
    else if(type === 'dialog_submission') {
      // immediately respond with a empty 200 response to let Slack know the command was received
      res.send('');

      // Store it temporary until the announcement is posted
      console.log(submission);
      //#TODO
      //post_registration(submission);
      // message.requestApproval(user.id, submission);
    }
  } 
}
module.exports.run = function(req, res) {
    handleInteractions(req,res);
}