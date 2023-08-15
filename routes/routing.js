const express = require('express');
const formidable = require("express-formidable");

const { register, login, loggedUser, passwordRecovery, creatPost, imageUpload, userPosts, editPost, updatePost, deletePost, profileUpdate, profileImage, findPeople, followRequest, followingList, unfollowRequest, likePost, unLikePost, removeComment, addComment, getPostById, deleteComment, CountPost, findUser, userProfile, homePosts, getPost } = require('../controller/userController');
const { checkingToken, canEditDeletePost, addingFollower, removeFollower, isAdmin } = require('../middlewares/authen');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logged-user", checkingToken(), loggedUser); // Apply checkingToken middleware here
router.post("/forgotpassword", passwordRecovery);
router.post("/create-post", checkingToken(), creatPost); // Apply checkingToken middleware here
router.post("/image-upload", checkingToken(), formidable({ maxFileSize: 5 * 1024 * 1024 }), imageUpload); // Apply checkingToken middleware here
router.get("/get-post/:page", checkingToken(), userPosts)


router.get("/edit-post/:id", checkingToken(), editPost)
router.put("/update-post/:id", checkingToken(), canEditDeletePost, updatePost)
router.delete("/delete-post/:id", checkingToken(), canEditDeletePost, deletePost)


router.post("/profile-update", checkingToken(), profileUpdate)
// router.post("/profile-upload",checkingToken(),profileImage)

router.get("/find-people", checkingToken(), findPeople)
router.put('/follow-request', checkingToken(), addingFollower, followRequest)
router.get("/following-list", checkingToken(), followingList)
router.put("/user-unfollow",checkingToken(),removeFollower,unfollowRequest)

router.put("/like-post", checkingToken(),likePost)
router.put("/unlike-post", checkingToken(),unLikePost)

router.put("/add-comment",checkingToken(),addComment)
router.delete("/remove-comment", checkingToken(), removeComment)
router.get("/user-post/:_id", checkingToken(), getPostById);


router.put("/delete-comment",checkingToken(),deleteComment)
router.get("/total-post",checkingToken(), CountPost)

router.get("/find-user/:user",findUser)
router.get("/user/:name",userProfile)


router.get("/home-posts", homePosts)
router.get("/post/:id", getPost)


router.delete("/admin/delete-post/:id", checkingToken(), isAdmin, deletePost)

module.exports = router;
