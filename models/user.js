const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
  },
  token: String,
  hash: String,
  salt: String,
  favorites: Array,
});

module.exports = User;
