const express = require("express");
const session = require("express-session");
require("dotenv").config();
const app = express();

// Serve static files from the public dir
app.use(express.static("public"));
app.use(express.json());

// Session middleware
app.use(session({
    secret: "yogitrack-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
app.use("/api/class", require("./routes/classRoutes.cjs"));
app.use("/api/customer", require("./routes/customerRoutes.cjs"));
app.use("/api/package", require("./routes/packageRoutes.cjs"));
app.use("/api/checkIn", require("./routes/checkInRoutes.cjs"));
app.use("/api/reports", require("./routes/reportsRoutes.cjs"));
app.use("/api/auth", require("./routes/authRoutes.cjs"));
app.use("/api/messaging", require("./routes/messagingRoutes.cjs"));

// Start the web server
const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
  console.log('Open http://localhost:8080/index.html in your browser to view the app.');
});
