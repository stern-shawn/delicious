const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  // const shawn = { name: 'Shawn', age: 26, cool: true };
  // res.json(shawn);
  // res.send('Hey! It works!');
  // res.send(req.query.age);
  // res.json(req.query);
  res.render('hello', Object.assign({
    name: 'Shawn',
    age: 26,
    cool: true,
    dog: req.query.dog,
  }));
});

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
})

module.exports = router;
