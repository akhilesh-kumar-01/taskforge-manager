const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.post('/', auth, taskController.createTask);
router.get('/project/:projectId', auth, taskController.getTasks);
router.put('/status', auth, taskController.updateStatus);
router.put('/:taskId', auth, taskController.updateTask);
router.delete('/:taskId', auth, taskController.deleteTask);
router.get('/dashboard', auth, taskController.getDashboardStats);

module.exports = router;
