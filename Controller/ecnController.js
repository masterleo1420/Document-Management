require(`dotenv`).config();
const { TSM_EN } = require("../libs/dbconfig/dbconfig");
const { getPool } = require("../middleware/poolManger");
const multer = require("multer");
const path = require("path");
const MiddleWareSendMail = require("../middleware/sendMail");
const IP_SERVER = process.env.IP_SERVER;
const PORT = process.env.PORT;
const { removeFile } = require("../middleware/fileManager.js");

const getECN = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { IssueMonth, IssueYear } = req.body;
    let filterMonth = IssueMonth ? `WHERE MONTH(ECNIssueDate) = ${IssueMonth}` : "";
    let filterYear = IssueYear ? `AND YEAR(ECNIssueDate) = ${IssueYear}` : "";

    let top = filterMonth || filterYear ? "" : `TOP(1000)`;
    const getEcnQuey = `SELECT ${top} ROW_NUMBER() over(ORDER By a.ECNID desc) AS NO, a.ECNID , b.ECNIssueID, c.ECNApproveID, a.ECNStatus,
        a.RefCode, a.Model, a.CustomerName, a.PartCode, a.PartName,
        d.FirstName AS IssueBy, CONVERT(nvarchar , b.ECNIssueDate,23) AS IssueDate, CONVERT(nvarchar, c.CompleteDate,23) AS CompleteDate,
        b.Remark, a.ProcessName, a.Active
        FROM [logECN] a
        LEFT JOIN [logECNIssue] b ON b.ECNID = a.ECNID
        LEFT JOIN [logECNApprove] c ON c.ECNID = a.ECNID
        LEFT JOIN [TSMolymer_F].[dbo].[User] d ON d.UserID = c.IssueBy
        ${filterMonth} ${filterYear}
    `;
    const ecnResults = await pool.request().query(getEcnQuey);
    if (ecnResults.recordset.length) {
      for (let name of ecnResults.recordset) {
        name.IssueBy = name.IssueBy ? atob(name.IssueBy) : "";
      }
    }
    res.json(ecnResults.recordset);
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const storageECNIssueImage = multer.diskStorage({
  destination: path.join(__dirname, "../public/ecn/image"),
  filename: (req, file, cb) => {
    let ext = file.mimetype.split("/")[1];
    cb(null, `${Date.now()}.${ext}`);
  },
});
const uploadImageECN = multer({ storage: storageECNIssueImage }).single(
  "ECN_Issue_img"
);

//SECTION - AddECN
const addECNIssue = async (req, res) => { // Customer, Model, PartCode เก็บ String
  // todo: "ECN_Issue_img"
  uploadImageECN(req, res, async (err) => {
    if (err) {
      console.log(req.url, "Upload Error", err);
      res.status(500).send({ message: err });
    } else {
      try {
        const {
          ProcessName,
          DrawingRevise,
          ReceivedDate,
          ECNIssueDate,
          DrawingNo,
          CustomerECN,
          DocumentChange,
          EngineeringProcess,
          InjectionDate,
          SerialNumber,
          DeliveryPO,
          DeliveryQty,
          DeliveryDate,
          CheckPoint,
          Remark,
          Ischange,
          PartCode,
          PartName,
          CustomerName,
          Model
        } = req.body;
        const imagePath = req.file ? "/ecn/image/" + req.file.filename : "";
        if (
          !ProcessName ||
          !ReceivedDate ||
          !DrawingRevise ||
          !ECNIssueDate ||
          !DrawingNo ||
          !InjectionDate ||
          !SerialNumber
        ) {
          await removeFile(imagePath);
          if (!DrawingRevise) return res.status(400).send({ message: "กรุณากรอก Drawing Revise" });
          if (ProcessName == "null" || !ProcessName) return res.status(400).send({ message: "กรุณาเลือก Process" });
          if (!ReceivedDate) return res.status(400).send({ message: "กรุณากรอก Received Date" });
          if (!ECNIssueDate) return res.status(400).send({ message: "กรุณากรอก ECN Issue Date" });
          if (!DrawingNo) return res.status(400).send({ message: "กรุณากรอก Drawing No" });
          if (!InjectionDate) return res.status(400).send({ message: "กรุณากรอก Injection Date" });
          if (!SerialNumber) return res.status(400).send({ message: "กรุณากรอก Serial Number" });
        }

        const pool = await getPool("EnPool", TSM_EN);
        let curDate = new Date();
        if (curDate.getHours() < 8) {
          curDate.setDate(curDate.getDate() - 1);
        }
        let curMonth = curDate.getMonth() + 1;
        let curYear = curDate.getFullYear();
        const runningNo = await pool.request().query(`SELECT ECNRunningNo FROM [MstRunningNum] WHERE Month(MonthYear) = '${curMonth}' AND Year(MonthYear) = '${curYear}';`);

        let ECNRunningNo = "";
        if (runningNo.recordset.length) {
          ECNRunningNo = runningNo.recordset[0].ECNRunningNo + 1;
          await pool
            .request()
            .query(
              `UPDATE [MstRunningNum] SET ECNRunningNo = ${ECNRunningNo} WHERE Month(MonthYear) = ${curMonth} AND YEAR(MonthYear) = ${curYear};`
            );
        } else {
          ECNRunningNo = 1;
          await pool
            .request()
            .query(
              `INSERT INTO [MstRunningNum](MonthYear, ECNRunningNo) VALUES('${curYear}-${curMonth}-1', 1);`
            );
        }
        let RefCode = `EC-${curYear.toString().slice(-2)}${(
          "00" + curMonth
        ).slice(-2)}${("000" + ECNRunningNo).slice(-3)}`;
        const updateFilePath = Ischange == 1 ? `,'${imagePath}'` : `,null`;
        const insertECN = `DECLARE @ECNID INT;
                INSERT INTO [logECN] (RefCode, ECNStatus, ProcessName, Active, PartCode, PartName, CustomerName, Model)
                VALUES ('${RefCode}', 1, '${ProcessName}', 1, N'${PartCode}', N'${PartName}', N'${CustomerName}', N'${Model}');
                SELECT @ECNID = SCOPE_IDENTITY();

                INSERT INTO [logECNIssue] (ECNID, DrawingRevise, ReceivedDate, ECNIssueDate, DrawingNo, CustomerECN, DocumentChange,
                EngineeringProcess,InjectionDate,SerialNumber,DeliveryPO,DeliveryQty,DeliveryDate,[CheckPoint],Remark,ImgFilePath)
                VALUES (@ECNID,N'${DrawingRevise}', '${ReceivedDate}','${ECNIssueDate}',N'${DrawingNo}',N'${CustomerECN}',N'${DocumentChange}'
                ,N'${EngineeringProcess}','${InjectionDate}', N'${SerialNumber}',N'${DeliveryPO}',N'${DeliveryQty}','${DeliveryDate}',N'${CheckPoint}',N'${Remark}' ${updateFilePath});

                INSERT INTO [logECNApprove] (ECNID) VALUES (@ECNID);
                `;
        await pool.request().query(insertECN);
        res.json({ message: "เพิ่มรายการ ECN สําเร็จ" });
      } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  });
};
//!SECTION
const getECNIssues = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNID } = req.body;
    const getECNQury = `SELECT b.RefCode,a.ECNIssueID,a.DrawingRevise, b.Model, b.CustomerName, b.PartCode, b.PartName, a.ReceivedDate, CONVERT(nvarchar,a.ECNIssueDate,23) AS ECNIssueDate
		,a.DrawingNo,a.CustomerECN,a.ImgFilePath,a.DocumentChange,a.EngineeringProcess,CONVERT(nvarchar,a.DeliveryDate,23) AS DeliveryDate,a.DeliveryPO,a.DeliveryQty,a.SerialNumber
		,CONVERT(nvarchar,a.InjectionDate,23) AS InjectionDate,[CheckPoint],a.Remark,a.SendEmail, b.ProcessName
		FROM [logECNIssue] a
		LEFT JOIN [logECN] b ON a.ECNID = b.ECNID
    WHERE a.ECNID = ${ECNID};

    SELECT DepartmentID, DepartmentName FROM [TSMolymer_F].[dbo].[MasterDepartment];
    `;
    const result = await pool.request().query(getECNQury);
    if (result.recordset.length) {
      for (let item of result.recordset) {
        item.CheckPoint = JSON.parse(item.CheckPoint);
      }
      res.json(result.recordset);
    }
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const editECNIssues = async (req, res) => { // Customer, Model, PartCode เก็บ String
  //fixed
  uploadImageECN(req, res, async (err) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: `${err}` });
    } else {
      try {
        const pool = await getPool("EnPool", TSM_EN);
        const {
          ECNIssueID,
          DrawingRevise,
          ReceivedDate,
          ECNIssueDate,
          DrawingNo,
          CustomerECN,
          DocumentChange,
          EngineeringProcess,
          InjectionDate,
          SerialNumber,
          DeliveryPO,
          DeliveryQty,
          DeliveryDate,
          CheckPoint,
          Remark,
          Ischange,
          ProcessName,
          PartCode,
          PartName,
          CustomerName,
          Model
        } = req.body;
        if (!ECNIssueID)
          return res.status(400).send({ message: "ECNIssueID is required" });
        let oldImgPath = await pool
          .request()
          .query(
            `SELECT ImgFilePath FROM logECNIssue WHERE ECNIssueID = ${ECNIssueID}`
          );
        const NewimagePath = req.file ? "/ecn/image/" + req.file.filename : "";
        oldImgPath = oldImgPath.recordset[0].ImgFilePath;
        const updateImagePath =
          Ischange == 1 ? `,imgFilePath = '${NewimagePath}'` : ``;
        if (oldImgPath && NewimagePath) {
          await removeFile(oldImgPath);
        }
        const editECNIssues = `DECLARE @ECNID INT;
        SET @ECNID = (SELECT ECNID FROM [logECNIssue] WHERE ECNIssueID = ${ECNIssueID})
                UPDATE [logECNIssue] SET DrawingRevise = N'${DrawingRevise}' ,ReceivedDate = '${ReceivedDate}', ECNIssueDate = '${ECNIssueDate}',
                DrawingNo = N'${DrawingNo}', CustomerECN = N'${CustomerECN}', DocumentChange = N'${DocumentChange}', EngineeringProcess = N'${EngineeringProcess}', 
                InjectionDate = N'${InjectionDate}', SerialNumber = N'${SerialNumber}', DeliveryPO = N'${DeliveryPO}', DeliveryQty = N'${DeliveryQty}',
                DeliveryDate = N'${DeliveryDate}',[CheckPoint] = N'${CheckPoint}' , Remark = N'${Remark}' ${updateImagePath}  WHERE ECNIssueID = ${ECNIssueID} 

                UPDATE [logECN] SET ProcessName = '${ProcessName}', PartCode = N'${PartCode}', PartName = N'${PartName}', CustomerName = N'${CustomerName}', Model = N'${Model}' WHERE ECNID = @ECNID`;

        await pool.request().query(editECNIssues);
        res.json({ message: "แก้ไขรายการ ECN Issue สำเร็จ" });
      } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  });
};
const deleteECNIssues = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNID } = req.body;
    if (!ECNID) return res.status(400).send({ message: "ECNID is required" });
    const deleteECN = `UPDATE [logECN] SET Active = 0 WHERE ECNID = ${ECNID}`;
    await pool.request().query(deleteECN);
    res.json({ message: "ลบรายการ ECN สำเร็จ" });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const storageECNApprovalFile = multer.diskStorage({
  destination: path.join(__dirname, "../public/ecn/file"),
  filename: (req, file, cb) => {
    let ext = file.mimetype.split("/")[1];
    cb(null, `${Date.now()}.${ext}`);
  },
});
const uploadFileECN = multer({ storage: storageECNApprovalFile }).single(
  "ECN_Approval_File"
);
const getApproval = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNID } = req.body;
    const getQuryApproval = `SELECT a.ECNApproveID,a.SignDeptECN, a.PlanJudgement, a.SupCusApprove, a.ApproveFilePath, a.SendEmail,b.FirstName AS IssueBy,a.IssueSignTime,
		c.FirstName AS CheckBy,a.CheckSignTime, d.FirstName AS ApproveBy,a.ApproveSignTime,a.StatusSignDeptECN
    FROM [logECNApprove] a
    LEFT JOIN TSMolymer_F.dbo.[USER] b ON a.IssueBy = b.UserID
		LEFT JOIN TSMolymer_F.dbo.[USER] c ON a.CheckBy = c.UserID
		LEFT JOIN TSMolymer_F.dbo.[USER] d ON a.ApproveBy = d.UserID
    WHERE a.ECNID = ${ECNID};
    SELECT DepartmentID, DepartmentName FROM [TSMolymer_F].[dbo].[MasterDepartment];
    `;
    const result = await pool.request().query(getQuryApproval);
    if (result.recordset.length) {
      const condeptJson = JSON.parse(result.recordset[0].SignDeptECN) || [];
      result.recordset[0].IssueBy = result.recordset[0].IssueBy
        ? atob(result.recordset[0].IssueBy)
        : "";
      result.recordset[0].CheckBy = result.recordset[0].CheckBy
        ? atob(result.recordset[0].CheckBy)
        : "";
      result.recordset[0].ApproveBy = result.recordset[0].ApproveBy
        ? atob(result.recordset[0].ApproveBy)
        : "";

      for (let item of condeptJson) {
        for (let deptment of result.recordsets[1]) {
          if (item.DepartmentID == deptment.DepartmentID) {
            item.DepartmentName = deptment.DepartmentName;
            break;
          }
        }
      }
      result.recordset[0].SignDeptECN = condeptJson;
    } else {
      return res.json({ message: "ECNID Not Found" });
    }
    res.json(result.recordset);
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const editApproval = async (req, res) => {
  //fixed
  uploadFileECN(req, res, async (err) => {
    if (err) {
      console.log(req.originalUrl, err);
      res.status(400).send({ message: "Internal Server Error" });
    } else {
      try {
        const pool = await getPool("EnPool", TSM_EN);
        let {
          ECNApproveID,
          SignDeptECN,
          PlanJudgement,
          SupCusApprove,
          Ischange,
        } = req.body;

        const NewfilePath = req.file ? "/ecn/file/" + req.file.filename : "";
        const oldFilePath = await pool
          .request()
          .query(
            `SELECT ApproveFilePath FROM [logECNApprove] WHERE ECNApproveID = ${ECNApproveID}`
          );
        if (!ECNApproveID || !PlanJudgement) {
          await removeFile(NewfilePath);
          if (!ECNApproveID)
            return res
              .status(400)
              .send({ message: "ECNApproveID is required" });
          if (!PlanJudgement)
            return res
              .status(400)
              .send({ message: "กรุณาเลือก Plan Judgement" });
        }
        if (NewfilePath && oldFilePath.recordset[0].ApproveFilePath) {
          await removeFile(oldFilePath.recordset[0].ApproveFilePath);
        }
        const updateFilePath =
          Ischange == 1 ? `,ApproveFilePath = '${NewfilePath}'` : ``;
        //info OldDept in DB
        let resultOldDept = await pool
          .request()
          .query(
            `SELECT SignDeptECN FROM [logECNApprove] WHERE ECNApproveID = ${ECNApproveID}`
          );
        const DeptInDB =
          JSON.parse(resultOldDept.recordset[0].SignDeptECN) || [];

        //info NewDept
        let DeptInReq = JSON.parse(SignDeptECN) || [];

        let status = 1;
        let SignDeptArr = [];
        for (let dept of DeptInReq) {
          let old = DeptInDB.filter((v) => dept == v.DepartmentID);
          if (old.length) {
            SignDeptArr.push(old[0]);
            if (!old[0].Value.length) {
              status = 0;
            }
          } else {
            SignDeptArr.push({ DepartmentID: dept, Value: [] });
            status = 0;
          }
        }
        SignDeptArr = JSON.stringify(SignDeptArr);

        // update status WaitApprove
        const editApproval = `DECLARE @ECNID int,
		@StatusECN int ;

        SET @ECNID = (SELECT ECNID FROM [logECNApprove] WHERE ECNApproveID = ${ECNApproveID})
		    SET @StatusECN = (SELECT ECNStatus FROM [logECN] WHERE ECNID = @ECNID)
        UPDATE [logECNApprove] SET SignDeptECN = '${SignDeptArr}' ,PlanJudgement = ${PlanJudgement},
                SupCusApprove = '${SupCusApprove}' ,StatusSignDeptECN = ${status} ${updateFilePath}
                WHERE ECNID = @ECNID
		IF(@StatusECN = 1)
		BEGIN
		 UPDATE [logECN] SET ECNStatus = 2 WHERE ECNID = @ECNID
		END`;
        const checkStatus = `DECLARE @ECNID int,
    @IssueBy int,
    @CheckBy int ,
    @ApproveBy int,
    @PlanJudgement int,
    @StatusSignDeptECN bit;
      SELECT @ECNID = ECNID, @IssueBy = IssueBy, @CheckBy = CheckBy, @ApproveBy = ApproveBy,@PlanJudgement = PlanJudgement,@StatusSignDeptECN = StatusSignDeptECN
      FROM [logECNApprove]
      WHERE ECNApproveID = ${ECNApproveID};
    IF(@PlanJudgement = 2)
      BEGIN 
        IF(@CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND @IssueBy IS NOT NULL)
        BEGIN
          UPDATE [logECN] SET ECNStatus = 4 WHERE ECNID = @ECNID
          UPDATE [logECNApprove] SET CompleteDate = GETDATE() WHERE ECNID = @ECNID
        END
      END
    ELSE
      BEGIN
      IF(@StatusSignDeptECN = 1 AND @CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND  @IssueBy IS NOT NULL)
        BEGIN
           UPDATE [logECN] SET ECNStatus = 3 WHERE ECNID = @ECNID
           UPDATE [logECNApprove] SET CompleteDate =  GETDATE() WHERE ECNID = @ECNID
        END
      END`;
        await pool.request().query(editApproval);
        await pool.request().query(checkStatus);
        res.json({ message: "แก้ไขรายการ ECN Approval สำเร็จ" });
      } catch (err) {
        console.log(req.originalUrl, err);
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  });
};
const signDept = async (req, res) => {
  //fixed
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNApproveID, Username, Password, DateSignTime, DepartmentID } =
      req.body;
    if (!ECNApproveID)
      return res.status(400).send({ message: "ECNApproveID is required" });
    const user = await pool.request().query(
      `SELECT a.UserID,a.FirstName,a.DepartmentID,b.DepartmentName FROM [TSMolymer_F].[dbo].[User] a 
       LEFT JOIN [TSMolymer_F].[dbo].[MasterDepartment] b ON a.DepartmentID = b.DepartmentID WHERE Username = '${Username}' AND Password = '${btoa(
        Password
      )}'`
    );
    if (!user.recordset.length)
      return res
        .status(400)
        .send({ message: "Username หรือ Password ไม่ถูกต้อง" });
    if (user.recordset[0].DepartmentID == 3)
      return res
        .status(400)
        .send({ message: "Engineer ไม่มีสิทธิ์ในการลงชื่อ" });
    const getSignDeptECN = `SELECT SignDeptECN FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}`;
    const resultQuery = await pool.request().query(getSignDeptECN);
    let CondeptJson = JSON.parse(resultQuery.recordset[0].SignDeptECN) || [];

    const UserID = user.recordset[0].UserID;
    const FirstName = atob(user.recordset[0].FirstName);
    const UserDepartmentID = user.recordset[0].DepartmentID;
    const DepartmentName = user.recordset[0].DepartmentName;
    let filterDepartmentID = CondeptJson.filter(
      (x) => x.DepartmentID == UserDepartmentID
    );
    if (!filterDepartmentID.length)
      return res.status(400).send({ message: `ไม่มีแผนก ${DepartmentName}` });
    if (DepartmentID != UserDepartmentID)
      return res
        .status(400)
        .send({ message: `ลงชื่อผิดพลาดต้องลงชื่อที่แผนก ${DepartmentName}` });
    let Status = 1;
    let message = ''
    let findIndexDept = CondeptJson.findIndex(
      (x) => x.DepartmentID == DepartmentID
    );
    if (findIndexDept == -1)
      return res.status(400).send({ message: `ไม่มีแผนก ${DepartmentName}` });

    let findIndexValues = CondeptJson[findIndexDept].Value.findIndex(
      (x) => x.UserID == UserID
    );
    if (findIndexValues != -1) {
      CondeptJson[findIndexDept].Value.splice(findIndexValues, 1);
      message = 'ลงชื่อออกสำเร็จ'
    } else {
      CondeptJson[findIndexDept].Value.push({
        UserID: UserID,
        Name: FirstName,
        DateSignTime: DateSignTime,
      });
      message = 'ลงชื่อสําเร็จ'
    }
    for (let dept of CondeptJson) {
      if (!dept.Value.length) Status = 0;
    }

    let CondeptStr = JSON.stringify(CondeptJson);
    await pool
      .request()
      .query(
        `UPDATE logECNApprove SET SignDeptECN = '${CondeptStr}',StatusSignDeptECN = ${Status} WHERE ECNApproveID = ${ECNApproveID}`
      );
    // Check Status
    const checkStatus = `DECLARE @ECNID int,
      @IssueBy int,
      @CheckBy int ,
      @ApproveBy int,
      @PlanJudgement int,
      @StatusSignDeptECN bit;
        SELECT @ECNID = ECNID, @IssueBy = IssueBy, @CheckBy = CheckBy, @ApproveBy = ApproveBy,@PlanJudgement = PlanJudgement,@StatusSignDeptECN = StatusSignDeptECN
        FROM [logECNApprove]
        WHERE ECNApproveID = ${ECNApproveID};
			IF(@PlanJudgement = 2)
				BEGIN 
					IF(@CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND @IssueBy IS NOT NULL)
					BEGIN
						UPDATE [logECN] SET ECNStatus = 4 WHERE ECNID = @ECNID
						UPDATE [logECNApprove] SET CompleteDate = GETDATE() WHERE ECNID = @ECNID
					END
				END
			ELSE
				BEGIN
				IF(@StatusSignDeptECN = 1 AND @CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND  @IssueBy IS NOT NULL)
					BEGIN
						 UPDATE [logECN] SET ECNStatus = 3 WHERE ECNID = @ECNID
						 UPDATE [logECNApprove] SET CompleteDate =  GETDATE() WHERE ECNID = @ECNID
					END
				END

    `;
    await pool.request().query(checkStatus);

    res.json({ message: message, User: CondeptJson, Status: Status });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const signIssue = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNApproveID, Username, Password, SignIssueTime } = req.body;
    if (!ECNApproveID)
      return res.status(400).send({ message: "ECNApproveID is required" });
    const user = await pool
      .request()
      .query(
        `SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(
          Password
        )}'`
      );
    if (!user.recordset.length)
      return res
        .status(500)
        .send({ message: "Username หรือ Password ไม่ถูกต้อง" });
    let queryPlanjudgement = await pool
      .request()
      .query(
        `SELECT PlanJudgement FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}`
      );
    let PlanJudgement = queryPlanjudgement.recordset[0].PlanJudgement;
    if (!PlanJudgement)
      return res
        .status(400)
        .send({ message: "กรุณาเลือก Plan Judgement และ Save ก่อน" });
    if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19)
      return res.status(400).send({
        message: "สำหรับแผนก Engineer เท่านั้น",
      });
    const userID = user.recordset[0].UserID;
    const updateIssueBy = `DECLARE @IssueBy int;
		SELECT @IssueBy = IssueBy FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}
		IF(@IssueBy = ${userID})
		BEGIN 
		UPDATE logECNApprove SET IssueBy = null ,IssueSignTime = null WHERE ECNApproveID = ${ECNApproveID}
    SELECT Status = 0 ,Message = N'ลงชื่อออกสำเร็จ'
		END
		ELSE 
		BEGIN 
		UPDATE logECNApprove SET IssueBy = ${userID} ,IssueSignTime = '${SignIssueTime}' WHERE ECNApproveID = ${ECNApproveID}
    SELECT Status = 1 ,Message = N'ลงชื่อสำเร็จ'
    END
        `;
    let result = await pool.request().query(updateIssueBy);

    //check status
    const checkStatus = `DECLARE @ECNID int,
    @IssueBy int,
    @CheckBy int ,
    @ApproveBy int,
    @PlanJudgement int,
    @StatusSignDeptECN bit;
      SELECT @ECNID = ECNID, @IssueBy = IssueBy, @CheckBy = CheckBy, @ApproveBy = ApproveBy,@PlanJudgement = PlanJudgement,@StatusSignDeptECN = StatusSignDeptECN
      FROM [logECNApprove]
      WHERE ECNApproveID = ${ECNApproveID};
    IF(@PlanJudgement = 2)
      BEGIN 
        IF(@CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND @IssueBy IS NOT NULL)
        BEGIN
          UPDATE [logECN] SET ECNStatus = 4 WHERE ECNID = @ECNID
          UPDATE [logECNApprove] SET CompleteDate = GETDATE() WHERE ECNID = @ECNID
        END
      END
    ELSE
      BEGIN
      IF(@StatusSignDeptECN = 1 AND @CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND  @IssueBy IS NOT NULL)
        BEGIN
           UPDATE [logECN] SET ECNStatus = 3 WHERE ECNID = @ECNID
           UPDATE [logECNApprove] SET CompleteDate =  GETDATE() WHERE ECNID = @ECNID
        END
      END

  `;
    await pool.request().query(checkStatus);

    let message = result.recordset[0].Message;
    let name =
      result.recordset[0].Status == 0 ? "" : atob(user.recordset[0].FirstName);
    let signTime = result.recordset[0].Status == 0 ? "" : SignIssueTime;

    res.json({ message, name, signTime });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const signCheck = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNApproveID, Username, Password, SignCheckTime } = req.body;
    if (!ECNApproveID)
      return res.status(400).send({ message: "ECNApproveID is required" });
    const user = await pool
      .request()
      .query(
        `SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(
          Password
        )}'`
      );
    if (!user.recordset.length)
      return res
        .status(400)
        .send({ message: `Username หรือ Password ไม่ถูกต้อง` });
    if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19)
      return res.status(400).send({
        message: "สำหรับแผนก Engineer เท่านั้น",
      });
    let queryPlanjudgement = await pool
      .request()
      .query(
        `SELECT PlanJudgement FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}`
      );
    let PlanJudgement = queryPlanjudgement.recordset[0].PlanJudgement;
    if (!PlanJudgement)
      return res
        .status(400)
        .send({ message: "กรุณาเลือก Plan Judgement และ Save ก่อน" });
    const userID = user.recordset[0].UserID;
    const updateCheckBy = `DECLARE @CheckBy int;
		SELECT @CheckBy = CheckBy FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}
		IF(@CheckBy = ${userID})
		BEGIN 
		UPDATE logECNApprove SET CheckBy = null ,CheckSignTime = null WHERE ECNApproveID = ${ECNApproveID}
    SELECT Status = 0, Message = N'ลงชื่อออกสำเร็จ'
		END
		ELSE 
		BEGIN 
		UPDATE logECNApprove SET CheckBy = ${userID} ,CheckSignTime = '${SignCheckTime}' WHERE ECNApproveID = ${ECNApproveID}
    SELECT Status = 1, Message = N'ลงชื่อสำเร็จ'
		END
        `;
    let result = await pool.request().query(updateCheckBy);
    //check status
    const checkStatus = `DECLARE @ECNID int,
    @IssueBy int,
    @CheckBy int ,
    @ApproveBy int,
    @PlanJudgement int,
    @StatusSignDeptECN bit;
      SELECT @ECNID = ECNID, @IssueBy = IssueBy, @CheckBy = CheckBy, @ApproveBy = ApproveBy,@PlanJudgement = PlanJudgement,@StatusSignDeptECN = StatusSignDeptECN
      FROM [logECNApprove]
      WHERE ECNApproveID = ${ECNApproveID};
    IF(@PlanJudgement = 2)
      BEGIN 
        IF(@CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND @IssueBy IS NOT NULL)
        BEGIN
          UPDATE [logECN] SET ECNStatus = 4 WHERE ECNID = @ECNID
          UPDATE [logECNApprove] SET CompleteDate = GETDATE() WHERE ECNID = @ECNID
        END
      END
    ELSE
      BEGIN
      IF(@StatusSignDeptECN = 1 AND @CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND  @IssueBy IS NOT NULL)
        BEGIN
           UPDATE [logECN] SET ECNStatus = 3 WHERE ECNID = @ECNID
           UPDATE [logECNApprove] SET CompleteDate =  GETDATE() WHERE ECNID = @ECNID
        END
      END

  `;
    await pool.request().query(checkStatus);
    let message = result.recordset[0].Message;
    let name =
      result.recordset[0].Status == 0 ? "" : atob(user.recordset[0].FirstName);
    let signTime = result.recordset[0].Status == 0 ? "" : SignCheckTime;

    res.json({ message, name, signTime });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const signApprove = async (req, res) => {
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNApproveID, Username, Password, SignApproveTime } = req.body;
    if (!ECNApproveID)
      return res.status(400).send({ message: "ECNApproveID is required" });
    const user = await pool
      .request()
      .query(
        `SELECT * FROM [TSMolymer_F].[dbo].[User] WHERE Username = '${Username}' AND Password = '${btoa(
          Password
        )}'`
      );
    let queryPlanjudgement = await pool
      .request()
      .query(
        `SELECT PlanJudgement FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}`
      );
    let PlanJudgement = queryPlanjudgement.recordset[0].PlanJudgement;
    if (!PlanJudgement)
      return res
        .status(400)
        .send({ message: "กรุณาเลือก Plan Judgement และ Save ก่อน" });
    if (!user.recordset.length)
      return res
        .status(400)
        .send({ message: `Username หรือ Password ไม่ถูกต้อง` });
    if (user.recordset[0].DepartmentID != 3 && user.recordset[0].DepartmentID != 19)
      return res.status(400).send({
        message: "สำหรับแผนก Engineer เท่านั้น",
      });
    const userID = user.recordset[0].UserID;
    const updateApproveBy = `DECLARE @ApproveBy int;
		SELECT @ApproveBy = ApproveBy FROM logECNApprove WHERE ECNApproveID = ${ECNApproveID}
		IF(@ApproveBy = ${userID})
		BEGIN 
		UPDATE logECNApprove SET ApproveBy = null ,ApproveSignTime = null WHERE ECNApproveID = ${ECNApproveID}
    SELECT Status = 0, Message = N'ลงชื่อออกสำเร็จ'
		END
		ELSE 
		BEGIN 
		UPDATE logECNApprove SET ApproveBy = ${userID} ,ApproveSignTime = '${SignApproveTime}' WHERE ECNApproveID = ${ECNApproveID}
    SELECT Status = 1, Message = N'ลงชื่อสำเร็จ'
		END
        `;
    let result = await pool.request().query(updateApproveBy);
    const checkStatus = `DECLARE @ECNID int,
      @IssueBy int,
      @CheckBy int ,
      @ApproveBy int,
      @PlanJudgement int,
      @StatusSignDeptECN bit;
        SELECT @ECNID = ECNID, @IssueBy = IssueBy, @CheckBy = CheckBy, @ApproveBy = ApproveBy,@PlanJudgement = PlanJudgement,@StatusSignDeptECN = StatusSignDeptECN
        FROM [logECNApprove]
        WHERE ECNApproveID = ${ECNApproveID};
			IF(@PlanJudgement = 2)
				BEGIN 
					IF(@CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND @IssueBy IS NOT NULL)
					BEGIN
						UPDATE [logECN] SET ECNStatus = 4 WHERE ECNID = @ECNID
						UPDATE [logECNApprove] SET CompleteDate = GETDATE() WHERE ECNID = @ECNID
					END
				END
			ELSE
				BEGIN
				IF(@StatusSignDeptECN = 1 AND @CheckBy IS NOT NULL AND @ApproveBy IS NOT NULL AND  @IssueBy IS NOT NULL)
					BEGIN
						 UPDATE [logECN] SET ECNStatus = 3 WHERE ECNID = @ECNID
						 UPDATE [logECNApprove] SET CompleteDate =  GETDATE() WHERE ECNID = @ECNID
					END
				END

    `;
    await pool.request().query(checkStatus);

    let message = result.recordset[0].Message;
    let name =
      result.recordset[0].Status == 0 ? "" : atob(user.recordset[0].FirstName);
    let signTime = result.recordset[0].Status == 0 ? "" : SignApproveTime;

    res.json({ message, name, signTime });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const sendMailECNIssue = async (req, res) => {
  //fixed
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNIssueID, SendEmail } = req.body;
    if (!ECNIssueID)
      return res.status(400).send({ message: "ECNIssueID is required" });
    if (!SendEmail)
      return res.status(400).send({ message: "Email is required" });
    const SendEmailArr = SendEmail.join(", ");
    const queryECNApprove = `DECLARE @ECNID INT, @Email NVARCHAR(255);
    SELECT @ECNID = ECNID, @Email = SendEmail FROM logECNIssue WHERE ECNIssueID = ${ECNIssueID}
    SELECT @ECNID AS ECNID , a.RefCode, a.Model, a.CustomerName, a.PartCode, a.PartName, @Email AS oldEmail
    FROM [logECN] a
    WHERE ECNID = @ECNID
    `;
    const resultECNApprove = await pool.request().query(queryECNApprove);
    let { RefCode, Model, CustomerName, PartCode, PartName, ECNID, oldEmail } =
      resultECNApprove.recordset[0];

    let html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #000;">Alert New ECN Issue</h3>
                    <hr>
                    <div style="margin-bottom: 20px;">
                        <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>RefCode</b>: ${RefCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Code</b>: ${PartCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Name</b>: ${PartName}</div>
                        <div>
                            <a href="http://${IP_SERVER}:${PORT}/ecn/?ECNID=${ECNID}" target="_blank" style="color: #007bff; text-decoration: none;">Edit Approval Link</a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                        <label style="font-weight: bold; color: #000;">Remark</label>
                        <p style="margin: 0; color: #000;">กรุณาตรวจสอบและตอบกลับผ่านลิงค์ด้านบน</p>
                    </div>
                </div>
            </body>
            </html>`;
    MiddleWareSendMail({
      to: SendEmailArr,
      subject: "New ECN Issue",
      html: html,
    });
    oldEmail = JSON.parse(oldEmail) || [];
    for (let item of SendEmail) {
      let filterEmail = oldEmail.findIndex((x) => x == item);
      if (filterEmail == -1) oldEmail.push(item);
    }
    const sendMailQuery = `
        UPDATE logECNIssue SET SendEmail = '${JSON.stringify(
          oldEmail
        )}' WHERE ECNIssueID = ${ECNIssueID}`;

    await pool.request().query(sendMailQuery);
    res.json({ message: "ส่ง Email สำเร็จ" });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const sendMailECNApprove = async (req, res) => {
  //fixed
  try {
    const pool = await getPool("EnPool", TSM_EN);
    const { ECNApproveID, SendEmail } = req.body;
    if (!ECNApproveID)
      return res.status(400).send({ message: "ECNApproveID is required" });
    if (!SendEmail)
      return res.status(400).send({ message: "Email is required" });
    const SendEmailArr = SendEmail.join(", ");
    const queryECNApprove = `DECLARE @ECNID INT,@Email NVARCHAR(255);
    SELECT @ECNID = ECNID, @Email = SendEmail FROM [logECNApprove] WHERE ECNApproveID = ${ECNApproveID}
    SELECT @ECNID AS ECNID, a.RefCode, a.Model, a.CustomerName, a.PartCode, a.PartName ,@Email AS oldEmail
    FROM [logECN] a
    WHERE ECNID = @ECNID
    `;
    const resultECNApprove = await pool.request().query(queryECNApprove);
    let { RefCode, Model, CustomerName, PartCode, PartName, ECNID, oldEmail } =
      resultECNApprove.recordset[0];

    let html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #000;">Alert Sign ECN Approval</h3>
                    <hr>
                    <div style="margin-bottom: 20px;">
                        <div style="margin-bottom: 10px; color: #000;"><b>Model</b>: ${Model}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>RefCode</b>: ${RefCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Customer Name</b>: ${CustomerName}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Code</b>: ${PartCode}</div>
                        <div style="margin-bottom: 10px; color: #000;"><b>Part Name</b>: ${PartName}</div>
                        <div>
                            <a href="http://${IP_SERVER}:${PORT}/ecn/?ECNID=${ECNID}&STEP=2" target="_blank" style="color: #007bff; text-decoration: none;">Sign Approve Link</a>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                        <label style="font-weight: bold; color: #000;">Remark</label>
                        <p style="margin: 0; color: #000;">กรุณาตรวจสอบและตอบกลับผ่านลิงค์ด้านบน</p>
                    </div>
                </div>
            </body>
            </html>`;
    MiddleWareSendMail({
      to: SendEmailArr,
      subject: "New ECN Approval",
      html: html,
    });
    oldEmail = JSON.parse(oldEmail) || [];
    for (let item of SendEmail) {
      let filterEmail = oldEmail.findIndex((x) => x == item);
      if (filterEmail == -1) oldEmail.push(item);
    }
    const sendEmailQuery = `UPDATE logECNApprove SET SendEmail = '${JSON.stringify(
      oldEmail
    )}' WHERE ECNApproveID = ${ECNApproveID}`;
    await pool.request().query(sendEmailQuery);
    res.json({ message: "ส่ง Email สำเร็จ" });
  } catch (err) {
    console.log(req.originalUrl, err);
    res.status(500).send({ message: "Internal Sever Error" });
  }
};
module.exports = {
  getECN,
  addECNIssue,
  getECNIssues,
  editECNIssues,
  deleteECNIssues,
  getApproval,
  editApproval,
  signIssue,
  signCheck,
  signApprove,
  sendMailECNIssue,
  sendMailECNApprove,
  signDept,
};
