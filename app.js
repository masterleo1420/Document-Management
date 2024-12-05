const express = require("express");
const dotenv = require("dotenv");
const flash = require("express-flash");
const session = require("express-session");
dotenv.config();
const app = express();
const path = require("path");
const morgan = require("morgan");
const port = process.env.PORT || 3100;
const server = require("http").createServer(app);
const cookieParser = require('cookie-parser')
app.use(cookieParser())
//* สร้าง Redis Client
const Redis = require('ioredis'); // Instead of 'connect-redis'
const redisClient = new Redis({
    // Add your Redis configuration here
    host: 'localhost',
    port: 6379,
    keyPrefix: 'tsmen_prefix:', // Add a prefix to the session keys (optional)
    enableReadyCheck: true,
    lazyConnect: true,
    // Add any other Redis options as needed
});

//* สร้าง Session Store
const sessionStore = new (require('connect-redis')(session))({
    client: redisClient,
    // Add other options as needed
});

//Set view engine
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);

//Set static files
app.use(express.static(__dirname + "/assets"));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/scripts"));
app.use(express.static(__dirname + "/node_modules"));
app.use(express.static(__dirname + "/libs"));

app.use(morgan("dev"));
app.use(flash());
app.use(session(
  {
    name: "tsmen_session",
    secret: "tsmenkey",
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600*24*1000 // 1 day
    },
    rolling: true
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//* สร้าง route
const userRouter = require("./routes/userRouter/userRouter");
const pageRouter = require("./routes/page");
const dropdownRouter = require("./routes/dropdownRouters");
const projectRouter = require('./routes/projectRouter');
const ecnRouter = require("./routes/ecnRouter");
const ppcRouter = require("./routes/ppcRouter");
const settingRouter = require("./routes/settingRouter");

//* ใช้ route
app.use("/user",userRouter);
app.use("/", pageRouter);
app.use("/dropdown", dropdownRouter);
app.use("/project", projectRouter);
app.use("/ppc", ppcRouter);
app.use("/ecn", ecnRouter);
app.use("/setting", settingRouter);

//* เรียก Cron
const cron = require('./middleware/cronSchedule');

//* เรียก swagger
const {swaggerUI,swaggerDocument} = require('./libs/swagger/swaggerConfig')
app.use('/docs', swaggerUI.serve,swaggerUI.setup(swaggerDocument))

//* สร้าง server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`, new Date());
});

//* route สำหรับหน้า 404
app.all("*", (req, res) => {
  res.status(404).send("<h1>Page not found</h1>");
});
