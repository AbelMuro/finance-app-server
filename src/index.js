const express = require('express');
const cors = require('cors');
const login = require('./Routes/POST/Login.js');
const register = require('./Routes/POST/Register.js');
const profile = require('./Routes/GET/Profile.js');
const getAllData = require('./Routes/GET/GetAllData.js');
const AddBudget = require('./Routes/POST/AddBudget.js');
const GetBudgets = require('./Routes/GET/GetBudgets.js');
const EditBudget = require('./Routes/PUT/EditBudget.js');
const DeleteBudget = require('./Routes/DELETE/DeleteBudget.js');
const AddTransaction = require('./Routes/POST/AddTransaction.js');
const GetTransactions = require('./Routes/GET/GetTransactions.js');
const GetPots = require('./Routes/GET/GetPots.js');
const AddPot = require('./Routes/POST/AddPot.js');
const EditPot = require('./Routes/PUT/EditPot.js');
const DeletePot = require('./Routes/DELETE/DeletePot.js');
const AddBill = require('./Routes/POST/AddBill.js');
const GetBills = require('./Routes/GET/GetBills.js');
const UpdateIncome = require('./Routes/POST/UpdateIncome.js');
const GetIncome = require('./Routes/GET/GetIncome');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { config } = require('dotenv');
const app = express();                                      
const port = 4000;

config();

app.use(cors({
    origin: 'https://personal-finance-app-front-end.netlify.app',						//Access-Control-Allow-Origin
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', ''],			                    //Access-Control-Allow-Headers
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 200
}))

app.use(cookieParser());

app.use(bodyParser.json());

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

app.use(UpdateIncome);

app.use(GetIncome);

app.get('/', (req, res) => {
    res.status(200).send('Hello World')
})


app.listen(process.env.PORT || port, (error) => {
    if(error){
        console.log(error, 'error occured');
        return;
    }
    console.log(`Server is running on port ${port}`);
}); 