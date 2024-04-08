const express = require("express");
const app = express();
app.use(express.json());
const axios = require('axios');
const cors = require('cors');
app.use(cors());
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const isAuthenticated = require("./middlewares/isAuthenticated");

require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);
const User = require("./models/user");

const BASE_URL = 'https://lereacteur-marvel-api.herokuapp.com';
const validApiKey = process.env.VALID_API_KEY;
// Clé API valide //


//EXTRA//
// Récupérer les informations d'un personnage spécifique
app.get('/character/:characterId', async (req, res) => {
    const { characterId } = req.params;
    try {
        const response = await axios.get(`${BASE_URL}/character/${characterId}`, {
            params: { apiKey: validApiKey },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des informations du personnage' });
    }
});

//liste des personnages//
// ex http://localhost:3000/characters?apiKey=2yP9TZZSBoTZ2418

app.get('/characters', async (req, res) => {
    const apiKey = req.query.apiKey; // la clé API de ma requête

    console.log('Clé API reçue:', apiKey);
    // console.log('skip:', skip);
    // console.log('Limit:', limit);
    try {
        const name = req.query.name || "";
        const skip = req.query.skip || "0";
        const limit = req.query.limit || "100";

        const response = await axios.get(`${BASE_URL}/characters`, {
            params: { apiKey: validApiKey, name, skip, limit },
        });
        console.log(response.data);
        res.json(response.data);

    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des personnages' });
    }
});


// Récupérer la liste des comics
//ex http://localhost:3000/comics?apiKey=2yP9TZZSBoTZ2418
app.get('/comics', async (req, res) => {
    const apiKey = req.query.apiKey; // la clé API de ma requête
    try {


        const skip = req.query.skip || "0";
        const limit = req.query.limit || "100";
        const title = req.query.title || "";

        const response = await axios.get(`${BASE_URL}/comics`, {
            params: { apiKey: validApiKey, title, skip, limit },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des comics' });
    }
});

// Récupérer les comics contenant un personnage spécifique
// ex:http://localhost:3000/comics/5fcf91f4d8a2480017b91453?apiKey=2yP9TZZSBoTZ2418

app.get('/comics/:characterId', async (req, res) => {
    const { characterId } = req.params;
    try {

        const response = await axios.get(`${BASE_URL}/comics/${characterId}`, {
            params: { apiKey: validApiKey },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des comics contenant ce personnage' });
    }
});


// Récupérer les informations d'un comic spécifique
app.get('/comic/:comicId', async (req, res) => {
    const { comicId } = req.params;
    try {
        const response = await axios.get(`${BASE_URL}/comic/${comicId}?apiKey=${process.env.API_KEY}`
            // params: { apiKey: validApiKey }
        );
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des informations du comic' });
    }
});

/*------SING UP-----*/

app.post("/signup", async (req, res) => {
    try {
        console.log(req.body);
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ message: "This email already exists" });
        }

        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        const salt = uid2(16);
        const hash = SHA256(req.body.password + salt).toString(encBase64);
        const token = uid2(64);
        const newUser = new User({
            email: req.body.email,
            account: {
                username: req.body.username,
            },
            token: token,
            salt: salt,
            hash: hash,

        });

        console.log(newUser);
        await newUser.save();
        const responseObject = {
            _id: newUser._id,
            token: newUser.token,
            account: {
                username: newUser.account.username,
            },
        };
        return res.status(201).json(responseObject);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
/*--------LOGIN----*/


app.post("/login", async (req, res) => {
    try {
        const loginUser = await User.findOne({ email: req.body.email });
        if (!loginUser) {
            return res.status(401).json({ message: "Email or password incorrect" });
        }
        if (!req.body.password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const newHash = SHA256(req.body.password + loginUser.salt).toString(encBase64);
        if (newHash !== loginUser.hash) {
            return res.status(401).json({ message: "Email or password incorrect" });
        }

        res.status(200).json({
            _id: loginUser._id,
            token: loginUser.token,
            account: {
                username: loginUser.username,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/*-----CHECKING ROUTE------*/

app.get(`/`, (req, res) => {
    res.status(200).json({ message: `Welcome to Marvel server` });
});

app.all("*", (req, res) => {
    res.status(404).json("Not found");
});

app.listen(process.env.PORT, () => {
    console.log("Server started, GO......");
});