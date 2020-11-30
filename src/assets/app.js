const express = require("express");
const joi = require("joi");
const lowdb = require("lowdb");
const cors = require("cors");
const FileSync = require("lowdb/adapters/FileSync");
const jwt = require("jsonwebtoken");
const stringSimilarity = require("string-similarity")

const app = express();
const timetable = require("./Lab3-timetable-data.json");      //All timetable data
const secure_info = require("./secure_info.json");

//The schedules db/json file -----
const schedulesDB = lowdb(new FileSync("schedule_database.json"));
schedulesDB.defaults({"schedule_list": []}).write();

//The users db/json file -----
const usersDB = lowdb(new FileSync("user_database.json"));
usersDB.defaults({"user_list": []}).write();

//The various regex used in this api
const regexSpecialChars = /^[^<>:/?#@.!$&'()*+,;=]*$/;
const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
      if(login_password == user_list[i].password) {
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
app.post('/api/user/signup', (req, res) => {
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
  let login_email = req.body.email;
  let login_username = req.body.username;
  for(i = 0; i < user_list.length; i++) {
    if(user_list[i].email == login_email) {
      res.status(403).send({
        "message": "ERR_EMAIL_TAKEN"
      });
      return;
    }
    if(user_list[i].username == login_username) {
      res.status(403).send({
        "message": "ERR_USER_TAKEN"
      });
      return;
    }
  }
  //If the email doesn't exist, add it to DB
  let login_password = req.body.password;
  let new_user = {
    "email": login_email,
    "password": login_password,
    "username": login_username,
    "admin": false,
    "verified": true,
    "disabled": false
  };
  usersDB.get("user_list").push(new_user).write();

  //Send success message
  res.send({
    "message": "SUCCESS"
  });
});


//Test  ------------------------------------------- TEMPORARY TEMPORARY TEMPORARY TEMPORARY
app.post('/api/user/test', (req, res) => {
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
  let test_token = req.body.token;
  try {
    decoded = jwt.verify(test_token, secure_info.jwt_secure_key);
  } catch(err) {
    res.status(500).send("ERR_SOMETHING_WENT_WRONG");
    return;
  }

  res.send({
    "message": "SUCCESS",
    "data": decoded
  });
});



/* --------- COMMON ROUTES --------- */

//Get the list of subject codes (ACTURSCI, SE, ECE etc)
app.get('/api/common/subjects', (req, res) => {
  //No input, no need for input sanitization
  let subjects = [];
  for(i = 0; i < timetable.length; i++) {
    let toAdd = true;
    for(j = 0; j < subjects.length; j++) {
      if(timetable[i].subject == subjects[j].subject) toAdd = false;
    }
    if(toAdd) subjects.push({
      "subject": timetable[i].subject
    });
  }
  res.send({
    "message": "SUCCESS",
    "content": subjects
  });
});


//USE QUERIES WITH OPTIONAL SUBJECT/COURSE ID/COURSE CODE. Not using parameters. Returns limited timetable data, and nothing else.
app.get('/api/common/timetable', (req, res) => {
  //Input sanitization JOI
  const schema = joi.object({
    "subject": joi.string().regex(regexSpecialChars).min(1).max(10),
    "catalog_nbr": joi.string().regex(regexSpecialChars).min(1).max(10)
  });
  const resultValidation = schema.validate(req.query);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_QUERY"
    });
    return;
  }

  let subjects = [];
  //Use queries to get results, remove all white spaces and make all of it upper case (database values are uppercase)
  let subjectID = req.query.subject;
  if(subjectID != undefined) subjectID = subjectID.replace(/\s/g,'').toUpperCase();
  let courseID = req.query.catalog_nbr;
  if(courseID != undefined) courseID = courseID.replace(/\s/g,'').toUpperCase();
  for(i = 0; i < timetable.length; i++) {
    //Match if either subject or course ID is provided
    let courseIDCheck = timetable[i].catalog_nbr.toString();
    if(!isNaN(courseID)) {
      courseIDCheck = courseIDCheck.replace(/\D/g,'');
    }
    if( (subjectID == undefined || subjectID == timetable[i].subject) && (courseID == undefined ||  courseID == courseIDCheck) ) {
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
});




//HELPER FUNCTIONS --------------------------------------------





//INIT -------------------------------------------
const PORT = 3000;
app.listen(PORT);
console.log("Listening on port " + PORT)




// ------------------------------------ OLD ROUTES ----------------------------------------

//ROUTES -----------------------------------------
//1. Get all available subject codes (property name: subject) and descriptions (property name: className)
app.get('/app/courses', (req, res) => {
  //No need to ensure that the request is sanitized, we don't use parameters or body
  let subjects = [];
  for(i = 0; i < timetable.length; i++) subjects.push({
    "subject": timetable[i].subject,
    "className": timetable[i].className
  });
  res.send({
    "message": "SUCCESS",
    "content": subjects
  });
});

//2. Get all course codes (property name: catalog_nbr) for a given subject code. Return an error if the subject code doesn’t exist.
app.get('/app/courses/:subject', (req, res) => {
  //No need to ensure that the request is sanitized, we don't use body
  const subjectName = req.params.subject.toUpperCase();
  let subjects = [];
  for(i = 0; i < timetable.length; i++) {
    if(subjectName == timetable[i].subject) subjects.push({
      "subject": timetable[i].subject,        //Added additionally
      "catalog_nbr": timetable[i].catalog_nbr,
      "className": timetable[i].className     //Added additionally
    });
  }
  if(subjects.length > 0) res.send({
    "message": "SUCCESS",
    "content": subjects
  });
  else res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
});

//3. Get the timetable entry for a given subject code, a course code and an optional course component. Return an error if the subject code or course code doesn’t exist. If the course component is not specified, return time table entries for all components.
//Decided to use timetable routing since we are returning an array of timetable data (even if it's only one element in the array), Easier to utilize in front-end.
app.get("/app/timetable/:subject/:catalog_nbr", (req, res) => {
  //Validation (Max characters 3, No special characters used in ReST) for query
  const schema = joi.object({
    "component": joi.string().regex(regexSpecialChars).min(3).max(3)
  });
  const resultValidation = schema.validate(req.query);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_QUERY"
    });
    return;
  }

  const subjectName = req.params.subject.toUpperCase();
  const catalog_nbr = req.params.catalog_nbr.toUpperCase();
  //If a component is not specified
  if(Object.keys(req.query).length === 0) {     //If there are no query keys
    for(i = 0; i < timetable.length; i++) {
      //Send the entire time table entry
      if(subjectName == timetable[i].subject && catalog_nbr == timetable[i].catalog_nbr) {
        //Send the entire entry and finish
        let subjects = [];
        subjects.push(timetable[i]);
        res.send({
          "message": "SUCCESS",
          "content": subjects
        });
        return;
      }
    }
  }
  //If a component is specified
  else {
    for(i = 0; i < timetable.length; i++) {
      if(subjectName == timetable[i].subject && catalog_nbr == timetable[i].catalog_nbr) {
        /*This looks needlessly complicated, but the goal is to add only one member in the course_info array for each
        course (corresponding to the correct component type)
        There are no entries in our given timetable json where there is more than one item in a course_info array,
        but this code makes it more adaptable in case course_info has more array elements*/
        const course_info = timetable[i].course_info;
        for(j = 0; j < course_info.length; j++) {
          let courseInf = [];
          if(timetable[i].course_info[j].ssr_component == req.query.component.toUpperCase()) {
            courseInf.push(timetable[i].course_info[j]);  //It will only be pushed once
            //Send the entire entry and finish
            let subjects = [];
            subjects.push({
              "catalog_nbr": timetable[i].catalog_nbr,
              "subject": timetable[i].subject,
              "className": timetable[i].className,
              "course_info": courseInf,
              "catalog_description": timetable[i].catalog_description
            });
            res.send({
              "message": "SUCCESS",
              "content": subjects
            });
            return;
          }
        }
      }
    }
  }
  //If both loops end and no entry was found, return an error.
  res.status(404).send({
    "message": "ERR_RESULT_NOT_FOUND"
  });
});

//4. Create a new schedule (to save a list of courses) with a given schedule name. Return an error if name exists.
app.post("/app/schedules", (req, res) => {
  //Validation (Max characters 16, No special characters used in ReST)
  const schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(1).max(16).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //Name of the schedule is case sensitive
  const schedule_name = req.body.name;
  let schedule_list = schedulesDB.get("schedule_list").value();
  let scheduleExists = false;
  //See if schedule already exists
  for(i = 0; i < schedule_list.length; i++) {
    if(schedule_list[i].name == schedule_name) {
      scheduleExists = true;
      break;
    }
  }
  //If schedule doesn't exist, add it
  if(scheduleExists) {
    res.status(400).send({
      "message": "ERR_SCHEDULE_EXISTS"
    });
  }
  else {
    const new_schedule = {
      "name": schedule_name,
      "course_list": []
    };
    schedulesDB.get("schedule_list").push(new_schedule).write();
    schedule_list = schedulesDB.get("schedule_list").value();
    res.send({
      "message": "SUCCESS",
      "content": schedule_list
    }); //Return the entire schedule list
  }
});

//5. Save a list of subject code, course code pairs under a given schedule name. Return an error if the schedule name does not exist. Replace existing subject-code + course-code pairs with new values and create new pairs if it doesn’t exist.
app.put("/app/schedules", (req, res) => {
  //Validation (Max characters 16, No special characters used in ReST), (Max 10 courses per schedule)
  const schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(1).max(16).required(),
    "course_list": joi.array().max(10).required()
  });
  const resultValidation = schema.validate(req.body);
  //Ensure valid result as well as valid course_list array
  if(resultValidation.error || !isValidCourseList(req.body.course_list)) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  //BODY OF THE MESSAGE WILL BE CASE SENSITIVE
  const schedule_name = req.body.name;
  let course_list = req.body.course_list;
  //Cannot catch duplicates
  let scheduleExists = false;
  let schedule_list = schedulesDB.get("schedule_list").value();
  for(i = 0; i < schedule_list.length; i++) {
    if(schedule_name == schedule_list[i].name) {
      schedule_list[i].course_list = [];
      for(j = 0; j < req.body.course_list.length; j++) {
        //Ensure that no other attribute beyond subject and catalog_nbr are accepted
        schedule_list[i].course_list.push({
          subject: req.body.course_list[j].subject,
          catalog_nbr: req.body.course_list[j].catalog_nbr
        });
      }
      schedulesDB.set("schedule_list", schedule_list).write();
      scheduleExists = true;
      break;
    }
  }
  if(!scheduleExists) {
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
  }
  else {
    schedule_list = schedulesDB.get("schedule_list").value();
    res.send({
      "message": "SUCCESS",
      "content": schedule_list
    });
  }
});

//6. Get the list of subject code, course code pairs for a given schedule.
app.get("/app/schedules", (req, res) => {
  /*WE CAN SEND THE SCHEDULE NAME IN THE QUERIES OF THE URL as Our input validation for
  adding schedule names ensured we disallow ReST special characters for schedule name*/
  //Validation (Max characters 16, No special characters used in ReST) for query
  const schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(1).max(16).required()
  });
  const resultValidation = schema.validate(req.query);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_QUERY"
    });
    return;
  }

  const schedule_name = req.query.name;
  let schedule_list = schedulesDB.get("schedule_list").value();
  let scheduleExists = false;
  for(i = 0; i < schedule_list.length; i++) {
    if(schedule_list[i].name == schedule_name){
      res.send({
        "message": "SUCCESS",
        "content": schedule_list[i].course_list
      });
      scheduleExists = true;
      break;
    }
  }
  if(!scheduleExists) {
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
  }
});

//7. Delete a schedule with a given name. Return an error if the given schedule doesn’t exist.
app.delete("/app/schedules", (req, res) => {
  //Validation (Max characters 16, No special characters used in ReST)
  const schema = joi.object({
    "name": joi.string().regex(regexSpecialChars).min(1).max(16).required()
  });
  const resultValidation = schema.validate(req.body);
  if(resultValidation.error) {
    res.status(400).send({
      "message": "ERR_BAD_BODY"
    });
    return;
  }

  const schedule_name = req.body.name;
  let schedule_list = schedulesDB.get("schedule_list").value();
  let scheduleExists = false;
  for(i = 0; i < schedule_list.length; i++) {
    if(schedule_list[i].name == schedule_name){
      schedule_list.splice(i, 1);
      schedulesDB.set(schedule_list).write();
      scheduleExists = true;
      break;
    }
  }
  if(!scheduleExists) {
    res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
  }
  else {
    schedule_list = schedulesDB.get("schedule_list").value();
    res.send({
      "message": "SUCCESS",
      "content": schedule_list
    });
  }
});

//8. Get a list of schedule names and the number of courses that are saved in each schedule.
app.get("/app/schedules/all", (req, res) => {
  //No need to ensure that the request is sanitized, we don't use parameters or body
  const schedule_list = schedulesDB.get("schedule_list").value();
  let schedule_names = [];
  for(i = 0; i < schedule_list.length; i++) {
    schedule_names.push({
      "name": schedule_list[i].name,
      "num_schedules": schedule_list[i].course_list.length
    });
  }
  res.send({
    "message": "SUCCESS",
    "content": schedule_names
  });
  return;
});

//9. Delete all schedules.
app.delete("/app/schedules/all", (req, res) => {
  //No need to ensure that the request is sanitized, we don't use parameters or body
  schedulesDB.unset("schedule_list").write();
  schedulesDB.defaults({"schedule_list": []}).write();
  res.send({
    "message": "SUCCESS",
    "content": []
  });
});


//-----Optional functionality-------
//Get the entire time-table data
app.get('/app/timetable', (req, res) => {
  //No need to ensure that the request is sanitized, we don't use parameters or body
  res.send({
    "message": "SUCCESS",
    "content": timetable
  });
});
//Get the entire time table data for a given subject
app.get('/app/timetable/:subject', (req, res) => {
  //No need to ensure that the request is sanitized
  const subjectName = req.params.subject.toUpperCase();
  let subjects = [];
  for(i = 0; i < timetable.length; i++) {
    if(subjectName == timetable[i].subject) subjects.push(timetable[i]);
  }
  if(subjects.length > 0) res.send({
    "message": "SUCCESS",
    "content": subjects
  });
  else res.status(404).send({
      "message": "ERR_RESULT_NOT_FOUND"
    });
});


//UTILITIES -----------------------------------------
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
