const express = require('express');
const router = express.Router();
const {management} = require('../../Config/Auth0.js');

router.get('/get_income', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return;
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        let income = metadata.income || 0;

        res.status(200).json({income: income});
    }
    catch(error){
        const message = error.message;
        res.status(500).send(`${message}`);
    }
});

module.exports = router;