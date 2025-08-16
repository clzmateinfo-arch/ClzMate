#Backend

PORT=5000
DATABASE_URL=mongodb+srv://cmint:Sandeepa1994@cm.ei9wtnf.mongodb.net/?retryWrites=true&w=majority&appName=cm
MAIL_HOST=smtp.gmail.com
MAIL_USER=clzmate.info@gmail.com
MAIL_PASS=emlguxaccyyeouux
CLOUD_NAME=dfay7bp1e
API_KEY=499363241349988
API_SECRET=JksnGziAdmGzEaYotPqUr3ondyQ
FOLDER_NAME=data
JWT_SECRET=puncha
API_URL=http://localhost:5000/api/v1


#render
bash ./scripts/deploy.sh
npm run start:render

#Frontend

VITE_APP_BASE_URL=http://localhost:5000/api/v1
VITE_APP_RAZORPAY_KEY=
