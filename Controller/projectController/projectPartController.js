const { TSM_EN } = require("../../libs/dbconfig/dbconfig.js");
const { getPool } = require('../../middleware/poolManger.js');
const multer = require('multer');
const path = require('path');
const { removeFile } = require('../../middleware/fileManager');

//* Part List
const getParts = async (req, res) => { // get more data to use instead of getPart
    try {
        let { ProjectID } = req.body;
        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        let pool = await getPool('EnPool', TSM_EN);
        let parts = await pool.request().query(`WITH cte AS (
            SELECT ROW_NUMBER() OVER (PARTITION BY a.RefID ORDER BY a.ProjectPartID DESC) AS RowNum, a.RefID,
            a.ProjectID, a.ProjectPartID, a.PartCode, a.PartName, a.DrawingRev, a.ReviseDate, a.ReceiveDate,
            a.DocName, a.DocFilePath, a.ReviseNo, a.PartStatus,
            b.FirstName AS IssueBy, a.IssueSignTime,
            c.FirstName AS CheckBy, a.CheckSignTime,
            d.FirstName AS ApproveBy, a.ApproveSignTime,a.Active
            FROM [logPart] a
            LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.IssueBy
            LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.CheckBy
            LEFT JOIN [TSMolymer_F].[dbo].[User] d ON d.UserID = a.ApproveBy
            WHERE a.ProjectID = ${ProjectID}
        )
        SELECT ProjectID, ProjectPartID, PartCode, PartName, DrawingRev, ReviseDate, ReceiveDate,
        DocName, DocFilePath, ReviseNo, RefID, PartStatus,
        IssueBy, IssueSignTime,
        CheckBy, CheckSignTime,
        ApproveBy, ApproveSignTime,Active
        FROM [cte]
        WHERE RowNum = 1
        ORDER BY RefID DESC;
        `);
        for(let item of parts.recordset){
            item.IssueBy = item.IssueBy ? atob(item.IssueBy) : '';
            item.CheckBy = item.CheckBy ? atob(item.CheckBy) : '';
            item.ApproveBy = item.ApproveBy ? atob(item.ApproveBy) : '';
        }
        res.json(parts.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const getPart = async (req, res) => { //deprecated
    try {
        let { ProjectPartID } = req.body;
        if(!ProjectPartID) return res.status(400).send({ message: 'กรุณาเลือก Part' });
        let pool = await getPool('EnPool', TSM_EN);
        let part = await pool.request().query(`
        SELECT a.RefID, a.ProjectID, a.ProjectPartID, a.PartCode, a.PartName, a.DrawingRev, a.ReviseDate, a.ReceiveDate,
        a.DocName, a.DocFilePath, a.ReviseNo, a.PartStatus,
        b.FirstName AS IssueBy, a.IssueSignTime,
        c.FirstName AS CheckBy, a.CheckSignTime,
        d.FirstName AS ApproveBy, a.ApproveSignTime
        FROM [logPart] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.IssueBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.CheckBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] d ON d.UserID = a.ApproveBy
        WHERE a.ProjectPartID = ${ProjectPartID};
        `);
        if(part.recordset.length){
            part.recordset[0].IssueBy = part.recordset[0].IssueBy ? atob(part.recordset[0].IssueBy) : '';
            part.recordset[0].CheckBy = part.recordset[0].CheckBy ? atob(part.recordset[0].CheckBy) : '';
            part.recordset[0].ApproveBy = part.recordset[0].ApproveBy ? atob(part.recordset[0].ApproveBy) : '';
        }
        res.json(part.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const addPart = async (req, res) => {
    try {
        let { ProjectID, PartCode, PartName, ReceiveDate, DrawingRev, IssueBy, IssueSignTime, DocName } = req.body;
        let DocFilePath = (req.file) ? "/project/part_doc/" + req.file.filename : "";

        if(!ProjectID || !PartCode || !PartName || !DrawingRev || !ReceiveDate || !IssueBy) {
            await removeFile(DocFilePath);
            if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
            if(!PartCode) return res.status(400).send({ message: 'กรุณากรอก Part Code' });
            if(!PartName) return res.status(400).send({ message: 'กรุณากรอก Part Name' });
            if(!DrawingRev) return res.status(400).send({ message: 'กรุณากรอก Drawing Rev' });
            if(!ReceiveDate) return res.status(400).send({ message: 'กรุณาเลือก Receive Date' });
            if(!IssueBy) return res.status(400).send({ message: 'กรุณาลงชื่อ IssueBy' });
        }

        let pool = await getPool('EnPool', TSM_EN);

        // จัดการ Running No. สร้าง RefID
        let runningNo = await pool.request().query(`SELECT PartRunningNo FROM [MstPartRunningNo]`);
        let PartRunningNo = runningNo.recordset[0].PartRunningNo + 1;
        await pool.request().query(`UPDATE [MstPartRunningNo] SET PartRunningNo = ${PartRunningNo};`);

        let insertPart = `INSERT INTO [logPart](ProjectID, PartCode, PartName, ReceiveDate, DrawingRev, IssueBy, IssueSignTime, RefID, DocFilePath, DocName)
        VALUES(${ProjectID}, N'${PartCode}', N'${PartName}', '${ReceiveDate}', '${DrawingRev}', ${IssueBy}, '${IssueSignTime}', ${PartRunningNo}, N'${DocFilePath}', N'${DocName}');

        -- Update ConcludePartStatus = Pending
        UPDATE [logProject] SET ConcludePartStatus = 1 WHERE ProjectID = ${ProjectID};
        `;
        await pool.request().query(insertPart);
        res.json({ message: 'เพิ่มรายการ Part สำเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const editPart = async (req, res) => { // เพิ่ม IssueBy
    try {
        let { ProjectID, ProjectPartID, PartCode, PartName, ReceiveDate, DrawingRev, IssueBy, IssueSignTime, DocName, Ischange } = req.body;
        Ischange = parseInt(Ischange);
        let DocFilePath = (req.file) ? "/project/part_doc/" + req.file.filename : "";

        if(!ProjectID) return res.status(400).send({ message: 'กรุณาเลือก Project' });
        if(!ProjectPartID) return res.status(400).send({ message: 'กรุณาเลือก Part' });
        if(!PartCode) return res.status(400).send({ message: 'กรุณากรอก Part Code' });
        if(!PartName) return res.status(400).send({ message: 'กรุณากรอก Part Name' });
        if(!DrawingRev) return res.status(400).send({ message: 'กรุณากรอก Drawing Rev' });
        if(!ReceiveDate) return res.status(400).send({ message: 'กรุณาเลือก Receive Date' });
        if(!IssueBy) return res.status(400).send({ message: 'กรุณาลงชื่อ IssueBy' });

        let pool = await getPool('EnPool', TSM_EN);
        let getRef = await pool.request().query(`
        DECLARE @RefID INT,
            @ReviseNo INT,
            @DocFilePath NVARCHAR(500),
            @DocName NVARCHAR(500),
			@PartCode NVARCHAR(500),
			@PartName NVARCHAR(500),
			@ReceiveDate NVARCHAR(500),
			@DrawingRev NVARCHAR(500);
        SELECT @RefID = RefID, @DocFilePath = DocFilePath, @DocName = DocName,@PartCode = PartCode,@PartName=PartName,@ReceiveDate = ReceiveDate ,@DrawingRev= DrawingRev 
        FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};

        SELECT @ReviseNo = MAX(ReviseNo) FROM [logPart] WHERE RefID = @RefID;

        SELECT @RefID AS RefID, @ReviseNo AS ReviseNo, @DocFilePath AS DocFilePath, @DocName AS DocName, @PartCode AS PartCode,@PartName AS PartName,Convert(date,@ReceiveDate) AS ReceiveDate ,@DrawingRev AS DrawingRev`);
        let RefID = getRef.recordset[0].RefID;
        let ReviseNo = getRef.recordset[0].ReviseNo + 1;
        let OldDocFilePath = getRef.recordset[0].DocFilePath || '';
        let OldDocName = getRef.recordset[0].DocName || '';
        let OldPartCode = getRef.recordset[0].PartCode;
        let OldPartName = getRef.recordset[0].PartName;
        let OldReceiveDate = getRef.recordset[0].ReceiveDate;
        let OldReceiveDateFormat = OldReceiveDate.toISOString().split('T')[0]
        let OldDrawingRev = getRef.recordset[0].DrawingRev;

        if(PartCode != OldPartCode || PartName != OldPartName || ReceiveDate != OldReceiveDateFormat ||  DrawingRev != OldDrawingRev || Ischange ){
            if(!Ischange){
                DocName = OldDocName;
                DocFilePath = OldDocFilePath;
            }
            let insertPart = `
            UPDATE [logPart] SET Active = 0 WHERE RefID = ${RefID};

            UPDATE [logProject] SET ConcludePartStatus = 1 WHERE ProjectID = ${ProjectID};
            INSERT INTO [logPart](ProjectID, PartCode, PartName, ReceiveDate, DrawingRev, RefID, ReviseNo, DocFilePath, DocName, IssueBy, IssueSignTime)
            VALUES(${ProjectID}, N'${PartCode}', N'${PartName}', '${ReceiveDate}', '${DrawingRev}', ${RefID}, ${ReviseNo}, N'${DocFilePath}', N'${DocName}', ${IssueBy}, '${IssueSignTime}');
            `;
            await pool.request().query(insertPart);
        } else {
            return res.status(400).send({ message: 'ไม่มีการเปลี่ยนแปลงข้อมูล' });
        }
        res.json({ message: 'แก้ไขรายการ Part สำเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const deletePart = async (req, res) => { // complete แล้ว delete ไม่ได้
    try {
        let { ProjectPartID } = req.body;
        if(!ProjectPartID) return res.status(400).send({ message: 'กรุณาเลือก Part' });
        let pool = await getPool('EnPool', TSM_EN);
        let deleteResult = await pool.request().query(`DECLARE @RefID INT,
            @PartStatus INT;
        SELECT @RefID = RefID, @PartStatus = PartStatus FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};

        IF(@PartStatus = 4)
        BEGIN
            SELECT 0 AS Result;
        END
        ELSE
        BEGIN
            UPDATE [logPart] SET Active = 0 WHERE RefID = @RefID;
            SELECT 1 AS Result;
        END
        `);
        let result = deleteResult.recordset[0].Result;
        if(result === 0) return res.status(400).send({ message: 'Complete แล้วไม่สามารถลบ Part นี้ได้' });
        res.json({ message: 'ลบรายการ Part สำเร็จ' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const getReviseHistory = async (req, res) => { // get more data
    try {
        let { ProjectPartID } = req.body;
        if(!ProjectPartID) return res.status(400).send({ message: 'กรุณาเลือก Part' });
        let pool = await getPool('EnPool', TSM_EN);
        let reviseHistories = await pool.request().query(`DECLARE @RefID INT;
        SELECT @RefID = RefID FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};

        SELECT a.ProjectPartID, a.PartCode, a.PartName, a.ReviseNo, a.ReceiveDate, a.ReviseDate,
        a.DocName, a.DocFilePath, a.DrawingRev,
        b.FirstName AS IssueBy, a.IssueSignTime,
        c.FirstName AS CheckBy, a.CheckSignTime,
        d.FirstName AS ApproveBy, a.ApproveSignTime,
        a.PartStatus
        FROM [logPart] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.IssueBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] c ON c.UserID = a.CheckBy
        LEFT JOIN [TSMolymer_F].[dbo].[User] d ON d.UserID = a.ApproveBy
        WHERE RefID = @RefID;
        `);
        for(let item of reviseHistories.recordset){
            item.IssueBy = item.IssueBy ? atob(item.IssueBy) : '';
            item.CheckBy = item.CheckBy ? atob(item.CheckBy) : '';
            item.ApproveBy = item.ApproveBy ? atob(item.ApproveBy) : '';
        }
        res.json(reviseHistories.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
const getPrintHistory = async (req, res) => { // change back to PrintHistory
    try {
        let { ProjectPartID } = req.body;
        if(!ProjectPartID) return res.status(400).send({ message: 'กรุณาเลือก Part' });
        let pool = await getPool('EnPool', TSM_EN);
        let viewHistories = await pool.request().query(` SELECT ROW_NUMBER() OVER (ORDER BY PrintDate) AS RowNo,
        b.FirstName AS ViewBy, a.PrintDate AS ViewDate, c.DepartmentName
        FROM [LogPrintHistory] a
        LEFT JOIN [TSMolymer_F].[dbo].[User] b ON b.UserID = a.UserId
        LEFT JOIN [TSMolymer_F].[dbo].[MasterDepartment] c ON c.DepartmentID = b.DepartmentID
        WHERE a.ProjectPartID = ${ProjectPartID}
        ORDER BY PrintDate;
        `);
        for(let item of viewHistories.recordset){
            item.ViewBy = item.ViewBy ? atob(item.ViewBy) : '';
        }
        res.json(viewHistories.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
const insertPrintHistory = async (req, res) => { // change back to PrintHistory
    try {
        let { ProjectPartID } = req.body;
        let UserID = req.session.UserID || null;
        if(!ProjectPartID) return res.status(400).send({ message: 'กรุณาเลือก Part' });
        let pool = await getPool('EnPool', TSM_EN);
        let insertView = `INSERT INTO [LogPrintHistory](UserID, PrintDate, ProjectPartID) VALUES(${UserID}, GETDATE(), ${ProjectPartID});`;
        await pool.request().query(insertView);
        res.json({ message: 'Success' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}

//* Doc
const getPartDoc = async (req, res) => {
    try {
        let { ProjectPartID } = req.body;
        let pool = await getPool('EnPool', TSM_EN);
        let doc = await pool.request().query(`SELECT DocFilePath FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};`);
        res.json(doc.recordset);
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}
// Storage Multer
const storagePartDocFile = multer.diskStorage({
    destination: path.join(__dirname, '../../public/project/part_doc'),
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        console.log(`${Date.now()}` + '.' + ext);
        cb(null, `${Date.now()}` + '.' + ext);
    }
});

const uploadPartDocFile = multer({ storage: storagePartDocFile }).single('part_doc');
const uploadPartDoc = async (req, res) => {
    try {
        let { ProjectPartID } = req.body;
        let DocFilePath = (req.file) ? "/project/part_doc/" + req.file.filename : "";
        let pool = await getPool('EnPool', TSM_EN);
        let updateDoc = `UPDATE [logPart] SET DocFilePath = N'${DocFilePath}', PartStatus = 4  WHERE ProjectPartID = ${ProjectPartID};

        DECLARE @ProjectID INT,
        @UncompletePart INT;
        SET @ProjectID = (SELECT ProjectID FROM [logPart] WHERE ProjectPartID = ${ProjectPartID});
        SET @UncompletePart = (SELECT COUNT(ProjectPartID) FROM [logPart] WHERE ProjectID = @ProjectID AND PartStatus != 4 AND Active = 1); -- Uncomplete Part
        IF(@UncompletePart = 0 OR @UncompletePart IS NULL) -- If Uncomplete Part = 0 update ConcludePartStatus = completed
        BEGIN
            -- ConcludePartStatus 1=Pending, 2=Completed
            UPDATE [logProject] SET ConcludePartStatus = 2 WHERE ProjectID = @ProjectID;
        END
        ELSE
        BEGIN
            UPDATE [logProject] SET ConcludePartStatus = 1 WHERE ProjectID = @ProjectID;
        END;
        `;
        await pool.request().query(updateDoc);
        res.json({ message: 'Success' });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
}

//* Sign
const signIssue = async (req, res) => {
    try {
        let { ProjectPartID, Username, Password, IssueSignTime } = req.body;
        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let part = await pool.request().query(`SELECT IssueBy, CheckBy FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!part.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if (part.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let OldIssueBy = part.recordsets[0][0].IssueBy;
        let CheckBy = part.recordsets[0][0].CheckBy;
        let UserID = part.recordsets[1][0].UserID;

        if(CheckBy && OldIssueBy == UserID) return res.status(400).send({ message: 'ไม่สามารถ Unsign ได้ เนื่องจากมีการลงชื่อ Check แล้ว' });
        if(CheckBy && OldIssueBy != UserID) return res.status(400).send({ message: 'ไม่สามารถลงชื่อใหม่ได้ เนื่องจากมีการลงชื่อ Check แล้ว' });

        // Declare UserID and Update Statement
        let IssueBy = UserID == OldIssueBy ? null : UserID;
        IssueSignTime = UserID == OldIssueBy ? null : `'${IssueSignTime}'`;
        let updateIssueBy = `UPDATE [logPart] SET IssueBy = ${IssueBy}, IssueSignTime = ${IssueSignTime} WHERE ProjectPartID = ${ProjectPartID};`;
        await pool.request().query(updateIssueBy);

        let name = !IssueBy ? '' : atob(part.recordsets[1][0].FirstName);
        let signTime = !IssueBy ? '' : IssueSignTime;
        let message = !IssueBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const signCheck = async (req, res) => {
    try {
        let { ProjectPartID, Username, Password, CheckSignTime } = req.body;
        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let part = await pool.request().query(`SELECT IssueBy, CheckBy, ApproveBy FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!part.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if (part.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let IssueBy = part.recordsets[0][0].IssueBy;
        let OldCheckBy = part.recordsets[0][0].CheckBy;
        let ApproveBy = part.recordsets[0][0].ApproveBy;
        let UserID = part.recordsets[1][0].UserID;

        if(!IssueBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Issue ก่อน' });
        if(ApproveBy && OldCheckBy == UserID) return res.status(400).send({ message: 'ไม่สามารถ Unsign ได้ เนื่องจากมีการลงชื่อ Approve แล้ว' });
        if(ApproveBy && OldCheckBy != UserID) return res.status(400).send({ message: 'ไม่สามารถลงชื่อใหม่ได้ เนื่องจากมีการลงชื่อ Approve แล้ว' });

        // Update Statement
        let CheckBy = UserID == OldCheckBy ? null : UserID;
        CheckSignTime = UserID == OldCheckBy ? null : `'${CheckSignTime}'`;
        let PartStatus = !CheckBy ? 1 : 2;
        let updateCheckBy = `UPDATE [logPart] SET CheckBy = ${CheckBy}, CheckSignTime = ${CheckSignTime}, PartStatus = ${PartStatus} WHERE ProjectPartID = ${ProjectPartID};`;
        await pool.request().query(updateCheckBy);

        let name = !CheckBy ? '' : atob(part.recordsets[1][0].FirstName);
        let signTime = !CheckBy ? '' : CheckSignTime;
        let message = !CheckBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};
const signApprove = async (req, res) => { //todo: ห้าม sign ย้อน
    try {
        let { ProjectPartID, Username, Password, ApproveSignTime } = req.body;
        let pool = await getPool('EnPool', TSM_EN);

        // Check Can Unsign
        let part = await pool.request().query(`SELECT CheckBy, ApproveBy FROM [logPart] WHERE ProjectPartID = ${ProjectPartID};
        SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(Password)}';
        `);
        if(!part.recordsets[1].length) return res.status(400).send({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        if (part.recordsets[1][0].DepartmentID != 3 && user.recordset[1][0].DepartmentID != 19) return res.status(400).send({ message: 'สำหรับแผนก Engineer เท่านั้น' });

        let CheckBy = part.recordsets[0][0].CheckBy;
        let OldApproveBy = part.recordsets[0][0].ApproveBy;
        let UserID = part.recordsets[1][0].UserID;

        if(!CheckBy) return res.status(400).send({ message: 'กรุณาลงชื่อ Check ก่อน' });

        // Update Statement
        let ApproveBy = UserID == OldApproveBy ? null : UserID;
        ApproveSignTime = UserID == OldApproveBy ? null : `'${ApproveSignTime}'`;
        let PartStatus = !ApproveBy ? 2 : 3;
        let updateApproveBy = `UPDATE [logPart] SET ApproveBy = ${ApproveBy}, ApproveSignTime = ${ApproveSignTime}, PartStatus = ${PartStatus} WHERE ProjectPartID = ${ProjectPartID};`;
        await pool.request().query(updateApproveBy);

        let name = !ApproveBy ? '' : atob(part.recordsets[1][0].FirstName);
        let signTime = !ApproveBy ? '' : ApproveSignTime;
        let message = !ApproveBy ? 'ลงชื่อออกสําเร็จ' : 'ลงชื่อสำเร็จ';
        res.json({ message, name , signTime });
    } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: 'Inernal Server Error' });
    }
};

module.exports = {
    getParts,
    getPart,
    addPart,
    editPart,
    deletePart,
    getReviseHistory,
    getPrintHistory,
    insertPrintHistory,
    getPartDoc,
    uploadPartDocFile,
    uploadPartDoc,
    signIssue,
    signCheck,
    signApprove
};