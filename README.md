# Project Name: TaskForge

## Description
TaskForge is a simple and easy-to-use team task manager built for EtharaAi assignment. It helps teams collaborate by allowing them to create projects, assign tasks to different members, and track everything in one place. No complicated setup, just a straightforward tool to get work done.

## Features
- **User Authentication**: Secure login and signup system.
- **Role-Based Access**: Different permissions for Admins and regular Members.
- **Project Creation**: Easily create new projects to group related tasks.
- **Task Management**: Create, assign, update, and delete tasks.
- **Team Collaboration**: Add members to projects so everyone stays on the same page.
- **Dashboard**: A clear and modern overview of your projects and assigned tasks.

## Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (using Mongoose)
- **Security**: JWT (JSON Web Tokens) for authentication, bcryptjs for password hashing

## How to Install and Run
Follow these steps to run the project on your own computer:

1. **Get the code**: Download the zip file or clone the repository.
2. **Install dependencies**: Open your terminal in the project folder and run:
   ```bash
   npm install
   ```
3. **Setup environment variables**:
   Create a `.env` file in the main folder. You can copy the variables from `.env.example`. Make sure to add your own MongoDB connection string (`MONGO_URI`) and a secret key for JWT (`JWT_SECRET`).
4. **Start the server**:
   ```bash
   npm start
   ```
5. **Open the app**:
   The backend will start running. Open your web browser and go to `http://localhost:5000` (or whatever port it shows) to use the app.

## Live Demo
Check out the live version of the project here:
[[https://taskforge-final-app.railway.app/](https://taskforge-final-app.railway.app/](https://taskforge-final-app.up.railway.app/login.html))

## How to Contribute
Since this is a college assignment, I'm mostly working on it myself. But if you find any bugs or want to add a cool feature, feel free to help out!
1. Fork the project.
2. Create a new branch for your feature.
3. Make your changes and commit them.
4. Open a Pull Request and I'll take a look.
