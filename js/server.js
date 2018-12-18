const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track', {useMongoClient: true} )

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
  username: String
})

let User = mongoose.model('User', userSchema)

//get username and return object with name and _id

app.post('/api/exercise/new-user', (req,res,next)=> {
  let userName = req.body.username;
  userName = new User ({
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
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
