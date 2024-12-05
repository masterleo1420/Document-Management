require(`dotenv`).config();
const { SQL_USER, SQL_PASSWORD, SQL_SERVER, SQL_DATABASE , SQL_DATABASE_EN} = process.env;
const TSM_MASTER = {
    user: SQL_USER,
    password: SQL_PASSWORD,
    server: SQL_SERVER,
    database: SQL_DATABASE,
    options: {
        trustedConnection: true,
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
    },
};
const TSM_EN = {
    user: SQL_USER,
    password: SQL_PASSWORD,
    server: SQL_SERVER,
    database: SQL_DATABASE_EN,
    options: {
        trustedConnection: true,
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
    },
};
module.exports = {TSM_MASTER,TSM_EN}