const { AuthenticationClient, ManagementClient } = require('auth0');
const { config } = require('dotenv');

config();

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


module.exports = {management, auth0};