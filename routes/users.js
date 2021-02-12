const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


const app = express();

//DB Config
const db = require ('../config/keys').MongoURI;

//Connect to Mongo
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(() => console.log('MongoDB Connected users...')).catch((err => console.log(err)));
var connection = mongoose.connection;


//User model
const User = require('../models/User');
//Cliente model
const Cliente = require('../models/Cliente');
//Evaluador model
const Evaluador = require('../models/Evaluador');


// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));


//Login
router.get('/login',(req, res) => res.render('login'));

//Register
router.get('/register',(req, res) => res.render('register'));

//Cliente
router.get('/cliente',(req, res) => res.render('cliente'));


//Evaluador
router.get('/evaluador',(req, res) => res.render('evaluador'));

 // Init gfs
 let gfs;

 connection.once('open', () => {
   // Init stream
   gfs = Grid(connection.db, mongoose.mongo);
   gfs.collection('uploads');
 });
 
 // Create storage engine
 const storage = new GridFsStorage({
   url: db,
   options: { useNewUrlParser: true, useUnifiedTopology: true },
   file: (req, file) => {
         return new Promise((resolve, reject) => {
             crypto.randomBytes(16, (err, buf) => {
               if (err) {
                 return reject(err);
               }
               
                 const filename = buf.toString('hex') + path.extname(file.originalname);
               const fileInfo = {
                 filename: filename,
                 bucketName: 'uploads'
               };
               resolve(fileInfo);
               
             });
           });
         
   }
 });

//Informacion de Cliente
router.post('/cliente', (req, res) => {
  
    const upload = multer({ storage }).array('documentos', 10);
   

    upload(req, res, function (err) {
        const { nombre, apellido1, apellido2, calle, numero, colonia, codigop, telefono, rfc, documentos = req.files  } = req.body;
        
        let errors = [];
       
        //Campos obligatorios
if(!nombre || !apellido1 || !calle || !numero ||!colonia || !codigop || !telefono || !rfc || !documentos ){
    errors.push({ msg: 'Por favor llene todas las areas requeridas' })
}

//Codigo Postal
if(codigop.length < 5 ){
errors.push({ msg: 'Codigo Postal debe ser por lo menos 5 digitos'})

}

//Telefono
if(telefono.length < 8 ){
    errors.push({ msg: 'Telefono debe ser por lo menos 8 digitos'})

}

//RFC 
if(rfc.length < 12 ){
    errors.push({ msg: 'RFC debe ser por lo menos 12 digitos'})
    
}
if(rfc.length > 14 ){
    errors.push({ msg: 'RFC debe ser maximo 13 digitos'})
}

documentos.forEach(function(documento){
    documento.contentType
    if(documento.contentType !== 'application/pdf' && documento.contentType !== 'image/jpeg' && documento.contentType !== 'image/png' && documento.contentType !== 'text/plain'){
        errors.push({ msg: 'Por favor elija documentos que sean pdf o images jpeg y png'})
    }
    
})


    if(errors.length > 0) {
        res.render('cliente', {
            errors,
            nombre,
            apellido1,
            apellido2,
            calle,
            numero,
            colonia,
            codigop,
            telefono,
            rfc,
            documentos: req.files.name

        })
    } else {
        //Validation passed
        Cliente.findOne({ rfc: rfc }).then(cliente => {
            if (cliente){
                //Cliente Existente
                errors.push({ msg: 'RFC existente'})
                res.render('cliente', {
                    errors,
                    nombre,
                    apellido1,
                    apellido2,
                    calle,
                    numero,
                    colonia,
                    codigop,
                    telefono,
                    rfc,
                    documentos,
                })
                } else {
                  
                        const newCliente = new Cliente({
                            nombre,
                            apellido1,
                            apellido2,
                            calle,
                            numero,
                            colonia,
                            codigop,
                            telefono,
                            rfc,
                            documentos,
                            })
        
                            //save user
                            newCliente.save()
                            .then(cliente => {
                                req.flash('success_msg', 'Su informacion se ha enviado, por favor espere por su autorizacion');
                                res.redirect('/users/cliente');
                            })
                    
                   
        }
    })
}
      })
    
});

router.post('/dashboard', (req, res) => {
    const estatus = req.body.estatus;
    const estatusid = req.body.estatusid;

    Evaluador.findOne({ estatusid: estatusid }).then(evaluador => {
        const newEvaluador = Evaluador({estatus, estatusid});
        if (evaluador){
           
                 //Update user
                Evaluador.findOneAndUpdate({estatusid}, {'estatus':estatus})
                .then(evaluador => {
                    req.flash('success_msg', 'El estatus se ha actualizado');
                    res.redirect('/users/dashboard');
                })
             
            } else {

     //save user
     newEvaluador.save()
     .then(evaluador => {
         req.flash('success_msg', 'El estatus se ha actualizado');
         res.redirect('/users/dashboard');
     })
                
               
    }
})  
   
  });

  router.post('/dashboard/observaciones', (req, res) => {
    const observaciones = req.body.observaciones;
    const observacionesid = req.body.observacionesid;
  
    Evaluador.findOne({ observacionesid: observacionesid }).then(observador => {
        const newEvaluador = Evaluador({observaciones, observacionesid});
        if (observador){
           
                 //Update user
                Evaluador.findOneAndUpdate({observacionesid}, {'observaciones': observaciones})
                .then(evaluador => {
                    req.flash('success_msg', 'Las observaciones se han actualizado');
                    res.redirect('/users/dashboard');
                })
             
            } else {

     //save user
     newEvaluador.save()
     .then(evaluador => {
         req.flash('success_msg', 'Las observaciones han actualizado');
         res.redirect('/users/dashboard');
     })
                
               
    }

  });
});


// @route GET /files
// @desc  Display all files in JSON
router.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: 'No files exist'
        });
      }
  
      // Files exist
      return res.json(files);
    });
  });
  
  // @route GET /files/:filename
  // @desc  Display single file object
  router.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
      // File exists
      return res.json(file);
    });
  });
  
  // @route GET /image/:filename
  // @desc Display Image
  router.get('/display/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
  
      // Check if image
      if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'application/pdf' || file.contentType === 'text/plain') {
        // Read output to browser
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: 'File Not Supported'
        });
      }
    });
  });  



//Register Handle
router.post('/register', (req, res) => {
    const { name, email, password, password2 }= req.body;
    let errors = [];

    //Check required fields
    if(!name || !email || !password || !password2){
        errors.push({ msg: 'Por favor llene todas las areas requeridas' })
    }
    //Check passwords match
    if(password !== password2){
        errors.push({ msg: 'Contraseñas no coinciden'})
    }
    //Check passwords length
    if(password.length < 6 ){
        errors.push({ msg: 'Contraseña debe ser por lo menos 6 letras o numeros'})

    }

    if(errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        })
    } else {
        //Validation passed
        User.findOne({ email: email}).then(user => {
            if (user){
                //user exists
                errors.push({ msg: 'Email is already registered'})
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    password2
                })
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                })

                //Hash Password
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash)=> {
                    if(err) throw err;

                    //Set password to hashed
                    newUser.password = hash;

                    //save user
                    newUser.save()
                    .then(user => {
                        req.flash('success_msg', 'Se ha registrado con exito y puede iniciar sesion');
                        res.redirect('/users/login');
                    }).catch(err => console.log(err));

                }))
            }
        })
    }
});
//Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

//Logout Handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'Cerró sesión con éxito');
    res.redirect('/users/login');
});


module.exports = router;