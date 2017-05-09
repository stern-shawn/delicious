const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const shawn = { name: 'Shawn', age: 26, cool: true };
  // res.json(shawn);
  // res.send('Hey! It works!');
  // res.send(req.query.age);
  res.json(req.query);
});

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
})

module.exports = router;
