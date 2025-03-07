const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection string
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

async function fixDoctorSlotsIndex() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("healthcare");
    const doctorSlotsCollection = db.collection("doctorslots");

    // Get all indexes
    const indexes = await doctorSlotsCollection.indexes();
    console.log("Current indexes:", indexes);

    // Check if the problematic index exists
    const problematicIndex = indexes.find(
      (index) => index.key && index.key.doctor_id === 1 && index.key.date === 1
    );

    if (problematicIndex) {
      console.log("Found problematic index, dropping it...");
      await doctorSlotsCollection.dropIndex("doctor_id_1_date_1");
      console.log("Problematic index dropped successfully");
    } else {
      console.log("Problematic index not found");
    }

    // Update all documents to ensure they have a date field set to null
    const updateResult = await doctorSlotsCollection.updateMany(
      { date: { $exists: false } },
      { $set: { date: null } }
    );

    console.log(
      `Updated ${updateResult.modifiedCount} documents to have a date field`
    );

    // Create the correct index
    await doctorSlotsCollection.createIndex(
      { doctor_id: 1, day: 1, start_time: 1 },
      { unique: true }
    );
    console.log("Created correct index on doctor_id, day, and start_time");

    // Verify the updated indexes
    const updatedIndexes = await doctorSlotsCollection.indexes();
    console.log("Updated indexes:", updatedIndexes);

    console.log("DoctorSlots index fix completed successfully");
  } catch (error) {
    console.error("Error fixing DoctorSlots index:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
fixDoctorSlotsIndex();
