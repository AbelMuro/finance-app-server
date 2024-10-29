const express = require('express');
const router = express.Router();
const {management} = require('../../Config/Auth0.js');

router.post('/update_income', async (req, res) => {
    const userId = req.cookies.userId;
    const {income} = req.body;

    if(!userId){
        res.status(401).send('user has been logged out');
        return;
    }
    try{
        await management.users.update({id: userId}, {
            user_metadata: {income: income}
        })
        res.status(200).send('income has been updated')
    }
    catch(error){
        res.status(500).send('Internal server has occurred, please try again later');
    }
});


module.exports = router;