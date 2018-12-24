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

//create model. keep in mind, keys that will appear later were not added initially (may cause trouble).
let userSchema = new mongoose.Schema ({
  username: String,
  count: Number,
  //log: [{description: String, duration: String, date: String}]//may need to refactor this with an object
  log: []
})

let User = mongoose.model('User', userSchema)

//get username and return object with name and _id

app.post('/api/exercise/new-user', (req,res,next)=> {
  /*let userName = req.body.username; //weird redundancy(?) I had */
  let userName = new User ({
    username: req.body.username
  });
  //const createUser = function(done) {
    userName.save((err,data)=> {
      if(err) {
        console.log("error")
        //return done(err)
      }else {
        console.log(data)
        //return done(null,data)
      }
    
    })
  //}
  res.json(userName)
  //console.log(createUser)
  next();
});

//create GET that returns array of all users in DB
app.get('/api/exercise/users', (req,res,next)=> {
  User.find((err, data)=> {
    //res.json(data);
    if(err) {
      console.log('error');
    }res.json(data);
    next();
  })
});

//add exercises 
app.post('/api/exercise/add', (req,res,next)=> {
  //find by id, add description, duration, and if there's no date retrieve-&-add current date.
  console.log("made it this far");
  /*
  console.log(req.body);
  console.log(req.body.description);
  console.log("before is 1st req.body");
  */
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  let dateArray = [];
  //variable below is meant for res.json when uploading an exercise
  let jsonDate;
  //figure logic for if "date" field is empty
  if (date == '') {
    console.log("no date");
    console.log(Date());
    console.log("*******DATE*******")
    let d = new Date();
    date = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    //this is all a MESS!!! determine this logic AFTER accounting for dates actually typed by user
    jsonDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    jsonDate = jsonDate.toDateString()
    console.log(jsonDate)
    console.log(req)
    console.log("***JSONDATE***")
  }else {
    jsonDate = req.body.date.split("-");
    console.log(jsonDate)
    //note that the 2nd argument below must be subtracted by 1 to account for months starting with Jan = "0", Feb = "1", etc...
    jsonDate = new Date(jsonDate[0],jsonDate[1]-1,jsonDate[2]);
    jsonDate = jsonDate.toDateString();
    //res.json({"username": req.body.username, "date": jsonDate});
    console.log(jsonDate);
    console.log("****JSONDATE****")
  }
  User.findById({_id: req.body.userId},(err, data)=> {
    //try adding res.json here
    console.log(data.username);
    console.log(data);
    //res.json({"data":data})
    console.log("***************************")
    if (err) {
        console.log("made it this far 2");
      console.log("error");
    }else {
      console.log("made it this far 3");
      //console.log(data);
      //data.log.push({description: description, duration: duration, date: date});
      data.log = data.log.concat({description: description, duration: duration, date: date});
      //data.log.push({description: description})
      /*
      console.log(data);
      console.log("above is post-push");
      */
      data.markModified(data.log);
      data.save((err,data)=> {
        if (err) {
          console.log("***");
          console.log(err);
          console.log("error saving");
        }else {
            console.log("made it this far 4");
          //res.json(data)
          console.log(data);
        }
      })
    }
  })
  next();
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
