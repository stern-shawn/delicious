exports.homePage = (req, res) => {
  // Render the index.pug template, and pass a title of 'Index'
  res.render('index', {
    title: 'Index',
  })
}