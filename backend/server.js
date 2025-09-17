const express = require('express')
const app = express();

// packages
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv-flow').config({ silent: true });

// connection to DB and cloudinary
const { connectDB } = require('./src/config/database');
const { cloudinaryConnect } = require('./src/config/cloudinary');

// routes
const userRoutes = require('./src/routes/user');
const profileRoutes = require('./src/routes/profile');
const paymentRoutes = require('./src/routes/payments');
const courseRoutes = require('./src/routes/course');

// middleware 
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        // origin: 'http://localhost:5173', // frontend link
        origin: "*",
        credentials: true
    })
);
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp'
    })
)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Started on PORT ${PORT} in ${process.env.NODE_ENV} mode`);
});

// connections
connectDB();
cloudinaryConnect();

// mount route
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);

// Default Route
app.get('/', (req, res) => {
    // console.log('Your server is up and running..!');
    res.send(`<div>
    This is Default Route  
    <p>Everything is OK</p>
    </div>`);
})