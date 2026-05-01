const Project = require('../models/Project');
const User = require('../models/User');

exports.createProject = async (req, res) => {
    const { name } = req.body;
    try {
        const project = new Project({
            name,
            adminId: req.user.id,
            members: [req.user.id]
        });
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ members: req.user.id }).populate('adminId', 'name');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addMember = async (req, res) => {
    const { projectId, email } = req.body;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.adminId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only admin can add members' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (project.members.includes(user._id)) {
            return res.status(400).json({ message: 'User already a member' });
        }

        project.members.push(user._id);
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
