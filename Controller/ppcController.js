require(`dotenv`).config();
const {
    TSM_MASTER,
    TSM_EN
} = require("../libs/dbconfig/dbconfig.js");
const {
    getPool
} = require('../middleware/poolManger.js');
const multer = require('multer');
const path = require('path');
const MiddlewareSendMail = require('../middleware/sendMail.js');
const PORT = process.env.PORT
const IP_SERVER = process.env.IP_SERVER
const { removeFile } = require('../middleware/fileManager.js');

//SECTION - Get PPC
//info logPPC

const getPPCS = async (req, res) => {
    try {
        let {
            CusConfirm,
            RequestMonth,
            RequestYear
        } = req.body
        let filterCusConfirm = CusConfirm ? `WHERE (CustomerConfirmation != 1 OR a.RefCode IS NUll)` : '';
        let filterRequestMonth = RequestMonth ? `AND MONTH(b.RequestDate) = ${RequestMonth}` : '';
        let filterRequestYear = RequestYear ? `AND YEAR(b.RequestDate) = ${RequestYear}` : '';
        if (CusConfirm == false) {
            filterRequestMonth = RequestMonth ? `WHERE MONTH(b.RequestDate) = ${RequestMonth}` : '';
            filterRequestYear = RequestYear ? `AND YEAR(b.RequestDate) = ${RequestYear}` : '';
        }
        let top = filterRequestMonth || filterRequestYear ? '' : `TOP(1000)`
        let pool = await getPool('EnPool', TSM_EN);
        const queryGetPPC = `SELECT ${top} ROW_NUMBER() OVER(ORDER BY a.PPCID DESC) AS No,a.PPCID, a.PPCStatus,a.RefCode,c.CustomerConfirmation,a.SecRequest,
            a.PlanImprementDate,a.Model,a.PartCode,a.PartName,a.CustomerName,b.RequestSignTime,c.ReplySignTime,d.ApprovePlanDate,e.CompleteDate,
            f.FirstName AS RequestBy,g.FirstName AS ReplyBy,a.Active, b.PPCReqID, c.PPCReplyID, d.PPCApproveID, e.PPCStartID
            FROM [logPPC] a
            LEFT JOIN [logPPCRequest] b ON a.PPCID = b.PPCID
            LEFT JOIN [logPPCReply] c ON a.PPCID = c.PPCID 
            LEFT JOIN [logPPCApprovePlan] d ON a.PPCID = d.PPCID
            LEFT JOIN [logPPCStart] e ON a.PPCID = e.PPCID
            LEFT JOIN [TSMolymer_F].[dbo].[User] f ON f.UserID = b.RequestBy
            LEFT JOIN [TSMolymer_F].[dbo].[User] g ON g.UserID = c.ReplyBy
            ${filterCusConfirm} ${filterRequestMonth} ${filterRequestYear};
        `;
        const resultPPC = await pool.request().query(queryGetPPC);
        for (item of resultPPC.recordset) {
            item.RequestBy = item.RequestBy ? atob(item.RequestBy) : '';
            item.ReplyBy = item.ReplyBy ? atob(item.ReplyBy) : '';
        }
        res.json(resultPPC.recordset);
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
//!SECTION
//logPPCRequest
const getRequest = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);
        let {
            PPCID
        } = req.body;
        const queryGetrequest = `SELECT a.PPCReqID, a.ChangeItem, a.RequestDate, a.Reason, a.EffectivePeriod, a.NewProcess, a.PreviousProcess, a.SendEmail,
		a.RequestSignTime, b.PartCode, b.PartName, b.Model, b.CustomerName, b.Subject, b.SecRequest, b.ProjectTrialDate, b.PlanImprementDate , c.FirstName AS RequestBy
		FROM [logPPCRequest] a
		LEFT JOIN [logPPC] b ON a.PPCID = b.PPCID
		LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.RequestBy
        WHERE a.PPCID = ${PPCID};
        `;
        let requestPPC = await pool.request().query(queryGetrequest);
        if (requestPPC.recordset.length) {
            requestPPC.recordset[0].RequestBy = requestPPC.recordset[0].RequestBy ? atob(requestPPC.recordset[0].RequestBy) : '';
        }
        res.json(requestPPC.recordset);
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
//Status 1 = Request
const addRequestPPC = async (req, res) => { // Customer, Model, PartCode เก็บ String
    try {
        let {
            Model,
            PartCode,
            PartName,
            CustomerName,
            SecRequest,
            Subject,
            ProjectTrialDate,
            PlanImprementDate,
            RequestDate,
            ChangeItem,
            Reason,
            EffectivePeriod,
            NewProcess,
            PreviousProcess,
            RequestBy,
            RequestSignTime
        } = req.body
        if (!SecRequest) return res.status(400).send({ message: 'กรุณาเลือก Request Department' });
        if (!Model) return res.status(400).send({ message: 'กรุณาเลือก Model' });
        if (!PartCode) return res.status(400).send({ message: 'กรุณาเลือก PartCode' });
        if (!PartName) return res.status(400).send({ message: 'กรุณาเลือก PartName' });
        if (!CustomerName) return res.status(400).send({ message: 'กรุณาเลือก CustomerName' });
        if (!RequestDate) return res.status(400).send({ message: 'กรุณากรอก RequestDate' });
        if (!Subject) return res.status(400).send({ message: 'กรุณากรอก Subject' });
        if (!ProjectTrialDate) return res.status(400).send({ message: 'กรุณากรอก Project Trial' });
        if (!PlanImprementDate) return res.status(400).send({ message: 'กรุณากรอก Plan Imprement' });
        if (EffectivePeriod[0] == '') return res.status(400).send({ message: ' กรุณาเลือก Effective Period' });
        if (!RequestBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Request By' });

        let pool = await getPool('EnPool', TSM_EN);
        let queryAddRequest = `DECLARE @PPCID int;
        INSERT INTO logPPC (SecRequest,Subject,ProjectTrialDate,PlanImprementDate,Model,PartCode,PartName,CustomerName)
        VALUES (N'${SecRequest}', N'${Subject}', '${ProjectTrialDate}', '${PlanImprementDate}', N'${Model}', N'${PartCode}', N'${PartName}', N'${CustomerName}');

        SET @PPCID = ( SELECT SCOPE_IDENTITY());
        INSERT INTO [logPPCRequest] (PPCID,RequestDate,ChangeItem,Reason,EffectivePeriod,NewProcess,PreviousProcess,RequestBy,RequestSignTime)
        VALUES (@PPCID,'${RequestDate}',N'${ChangeItem}',N'${Reason}',N'${EffectivePeriod}',N'${NewProcess}',N'${PreviousProcess}',${RequestBy},'${RequestSignTime}');
        INSERT INTO [logPPCReply] (PPCID) VALUES (@PPCID);
        INSERT INTO [logPPCApprovePlan] (PPCID) VALUES (@PPCID);
        INSERT INTO [logPPCStart] (PPCID) VALUES (@PPCID);
        `;
        await pool.request().query(queryAddRequest);
        res.json({
            message: "เพิ่มรายการ Request สําเร็จ"
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
const editRequestPPC = async (req, res) => { // Customer, Model, PartCode เก็บ String
    try {
        let pool = await getPool('EnPool', TSM_EN);
        let {
            PPCReqID,
            RequestDate,
            Subject,
            ProjectTrialDate,
            PlanImprementDate,
            ChangeItem,
            Reason,
            EffectivePeriod,
            NewProcess,
            PreviousProcess,
            SecRequest,
            PartCode,
            PartName,
            CustomerName,
            Model
        } = req.body;
        if (!PPCReqID) return res.status(400).send({ message: 'PPCReqID is required' });
        if (!SecRequest) return res.status(400).send({ message: 'กรุณากรอก SecRequest' });
        if (!Model) return res.status(400).send({ message: 'กรุณากรอก Model' });
        if (!PartCode) return res.status(400).send({ message: 'กรุณากรอก PartCode' });
        if (!PartName) return res.status(400).send({ message: 'กรุณากรอก PartName' });
        if (!CustomerName) return res.status(400).send({ message: 'กรุณากรอก CustomerName' });
        if (!RequestDate) return res.status(400).send({ message: 'กรุณากรอก RequestDate' });
        if (!Subject) return res.status(400).send({ message: 'กรุณากรอก Subject' });
        if (!ProjectTrialDate) return res.status(400).send({ message: 'กรุณากรอก Project Trial' });
        if (!PlanImprementDate) return res.status(400).send({ message: 'กรุณากรอก Plan Imprement' });
        if (!EffectivePeriod) return res.status(400).send({ message: 'กรุณากรอก Effective Period' });

        let queryEditRequest = `DECLARE @PPCID int;
        SET @PPCID = (SELECT PPCID FROM [logPPCRequest] WHERE PPCReqID = ${PPCReqID})
        UPDATE [logPPCRequest] SET RequestDate = '${RequestDate}' , ChangeItem = N'${ChangeItem}' , Reason = N'${Reason}', EffectivePeriod = N'${EffectivePeriod}',
        NewProcess = N'${NewProcess}', PreviousProcess = N'${PreviousProcess}'
        WHERE PPCReqID = ${PPCReqID};

        UPDATE [logPPC] SET ProjectTrialDate = '${ProjectTrialDate}', Subject= N'${Subject}', PlanImprementDate = '${PlanImprementDate}', Model = N'${Model}', PartCode = N'${PartCode}', PartName = N'${PartName}', CustomerName = N'${CustomerName}', SecRequest = N'${SecRequest}'
        WHERE PPCID = @PPCID;
        `;
        await pool.request().query(queryEditRequest);
        res.json({
            message: "แก้ไขข้อมูลสําเร็จ"
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
const deleteRequestPPC = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);
        let {
            PPCID
        } = req.body;
        let queryDelete = `UPDATE [logPPC] SET Active = 0 WHERE PPCID = ${PPCID}
        `;
        await pool.request().query(queryDelete);
        res.json({
            message: "ลบข้อมูลสำเร็จ"
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
const signRequestBy = async (req, res) => {
    try {
        let {
            PPCReqID,
            Username,
            Password,
            RequestSignTime
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);

        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updateReqID = `DECLARE @RequestBy int, @PPCID int;
        SELECT @RequestBy = RequestBy FROM [logPPCRequest] WHERE PPCReqID = ${PPCReqID};
        IF(@RequestBy = ${UserID})
        BEGIN
            UPDATE [logPPCRequest] SET RequestBy = null ,RequestSignTime = null WHERE PPCReqID = ${PPCReqID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCRequest] SET RequestBy = ${UserID} ,RequestSignTime = '${RequestSignTime}' WHERE PPCReqID = ${PPCReqID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultUpdate = await pool.request().query(updateReqID);
        let ReqestBy = resultUpdate.recordset[0].SignStatus == 0 ? '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let RequestTime = resultUpdate.recordset[0].SignStatus == 0 ? '' : RequestSignTime;
        let MessageSign = resultUpdate.recordset[0].message;
        res.json({
            message: MessageSign,
            ReqestBy: ReqestBy,
            RequsetSignTime: RequestTime
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
//Status 2 = En Reply
const sendmailRequest = async (req, res) => { //fixed
    try {
        let {
            SendEmail,
            PPCReqID
        } = req.body;
        if (!PPCReqID) return res.status(400).send({
            message: 'PPCReqID is required'
        });
        if (!SendEmail) return res.status(400).send({
            message: 'กรุณากรอก Email'
        });
        let pool = await getPool('EnPool', TSM_EN);
        let SendEmailStr = SendEmail.join(', ')
        let queryPPCRequest = `DECLARE @PPCID int,@Email nvarchar(255);
		SELECT @PPCID =  PPCID ,@Email = SendEmail FROM [logPPCRequest] WHERE PPCReqID = ${PPCReqID};

		SELECT @PPCID AS PPCID, a.RefCode,a.Model,a.CustomerName,a.PartCode,a.PartName,@Email AS oldEmail
		FROM [logPPC] a
		WHERE PPCID = @PPCID;
        `;
        let result = await pool.request().query(queryPPCRequest);
        let { PPCID,
            Model,
            CustomerName,
            PartCode,
            PartName,
            oldEmail
        } = result.recordset[0];
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #000;">PPC Request</h3>
                    <hr>
                    <div style="margin-bottom: 20px;">
                        <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Code</b>: ${PartCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Name</b>: ${PartName}</div>
                        <div>
                            <a href="http://${IP_SERVER}:${PORT}/ppc/?PPCID=${PPCID}" target="_blank" style="color: #007bff; ">PPC Engineer Reply Link</a>
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
        MiddlewareSendMail({
            to: SendEmailStr,
            subject: 'Alert New PPCRequest ',
            html: html
        });
        oldEmail = JSON.parse(oldEmail) || [];
        for (let item of SendEmail) {
            let filterEmail = oldEmail.findIndex((x) => x == item);
            if (filterEmail == -1) oldEmail.push(item)
        }
        let UpdateEmail = `UPDATE [logPPCRequest] SET SendEmail = '${JSON.stringify(oldEmail)}'
        WHERE PPCReqID = ${PPCReqID};
        `;
        await pool.request().query(UpdateEmail);
        res.json({
            message: 'ส่ง Email สําเร็จ'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
// engineer reply Status 3 = Wait Approve
const getEngreply = async (req, res) => {
    try {
        let {
            PPCID
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        const queryGetengreply = `SELECT a.PPCReplyID,a.RiskAnalysis_PartEffect,a.QualityDocConcern,
        a.RankConfirmation,a.CustomerConfirmation,a.ReplySignTime,a.SendEmail,b.RefCode,c.FirstName AS ReplyBy
        FROM [logPPCReply] a
        LEFT JOIN [logPPC] b ON a.PPCID = b.PPCID
        LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.ReplyBy
        WHERE b.PPCID = ${PPCID};
        `;
        let engreply = await pool.request().query(queryGetengreply);
        if (engreply.recordset.length) {
            engreply.recordset[0].ReplyBy = engreply.recordset[0].ReplyBy ? atob(engreply.recordset[0].ReplyBy) : '';
        }
        res.json(engreply.recordset);
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
//SECTION - Edit Engineer Reply
const editEngReply = async (req, res) => {
    try {
        let pool = await getPool('EnPool', TSM_EN);
        let {
            PPCReplyID,
            RiskAnalysis_PartEffect,
            QualityDocConcern,
            RankConfirmation,
            CustomerConfirmation,
        } = req.body;
        if (!CustomerConfirmation) return res.status(400).send({
            message: 'กรุณาเลือก CustomerConfirmation'
        });
        let checkUser = await pool.request().query(`SELECT ReplyBy FROM [logPPCReply] WHERE PPCReplyID = ${PPCReplyID}`);
        if (!checkUser.recordset[0].ReplyBy) return res.status(400).send({
            message: 'กรุณาลงชื่อ Reply By'
        })
        //info ประกาศ Production Date
        let curDate = new Date();
        if (curDate.getHours() < 8) {
            curDate.setDate(curDate.getDate() - 1);
        }
        let curMonth = curDate.getMonth() + 1;
        let curYear = curDate.getFullYear();

        //info จัดการ Running No. สร้าง RefCode
        let runningNo = await pool.request().query(`SELECT PCIRunningNo,PCERunningNo
                FROM [MstRunningNum]
                WHERE MONTH(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear}
                `);

        //info query Refcode
        let RefCode = `DECLARE @PPCID int;
        SET @PPCID = (SELECT PPCID FROM logPPCReply WHERE PPCReplyID = ${PPCReplyID})
        SELECT RefCode FROM logPPC WHERE PPCID = @PPCID`;
        let resultRefCode = await pool.request().query(RefCode);
        let PCERunningNo = '';
        let PCIRunningNo = '';
        if (!resultRefCode.recordset[0].RefCode) {
            if (runningNo.recordset.length) {
                //CustomerConfirmation 2 = External 1 = Internal
                if (CustomerConfirmation == 2) {
                    PCERunningNo = runningNo.recordset[0].PCERunningNo + 1;
                    await pool.request().query(`UPDATE [MstRunningNum] SET PCERunningNo = ${PCERunningNo} WHERE MONTH(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear};`);

                } else {
                    PCIRunningNo = runningNo.recordset[0].PCIRunningNo + 1;
                    await pool.request().query(`UPDATE [MstRunningNum] SET PCIRunningNo = ${PCIRunningNo} WHERE MONTH(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear};`);
                }
            } else {
                if (CustomerConfirmation == 2) {
                    PCERunningNo = 1;
                    await pool.request().query(`INSERT INTO [MstRunningNum](MonthYear, PCERunningNo) VALUES('${curYear}-${curMonth}-1', 1)`);
                } else {
                    PCIRunningNo = 1;
                    await pool.request().query(`INSERT INTO [MstRunningNum](MonthYear, PCIRunningNo) VALUES('${curYear}-${curMonth}-1', 1)`);
                }
            };
        }

        let refcode = `PC${CustomerConfirmation == 1 ? 'I' : 'E'}-${curYear.toString().slice(-2)}${('00' + curMonth).slice(-2)}${CustomerConfirmation == 1 ? ('00' + PCIRunningNo).slice(-3) : ('00' + PCERunningNo).slice(-3)}`;

        let queryEditReply = `DECLARE @PPCID int , @PPCReplyID int ,@CustomerConfirmation bit;
		SELECT @PPCReplyID = PPCReplyID, @PPCID = PPCID ,@CustomerConfirmation = CustomerConfirmation FROM [logPPCReply] WHERE PPCReplyID = ${PPCReplyID};
        IF(@CustomerConfirmation IS NULL)
        BEGIN
            UPDATE [logPPCReply] SET RiskAnalysis_PartEffect = N'${RiskAnalysis_PartEffect}', QualityDocConcern = N'${QualityDocConcern}', RankConfirmation = N'${RankConfirmation}',
            CustomerConfirmation = ${CustomerConfirmation}
		    WHERE PPCReplyID = @PPCReplyID;
		    UPDATE [logPPC] SET RefCode = N'${refcode}' WHERE PPCID = @PPCID
        END
        ELSE
        BEGIN
            UPDATE [logPPCReply] SET RiskAnalysis_PartEffect = N'${RiskAnalysis_PartEffect}', QualityDocConcern = N'${QualityDocConcern}', RankConfirmation = N'${RankConfirmation}'
            WHERE PPCReplyID = @PPCReplyID;
        END
        `;
        await pool.request().query(queryEditReply);


        //info Change Status = 2
        let updateStatus = `DECLARE @PPCID int,
         @PPCStatus int;
         SELECT @PPCID = a.PPCID ,
         @PPCStatus = a.PPCStatus
         FROM [logPPC] a
         LEFT JOIN [logPPCReply] b ON a.PPCID = b.PPCID WHERE PPCReplyID = ${PPCReplyID};
         IF(@PPCStatus = 1)
         BEGIN
             UPDATE [logPPC] SET PPCStatus = 2 WHERE PPCID = @PPCID;
         END
         `;
        await pool.request().query(updateStatus);
        res.json({
            message: "แก้ไขข้อมูลสําเร็จ", refcode: refcode
        });

    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
//!SECTION
const signEngReplyBy = async (req, res) => {
    try {
        let {
            PPCReplyID,
            Username,
            Password,
            ReplySignTime
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);

        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updateReplyBy = `DECLARE @ReplyBy int, @PPCID int;
        SELECT @ReplyBy = ReplyBy , @PPCID = PPCID FROM [logPPCReply] WHERE PPCReplyID = ${PPCReplyID};
        IF(@ReplyBy = ${UserID})
        BEGIN
            UPDATE [logPPCReply] SET ReplyBy = null ,ReplySignTime = null WHERE PPCReplyID = ${PPCReplyID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCReply] SET ReplyBy = ${UserID} ,ReplySignTime = '${ReplySignTime}' WHERE PPCReplyID = ${PPCReplyID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultReply = await pool.request().query(updateReplyBy);
        let ReplyBy = resultReply.recordset[0].SignStatus == 0 ? SignStatus = '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let MessageSign = resultReply.recordset[0].message;
        let ReplyTime = resultReply.recordset[0].SignStatus == 0 ? SignStatus = '' : ReplySignTime;
        res.json({
            message: MessageSign,
            ReplyBy: ReplyBy,
            ReplyTime
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Inernal Server Error'
        });
    }
};
const sendmailEngReply = async (req, res) => {//fixed
    try {
        let {
            SendEmail,
            PPCReplyID
        } = req.body;
        if (!PPCReplyID) return res.status(400).send({
            message: "กรุณาส่งค่า PPC Reply"
        });
        if (!SendEmail) return res.status(400).send({
            message: "กรุณากรอก Email"
        });
        let pool = await getPool('EnPool', TSM_EN);
        let qureyPPCReply = `DECLARE @PPCID int,@CustomerConfirmation int, @Email nvarchar(255);
		SELECT @PPCID =  PPCID ,@CustomerConfirmation = CustomerConfirmation, @Email = SendEmail FROM [logPPCReply] WHERE PPCReplyID = ${PPCReplyID};
		SELECT @PPCID AS PPCID, a.RefCode,a.Model,a.CustomerName,a.PartCode,a.PartName,@CustomerConfirmation AS CustomerConfirmation, @Email AS oldEmail
		FROM [logPPC] a
		WHERE PPCID = @PPCID;
        `;
        let resultPPCReply = await pool.request().query(qureyPPCReply);
        let {
            PPCID,
            CustomerConfirmation,
            RefCode,
            Model,
            CustomerName,
            PartCode,
            PartName,
            oldEmail
        } = resultPPCReply.recordset[0];
        let html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #000;">PPC Edit ApprovePlan</h3>
                    <hr>
                    <div style="margin-bottom: 20px;">
                        <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>RefCode</b>: ${RefCode || '-'}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Code</b>: ${PartCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Name</b>: ${PartName}</div>
                        <div>
                            <a href="http://${IP_SERVER}:${PORT}/ppc/?&PPCID=${PPCID}" target="_blank" style="color: #007bff;">Edit Approve Link</a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                        <label style="font-weight: bold; color: #000;">Remark</label>
                        <p style="margin: 0; color: #000;">กรุณาตรวจสอบและตอบกลับผ่านลิงค์ด้านบน</p>
                    </div>
                </div>
            </body>
            </html>`;
        let SendEmailStr = SendEmail.join(', ');
        MiddlewareSendMail({
            to: SendEmailStr,
            subject: 'Alert Engineer Reply',
            html: html
        });
        oldEmail = JSON.parse(oldEmail) || [];
        for (let item of SendEmail) {
            let filterEmail = oldEmail.findIndex((x) => x == item);
            console.log(filterEmail);

            if (filterEmail == -1) oldEmail.push(item);
        }

        let UpdateEmail = `UPDATE [logPPCReply] SET SendEmail = '${JSON.stringify(oldEmail)}'
        WHERE PPCReplyID = ${PPCReplyID};
        `;
        await pool.request().query(UpdateEmail);
        res.json({
            message: "ส่ง Email สำเร็จ"
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};

// approve plan
const getApprovePlan = async (req, res) => {
    try {
        let {
            PPCApproveID
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        let queryApprovePlan = `SELECT a.PPCApproveID, a.AnswerInstructionToPlan,
        a.Comment,a.PlanJudgement,a.SendEmail ,b.FirstName AS ApproveBy,a.ApporveSignTime AS ApproveSignTime ,c.FirstName AS CheckBy,a.CheckSignTime,d.FirstName as SubmitBy ,a.SubmitDate,
        a.ConcernDept
        FROM [logPPCApprovePlan] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.ApproveBy
		LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.CheckBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] d ON  a.SubmitBy = d.UserID
        WHERE a.PPCApproveID = ${PPCApproveID};

        SELECT DepartmentID, DepartmentName FROM [TSMolymer_F].[dbo].[MasterDepartment];
        `;
        let resultApprovePlan = await pool.request().query(queryApprovePlan);

        if (resultApprovePlan.recordset.length) {
            resultApprovePlan.recordset[0].ApproveBy = resultApprovePlan.recordset[0].ApproveBy ? atob(resultApprovePlan.recordset[0].ApproveBy) : '';
            resultApprovePlan.recordset[0].CheckBy = resultApprovePlan.recordset[0].CheckBy ? atob(resultApprovePlan.recordset[0].CheckBy) : '';
            resultApprovePlan.recordset[0].SubmitBy = resultApprovePlan.recordset[0].SubmitBy ? atob(resultApprovePlan.recordset[0].SubmitBy) : '';
            let conDeptJSON = JSON.parse(resultApprovePlan.recordset[0].ConcernDept) || []
            for (let item of conDeptJSON) {
                // for(let depment of resultApprovePlan.recordsets[1]){
                //     if(item.DepartmentID == depment.DepartmentID){
                //         item.DepartmentName = depment.DepartmentName
                //         break;
                //     }
                // }
                let filterDepartmentID = resultApprovePlan.recordsets[1].filter((v) => item.DepartmentID == v.DepartmentID)
                item.DepartmentName = filterDepartmentID[0].DepartmentName
            }

            resultApprovePlan.recordset[0].ConcernDept = conDeptJSON
        }
        res.json(resultApprovePlan.recordset);
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
const editApprovePlan = async (req, res) => {
    try {
        let {
            PPCApproveID,
            AnswerInstructionToPlan,
            Comment,
            PlanJudgement,
            ConcernDept
        } = req.body;
        if (!PlanJudgement) return res.status(400).send({ message: 'กรุณาเลือก PlanJudgement' });
        let pool = await getPool('EnPool', TSM_EN);
        let resultCondept = await pool.request().query(`SELECT ConcernDept FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID}`);
        let ConcernDeptJson = JSON.parse(resultCondept.recordset[0].ConcernDept) || []
        let condept = [];
        let status = 1;
        for (let dept of ConcernDept) {
            let old = ConcernDeptJson.filter((v) => dept == v.DepartmentID)
            if (old.length) {
                condept.push(old[0])
                if (!old[0].Value.length) { status = 0 }
            } else {
                condept.push({
                    DepartmentID: dept,
                    Value: []
                })
                status = 0
            }
        };
        condept = JSON.stringify(condept);

        let checkSubmitBy = await pool.request().query(`SELECT SubmitBy FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID}`);
        let SubmitBy = checkSubmitBy.recordset[0].SubmitBy;
        if (!SubmitBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Submit By' });

        let queryEdit = `DECLARE @PPCID int,
        @PlanJudgement bit;
        SELECT @PPCID = PPCID,@PlanJudgement = PlanJudgement FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID}
        UPDATE [logPPCApprovePlan] SET AnswerInstructionToPlan = N'${AnswerInstructionToPlan}', PlanJudgement = ${PlanJudgement},
        Comment = ${Comment ? `N'${Comment}'` : null}, ConcernDept = '${condept}',StatusConcernDept = ${status} WHERE PPCApproveID = ${PPCApproveID};
        `;

        await pool.request().query(queryEdit);
        let updateStatus = `DECLARE @PPCID int,
        @PPCStatus int,
        @PlanJudgement int;
		SELECT @PPCID = a.PPCID ,
        @PPCStatus = a.PPCStatus,
        @PlanJudgement = b.PlanJudgement
        FROM [logPPC] a
        LEFT JOIN [logPPCApprovePlan] b ON a.PPCID = b.PPCID WHERE PPCApproveID = ${PPCApproveID};
		IF(@PPCStatus = 2)
			BEGIN
				UPDATE [logPPC] SET PPCStatus = 3 WHERE PPCID = @PPCID;
			END
        `;
        await pool.request().query(updateStatus);
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDept bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar,
        @PlanJudgement int;
        SELECT @PPCID = PPCID, @StatusConcernDept = StatusConcernDept, @ApproveBy = ApproveBy, @CheckBy = CheckBy, @PlanJudgement = PlanJudgement
        FROM logPPCApprovePlan WHERE PPCApproveID = ${PPCApproveID};

		IF(@PlanJudgement = 2)
        BEGIN
			IF(@ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 6 WHERE PPCID = @PPCID;
					
                    UPDATE [logPPCStart] SET CompleteDate = GETDATE() WHERE PPCID = @PPCID;

                END
        END
		ELSE
		BEGIN
		IF(@StatusConcernDept = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 4 WHERE PPCID = @PPCID;
					UPDATE [logPPCApprovePlan] SET ApprovePlanDate = GETDATE() WHERE PPCID = @PPCID;
				END
		END;`;
        await pool.request().query(queryCheckStatusPPC);
        res.json({
            message: "แก้ไขข้อมูลสําเร็จ"
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
const signApproveSubmitPlanby = async (req, res) => {
    try {
        let {
            PPCApproveID,
            Username,
            Password,
            SubmitDate
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);

        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updateSubmitby = `DECLARE @SubmitBy int, @PPCID int;
        SELECT @SubmitBy = SubmitBy FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID};
        IF(@SubmitBy = ${UserID})
        BEGIN
            UPDATE [logPPCApprovePlan] SET SubmitBy = null ,SubmitDate = null WHERE PPCApproveID = ${PPCApproveID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCApprovePlan] SET SubmitBy = ${UserID} ,SubmitDate = '${SubmitDate}' WHERE PPCApproveID = ${PPCApproveID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultSumit = await pool.request().query(updateSubmitby);
        let SubmitPlanby = resultSumit.recordset[0].SignStatus == 0 ? '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let MessageSign = resultSumit.recordset[0].message;
        let SubmitTime = resultSumit.recordset[0].SignStatus == 0 ? '' : SubmitDate;
        res.json({
            message: MessageSign,
            SubmitPlanby: SubmitPlanby,
            SubmitTime
        });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status.send({
            message: 'Inernal Server Error'
        });
    }
};
//Status 4  = Approve
const signApproveBy = async (req, res) => {
    try {
        let {
            PPCApproveID,
            Username,
            Password,
            ApporveSignTime
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);
        let queryPlanjudgement = await pool.request().query(`SELECT PlanJudgement FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID}`);
        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        if (!queryPlanjudgement.recordset[0].PlanJudgement) return res.status(400).send({ message: 'กรุณาเลือก PlanJudgement และ Save ก่อน' });
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updateApproveBy = `DECLARE @ApproveBy int, @PPCID int;
        SELECT @ApproveBy = ApproveBy FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID};
        IF(@ApproveBy = ${UserID})
        BEGIN
            UPDATE [logPPCApprovePlan] SET ApproveBy = null ,ApporveSignTime = null WHERE PPCApproveID = ${PPCApproveID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCApprovePlan] SET ApproveBy = ${UserID} ,ApporveSignTime = '${ApporveSignTime}' WHERE PPCApproveID = ${PPCApproveID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultApprove = await pool.request().query(updateApproveBy);
        let approveBy = resultApprove.recordset[0].SignStatus == 0 ? '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let MessageSign = resultApprove.recordset[0].message;
        let ApproveTime = resultApprove.recordset[0].SignStatus == 0 ? '' : ApporveSignTime;

        //check PPCStatus Status 4 = Approve
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDept bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar,
        @PlanJudgement int;
        SELECT @PPCID = PPCID, @StatusConcernDept = StatusConcernDept, @ApproveBy = ApproveBy, @CheckBy = CheckBy, @PlanJudgement = PlanJudgement
        FROM logPPCApprovePlan WHERE PPCApproveID = ${PPCApproveID};

		IF(@PlanJudgement = 2)
        BEGIN
			IF(@ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 6 WHERE PPCID = @PPCID;
					
                    UPDATE [logPPCStart] SET CompleteDate = GETDATE() WHERE PPCID = @PPCID;

                DECLARE @PPCIDNEW int, @CustomerConfirmation int,@DATE datetime ,@PCI nvarchar(15) ,@PCE nvarchar(15);
                    SELECT @PCI = PCIRunningNo,@PCE = PCERunningNo FROM [MstRunningNum]
                    SET @CustomerConfirmation = (SELECT CustomerConfirmation FROM [logPPCReply] WHERE PPCID = @PPCID);
                    SET @DATE = (CASE 
                    WHEN DATEPART(HOUR, GETDATE()) < 8 
                    THEN DATEADD(DAY, -1, CAST(GETDATE() AS DATE)) 
                    ELSE CAST(GETDATE() AS DATE) END);

                    INSERT INTO logPPC (SecRequest,Subject,ProjectTrialDate,PlanImprementDate, PartCode, PartName, CustomerName, Model)
                    SELECT SecRequest, Subject, ProjectTrialDate, PlanImprementDate, PartCode, PartName, CustomerName, Model FROM [logPPC] WHERE PPCID = @PPCID

                    SET @PPCIDNEW = ( SELECT SCOPE_IDENTITY());
                    INSERT INTO [logPPCRequest] (PPCID,RequestDate,ChangeItem,Reason,EffectivePeriod,NewProcess,PreviousProcess)
                    SELECT @PPCIDNEW,RequestDate,ChangeItem,Reason,EffectivePeriod,NewProcess,PreviousProcess FROM [logPPCRequest] WHERE PPCID = @PPCID
                    INSERT INTO [logPPCReply] (PPCID,CustomerConfirmation) SELECT @PPCIDNEW,CustomerConfirmation FROM [logPPCReply] WHERE PPCID = @PPCID;
                    INSERT INTO [logPPCApprovePlan] (PPCID) VALUES (@PPCIDNEW);
                    INSERT INTO [logPPCStart] (PPCID) VALUES (@PPCIDNEW);

                    IF(@PCE IS NOT NULL)
                        BEGIN
                            UPDATE [MstRunningNum] SET PCERunningNo = PCERunningNo+1 WHERE MONTH(MonthYear) = Month(@DATE) AND YEAR(MonthYear) = YEAR(@DATE) ;
                        END
                        ELSE
                        BEGIN
                        INSERT INTO [MstRunningNum](MonthYear, PCERunningNo) VALUES
                        (CONVERT(NVARCHAR(4), YEAR(@DATE))+'-'+ CONVERT(NVARCHAR(2), MONTH(@DATE)) + '-1', 1)
                        END
                        
                     IF(@PCI IS NOT NULL)
                        BEGIN
                            UPDATE [MstRunningNum] SET PCIRunningNo = PCIRunningNo+1 WHERE MONTH(MonthYear) = Month(@DATE) AND YEAR(MonthYear) = YEAR(@DATE) ;
                        END
                        ELSE
                        BEGIN
                        INSERT INTO [MstRunningNum](MonthYear, PCIRunningNo) VALUES
                        (CONVERT(NVARCHAR(4), YEAR(@DATE))+'-'+CONVERT(NVARCHAR(2), MONTH(@DATE)) + '-1', 1)
                        END
                       
                    -- 1 PCI 2 PCE
                    IF(@CustomerConfirmation = 1)
                    BEGIN 
                        UPDATE [logPPC] SET RefCode = 'PCI' + '-' + RIGHT(CONVERT(NVARCHAR(4), YEAR(@DATE)), 2) + RIGHT(CONVERT(NVARCHAR(2), MONTH(@DATE)),2) + RIGHT(REPLICATE('0', 3) + CONVERT(NVARCHAR(15), CAST(@PCI AS INT) + 1), 3)
                        WHERE PPCID = @PPCIDNEW;
                    END
                    ELSE
                    BEGIN
                        UPDATE [logPPC] SET RefCode = 'PCE' + '-' + RIGHT(CONVERT(NVARCHAR(4), YEAR(@DATE)),2) + RIGHT(CONVERT(NVARCHAR(2), MONTH(@DATE)),2) + RIGHT(REPLICATE('0', 3) + CONVERT(NVARCHAR(15), CAST(@PCE AS INT) + 1), 3)
                        WHERE PPCID = @PPCIDNEW;
                    END

				END
        END
		ELSE
		BEGIN
		IF(@StatusConcernDept = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 4 WHERE PPCID = @PPCID;
					UPDATE [logPPCApprovePlan] SET ApprovePlanDate = GETDATE() WHERE PPCID = @PPCID;
				END
		END;`;
        await pool.request().query(queryCheckStatusPPC);

        res.json({
            message: MessageSign,
            ApproveBy: approveBy,
            ApproveTime
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
const signChcekBy = async (req, res) => {
    try {
        let {
            PPCApproveID,
            Username,
            Password,
            CheckSignTime
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);
        let queryPlanjudgement = await pool.request().query(`SELECT PlanJudgement FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID}`);

        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        if (!queryPlanjudgement.recordset[0].PlanJudgement) return res.status(400).send({ message: 'กรุณาเลือก PlanJudgement และ Save ก่อน' });
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updatechcekBy = `DECLARE @CheckBy int, @PPCID int;
        SELECT @CheckBy = CheckBy FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID};
        IF(@CheckBy = ${UserID})
        BEGIN
            UPDATE [logPPCApprovePlan] SET CheckBy = null ,CheckSignTime = null WHERE PPCApproveID = ${PPCApproveID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCApprovePlan] SET CheckBy = ${UserID} ,CheckSignTime = ${CheckSignTime} WHERE PPCApproveID = ${PPCApproveID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultCheckBy = await pool.request().query(updatechcekBy);
        let chcekBy = resultCheckBy.recordset[0].SignStatus == 0 ? '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let MessageSign = resultCheckBy.recordset[0].message;
        let CheckTime = resultCheckBy.recordset[0].SignStatus == 0 ? '' : CheckSignTime;
        //check PPCStatus Status 4 = Approve
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDept bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar,
        @PlanJudgement int;
        SELECT @PPCID = PPCID, @StatusConcernDept = StatusConcernDept, @ApproveBy = ApproveBy, @CheckBy = CheckBy, @PlanJudgement = PlanJudgement
        FROM logPPCApprovePlan WHERE PPCApproveID = ${PPCApproveID};

		IF(@PlanJudgement = 2)
        BEGIN
			IF(@ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 6 WHERE PPCID = @PPCID;
					
                    UPDATE [logPPCStart] SET CompleteDate = GETDATE() WHERE PPCID = @PPCID;

                 DECLARE @PPCIDNEW int, @CustomerConfirmation int,@DATE datetime ,@PCI nvarchar(15) ,@PCE nvarchar(15);
                    SELECT @PCI = PCIRunningNo,@PCE = PCERunningNo FROM [MstRunningNum]
                    SET @CustomerConfirmation = (SELECT CustomerConfirmation FROM [logPPCReply] WHERE PPCID = @PPCID);
                    SET @DATE = (CASE 
                    WHEN DATEPART(HOUR, GETDATE()) < 8 
                    THEN DATEADD(DAY, -1, CAST(GETDATE() AS DATE)) 
                    ELSE CAST(GETDATE() AS DATE) END);

                    INSERT INTO logPPC (SecRequest,Subject,ProjectTrialDate,PlanImprementDate, PartCode, PartName, CustomerName, Model)
                    SELECT SecRequest, Subject, ProjectTrialDate,P lanImprementDate, PartCode, PartName, CustomerName, Model FROM [logPPC] WHERE PPCID = @PPCID

                    SET @PPCIDNEW = ( SELECT SCOPE_IDENTITY());
                    INSERT INTO [logPPCRequest] (PPCID,RequestDate,ChangeItem,Reason,EffectivePeriod,NewProcess,PreviousProcess)
                    SELECT @PPCIDNEW,RequestDate,ChangeItem,Reason,EffectivePeriod,NewProcess,PreviousProcess FROM [logPPCRequest] WHERE PPCID = @PPCID
                    INSERT INTO [logPPCReply] (PPCID,CustomerConfirmation) SELECT @PPCIDNEW,CustomerConfirmation FROM [logPPCReply] WHERE PPCID = @PPCID;
                    INSERT INTO [logPPCApprovePlan] (PPCID) VALUES (@PPCIDNEW);
                    INSERT INTO [logPPCStart] (PPCID) VALUES (@PPCIDNEW);
                    
                    IF(@PCE IS NOT NULL)
                        BEGIN
                            UPDATE [MstRunningNum] SET PCERunningNo = PCERunningNo+1 WHERE MONTH(MonthYear) = Month(@DATE) AND YEAR(MonthYear) = YEAR(@DATE) ;
                        END
                        ELSE
                        BEGIN
                        INSERT INTO [MstRunningNum](MonthYear, PCERunningNo) VALUES
                        (CONVERT(NVARCHAR(4), YEAR(@DATE))+'-'+ CONVERT(NVARCHAR(2), MONTH(@DATE)) + '-1', 1)
                        END
                        
                     IF(@PCI IS NOT NULL)
                        BEGIN
                            UPDATE [MstRunningNum] SET PCIRunningNo = PCIRunningNo+1 WHERE MONTH(MonthYear) = Month(@DATE) AND YEAR(MonthYear) = YEAR(@DATE) ;
                        END
                        ELSE
                        BEGIN
                        INSERT INTO [MstRunningNum](MonthYear, PCIRunningNo) VALUES
                        (CONVERT(NVARCHAR(4), YEAR(@DATE))+'-'+CONVERT(NVARCHAR(2), MONTH(@DATE)) + '-1', 1)
                        END
                        -- 1 PCI 2 PCE
                    IF(@CustomerConfirmation = 1)
                    BEGIN 
                        UPDATE [logPPC] SET RefCode = 'PCI' + '-' + RIGHT(CONVERT(NVARCHAR(4), YEAR(@DATE)), 2) + RIGHT(CONVERT(NVARCHAR(2), MONTH(@DATE)),2) + RIGHT(REPLICATE('0', 3) + CONVERT(NVARCHAR(15), CAST(@PCI AS INT) + 1), 3)
                        WHERE PPCID = @PPCIDNEW;
                    END
                    ELSE
                    BEGIN
                        UPDATE [logPPC] SET RefCode = 'PCE' + '-' + RIGHT(CONVERT(NVARCHAR(4), YEAR(@DATE)),2) + RIGHT(CONVERT(NVARCHAR(2), MONTH(@DATE)),2) + RIGHT(REPLICATE('0', 3) + CONVERT(NVARCHAR(15), CAST(@PCE AS INT) + 1), 3)
                        WHERE PPCID = @PPCIDNEW;
                    END

				END
        END
		ELSE
		BEGIN
		IF(@StatusConcernDept = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 4 WHERE PPCID = @PPCID;
					UPDATE [logPPCApprovePlan] SET ApprovePlanDate = GETDATE() WHERE PPCID = @PPCID;
				END
		END;`;
        await pool.request().query(queryCheckStatusPPC);
        res.json({
            message: MessageSign,
            chcekBy: chcekBy,
            CheckTime
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
const conDeptApprovePlan = (async (req, res) => {//fixed
    try {
        let {
            PPCApproveID,
            Username,
            Password,
            DepartmentID,
            DateSignTime
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT a.UserID,a.FirstName,a.DepartmentID,b.DepartmentName
        FROM [TSMolymer_F].[dbo].[User] a 
        LEFT JOIN [TSMolymer_F].[dbo].[MasterDepartment] b ON a.DepartmentID = b.DepartmentID 
        WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);
        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID == 3) return res.status(400).send({ message: 'Engineer ไม่มีสิทธิ์ในการลงชื่อ' });
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let FirstName = atob(user.recordset[0].FirstName);
        let UserDepartmentID = user.recordset[0].DepartmentID;
        let DepartmentName = user.recordset[0].DepartmentName;
        let queryCondept = `SELECT [ConcernDept] FROM [logPPCApprovePlan] WHERE PPCApproveID = ${PPCApproveID}`;
        let resultCondept = await pool.request().query(queryCondept);
        let conDeptJSON = JSON.parse(resultCondept.recordset[0].ConcernDept) || []

        let filterDepartmentID = conDeptJSON.filter(x => x.DepartmentID == DepartmentID);
        if (!filterDepartmentID.length) return res.status(400).send({ message: `ไม่มีแผนก ${DepartmentName}` });

        if (DepartmentID != UserDepartmentID) return res.status(400).send({ message: `ลงชื่อผิดพลาดต้องลงชื่อที่แผนก ${DepartmentName}` });

        let status = 1;
        let message = ''

        // หา Index ของ DepartmentID ที่ส่งมา ใน ConcernDept
        let findIndex = conDeptJSON.findIndex((x) => x.DepartmentID == DepartmentID);
        if (findIndex == -1) {
            return res.status(400).send({ message: `ไม่มีแผนก ${DepartmentName}` });
        } else {
            let findIndexValues = conDeptJSON[findIndex].Value.findIndex((x) => x.UserID == UserID);
            if (findIndexValues != -1) {
                conDeptJSON[findIndex].Value.splice(findIndexValues, 1);
                message = 'ลงชื่อออกสำเร็จ'
            } else {
                conDeptJSON[findIndex].Value.push({
                    UserID: UserID,
                    Name: FirstName,
                    DateSignTime: DateSignTime
                });
                message = 'ลงชื่อสําเร็จ'
            }
        }
        for (let dept of conDeptJSON) {
            if (!dept.Value.length) status = 0
        }
        let CondeptStr = JSON.stringify(conDeptJSON);
        let queryUpdateCondept = `UPDATE [logPPCApprovePlan] SET ConcernDept = '${CondeptStr}', StatusConcernDept = ${status} WHERE PPCApproveID = ${PPCApproveID}`;
        await pool.request().query(queryUpdateCondept);
        //check PPCStatus
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDept bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar,
        @PlanJudgement int;
        SELECT @PPCID = PPCID, @StatusConcernDept = StatusConcernDept, @ApproveBy = ApproveBy, @CheckBy = CheckBy, @PlanJudgement = PlanJudgement
        FROM logPPCApprovePlan WHERE PPCApproveID = ${PPCApproveID};

		IF(@PlanJudgement = 2)
        BEGIN
			IF(@ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 6 WHERE PPCID = @PPCID;
					UPDATE [logPPCApprovePlan] SET ApprovePlanDate = GETDATE() WHERE PPCID = @PPCID;
				END
        END
		ELSE
		BEGIN
		IF(@StatusConcernDept = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
				BEGIN
					UPDATE [logPPC] SET PPCStatus = 4 WHERE PPCID = @PPCID;
					UPDATE [logPPCApprovePlan] SET ApprovePlanDate = GETDATE() WHERE PPCID = @PPCID;
				END
		END;`;
        await pool.request().query(queryCheckStatusPPC);
        res.json({
            message: message,
            User: conDeptJSON,
            Status: status
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
});
const sendMailApprove = (async (req, res) => {// fixed
    try {
        let {
            PPCApproveID,
            SendEmail
        } = req.body;
        if (!PPCApproveID) return res.status(400).send({
            message: 'กรุณาส่งค่า PPCApproveID '
        });
        if (!SendEmail) return res.status(400).send({ message: 'กรุณากรอก Email' });
        let SendEmailStr = SendEmail.join(', ')
        let pool = await getPool('EnPool', TSM_EN);
        let queryPPCApprove = `DECLARE @PPCID int,@Email nvarchar(255);
		SELECT @PPCID = PPCID ,@Email = SendEmail FROM logPPCApprovePlan WHERE PPCApproveID = ${PPCApproveID}
		SELECT @PPCID AS PPCID, a.RefCode,a.Model,a.CustomerName,a.PartCode,a.PartName, @Email AS oldEmail
		FROM logPPC a
		WHERE PPCID = @PPCID`;
        let resultPPCApprove = await pool.request().query(queryPPCApprove);
        let {
            PPCID,
            RefCode,
            Model,
            CustomerName,
            PartCode,
            PartName,
            oldEmail
        } = resultPPCApprove.recordset[0];
        let html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #000;">PPC ApprovePlan</h3>
                <hr>
                <div style="margin-bottom: 20px;">
                    <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>RefCode</b>: ${RefCode}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>Part Code</b>: ${PartCode}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>Part Name</b>: ${PartName}</div>
                    <div>
                        <a href="http://${IP_SERVER}:${PORT}/ppc/?PPCID=${PPCID}&STEP=3&RefCode=${RefCode}" target="_blank" style="color: #007bff;">Sign ApprovePlan Link</a>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                    <label style="font-weight: bold; color: #000;">Remark</label>
                    <p style="margin: 0; color: #000;">กรุณาตรวจสอบและตอบกลับผ่านลิงค์ด้านบน</p>
                </div>
            </div>
        </body>
        </html>`;

        MiddlewareSendMail({
            to: SendEmailStr,
            subject: 'Alert Sign PPCApprovePlan',
            html: html
        });
        oldEmail = JSON.parse(oldEmail) || [];
        for (let item of SendEmail) {
            let filterEmail = oldEmail.findIndex((x) => x == item);
            if (filterEmail == -1) oldEmail.push(item);
        }
        let UpdateEmail = `UPDATE [logPPCApprovePlan] SET SendEmail = '${JSON.stringify(oldEmail)}'
        WHERE PPCApproveID = ${PPCApproveID};
        `;
        await pool.request().query(UpdateEmail);
        res.json({
            message: "ส่ง Email สําเร็จ"
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
});

//* Approve Start Status 5 = Complete
const getApproveStart = async (req, res) => {
    try {
        let {
            PPCStartID,
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        const queryApproveStart = `SELECT a.PPCStartID,a.ImprementProductLotNo ,a.EffectiveProdDate, a.ConcernDept ,
        a.SendEmail,a.CustomerApproveFilePath,a.Comment , b.FirstName as CheckBy,a.CheckSignTime, c.FirstName as ApproveBy,a.ApproveSignTime
        FROM [logPPCStart] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON  a.CheckBy = b.UserID
        LEFT JOIN [TSMolymer_F].[dbo].[User] c ON  a.ApproveBy = c.UserID
        WHERE PPCStartID = ${PPCStartID};

        SELECT DepartmentID, DepartmentName FROM [TSMolymer_F].[dbo].[MasterDepartment];
        `;
        const resultApproveStart = await pool.request().query(queryApproveStart);
        if (resultApproveStart.recordset.length) {
            resultApproveStart.recordset[0].CheckBy = resultApproveStart.recordset[0].CheckBy = resultApproveStart.recordset[0].CheckBy ? atob(resultApproveStart.recordset[0].CheckBy) : '';
            resultApproveStart.recordset[0].ApproveBy = resultApproveStart.recordset[0].ApproveBy = resultApproveStart.recordset[0].ApproveBy ? atob(resultApproveStart.recordset[0].ApproveBy) : '';
            let conDeptJSON = JSON.parse(resultApproveStart.recordset[0].ConcernDept) || []
            console.log(conDeptJSON);

            for (let item of conDeptJSON) {
                // for(let depment of resultApproveStart.recordsets[1]){
                //     if(item.DepartmentID == depment.DepartmentID){
                //         item.DepartmentName = depment.DepartmentName
                //         break;
                //     }
                // }
                let filterDepartmentID = resultApproveStart.recordsets[1].filter((v) => item.DepartmentID == v.DepartmentID)
                item.DepartmentName = filterDepartmentID[0].DepartmentName
            }

            resultApproveStart.recordset[0].ConcernDept = conDeptJSON
        }
        res.json(resultApproveStart.recordset);
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
const storageApproveStart = multer.diskStorage({
    destination: path.join(__dirname, '../public/ppc/docs'),
    filename: (req, file, cb) => {
        let ext = file.mimetype.split('/')[1]
        cb(null, `${Date.now()}.${ext}`);
    }
});
const uploadApproveStart = multer({
    storage: storageApproveStart
}).single('approve_start');//info Key Upload File StartPlan
const editApproveStart = async (req, res) => {
    uploadApproveStart(req, res, async (err) => {
        if (err) {
            console.log(req.url, 'Upload Error', err);
            res.status(500).send({
                message: `${err}`
            });
        } else {
            try {
                let {
                    PPCStartID,
                    EffectiveProdDate,
                    ConcernDept,
                    Comment,
                    Ischange,
                    ImprementProductLotNo
                } = req.body;
                let pool = await getPool('EnPool', TSM_EN);
                let NewfilePath = req.file ? `/ppc/docs/${req.file.filename}` : '';
                let oldfilePathDB = await pool.request().query(`SELECT CustomerApproveFilePath FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID}`)
                let OldPath = oldfilePathDB.recordset[0].CustomerApproveFilePath
                // if (!EffectiveProdDate) {
                //     await removeFile(NewfilePath)
                //     if (!EffectiveProdDate) return res.status(400).send({ message: "EffectiveProdDate is required" });
                // }
                if (NewfilePath && OldPath) {
                    await removeFile(OldPath)
                }
                // 1 change 2 not change
                let updateFilePath = Ischange == 1 ? `,CustomerApproveFilePath = '${NewfilePath}'` : '';
                let resultCondept = await pool.request().query(`SELECT ConcernDept FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID}`)
                let conDeptJson = JSON.parse(resultCondept.recordset[0].ConcernDept) || [];
                let condept = [];
                let conDeptJsonBody = JSON.parse(ConcernDept) || [];
                let status = 1;
                for (let concern of conDeptJsonBody) {
                    let old = conDeptJson.filter((v) => concern == v.DepartmentID)
                    if (old.length) {
                        condept.push(old[0])
                        if (!old[0].Value.length) status = 0
                    } else {
                        condept.push({
                            DepartmentID: concern,
                            Value: []
                        })
                        status = 0
                    }
                }
                condept = JSON.stringify(condept);
                let queryEdit = `UPDATE [logPPCStart] SET EffectiveProdDate = N'${EffectiveProdDate}', ConcernDept = '${condept}',
                Comment = N'${Comment}' ,ImprementProductLotNo = N'${ImprementProductLotNo}',StatusConcernDeptStart = ${status} ${updateFilePath}
                WHERE PPCStartID = ${PPCStartID};
                `;
                await pool.request().query(queryEdit);
                res.json({
                    message: "แก้ไขข้อมูลสําเร็จ"
                });
            } catch (error) {
                console.log(error);
                res.status(500).send({
                    message: 'Internal Server Error'
                });
            }
        }
    })

};
const signStartApproveBy = async (req, res) => {
    try {
        let {
            PPCStartID,
            Username,
            Password,
            ApproveSignTimeStart
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);
        let queryCheck = await pool.request().query(`SELECT EffectiveProdDate,ImprementProductLotNo FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID}`);
        let EffectiveProdDate = queryCheck.recordset[0].EffectiveProdDate;
        let ImprementProductLotNo = queryCheck.recordset[0].ImprementProductLotNo;
        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        // if (!EffectiveProdDate) return res.status(400).send({ message: "กรุณากรอก EffectiveProdDate และ Save ก่อน" });
        // if (!ImprementProductLotNo) return res.status(400).send({ message: "กรุณากรอก ImprementProductLotNo และ Save ก่อน" });
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updateApproveBy = `DECLARE @ApproveBy int, @PPCID int;
        SELECT @ApproveBy = ApproveBy FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID};
        IF(@ApproveBy = ${UserID})
        BEGIN
            UPDATE [logPPCStart] SET ApproveBy = null ,ApproveSignTime = null WHERE PPCStartID = ${PPCStartID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCStart] SET ApproveBy = ${UserID} ,ApproveSignTime = '${ApproveSignTimeStart}' WHERE PPCStartID = ${PPCStartID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultApprovestart = await pool.request().query(updateApproveBy);
        let startApproveBy = resultApprovestart.recordset[0].SignStatus == 0 ? '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let MessageSign = resultApprovestart.recordset[0].message;
        let SignPlanStartTime = resultApprovestart.recordset[0].SignStatus == 0 ? '' : ApproveSignTimeStart;
        //check PPCStatus Status = 5 Complete
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDeptStart bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar
        SELECT @PPCID = PPCID, @StatusConcernDeptStart = StatusConcernDeptStart, @ApproveBy = ApproveBy, @CheckBy = CheckBy
        FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID};


		IF(@StatusConcernDeptStart = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
			BEGIN
				UPDATE [logPPC] SET PPCStatus = 5 WHERE PPCID = @PPCID;
				UPDATE [logPPCStart] SET CompleteDate = GETDATE() WHERE @PPCID = @PPCID;
			END
        `;
        await pool.request().query(queryCheckStatusPPC);
        res.json({
            message: MessageSign,
            startApproveBy: startApproveBy,
            SignPlanStartTime
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};
const signStartCheckBy = async (req, res) => {
    try {
        let {
            PPCStartID,
            Username,
            Password,
            SignTimeCheckBy
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);
        let queryCheck = await pool.request().query(`SELECT EffectiveProdDate,ImprementProductLotNo FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID}`);
        let EffectiveProdDate = queryCheck.recordset[0].EffectiveProdDate;
        let ImprementProductLotNo = queryCheck.recordset[0].ImprementProductLotNo;
        // Return 400 if no user found
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19) return res.status(400).send({
            message: 'สำหรับแผนก Engineer เท่านั้น'
        })
        // if (!EffectiveProdDate) return res.status(400).send({ message: "กรุณากรอก EffectiveProdDate และ Save ก่อน" });
        // if (!ImprementProductLotNo) return res.status(400).send({ message: "กรุณากรอก ImprementProductLotNo และ Save ก่อน" });
        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let updateCheckBy = `DECLARE @CheckBy int, @PPCID int;
        SELECT @CheckBy = CheckBy FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID};
        IF(@CheckBy = ${UserID})
        BEGIN
            UPDATE [logPPCStart] SET CheckBy = null ,CheckSignTime = null WHERE PPCStartID = ${PPCStartID};
            SELECT N'ลงชื่อออกสำเร็จ' AS message ,0 AS SignStatus;
        END
        ELSE
        BEGIN
            UPDATE [logPPCStart] SET CheckBy = ${UserID} ,CheckSignTime = '${SignTimeCheckBy}' WHERE PPCStartID = ${PPCStartID};
            SELECT N'ลงชื่อสำเร็จ' AS message ,1 AS SignStatus;
        END;
        `;
        let resultCheckBy = await pool.request().query(updateCheckBy);
        let startCheckBy = resultCheckBy.recordset[0].SignStatus == 0 ? '' : (user.recordset[0].FirstName ? atob(user.recordset[0].FirstName) : '');
        let MessageSign = resultCheckBy.recordset[0].message;
        let SignCheckTime = resultCheckBy.recordset[0].SignStatus == 0 ? '' : SignTimeCheckBy;


        //check PPCStatus Status = 5 Complete
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDeptStart bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar
        SELECT @PPCID = PPCID, @StatusConcernDeptStart = StatusConcernDeptStart, @ApproveBy = ApproveBy, @CheckBy = CheckBy
        FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID};
		IF(@StatusConcernDeptStart = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
			BEGIN
				UPDATE [logPPC] SET PPCStatus = 5 WHERE PPCID = @PPCID;
				UPDATE [logPPCStart] SET CompleteDate = GETDATE() WHERE @PPCID = @PPCID;
			END
        `;
        await pool.request().query(queryCheckStatusPPC);
        res.json({
            message: MessageSign,
            startCheckBy: startCheckBy,
            SignCheckTime
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        })
    }
};
const conDeptStart = async (req, res) => { //fixed 
    try {
        let {
            PPCStartID,
            Username,
            Password,
            DeptSignTimeStart,
            DepartmentID
        } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        // Get User
        let user = await pool.request().query(`SELECT a.UserID,a.FirstName,a.DepartmentID,b.DepartmentName 
        FROM [TSMolymer_F].[dbo].[User] a 
        LEFT JOIN [TSMolymer_F].[dbo].[MasterDepartment] b ON a.DepartmentID = b.DepartmentID 
        WHERE Username = '${Username}' AND Password = '${btoa(Password)}'`);

        // Return 400 if no user found
        if (!DepartmentID) return res.status(400).send({ message: 'DepartmentID is required' })
        if (!user.recordset.length) return res.status(400).send({
            message: 'Username หรือ Password ไม่ถูกต้อง'
        });
        if (user.recordset[0].DepartmentID == 3) return res.status(400).send({ message: 'Engineer ไม่มีสิทธิ์ในการลงชื่อ' });

        // Declare UserID and Update Statement
        let UserID = user.recordset[0].UserID;
        let FirstName = atob(user.recordset[0].FirstName);
        let UserDepartmentID = user.recordset[0].DepartmentID;
        let DepartmentName = user.recordset[0].DepartmentName;
        let queryCondeptStart = `SELECT ConcernDept FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID};`;
        let resultCondeptStart = await pool.request().query(queryCondeptStart);

        let ConcernDeptJSON = JSON.parse(resultCondeptStart.recordset[0].ConcernDept) || [];

        let filterDepartmentID = ConcernDeptJSON.filter(x => x.DepartmentID == DepartmentID);
        if (!filterDepartmentID.length) return res.status(400).send({ message: `ไม่มีแผนก ${DepartmentName}` });

        // หา DepartmentID ที่ส่งมาว่า ตรงกับ UserDepartmentID
        if (DepartmentID != UserDepartmentID) return res.status(400).send({ message: `ลงชื่อผิดพลาดต้องลงชื่อที่แผนก ${DepartmentName}` });
        let status = 1;
        let message = ''
        // หา DepartmentID ใน ConcernDept ด้วย DepartmentID ที่ส่งมา
        let findIndexItem = ConcernDeptJSON.findIndex(x => x.DepartmentID == DepartmentID);
        //  ถ้าไม่มี DepartmentID ใน ConcernDept จะ return -1
        if (findIndexItem == -1) {
            return res.status(400).send({ message: `ไม่มีแผนก ${DepartmentName}` });
        } else {
            let findIndexValues = ConcernDeptJSON[findIndexItem].Value.findIndex(x => x.UserID == UserID);
            if (findIndexValues != -1) {
                ConcernDeptJSON[findIndexItem].Value.splice(findIndexValues, 1);
                message = 'ลงชื่อออกสำเร็จ'
            } else {
                ConcernDeptJSON[findIndexItem].Value.push({
                    UserID: UserID,
                    Name: FirstName,
                    DeptSignTimeStart: DeptSignTimeStart
                });
                message = 'ลงชื่อสำเร็จ'
            }
        }
        for (let dept of ConcernDeptJSON) {
            if (!dept.Value.length) {
                status = 0;
            }
        }
        let condeptStr = JSON.stringify(ConcernDeptJSON);
        let queryUpdateCondeptStart = `UPDATE [logPPCStart] SET ConcernDept = '${condeptStr}', StatusConcernDeptStart = ${status} WHERE PPCStartID = ${PPCStartID};`;
        await pool.request().query(queryUpdateCondeptStart);

        //check PPCStatus Status = 5 Complete
        let queryCheckStatusPPC = `DECLARE @PPCID int ,
        @StatusConcernDeptStart bit,
        @CheckBy nvarchar,
        @ApproveBy nvarchar
        SELECT @PPCID = PPCID, @StatusConcernDeptStart = StatusConcernDeptStart, @ApproveBy = ApproveBy, @CheckBy = CheckBy
        FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID};


		IF(@StatusConcernDeptStart = 1 AND @ApproveBy IS NOT NULL AND @CheckBy IS NOT NULL)
			BEGIN
				UPDATE [logPPC] SET PPCStatus = 5 WHERE PPCID = @PPCID;
				UPDATE [logPPCStart] SET CompleteDate = GETDATE() WHERE @PPCID = @PPCID;
			END
        `;
        await pool.request().query(queryCheckStatusPPC);
        res.json({
            message: message,
            User: ConcernDeptJSON,
            Status: status
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
}
const sendMailStart = async (req, res) => {//fixed
    try {
        let {
            PPCStartID,
            SendEmail
        } = req.body;
        if (!SendEmail) return res.status(400).send({ message: 'กรุณากรอก Email' });
        let SendEmailStr = SendEmail.join(',');
        let pool = await getPool('EnPool', TSM_EN);
        let queryPPCStart = `DECLARE @PPCID int, @Email nvarchar(255);
		SELECT @PPCID = PPCID, @Email = SendEmail FROM [logPPCStart] WHERE PPCStartID = ${PPCStartID}
		SELECT @PPCID AS PPCID, a.RefCode,a.Model,a.CustomerName,a.PartCode,a.PartName, @Email AS oldEmail
		FROM logPPC a
		WHERE PPCID = @PPCID`;
        let resultPPCStart = await pool.request().query(queryPPCStart);
        let {
            RefCode,
            Model,
            CustomerName,
            PartCode,
            PartName,
            PPCID,
            oldEmail
        } = resultPPCStart.recordset[0];
        let html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #000;">PPC StartPlan</h3>
                <hr>
                <div style="margin-bottom: 20px;">
                    <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>RefCode</b>: ${RefCode}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>Part Code</b>: ${PartCode}</div>
                    <div style="margin-bottom: 10px; color: #000;"><b>Part Name</b>: ${PartName}</div>
                    <div>
                        <a href="http://${IP_SERVER}:${PORT}/ppc/?PPCID=${PPCID}" target="_blank" style="color: #007bff; ">Sign PlanStart Link</a>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                    <label style="font-weight: bold; color: #000;">Remark</label>
                    <p style="margin: 0; color: #000;">กรุณาตรวจสอบและตอบกลับผ่านลิงค์ด้านบน</p>
                </div>
            </div>
        </body>
        </html>`;
        MiddlewareSendMail({
            to: SendEmailStr,
            subject: 'Alert Sign PPCStartPlan',
            html: html
        })
        oldEmail = JSON.parse(oldEmail) || [];
        for (let item of SendEmail) {
            let filterEmail = oldEmail.findIndex((x) => x == item);
            if (filterEmail == -1) oldEmail.push(item);
        }
        let UpdateSendEmailStart = `UPDATE [logPPCStart] SET SendEmail = '${JSON.stringify(oldEmail)}' WHERE PPCStartID = ${PPCStartID};`;
        await pool.request().query(UpdateSendEmailStart);
        res.json({
            message: 'ส่ง Email สําเร็จ'
        });
    } catch (error) {
        console.log(req.originalUrl, error);
        res.status(500).send({
            message: 'Internal Server Error'
        });
    }
};

module.exports = {
    getPPCS,
    addRequestPPC,
    editRequestPPC,
    deleteRequestPPC,
    getEngreply,
    editEngReply,
    signEngReplyBy,
    sendmailEngReply,
    getApprovePlan,
    editApprovePlan,
    editApproveStart,
    getRequest,
    signApproveSubmitPlanby,
    signApproveBy,
    signChcekBy,
    conDeptApprovePlan,
    getApproveStart,
    signRequestBy,
    signStartApproveBy,
    signStartCheckBy,
    sendMailApprove,
    sendmailRequest,
    sendMailStart,
    conDeptStart
}


const calWaterBill = (units) => {
    const unitFee = 50; // ค่าธรรมเนียม
    let totalCost = unitFee;

    if (units <= 10) { // 1-10 หน่วยละ 5 บาท
        totalCost += units * 5;
    } else if (units <= 20) { // 11-20 หน่วยละ 10 บาท
        totalCost += (10 * 5) + ((units - 10) * 10);
    } else if (units <= 30) { // 21-30 หน่วยละ 30 บาท
        totalCost += (10 * 5) + (10 * 10) + ((units - 20) * 30);
    } else {// 31 ขึ้นไปหน่วยละ 50 บาท
        totalCost += (10 * 5) + (10 * 10) + (10 * 30) + ((units - 30) * 50);
    }
    console.log(`ใช้ไป ${units} หน่วยจ่าย ${totalCost} บาท`);
}
calWaterBill(15);





const finePrimeNumber = (num) => {
    let primeNumbers = [];
    let nonPrimeNumbers = [];

     
     for (let i = 2; i <= num; i++) {
        let isPrime = true; // เซตค่าแรกเป็นจำนวนเฉพาะ

        
        for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
                isPrime = false; // เช็คว่าถ้าหารลงตัว จะไม่เป็นจำนวนเฉพาะ
                break;
            }
        }

        
        if (isPrime) {
            primeNumbers.push(i);
        } else {
            nonPrimeNumbers.push(i);
        }
    }
        console.log(`Prime numbers: ${primeNumbers}`);
        console.log(`Not prime numbers: ${nonPrimeNumbers}`);
        
    }
    finePrimeNumber(15);
