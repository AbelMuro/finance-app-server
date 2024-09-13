const express = require('express');
const cors = require('cors');
const { AuthenticationClient, ManagementClient } = require('auth0');
const { config } = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();                                        //creating an object that represents the main app
const port = 4000;
config();

const auth0 = new AuthenticationClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

app.use(cookieParser());

app.use(bodyParser.json());

app.use(cors({
    origin: 'http://localhost:3000',						                        //Access-Control-Allow-Origin
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],			//Access-Control-Allow-Headers
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 200
}))



app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try{
        const account = await auth0.oauth.passwordGrant({
            username: email,
            password: password,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            realm: process.env.AUTH0_REALM
        });
        const accessToken = account.data.access_token;

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'None'
        });
        

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

//the problem here is that the cookies are returning undefined, i may need to do more research on cookies and fetch requests

app.get('/profile', async (req, res) => {
    const accessToken = req.cookies.accessToken;
    console.log(accessToken);

    res.status(200).json({accessToken: accessToken});
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