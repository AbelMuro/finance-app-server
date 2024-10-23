const express = require('express');
const cors = require('cors');
const { AuthenticationClient, ManagementClient } = require('auth0');
const { config } = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mutlerS3 = require('multer-s3');
const aws = require('aws-sdk');
const app = express();                                        //creating an object that represents the main app
const port = 4000;
config();

app.use(cookieParser());

app.use(bodyParser.json());

app.use(cors({
    origin: 'http://localhost:3000',						                        //Access-Control-Allow-Origin
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', ''],			                    //Access-Control-Allow-Headers
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 200
}))

const management = new ManagementClient({
    domain: process.env.MACHINE_DOMAIN,
    clientId: process.env.MACHINE_CLIENT_ID,
    clientSecret: process.env.MACHINE_CLIENT_SECRET
})

const auth0 = new AuthenticationClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

const s3 = new aws.S3({
    region: 'us-west-1',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    signatureVersion: process.env.SIGNATURE_VERSION,
});

const upload = multer({
    storage: mutlerS3({
        s3: s3,
        bucket: 'personal-finance-app',
        key: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    })
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try{
        const account = await auth0.oauth.passwordGrant({
            username: email,
            password: password,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            realm: process.env.AUTH0_REALM,
            scope: 'openid profile email'
        });
        const access_token = account.data.access_token;
        const userId = jwt.decode(access_token).sub;

        res.cookie('userId', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',      // Use secure cookies in production
            sameSite: 'Strict',
            maxAge: 1000 * 60 * 60,
        });
    
        res.cookie('accessToken', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',      // Use secure cookies in production
            sameSite: 'Strict',
            maxAge: 1000 * 60 * 60,
        })

        res.status(200).send('Login Successfull');
    }
    catch(error){
        res.status(400).json({error: error.message});
    }
})


app.post('/register', async (req, res) => {
    const {email, name, password} = req.body;

    try{
        await auth0.database.signUp({
            connection: 'finance-app-authentication-database',
            email,
            password,
            user_metadata: {
                name: name
            }
        });

        res.status(200).send('Account has been registered');
    }
    catch(error){
        res.status(400).json({error: error.message});
    }
})


app.get('/profile', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }


    try{
       const profile = await management.users.get({id: userId});
       res.status(200).json({profile}); 
    }
    catch(error){
        console.log(error);
        res.status(500).json({error});
    }
});


app.get('/get_allData', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }
    
    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};

        res.status(200).json(metadata);        
    }
    catch(error){
        res.status(500).send(`${error.message}`);
    }
})

app.post('/add_budget', async (req, res) => {
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

app.get('/get_budgets', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }


    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const data = userData.user_metadata || {};
        const budgets = data.budgets || [];
        res.status(200).json(budgets);
    }
    catch(error){
        res.status(500).send(`${error.message}`)
    }
})


app.put('/edit_budget', async (req, res) => {
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

app.delete('/delete_budget/:id', async (req, res) => {
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


app.post('/add_transaction', upload.single('image'), async (req, res) => {
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
                if(transaction.plusOrMinus === '+')
                    newTotalSpent = budget.totalSpent + transaction.amount;
                else{
                    newTotalSpent = budget.totalSpent - transaction.amount;
                    if(newTotalSpent < 0){
                        amountIsBelowZero = true;
                        return budget;
                    }
                }
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
            res.status(403).send("This transaction will make the new budget amount drop below zero");
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

app.get('/get_transactions', async (req, res) => {
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
})

app.post('/add_pot', async (req, res) => {
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

app.get('/get_pots', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const allPots = metadata.pots || [];

        res.status(200).json(allPots);
    }
    catch(error){   
        const message = error.message
        res.status(500).send(message);
    }
});

app.put('/edit_pot', async (req, res) => {
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
})

app.delete('/delete_pot/:id', async (req, res) => {
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

app.post('/add_bill', upload.single('image'), async (req, res) => {
    const userId = req.cookies.userId;
    const imageURL = req.file?.location;

    if(!userId){
        res.status(401).send('user has been logged out');
        return;
    }


    const newBill = {
        id: req.body.id,
        title: req.body.title,
        dueDate: req.body.dueDate,
        amountDue: Number(req.body.amountDue),
        image: imageURL ? imageURL : '',
        order: Number(req.body.order)
    }

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        let allBills = metadata.bills || [];
        allBills.push(newBill);

        await management.users.update({id: userId}, {
            user_metadata: {bills: allBills}
        });

        res.status(200).send('Bill has been successfully added');
    }
    catch(error){
        const message = error.message;
        res.status(500).send(`${message}`);
    }

});

app.get('/get_bills', async (req, res) => {
    const userId = req.cookies.userId;

    if(!userId){
        res.status(401).send('user has been logged out');
        return;
    }
    
    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        let allBills = metadata.bills || [];

        res.status(200).json(allBills);
    }
    catch(error){
        const message = error.message;

        res.status(500).send(`${message}`);
    }
})

app.get('/', (req, res) => {
    res.send('Hello World')
})


app.listen(port, (error) => {
    if(error){
        console.log(error, 'error occured');
        return;
    }
    console.log(`Server is running on port ${port}`);
}); 