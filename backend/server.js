require('dotenv').config();
require('dotenv-flow').config({ silent: true });

const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { connectDB } = require('./src/config/database');
const { cloudinaryConnect } = require('./src/config/cloudinary');

const userRoutes = require('./src/routes/user');
const profileRoutes = require('./src/routes/profile');
const paymentRoutes = require('./src/routes/payments');
const courseRoutes = require('./src/routes/course');
const adminRoutes = require('./src/routes/admin');
const cartRoutes = require("./src/routes/cart");
const studentRoutes = require("./src/routes/student");
const statsRoutes = require("./src/routes/stats");

const raw = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins = raw.split(',').map(s => s.trim()).filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

const blockNoOrigin = (process.env.CORS_BLOCK_NO_ORIGIN || 'false').toLowerCase() === 'true';

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, !blockNoOrigin);
        }

        if (allowedOrigins.length === 0) {
            return callback(null, false);
        }

        return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return cors(corsOptions)(req, res, () => res.sendStatus(204));
    }
    next();
});

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next();

    if (allowedOrigins.length === 0) {
        return res.status(403).json({ error: 'CORS origin not allowed (no allowed origins configured)' });
    }

    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'CORS origin not allowed' });
    }

    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp' }));

connectDB();
cloudinaryConnect();

app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/site', statsRoutes);

app.get('/', (req, res) => {
    res.send(`<div><p>Hi!</p></div>`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Started on PORT ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
