const express = require('express');
const router = express.Router();
const {management} = require('../../Config/Auth0.js');

router.post('/add_pot', async (req, res) => {
    const userId = req.cookies.userId;
    const newPot = req.body;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const allPots = metadata.pots || [];

        await management.users.update({id: userId}, {
            user_metadata: {pots: [newPot, ...allPots]}
        });

        res.status(200).send('Pot successfully saved in database')
    }
    catch(error){
        const message = error.message;
        res.status(500).send(message);
    }

});

module.exports = router;
