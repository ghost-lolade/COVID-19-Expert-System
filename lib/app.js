const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// To support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());
// var phpExpress = require('php-express')({
//     binPath: 'php'
// });

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'expert_system'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL Server!');
});


app.use(express.static(path.join(__dirname, '../public/'))); // download static files
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));
// app.engine('php', phpExpress.engine);
// app.set('view engine', 'php');

// app.all(/.+\.php$/, phpExpress.router);
app.set('view options', { layout: 'layouts/main' });
hbs.registerPartials(path.join(__dirname, '../views/partials'));

app.get('/', (req, res) => {
    res.render('dev.hbs');
});

app.get('/register', (req, res) => {
    res.render('registration');
});

const crypto = require('crypto');

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}


const users = [
    // This user is added to the array to avoid creating a new user on each restart
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@email.com',
        // This is the SHA256 hash for value of `password`
        password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg='
    }
];

app.post('/register', (req, res) => {
    const { email, firstName, lastName, password, confirmPassword } = req.body;

    // Check if the password and confirm password fields match
    if (password === confirmPassword) {

        // Check if user with the same email is also registered
        if (users.find(user => user.email === email)) {

            res.render('register', {
                message: 'User already registered.',
                messageClass: 'alert-danger'
            });

            return;
        }

        const hashedPassword = getHashedPassword(password);

        // Store user into the database if you are using one
        users.push({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        res.render('login', {
            message: 'Registration Complete. Please login to continue.',
            messageClass: 'alert-success'
        });
    } else {
        res.render('register', {
            message: 'Password does not match.',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});


const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

// This will hold the users and authToken related to users
const authTokens = {};

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    const user = users.find(u => {
        return u.email === email && hashedPassword === u.password
    });

    if (user) {
        const authToken = generateAuthToken();

        // Store authentication token
        authTokens[authToken] = user;

        // Setting the auth token in cookies
        res.cookie('AuthToken', authToken);

        // Redirect user to the protected page
        res.redirect('/home');
    } else {
        res.render('login', {
            message: 'Invalid username or password',
            messageClass: 'alert-danger'
        });
    }
});


app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];

    next();
});

app.get('/home', (req, res) => {
    if (req.user) {
        res.render('home');
    } else {
        res.render('login', {
            message: 'Please login to continue',
            messageClass: 'alert-danger'
        });
    }
});

const requireAuth = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.render('login', {
            message: 'Please login to continue',
            messageClass: 'alert-danger'
        });
    }
};

app.get('/home', requireAuth, (req, res) => {
    res.render('home');
});


// app.post('/test', function ( req, res ){
//     res.render("/views/test.php");
// });

const es = require('./es');

app.get('/diagnosis/:facts', async function (req, res) {
    const facts = JSON.parse(req.params.facts)
    await es.diagnose(facts);
    res.json(facts);
});
app.get('/save/:data/:answers', async function (req, res) {
    const data = JSON.parse(req.params.data)
    const answers = JSON.parse(req.params.answers)
    addUserAndResults(answers, data);
    res.json(data)
});
// app.get('/process/:answers', async function (req, res) {
//     const result = JSON.parse(req.params.answers)
//     console.log(result)
//     // addUser(result);
//     res.json(result);
// });

// function query() {
//     return connection.query(
//         'SELECT * FROM `user` WHERE `name` = "Lolade"',
//         function(err, results, fields) {
//             if(err) throw err;
//             console.log('The data from users table are: \n', results);
//         }
//       );
      
// }

function addUserAndResults(answers, data) {
    let insertQuery = 'INSERT INTO ?? (??,??,??) VALUES (?,?,?)';
    let users, user_id
    var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date+' '+time;
    
    let name = answers.name, gender = answers.gender, age = answers.age;
    
    let query = mysql.format(insertQuery,["user","name", "gender", "age",name,gender,age]);
    connection.query(query,(err, response) => {
        if(err) {
            console.error(err);
            return null;
        }
        // rows added
        user_id = response.insertId;
        return response.insertId
    });
    console.log(user_id)
    insertQuery = 'INSERT INTO ?? (??,??,??, ??,??,??, ??,??,??, ??,??,??, ??,??,??, ??) VALUES (?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?)';
    
    let answer1 = data.familyHistory,
        answer2 = data.smokingHistory,
        answer3 = data.chestPain,
        answer4 = data.cough,
        answer5 = data.coughingUpBlood,
        answer6 = data.fever,
        answer7 = data.rapidBreathing,
        answer8 = data.shortnessOfBreath,
        answer9 = data.rapidHeartbeat,
        answer10 = data.wheezing,
        answer11 = data.duration,
        answer12 = data.lossOfTasteOrSmell,
        duration = data.duration,
        disease = data.disease,
        percentage = data.percentage,
        user = user_id ? user_id : dateTime;
    query = mysql.format(insertQuery,[

        "results",
        "answer1",
        "answer2",
        "answer3", 
        "answer4",
        "answer5",
        "answer6",
        "answer7",
        "answer8",
        "answer9",
        "answer10",
        "answer11",
        "answer12",
        "duration",
        "disease",
        "percentage",
        "user",
        answer1,
        answer2, 
        answer3,
        answer4,
        answer5,
        answer6,
        answer7,
        answer8,
        answer9,
        answer10,
        answer11,
        answer12,
        duration,
        disease,
        percentage,
        user,
    ]);
    connection.query(query,(err, response) => {
        if(err) {
            console.error(err);
            return;
        }
        // rows added
        // console.log(response.insertId);
    });
}
// function storeData(data) {
//     let insertQuery = 'INSERT INTO ?? (??,??,??, ??,??,??, ??,??,??, ??,??,??, ??,??,??, ??, ??) VALUES (?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?)';
    
//     let answer1 = data.familyHistory,
//         answer2 = data.smokingHistory,
//         answer3 = data.chestPain,
//         answer4 = data.cough,
//         answer5 = data.coughingUpBlood,
//         answer6 = data.fever,
//         answer7 = data.rapidBreathing,
//         answer8 = data.shortnessOfBreath,
//         answer9 = data.rapidHeartbeat,
//         answer10 = data.wheezing,
//         answer11 = data.duration,
//         answer12 = data.lossOfTasteOrSmell,
//         duration = data.duration,
//         disease = data.disease,
//         percentage = data.percentage,
//         user;
//     let query = mysql.format(insertQuery,[

//         "results",
//         "answer1",
//         "answer2",
//         "answer3", 
//         "answer4",
//         "answer5",
//         "answer6",
//         "answer7",
//         "answer8",
//         "answer9",
//         "answer10",
//         "answer11",
//         "answer12",
//         "duration",
//         "disease",
//         "percentage",
//         "user",
//         answer1,
//         answer2, 
//         answer3,
//         answer4,
//         answer5,
//         answer6,
//         answer7,
//         answer8,
//         answer9,
//         answer10,
//         answer11,
//         answer12,
//         duration,
//         disease,
//         percentage,
//         user,
//     ]);
//     connection.query(query,(err, response) => {
//         if(err) {
//             console.error(err);
//             return;
//         }
//         // rows added
//         console.log(response.insertId);
//     });
// }

const port = process.env.PORT || 3000;

app.listen(port);
