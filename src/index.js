const express = require('express');
const cors = require('cors');
const login = require('./Routes/Login.js');
const register = require('./Routes/Register.js');
const profile = require('./Routes/Profile.js');
const getAllData = require('./Routes/GetAllData.js');
const AddBudget = require('./Routes/AddBudget.js');
const GetBudgets = require('./Routes/GetBudgets.js');
const EditBudget = require('./Routes/EditBudget.js');
const DeleteBudget = require('./Routes/DeleteBudget.js');
const AddTransaction = require('./Routes/AddTransaction.js');
const GetTransactions = require('./Routes/GetTransactions.js');
const GetPots = require('./Routes/GetPots.js');
const AddPot = require('./Routes/AddPot.js');
const EditPot = require('./Routes/EditPot.js');
const DeletePot = require('./Routes/DeletePot.js');
const AddBill = require('./Routes/AddBill.js');
const GetBills = require('./Routes/GetBills.js');
const {ManagementClient } = require('auth0');
const { config } = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mutlerS3 = require('multer-s3');
const aws = require('aws-sdk');
const app = express();                                      
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

app.use(login);

app.use(register);

app.use(profile);

app.use(getAllData);

app.use(AddBudget);

app.use(GetBudgets);

app.use(EditBudget);

app.use(DeleteBudget);

app.use(AddTransaction);

app.use(GetTransactions);

app.use(AddPot);

app.use(GetPots);

app.use(EditPot);

app.use(DeletePot);

app.use(AddBill);

app.use(GetBills);


app.post('/update_income', async (req, res) => {
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

app.get('/get_income', async (req, res) => {
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