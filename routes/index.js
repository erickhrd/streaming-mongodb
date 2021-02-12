const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

//Welcome Page
router.get('/',(req, res) => res.render('welcome'));

//Cliente model
const Cliente = require('../models/Cliente');

//DB Config
const db = require ('../config/keys').MongoURI;

//Connect to Mongo
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(() => console.log('MongoDB Connected index...')).catch((err => console.log(err)));
var connection = mongoose.connection;

//Dashboard
router.get('/users/dashboard', ensureAuthenticated, (req, res) => Cliente.find({}, function(err, clientes) {
    connection.db.collection("evaluadors", function(err, collection){
        collection.find({}).toArray(function(err, data){
            res.render('dashboard', {
                        name: req.user.name,
                        clientes: clientes,
                        evaluadors: data
                        
                      
                    });
                    
        })
    });
}));

module.exports = router;