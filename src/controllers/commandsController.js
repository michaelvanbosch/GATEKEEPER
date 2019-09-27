const message = require('./messageController');
const signature = require('../verifySignature');

let handleEvents = function(req, res) {
    if (req.body.command === '/register') {
        if (!signature.isVerified(req)) {
            res.sendStatus(404);
            return;
        } else {
            const {
                user_id
            } = req.body;
            message.postRegistrationMessage(user_id);
        }
        res.sendStatus(200);
    } else if (req.body.command === '/in') {
        if (!signature.isVerified(req)) {
            res.sendStatus(404);
            return;
        } else {
            const {
                user_id
            } = req.body;
            message.postInMessage(user_id);
        }
        res.sendStatus(200);
    }
    if (req.body.command === '/out') {
        if (!signature.isVerified(req)) {
            res.sendStatus(404);
            return;
        } else {
            console.log(req.body);
            const {
                user_id
            } = req.body;
            message.postOutMessage(user_id);
        }
        res.sendStatus(200);
    }
}
module.exports.run = function(req, res) {
    handleEvents(req, res);
}