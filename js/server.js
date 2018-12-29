const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track', {useMongoClient: true} )
//added this as per log but didn't resolve "error saving" log
mongoose.Promise = require('bluebird')

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/*******************************************************************
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})
// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage
  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
***********************************************************************/

//my code starts here

//create models. keep in mind, keys that will appear later were not added initially (may cause trouble).
let userSchema = new mongoose.Schema ({
  username: String,
  count: Number,
  log: [{description: String, duration: String, date: String}]//may need to refactor this with an object
  //log: []
});
let User = mongoose.model('User', userSchema);

//Think about the consequences of not including these keys here initially.
let exerciseSchema = new mongoose.Schema ({
  username: String,
  description: String,
  duration: String, //may need to change this data-type
  /*_id: {
    type: String,
    ref: 'User'
  },*/
  _id: String,
  date: String 
});
let ExerciseLog = mongoose.model('ExerciseLog', exerciseSchema);


//get username and return object with name and _id
app.post('/api/exercise/new-user', (req,res)=> {
  let userName = new User ({
    username: req.body.username
  });
    userName.save((err,data)=> {
      if(err) {
        console.log("error");
      }else {
        console.log(data);
      }
    
    });
  res.json(userName);
});

//create GET that returns array of all users in DB
app.get('/api/exercise/users', (req,res)=> {
  User.find((err, data)=> {
    if(err) {
      console.log('error');
    }res.json(data);
  })
});

//add exercises
app.post('/api/exercise/add', (req,res) => {
  let description = req.body.description;
  let duration = req.body.duration;
  let id = req.body.userId;
  let userName;
  let date;
  let jsonDate;
  if (req.body.date == "" || req.body.date == null) {
    let generatedDate = new Date();
    let theYear = generatedDate.getFullYear().toString();
    let theMonth = generatedDate.getMonth();
    //must add one here because getMonth is 0-11.  Note: 1 is subtracted in "jsonDate" below
    theMonth += 1;
    theMonth = theMonth.toString();
    console.log(theMonth);
    let theDate = generatedDate.getDate().toString();
    date = theYear.concat("-", theMonth, "-", theDate);
    //this variable of jsonDate is created so that the res.json contains a format that is, e.g., "Sat Dec 01 2018"
    jsonDate = date.split("-");
    jsonDate = new Date(jsonDate[0],jsonDate[1]-1,jsonDate[2]);
    jsonDate = jsonDate.toDateString();
  }else {
    date = req.body.date;
    //this variable of jsonDate is created so that the res.json contains a format that is, e.g., "Sat Dec 01 2018"
    jsonDate = req.body.date.split("-");
    //note that the 2nd argument below must be subtracted by 1 to account for months starting with Jan = "0", Feb = "1", etc...
    jsonDate = new Date(jsonDate[0],jsonDate[1]-1,jsonDate[2]);
    jsonDate = jsonDate.toDateString();
  }
  User.findById(id, (err, data)=> {
    if (err) {
      console.log("error");
    }else {
      //console.log(data.username);
      userName = data.username;
      data.log = data.log.concat({description: description, duration: duration, date: date});
      res.json({"username": userName, "description": description, "duration": duration, "_id": id, "date": jsonDate});
      data.markModified(data.log);
      data.save((err,data)=> {
        if (err) {
          console.log("error saving");
        }else {
          console.log("saved");
          //console.log(data);
        }
      });
    }
  });
});

//get exercise log and count
app.get('/api/exercise/log', (req,res)=>{
  let user = req.query.userId;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  User.findById(user,(err,data)=> {
    if (err) {
      console.log("error");
    }else if((from == " " || from == null) || (to == " " || to == null)){
      //logic for limiting length of log-array
      if (limit == undefined || limit == null || limit == "") {
        //may need to map data.log to polish up the res.json
        res.json({"_id": data._id, "username": data.username, "count": data.log.length, "log": data.log});
      }while (limit < data.log.length) {
        //will using pop() here actually alter the log array stored in the database if nothing is saved?
        data.log.pop();
      }
      //may need to map data.log to polish up the res.json
      res.json({"_id": data._id, "username": data.username, "count": data.log.length, "log": data.log});
    }else {
      //create logic for filtering exercise log by date
      let dataLog = data.log;
      let filterLog = dataLog.filter((y)=> (y.date) > from && (y.date) < to);
      //logic for limiting length of log-array
      if (limit == undefined || limit == null || limit == "") {
        res.json({"_id": data._id, "username": data.username, "count": filterLog.length, "log": filterLog});
      }while (limit < filterLog.length) {
        filterLog.pop();
      }
      res.json({"_id": data._id, "username": data.username, "count": filterLog.length, "log": filterLog});
    }
  });
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
