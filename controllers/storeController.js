exports.myMiddleware = (req, res, next) => {
  req.name = 'Shawn';
  res.cookie('name', 'Shawn is cool', { maxAge: 9001 });
  next();
}

exports.homePage = (req, res) => {
  // Render the index.pug template, and pass a title of 'Index'
  console.log(req.name);
  res.render('index', {
    title: 'Index',
  })
}