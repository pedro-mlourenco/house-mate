# house-mate

 # Test Summary

## Auth API
- ✅ **should register new user** 
- ✅ **should login user and return token**
- ✅ **should logout user successfully** 
- ✅ **should get user profile** 
- ✅ **should not register user with existing email**
- ✅ **should update user profile** 
- ✅ **should delete user account** 
- ✅ **should not login with invalid credentials** 
- ✅ **should register admin user** 

## Items API
- ✅ **no token, should not authenticate** 
- ✅ **should get specific store** 
- ✅ **should create new item** 
- ✅ **should get specific item** 
- ✅ **should update item** 
- ✅ **should delete item**
- ✅ **should get all items**  

## Stores API
- ✅ **no token, should not authenticate** 
- ✅ **wrong token, should not authenticate** 
- ✅ **should create new store** 
- ✅ **should get specific store** 
- ✅ **should update store** 
- ✅ **should delete store** 
- ✅ **should not create store without required fields** 
- ✅ **should get all stores** 

# Added Swagger documentation
- **Can be accessed by launching npm run dev and then on the enpoint /api-docs**