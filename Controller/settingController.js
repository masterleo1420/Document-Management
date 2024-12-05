const { TSM_EN } = require("../libs/dbconfig/dbconfig.js");
const { getPool } = require('../middleware/poolManger.js');
const Redis = require('ioredis');
const redis = new Redis();
const DAY_SECONDS = 86400;

const getDefault = async (req, res) =>{ // cache
    try {
        let { TopicName } = req.body;
        let cacheDefaults = await redis.get('en-default');
        if(!cacheDefaults){
            let pool = await getPool('EnPool', TSM_EN);
            let defaults = await pool.request().query(`SELECT DefaultID, DocumentName, TopicName, JsonData, Type FROM [MstDefault]`);
            await redis.set('en-default', JSON.stringify(defaults.recordset), "EX", DAY_SECONDS);
            let filterDefault = defaults.recordset.filter(v => v.TopicName == TopicName);
            return res.json(filterDefault);
        }
        let filterDefault = JSON.parse(cacheDefaults).filter(v => (v.TopicName).toLowerCase() == TopicName.toLowerCase());
        res.json(filterDefault);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}
const editDefault = async (req, res) =>{
    try {
        let { DefaultID, JsonData } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        let updateDefault = `UPDATE [MstDefault] SET JsonData = N'${JsonData}' WHERE DefaultID = ${DefaultID};`;
        await pool.request().query(updateDefault);
        await redis.set('en-default', null, "EX", DAY_SECONDS);
        res.json({ message: 'Success' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}
const getOverdue = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);
        let overdue = await pool.request().query(`SELECT DayNoBfDue, EmailAlert FROM [ConfigAlertOvedue]`);
        res.json(overdue.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}
const editOverdue = async (req, res) =>{
    try {
        let { DayNoBfDue, EmailAlert } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        let updateOverdue = `UPDATE [ConfigAlertOvedue] SET DayNoBfDue = ${DayNoBfDue}, EmailAlert = '${EmailAlert}';`;
        await pool.request().query(updateOverdue);
        res.json({ message: 'Success' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}

module.exports = {
    getDefault,
    getOverdue,
    editDefault,
    editOverdue
}
