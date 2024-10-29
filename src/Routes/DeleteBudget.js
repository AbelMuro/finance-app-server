const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');


router.delete('/delete_budget/:id', async (req, res) => {
    const userId = req.cookies.userId;
    const budgetId = req.params.id;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    try{
        const budgets = await management.users.get({id: userId});
        const userData = budgets.data;
        const metadata = userData.user_metadata;
        let allBudgets = metadata.budgets;

        allBudgets = allBudgets.filter((currentBudget) => currentBudget.id !== budgetId);

        await management.users.update({id: userId}, {
            user_metadata: {budgets: allBudgets}
        });

        res.status(200).send('Budget successfully deleted')
    }
    catch(error){
        const message = error.message;
        res.status(500).send(`${message}`);
    }
});

module.exports = router;