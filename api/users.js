const { Router } = require('express')

const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { User } = require('../models/user')
const bcrypt = require('bcryptjs');
const { generateAuthToken, matchingUserIds} = require('../lib/tokens');

const router = Router()


// In addition, you should create a GET /users/{userId} API endpoint that returns information about the specified user (excluding their password).

/*
 * Route to create a new user 
 */
router.post('/', async function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  if (name && email && password) {
    try {
      console.log(`Name: ${name}\nEmail: ${email}\nPassword: ${password}`)
      const newUser = await User.create({name: name, email: email, password: password});
      res.status(201).json({"User": "Created"});
    } catch (error) {
      res.status(500).json({"Error": `There was an error creating the user ${error}`}); // would not keep error in here for production
    }
  } else {
    res.status(400).json({"Error": "Missing name, email, or password"});
  }
});

/*
*  Route to get a user's information
*/
router.get('/:userId', matchingUserIds, async function (req, res) {
  const tokenUser = req.user;
  const urlUser = Number(req.params.userId);

  if (urlUser !== Number(tokenUser.userId) && Number(tokenUser.admin) !== 1) {
    return res.status(403).json({"Error": "User not authorized to view this information"});
  }

  try {
    const information = await User.findOne({ where: { userId: String(urlUser) },
                                              attributes: {exclude: ['password']}});
    return res.status(200).json({ "user": information });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ "Error": "An error occurred while fetching the user" });
  }
});

/*
* Route to log in a user
*/ 
router.post('/login', async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  console.log(`Password: ${password}`);

  if (email && password) {
    try {
      const user = await User.findOne({ where: { email: email}});
      
      console.log(`User: ${user}`);
      console.log("\nUser password: ", user.password);
      

      const authenticated = await bcrypt.compare(password, user.password);
      
      if (authenticated) {
        const token = generateAuthToken(user.userId);
        res.status(200).json({"Token": token});
      } else { res.status(401).json({"Error": "Invalid email or password"});
      
      }
    } catch (error) {
      res.status(500).json({"Error": `There was an error logging in the user ${error}`});
    }
  } else {
    res.status(400).json({"Error": "Missing email or password"});
  }
});


/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', matchingUserIds, async function (req, res) {
  const userId = req.params.userId
  const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
  res.status(200).json({
    businesses: userBusinesses
  })
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews', matchingUserIds, async function (req, res) {
  const userId = req.params.userId
  const userReviews = await Review.findAll({ where: { userId: userId }})
  res.status(200).json({
    reviews: userReviews
  })
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', matchingUserIds, async function (req, res) {
  const userId = req.params.userId
  const userPhotos = await Photo.findAll({ where: { userId: userId }})
  res.status(200).json({
    photos: userPhotos
  })
})

module.exports = router
