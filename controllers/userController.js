const mongoose = require('mongoose');
const promisify = require('es6-promisify');

const User = mongoose.model('User');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  // Helper method supplied by expressValidator middleware
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.sanitizeBody('name');

  req.checkBody('email', 'That email is not valid!').isEmail().notEmpty();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });

  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match!').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return; // If errors, stop this from running
  }
  next(); // No errors, proceed to saving user!
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // promisify(method, object the method is bound to)
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  res.send('Me worky!');
  next(); // Continue on to authController.login
};
