import Address from "../Modules/AddressModule.js";

import pincodeLookup from "india-pincode-lookup";

export const createAddress = async (req, res) => {
  try {
    const { address1, address2, city, state, country, postalCode } = req.body;

    // Validate pincode using package
    const pincodeData = pincodeLookup.lookup(postalCode);

    if (!pincodeData || pincodeData.length === 0) {
      return res.status(400).json({ message: "Invalid Indian postal code" });
    }

    const pin = pincodeData[0];

    const address = new Address({
      userId: req.user.id,
      address1,
      address2,
      city: city || pin.districtName,
      state: state || pin.stateName,
      country: country || "India",
      postalCode
    });

    await address.save();

    res.status(201).json({
      message: "Address added successfully",
      autoFilled: {
        city: pin.districtName,
        state: pin.stateName
      }
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    if (req.body.postalCode) {
      const pincodeData = pincodeLookup.lookup(req.body.postalCode);

      if (!pincodeData || pincodeData.length === 0) {
        return res.status(400).json({ message: "Invalid Indian postal code" });
      }

      req.body.city = pincodeData[0].districtName;
      req.body.state = pincodeData[0].stateName;
      req.body.country = "India";
    }

    await Address.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Address updated successfully" });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getAddressByUser = async (req, res) => {
  try {
    const address = await Address.find({ userId: req.user.id });
    res.status(200).json({ data: address });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await Address.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
