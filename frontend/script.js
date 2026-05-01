const API_URL = "/api";

// Helper to get token
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user'));

// Check if logged in
if (!getToken() && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
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

        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
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
    const res = await fetch(`${API_URL}/tasks/dashboard`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    document.getElementById('totalTasks').innerText = data.total || 0;
    document.getElementById('completedTasks').innerText = data.completed || 0;
    document.getElementById('pendingTasks').innerText = data.pending || 0;
    document.getElementById('overdueTasks').innerText = data.overdue || 0;

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
            <span>${p.name} (Admin: ${p.adminId.name})</span>
            <a href="project.html?id=${p._id}">View Tasks</a>
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

    // Get project info (could add a route for this, but let's reuse projects list for simplicity or just fetch tasks)
    const resTasks = await fetch(`${API_URL}/tasks/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const tasks = await resTasks.json();
    
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    tasks.forEach(t => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div>
                <strong>${t.title}</strong> - <span class="status-${t.status.replace(' ', '').toLowerCase()}">${t.status}</span><br>
                <small>Assigned to: ${t.assignedTo ? t.assignedTo.name : 'Unassigned'}</small>
            </div>
            <div>
                <select onchange="updateTaskStatus('${t._id}', this.value)">
                    <option value="To Do" ${t.status === 'To Do' ? 'selected' : ''}>To Do</option>
                    <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${t.status === 'Done' ? 'selected' : ''}>Done</option>
                </select>
                <button onclick="deleteTask('${t._id}')">Delete</button>
            </div>
        `;
        taskList.appendChild(div);
    });

    // Check if user is admin of this project (simple approach: fetch projects and find this one)
    const resProjects = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const projects = await resProjects.json();
    const project = projects.find(p => p._id === projectId);
    if (project) {
        document.getElementById('projectTitle').innerText = project.name;
        if (project.adminId._id === getUser().id) {
            document.getElementById('adminPanel').style.display = 'block';
        }
    }
};

window.updateTaskStatus = async (taskId, status) => {
    await fetch(`${API_URL}/tasks/status`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ taskId, status })
    });
    loadProjectDetails();
};

window.deleteTask = async (taskId) => {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) alert(data.message);
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
        }
    };
}

// Initial Loads
if (window.location.pathname.includes('dashboard.html')) loadDashboard();
if (window.location.pathname.includes('project.html')) loadProjectDetails();
