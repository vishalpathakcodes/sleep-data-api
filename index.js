// Import the required modules
const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Middleware to parse URL-encoded data and JSON data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose.connect("mongodb://localhost:27017/sleep-data")
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log(err);
    });

// Define the schema for sleep data
const sleepData = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
    },
    hours: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

// Create the Sleep model from the schema
const Sleep = mongoose.model("Sleep", sleepData);

// Define a simple route for the root URL
app.get("/", (req, res) => {
    res.end("Welcome to sleep Data");
});

// Define a POST route to create new sleep records
app.post("/sleep", async (req, res) => {
    const body = req.body;

    // Validate the request body
    if (!body || !body.userId || !body.hours) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new sleep record in the database
    const userSleepData = await Sleep.create({
        userId: body.userId,
        hours: body.hours
    });

    console.log("userSleepData", userSleepData);
    return res.status(201).json({ message: "User created successfully" });
});

// Define a GET route to retrieve sleep records by user ID
app.get("/sleep/:id", async (req, res) => {
    try {
        // Find sleep records for the given user ID and sort by date
        const userIdData = await Sleep.find({ userId: req.params.id }).sort({ createdAt: 1 });

        // If no records are found, return a 404 status
        if (!userIdData || userIdData.length === 0) {
            return res.status(404).send({ message: "No sleep records found for this user" });
        }

        // Send the found records as a response
        res.send(userIdData);
    } catch (error) {
        // Handle any potential errors
        console.error("Error fetching sleep records:", error);
        res.status(500).send({ message: "An error occurred while fetching sleep records" });
    }
});

// Define a DELETE route to delete a sleep record by its ID
app.delete("/sleep/:recordId", async (req, res) => {
    try {
        // Find and delete the sleep record by its ID
        const result = await Sleep.findByIdAndDelete(req.params.recordId);

        // If the record is not found, return a 404 status
        if (!result) {
            return res.status(404).send({ message: "Sleep record not found" });
        }

        // Send a success message if the deletion was successful
        res.send({ message: "Sleep record deleted successfully" });
    } catch (error) {
        // Handle any potential errors
        console.error("Error deleting sleep record:", error);
        res.status(500).send({ message: "An error occurred while deleting the sleep record" });
    }
});

// Start the server and listen on port 8000
app.listen(8000, () => {
    console.log("Server started");
});
