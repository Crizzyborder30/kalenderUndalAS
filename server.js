const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const { getISOWeek, addWeeks } = require('date-fns');




const app = express();
const PORT = process.env.PORT || 3000;;
const dataFile = 'data.json';

app.use(cors());
app.use(bodyParser.json());

////
// GitHub repo detaljer
const GITHUB_REPO = 'Crizzyborder30/kalenderUndalAS';
const GITHUB_TOKEN = process.env.gitToken;
//const FILE_PATH = 'path/to/your/datafile.json';
const BRANCH = 'main';
const updateGithubFile = async () => {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${dataFile}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
    };

    try {
        // Få nåværende innhold og sha for filen
        let response = await axios.get(url, { headers });
        const sha = response.data.sha;
        // Bruk readData for å hente filinnholdet
        const data = await readData();
        if (data === null) {
            throw new Error('Filen ble ikke funnet');
        }
        const encodedContent = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');


        const updateData = {
            message: 'Automatisk oppdatering av data',
            content: encodedContent,
            sha: sha,
            branch: BRANCH
        };

        // Oppdater filen
        response = await axios.put(url, updateData, { headers });
        if (response.status === 200) {
            console.log('Filen ble oppdatert på GitHub');
        } else {
            console.log(`Feil ved oppdatering av filen: ${response.status}`);
        }
    } catch (error) {
        console.error(`Feil ved henting eller oppdatering av filen: ${error.message}`);
    }
};
////





//
app.use(express.static('public'));
const session = require('express-session');
// Sett opp body-parser for å håndtere POST-forespørsler
app.use(bodyParser.urlencoded({ extended: false }));

// Sett opp express-session for å håndtere brukersesjoner
app.use(session({
    secret: process.env.key, // Bytt ut med en hemmelig nøkkel
    resave: false,
    saveUninitialized: true
}));

// Middleware for å sjekke om brukeren er autentisert
const isAuthenticated = (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    } else {
        res.redirect('/login');
    }
};

// Rute for login-siden
app.get('/login', (req, res) => {
    res.send(`
        <form method="POST" action="/login">
            <p>Enter password to access the site:</p>
            <input type="password" name="password" placeholder="Password">
            <button type="submit">Submit</button>
        </form>
    `);
});

// Håndter login POST-forespørselen
app.post('/login', (req, res) => {
    const correctPassword = process.env.password; // Bytt ut med ditt faktiske passord
    const enteredPassword = req.body.password;

    if (enteredPassword === correctPassword) {
        req.session.authenticated = true;
        res.redirect('/');
    } else {
        res.send('Incorrect password. <a href="/login">Try again</a>');
    }
});

const path = require('path');

app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Logout-rute
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

//



const getCurrentAndNextTwoWeeks = () => {
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const nextWeek = getISOWeek(addWeeks(now, 1));
    const weekAfterNext = getISOWeek(addWeeks(now, 2));

    return {
        currentWeek: currentWeek,
        nextWeek: nextWeek,
        weekAfterNext: weekAfterNext
    };
};

const weeks = getCurrentAndNextTwoWeeks();



app.get('/weekNumber', (req, res) => {
    const weekNumbers = getCurrentAndNextTwoWeeks(); 
    res.send(weekNumbers);
});


// Hente posisjoner
app.get('/positions', (req, res) => {
    fs.readFile(dataFile, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }
        res.send(JSON.parse(data));
    });
});

// Lagre posisjoner
app.post('/positions', (req, res) => {
    fs.writeFile(dataFile, JSON.stringify(req.body), (err) => {
        if (err) {
            return res.status(500).send('Error writing data');
        }
        res.send('Positions saved');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



