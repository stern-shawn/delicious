const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

const User = mongoose.model('User');

// By default I wasn't able to login with my normal email (stern.shawn@gmail.com)
// yet sternshawn@gmail.com was working. Need to apply same sanitiziation as we do during register
exports.sanitizeLogin = (req, res, next) => {
  req.checkBody('email', 'That email is not valid!').isEmail().notEmpty();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });

  req.checkBody('password', 'Password cannot be blank!').notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('login', { title: 'Login', body: req.body, flashes: req.flash() });
    return; // If errors, stop this from running
  }
  next(); // No errors, proceed to login!
};

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!',
});

exports.logout = (req, res) => {
  // .logout() provided by passport middleware
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

// Check user status before allowing access to route
exports.isLoggedIn = (req, res, next) => {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    next(); // User logged in, carry on
  }
  req.flash('error', 'You must be logged in to add a store!');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // Normalize the email address...
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });

  // 1 - Does user exist?
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exists');
    return res.redirect('/login');
  }

  // 2 - Set reset tokens and expiry on that account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  // 3 - Send an email with the token!
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset',
  });
  req.flash('success', 'You have been emailed a password reset link.');

  // 4 - Redirect to the login page so they can use their new credentials
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // No user found, redirect them
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // Show the reset form
  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next(); // They match, keep going
  }
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // No user found, redirect them
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);

  // Now that password is reset, clear the token/expire timestamps and save to MongoDB
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();

  // We can call .login on a user object and PassportJS will log them in automatically
  await req.login(updatedUser);

  req.flash('success', 'Your password has been reset! You are now logged in!');
  res.redirect('/');
};
