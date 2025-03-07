import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Service from "../../../../models/Service";
import { withAuth } from "../../../../middleware/auth";

// Get a service by ID
async function getService(req, context) {
  try {
    await connectToDatabase();

    // Handle case where params might be undefined
    const params = context?.params || {};
    const serviceId = params.id;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service }, { status: 200 });
  } catch (error) {
    console.error("Get service error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a service (admin only)
async function updateService(req, context) {
  try {
    await connectToDatabase();

    // Handle case where params might be undefined
    const params = context?.params || {};
    const serviceId = params.id;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const { name, description, duration, price, category, isActive } =
      await req.json();

    // Validate required fields
    if (!name || !description || !duration || !price || !category) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const service = await Service.findById(serviceId);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if name is already used by another service
    if (name !== service.name) {
      const existingService = await Service.findOne({
        name,
        _id: { $ne: serviceId },
      });
      if (existingService) {
        return NextResponse.json(
          { error: "Service name is already in use" },
          { status: 409 }
        );
      }
    }

    // Update service
    service.name = name;
    service.description = description;
    service.duration = duration;
    service.price = price;
    service.category = category;

    if (isActive !== undefined) {
      service.isActive = isActive;
    }

    await service.save();

    return NextResponse.json(
      {
        message: "Service updated successfully",
        service,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a service (admin only)
async function deleteService(req, context) {
  try {
    await connectToDatabase();

    // Handle case where params might be undefined
    const params = context?.params || {};
    const serviceId = params.id;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const service = await Service.findById(serviceId);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete the service
    await Service.findByIdAndDelete(serviceId);

    return NextResponse.json(
      { message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getService, ["admin", "doctor", "patient"]);
export const PUT = withAuth(updateService, ["admin"]);
export const DELETE = withAuth(deleteService, ["admin"]);
