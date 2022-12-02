var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://daydayday:oWietK22bBAOYcQgryRRBo8VBJRkGy3H6Jmw57kvzvc3MBlWqwx1QzapM8VXLkOfMIwno1ZzUvidf1gV9hcbpw==@daydayday.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@daydayday@';

//==========================Lab08==========================
const auth = require("../middlewares/auth");
var jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

var db;

MongoClient.connect(url, function (err, client) {
  db = client.db('bookingsDB');
  console.log("DB connected");
});


/* Handle the Form*/

router.post('/api/bookings', async function (req, res) {

  // var response = {
  //   headers: req.headers,
  //   body: req.body
  // };

  // res.json(response);

  //req.body.numTickets = parseInt(req.body.numTickets);
  /*
  if(req.body.token)
  {
    let result = await db.collection("user").insertOne(req.body);
  }
  else
  {
    let result = await db.collection("inventory").insertOne(req.body);
  }
  */
 let collection = "";
  if(req.body.token == undefined)
  {
    collection = "inventory";
  }
  else
  {
    collection = "user";
  }
  let result = await db.collection(collection).insertOne(req.body);
  res.status(201).json({ id: result.insertedId });

});
 

/* Handle the Form 
router.post('/api/bookings', async function (req, res) {

  req.body.numTickets = parseInt(req.body.numTickets);

  let result = await db.collection("bookings").insertOne(req.body);

  for (var i = 0; i < req.body.numTickets; i++) {

    await db.collection("tickets").insertOne({ bookingId: result.insertedId, uuid: uuidv4() });
  }

  res.status(201).json({ id: result.insertedId });

});
*/
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Expresso' });
});

router.get('/bookings', async function (req, res) {

  let results = await db.collection("inventory").countDocuments({ type: "book" }, {}).find().toArray();

  res.render('bookings', { bookings: results });

});


router.get('/bookings/read/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) })

  if (result)
    res.render('booking', { booking: result });
  else
    res.status(404).send('Unable to find the requested resource!');

});

// Delete a single Booking
router.post('/bookings/delete/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("inventory").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking deleted.");

});

router.get('api/bookings/update/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.render("update", { booking: result })

});

// Updating a single Booking 
router.post('/bookings/update/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  req.body.numTickets = parseInt(req.body.numTickets);

  var result = await db.collection("inventory").findOneAndReplace({ _id: ObjectId(req.params.id) },
    req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking updated.");

});
/*
router.get('/bookings/searchs', async function (req, res) {

  var whereClause = {};

  if (req.query.email) whereClause.email = req.query.email;

  var parsedNumTickets = parseInt(req.query.numTickets);
  if (!isNaN(parsedNumTickets)) whereClause.numTickets = parsedNumTickets;

  let results = await db.collection("inventory").find({ numTickets: 2 }).toArray();

  return res.render('bookings', { bookings: results });

});
*/
/* Pagination */
router.get('/bookings/paginate', async function (req, res) {

  var perPage = Math.max(req.query.perPage, 2) || 2;

  var results = await db.collection("inventory").find({}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("inventory").count() / perPage);

  return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });

});


/* Ajax-Pagination */
router.get('/api/bookings', async function (req, res) {

  var whereClause = {};
  var perPage = Math.max(parseInt(req.query.perPage), 2) || 2;
  let rq = req.query;
  let type = "";
  let page = 1;
  if (rq.page) page = rq.page;
  if (rq.type)
  {
    whereClause.type = rq.type;
    type = rq.type;
  }
  var results = await db.collection("inventory").find(whereClause, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("inventory").find(whereClause).count() / perPage);
  console.log(type);
  // return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });
  return res.json({ bookings: results, pages: pages, page: page, type: type })

});

// Form for updating a single Booking 
router.get('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.json(result);

});

// Updating a single Booking - Ajax
router.put('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  //req.body.numTickets = parseInt(req.body.numTickets);

  var result = await db.collection("inventory").findOneAndReplace(
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

  let result = await db.collection("inventory").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  return res.status(204).send();

});
// GroupBy
router.get('/api/bookings/aggregate/groupby', async function (req, res) {

  const pipeline = [
    { $match: { type: { $ne: null } } },
    //{ $match: { payment: "Paypal" } },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ];

  const results = await db.collection("inventory").aggregate(pipeline).toArray();

  return res.json(results);

});

router.get('/api/search', async function (req, res) {

  var whereClause = {};
  var perPage = Math.max(parseInt(req.query.perPage), 2) || 2;
  if (req.query.title) whereClause.title = { $regex: req.query.title, $options:'i' };
  var results = await db.collection("inventory").find(whereClause, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();
  console.log(req.query.title);
  console.log(results);
  var pages = Math.ceil(await db.collection("inventory").find(whereClause).count() / perPage);

  return res.json({ bookings: results, pages: pages })

});


//==========================Lab08==========================
router.get("/api/bookings/:id/tickets", async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var pipelines = [
    { $match: { _id: req.params.id } },
    {
      $lookup:
      {
        from: "tickets",
        localField: "_id",
        foreignField: "bookingId",
        as: "tickets"
      }
    }
  ]

  let results = await db.collection("bookings").aggregate(pipelines).toArray();

  if (results.length > 0)
    return res.json(results[0]);
  else
    return res.status(404).send("Not Found");

});

router.post("/api/login", async function (req, res) {

  var account = 
  await db.collection("user").
  findOne({
    email: req.body.email,
    password: req.body.password});
    
  if(account) {

    const user = {};

    const token = jwt.sign(
      { user_id: req.body.email, user_type: account.userType}, 
      "process.env.TOKEN_KEY", 
      { expiresIn: "2h",}
    );
    user.token = token;
    var tmp = await db.collection("user").updateOne({_id: ObjectId(account._id)}, { $set: {token: token}});

    return res.json(user);

  } else {
    res.status(401).send("Invalid Credentials");

  }

});
/* Ajax-Pagination */
router.get('/api/users' ,async function (req, res) {

  var whereClause = {};
  var perPage = Math.max(parseInt(req.query.perPage), 2) || 2;
  let rq = req.query;
  let type = "user";
  let page = 1;
  if (rq.page) page = rq.page;
  var results = await db.collection("user").find(whereClause, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("user").find(whereClause).count() / perPage);
  console.log(type);
  // return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });
  return res.json({ bookings: results, pages: pages, page: page, type: type })

});
// Form for updating a single Booking 
router.get('/api/user/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("user").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.json(result);

});
// Updating a single Booking - Ajax
router.put('/api/user/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var result = await db.collection("user").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("updated.");

});

// Delete a single Booking
router.delete('/api/user/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("user").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  return res.status(204).send();

});//hi
// Consume - Ajax
router.put('/api/consume/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var replace = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) });
  if (replace.amount > 0)
  {
    replace.amount --;
  }
  var result = await db.collection("inventory").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, replace
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking updated.");

});
module.exports = router;

