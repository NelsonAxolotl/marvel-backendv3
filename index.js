const express = require("express");
const app = express();
app.use(express.json());
const axios = require("axios");
const cors = require("cors");
app.use(cors());
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const isAuthenticated = require("./middlewares/isAuthenticated");

require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);
const User = require("./models/user");

const BASE_URL = "https://lereacteur-marvel-api.herokuapp.com";
const validApiKey = process.env.VALID_API_KEY;
// Clé API valide //

//EXTRA/////
// Récupérer les informations d'un personnage spécifique
app.get("/character/:characterId", async (req, res) => {
  const { characterId } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/character/${characterId}`, {
      params: { apiKey: validApiKey },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des informations du personnage",
    });
  } //
});

//liste des personnages//
app.get("/characters", async (req, res) => {
  const apiKey = req.query.apiKey; // la clé API de ma requête

  console.log("Clé API reçue:", apiKey);

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
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des personnages" });
  }
});

// Récupérer la liste des comics

app.get("/comics", async (req, res) => {
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
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des comics" });
  }
});

// Récupérer les comics contenant un personnage spécifique

app.get("/comics/:characterId", async (req, res) => {
  const { characterId } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/comics/${characterId}`, {
      params: { apiKey: validApiKey },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      message:
        "Erreur lors de la récupération des comics contenant ce personnage",
    });
  }
});

// Récupérer les informations d'un comic spécifique
app.get("/comic/:comicId", async (req, res) => {
  const { comicId } = req.params;
  try {
    const response = await axios.get(
      `${BASE_URL}/comic/${comicId}?apiKey=${process.env.API_KEY}`
    );
    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des informations du comic",
    });
  }
});

app.get("/favorites/character/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Trouver l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Récupérer les favoris de l'utilisateur
    const favorites = user.favorites;
    const favoritesDetails = [];

    // Récupérer les détails de chaque favori en faisant une requête pour chaque ID
    for (let i = 0; i < favorites.length; i++) {
      const favoriteId = favorites[i];
      const response = await axios.get(`${BASE_URL}/character/${favoriteId}`, {
        params: { apiKey: validApiKey },
      });
      favoritesDetails.push(response.data);
    }

    res.status(200).json({ favorites: favoritesDetails });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des favoris" });
  }
});

app.get("/favorites/comic/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Trouver l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Récupérer les favoris de l'utilisateur
    const favorites = user.favorites;
    const favoritesDetails = [];

    // Récupérer les détails de chaque favori en faisant une requête pour chaque ID
    for (let i = 0; i < favorites.length; i++) {
      const favoriteId = favorites[i];
      const response = await axios.get(`${BASE_URL}/character/${favoriteId}`, {
        params: { apiKey: validApiKey },
      });
      favoritesDetails.push(response.data);
    }

    res.status(200).json({ favorites: favoritesDetails });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des favoris" });
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
      return res
        .status(400)
        .json({ message: "Username, email, and password are required." });
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

    const newHash = SHA256(req.body.password + loginUser.salt).toString(
      encBase64
    );
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
/*---FAVORIS-----*/

app.post("/user/favorites/character/add", async (req, res) => {
  const { userId, characterId } = req.body;

  try {
    // Trouver l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le personnage est déjà dans les favoris de l'utilisateur
    if (!user.favorites.includes(characterId)) {
      // Ajouter le personnage à la liste des favoris de l'utilisateur
      user.favorites.push(characterId);

      // Enregistrer les modifications
      await user.save();

      return res.status(200).json({ message: "Favori ajouté avec succès" });
    } else {
      return res
        .status(201)
        .json({ message: "Ce personnage est déjà en favori" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout du favori" });
  }
});

app.post("/user/favorites/character/remove", async (req, res) => {
  const { userId, characterId } = req.body;

  try {
    // Trouver l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le personnage est dans les favoris de l'utilisateur
    const index = user.favorites.indexOf(characterId);
    if (index !== -1) {
      // Supprimer le personnage de la liste des favoris de l'utilisateur
      user.favorites.splice(index, 1);

      // Enregistrer les modifications
      await user.save();

      return res.status(200).json({ message: "Favori supprimé avec succès" });
    } else {
      return res
        .status(201)
        .json({ message: "Ce personnage n'est pas un favori" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression du favori" });
  }
});

app.post("/user/favorites/comic/add", async (req, res) => {
  const { userId, comicId } = req.body;

  try {
    // Trouver l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le comic est déjà dans les favoris de l'utilisateur
    if (!user.favorites.includes(comicId)) {
      // Ajouter le comic à la liste des favoris de l'utilisateur
      user.favorites.push(comicId);

      // Enregistrer les modifications
      await user.save();

      return res.status(200).json({ message: "comic ajouté avec succès" });
    } else {
      return res.status(201).json({ message: "Ce comic est déjà en favori" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout du favori" });
  }
});

app.post("/user/favorites/comic/remove", async (req, res) => {
  const { userId, comicId } = req.body;

  try {
    // Trouver l'utilisateur par son ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le personnage est dans les favoris de l'utilisateur
    const index = user.favorites.indexOf(comicId);
    if (index !== -1) {
      // Supprimer le personnage de la liste des favoris de l'utilisateur
      user.favorites.splice(index, 1);

      // Enregistrer les modifications
      await user.save();

      return res.status(200).json({ message: "Favori supprimé avec succès" });
    } else {
      return res.status(201).json({ message: "Ce comic n'est pas un favori" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression du favori" });
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
