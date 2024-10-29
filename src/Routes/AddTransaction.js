const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');
const upload = require('../Config/S3Mutler.js');


router.post('/add_transaction', upload.single('image'), async (req, res) => {
    const userId = req.cookies.userId;
    const imageURL = req.file?.location;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    const transaction = {
        recipient: req.body.recipient,
        transactionId: req.body.transactionId,
        category: req.body.category,
        amount: Number(req.body.amount),
        plusOrMinus: req.body.plusOrMinus,
        image: imageURL ? imageURL : '',
        date: req.body.date,
        order: Number(req.body.order)
    };

    try{      
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const prevBudgets = metadata.budgets || [];
        let budgetExists = false;
        let budgetExceeded = false;
        let amountIsBelowZero = false;
        
        const newBudgets = prevBudgets.map((budget) => {
            if(budget.category === transaction.category){
                budgetExists = true;
                let newTotalSpent;
                if(transaction.plusOrMinus === '+'){
                    newTotalSpent = budget.totalSpent - transaction.amount;
                    if(newTotalSpent < 0){
                        amountIsBelowZero = true;
                        return budget;
                    }                    
                }
                else
                    newTotalSpent = budget.totalSpent + transaction.amount;
                if(newTotalSpent <= budget.limit)
                    return {...budget, totalSpent: newTotalSpent, transactions: [...budget.transactions, transaction]}
                else{
                    budgetExceeded = true;
                    return budget;
                }
            }
            else
                return budget;
        });

        if(!budgetExists || !prevBudgets.length){
            res.status(403).send('You must create a budget with the specified category');
            return; 
        }
        else if(budgetExceeded){
            res.status(403).send("Budget limit exceeded");
            return;
        }
        else if(amountIsBelowZero){
            res.status(403).send(`Adding this transaction to the specified budget/category will make the total-spent drop below zero`);
            return;
        }
        await management.users.update({id: userId}, {
            user_metadata: {budgets: newBudgets}
        });

        res.status(200).send('Transaction has been added to budget');
    }
    catch(error){
        console.log(error.message);
        res.status(500).send(`${error.message}`);
        
    }
});

module.exports = router;