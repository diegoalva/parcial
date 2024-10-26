const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const conexion = require('../database/db')
const { promisify } = require('util')
const { error } = require('console')

exports.register = async (req, res) => {
    try {
        const name = req.body.name
        const user = req.body.user
        const pass = req.body.pass
        let passHash = await bcryptjs.hash(pass, 8)
        conexion.query('INSERT INTO user SET ?', { user: user, name: name, pass: passHash }, (error, results) => {
            if (error) { console.log(error) }
            res.redirect('/menu')
        })
    } catch (error) {
        console.log(error)
    }
}

exports.login = async (req, res) => {
    try {
        // Verifica si ya está autenticado
        if (req.cookies.jwt) {
            console.log('Usuario ya está autenticado, redirigiendo a /menu');
            return res.redirect('/menu'); // Redirige a /menu si ya está autenticado
        }

        const user = req.body.user;
        const pass = req.body.pass;

        if (!user || !pass) {
            return res.render('login', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Ingrese un Usuario y contraseña",
                alertIcon: 'info',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        } 

        // Realiza la consulta a la base de datos
        conexion.query('SELECT * FROM user WHERE user = ?', [user], async (error, results) => {
            if (error) {
                console.error('Error en la consulta:', error);
                return res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Ocurrió un error al procesar la solicitud.",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }

            if (!results || results.length === 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                console.log('Usuario y/o Password incorrectas');
                return res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o Password incorrectas",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            } 

            const id = results[0].id;
            const token = jwt.sign({ id: id }, process.env.JWT_SECRETO, {
                expiresIn: process.env.JWT_TIEMPO_EXPIRA
            });
            console.log(token + " " + user);

            const cookiesOptions = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                httpOnly: true
            };
            res.cookie('jwt', token, cookiesOptions);
            console.log('Token establecido en la cookie, redirigiendo a /menu');
            return res.redirect('/menu'); // Redirige a /menu
        });
    } catch (error) {
        console.log('Error en el proceso de inicio de sesión:', error);
        return res.render('login', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Ocurrió un error inesperado.",
            alertIcon: 'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'login'
        });
    }
};

exports.isAuthenticated = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO);
            console.log('Token decodificado:', decodificada);
            conexion.query('SELECT * FROM user WHERE id = ?', [decodificada.id], (error, results) => {
                if (error || !results.length) { 
                    console.log('No se encontró el usuario, continuar con el siguiente middleware');
                    return next(); // Si hay error o no hay usuario, continuar con el siguiente middleware
                }
                req.user = results[0]; // Asigna el usuario a la solicitud
                console.log('Usuario autenticado:', req.user);
                return next(); // Continúa al siguiente middleware
            });
        } catch (error) {
            console.log('Error al verificar el token:', error);
            return next(); // Si hay un error al decodificar el token, continúa
        }
    } else {
        console.log('No hay cookie JWT, redirigiendo a /login');
        res.redirect('/login'); // Redirige si no hay cookie
    }
};

exports.logout = (req, res)=>{
    res.clearCookie('jwt')   
    return res.redirect('/')
}