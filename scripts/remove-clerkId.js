// Script to remove clerkId field from all users and drop the clerkId index
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection string
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

async function removeClerkIdField() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const usersCollection = db.collection("users");

    // First, drop all indexes related to clerkId
    const indexes = await usersCollection.indexes();
    console.log("Current indexes:", indexes);

    // Find all indexes that include clerkId
    const clerkIdIndexes = indexes.filter(
      (index) =>
        index.name === "clerkId_1" ||
        index.name === "clerkId_1_role_1" ||
        (index.key && index.key.clerkId)
    );

    // Drop each clerkId-related index
    for (const index of clerkIdIndexes) {
      console.log(`Dropping index: ${index.name}...`);
      try {
        await usersCollection.dropIndex(index.name);
        console.log(`Successfully dropped ${index.name} index`);
      } catch (error) {
        console.error(`Error dropping index ${index.name}:`, error);
      }
    }

    // Then, remove the clerkId field from all users
    console.log("Removing clerkId field from all users...");
    const updateResult = await usersCollection.updateMany(
      {}, // Match all documents
      { $unset: { clerkId: "" } } // Remove the clerkId field
    );

    console.log(`Modified ${updateResult.modifiedCount} users`);
    console.log("clerkId field has been removed from all users");

    // Verify the updated indexes
    const updatedIndexes = await usersCollection.indexes();
    console.log("Updated indexes:", updatedIndexes);
  } catch (error) {
    console.error("Error removing clerkId field:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
removeClerkIdField();
