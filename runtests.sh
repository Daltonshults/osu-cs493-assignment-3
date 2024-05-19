#!/bin/bash

cd tests
newman run -e api_tests.postman_environment.json api_tests.postman_collection.json

cd ../
curl -X POST "http://localhost:8000/users" -H "Content-Type: application/json" -d '{"name": "Jimmothy Williams", "email": "jimmothy@williams.com", "password": "hunter2", "admin": true}'

# Extract the token using sed
RESPONSE=$(curl -s -X POST "http://localhost:8000/users/login" -H "Content-Type: application/json" -d '{"email": "jimmothy@williams.com", "password": "hunter2"}')
TOKEN=$(echo $RESPONSE | sed -n 's/.*"Token":"\([^"]*\)".*/\1/p')
echo "TOKEN"
echo $TOKEN

# Require a token from the above value
echo -e "\n\nShould Pass GET BUSINESS 17"
curl -X GET "http://localhost:8000/users/17/businesses" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Fail GET BUSINESS 1"
curl -X GET "http://localhost:8000/users/1/businesses" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Pass GET USER 17 PHOTOS"
curl -X GET "http://localhost:8000/users/17/photos" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Fail GET USER 1 PHOTOS"
curl -X GET "http://localhost:8000/users/1/photos" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Pass GET USER 17 REVIEWS"
curl -X GET "http://localhost:8000/users/17/reviews" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Fail GET USER 1 REVIEWS"
curl -X GET "http://localhost:8000/users/1/reviews" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Pass POST A BUSINESS FOR OWNER 17"
curl -X POST "http://localhost:8000/businesses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "ownerId": 17,
        "name": "New Business",
        "address": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip": "12345",
        "phone": "123-456-7890",
        "category": "Retail",
        "subcategory": "Books",
        "website": "www.newbusiness.com",
        "email": "info@newbusiness.com"
    }'

echo -e "\n\nShould Pass PATCHING BUSINESS 19"
curl -X PATCH "http://localhost:8000/businesses/19" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "ownerId": 17,
        "name": "New NAME!",
        "address": "NEW",
        "city": "NEW",
        "state": "NW",
        "zip": "54321",
        "phone": "098-765-4321",
        "category": "NEW",
        "subcategory": "NEW",
        "website": "www.NEW.com",
        "email": "NEW@NEW.com"
    }'

echo -e "\n\nShould Fail PATCHING BUSINESS 1"
curl -X PATCH "http://localhost:8000/businesses/1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "ownerId": 17,
        "name": "New NAME!",
        "address": "NEW",
        "city": "NEW",
        "state": "NW",
        "zip": "54321",
        "phone": "098-765-4321",
        "category": "NEW",
        "subcategory": "NEW",
        "website": "www.NEW.com",
        "email": "NEW@NEW.com"
    }'


echo -e "\n\nShould Fail POST BUSINESS WITH OWNER 1"
curl -X POST "http://localhost:8000/businesses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "ownerId": 1,
        "name": "New Business",
        "address": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip": "12345",
        "phone": "123-456-7890",
        "category": "Retail",
        "subcategory": "Books",
        "website": "www.newbusiness.com",
        "email": "info@newbusiness.com"
    }'

echo -e "\n\nShould Pass POST PHOTO FOR USER 17"
curl -X POST "http://localhost:8000/photos" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 17,
    "caption": "This is a new photo",
    "businessId": 1
    }'

echo -e "\n\nShould Fail POST PHOTO USER 1"
curl -X POST "http://localhost:8000/photos" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 1,
    "caption": "This is a new photo",
    "businessId": 1
    }'
echo -e "\n\nShould Pass PATCH PHOTO 11"
curl -X PATCH "http://localhost:8000/photos/11" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 17,
    "caption": "NEW_CAPTION"
    }'

echo -e "\n\nShould Fail PATCH PHOTO 1"
curl -X PATCH "http://localhost:8000/photos/12" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 17,
    "caption": "NEW_CAPTION"
    }'

echo -e "\n\nShould Pass POST REVIEW USER 17"
curl -X POST "http://localhost:8000/reviews" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 17,
    "dollars": 1,
    "stars": 1,
    "review": "This is a great business!",
    "businessId": 1
    }'

echo -e "\n\nShould Fail POST REVIEW USER 1"   
curl -X POST "http://localhost:8000/reviews" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 1,
    "dollars": 1,
    "stars": 1,
    "review": "This is a great business!",
    "businessId": 1
    }'


echo -e "\n\nShould Pass GET USER 17 INFO"
curl -X GET "http://localhost:8000/users/17" -H "Authorization: Bearer $TOKEN"
echo -e "\n\nShould Fail GET USER 1 INFO"  
curl -X GET "http://localhost:8000/users/1" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nMAKING USER ADMIN\n\n"
docker exec osu-cs493-assignment-3-db-1 bash -c "
mysql -u root -phunter2 -e \"
use businesses;
UPDATE users SET admin = 1 WHERE name = 'Jimmothy Williams';
\""

sleep 2

echo -e "\n\nShould Pass GET USER 17 AS ADMIN"
curl -X GET "http://localhost:8000/users/17" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Pass GET USER 1 AS ADMIN"  
curl -X GET "http://localhost:8000/users/1" -H "Authorization: Bearer $TOKEN"


echo -e "\n\nShould Pass PATCH REVIEW USER 1 AS ADMIN"   
curl -X PATCH "http://localhost:8000/reviews/1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 1,
    "dollars": 1,
    "stars": 1,
    "review": "This is a great business!",
    "businessId": 1
    }'

echo -e "\n\nShould Pass PATCH PHOTO 1 as ADMIN"
curl -X PATCH "http://localhost:8000/photos/1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "userId": 1,
    "caption": "NEW_CAPTION"
    }'

echo -e "\n\nShould Pass PATCHING BUSINESS 1 as ADMIN"
curl -X PATCH "http://localhost:8000/businesses/1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "ownerId": 1,
        "name": "New NAME!",
        "address": "NEW",
        "city": "NEW",
        "state": "NW",
        "zip": "54321",
        "phone": "098-765-4321",
        "category": "NEW",
        "subcategory": "NEW",
        "website": "www.NEW.com",
        "email": "NEW@NEW.com"
    }'

echo -e "\n\nShould Pass GET BUSINESS 1 as ADMIN"
curl -X GET "http://localhost:8000/users/1/businesses" -H "Authorization: Bearer $TOKEN"


echo -e "\n\nShould Pass GET USER 1 PHOTOS as ADMIN"
curl -X GET "http://localhost:8000/users/1/photos" -H "Authorization: Bearer $TOKEN"

echo -e "\n\nShould Pass GET USER 1 REVIEWS as ADMIN"
curl -X GET "http://localhost:8000/users/1/reviews" -H "Authorization: Bearer $TOKEN"