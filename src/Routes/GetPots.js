const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');


router.get('/get_pots', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const allPots = metadata.pots || [];

        res.status(200).json(allPots);
    }
    catch(error){   
        const message = error.message
        res.status(500).send(message);
    }
});

module.exports = router;
