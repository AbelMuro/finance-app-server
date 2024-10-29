const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');

router.get('/profile', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }
    
    try{
       const profile = await management.users.get({id: userId});
       res.status(200).json({profile}); 
    }
    catch(error){
        console.log(error);
        res.status(500).json({error});
    }
});

module.exports = router;
