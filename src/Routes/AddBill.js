const express = require('express');
const router = express.Router();
const {management} = require('../Config/Auth0.js');
const upload = require('../Config/S3Mutler.js');

router.post('/add_bill', upload.single('image'), async (req, res) => {
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

module.exports = router;
