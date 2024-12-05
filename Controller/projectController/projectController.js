const { TSM_EN, TSM_MASTER } = require("../../libs/dbconfig/dbconfig.js");
const { getPool } = require('../../middleware/poolManger.js');
const MiddlewareSendMail = require('../../middleware/sendMail.js');
require(`dotenv`).config();
const { IP_SERVER, PORT } = process.env;

//* Project List
const getProjects = async (req, res) => { // default 1000 record,  get more data to use instread of getProject
    try {
        let pool = await getPool('EnPool', TSM_EN);
        let { IssueMonth, IssueYear } = req.body;
        let filterMonth = IssueMonth ? `WHERE MONTH(IssueDate) = ${IssueMonth}` : '';
        let filterYear = IssueYear ? `AND YEAR(IssueDate) = ${IssueYear}` : '';
        let top = IssueMonth || IssueYear ? '' : 'TOP(1000)';
        let projects = await pool.request().query(`WITH cte AS (
			SELECT b.ProjectID,COUNT(a.ProjectPartID) AS TotalPart  FROM [logPart] a
			LEFT JOIN [logProject] b ON a.ProjectID = b.ProjectID
			WHERE a.Active != 0 
			GROUP BY b.ProjectID
		)
			SELECT ${top} ROW_NUMBER() OVER(ORDER BY a.ProjectID DESC) AS ItemNo,
        a.ProjectID, a.CustomerName, a.Model, a.RefCode, a.ReviseNo, a.IssueDate,
        a.ProjectStatus, a.ConcludePartStatus, a.SendEmail,
        b.FirstName AS IssueBy, a.IssueSignTime,
        c.FirstName AS CheckBy, a.CheckSignTime,
        d.FirstName AS ApproveBy, a.ApproveSignTime,
        e.FirstName AS SopApproveBy, a.SopApproveSignTime,
        a.Active,a.SOPDate,g.TotalPart
        FROM  [logProject] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.IssueBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.CheckBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] d ON d.UserID = a.ApproveBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] e ON e.UserID = a.SopApproveBy
		LEFT JOIN [cte] g ON g.ProjectID = a.ProjectID
        ${filterMonth} ${filterYear};
        `);
        for(let item of projects.recordset){
            item.IssueBy = item.IssueBy ? atob(item.IssueBy) : '';
            item.CheckBy = item.CheckBy ? atob(item.CheckBy) : '';
            item.ApproveBy = item.ApproveBy ? atob(item.ApproveBy) : '';
            item.SopApproveBy = item.SopApproveBy ? atob(item.SopApproveBy) : '';
        }
        res.json(projects.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const getProject = async (req, res) => { //deprecated
    try {
        let { ProjectID } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'Bad Request' });
        let pool = await getPool('EnPool', TSM_EN);
        let project = await pool.request().query(`SELECT ROW_NUMBER() OVER(ORDER BY a.ProjectID DESC) AS ItemNo,
        a.ProjectID, a.ProjectStatus, a.ConcludePartStatus,
        a.CustomerName, a.Model, a.RefCode, a.IssueDate, a.ReviseNo,
        b.FirstName AS IssueBy, a.IssueSignTime,
        c.FirstName AS CheckBy, a.CheckSignTime,
        d.FirstName AS ApproveBy, a.ApproveSignTime,
        e.FirstName AS SopApproveBy, a.SopApproveSignTime, a.SendEmail,a.SOPDate
        FROM [logProject] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.IssueBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.CheckBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] d ON d.UserID = a.ApproveBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] e ON e.UserID = a.SopApproveBy
        WHERE a.Active = 1 AND a.ProjectID = ${ProjectID};
        `);
        if(project.recordset.length){
            project.recordset[0].IssueBy = project.recordset[0].IssueBy ? atob(project.recordset[0].IssueBy) : '';
            project.recordset[0].CheckBy = project.recordset[0].CheckBy ? atob(project.recordset[0].CheckBy) : '';
            project.recordset[0].ApproveBy = project.recordset[0].ApproveBy ? atob(project.recordset[0].ApproveBy) : '';
            project.recordset[0].SopApproveBy = project.recordset[0].SopApproveBy ? atob(project.recordset[0].SopApproveBy) : '';
        }
        res.json(project.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const addProject = async (req, res) => {
    try {
        let { CustomerName, Model, IssueBy, IssueSignTime,SOPDate } = req.body;
        if(!CustomerName) return res.status(400).send({ message: 'กรุณาเลือก Customer' });
        if(!Model) return res.status(400).send({ message: 'กรุณากรอก Model' });
        if(!SOPDate) return res.status(400).send({ message: 'กรุณากรอก SOPDate' });
        if(!IssueBy) return res.status(400).send({ message: 'กรุณาลงชื่อ IssueBy' });
        let pool = await getPool('EnPool', TSM_EN);

        // ประกาศ Production Date
        let curDate = new Date();
        if(curDate.getHours() < 8){
            curDate.setDate(curDate.getDate() - 1);
        }
        let curMonth = curDate.getMonth() + 1;
        let curYear = curDate.getFullYear();

        // จัดการ Running No. สร้าง RefCode
        let runningNo = await pool.request().query(`SELECT PJRunningNo
        FROM [MstRunningNum]
        WHERE MONTH(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear}
        `);
        let pjRunningNo;
        if(runningNo.recordset.length){
            pjRunningNo = runningNo.recordset[0].PJRunningNo + 1;
            await pool.request().query(`UPDATE [MstRunningNum] SET PJRunningNo = ${pjRunningNo} WHERE Month(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear};`);
        } else{
            pjRunningNo = 1;
            await pool.request().query(`INSERT INTO [MstRunningNum](MonthYear, PJRunningNo) VALUES('${curYear}-${curMonth}-1', 1)`);
        }
        let RefCode = `EN-${curYear.toString().slice(-2)}${('00'+curMonth).slice(-2)}${('000'+pjRunningNo).slice(-3)}`;

        // insert statement
        let insertProject = `INSERT INTO [logProject](CustomerName, Model, RefCode, IssueBy, IssueSignTime,SOPDate)
        VALUES(N'${CustomerName}', N'${Model}', '${RefCode}', ${IssueBy}, '${IssueSignTime}', '${SOPDate}');
        `;
        await pool.request().query(insertProject);
        res.json({ message: 'เพิ่มรายการ Project สำเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const editProject = async (req, res) => {
    try {
        let { ProjectID, CustomerName, Model,SOPDate } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        if(!CustomerName) return res.status(400).send({ message: 'กรุณาเลือก Customer' });
        if(!Model) return res.status(400).send({ message: 'กรุณากรอก Model' });
        if(!SOPDate) return res.status(400).send({ message: 'กรุณากรอก SOPDate' });
        let pool = await getPool('EnPool', TSM_EN);
        let updateProject = `UPDATE [logProject] SET CustomerName = N'${CustomerName}', Model = N'${Model}', ReviseNo = ISNULL(ReviseNo,0) + 1,SOPDate = '${SOPDate}' WHERE ProjectID = ${ProjectID};`;
        await pool.request().query(updateProject);
        res.json({ message: 'แก้ไขรายการ Project สำเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const deleteProject = async (req, res) => { // complete แล้วลบไม่ได้
    try {
        let { ProjectID } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        let pool = await getPool('EnPool', TSM_EN);
        let deleteResult = await pool.request().query(`DECLARE @ProjectStatus INT;
        SELECT @ProjectStatus = ProjectStatus FROM [logProject] WHERE ProjectID = ${ProjectID};

        IF(@ProjectStatus = 4)
        BEGIN
            SELECT 0 AS Result;
        END
        ELSE
        BEGIN
            UPDATE [logProject] SET Active = 0 WHERE ProjectID = ${ProjectID};
            SELECT 1 AS Result;
        END
        `);
        let result = deleteResult.recordset[0].Result;
        if(result === 0) return res.status(400).send({ message: 'SOP แล้วไม่สามารถลบ Project นี้ได้' });
        res.json({ message: 'ลบรายการ Project สำเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const SendEmailProject = async (req, res) => { // store email that used to send(no over write just push new email)
    try {
        let { ProjectID, SendEmail } = req.body;

        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        if(!SendEmail.length) return res.status(400).send({ message: 'กรุณากรอก Email ผู้รับ' });
        let pool = await getPool('EnPool', TSM_EN);

        let project = await pool.request().query(`SELECT RefCode, CustomerName, Model, ReviseNo, SendEmail AS OldEmail,SOPDate FROM [logProject] WHERE ProjectID = ${ProjectID};`);
        let { RefCode, CustomerName, Model, ReviseNo, OldEmail,SOPDate } = project.recordset[0];
        let SendEmailStr = SendEmail.join(', ');
        let html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #000;">EN Project</h3>
                    <div style="margin-bottom: 20px;">
                        <div style="margin-bottom: 10px; color: #000;"><b>Ref Code</b>: ${RefCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>ReviseNo</b>: ${ReviseNo}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>SOPDate</b>: ${SOPDate}</div>
                        <div>
                            <a href="http://${IP_SERVER}:${PORT}/?ProjectID=${ProjectID}" target="_blank" style="color: #007bff; text-decoration: none;">Project Link</a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                        <label style="font-weight: bold; color: #000;">Remark</label>
                        <p style="margin: 0; color: #000;">กรุณาตรวจสอบและตอบกลับผ่านลิงค์ด้านบน</p>
                    </div>
                </div>
            </body>
        </html>
        `;
        MiddlewareSendMail({ to: SendEmailStr, subject: 'Project Management', html: html });

        // Update SendEmail
        OldEmail = JSON.parse(OldEmail) || [];
        for(let item of SendEmail){
            let filter = OldEmail.findIndex(email => email == item);
            if(filter == -1) OldEmail.push(item);
        }
        let updateSendEmail = `UPDATE [logProject] SET SendEmail = '${JSON.stringify(OldEmail)}' WHERE ProjectID = ${ProjectID};`;
        console.log(updateSendEmail);
        await pool.request().query(updateSendEmail);
        res.json({ message: 'ส่ง Email สําเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Sever Error' });
    }
}
const getRefCode = async (req, res) => {
    try {
        // ประกาศ Production Date
        let curDate = new Date();
        if(curDate.getHours() < 8){
            curDate.setDate(curDate.getDate() - 1);
        }
        let curMonth = curDate.getMonth() + 1;
        let curYear = curDate.getFullYear();

        // จัดการ Running No. สร้าง RefCode
        let runningNo = await pool.request().query(`SELECT PJRunningNo
        FROM [MstRunningNum]
        WHERE MONTH(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear}
        `);
        let pjRunningNo;
        if(runningNo.recordset.length){
            pjRunningNo = runningNo.recordset[0].PJRunningNo + 1;
        } else{
            pjRunningNo = 1;
        }
        let RefCode = `EN-${curYear.toString().slice(-2)}${('00'+curMonth).slice(-2)}${('000'+pjRunningNo).slice(-3)}`;
        res.json({ RefCode });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Internal Sever Error' });
    }
}


//* Sign
const signIssue = async (req, res) => {
    try {
        let { ProjectID, Username, Password, IssueSignTime } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });

        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let project = await pool.request().query(`SELECT IssueBy, CheckBy FROM [logProject] WHERE ProjectID = ${ProjectID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!project.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if(project.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let OldIssueBy = project.recordsets[0][0].IssueBy;
        let CheckBy = project.recordsets[0][0].CheckBy;
        let UserID = project.recordsets[1][0].UserID;

        if(CheckBy && OldIssueBy == UserID) return res.status(400).send({ message: 'ไม่สามารถ Unsign ได้ เนื่องจากมีการลงชื่อ Check แล้ว' });
        if(CheckBy && OldIssueBy != UserID) return res.status(400).send({ message: 'ไม่สามารถลงชื่อใหม่ได้ เนื่องจากมีการลงชื่อ Check แล้ว' });

        // Update Statement
        let IssueBy = UserID == OldIssueBy ? null : UserID;
        IssueSignTime = UserID == OldIssueBy ? null : `'${IssueSignTime}'`;
        let updateIssueBy = `UPDATE [logProject] SET IssueBy = ${IssueBy}, IssueSignTime = ${IssueSignTime} WHERE ProjectID = ${ProjectID};`;
        await pool.request().query(updateIssueBy);

        let name = !IssueBy ? '' : atob(project.recordsets[1][0].FirstName);
        let signTime = !IssueBy ? '' : IssueSignTime;
        let message = !IssueBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
const signCheck = async (req, res) => {
    try {
        let { ProjectID, Username, Password, CheckSignTime } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let project = await pool.request().query(`SELECT IssueBy, CheckBy, ApproveBy FROM [logProject] WHERE ProjectID = ${ProjectID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!project.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if(project.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let IssueBy = project.recordsets[0][0].IssueBy;
        let OldCheckBy = project.recordsets[0][0].CheckBy;
        let ApproveBy = project.recordsets[0][0].ApproveBy;
        let UserID = project.recordsets[1][0].UserID;
        if(!IssueBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Issue ก่อน' });
        if(ApproveBy && OldCheckBy == UserID) return res.status(400).send({ message: 'ไม่สามารถ Unsign ได้ เนื่องจากมีการลงชื่อ Approve แล้ว' });
        if(ApproveBy && OldCheckBy != UserID) return res.status(400).send({ message: 'ไม่สามารถลงชื่อใหม่ได้ เนื่องจากมีการลงชื่อ Approve แล้ว' });

        // Declare UserID and Update Statement
        let CheckBy = UserID == OldCheckBy ? null : UserID;
        CheckSignTime = UserID == OldCheckBy ? null : `'${CheckSignTime}'`;
        let ProjectStatus = !CheckBy ? 1 : 2;
        let updateCheckBy = `UPDATE [logProject] SET CheckBy = ${CheckBy}, CheckSignTime = ${CheckSignTime}, ProjectStatus = ${ProjectStatus} WHERE ProjectID = ${ProjectID};`;
        await pool.request().query(updateCheckBy);

        let name = !CheckBy ? '' : atob(project.recordsets[1][0].FirstName);
        let signTime = !CheckBy ? '' : CheckSignTime;
        let message = !CheckBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
const signApprove = async (req, res) => {
    try {
        let { ProjectID, Username, Password, ApproveSignTime } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let project = await pool.request().query(`SELECT CheckBy, ApproveBy, SopApproveBy FROM [logProject] WHERE ProjectID = ${ProjectID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!project.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if(project.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let CheckBy = project.recordsets[0][0].CheckBy;
        let OldApproveBy = project.recordsets[0][0].ApproveBy;
        let SopApproveBy = project.recordsets[0][0].SopApproveBy;
        let UserID = project.recordsets[1][0].UserID;
        if(!CheckBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Check ก่อน' });
        if(SopApproveBy && OldApproveBy == UserID) return res.status(400).send({ message: 'ไม่สามารถ Unsign ได้ เนื่องจากมีการลงชื่อ SOP Approve แล้ว' });
        if(SopApproveBy && OldApproveBy != UserID) return res.status(400).send({ message: 'ไม่สามารถลงชื่อใหม่ได้ เนื่องจากมีการลงชื่อ SOP Approve แล้ว' });

        // Declare UserID and Update Statement
        let ApproveBy = UserID == OldApproveBy ? null : UserID;
        ApproveSignTime = UserID == OldApproveBy ? null : `'${ApproveSignTime}'`;
        let ProjectStatus = !ApproveBy ? 2 : 3;
        let updateApproveBy = `UPDATE [logProject] SET ApproveBy = ${ApproveBy}, ApproveSignTime = ${ApproveSignTime}, ProjectStatus = ${ProjectStatus} WHERE ProjectID = ${ProjectID};`;
        await pool.request().query(updateApproveBy);

        let name = !ApproveBy ? '' : atob(project.recordsets[1][0].FirstName);
        let signTime = !ApproveBy ? '' : ApproveSignTime;
        let message = !ApproveBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
const signSopApprove = async (req, res) => {
    try {
        let { ProjectID, Username, Password, SopApproveSignTime } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let project = await pool.request().query(`SELECT ApproveBy, SopApproveBy FROM [logProject] WHERE ProjectID = ${ProjectID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!project.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if(project.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let ApproveBy = project.recordsets[0][0].ApproveBy;
        let OldSopApproveBy = project.recordsets[0][0].SopApproveBy;
        let UserID = project.recordsets[1][0].UserID;
        if(!ApproveBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Approve ก่อน' });

        // Declare UserID and Update Statement
        let SopApproveBy = UserID == OldSopApproveBy ? null : UserID;
        SopApproveSignTime = UserID == OldSopApproveBy ? null : `'${SopApproveSignTime}'`;
        let ProjectStatus = !SopApproveBy ? 3 : 4;
        let updateSopApprove = `UPDATE [logProject] SET SopApproveBy = ${SopApproveBy}, SopApproveSignTime = ${SopApproveSignTime}, ProjectStatus = ${ProjectStatus} WHERE ProjectID = ${ProjectID};`;
        await pool.request().query(updateSopApprove);

        let name = !SopApproveBy ? '' : atob(project.recordsets[1][0].FirstName);
        let signTime = !SopApproveBy ? '' : SopApproveSignTime;
        let message = !SopApproveBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
const checkUser = async (req, res) => {
    try {
        let { Username, Password, SignTime } = req.body;
        let pool = await getPool('MasterPool', TSM_MASTER);
        let user = await pool.request().query(`SELECT * FROM [User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);
        if(!user.recordset.length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if(user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({ message: 'ไม่มีสิทธิ์ลงชื่อเข้าใช้งาน' });
        if(user.recordset.length){
            user.recordset[0].FirstName = !user.recordset[0].FirstName ? null: atob(user.recordset[0].FirstName);
            user.recordset[0].SignTime = SignTime;
        }
        res.json(user.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}

module.exports = {
    getProjects,
    getProject,
    addProject,
    editProject,
    deleteProject,
    SendEmailProject,
    getRefCode,
    signIssue,
    signCheck,
    signApprove,
    signSopApprove,
    checkUser,
};