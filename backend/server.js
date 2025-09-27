const express = require('express')
const app = express();

const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv-flow').config({ silent: true });

const { connectDB } = require('./src/config/database');
const { cloudinaryConnect } = require('./src/config/cloudinary');

const userRoutes = require('./src/routes/user');
const profileRoutes = require('./src/routes/profile');
const paymentRoutes = require('./src/routes/payments');
const courseRoutes = require('./src/routes/course');
const adminRoutes = require('./src/routes/admin');
const cartRoutes = require("./src/routes/cart");


app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
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

connectDB();
cloudinaryConnect();

app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use("/api/v1/cart", cartRoutes);

app.get('/', (req, res) => {
    res.send(`<div>
    <p>Hi!</p>
    </div>`);
})