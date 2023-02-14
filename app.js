require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5")
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session"); // step 1
const passport = require("passport"); // step 2
const passportLocalMongoose = require("passport-local-mongoose"); // step 3

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "This is the secret", // step 4
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize()); // step 5
app.use(passport.session()); // step 6

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose); // step 7
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = new mongoose.model("User", userSchema);

const LocalStrategy = require("passport-local").Strategy; // step 8

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate())); // step 9

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser()); // step 10
passport.deserializeUser(User.deserializeUser()); // step 11

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/secrets", function(req,res){
    if (req.isAuthenticated){
        res.render("secrets")
    }
    else {
        res.redirect("/login")
    }
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if (err){
            console.log(err);
        }
        else {
           
            res.redirect("/")
        }
    })
    // res.redirect("/register")
})
app.post("/register", function (req, res) {
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if (err) {
            console.log(err)
            res.redirect("/register")
        }
        else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
});


app.post("/login", function (req, res) {
    const username = req.body.username;
      const password = req.body.password;
  const user = new User ({
    username: username,
    password:password
  })
  
  req.login(user, function(err){
    if (err){
        console.log(err)
    }
    else {
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }
  })
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

// app.post("/register", function(req,res){
//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//         const newUser = new User({
//             email: req.body.username,
//             password: hash,
//           });

//           newUser.save(function (err) {
//             if (err) {
//                console.log(err);
//             } else {
//               res.render("secrets");
//           }
//          });
// })


// app.post("/login", function (req, res) {
    //   const username = req.body.username;
    //   const password = req.body.password;
    //   User.findOne({ email: username }, function (err, results) {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       if (results) {
    //         // bcrypt.compare(password, results.password, function(err, result) {
    //          if (result == true){
    //             res.render("secrets");
    //          }
    //         // });
    //         }
    //       }
    //     }
    //   )
//   });