const ifNotLoggedIn = (req, res, next) => {
    if (!req.session.IsLoggedIn) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
}
const IsCookie = (req, res, next) => {
    let name = req.session.name
    let PositionName = req.session.PositionName
    let userID = req.session.UserID
    let departmentID = req.session.DepartmentID

    if (!req.cookies.name) res.cookie('name', name);
    if (!req.cookies.PositionName) res.cookie('PositionName', PositionName);
    if (!req.cookies.UserID) res.cookie('UserID', userID);
    if (!req.cookies.DepartmentID) res.cookie('DepartmentID', departmentID);
    next();
}
const isAuthPageMasterSetting = (req, res, next) => {
    let departmentID = req.session.DepartmentID;
    if (departmentID != 3 && departmentID != 19) {
        return res.status(401).send(`
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: linear-gradient(135deg, #f8f9fa, #e0e0e0);
                font-family: 'Arial', sans-serif;
            ">
                <h1 style="
                    color: #ff4d4f; 
                    font-size: 48px; 
                    margin-bottom: 20px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                ">
                    🚫 ไม่มีสิทธิ์เข้าถึง
                </h1>
                <button 
                    onclick="document.location='mstProject.html'" 
                    style="
                        background-color: #4CAF50; 
                        color: white; 
                        padding: 15px 40px; 
                        border: none; 
                        border-radius: 12px; 
                        font-size: 20px; 
                        font-weight: bold; 
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        cursor: pointer; 
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.backgroundColor='#45a049'; this.style.transform='scale(1.05)';"
                    onmouseout="this.style.backgroundColor='#4CAF50'; this.style.transform='scale(1)';"
                >
                    🔙 กลับหน้าหลัก
                </button>
            </div>
        `);
    }
    next();
};
const isAuthPart = (req, res, next) => {
    let departmentID = req.session.DepartmentID;
    if (departmentID != 3 && departmentID != 7 && departmentID != 11 && departmentID != 19) {
        return res.status(401).send(`
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: linear-gradient(135deg, #f8f9fa, #e0e0e0);
                font-family: 'Arial', sans-serif;
            ">
                <h1 style="
                    color: #ff4d4f; 
                    font-size: 48px; 
                    margin-bottom: 20px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                ">
                    🚫 ไม่มีสิทธิ์เข้าถึง
                </h1>
                <button 
                    onclick="document.location='mstProject.html'" 
                    style="
                        background-color: #4CAF50; 
                        color: white; 
                        padding: 15px 40px; 
                        border: none; 
                        border-radius: 12px; 
                        font-size: 20px; 
                        font-weight: bold; 
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        cursor: pointer; 
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.backgroundColor='#45a049'; this.style.transform='scale(1.05)';"
                    onmouseout="this.style.backgroundColor='#4CAF50'; this.style.transform='scale(1)';"
                >
                    🔙 กลับหน้าหลัก
                </button>
            </div>
        `);
    }
    next();
}

// const isAuthPage = (permission) => {
//     return (req, res, next) => {
//         let auth = req.session.Auth;
//         if (auth[permission] == 'None') {
//             return res.send('<h1>ไม่มีสิทธิ์เข้าถึง</h1>')
//         }
//         next();
//     }
// }

// const isAuthEdit = (permission) => {
//     return (req, res, next) => {
//         let auth = req.session.Auth;
//         if (auth[permission] == 'None' || auth[permission] == 'View') {
//             return res.status(400).send({
//                 message: 'ไม่ได้รับอนุญาต'
//             })
//         }
//         next();
//     }
// }
const isAuthEditEn = async (req, res, next) => {
    try {
        req.session.DepartmentID === 3 ? next() : res.status(400).send({ message: 'ไม่มีสิทธิ์แก้ไข' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}


module.exports = {
    ifNotLoggedIn,
    isAuthEditEn,
    IsCookie,
    isAuthPageMasterSetting,
    isAuthPart
};

