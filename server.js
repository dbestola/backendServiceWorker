const express = require("express");
const app = express();
const webpush = require('web-push');
const cors = require("cors");
const env = require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('./Models/Subscription'); // Import the Subscription model

const PORT = process.env.PORT || 10000;

const apiKeys = {
    publicKey: process.env.Public_Key,
    privateKey: process.env.Private_Key
};

webpush.setVapidDetails(
    'mailto:olanrewajuoladimeji5@gmail.com',
    apiKeys.publicKey,
    apiKeys.privateKey
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello world");
});

// Save subscription to MongoDB
app.post("/save-subscription", async (req, res) => {
    console.log("Received subscription:", req.body); // Log the subscription
    try {
        const subscription = new Subscription(req.body);
        await subscription.save(); // Save subscription to the database
        res.json({ status: "Success", message: "Subscription saved!" });
    } catch (error) {
        console.error("Error saving subscription:", error);
        res.status(500).json({ status: "Error", message: "Failed to save subscription." });
    }
});

// Send notification to all subscriptions in the database
app.get("/send-notification", async (req, res) => {
    const subscriptions = await Subscription.find(); // Retrieve all subscriptions from the database

    if (subscriptions.length === 0) {
        return res.status(400).json({ status: "Error", message: "No subscriptions found." });
    }

    const notificationPayload = JSON.stringify({
        title: "Hello!",
        body: "This is a test notification.",
        icon: "path/to/icon.png",
    });

    // Send notifications to all subscriptions
    Promise.all(subscriptions.map(subscription => {
        return webpush.sendNotification(subscription, notificationPayload)
            .catch(error => {
                console.error("Error sending notification:", error);
                return null; // Return null for failed notifications
            });
    }))
    .then(() => {
        res.json({ status: "Success", message: "Notifications sent to push service" });
    })
    .catch(() => {
        res.status(500).json({ status: "Error", message: "Failed to send notifications" });
    });
});

app.get("/article", (req, res) => {

    return res.send({
        1: {
          title: "Razzle and SSR", 
          content: "Learn how to use Razzle with SSR.",
        },
        2: {
          title: "Preloading State with Razzle",
          content: "Learn how to preload state in Razzle apps.",
        },
      } )
});

// Connecting to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server now running on ${PORT}`);
    });
})
.catch((error) => {
    console.log("Database connection error:", error);
});
