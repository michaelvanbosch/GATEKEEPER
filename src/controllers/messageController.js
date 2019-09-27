'use strict';

const axios = require('axios');
const qs = require('qs');

const apiUrl = process.env.SLACK_API_URL;

const postRegistrationMessage = (userId) => {
    let messageData = {
        token: process.env.SLACK_ACCESS_TOKEN,
        channel: userId,
        attachments: JSON.stringify([{
            text: 'Register your team',
            callback_id: 'registerTeam',
            actions: [{
                name: 'start',
                text: 'Register your team',
                type: 'button',
                value: 'register',
            }]
        }])
    };
    send(messageData);
};

const postInMessage = (userId) => {
    let messageData = {
        token: process.env.SLACK_ACCESS_TOKEN,
        channel: userId,
        attachments: JSON.stringify([{
            text: 'Click below if you are in the office.',
            callback_id: 'setStatusAsIn',
            actions: [{
                name: 'start',
                text: 'Set Status as \'IN\'',
                type: 'button',
                value: 'Submit',
            }]
        }])
    };
    send(messageData);
};

const postOutMessage = (userId) => {
    let messageData = {
        token: process.env.SLACK_ACCESS_TOKEN,
        channel: userId,
        attachments: JSON.stringify([{
            text: 'Click below when you are leaving the office',
            callback_id: 'setStatusAsOut',
            actions: [{
                name: 'start',
                text: 'Set Status as \'OUT\'',
                type: 'button',
                value: 'register',
            }]
        }])
    };
    send(messageData);
};



const sendShortMessage = (userId, text) => {
    let data = {
        token: process.env.SLACK_ACCESS_TOKEN,
        channel: userId,
        text: text,
    };
    send(data);
};

const send = async (data) => {
    data.as_user = true; // send DM as a bot, not Slackbot
    const result = await axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(data))
    try {
        if (result.data.error) console.log(`PostMessage Error: ${result.data.error}`);
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    postRegistrationMessage,
    postInMessage,
    postOutMessage,
    sendShortMessage
};