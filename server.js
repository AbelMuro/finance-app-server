const express = require('express');
const cors = require('cors');
const { AuthenticationClient, ManagementClient } = require('auth0');
const { config } = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const app = express();                                        //creating an object that represents the main app
const port = 4000;
config();

app.use(cookieParser());

app.use(bodyParser.json());

app.use(cors({
    origin: 'http://localhost:3000',						                        //Access-Control-Allow-Origin
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],			                    //Access-Control-Allow-Headers
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

    try{
       const profile = await management.users.get({id: userId});
       res.status(200).json({profile}); 
    }
    catch(error){
        console.log(error);
        res.status(403).json({error});
    }
});

app.post('/add_budget', async (req, res) => {
    const budget = req.body;
    const userId = req.cookies.userId;

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const metadata = userData.user_metadata || {};
        const prevBudgets = metadata.budgets || [];

        await management.users.update({id: userId}, {
            user_metadata: {budgets: [...prevBudgets, budget]}
        });
        res.status(200).send('profile updated successfully');        
    }
    catch(error){
        res.status(403).send(`${error.message}`);
    }
});

app.get('/get_budgets', async (req, res) => {
    const userId = req.cookies.userId;

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data || {};
        const data = userData.user_metadata || {};
        const budgets = data.budgets || [];
        res.status(200).json(budgets);
    }
    catch(error){
        res.status(403).send(`${error.message}`)
    }
})


//i will need to test out this endpoint
app.put('/edit_budget', async (req, res) => {
    const userId = req.cookies.userId;
    const budgetData = req.body;

    try{
        const user = await management.users.get({id: userId});
        const userData = user.data;
        const metadata = userData.user_metadata;
        let newBudgets = metadata.budgets;

        newBudgets = newBudgets.map((budget) => {
           return budget.id === budgetData.id ? [...budget, budgetData] : budget;
        });

        await management.users.update({id: userId}, {
            user_metadata: {budgets: newBudgets}
        });

        res.status(200).send('Budget successfully updated');
    }
    catch(error){
        res.status(403).send(`${error.message}`);
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