const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const path = require("path");

// MongoDB connection string
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

async function fixNullClerkIds() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("healthcare");
    const usersCollection = db.collection("users");

    // Find all users with null clerkId
    const usersWithNullClerkId = await usersCollection
      .find({ clerkId: null })
      .toArray();
    console.log(`Found ${usersWithNullClerkId.length} users with null clerkId`);

    // Update each user with a unique clerkId based on their role
    for (const user of usersWithNullClerkId) {
      const uniqueClerkId = `${user.role}-${new ObjectId().toString()}`;

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { clerkId: uniqueClerkId } }
      );

      console.log(`Updated user ${user._id} with clerkId: ${uniqueClerkId}`);
    }

    console.log("All null clerkIds have been fixed");

    // Verify the clerkId index is sparse
    const indexes = await usersCollection.indexes();
    console.log("Current indexes:", indexes);

    // Check if clerkId index exists and is sparse
    const clerkIdIndex = indexes.find(
      (index) => index.key && index.key.clerkId
    );

    if (clerkIdIndex && !clerkIdIndex.sparse) {
      console.log("Dropping non-sparse clerkId index");
      await usersCollection.dropIndex("clerkId_1");

      console.log("Creating new sparse index for clerkId");
      await usersCollection.createIndex(
        { clerkId: 1 },
        { unique: true, sparse: true }
      );

      console.log("clerkId index updated to be sparse");
    } else if (clerkIdIndex) {
      console.log("clerkId index is already sparse");
    } else {
      console.log("Creating new sparse index for clerkId");
      await usersCollection.createIndex(
        { clerkId: 1 },
        { unique: true, sparse: true }
      );
      console.log("clerkId index created as sparse");
    }

    // Verify the updated indexes
    const updatedIndexes = await usersCollection.indexes();
    console.log("Updated indexes:", updatedIndexes);
  } catch (error) {
    console.error("Error fixing null clerkIds:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
fixNullClerkIds();
