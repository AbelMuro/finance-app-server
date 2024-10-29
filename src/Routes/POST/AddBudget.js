const express = require('express');
const router = express.Router();
const {management} = require('../../Config/Auth0.js');

router.post('/add_budget', async (req, res) => {
    const budget = req.body;
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }
    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const prevBudgets = metadata.budgets || [];

        await management.users.update({id: userId}, {
            user_metadata: {budgets: [budget, ...prevBudgets]}
        });
        res.status(200).send('profile updated successfully');        
    }
    catch(error){
        res.status(500).send(`${error.message}`);
    }
});


module.exports = router;