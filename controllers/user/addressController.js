const validator = require("validator");
const { validationResult } = require("express-validator");
const User = require("../../models/userModel");
const mongoose = require('mongoose');
const { getCountryCodeFromIP } = require('../../utils/ipapi');

exports.getAddressPage = async (req, res) => {
    try {

        const user = await User.findOne({ _id: req.session.user._id }, { address: 1, name:1, image:1 });
        res.render('user/address', { addresses: user.address, old: {}, errors: {}, address: null,name:user.name,image:user.image });

    } catch (err) {
        console.log(err);
    }
}

exports.addAddress = async (req, res) => {
    try {
        const old = req.body;
        const errorsObj = {};
      

        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });

            return res.json({ errors: errorsObj, old });


        }
        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Get country code
        const countryCode = await getCountryCodeFromIP(ip);
        const user = await User.findOne({ _id: req.session.user._id });
       
        console.log("typeof getCountryCodeFromIP:", typeof getCountryCodeFromIP);
        const newAddress = {
            name: req.body.name,
            phoneNumber: countryCode + req.body.phone,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            landmark: req.body.landmark,
            altnumber: req.body.altnumber,
            type: req.body.addressType
        }
          
        user.address.push(newAddress);
        await user.save();

        return res.json({ address: newAddress });



    } catch (err) {
        console.log(err);
    }
}

exports.updateAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const errorsObj = {};

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const old = user.address.find(item => item._id.toString() === addressId);
        if (!old) return res.status(404).json({ message: "Address not found" });

        // ✅ Validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            return res.json({ errors: errorsObj, old });
        }

        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Get country code
        const countryCode = await getCountryCodeFromIP(ip);

        // Update the address
        const addressIndex = user.address.findIndex(address => address._id.toString() === addressId);
        user.address[addressIndex] = {
            ...user.address[addressIndex]._doc, // preserve _id
            name: req.body.name,
            phoneNumber: countryCode + req.body.phone,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            landmark: req.body.landmark,
            altnumber: req.body.altnumber,
            type: req.body.addressType
        };

        await user.save();

        // Return the updated address
        return res.json({ address: user.address[addressIndex] });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};


exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const result = await User.findByIdAndUpdate(
            req.session.user._id,
            { $pull: { address: { _id: addressId } } },
            { new: true }
        );
        res.json({ success: true, message: "Address deleted" });
    } catch (err) {
        console.log(err);
    }
}