const jwt = require("jsonwebtoken");
const { User } = require('../models/user'); 
const { Business } = require('../models/business'); 
const { Photo } = require('../models/photo'); 
const { Review, ReviewClientFields } = require('../models/review'); 

require('dotenv').config();

const secret_key = process.env.SECRET_KEY;

function generateAuthToken(user_id) {
	const payload = { "sub": user_id }; // Has to have sub
    console.log(`Secret key: ${secret_key}`);
	return jwt.sign(payload, secret_key, {"expiresIn": "24h" });
}

async function matchingUserIds (req, res, next) {
    const id = Number(req.params.userId);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log(`Token: ${token}`);

    if (token == null) return res.sendStatus(401); // if there isn't any token

    await jwt.verify(token, secret_key, async (err, payload) => {

        const userId = payload.sub;
        console.log(`userId: ${userId}`);

        const dbUser = await User.findOne({ where: { userId: userId }});

        console.log(`userId: ${id}\ndbUserID: ${dbUser.userId}`);
        
        if (!dbUser) {
            console.log("No user found");
             return res.sendStatus(403);
        } else if (Number(dbUser.admin) === 1) {
            req.user = id;
            next();
            return
        } else if (dbUser.userId !== id) {
            console.log("User ids do not match");
            return res.sendStatus(403);
        } else {
            req.user = dbUser;
            next();
        }
    });

}

function authorizeUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    let id = null;
    if (req.body.ownerId && !isNaN(req.body.ownerId)) {
        id = Number(req.body.ownerId);
    } else if (req.body.userId && !isNaN(req.body.userId)) {
        id = Number(req.body.userId);
    } else return res.sendStatus(400);
    console.log(`\nID: ${id}\n`);

    console.log(typeof(id));

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, secret_key, async (err, payload) => {
        const userId = payload.sub;
        const dbUser = await User.findOne({ where: { userId: userId }});

        if (!dbUser) {
            return res.sendStatus(403);
        }

        if (Number(dbUser.admin) == 1) {
            req.user = dbUser;
            next();
            return;
        }
        console.log(` DB USER ID: ${dbUser.userId}`);
        if (id !== dbUser.userId) {
            return res.sendStatus(403);
        }

        req.user = dbUser;

        next();
    });

}

function authorizeAndSame(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];


    let id = null;
    if (req.body.ownerId && !isNaN(req.body.ownerId)) {
        id = Number(req.body.ownerId);
    } else if (req.body.userId && !isNaN(req.body.userId)) {
        id = Number(req.body.userId);
    } else return res.sendStatus(400);
    console.log(`\nID: ${id}\n`);

    console.log(typeof(id));

    if (token == null) return res.sendStatus(401); // if there isn't any token
    const business_reg = /\bbusinesses\b/;
    const photo_reg = /\bphotos\b/;
    const review_reg = /\breviews\b/;
    
    console.log(`\n\n\n\n\nreq.ogurl: ${req.originalUrl}`);


    jwt.verify(token, secret_key, async (err, payload) => {
        const userId = payload.sub;
        const dbUser = await User.findOne({ where: { userId: userId }});
        if (business_reg.test(req.originalUrl)) {
            const business = await Business.findOne( {where: { id: req.params.businessId}});
        
            if( !business ) {
                res.sendStatus(403);
                return
            }

            if (Number(business.ownerId) == Number(userId) || Number(dbUser.admin) == 1) {
                req.business = business;
                req.user = dbUser;
                next();
                return
            } else {
                return res.status(403).send({error: "Wrong business"});
            }

        } else if (photo_reg.test(req.originalUrl)) {
            const photo = await Photo.findOne({where: {id: Number(req.params.photoId)}})

            if (!photo) {
                res.sendStatus(403);
                return
            }

            if (Number(photo.userId) == Number(userId) || Number(dbUser.admin) == 1) {
                req.photo = photo;
                req.user = dbUser;
                next();
                return
            } else {
                return res.status(403).send({error: "Wrong photo"});
            }
        } else if (review_reg.test(req.originalUrl)) {
            const review = await Review.findOne({where: {id: Number(req.params.reviewId)}});
            req.review = review;
            if (!review) {
                res.sendStatus(403);
                return
            }

            if (Number(review.userId) == Number(userId) || Number(dbUser.admin) == 1) {
                req.review = review;
                req.user = dbUser;
                next();
                return
            } else {
                return res.status(403).send({error: "Wrong review"});
            }
        } else {
            res.sendStatus(404)
            return
        }
    });
}

module.exports = {
    generateAuthToken,
    matchingUserIds,
    authorizeUser,
    authorizeAndSame
}