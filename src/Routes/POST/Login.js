const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {auth0} = require('../../Config/Auth0.js');
const { config } = require('dotenv');

config();

router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try{
        const account = await auth0.oauth.passwordGrant({
            username: email,
            password: password,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            realm: process.env.AUTH0_REALM,
            scope: 'openid profile email'
        });
        const access_token = account.data.access_token;
        const userId = jwt.decode(access_token).sub;

        res.cookie('userId', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',      // Use secure cookies in production
            sameSite: 'Strict',
            maxAge: 1000 * 60 * 60,
        });
    
        res.cookie('accessToken', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',      // Use secure cookies in production
            sameSite: 'Strict',
            maxAge: 1000 * 60 * 60,
        })

        res.status(200).send('Login Successfull');
    }
    catch(error){
        const message = error.message;

        if(message === 'Wrong email or password.')
            res.status(401).send(message);
        else
            res.status(500).json({error: error.message});
    }
})

module.exports = router;