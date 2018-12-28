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
  if (req.body.date == "" || req.body.date == null) {
    date = new Date();
    date = date.toDateString();
  }else {
    date = req.body.date;
    date = req.body.date.split("-");
    //note that the 2nd argument below must be subtracted by 1 to account for months starting with Jan = "0", Feb = "1", etc...
    date = new Date(date[0],date[1]-1,date[2]);
    date = date.toDateString();
  }
  User.findById(id, (err, data)=> {
    if (err) {
      console.log("error");
    }else {
      //console.log(data.username);
      userName = data.username;
      //res.json({"username": userName, "description": description, "duration": duration, "_id": id, 'date': date});
      data.log = data.log.concat({description: description, duration: duration, date: date});
      res.json({"username": userName, "description": description, "duration": duration, "_id": id, "date": date});
      data.markModified(data.log);
      data.save((err,data)=> {
        if (err) {
          console.log("***");
          //console.log(err);
          console.log("error saving");
        }else {
          console.log("****");
          //console.log(data);
        }
      });
    }
  });
});

//get exercise log and count
app.get('/api/exercise/log', (req,res)=>{
  let user = req.query.userId;
  User.findById(user,(err,data)=> {
    if (err) {
      console.log("error");
      //return next(err);
    }else {
      res.json({"_id": data._id, "username": data.username, "count": data.log.length, "log": data.log});
    }
  });
});

/*incorporate this into the /log endpoint logic

var log = [{"description":"jog","duration":10,"date":"2018-12-01"},
{"description":"jumping jack","duration":10,"date":"2018-12-10"},
{"description":"jog","duration":10,"date":"2018-12-15"},
{"description":"jog","duration":10,"date":"2018-12-20"},
{"description":"jog","duration":10,"date":"2018-12-27"}];



var filteredList = log.filter((y)=> (y.date) >= "2018-12-02" && (y.date) <= "2018-12-27" );

console.log(filteredList); 
*/



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
