import dbConnect from "../lib/mongodb";
import User from "../models/User";

const createSampleUser = async () => {
  try {
    await dbConnect();
    console.log("Connected to MongoDB");

    // Check if user already exists
    const existingUser = await User.findOne({ email: "john.doe@example.com" });

    if (existingUser) {
      console.log("Sample user already exists:", existingUser.email);
      return;
    }

    // Create sample user
    const sampleUser = new User({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "81234567890",
      countryCode: "+62",
      password: "hashedpassword123", // In real app, hash this
      accessRole: "user",
      memberRole: "premium",
      spendedMoney: 1500000,
      diskon: 5,
      isVerified: true,
    });

    await sampleUser.save();
    console.log("Sample user created:", sampleUser.email);
  } catch (error) {
    console.error("Error creating sample user:", error);
  }
};

export default createSampleUser;
