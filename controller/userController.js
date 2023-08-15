const { passwordHash, comparePassword } = require("../helpers/hasPassword");
const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const jwt = require('jsonwebtoken');
const { expressjwt } = require("express-jwt");
const cloudinary = require('cloudinary');
const { post } = require("../routes/routing");
const { generateUsername } = require("unique-username-generator");
const { json } = require("express");

cloudinary.config({
    cloud_name: process.env.cloudinaryname,
    api_key: process.env.cloudinarykey,
    api_secret: process.env.cloudinarysecret

})


module.exports.register = async (req, res) => {
    // console.log("Register Endpoint ==>", req.body);




    try {
        const { name, email, password, secret } = req.body;


        if (!name || !email || !password || !secret) {
            return res.status(400).send("All fields are mandatory to fill");
        }

        const exist = await User.findOne({ email });

        if (exist) {
            return res.status(400).json("Email is already Taken")
        }

        const hashedPassword = await passwordHash(password);
        const username = generateUsername("", 0, 6);
        const newUser = new User({
            name: name,
            email,
            password: hashedPassword,
            secret,
            userName: username
        })
        await newUser.save();
        return res.json({
            ok: true
        })

    } catch (error) {
        res.status(400).json("Error try again")
    }


}



module.exports.login = async (req, res) => {
    // console.log("Register Endpoint ==>", req.body);
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                error: "All fields are mandatory to fill"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                error: "User not found"
            })
        }

        const match = await comparePassword(password, user.password);



        if (!match) {
            return res.json({
                error: "Password is incorrect"
            })
        }


        const token = jwt.sign({ _id: user._id }, process.env.jwt_secret, { expiresIn: '7D' })
        user.password = undefined;
        user.secret = undefined;

        return res.status(200).json({
            token,
            user
        })


    } catch (error) {
        console.log("Error on login ", error);
        return res.status(400).json({
            error: "Try again"
        })
    }


}



module.exports.loggedUser = async (req, res) => {


    try {
        const UserSignId = req.auth._id;

        const userData = await User.findById(UserSignId)
        // res.json(userData)
        res.json({ ok: true })
    } catch (error) {
        res.sendStatus(400)
    }

}





module.exports.passwordRecovery = async (req, res) => {
    // console.log(req.body);

    const { email, newPassword, secret } = req.body;

    if (!newPassword || (newPassword.length) < 6) {
        return res.json({
            error: "New password should have minimum 6 character"
        })
    }

    if (!secret) {
        return res.json({
            error: "Secret is required"
        })
    }


    const userExist = await User.findOne({ email, secret });

    if (!userExist) {

        return res.json({
            error: "User not found"
        })
    }

    try {


        const hashedPassword = await passwordHash(newPassword);


        await User.findByIdAndUpdate(userExist._id, { password: hashedPassword })

        return res.json({
            sucess: "Password is resetted succesfully"
        })





    } catch (error) {
        res.json({
            error: "Try agiain", error
        })
    }



    // if(!userEmail) return res.status(404).json("Email is not registered")

    // if(userSecret && userEmail) return res.status(200).json({ok: true})

    // return res.status(404).json("User not found")



}



module.exports.creatPost = async (req, res) => {
    //    
    // console.log(req.header('authorization'));



    const { content, imageDetails } = req.body;
    // console.log(req.body); 

    if (!content) return res.json({ error: "content cant be empty" })

    try {

        const post = new Post({
            content,
            userId: req.auth._id,
            image: imageDetails
        })

       await post.save();

       const postUser = await Post.findById(post._id)
       .populate(
        "userId",
        "-password -secret"
       )

        res.json(postUser)
        // res.json({ success: "Post created successfully", post })


    } catch (error) {
        return res.json({ error: "Some thing went wrong try again" })
    }


}



module.exports.imageUpload = async (req, res) => {
    // console.log(req.files);
    try {
        const result = await cloudinary.uploader.upload(req.files.image.path)
        // console.log("Upload url image: ", result);

        res.json({

            url: result.secure_url,
            public_id: result.public_id

        })
    } catch (error) {
        console.log(error);
    }

}




module.exports.userPosts = async (req, res) => {
    // console.log(req.auth._id);

    try {
        // console.log(req.params.page);
        // const posts = await Post.find({ userId: req.auth._id })
        const user = await User.findById(req.auth._id)
        const following = user.following
        following.push(user._id)

        const currentPage = req.params.page || 1;
        const perPage = 5;





        const posts = await Post.find({ userId: { $in: following } })
        .skip((currentPage-1) * perPage)
            .populate("userId", "_id name image")
            .populate("comments.userId", "_id name image")
            .sort({ createdAt: -1 }).limit(perPage)




        // console.log(posts);

        res.json(posts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred" });
    }
}




module.exports.editPost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id)
        // console.log(post);
        res.json(post)

    } catch (error) {
        res.json(error)
    }
}




module.exports.updatePost = async (req, res) => {

    try {
        console.log(req.body);
        const image = req.body.imageDetails
        // const post = await Post.findById(req.params.id)
        // console.log(req.body.userId);


        const updatedPost = await Post.findByIdAndUpdate(req.params.id, { content: req.body.content, image: req.body.imageDetails }, {
            new: true
        })

        return res.status(201).send({ success: "Post updated" })


    } catch (error) {
        console.log(error);
    }
}




module.exports.deletePost = async (req, res) => {
    try {
        const response = await Post.findByIdAndDelete(req.params.id)

        if (response.image && response.image.public_id) {
            const img = await cloudinary.uploader.destroy(response.image.public_id)
        }

        return res.json({ ok: true })

    } catch (error) {
        console.log(error);
    }
}





module.exports.profileUpdate = async (req, res) => {
    // console.log(req.body);

    try {

        const data = {}

        if (req.body.username) {
            data.userName = req.body.username

        }

        if (req.body.name) {
            data.name = req.body.name
        }

        if (req.body.password) {

            if (req.body.password.length < 6) {
                return res.json({ error: "Password length should minimum 6 character" })
            }
            else {
                const password = req.body.password;
                const hashedPassword = await passwordHash(password)
                data.passowrd = hashedPassword
            }
        }

        if (req.body.secret) {
            data.secret = req.body.secret
        }

        if (req.body.image) {
            data.image = req.body.image.url
        }

        // console.log(data);


        let user = await User.findByIdAndUpdate(req.auth._id, data, { new: true })
        // console.log(user);
        user.password = undefined
        user.secret = undefined
        return res.json(user)



    } catch (error) {
        if (error.code == 11000) {
            return res.json({ error: "Username is already exists" })
        }

    }
}



module.exports.findPeople = async (req, res) => {
    try {
        const user = await User.findById(req.auth._id)

        let following = user.following;

        following.push(user._id)

        const allPeople = await User.find({ _id: { $nin: following } }).select('-password -secret').limit(10)



        // console.log(allPeople);
        res.json(allPeople)

    } catch (error) {
        console.log(error);
    }
}


module.exports.followRequest = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(req.auth._id, { $addToSet: { following: req.body._id } }, { new: true }).select("-password -secret")
        res.json(user)

    } catch (error) {
        console.log(error);
    }
}



module.exports.followingList = async (req, res) => {
    try {
        // console.log(req.body);

        const user = await User.findById(req.auth._id)
        const following = await User.find({ _id: user.following }).limit(100)

        // console.log(following);
        res.json(following)



    } catch (error) {

        console.log(error);

    }
}




module.exports.unfollowRequest = async (req, res) => {

    try {
        // console.log(req.body._id);
        const user = await User.findByIdAndUpdate(req.auth._id, { $pull: { following: req.body._id } }, { new: true }).select("-password -secret")
        res.json(user)

    } catch (error) {
        console.log(error);
    }
}




module.exports.likePost = async (req, res) => {
    try {

        const post = await Post.findByIdAndUpdate(req.body._id, { $addToSet: { likes: req.auth._id } }, { new: true })
        // console.log(post);
        // const like = post.likes;

        res.json(post)

    } catch (error) {
        console.log(error);
    }
}


module.exports.unLikePost = async (req, res) => {
    try {

        const user = await Post.findByIdAndUpdate(req.body._id, { $pull: { likes: req.auth._id } }, { new: true })

        // console.log(post);

        res.json(post)


    } catch (error) {
        console.log(error);
    }
}




module.exports.addComment = async (req, res) => {
    try {
        const { postId, comment } = req.body;

        const result = await Post.findByIdAndUpdate(
            postId,
            {
                $push: {
                    comments: {
                        text: comment,
                        userId: req.auth._id  // Make sure to use lowercase "userId"
                    }
                }
            },
            { new: true }
        )
            .populate("userId", "_id name image")
            .populate("comments.userId", "_id name image");

        res.json(result);  // Use 'result' instead of 'post'
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while adding the comment." });
    }
};



module.exports.removeComment = async (req, res) => {

    try {
        // console.log(req.body.comment);

        const { postId, comment } = req.body

        const result = await Post.findByIdAndUpdate(postId, { $pull: { comments: { _id: comment._id } } }, { new: true })



        res.json(result)
    } catch (error) {
        console.log(error);

    }
}



module.exports.getPostById = async (req, res) => {
    const id = req.params._id; // Use the correct parameter name
    // console.log("ID received:", id); // Log the received ID
    try {
        const post = await Post.findById(id)
            .populate("userId", "_id name image")
            .populate("comments.userId", "_id name image"); // Use the correct id variable
        // console.log("Post retrieved:", post); // Log the retrieved post
        res.json(post);
    } catch (error) {
        console.log("Error:", error); // Log the error
        res.status(500).json({ error: "An error occurred while fetching the post." });
    }
};



module.exports.deleteComment = async(req,res) =>{

    try {

        const {postId,comment} = req.body
        
 
        const post = await Post.findByIdAndUpdate(postId, {$pull : {comments: {_id: comment._id}}}, {new: true})

        res.json(post)
        
    } catch (error) {
        
    }
} 



module.exports.CountPost= async(req,res)=>{
    try {
        
        const totalPost = await Post.find().estimatedDocumentCount()
        res.json(totalPost)


    } catch (error) {
        
    }
}


module.exports.findUser = async(req,res)=>{
    try {
        const userName = req.params.user

        if(!userName) return;

        try {
            const user = await User.find({$or: [
                {name: {$regex : userName, $options: 'i'}},
                {userName :{$regex : userName, $options: 'i'}}
            ]}).select('-password -secret')

        res.json(user)
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        
    }
}


module.exports.userProfile = async(req,res)=>{
    try {

        const user = await User.findOne({name: req.params.name}).select("-password -secret")
        res.json(user)
        
    } catch (error) {
        
    }
}



module.exports.homePosts = async(req,res)=>{

    try {

        const posts =  await Post.find()
        .populate("userId", "_id name image")
        .populate("comments.userId", "_id name image")
        .select("-comments")
        .sort({createdAt : -1})
        .limit(10)

        res.json(posts)
        
    } catch (error) {
        console.log(error);
    }
}





module.exports. getPost = async(req,res)=>{

    try {

        const post = await Post.findById(req.params.id)
        .populate("userId", "_id name image")
        .populate("comments.userId", "_id name image")
        .select("-comments")

        res.json(post)
        
    } catch (error) {

        console.log(error);
        
    }
}