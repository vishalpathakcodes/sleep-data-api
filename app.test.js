const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Model and routes definitions
const sleepData = new mongoose.Schema({
    userId: { type: Number, required: true },
    hours: { type: Number, required: true }
}, { timestamps: true });

const Sleep = mongoose.model("Sleep", sleepData);

app.get("/", (req, res) => {
    res.end("Welcome to sleep Data");
});

app.post("/sleep", async (req, res) => {
    const body = req.body;
    if (!body || !body.userId || !body.hours) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const userSleepData = await Sleep.create({ userId: body.userId, hours: body.hours });
    return res.status(201).json({ message: "User created successfully" });
});

app.get("/sleep/:id", async (req, res) => {
    try {
        const userIdData = await Sleep.find({ userId: req.params.id }).sort({ createdAt: 1 });
        if (!userIdData || userIdData.length === 0) {
            return res.status(404).send({ message: "No sleep records found for this user" });
        }
        res.send(userIdData);
    } catch (error) {
        res.status(500).send({ message: "An error occurred while fetching sleep records" });
    }
});

app.delete("/sleep/:recordId", async (req, res) => {
    try {
        const result = await Sleep.findByIdAndDelete(req.params.recordId);
        if (!result) {
            return res.status(404).send({ message: "Sleep record not found" });
        }
        res.send({ message: "Sleep record deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: "An error occurred while deleting the sleep record" });
    }
});

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Test the sleep data API", () => {
    it("should return welcome message", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.text).toBe("Welcome to sleep Data");
    });

    it("should create a new sleep record", async () => {
        const response = await request(app).post("/sleep").send({
            userId: 1,
            hours: 8
        });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User created successfully");
    });

    it("should return 400 for missing fields", async () => {
        const response = await request(app).post("/sleep").send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("All fields are required");
    });

    it("should get sleep records for a user", async () => {
        await request(app).post("/sleep").send({ userId: 1, hours: 8 });
        const response = await request(app).get("/sleep/1");
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return 404 if no sleep records found", async () => {
        const response = await request(app).get("/sleep/999");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("No sleep records found for this user");
    });

    it("should delete a sleep record", async () => {
        const record = await Sleep.create({ userId: 1, hours: 8 });
        const response = await request(app).delete(`/sleep/${record._id}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Sleep record deleted successfully");
    });

    it("should return 404 if sleep record not found for deletion", async () => {
        const response = await request(app).delete("/sleep/507f1f77bcf86cd799439011");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Sleep record not found");
    });
});
