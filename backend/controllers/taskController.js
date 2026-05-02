const Task = require('../models/Task');
const Project = require('../models/Project');

exports.createTask = async (req, res) => {
    const { title, description, projectId, assignedTo, dueDate } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Check if user is admin of the project
        if (project.adminId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only project admin can create tasks' });
        }

        const task = new Task({
            title,
            description,
            projectId,
            assignedTo,
            dueDate
        });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTasks = async (req, res) => {
    const { projectId } = req.params;
    try {
        const tasks = await Task.find({ projectId }).populate('assignedTo', 'name');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateStatus = async (req, res) => {
    const { taskId, status } = req.body;
    try {
        const task = await Task.findById(taskId).populate('projectId');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const project = task.projectId;
        // Check if user is admin or assigned member
        const isProjectAdmin = project.adminId.toString() === req.user.id;
        const isAssignedMember = task.assignedTo && task.assignedTo.toString() === req.user.id;

        if (!isProjectAdmin && !isAssignedMember) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        task.status = status;
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Check if admin or assigned user (simple check)
        const project = await Project.findById(task.projectId);
        if (project.adminId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only admin can delete tasks' });
        }

        await Task.findByIdAndDelete(taskId);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const projects = await Project.find({ members: req.user.id });
        const projectIds = projects.map(p => p._id);

        const tasks = await Task.find({ projectId: { $in: projectIds } });

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Done').length;
        const pending = tasks.filter(t => t.status !== 'Done').length;
        const overdue = tasks.filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date()).length;

        res.json({ total, completed, pending, overdue });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
