require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();

const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
};

app.use(bodyParser.urlencoded({
    verify: rawBodyBuffer,
    extended: true
}));
app.use(bodyParser.json({
    verify: rawBodyBuffer
}));

routes.use(app);

const server = app.listen(process.env.PORT || 80, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});