const express = require('express');
const router = express.Router();
const {management} = require('../../Config/Auth0.js');

router.put('/edit_budget', async (req, res) => {
    const userId = req.cookies.userId;
    const budgetData = req.body;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }
    try{
        const user = await management.users.get({id: userId});
        const userData = user.data;
        const metadata = userData.user_metadata;
        let allBudgets = metadata.budgets;

        allBudgets = allBudgets.map((budget) => {
           return budget.id === budgetData.id ? {...budget, ...budgetData} : budget;
        });

        await management.users.update({id: userId}, {
            user_metadata: {budgets: allBudgets}
        });

        res.status(200).send('Budget successfully updated');
    }
    catch(error){
        res.status(500).send(`${error.message}`);
    }
});

module.exports = router;