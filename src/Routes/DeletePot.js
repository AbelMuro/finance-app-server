const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');


router.delete('/delete_pot/:id', async (req, res) => {
    const userId = req.cookies.userId;
    const potId = req.params.id;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }


    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        let allPots = metadata.pots || [];

        allPots = allPots.filter((pot) => {
            return pot.potId !== potId 
        })

        await management.users.update({id: userId}, {
            user_metadata: {pots: allPots}
        })

        res.status(200).send('Pot has been successfully deleted');
    }
    catch(error){
        const message = error.message;
        res.status(500).send(message);
    }
});

module.exports = router;