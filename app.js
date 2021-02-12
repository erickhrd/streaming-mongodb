const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser')

const app = express();

//Cliente model
const Cliente = require('./models/Cliente');

//Passport config
require('./config/passport')(passport);

//DB Config
const db = require ('./config/keys').MongoURI;

//Connect to Mongo
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(() => console.log('MongoDB Connected...')).catch((err => console.log(err)));
var connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));


//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Bodyparser
app.use(bodyParser.json());
app.use(express.urlencoded({extended : false}));

// Express session
app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
  );

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());


//Global Vars
app.use((req, res, next) => {
    res.locals.success_msg =req.flash('success_msg');
    res.locals.error_msg =req.flash('error_msg');
    res.locals.error =req.flash('error');
    
    next();
});

//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.get('/users/promotor',(req, res) => Cliente.find({}, function(err, clientes) {
  connection.db.collection("evaluadors", function(err, collection){
      collection.find({}).toArray(function(err, data){
          res.render('promotor', {
                      clientes: clientes,
                      evaluadors: data
                      
                    
                  });
      })
  });
}));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));

//File
app.use(express.static(__dirname + '/public'));
