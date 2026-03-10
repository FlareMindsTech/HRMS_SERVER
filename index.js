import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose'
import dotenv from "dotenv"
import cors from "cors"
import user from './Routes/UserRouter.js';
import role from './Routes/RoleRouter.js';
import menu from './Routes/MenuRouter.js';
import experience from './Routes/ExperienceRouter.js';
import address from "./Routes/addressRouter.js";
import family from './Routes/FamilyRouter.js';
import roleMenu from './Routes/RoleMenuRouter.js';
import education from './Routes/EducationRoutes.js';
import document from './Routes/DocumentRouter.js';
import currentCompany from './Routes/CurrentCompanyRouter.js';
import leave from './Routes/LeaveRouter.js';
import dailyReport from './Routes/DailyReportRouter.js';
import attendance from './Routes/AttendanceRouter.js';
import project from './Routes/ProjectRouter.js';
import task from './Routes/TaskRouter.js';
import timeTracking from './Routes/TimeTrackingRouter.js';
import sprint from './Routes/SprintRouter.js';
import dashboard from './Routes/DashboardRouter.js';






dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB... ' + err.message));

app.use("/api/user", user)
app.use("/api/menu", menu)
app.use("/api/experience", experience);
app.use("/api/address", address);
app.use("/api/role", role)
app.use("/api/family", family)
app.use("/api/rolemenu", roleMenu);
app.use("/api/education", education);
app.use("/api/document", document);
app.use("/api/currentcompany", currentCompany);
app.use("/api/leave", leave);
app.use("/api/daily-report", dailyReport);
app.use("/api/attendance", attendance);
app.use("/api/project", project);
app.use("/api/task", task);
app.use("/api/time-tracking", timeTracking);
app.use("/api/sprint", sprint);
app.use("/api/dashboard", dashboard);









const PORT = process.env.PORT || 7800;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
