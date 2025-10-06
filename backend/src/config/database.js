const mongoose = require('mongoose');
require('dotenv-flow').config();

const DEFAULT_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
};

async function connectDB() {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    try {
        await mongoose.connect(uri, DEFAULT_OPTIONS);

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

        return mongoose.connection;
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }
}

module.exports = { connectDB };
