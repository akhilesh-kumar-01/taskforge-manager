const API_URL = '/api';

// Helper to get token
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user'));

// Check if logged in
if (!getToken() && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html') && window.location.pathname !== '/') {
    window.location.href = 'login.html';
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.clear();
        window.location.href = 'login.html';
    };
}

// Signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message);
        }
    };
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message);
        }
    };
}

// Dashboard Stats
const loadDashboard = async () => {
    const user = getUser();
    if (user) {
        document.getElementById('userName').innerText = user.name;
        document.getElementById('userRole').innerText = user.role;
    }

    const res = await fetch(`${API_URL}/tasks/dashboard`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    document.getElementById('totalTasks').innerHTML = `<span class="value">${data.total || 0}</span>`;
    document.getElementById('completedTasks').innerHTML = `<span class="value">${data.completed || 0}</span>`;
    document.getElementById('pendingTasks').innerHTML = `<span class="value">${data.pending || 0}</span>`;
    document.getElementById('overdueTasks').innerHTML = `<span class="value">${data.overdue || 0}</span>`;

    loadProjects();
};

// Projects
const loadProjects = async () => {
    const res = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const projects = await res.json();
    const list = document.getElementById('projectList');
    list.innerHTML = '';
    projects.forEach(p => {
        const div = document.createElement('div');
        div.className = 'project-item';
        div.innerHTML = `
            <div>
                <strong>${p.name}</strong><br>
                <small style="color: var(--text-muted)">Admin: ${p.adminId.name}</small>
            </div>
            <a href="project.html?id=${p._id}" style="color: var(--primary); font-weight: 600;">View Tasks</a>
        `;
        list.appendChild(div);
    });
};

const createProjectForm = document.getElementById('createProjectForm');
if (createProjectForm) {
    createProjectForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('projectName').value;
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            loadDashboard();
            document.getElementById('projectName').value = '';
        }
    };
}

// Project Details
const loadProjectDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) return;

    // Get tasks
    const resTasks = await fetch(`${API_URL}/tasks/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const tasks = await resTasks.json();
    
    // Get project members and info
    const resProjects = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const projects = await resProjects.json();
    const project = projects.find(p => p._id === projectId);
    
    if (!project) return;
    document.getElementById('projectTitle').innerText = project.name;

    const currentUserId = getUser().id;
    const isProjectAdmin = project.adminId._id === currentUserId;
    window.currentProjectAdminId = project.adminId._id;

    // Show admin panel if admin
    if (isProjectAdmin) {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('createTaskForm').style.display = 'block';
        if (document.getElementById('createTaskHeader')) document.getElementById('createTaskHeader').style.display = 'block';
    } else {
        document.getElementById('createTaskForm').style.display = 'none';
        if (document.getElementById('createTaskHeader')) document.getElementById('createTaskHeader').style.display = 'none';
    }

    // Populate assignedTo dropdown
    const assignedToSelect = document.getElementById('assignedTo');
    if (assignedToSelect) {
        assignedToSelect.innerHTML = '<option value="">Select Member</option>';
        if (project.members) {
            project.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m._id;
                opt.innerText = `${m.name} (${m.email})`;
                assignedToSelect.appendChild(opt);
            });
        }
    }

    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    window.currentTasks = tasks;
    
    tasks.forEach(t => {
        const div = document.createElement('div');
        div.className = 'task-item';
        const isAssigned = t.assignedTo && t.assignedTo._id === currentUserId;
        const canUpdate = isProjectAdmin || isAssigned;

        div.innerHTML = `
            <div>
                <strong style="cursor: pointer; color: var(--primary); text-decoration: underline;" onclick="openTaskModal('${t._id}')">${t.title}</strong><br>
                <small style="color: var(--text-muted)">Assigned to: ${t.assignedTo ? t.assignedTo.name : 'Unassigned'}</small>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <select ${!canUpdate ? 'disabled' : ''} onchange="updateTaskStatus('${t._id}', this.value)" style="width: auto;">
                    <option value="To Do" ${t.status === 'To Do' ? 'selected' : ''}>To Do</option>
                    <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${t.status === 'Done' ? 'selected' : ''}>Done</option>
                </select>
                ${isProjectAdmin ? `<button onclick="deleteTask('${t._id}')" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 5px 10px;">Delete</button>` : ''}
            </div>
        `;
        taskList.appendChild(div);
    });
};

window.openTaskModal = (taskId) => {
    const task = window.currentTasks.find(t => t._id === taskId);
    if (!task) return;
    
    const isProjectAdmin = window.currentProjectAdminId === getUser().id;
    
    document.getElementById('editTaskId').value = task._id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    if (task.dueDate) {
        document.getElementById('editDueDate').value = task.dueDate.split('T')[0];
    } else {
        document.getElementById('editDueDate').value = '';
    }
    
    document.getElementById('editTaskTitle').readOnly = !isProjectAdmin;
    document.getElementById('editTaskDescription').readOnly = !isProjectAdmin;
    document.getElementById('editDueDate').readOnly = !isProjectAdmin;
    document.getElementById('updateTaskBtn').style.display = isProjectAdmin ? 'block' : 'none';
    
    document.getElementById('taskModal').style.display = 'block';
};

window.closeTaskModal = () => {
    document.getElementById('taskModal').style.display = 'none';
};

const editTaskForm = document.getElementById('editTaskForm');
if (editTaskForm) {
    editTaskForm.onsubmit = async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTaskTitle').value;
        const description = document.getElementById('editTaskDescription').value;
        const dueDate = document.getElementById('editDueDate').value;

        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ title, description, dueDate })
        });
        if (res.ok) {
            closeTaskModal();
            loadProjectDetails();
        } else {
            const data = await res.json();
            alert(data.message);
        }
    };
}

window.updateTaskStatus = async (taskId, status) => {
    const res = await fetch(`${API_URL}/tasks/status`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ taskId, status })
    });
    if (!res.ok) {
        const data = await res.json();
        alert(data.message);
    }
    loadProjectDetails();
};

window.deleteTask = async (taskId) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) {
        const data = await res.json();
        alert(data.message);
    }
    loadProjectDetails();
};

const addMemberForm = document.getElementById('addMemberForm');
if (addMemberForm) {
    addMemberForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('memberEmail').value;
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        const res = await fetch(`${API_URL}/projects/add-member`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ projectId, email })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Member added');
            document.getElementById('memberEmail').value = '';
            loadProjectDetails();
        } else {
            alert(data.message);
        }
    };
}

const createTaskForm = document.getElementById('createTaskForm');
if (createTaskForm) {
    createTaskForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const assignedTo = document.getElementById('assignedTo').value;
        const dueDate = document.getElementById('dueDate').value;
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ title, description, projectId, assignedTo, dueDate })
        });
        if (res.ok) {
            loadProjectDetails();
            createTaskForm.reset();
        } else {
            const data = await res.json();
            alert(data.message);
        }
    };
}

// Initial Loads
if (window.location.pathname.includes('dashboard.html')) loadDashboard();
if (window.location.pathname.includes('project.html')) loadProjectDetails();

