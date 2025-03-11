// Script to drop the clerkId index from the users collection
const { MongoClient } = require("mongodb");

// MongoDB connection string - update this to match your environment
const MONGODB_URI = "mongodb://localhost:27017/healthcare";

async function dropClerkIdIndex() {
  let client;

  try {
    // Connect directly to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to database");

    // Get the users collection
    const db = client.db();
    const usersCollection = db.collection("users");

    // Check if the index exists
    const indexes = await usersCollection.indexes();
    console.log("Current indexes:", indexes);

    const clerkIdIndex = indexes.find(
      (index) => index.name === "clerkId_1" || (index.key && index.key.clerkId)
    );

    if (clerkIdIndex) {
      // Drop the index
      await usersCollection.dropIndex("clerkId_1");
      console.log("Successfully dropped clerkId_1 index");
    } else {
      console.log("clerkId_1 index not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the connection
    if (client) {
      await client.close();
      console.log("Database connection closed");
    }
  }
}

// Run the function
dropClerkIdIndex();
