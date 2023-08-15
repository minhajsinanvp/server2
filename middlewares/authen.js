const {expressjwt}= require("express-jwt");
const Post = require("../models/postSchema");
const User = require("../models/userSchema");

module.exports.checkingToken = () => {
    // console.log("checking token is called");
    return expressjwt({
        secret: process.env.jwt_secret,
        algorithms: ["HS256"]
    });
};
 

module.exports.canEditDeletePost = async(req,res,next) =>{


    try {

        const post = await Post.findById(req.params.id);

        if(req.auth._id != post.userId){
            return res.json("Unauthorized for editing the post")
        }else{ 
            next()
        }
        // console.log("Edit ---------->",post);
        
        
    } catch (error) {
        console.log(error);
    }

}



module.exports.addingFollower = async(req,res,next) =>{

    try {

        const addingFollowerUser = await User.findByIdAndUpdate(req.body._id,{$addToSet:{followers:req.auth_id }}, {new: true})


        next()
        // console.log(req.auth._id);
        
    } catch (error) {
        console.log(error);
    }

} 



module.exports.removeFollower = async(req,res,next)=>{
    try{
            const removeFollowerUser = await User.findByIdAndUpdate(req.body._id,{$pull : {followers : req.auth._id}},{new: true})
            next()
    }
    catch(error){
        console.log(error);
    }
}



module.exports.isAdmin = async(req,res,next)=>{

    const user = await User.findById(req.auth._id);

    if(user.role !=="admin"){
        return res.status(400).send("unAuthorized error")
    }

    else{
        next ()
    }
}