'use strict';

const axios = require('axios');
const qs = require('qs');

const apiUrl = process.env.SLACK_API_URL;
const slackAuthToken = process.env.SLACK_ACCESS_TOKEN;

const findAuthedChannels = async (id, cursor) => {
    const bot = id;

    const args = {
        token: slackAuthToken,
        exclude_archived: true,
        user: bot
    };

    if (cursor) args.cursor = cursor;

    const result = await axios.post(`${apiUrl}/users.conversations`, qs.stringify(args));

    const {
        channels,
        response_metadata
    } = result.data;

    if (response_metadata.next_cursor !== '') {
        return channels.concat(await findAuthedChannels(id, response_metadata.next_cursor));
    } else {
        return channels;
    }

};

module.exports = {
    findAuthedChannels
};