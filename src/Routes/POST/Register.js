const express = require('express');
const router = express.Router();
const {auth0} = require('../../Config/Auth0.js');

router.post('/register', async (req, res) => {
    const {email, name, password} = req.body;


    try{
        await auth0.database.signUp({
            connection: 'finance-app-authentication-database',
            email,
            password,
            user_metadata: {
                name: name,
            }
        });

        res.status(200).send('Account has been registered');
    }
    catch(error){
        res.status(400).send(`${error.message} ${email} ${name} ${password}`);
    }
});

module.exports = router;