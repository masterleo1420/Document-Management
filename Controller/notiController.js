const { TSM_EN, TSM_MASTER } = require("../libs/dbconfig/dbconfig.js");
const { getPool } = require('../middleware/poolManger.js');

const notification = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);

        // Count Project Not Finish
        let projects = await pool.request().query(`SELECT COUNT(ProjectID) AS ProjectCount
        FROM [logProject] a
        WHERE (a.ProjectStatus != 4 OR a.ConcludePartStatus != 2) AND Active = 1;
        `);
        let ppcs = await pool.request().query(`SELECT COUNT(CASE WHEN a.PPCStatus NOT IN (5,6) AND Active = 1 THEN a.PPCID END) AS PCCnoti,
        COUNT(CASE WHEN (b.CustomerConfirmation = 2 OR b.CustomerConfirmation IS NULL) AND a.PPCStatus NOT IN (5,6) AND Active = 1 THEN a.PPCID END) AS ExternalCount
        FROM [logPPC] a 
        LEFT JOIN [logPPCReply] b ON a.PPCID = b.PPCID`);
        let ecns = await pool.request().query(`SELECT COUNT(ECNID) as ECNNoti FROM logECN WHERE ECNStatus NOT IN (3,4) AND Active = 1`);
        res.json({ Project: projects.recordset, PPC: ppcs.recordset, ECN: ecns.recordset });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}

module.exports = { notification };