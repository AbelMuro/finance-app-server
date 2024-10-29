const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');

router.get('/get_transactions', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const allBudgets = metadata.budgets || [];

        const allTransactions = allBudgets.reduce((acc, budgets) => {
            return [...acc, ...budgets.transactions]
        }, []);

        res.status(200).json(allTransactions);
    }
    catch(error){
        res.status(500).send(`${error.message}`);
    }
});

module.exports = router;