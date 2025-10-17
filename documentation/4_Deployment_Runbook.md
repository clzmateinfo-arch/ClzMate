
# Deployment Runbook

## 1. Introduction

This document provides a step-by-step guide for deploying the ClzMate MVP. It is intended for DevOps engineers and developers responsible for deploying the application.

## 2. Prerequisites

Before deploying the application, ensure that the following prerequisites are met:

-   **Node.js and npm**: The latest LTS version of Node.js and npm should be installed on the deployment server.
-   **MongoDB**: A running instance of MongoDB is required. The connection string should be configured in the backend's environment variables.
-   **Cloudinary Account**: A Cloudinary account is required for file uploads. The API key and secret should be configured in the backend's environment variables.
-   **Razorpay Account**: A Razorpay account is required for payment processing. The key ID and secret should be configured in the backend's environment variables.
-   **Git**: Git should be installed on the deployment server to clone the repository.

## 3. Environment Configuration

The application uses environment variables for configuration. Create a `.env` file in the `backend` directory with the following variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_SECRET=<your_razorpay_secret>
```

Create a `.env` file in the `frontend` directory with the following variables:

```
VITE_API_URL=http://localhost:5000/api/v1
```

Replace the placeholder values with your actual configuration.

## 4. Deployment Steps

### 4.1 Backend Deployment

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd ClzMate/backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the application**:
    ```bash
    npm run build
    ```

4.  **Start the application**:
    ```bash
    npm run start:prod
    ```

It is recommended to use a process manager like PM2 to run the application in production.

### 4.2 Frontend Deployment

1.  **Navigate to the frontend directory**:
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the application**:
    ```bash
    npm run build
    ```

4.  **Serve the static files**:
    The `npm run build` command will create a `dist` directory with the static files. These files can be served by a web server like Nginx or Apache.

## 5. Rollback Strategy

In case of a deployment failure, the following rollback strategy can be used:

1.  **Stop the application**: Stop the running application using the process manager (e.g., `pm2 stop <app_name>`).
2.  **Revert to the previous version**: Use Git to revert to the previous stable commit.
3.  **Redeploy**: Follow the deployment steps again to deploy the previous version.

## 6. Monitoring

It is recommended to monitor the application for errors and performance issues. The following can be monitored:

-   **Application logs**: Monitor the application logs for any errors or exceptions.
-   **Server resources**: Monitor the server's CPU, memory, and disk usage.
-   **API endpoints**: Monitor the response times and error rates of the API endpoints.
