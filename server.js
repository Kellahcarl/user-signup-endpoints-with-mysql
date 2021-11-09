require("dotenv").config();
const express = require("express");
const app = express();

const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const mysql = require('mysql');
const connection= require("./config/database");

const users = [];
app.use(express.json());
app.use(express.urlencoded());

connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  
    console.log('Connected to the MySQL server.');
  });

app.post("/register", async (req, res) => {
    const { email, username, password, confirmPassword } = req.body;
    try {
      if (!email || !username || !password || !confirmPassword)
        res.status(401).send("fill in all credentials");
  
      if (password !== confirmPassword)
        res.status(401).send("Confirm password do not match");
  
      checkPasswordStrength(password);
      // const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { email, username: username, password: hashedPassword };
      let sql = `INSERT INTO userProfile(username, email, passwrd) values("${user.username}", "${user.email}", "${user.password}")`;
      connection.query(sql);
      // users.push(user);
      // console.log(users);
      res.status(201).send("User was added");
    } catch {
      res.status(500).send();
    }
    function checkPasswordStrength(password) {
      const checkForLength = new RegExp("^(?=.{8,})");
      const checkForSymbols = new RegExp("^(?=.*[!@#$%^&*])");
      const checkForCapsLettersNumbers = new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"
      );
      if (!checkForLength.test(password))
        res.status(401).send("Password must be atleast 8 characters long ");
  
      if (!checkForSymbols.test(password))
        res.status(401).send("Password must contain atleast 1 symbol");
  
      if (!checkForCapsLettersNumbers.test(password))
        res
          .status(401)
          .send("Password must contain small, letters caps and numbers");
    }
  });

  app.post("/login",async (req, res) => {
    const { email, password } = req.body;
    // const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      if (email && password) {
        // const user = users.find((user) => user.email === email);
    let sql = `SELECT * FROM userProfile WHERE email = "${email}"`;
    connection.query(sql, (err,result)=>{
    if(err){
      console.log(err);
      return res.sendStatus(401);
      
    }
    const user = result.find(user => user.email==email);
  //  console.log(user.name);
    if (!user) res.status(401).send("User not found");
        bcrypt.compare(password, user.passwrd, (err, result) => {
          if (!result) res.status(401).send("Wrong credentials");
  
          const token = JWT.sign(
            { user: user.username, password: user.passwrd, email: user.email },
            process.env.ACCESS_TOKEN,
            { expiresIn: "1h" }
          );
          res.json({ accessToken: token });
        });
    
  });
  // console.log(user); 
     
  
      }
    } catch {
      res.sendStatus(500);
    }
  });

  app.post("/project", Authenticator,(req,res)=>{
    const {project,email} =req.body;
    console.log(req.body);
     let sql = `UPDATE userProfile SET projects = ("${project}") WHERE email = "${email}"`;
     connection.query(sql)
    
    });
    function Authenticator(req, res, next){
      const authHeader= req.headers['authorization'];
      const token = authHeader.split(' ')[1];
      if(token == null) return res.sendStatus(401);
      JWT.verify(token, process.env.ACCESS_TOKEN, (err, {email, password, user})=>{
        if(err) return res.sendStatus(403);
         req.body.email = email;
       // console.log(req.body)
        // console.log(email, password, user);
        next();
      })
    }

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log("server up and running on PORT :", port);
});
