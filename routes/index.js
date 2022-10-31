var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://daydayday:oWietK22bBAOYcQgryRRBo8VBJRkGy3H6Jmw57kvzvc3MBlWqwx1QzapM8VXLkOfMIwno1ZzUvidf1gV9hcbpw==@daydayday.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@daydayday@';

var db;

MongoClient.connect(url, function (err, client) {
  db = client.db('bookingsDB');
  console.log("DB connected");
});


/* Handle the Form */
router.post('/bookings', async function (req, res) {

  // var response = {
  //   headers: req.headers,
  //   body: req.body
  // };

  // res.json(response);

  req.body.numTickets = parseInt(req.body.numTickets);

  let result = await db.collection("bookings").insertOne(req.body);
  res.status(201).json({ id: result.insertedId });

});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Expresso' });
});

router.get('/bookings', async function (req, res) {

  let results = await db.collection("bookings").find().toArray();

  res.render('bookings', { bookings: results });

});


router.get('/bookings/read/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOne({ _id: ObjectId(req.params.id) })

  if (result)
    res.render('booking', { booking: result });
  else
    res.status(404).send('Unable to find the requested resource!');

});

// Delete a single Booking
router.post('/bookings/delete/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking deleted.");

});

router.get('/bookings/update/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.render("update", { booking: result })

});

// Updating a single Booking 
router.post('/bookings/update/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  req.body.numTickets = parseInt(req.body.numTickets);

  var result = await db.collection("bookings").findOneAndReplace({ _id: ObjectId(req.params.id) },
    req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking updated.");

});

router.get('/bookings/searchs', async function (req, res) {

  var whereClause = {};

  if (req.query.email) whereClause.email = req.query.email;

  var parsedNumTickets = parseInt(req.query.numTickets);
  if (!isNaN(parsedNumTickets)) whereClause.numTickets = parsedNumTickets;

  let results = await db.collection("bookings").find({ numTickets: 2 }).toArray();

  return res.render('bookings', { bookings: results });

});

router.get('/bookings/search', async function (req, res) {

  var whereClause = {};

  if (req.query.email) whereClause.email = { $regex: req.query.email };

  var parsedNumTickets = parseInt(req.query.numTickets);
  if (!isNaN(parsedNumTickets)) whereClause.numTickets = parsedNumTickets;

  let results = await db.collection("bookings").find(whereClause).toArray();

  return res.render('bookings', { bookings: results });

});

/* Pagination */
router.get('/bookings/paginate', async function (req, res) {

  var perPage = Math.max(req.query.perPage, 2) || 2;

  var results = await db.collection("bookings").find({}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("bookings").count() / perPage);

  return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });

});


/* Ajax-Pagination */
router.get('/api/bookings', async function (req, res) {

  var perPage = Math.max(parseInt(req.query.perPage), 2) || 2;

  var results = await db.collection("bookings").find({}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("bookings").count() / perPage);

  // return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });

  return res.json({ bookings: results, pages: pages })

});

// Form for updating a single Booking 
router.get('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.json(result);

});

// Updating a single Booking - Ajax
router.put('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  req.body.numTickets = parseInt(req.body.numTickets);

  var result = await db.collection("bookings").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking updated.");

});

// Delete a single Booking
router.delete('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  return res.status(204).send();

});
// GroupBy
router.get('/api/bookings/aggregate/groupby', async function (req, res) {

  const pipeline = [
    { $match: { superhero: { $ne: null }}},
    { $match: { payment: "Paypal" } },
    { $group: { _id: "$superhero", count: { $sum: 1 } } }
  ];

  const results = await db.collection("bookings").aggregate(pipeline).toArray();

  return res.json(results);

});
module.exports = router;

