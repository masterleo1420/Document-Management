const { TSM_MASTER, TSM_EN } = require("../libs/dbconfig/dbconfig.js");
const { getPool } = require('../middleware/poolManger.js');
const Redis = require('ioredis');
const redis = new Redis();
const DAY_SECONDS = 86400;

const dropdownCustomer = async (req, res) => { // cache
    try {
        let cacheCustomer = await redis.get('bom-dropdown-customer');
        if(!cacheCustomer){
            let pool = await getPool('masterPool', TSM_MASTER);
            let SelectCustomer = `SELECT * FROM [MasterCustomer] order by CustomerName`;
            let Customers = await pool.request().query(SelectCustomer);
            await redis.set('bom-dropdown-customer', JSON.stringify(Customers.recordset), "EX", DAY_SECONDS);
            return res.json(Customers.recordset);
        }
        res.json(JSON.parse(cacheCustomer));
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }
};
const dropdownDepartment = async (req, res) => { // cache
    try {
        let cacheDepartment = await redis.get('bom-dropdown-department');
        if(!cacheDepartment){
            let pool = await getPool('masterPool', TSM_MASTER);
            let departments = await pool.request().query(`SELECT DepartmentID,DepartmentName FROM [TSMolymer_F].[dbo].[MasterDepartment] WHERE Active = 1`);
            let filterDepartment = departments.recordset.filter(v => v.DepartmentID != 3);
            await redis.set('bom-dropdown-department', JSON.stringify(departments.recordset), "EX", DAY_SECONDS);
            return res.json(filterDepartment);
        }
        let filterDepartment = JSON.parse(cacheDepartment).filter(v => v.DepartmentID != 3);
        res.json(filterDepartment);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }
};
const dropdownEmail = async (req, res) => {
    try {
        let pool = await getPool('masterPool', TSM_MASTER);
        const querydropdown = `SELECT DISTINCT Email
        FROM [User] WHERE Email IS NOT NULL AND Email NOT IN ('NULL','');`;
        const result = await pool.request().query(querydropdown);
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }
};
const dropdownProject = async (req, res) => { // SOP แล้วเท่านั้น, BOM เก่า(SmartFac)
    try {
        let { CustomerName } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Project Status { 1: Issue, 2: Check, 3: Approve, 4: SOP Approve }
        let whereCustomerName = CustomerName ? `AND a.CustomerName = N'${CustomerName}'` : '';
        let whereCustomerNameBom = CustomerName ? `WHERE b.CustomerName = N'${CustomerName}'` : '';
        // let projects = await pool.request().query(`SELECT a.ProjectID, a.Model, a.CustomerName FROM [logProject] a
        // WHERE a.Active = 1 ${whereCustomerName} AND a.ProjectStatus = 4
        // `);
        let projects = await pool.request().query(`WITH tempUnion AS (
            SELECT a.Model, a.CustomerName FROM [logProject] a
            WHERE a.Active = 1 AND a.ProjectStatus = 4 ${whereCustomerName}
            UNION ALL
            SELECT a.Model, b.CustomerName
            FROM [TSMolymer_F].[dbo].[MasterReferenceNo] a
            LEFT JOIN [TSMolymer_F].[dbo].[MasterCustomer] b ON b.CustomerID = a.CustomerID
            ${whereCustomerNameBom}
        )
        SELECT DISTINCT Model, CustomerName
        FROM [tempUnion]
        `);
        res.json(projects.recordset);
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
};
const dropdownProjectPart = async (req, res) => { // Part Complete เท่านั้น, Project ต้อง SOP แล้ว, BOM เก่า(SmartFac)
    try {
        let { CustomerName, ProjectID, Model } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // ConcludePartStatus { 1: Pending, 2: Complete }
        // PartStatus { 1: Issue, 2: Check, 3: Approve, 4: Complete }

        // let whereCustomerName = CustomerName ? `AND b.CustomerName = N'${CustomerName}'` : '';
        // let whereProjectID = ProjectID ? `AND a.ProjectID = N'${ProjectID}'` : '';
        // let parts = await pool.request().query(`WITH cte AS (
        //     SELECT ROW_NUMBER() OVER (PARTITION BY a.RefID ORDER BY a.ProjectPartID DESC) AS RowNum, a.RefID,
        //     a.ProjectID, a.ProjectPartID, a.PartCode, a.PartName, a.DrawingRev, a.ReviseDate, a.ReceiveDate,
        //     a.DocName, a.DocFilePath, a.ReviseNo, a.PartStatus
        //     FROM [logPart] a
        //     LEFT JOIN [logProject] b ON b.ProjectID = a.ProjectID
        //     WHERE a.Active = 1 AND a.PartStatus = 3 AND b.ProjectStatus = 4 ${whereProjectID} ${whereCustomerName}
        // )
        // SELECT ProjectID, ProjectPartID, PartCode, PartName, DrawingRev, ReviseDate, ReceiveDate,
        // DocName, DocFilePath, ReviseNo, RefID, PartStatus
        // FROM [cte]
        // WHERE RowNum = 1
        // ORDER BY RefID DESC;
        // `);

        let whereCustomerName = CustomerName ? `AND b.CustomerName = N'${CustomerName}'` : '';
        let whereModel = Model ? `AND b.Model = N'${Model}'` : '';
        let whereModelBom = Model ? `AND a.Model = N'${Model}'` : '';
        let parts = await pool.request().query(`WITH tempEn AS (
            SELECT ROW_NUMBER() OVER (PARTITION BY a.RefID ORDER BY a.ProjectPartID DESC) AS RowNum, a.RefID,
            a.PartCode, a.PartName
            FROM [logPart] a
            LEFT JOIN [logProject] b ON b.ProjectID = a.ProjectID
            WHERE a.Active = 1 AND a.PartStatus = 3 AND b.ProjectStatus = 4 ${whereModel} ${whereCustomerName}
        ), tempBom AS (
            SELECT d.PartCode, d.PartName
            FROM [TSMolymer_F].[dbo].[MasterReferenceNo] a
            LEFT JOIN [TSMolymer_F].[dbo].[MasterCustomer] b ON b.CustomerID = a.CustomerID
            LEFT JOIN [TSMolymer_F].[dbo].[PartReferentNoHistory] c ON c.RefID = a.RefID
            LEFT JOIN [TSMolymer_F].[dbo].[MasterPart] d ON d.PartID = c.PartID
            WHERE 1 = 1 ${whereModelBom} ${whereCustomerName}
        ), tbsum AS (
            SELECT PartCode, PartName FROM [tempEn] WHERE RowNum = 1
            UNION ALL
            SELECT PartCode, PartName FROM [tempBom] WHERE PartCode IS NOT NULL AND PartName IS NOT NULL
        )
        SELECT DISTINCT PartCode, PartName FROM [tbsum]
        `);
        res.json(parts.recordset)
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
};
const dropdownProcess = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);
        const querydropdown = `SELECT DefaultID, DocumentName, TopicName, JsonData, Type FROM [MstDefault] WHERE TopicName = 'Process';`;
        const result = await pool.request().query(querydropdown);
        let resultJSON = result.recordset[0]?.JsonData ? JSON.parse(result.recordset[0].JsonData) : [];
        res.json(resultJSON);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }
};
const dropdownDefaults = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);
        const defaults = await pool.request().query(`SELECT DefaultID, DocumentName, TopicName FROM [MstDefault]`);
        res.json(defaults.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }
}

module.exports = {
    dropdownCustomer,
    dropdownDepartment,
    dropdownEmail,
    dropdownProject,
    dropdownProjectPart,
    dropdownProcess,
    dropdownDefaults
};
