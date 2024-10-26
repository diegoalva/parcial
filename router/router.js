const express = require('express')
const router = express.Router()

const authController =  require('../controller/authController')

router.get('/', (req, res) => {
    res.render('index')
});

router.get('/login', (req, res) => {
    res.render('login', {alert:false})
});
router.get('/register', (req, res) => {
    res.render('register')
});

router.get('/menu', authController.isAuthenticated, (req, res) => {
    res.render('menu', { user: req.user });
});


//router metodos

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/logout', authController.logout)

module.exports = router