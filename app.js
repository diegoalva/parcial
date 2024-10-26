const express = require('express');
const port = 3000;
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')

app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

app.set('view engine', 'ejs')

app.use(express.static('public')); 

app.use(express.urlencoded({extended:false}))
app.use(express.json())

dotenv.config({path: './env/.env'})

app.use(cookieParser())

app.use('/', require('./router/router'))

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto: ${port} http://localhost:${port}`);
});