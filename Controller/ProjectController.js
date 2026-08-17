import Project from "../Modules/ProjectModule.js";
import User from "../Modules/UserModule.js";
import Role from "../Modules/RoleModules.js";

export const createProject = async (req, res) => {
    try {
        const { projectName, description, startDate, endDate } = req.body;

        if (!projectName) {
            return res.status(400).json({ success: false, message: "Project Name is required" });
        }

        const newProject = new Project({
            projectName,
            description,
            startDate,
            endDate,
        });

        await newProject.save();

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: newProject,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const addProjectMember = async (req, res) => {
    try {
        const { projectId, newMemberId } = req.body;
        const requestorId = req.user.id; // Assuming auth middleware sets req.user.id

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const newMember = await User.findById(newMemberId).populate("role");
        if (!newMember || !newMember.role) return res.status(404).json({ success: false, message: "New member or their role not found" });

        const requestor = await User.findById(requestorId).populate("role");
        if (!requestor) return res.status(404).json({ success: false, message: "Requestor not found" });

        const newMemberRoleName = newMember.role.roleName.toLowerCase();

        let isAuthorized = false;
        let targetArray = null;

        if (requestor.isOwner) {
            // Owner can add any role
            isAuthorized = true;
        } else {
            const requestorRoleName = requestor.role?.roleName?.toLowerCase() || "";

            if (requestorRoleName === "project manager") {
                if (["team lead", "software developer", "intern"].includes(newMemberRoleName)) {
                    isAuthorized = true;
                }
            } else if (requestorRoleName === "team lead") {
                if (["software developer", "intern"].includes(newMemberRoleName)) {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "You are not authorized to add this role to the project based on priority rules." });
        }

        if (newMemberRoleName === "project manager") {
            project.projectManager = newMemberId;
            project.projectManagerAddedBy = requestorId;
        } else if (newMemberRoleName === "team lead") {
            if (!project.teamLeads.some(m => m.userId.toString() === newMemberId)) {
                project.teamLeads.push({ userId: newMemberId, addedBy: requestorId });
            } else {
                return res.status(400).json({ success: false, message: "Member already exists in Team Leads" });
            }
        } else if (newMemberRoleName === "software developer") {
            if (!project.softwareDevelopers.some(m => m.userId.toString() === newMemberId)) {
                project.softwareDevelopers.push({ userId: newMemberId, addedBy: requestorId });
            } else {
                return res.status(400).json({ success: false, message: "Member already exists in Software Developers" });
            }
        } else if (newMemberRoleName === "intern") {
            if (!project.interns.some(m => m.userId.toString() === newMemberId)) {
                project.interns.push({ userId: newMemberId, addedBy: requestorId });
            } else {
                return res.status(400).json({ success: false, message: "Member already exists in Interns" });
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid role for project assignment" });
        }

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            data: project
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id)
            .populate('projectManager', 'firstName lastName email')
            .populate('teamLeads.userId', 'firstName lastName email')
            .populate('softwareDevelopers.userId', 'firstName lastName email')
            .populate('interns.userId', 'firstName lastName email');

        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        return res.status(200).json({ success: true, data: project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('projectManager', 'firstName lastName email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;

        const projects = await Project.find({
            $or: [
                { projectManager: userId },
                { "teamLeads.userId": userId },
                { "softwareDevelopers.userId": userId },
                { "interns.userId": userId },
            ],
        })
            .populate('projectManager', 'firstName lastName email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, description, startDate, endDate, status } = req.body;
        const userId = req.user.id;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const requestor = await User.findById(userId).populate("role");
        const requestorRoleName = requestor?.role?.roleName?.toLowerCase() || "";

        let canUpdate = false;
        if (requestor?.isOwner) {
            canUpdate = true;
        } else if (requestorRoleName === "project manager" && project.projectManager && project.projectManager.toString() === userId) {
            canUpdate = true;
        }

        if (!canUpdate) {
            return res.status(403).json({ success: false, message: "Only Owner or the Project Manager can update this project" });
        }

        if (projectName !== undefined) project.projectName = projectName;
        if (description !== undefined) project.description = description;
        if (startDate !== undefined) project.startDate = startDate;
        if (endDate !== undefined) project.endDate = endDate;
        if (status !== undefined) project.status = status;

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: project,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const removeProjectMember = async (req, res) => {
    try {
        const { projectId, memberId, memberRole } = req.body;
        const requestorId = req.user.id;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const requestor = await User.findById(requestorId).populate("role");
        const requestorRoleName = requestor?.role?.roleName?.toLowerCase() || "";

        let isAuthorized = false;
        if (requestor?.isOwner) {
            isAuthorized = true;
        } else if (requestorRoleName === "project manager") {
            isAuthorized = true;
        } else if (requestorRoleName === "team lead") {
            if (["softwareDevelopers", "interns"].includes(memberRole)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "You are not authorized to remove this member" });
        }

        if (memberRole === "projectManager") {
            if (project.projectManager && project.projectManager.toString() === memberId) {
                project.projectManager = undefined;
                project.projectManagerAddedBy = undefined;
            }
        } else if (memberRole === "teamLeads") {
            project.teamLeads = project.teamLeads.filter(m => m.userId.toString() !== memberId);
        } else if (memberRole === "softwareDevelopers") {
            project.softwareDevelopers = project.softwareDevelopers.filter(m => m.userId.toString() !== memberId);
        } else if (memberRole === "interns") {
            project.interns = project.interns.filter(m => m.userId.toString() !== memberId);
        } else {
            return res.status(400).json({ success: false, message: "Invalid memberRole. Use one of: projectManager, teamLeads, softwareDevelopers, interns" });
        }

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
            data: project,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const requestor = await User.findById(userId).populate("role");
        const requestorRoleName = requestor?.role?.roleName?.toLowerCase() || "";

        let canDelete = false;
        if (requestor?.isOwner) {
            canDelete = true;
        } else if (requestorRoleName === "project manager" && project.projectManager && project.projectManager.toString() === userId) {
            canDelete = true;
        }

        if (!canDelete) {
            return res.status(403).json({ success: false, message: "Only Owner or the Project Manager can delete this project" });
        }

        await Project.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};