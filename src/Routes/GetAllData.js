const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');


router.get('/get_allData', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }
    
    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};

        res.status(200).json(metadata);        
    }
    catch(error){
        res.status(500).send(`${error.message}`);
    }
})


module.exports = router;