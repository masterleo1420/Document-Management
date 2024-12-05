const { TSM_MASTER, TSM_EN } = require("../../libs/dbconfig/dbconfig.js");
const { getPool } = require('../../middleware/poolManger.js');

const login = async (req, res) => {
    try {
        let pool = await getPool('masterPool', TSM_MASTER);
        let { Username, Password } = req.body;
        let result = await pool.request().query(`SELECT a.UserID, a.Username, a.EmployeeID, a.FirstName, a.LastName, a.Email, a.PositionID, a.DepartmentID,
        b.PositionName,c.DepartmentName
        FROM [User] a
        LEFT JOIN [MasterPosition] b ON a.PositionID = b.PositionID
        LEFT JOIN [MasterDepartment] c ON a.DepartmentID = c.DepartmentID
        WHERE a.Password='${btoa(Password)}' AND a.Username ='${(Username)}' AND a.Active = 1
        `);

        if (result.recordset.length) {
            req.session.IsLoggedIn = true;
            req.session.UserID = result.recordset[0].UserID;
            req.session.EmployeeID = result.recordset[0].EmployeeID;
            req.session.name = `${atob(result.recordset[0].FirstName)} ${atob(result.recordset[0].LastName)}`;
            req.session.DepartmentID = result.recordset[0].DepartmentID;
            req.session.DepartmentName = result.recordset[0].DepartmentName;
            req.session.PositionID = result.recordset[0].PositionID;
            req.session.PositionName = result.recordset[0].PositionName;
            let auth = await pool.request().query(`SELECT * FROM [UserAccess] WHERE UserID = ${result.recordset[0].UserID}`);
            req.session.Auth = auth.recordset[0];
            res.cookie('name', `${atob(result.recordset[0].FirstName)} ${atob(result.recordset[0].LastName)}`);
            res.cookie('PositionName', result.recordset[0].PositionName || '');
            res.cookie('UserID', result.recordset[0].UserID );
            res.cookie('DepartmentID', result.recordset[0].DepartmentID );          
            res.cookie('DepartmentName', result.recordset[0].DepartmentName );          
            return res.redirect(req.session.returnTo || '/');
        } else {
            let user = await pool.request().query(`SELECT * FROM [User] WHERE Username = '${Username}'`);
            if (user.recordset.length) {
                req.flash('error', 'Invalid Password');
                return res.redirect('/login');
            } else {
                req.flash('error', 'Invalid Username');
                return res.redirect('/login');
            }
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Invalid Username or Password');
        res.redirect('/login');

    }
};
const logout = async (req, res) => {
    try {
        console.log(req.session.UserID);
        let pool = await getPool('masterPool', TSM_MASTER);
        await pool.request().query(`INSERT INTO [UserLoginLog](UserID, EventTime, Action) VALUES(${req.session.UserID}, GETDATE(), 'Logout')`);
        // req.session = null;
        req.session.destroy();
        res.redirect('/login');
    } catch (err) {
        res.status(500).send({ message: `${err}` });
    }
};
module.exports = {
    login,
    logout
};
//TODO
//NOTE 
//FIXME 
//ANCHOR SADS
//ANCHOR -
 
