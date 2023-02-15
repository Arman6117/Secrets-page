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
// OAuth 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require("passport-github2").Strategy
const findOrCreate = require("mongoose-findorcreate")


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
  googleId: String,
  githubId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose); // step 7
// OAuth
userSchema.plugin(findOrCreate)
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = new mongoose.model("User", userSchema);

const LocalStrategy = require("passport-local").Strategy; // step 8

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate())); // step 9

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user.id);                            // Step 10
  });
  
  passport.deserializeUser(function(id, done) {      // Step 11
    User.findById(id, function(err, user) {
      done(err, user);                            
    });
  });
// OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/", function (req, res) {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

  app.get("/auth/github",
  passport.authenticate("github", { scope: [ "user:email" ] }));

app.get("/auth/github/secrets", 
  passport.authenticate("github", { failureRedirect:" /login "}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/secrets", function(req,res){
   User.find({"secret" : {$ne:null}}, function(err,results){
     if (err) {
        console.log(err);
     }
     else {
        if (results) {
            res.render("secrets", {usersWithSecrets: results})
        }
     }
   })
})

app.get("/submit", function(req,res){
    if (req.isAuthenticated){
        res.render("submit")
    }
    else {
        res.redirect("/login")
    }
})

app.post("/submit",function(req,res){
    const userSecret = req.body.secret
    const userID = 
    
    User.findById(req.user.id, function(err,results){
        if (err) {
            console.log(err);
        } else {
            if (results){
                results.secret = userSecret
                results.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
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


