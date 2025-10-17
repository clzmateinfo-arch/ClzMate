# Deployment Runbook for ClzMate

## 1. Introduction

### 1.1 Purpose

This runbook provides a detailed, step-by-step procedure for deploying the ClzMate application to a production environment. It is designed to be a practical guide for developers and system administrators, ensuring a smooth, consistent, and successful deployment process.

### 1.2 Audience

This document is intended for individuals with command-line access to the deployment server and foundational knowledge of Git, Node.js, and web server configuration (e.g., Nginx).

## 2. Pre-Deployment Checklist

Before beginning the deployment, ensure all the following prerequisites are met:

-   [ ] **Server Access**: You have SSH access to the target deployment server.
-   [ ] **Node.js Installed**: The latest LTS version of Node.js is installed (`node -v`).
-   [ ] **Git Installed**: Git is installed on the server (`git --version`).
-   [ ] **PM2 Installed**: PM2, a process manager for Node.js, is installed globally (`npm install pm2 -g`). This is crucial for keeping the backend running continuously.
-   [ ] **Web Server Installed**: Nginx or a similar web server is installed and running.
-   [ ] **Database Ready**: The MongoDB database is running and accessible from the deployment server.
-   [ ] **Credentials Gathered**: You have all necessary credentials and keys for the `.env` files (Database connection string, Cloudinary, Razorpay, JWT secret).

## 3. Environment Configuration

The application's configuration is managed through environment variables, which are loaded from a `.env` file. **This file is critical and must not be committed to version control.**

### 3.1 Backend `.env` Configuration

1.  Navigate to the backend directory: `cd /path/to/ClzMate/backend`
2.  Create the environment file: `touch .env`
3.  Open the file (`nano .env`) and add the following content, replacing the placeholder values:

```ini
# Set the environment to production
NODE_ENV=production

# The port the backend server will run on
PORT=5000

# Your MongoDB connection string
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster-url>/ClzMateDB?retryWrites=true&w=majority"

# A long, random, and secret string for signing JWTs
JWT_SECRET="your-super-secret-and-long-jwt-string"

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Razorpay Credentials
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_SECRET="your_razorpay_secret"
```

### 3.2 Frontend `.env` Configuration

1.  Navigate to the frontend directory: `cd /path/to/ClzMate/frontend`
2.  Create the environment file: `touch .env`
3.  Open the file (`nano .env`) and add the following, ensuring the URL points to your backend's public address:

```ini
# The public URL of your backend API
VITE_API_URL="https://api.yourdomain.com/api/v1"
```

## 4. Step-by-Step Deployment Procedure

### 4.1 Deploying the Backend

1.  **Navigate to the Project Root**: `cd /path/to/ClzMate`
2.  **Pull the Latest Code**: `git pull origin main`
3.  **Navigate to Backend Directory**: `cd backend`
4.  **Install Dependencies**: Run `npm install` to install the required packages based on `package-lock.json`.
5.  **Build the Application**: Run `npm run build`. (Note: This step may be specific to your project's build process).
6.  **Start/Restart the Application with PM2**:
    -   **First-time start**: `pm2 start "npm run start:prod" --name "clzmate-backend"`
    -   **To update an existing deployment**: `pm2 restart clzmate-backend`
7.  **Verify**: Check the status of the application with `pm2 list` or view logs with `pm2 logs clzmate-backend`.

### 4.2 Deploying the Frontend

1.  **Navigate to Frontend Directory**: `cd /path/to/ClzMate/frontend`
2.  **Install Dependencies**: `npm install`
3.  **Build the Static Files**: `npm run build`. This command will generate a `dist` directory containing the optimized static assets (HTML, CSS, JS).
4.  **Deploy the Static Files**: Copy the contents of the `dist` directory to the directory your web server is configured to serve from.
    ```bash
    # Example: Copying files to Nginx's web root
    sudo cp -R dist/* /var/www/html/
    ```
5.  **Configure Web Server (Nginx Example)**: Ensure your web server is configured to serve the React application correctly, especially to handle client-side routing.

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com;

        root /var/www/html;
        index index.html;

        location / {
            try_files $uri /index.html;
        }

        # Add a reverse proxy for the API if on the same domain
        location /api/ {
            proxy_pass http://localhost:5000/;
        }
    }
    ```
6.  **Restart Web Server**: `sudo systemctl restart nginx`

## 5. Rollback Strategy

If a deployment introduces a critical bug, follow these steps to revert to the previous stable version:

1.  **Identify the last stable commit hash**: Use `git log` to find the commit hash of the previous working version.
2.  **Stop the backend application**: `pm2 stop clzmate-backend`
3.  **Revert the code**:
    ```bash
    git checkout <stable_commit_hash>
    ```
4.  **Redeploy both frontend and backend**: Follow the complete deployment procedure in section 4 using the reverted code. This ensures all dependencies and build artifacts are consistent with the stable version.
5.  **Start the backend application**: `pm2 start clzmate-backend`

## 6. Monitoring and Verification

-   **Application Health**: Use `pm2 status` to ensure the backend process is `online`.
-   **Application Logs**: Check for any startup errors or runtime exceptions using `pm2 logs clzmate-backend --lines 100`.
-   **Public Website**: Open the application in a web browser and perform a quick smoke test:
    -   Can you load the homepage?
    -   Can you log in and log out?
    -   Is the main course page loading correctly?
-   **Server Resources**: Use commands like `htop` and `df -h` to monitor CPU, memory, and disk usage to ensure the application is not consuming excessive resources.