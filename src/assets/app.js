const express = require("express");
const joi = require("joi");
const lowdb = require("lowdb");
const cors = require("cors");
const FileSync = require("lowdb/adapters/FileSync");
const jwt = require("jsonwebtoken");
const stringSimilarity = require("string-similarity");
//Password dependency
const bcrypt = require("bcryptjs");
//To send verification emails
const nodemailer = require("nodemailer");

const app = express();
const timetable = require("./Lab3-timetable-data.json");      //All timetable data
const secure_info = require("./secure_info.json");


//DMCA policy strings
let dmca_policy = secure_info.dmca_policy;
let aup_policy = secure_info.aup_policy;
let takedown_policy = secure_info.takedown_policy;


//The users db/json file -----
/*
User JSON file will keep the list of their information as well as schedule_lists
user format:
{
 "email":,            //Primary key
 "password":,         //Salted hashed password
 "user_salt":,        //Salt for the password
 "username":,         //Alternate key
 "admin":,            //Admin flag
 "verified":,         //Verification flag
 "disabled":,         //Disabled flag
 "created":,          //Date created
 "schedule_list": []  //Array that stores all the schedules
}

schedule format:
{
 "name":,                 //Name of schedule
 "course_list": [],       //"catalog_nbr" and "subject"
 "public":,               //Hidden/public flag
 "description":           //Description
 "edited":                //Last time the schedule was edited
}
*/
const usersDB = lowdb(new FileSync("user_database.json"));
usersDB.defaults({
  "user_list": [
    secure_info.admin_information
  ]
}).write();

//This will be a database of all the reviews
//Each course (subject + catalog_nbr) will have an array associated with it
//Will be developed gradually, the courses will not be added right immediately
const reviewsDB = lowdb(new FileSync("review_database.json"));
reviewsDB.defaults({"course_list": []}).write();

//Database that stores the DMCA notices
const dmcaDB = lowdb(new FileSync("dmca_notices.json"));
dmcaDB.defaults({"notice_list": []}).write();


//The various regex used in this api
const regexSpecialChars = /^[^<>:/?#@\\/!$&'()*+,;=]*$/;
const regexDMCA = /^[^<>/?#@\\/!$&'*+;=]*$/;
const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/*
In our case the token will include
email, admin, iat
*/
const regexJWT = /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/;

//To parse the body of the JSON requests
app.use(express.json());
//Applying headers to responses (For local hosting, will be removed when committed publicly)
app.use(cors());



/* --------- ACCOUNT MANAGEMENT ROUTES --------- */

//Log into an existing user in the database
app.put('/api/user/login', (req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "email": joi.string().regex(regexEmail).required(),
    "password": joi.string().regex(regexSpecialChars).min(8).max(30).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Log in existing user
  let user_list = usersDB.get("user_list").value();
  let login_email = req.body.email;
  let login_password = req.body.password;
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == login_email) {
      //Check if user is verified or not
      if(!user_list[i].verified) {
        res.status(403).send({
          "message": "ERR_USER_UNVERIFIED"
        });
        return;
      }
      //Check if user is disabled or not
      if(user_list[i].disabled) {
        res.status(403).send({
          "message": "ERR_USER_DISABLED"
        });
        return;
      }
      //Log-in check user password
      if(bcrypt.compareSync(login_password, user_list[i].password)) {
        //Sign JWT
        let token = jwt.sign({"email": user_list[i].email, "admin": user_list[i].admin}, secure_info.jwt_secure_key);
        if(token != undefined) {
          res.send({
            "message": "SUCCESS",
            "token": token
          });
          return;
        }
      }
      else {
        res.status(403).send({
          "message": "ERR_INCORRECT_PASSWORD"
        });
        return;
      }
    }
  }

  //If the specified email isn't found, send error
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
});


//Sign a new user into the database
app.post('/api/user/signup', async(req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "email": joi.string().regex(regexEmail).required(),
    "password": joi.string().regex(regexSpecialChars).min(8).max(30).required(),
    "username": joi.string().regex(regexSpecialChars).min(4).max(30).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Check if EMAIL (only email) exists
  let user_list = usersDB.get("user_list").value();
  let signup_email = req.body.email;
  let signup_username = req.body.username;
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == signup_email) {
      res.status(403).send({
        "message": "ERR_EMAIL_TAKEN"
      });
      return;
    }
    if(user_list[i].username == signup_username) {
      res.status(403).send({
        "message": "ERR_USER_TAKEN"
      });
      return;
    }
  }
  //If the email doesn't exist, add it to DB
  let signup_password = req.body.password;

  //Salt password
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(signup_password, salt);

  let verification_token = jwt.sign({"email": signup_email, "verified": false}, secure_info.jwt_secure_key);
  await sendVerificationEmail(signup_email, verification_token);

  let new_user = {
    "email": signup_email,
    "password": hash,
    "user_salt": salt,
    "username": signup_username,
    "admin": false,
    "verified": false,
    "disabled": false,
    "created": Date.now(),
    "schedule_list": []       //This list will store all the schedules for the given user
  };
  usersDB.get("user_list").push(new_user).write();

  //Send success message
  res.send({
    "message": "SUCCESS"
  });
});


//Check if the sent token is valid
app.put('/api/user/check', (req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      if(user_list[i].verified && !user_list[i].disabled) {
        res.send({
          "message": "SUCCESS",
          "username": user_list[i].username,
          "email": user_list[i].email,
          "admin": user_list[i].admin,
          "created": user_list[i].created
        });
        return;
      }
      else {
        res.status(403).send({
          "message": "ERR_DENIED"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//Check if the sent token is valid and belongs to admin
app.put('/api/user/check/admin', (req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //If the user is an admin, they will be allowed unconditionally (Even if disabled)
      if(user_list[i].verified && user_list[i].admin) {
        res.send({
          "message": "SUCCESS",
          "username": user_list[i].username,
          "email": user_list[i].email,
          "admin": user_list[i].admin,
          "created": user_list[i].created
        });
        return;
      }
      else {
        res.status(403).send({
          "message": "ERR_DENIED"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//Update user password
app.put('/api/user/update/password', (req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "token": joi.string().regex(regexJWT).required(),
    "current_password": joi.string().min(8).max(30).regex(regexSpecialChars).required(),
    "new_password": joi.string().min(8).max(30).regex(regexSpecialChars).required(),
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //Check if the user exists
  let user_list = usersDB.get("user_list").value();
  let current_password = req.body.current_password;
  let new_password = req.body.new_password;
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Check if user is verified or disabled
      if(!user_list[i].verified || user_list[i].disabled) {
        res.status(403).send({
          "message": "ERR_DENIED"
        });
        return;
      }
      //If the current password is correct
      if(bcrypt.compareSync(current_password, user_list[i].password)) {
        //Generate the new password hash and add it to the database
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(new_password, salt);
        user_list[i].password = hash;
        user_list[i].salt = salt;
        usersDB.set("user_list", user_list).write();
        //Send success message
        res.send({
          "message": "SUCCESS"
        });
        return;
      }
      else {
        res.status(403).send({
          "message": "ERR_INCORRECT_PASSWORD"
        });
        return;
      }
    }
  }

  //If the specified email isn't found, send error
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
});


//Verify user's email
app.post("/api/user/verify", (req, res) => {
  //Input sanitization JOI -- Just need a token
  let schema = joi.object({
    "token": joi.string().regex(regexJWT).required()
  });
  let resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }
  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Since this token is of a different format than the other LOGIN token that we have used
  //Throughout our backend, we will try to verif the format of this token to ensure it isn't
  //A simple login token. This token will include an email and a verified boolean
  schema = joi.object({
    "email": joi.string().regex(regexEmail).required(),
    "verified": joi.boolean().required(),
    "iat": joi.number()
    //Tokens have an issued at number. We don't need it but it will be provided so we need to add it here to allow the token through
  });
  resultValidation = schema.validate(decoded);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_TOKEN"
    });
    return;
  }

  //Find user
  let user_list = usersDB.get("user_list").value();
  let verify_email = decoded.email;
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == verify_email) {
      //If already verified
      if(user_list[i].verified) {
        res.status(403).send({
          "message": "ERR_ALREADY_VERIFIED"
        });
        return;
      }
      else {
        //Verify user
        user_list[i].verified = true;
        usersDB.set("user_list", user_list).write();
        res.send({
          "message": "SUCCESS"
        });
        return;
      }
    }
  }
  //If user doesn't exist
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
  return;
});


//Resend a verification token
app.put("/api/user/verify/resend", async(req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "email": joi.string().regex(regexEmail).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Find user
  let user_list = usersDB.get("user_list").value();
  let verify_email = req.body.email;
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == verify_email) {
      //If already verified
      if(user_list[i].verified) {
        res.status(403).send({
          "message": "ERR_ALREADY_VERIFIED"
        });
        return;
      }
      else {
        //Send verification
        let verification_token = jwt.sign({"email": verify_email, "verified": false}, secure_info.jwt_secure_key);
        await sendVerificationEmail(verify_email, verification_token);

        res.send({
          "message": "SUCCESS"
        });
        return;
      }
    }
  }
  //If user doesn't exist
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
});



/* --------- COMMON ROUTES --------- */

//Get all the DMCA policies
app.get('/api/common/dmca_policy', (req, res) => {res.send(dmca_policy)});
app.get('/api/common/aup_policy', (req, res) => {res.send(aup_policy)});
app.get('/api/common/takedown_policy', (req, res) => {res.send(takedown_policy)});


//Allow anyone to add a DMCA notice
app.put('/api/common/dmca/notices', (req, res) => {
  const schema = joi.object({
    "notice": joi.string().regex(regexDMCA).min(10).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  //Add the notice to the database
  let notice_list = dmcaDB.get("notice_list").value();
  notice_list.push({
    "notice": req.body.notice,
    "iat": Date.now()   //This will differentiate between the notices
  })
  dmcaDB.set("notice_list", notice_list).write();
  res.send({
    "message": "SUCCESS"
  });
});


//For a given subject, return all the catalog_nbr's, just the numbers
app.get('/api/common/timetable/:subject', (req, res) => {
  const schema = joi.object({
    "subject": joi.string().regex(regexSpecialChars).min(2).max(8).required()
  });
  const resultValidation = schema.validate(req.params);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  let catalog_nbrs = [];
  let subjectID = req.params.subject;
  for(i = 0; i < timetable.length; i++) {
    if(subjectID == timetable[i].subject) {
      catalog_nbrs.push(timetable[i].catalog_nbr);
    }
  }
  //Send all results even if none exist :D
  res.send({
    "message": "SUCCESS",
    "content": catalog_nbrs
  });
  return;
});


//For a given subject and catalog_nbr (EXACT MATCH), return the singular timetable entry
app.get('/api/common/timetable/:subject/:catalog_nbr', (req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "subject": joi.string().regex(regexSpecialChars).min(2).max(8).required(),
    "catalog_nbr": joi.string().regex(regexSpecialChars).min(4).max(5).required()
  });
  const resultValidation = schema.validate(req.params);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  let subjects = [];
  let subjectID = req.params.subject;
  let courseID = req.params.catalog_nbr;
  for(i = 0; i < timetable.length; i++) {
    if(subjectID == timetable[i].subject && courseID == timetable[i].catalog_nbr) {
      subjects.push(timetable[i]);
    }
  }
  //If found, send. Otherwise, send error
  if(subjects.length > 0) {
    res.send({
      "message": "SUCCESS",
      "content": subjects       //Should only have one entry inside
    });
    return;
  }
  else {
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
    return;
  }
});



//Get the list of subject codes (ACTURSCI, SE, ECE etc)
app.get('/api/common/subjects', (req, res) => {
  //No input, no need for input sanitization
  let subjects = [];
  for(i = 0; i < timetable.length; i++) {
    let toAdd = true;
    for(j = 0; j < subjects.length; j++) {
      if(timetable[i].subject == subjects[j]) toAdd = false;
    }
    if(toAdd) subjects.push(timetable[i].subject);
  }
  res.send({
    "message": "SUCCESS",
    "content": subjects
  });
});

//SEARCH QUERY - USE QUERIES WITH OPTIONAL INPUTS. Not using parameters. Returns limited timetable data, and nothing else.
//Two input formats accepted (either a subject, catalog_nbr, component combo OR a keyword)
app.get('/api/common/timetable', (req, res) => {
  //Input sanitization JOI -- ENSURE subject/catalog_nbr/component combo
  const schemaQuery = joi.object({
    "subject": joi.string().regex(regexSpecialChars).min(1).max(10),
    "catalog_nbr": joi.string().regex(regexSpecialChars).min(1).max(10),
    "component": joi.string().regex(regexSpecialChars).min(3).max(3)
  });
  //Input sanitization JOI -- ENSURE keyword
  const schemaKeyword = joi.object({
    "keywords": joi.string().regex(regexSpecialChars).min(4).max(50).required()
  });
  const resultValidationQuery = schemaQuery.validate(req.query);
  const resultValidationKeyword = schemaKeyword.validate(req.query);

  //Result for when searched by query
  if(!resultValidationQuery.error) {
    let subjects = [];
    //Use queries to get results, remove all white spaces and make all of it upper case (database values are uppercase)
    let subjectID = req.query.subject;
    if(subjectID != undefined) subjectID = subjectID.replace(/\s/g,'').toUpperCase();
    let courseID = req.query.catalog_nbr;
    if(courseID != undefined) courseID = courseID.replace(/\s/g,'').toUpperCase();
    let componentID = req.query.component;
    if(componentID != undefined) componentID = componentID.replace(/\s/g,'').toUpperCase();
    for(i = 0; i < timetable.length; i++) {
      //Match if either subject or course ID is provided
      //If a letter does not exist at the end of the query course ID, then remove the number from the database course ID check too
      let courseIDCheck = timetable[i].catalog_nbr.toString();
      if(!isNaN(courseID)) {
        courseIDCheck = courseIDCheck.replace(/\D/g,'');
      }
      if( (subjectID == undefined || subjectID == timetable[i].subject) && (courseID == undefined ||  courseID == courseIDCheck) ) {
        //For each component of the course, send a separate entry into the array. (If a course has LEC and LAB component in course_info, send both separately)
        for(j = 0; j < timetable[i].course_info.length; j++) {
          //If component is not defined, then send all components in, else send in the specific component
          if(componentID == undefined || componentID == timetable[i].course_info[j].ssr_component) {
            subjects.push({
              "subject": timetable[i].subject,
              "catalog_nbr": timetable[i].catalog_nbr,
              "className": timetable[i].className,
              "class_section": timetable[i].course_info[j].class_section,
              "ssr_component": timetable[i].course_info[j].ssr_component,
              "start_time": timetable[i].course_info[j].start_time,
              "end_time": timetable[i].course_info[j].end_time,
              "days": timetable[i].course_info[j].days
            });
          }
        }
      }
    }
    //If found, send. Otherwise, send error
    if(subjects.length > 0) {
      res.send({
        "message": "SUCCESS",
        "content": subjects
      });
      return;
    }
    else {
      res.status(404).send({
        "message": "ERR_RESULT_NOT_FOUND"
      });
      return;
    }
  }

  //Result for when searched by keyword
  else if (!resultValidationKeyword.error) {
    let subjects = [];
    let keywords = req.query.keywords.toUpperCase();    //All catalog_nbr and className data is in UPPERCASE
    const minimumSimilarity = 0.6;    //Minimum similarity needed (This value is a reasonable amount for the criteria provided)

    for(i = 0; i < timetable.length; i++) {
      let courseSim = stringSimilarity.compareTwoStrings(keywords, timetable[i].catalog_nbr.toString());
      let nameSim = stringSimilarity.compareTwoStrings(keywords, timetable[i].className);
      //If either name similarity or course similarity passes
      if(courseSim >= minimumSimilarity || nameSim >= minimumSimilarity) {
        //For each component of the course, send a separate entry into the array. (If a course has LEC and LAB component in course_info, send both separately)
        for(j = 0; j < timetable[i].course_info.length; j++) {
          subjects.push({
            "subject": timetable[i].subject,
            "catalog_nbr": timetable[i].catalog_nbr,
            "className": timetable[i].className,
            "class_section": timetable[i].course_info[j].class_section,
            "ssr_component": timetable[i].course_info[j].ssr_component,
            "start_time": timetable[i].course_info[j].start_time,
            "end_time": timetable[i].course_info[j].end_time,
            "days": timetable[i].course_info[j].days
          });
        }
      }
    }
    //If found, send. Otherwise, send error
    if(subjects.length > 0) {
      res.send({
        "message": "SUCCESS",
        "content": subjects
      });
      return;
    }
    else {
      res.status(404).send({
        "message": "ERR_RESULT_NOT_FOUND"
      });
      return;
    }
  }

  //If neither schema fits, then sent error for bad request
  else {
    res.status(400).send({
      "message": "ERR_BAD_QUERY"
    });
    return;
  }
});


//Get recent 10 public schedules
app.get('/api/common/schedules/public', (req, res) => {
  //Slow algorithm but it works. Go through all schedule lists and add the most recent one until 10 are added
  let count = 0;
  let num_schedules = getNumberOfSchedules();
  let user_list = usersDB.get("user_list").value();
  let return_list = [];
  //Until all schedules are added or the recent 10
  while(count < num_schedules && count < 10) {
    let max_time = 0;
    let toadd_schedule = {"edited": 0};
    //Get the most recent schedule
    for(i = 0; i < user_list.length; i++) {
      for(j = 0; j < user_list[i].schedule_list.length; j++) {
        if(user_list[i].schedule_list[j].edited >= max_time) {
          //Only for public lists
          if(user_list[i].schedule_list[j].public) {
            //Skip if already added
            let skip = false;
            for(k = 0; k < return_list.length; k++) {
              if(return_list[k].edited == user_list[i].schedule_list[j].edited) {
                skip = true;
                break;
              }
            }
            if(!skip) {
              max_time = user_list[i].schedule_list[j].edited;
              toadd_schedule = {
                "name": user_list[i].schedule_list[j].name,
                "edited": user_list[i].schedule_list[j].edited,
                "description": user_list[i].schedule_list[j].description,
                "course_list": user_list[i].schedule_list[j].course_list,
                "author": user_list[i].username
              };
            }
          }
        }
      }
    }

    //When the next recent schedule is found, add it to the list
    return_list.push(toadd_schedule);
    count++;
  }

  //Send even if list empty
  res.send({
    "message": "SUCCESS",
    "content": return_list
  });

});


//Get the timetable entries for all courses given by a subject/course pair list
app.put('/api/common/timetable/multiple', (req, res) => {
  //Input sanitization, confirm proper array
  const schema = joi.object({
    "course_list": joi.array().required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }
  //Check if sent course list is valid
  if(!isValidCourseList(req.body.course_list)) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  let send_list = [];
  //For all of the pairs, pass the timetable entry
  let course_list = req.body.course_list;
  for(i = 0; i < course_list.length; i++) {
    for(j = 0; j < timetable.length; j++) {
      if(course_list[i].subject == timetable[j].subject && course_list[i].catalog_nbr == timetable[j].catalog_nbr) {
        //Send in all components for the given course
        for(k = 0; k < timetable[j].course_info.length; k++) {
          send_list.push({
            "subject": timetable[j].subject,
            "catalog_nbr": timetable[j].catalog_nbr,
            "className": timetable[j].className,
            "class_section": timetable[j].course_info[k].class_section,
            "ssr_component": timetable[j].course_info[k].ssr_component,
            "start_time": timetable[j].course_info[k].start_time,
            "end_time": timetable[j].course_info[k].end_time,
            "days": timetable[j].course_info[k].days,
            "description": timetable[j].catalog_description
          });
        }
      }
    }
  }
  //Send the list (Even if empty)
  res.send({
    "message": "SUCCESS",
    "content": send_list
  });
});


//Get a review for a course (with only username, no email)
app.get('/api/common/reviews/:subject/:catalog_nbr', (req, res) => {
  const schema = joi.object({
    "subject": joi.string().regex(regexSpecialChars).min(2).max(8).required(),
    "catalog_nbr": joi.string().regex(regexSpecialChars).min(4).max(5).required()
  });
  const resultValidation = schema.validate(req.params);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  const subjectName = req.params.subject.toUpperCase();
  const catalog_nbr = req.params.catalog_nbr.toUpperCase();

  let review_database = reviewsDB.get("course_list").value();
  let return_list = [];
  //See if the course list passed actually exists
  for(i = 0; i < review_database.length; i++) {
    if(review_database[i].subject == subjectName && review_database[i].catalog_nbr == catalog_nbr) {
      for(j = 0; j < review_database[i].review_list.length; j++) {
        //If the review isn't hidden
        if(!review_database[i].review_list[j].hidden) {
          return_list.push({
            "username": review_database[i].review_list[j].username,
            "created": review_database[i].review_list[j].created,
            "review": review_database[i].review_list[j].review,
          });
        }
      }
    }
  }
  //If no review for the course found, send message. Otherwise, send the list
  if(return_list.length == 0) {
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
  }
  else {
    res.send({
      "message": "SUCCESS",
      "content": return_list
    });
  }
});


/* --------- SECURE ROUTES --------- */

//To create a new schedule
app.post("/api/secure/schedules", (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(2).max(20).required(),
    "description": joi.string().regex(regexSpecialChars).max(50),
    "course_list": joi.array().required(),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }
  //Check if sent course list is valid
  if(!isValidCourseList(req.body.course_list)) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Only if the user is verified and not disabled (should likely not happen anyway)
      if(user_list[i].verified && !user_list[i].disabled) {
        for(j = 0; j < user_list[i].schedule_list.length; j++){
          if(user_list[i].schedule_list[j].name == req.body.name) {
            res.status(403).send({
              "message": "ERR_SCHEDULE_EXISTS"
            });
            return;
          }
        }
        //Ensure the user has less than 20 schedules
        if(user_list[i].schedule_list.length >= 20) {
          res.status(403).send({
            "message": "ERR_MAX_REACHED"
          });
          return;
        }
        //If the given schedule name doesn't exist, add it to the list for this user
        let new_sched = {};
        if(req.body.description != undefined) {
          new_sched = {
            "name": req.body.name,
            "description": req.body.description,
            "public": false,
            "course_list": req.body.course_list,
            "edited": Date.now()
          };
        }
        else {
          new_sched = {
            "name": req.body.name,
            "description": "",
            "public": false,
            "course_list": req.body.course_list,
            "edited": Date.now()
          };
        }
        user_list[i].schedule_list.push(new_sched);
        usersDB.set("user_list", user_list).write();
        res.send({
          "message": "SUCCESS"
        });
        return;
      }
      else {
        res.status(403).send({
          "message": "ERR_DENIED"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//To edit an existing schedule
app.put("/api/secure/schedules", (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(2).max(20).required(),
    "new_name": joi.string().regex(regexSpecialChars).min(2).max(20).required(),
    "description": joi.string().regex(regexSpecialChars).max(50),
    "course_list": joi.array().required(),
    "public": joi.boolean().required(),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }
  //Check if sent course list is valid
  if(!isValidCourseList(req.body.course_list)) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Only if the user is verified and not disabled (should likely not cause a problem anyway)
      if(user_list[i].verified && !user_list[i].disabled) {
        //Only if the course_list exists
        for(j = 0; j < user_list[i].schedule_list.length; j++){
          if(user_list[i].schedule_list[j].name == req.body.name) {
            let new_sched = {};
            if(req.body.description != undefined) {
              new_sched = {
                "name": req.body.new_name,
                "description": req.body.description,
                "public": req.body.public,
                "course_list": req.body.course_list,
                "edited": Date.now()
              };
            }
            else {
              new_sched = {
                "name": req.body.new_name,
                "description": "",
                "public": req.body.public,
                "course_list": req.body.course_list,
                "edited": Date.now()
              };
            }
            user_list[i].schedule_list[j] = new_sched;
            usersDB.set("user_list", user_list).write();
            res.send({
              "message": "SUCCESS"
            });
            return;
          }
        }

        //If the list does not exist, send a not found error
        res.status(404).send({
          "message": "ERR_RESULT_NOT_FOUND"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//To get the schedules for the given user
app.get('/api/secure/schedules', (req, res) => {
  //Input sanitization -- Make sure token is sent via header
  const schema = joi.string().regex(regexJWT);
  const resultValidation = schema.validate(req.headers['authorization']);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_HEADER"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.headers['authorization'];
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  let sched_names = [];   //Array to be returned
  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Only if the user is verified and not disabled (should likely not cause a problem anyway)
      if(user_list[i].verified && !user_list[i].disabled) {
        //Get all schedule names for a given user
        for(j = 0; j < user_list[i].schedule_list.length; j++) sched_names.push(user_list[i].schedule_list[j].name);
        res.send({
          "message": "SUCCESS",
          "content": sched_names
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//To get the data for a specific schedule for a user
app.get('/api/secure/schedules/:name', (req, res) => {
  //Input sanitization -- Make sure token is sent via header
  let schema = joi.string().regex(regexJWT);
  let resultValidation = schema.validate(req.headers['authorization']);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_HEADER"
    });
    return;
  }
  schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(2).max(20).required()
  });
  resultValidation = schema.validate(req.params);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.headers['authorization'];
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  let schedule_name = req.params.name;
  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Only if the user is verified and not disabled (should likely not cause a problem anyway)
      if(user_list[i].verified && !user_list[i].disabled) {
        //Find the requested schedule
        for(j = 0; j < user_list[i].schedule_list.length; j++) {
          if(user_list[i].schedule_list[j].name == schedule_name) {
            res.send({
              "message": "SUCCESS",
              "content": user_list[i].schedule_list[j]
            });
            return;
          }
        }
        //If not found, return 404
        res.status(404).send({
          "message": "ERR_RESULT_NOT_FOUND"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//To delete a selected schedule from a user's schedule list
app.delete('/api/secure/schedules/:name', (req, res) => {
  //Input sanitization -- Make sure token is sent via header
  let schema = joi.string().regex(regexJWT);
  let resultValidation = schema.validate(req.headers['authorization']);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_HEADER"
    });
    return;
  }
  schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(2).max(20).required()
  });
  resultValidation = schema.validate(req.params);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.headers['authorization'];
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  let schedule_name = req.params.name;
  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Only if the user is verified and not disabled (should likely not cause a problem anyway)
      if(user_list[i].verified && !user_list[i].disabled) {
        //Find the requested schedule
        for(j = 0; j < user_list[i].schedule_list.length; j++) {
          if(user_list[i].schedule_list[j].name == schedule_name) {
            user_list[i].schedule_list.splice(j, 1);
            usersDB.set("user_list", user_list).write();    //Modify the list
            res.send({
              "message": "SUCCESS"
            });
            return;
          }
        }
        //If not found, return 404
        res.status(404).send({
          "message": "ERR_RESULT_NOT_FOUND"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});


//Add a review to a course (A new review will replace the old one)
app.put('/api/secure/reviews/:subject/:catalog_nbr', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  let schema = joi.object({
    "token": joi.string().regex(regexJWT).required(),
    "review": joi.string().regex(regexSpecialChars).min(1).max(150).required()
  });
  let resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }
  schema = joi.object({
    "subject": joi.string().regex(regexSpecialChars).min(2).max(8).required(),
    "catalog_nbr": joi.string().regex(regexSpecialChars).min(4).max(5).required()
  });
  resultValidation = schema.validate(req.params);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_PARAMS"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  const subjectName = req.params.subject.toUpperCase();
  const catalog_nbr = req.params.catalog_nbr.toUpperCase();

  //See if the subject course code exists
  let exists = false;
  for(i = 0; i < timetable.length; i++) {
    if(timetable[i].subject == subjectName && timetable[i].catalog_nbr == catalog_nbr) {
      exists = true;
      break;
    }
  }
  if(!exists) {
    //If not found, return 404
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
    return;
  }

  //Check if user exists
  let user_list = usersDB.get("user_list").value();
  let review_database = reviewsDB.get("course_list").value();
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == decoded.email) {
      //Only if the user is verified and not disabled (should likely not cause a problem anyway)
      if(user_list[i].verified && !user_list[i].disabled) {
        //Check if the course is already in the database, add the review if found
        for(j = 0; j < review_database.length; j++) {
          if(review_database[j].subject == subjectName && review_database[j].catalog_nbr == catalog_nbr) {
            //Find the user's review in the list of reviews
            for(k = 0; k < review_database[j].review_list.length; k++) {
              if(review_database[j].review_list[k].email == user_list[i].email) {
                review_database[j].review_list[k].created = Date.now();
                review_database[j].review_list[k].review = req.body.review;
                reviewsDB.set("course_list", review_database).write();
                //Send return message
                res.send({
                  "message": "SUCCESS"
                });
                return;
              }
            }
            review_database[j].review_list.push({
              "username": user_list[i].username,
              "email": user_list[i].email,
              "created": Date.now(),
              "review": req.body.review,
              "hidden": false
            });
            reviewsDB.set("course_list", review_database).write();
            //Send return message
            res.send({
              "message": "SUCCESS"
            });
            return;
          }
        }
        //Otherwise, add the course as a new array entry
        review_database.push({
          "subject": subjectName,
          "catalog_nbr": catalog_nbr,
          "review_list": [
            {
              "username": user_list[i].username,
              "email": user_list[i].email,
              "created": Date.now(),
              "review": req.body.review,
              "hidden": false
            }
          ]
        });
        reviewsDB.set("course_list", review_database).write();
        //Send return message
        res.send({
          "message": "SUCCESS"
        });
        return;
      }
    }
  }
  //If user not found, send denial
  res.status(403).send({
    "message": "ERR_DENIED"
  });
});



/* --------- ADMIN ROUTES --------- */

//Get all the users, and their activation flags
app.get('/api/admin/users', (req, res) => {
  //Input sanitization -- Make sure token is sent via header
  const schema = joi.string().regex(regexJWT);
  const resultValidation = schema.validate(req.headers['authorization']);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_HEADER"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.headers['authorization'];
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin (Since the attribute is in the JWT, we can trust it. The JWT is secure)
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  let user_list = usersDB.get("user_list").value();
  let return_list = [];
  for(i = 0; i < user_list.length; i++) {
    return_list.push({
      "email": user_list[i].email,
      "username": user_list[i].username,
      "admin": user_list[i].admin,
      "disabled": user_list[i].disabled,
      "created": user_list[i].created
    });
  }

  res.send({
    "message": "SUCCESS",
    "content": return_list
  });
});


//Get all reviews and their details
//Get all the users, and their activation flags
app.get('/api/admin/reviews', (req, res) => {
  //Input sanitization -- Make sure token is sent via header
  const schema = joi.string().regex(regexJWT);
  const resultValidation = schema.validate(req.headers['authorization']);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_HEADER"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.headers['authorization'];
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin (Since the attribute is in the JWT, we can trust it. The JWT is secure)
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  let course_list = reviewsDB.get("course_list").value();
  let return_list = [];
  for(i = 0; i < course_list.length; i++) {
    for(j = 0; j < course_list[i].review_list.length; j++) {
      return_list.push({
        "subject": course_list[i].subject,
        "catalog_nbr": course_list[i].catalog_nbr,
        "author": course_list[i].review_list[j].username,
        "created": course_list[i].review_list[j].created,
        "review": course_list[i].review_list[j].review,
        "hidden": course_list[i].review_list[j].hidden
      });
    }
  }

  res.send({
    "message": "SUCCESS",
    "content": return_list
  });
});


//Set toggle a review's hidden status
app.post('/api/admin/reviews/hidden/:subject/:catalog_nbr', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "author": joi.string().regex(regexSpecialChars).required(),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin (Since the attribute is in the JWT, we can trust it. The JWT is secure)
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  const subjectName = req.params.subject.toUpperCase();
  const catalog_nbr = req.params.catalog_nbr.toUpperCase();

  //See if the subject course code exists
  let exists = false;
  for(i = 0; i < timetable.length; i++) {
    if(timetable[i].subject == subjectName && timetable[i].catalog_nbr == catalog_nbr) {
      exists = true;
      break;
    }
  }
  if(!exists) {
    //If not found, return 404
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
    return;
  }

  //If the review exists, toggle it's hidden status
  let review_database = reviewsDB.get("course_list").value();
  //Find review
  for(j = 0; j < review_database.length; j++) {
    if(review_database[j].subject == subjectName && review_database[j].catalog_nbr == catalog_nbr) {
      //Find the user's review in the list of reviews
      for(k = 0; k < review_database[j].review_list.length; k++) {
        if(review_database[j].review_list[k].username == req.body.author) {
          review_database[j].review_list[k].hidden = !review_database[j].review_list[k].hidden;
          reviewsDB.set("course_list", review_database).write();
          //Send return message
          res.send({
            "message": "SUCCESS"
          });
          return;
        }
      }
    }
  }
  //If not found, return 404
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
  return;
});


//Deactivate a user
app.post('/api/admin/users/disable', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "email": joi.string().regex(regexEmail).required(),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //If the review exists, toggle it's hidden status
  let user_list = usersDB.get("user_list").value();
  let user_email = req.body.email;
  //Find User
  for(j = 0; j < user_list.length; j++) {
    if(user_list[j].email == user_email) {
      if(!user_list[j].admin) {
        user_list[j].disabled = true;
        usersDB.set("user_list", user_list).write();
        //Send return message
        res.send({
          "message": "SUCCESS"
        });
        return;
      } else {
        res.status(403).send({
          "message": "ERR_DENIED"
        });
        return;
      }
    }
  }
  //If not found, return 404
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
  return;
});


//Promote a user to admin (irreversible)
app.post('/api/admin/users/promote', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "email": joi.string().regex(regexEmail).required(),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //If the review exists, toggle it's hidden status
  let user_list = usersDB.get("user_list").value();
  let user_email = req.body.email;
  //Find User
  for(j = 0; j < user_list.length; j++) {
    if(user_list[j].email == user_email) {
      //Cannot promote an already admin user
      if(!user_list[j].admin) {
        //Toggle disable
        user_list[j].admin = true;
        user_list[j].disabled = false;    //Cannot be disabled if admin
        usersDB.set("user_list", user_list).write();
        //Send return message
        res.send({
          "message": "SUCCESS"
        });
        return;
      }
      else {
        res.status(403).send({
          "message": "ERR_ALREADY_ADMIN"
        });
        return;
      }
    }
  }
  //If not found, return 404
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
  return;
});


//Activate a user
app.post('/api/admin/users/enable', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "email": joi.string().regex(regexEmail).required(),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //If the review exists, toggle it's hidden status
  let user_list = usersDB.get("user_list").value();
  let user_email = req.body.email;
  //Find User
  for(j = 0; j < user_list.length; j++) {
    if(user_list[j].email == user_email) {
      user_list[j].disabled = false;
      usersDB.set("user_list", user_list).write();
      //Send return message
      res.send({
        "message": "SUCCESS"
      });
      return;
    }
  }
  //If not found, return 404
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
  return;
});


//Edit the DMCA policies ----------------
app.put('/api/admin/dmca', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "dmca_policy": joi.string().min(1).regex(regexDMCA),
    "aup_policy": joi.string().min(1).regex(regexDMCA),
    "takedown_policy": joi.string().min(1).regex(regexDMCA),
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //If any of the DMCA policies are provided, set the current ones to them
  if(req.body.dmca_policy != null) {
    dmca_policy = req.body.dmca_policy;
  }
  if(req.body.aup_policy != null) {
    aup_policy = req.body.aup_policy;
  }
  if(req.body.takedown_policy != null) {
    takedown_policy = req.body.takedown_policy;
  }

  //Send a success message unconditionally
  res.send({
    "message": "SUCCESS"
  });
});


//Get all DMCA notices
app.get('/api/admin/dmca/notices', (req, res) => {
  //Input sanitization -- Make sure token is sent via header
  const schema = joi.string().regex(regexJWT);
  const resultValidation = schema.validate(req.headers['authorization']);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_HEADER"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.headers['authorization'];
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  //Send all notices to admin
  let notice_list = dmcaDB.get("notice_list").value();
  res.send({
    "message": "SUCCESS",
    "content": notice_list
  });
});


//Delete a DMCA notice
app.delete('/api/admin/dmca/notices', (req, res) => {
  //Input sanitization -- Make sure all required parameters are present
  const schema = joi.object({
    "iat": joi.number(),      //Differentiator
    "token": joi.string().regex(regexJWT).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Verify token
  let decoded = undefined;   //This will be the token data
  let token = req.body.token;
  try {
    decoded = jwt.verify(token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }
  //Check if the user is an admin
  if(!decoded.admin) {
    res.status(403).send({
      "message": "ERR_DENIED"
    });
    return;
  }

  let notice_list = dmcaDB.get("notice_list").value();
  for(i = 0; i < notice_list.length; i++) {
    if(notice_list[i].iat == req.body.iat) {
      //Remove notice
      notice_list.splice(i, 1);
      dmcaDB.set("notice_list", notice_list).write();
      res.send({
        "message": "SUCCESS"
      });
      return;
    }
  }
  //If not found
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
});


//HELPER FUNCTIONS --------------------------------------------
//Check if a course_list array is a valid array
function isValidCourseList(course_list) {
  if(course_list === undefined || course_list.constructor !== Array) return false; //If course_list is not an array
  let tempcontainer = [];
  for(i = 0; i < course_list.length; i++) {
    if(!course_list[i].subject || !course_list[i].catalog_nbr) return false;  //If any course_list element is missing subject or catalog_nbr
    let validElement = false;
    //Check if the sent course is a duplicate, if ANY duplicates are seen, return false.
    for(k = 0; k < tempcontainer.length; k++){
      if(course_list[i].subject == tempcontainer[k].subject && course_list[i].catalog_nbr == tempcontainer[k].catalog_nbr) return false;
    }
    //Check if sent courses are actually in the timetable data or not
    for(j = 0; j < timetable.length; j++) {
      if(course_list[i].subject == timetable[j].subject && course_list[i].catalog_nbr == timetable[j].catalog_nbr) {
        validElement = true;
        break;
      }
    }
    if(!validElement) return false;   //If any course_list element isn't a valid combo of subject and catalog_nbr (if the combo doesn't exist in the timetable)
    tempcontainer.push(course_list[i]);
  }
  return true;
}


//Send email for verifying the email address
async function sendVerificationEmail(signup_email, verification_token) {

  let htmlString = '<h2>Western Timetable Verification</h2><p>Please press the following link to verify your email:</p><a href="' + secure_info.frontend_url + '/user/verify?token=' + verification_token + '">VERIFY</a>'

  /* Code taken from nodemailer website https://nodemailer.com/about/ */

  let transporter = nodemailer.createTransport({
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": secure_info.email,
      "pass": secure_info.main_email_password,
    },
    "tls":{
      "rejectUnauthorized": false,
    }
  });//secure_info.transporter);
  let info = await transporter.sendMail({
    from: '"Western Timetable" <' + secure_info.email + '>',
    to: signup_email,
    subject: "Western Timetable Verification ✔",
    html: htmlString,
  });
}


//Get the number of total courses in the database
function getNumberOfSchedules() {
  let num = 0;
  let user_list = usersDB.get("user_list").value();
  for(i = 0; i < user_list.length; i++) {
    for(j = 0; j < user_list[i].schedule_list.length; j++) {
      if(user_list[i].schedule_list[j].public) num++;
    }
  }
  return num;
}



//INIT -------------------------------------------
const PORT = 3000;
app.listen(PORT);
console.log("Listening on port " + PORT)
