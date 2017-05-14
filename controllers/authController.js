const passport = require('passport');

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
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};
