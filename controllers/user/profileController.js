const validator = require("validator");
const { validationResult } = require("express-validator");
const User = require("../../models/userModel");
const generateOTP = require('../../utils/generateOTP');
const sendOTPMail = require('../../utils/sendOTPMail');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

exports.getProfilePage = (req, res) => {
    const user = req.session.user;
    res.render('user/profile', { user, errors: {}, old: {} });
}

exports.updateProfile = async (req, res) => {

    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();
    const profileImage = req.file?.path || req.body.profileImage;
    const oldMail = req.session.user.email;
    const errorsObj = {};
    const old = { name, email, phone };
    try {

        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            return res.render("user/profile", { errors: errorsObj, old, user: req.session.user });
        }

        if (email === req.session.user.email) {
            const updateUser = await User.findOneAndUpdate({
                email: req.session.user.email
            },
                { name: name, mobile: phone, image: profileImage },
                { new: true }
            );
            req.session.user = updateUser;
            res.redirect('/profile');
        }
        else {
            req.session.name = name;
            req.session.phone = phone;
            res.redirect('/changeMail');
        }
    } catch (err) {
        console.log(err);
    }


}

exports.confirmMail = async (req, res) => {
    try {

        const email = req.body.email;
        const oldUser = await User.findOne({ email: email });
        if (oldUser) {
            req.flash('error', 'This mail already registered.Try another One.');
            res.redirect('/changeMail');
        }
        const OTP = generateOTP(); console.log(OTP);
        await sendOTPMail(email, OTP);
        req.session.tempUser = {
            oldMail: req.session.user.email,
            email: email,
            OTP,
            otpCreatedAt: Date.now()
        };
        console.log(email);
        res.render('user/otp-mailChange', { email });
    } catch (err) {
        console.log(err);
    }
}

exports.getOtpForMail = (req, res) => {
    res.render('user/otp-mailChange', { remainingTime: 60 });
}

exports.resendOtp = async (req, res) => {
    try {
        const sessionUser = req.session.tempUser;
        console.log(sessionUser);
        if (!sessionUser) {
            return res.render("user/confirmMail", { error: "error ,  Session expired. Please sign up again." });
        }

        const OTP = generateOTP();
        const email = sessionUser.email;
        await sendOTPMail(email, OTP);


        req.session.tempUser.OTP = OTP;
        req.session.tempUser.otpCreatedAt = Date.now();

        req.flash("success", "A new OTP has been sent to your email.");
        return res.render("user/otp-mailChange", { email });

    } catch (err) {
        console.error("Resend OTP error:", err);
        req.flash("error", "Failed to resend OTP. Try again.");
        return res.redirect("/confirmMail");
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const old = req.session.tempUser.oldMail;
        const email = req.session.tempUser.email;
        const enteredOtp = req.body.otp?.join('');
        const sessionUser = req.session.tempUser;
        if (!sessionUser) {
            return res.render("user/confirmMail", {
                error: "Session expired. Please try again."
            });

        }
        const otpAge = Date.now() - sessionUser.otpCreatedAt;
        if (otpAge > 60 * 1000) {
            req.session.tempUser = null;
            return res.render("user/confirmMail", {
                error: "OTP expired. Please sign up again.",

            });
        }

        if (enteredOtp !== sessionUser.OTP.toString()) {
            console.log("incorrect otp");
            return res.render("user/otp-mailChange", {
                error: "Incorrect OTP. Please try again.",
                email,
                remainingTime: 60 - Math.floor(otpAge / 1000)
            });
        }

        const user = await User.findOneAndUpdate({ email: old }, { email: email, name: req.session.name, mobile: req.session.phone });
        req.session.name = null;
        req.session.phone = null;
        res.redirect('/profile');

    }
    catch (err) {
        console.log(err);
    }
}

exports.getChangeMailPage = (req, res) => {
    res.render('user/confirmMail');
}

//=== change password page ===//
exports.getUpdatePasswordPage = (req, res) => {
    res.render('user/updatePassword', { errors: {} });
};

exports.updatePassword = async (req, res) => {


    try {

        let old = req.body.old.trim();
        let password = req.body.password.trim();
        let cpassword = req.body.cpassword.trim();
        const errorsObj = {};
        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            return res.render("user/updatePassword", { errors: errorsObj });
        }

        const isMatch = await bcrypt.compare(old, req.session.user.password);
        if (!isMatch) {
            req.flash('error', 'Old password doesnot match');
            return res.redirect('/updatePassword');
        }
        else if (await bcrypt.compare(password, req.session.user.password)) {
            req.flash('error', 'Current password is same as your new password');
            return res.redirect('/updatePassword');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        await User.updateOne({ email: req.session.user.email }, { password: hashedPassword });
        return res.redirect('/profile');

    } catch (err) {
        console.log(err);
    }
}








