const cron = require('node-cron');
const { getPool } = require('./poolManger.js');
const MiddlewareSendMail = require('./sendMail.js');
const { TSM_EN } = require("../libs/dbconfig/dbconfig.js");

const alertOverdue = async () => { // Handle Alert
    try {
        let pool = await getPool('EnPool', TSM_EN);

        let currDate = new Date();
        if(currDate.getHours() < 8){
            currDate.setDate(currDate.getDate() - 1);
        }
        let currDateStr = `${currDate.getFullYear()}-${currDate.getMonth()+1}-${currDate.getDate()}`;
        let getOverdues = await pool.request().query(`
        DECLARE @DayNoBfDue INT;
        SELECT @DayNoBfDue = DayNoBfDue FROM [ConfigAlertOvedue];

        SELECT a.RefCode, a.SecRequest, a.Subject,
        CONVERT(NVARCHAR, b.RequestDate, 23) AS RequestDate,
        CONVERT(NVARCHAR, a.PlanImprementDate, 23) AS PlanImprementDate,
        e.CustomerName, e.Model, d.PartCode, d.PartName, c.CustomerConfirmation,
        a.PPCStatus
        FROM [logPPC] a
        LEFT JOIN [logPPCRequest] b ON b.PPCID = a.PPCID
        LEFT JOIN [logPPCReply] c ON c.PPCID = a.PPCID
        LEFT JOIN [logPart] d ON d.ProjectPartID = a.ProjectPartID
        LEFT JOIN [logProject] e ON e.ProjectID = d.ProjectID
        WHERE a.PPCStatus NOT IN (5,6) AND a.PlanImprementDate < DATEADD(DAY, @DayNoBfDue, '${currDateStr}');

        SELECT EmailAlert FROM [ConfigAlertOvedue];
        `);
        let overdues = [];
        let PPCStatusMap = { 1: 'Issue', 2: 'EN Reply', 3: 'Wait Approve', 4: 'Approve', 5: 'Complete', 6: 'Not Approve' };
        for(let item of getOverdues.recordset){
            let PPCStatus = PPCStatusMap[item.PPCStatus];
            let CustomerConfirm = !item.CustomerConfirmation ? '-' : (item.CustomerConfirmation == 1 ? 'Internal' : 'External');
            overdues.push(`
                <tr>
                    <td>${item.RefCode || '-'}</td>
                    <td>${CustomerConfirm}</td>
                    <td>${item.CustomerName || '-'}</td>
                    <td>${item.Model || '-'}</td>
                    <td>${item.PartCode || '-'}</td>
                    <td>${item.PartName || '-'}</td>
                    <td>${item.Subject || '-'}</td>
                    <td>${item.SecRequest || '-'}</td>
                    <td>${item.RequestDate || '-'}</td>
                    <td>${item.PlanImprementDate || '-'}</td>
                    <td>${PPCStatus}</td>
                </tr>
            `);
        }
        let emailReceivers = JSON.parse(getOverdues.recordsets[1][0].EmailAlert) || [];
        let emailReceiversStr = emailReceivers.join(',');

        let html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
                <h3>Overdue PPC List</h3>
                <div class="table-responsive">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>RefCode</th>
                                <th>Internal/External</th>
                                <th>Customer</th>
                                <th>Model</th>
                                <th>PartCode</th>
                                <th>PartName</th>
                                <th>Subject</th>
                                <th>Request Department</th>
                                <th>Request Date</th>
                                <th>Plan To Imprement</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody >
                            ${overdues.join('')}
                        </tbody>
                    </table>
                </div>
                <style>
                    table, th, td {
                        border: 1px solid black;
                        border-collapse: collapse;
                    }
                </style>
            </body>
        </html>
        `;
        MiddlewareSendMail({ to: emailReceiversStr, subject: 'PPC Overdue', html: html });
    } catch (err) {
        console.log('alertShot', err);
    }
}

cron.schedule('0 8 * * *', async () => { // Alert Email
    try {
        let stDate = new Date();
        console.log('alert Overdue', `${stDate.getFullYear()}-${stDate.getMonth() + 1}-${stDate.getDate()} ${stDate.getHours()}:${stDate.getMinutes()}:${stDate.getSeconds()}`);
        alertOverdue();
        let fnDate = new Date();
        console.log('finish alert Overdue', `${fnDate.getFullYear()}-${fnDate.getMonth() + 1}-${fnDate.getDate()} ${fnDate.getHours()}:${fnDate.getMinutes()}:${fnDate.getSeconds()}`);
    } catch (error) {
        console.log();
    }
})