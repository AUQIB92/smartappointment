import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import Service from "../../../models/Service";
import { withAuth } from "../../../middleware/auth";

// Get all services
async function getServices(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    let query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const services = await Service.find(query).sort({ category: 1, name: 1 });

    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a new service (admin only)
async function createService(req) {
  try {
    await connectToDatabase();

    const { name, description, duration, price, category } = await req.json();

    // Validate required fields
    if (!name || !description || !duration || !price || !category) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if service already exists
    const existingService = await Service.findOne({ name });

    if (existingService) {
      return NextResponse.json(
        { error: "Service with this name already exists" },
        { status: 409 }
      );
    }

    // Create new service
    const newService = new Service({
      name,
      description,
      duration,
      price,
      category,
    });

    await newService.save();

    return NextResponse.json(
      {
        message: "Service added successfully",
        service: newService,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add service error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getServices, ["admin", "doctor", "patient"]);
export const POST = withAuth(createService, ["admin"]);
