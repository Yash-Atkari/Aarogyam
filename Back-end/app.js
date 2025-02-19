const express = require("express");

const app = express();

app.get("/aarogyam", (req, res) => {
    res.send("Welcome to dashboard");
});

app.listen(8080, () => {
    console.log("app is listening on port 8080");
});
