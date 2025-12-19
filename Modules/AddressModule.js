import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true]
    },

    address1: {
      type: String,
      required: [true],
      trim: true,
      minlength: [5]
    },

    address2: {
      type: String,
      trim: true,
      minlength: [3]
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      match: [/^[a-zA-Z ]+$/]
    },

    state: {
      type: String,
      required: [true],
      trim: true
    },

    country: {
      type: String,
      required: [true],
      default: "India"
    },

   postalCode: {
  type: String,
  required: [true],
  match: [/^[0-9]{6}$/]
}
  },
  {
    timestamps: true
  }
);

const Address = mongoose.model("Address", addressSchema);
export default Address;
