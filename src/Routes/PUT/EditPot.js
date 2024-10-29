const express = require('express');
const router = express.Router();
const {management} = require('../../Config/Auth0.js');

router.put('/edit_pot', async (req, res) => {
    const userId = req.cookies.userId;
    const editPot = req.body;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        let allPots = metadata.pots || [];

        allPots = allPots.map((pot) => {
            if(pot.potId === editPot.potId)
                return {...pot, ...editPot};
            else
                return pot;
        });

        await management.users.update({id: userId},{
            user_metadata: {pots: allPots}
        });

        res.status(200).send('pot has been successfully edited');
    }
    catch(error){
        const message = error.message;
        res.status(500).send(message)
    }
});

module.exports = router;