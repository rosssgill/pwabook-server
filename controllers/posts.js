import mongoose from "mongoose";
import webpush from "web-push";
import PostMessage from "../models/postMessage.js";
import Subscription from "../models/subscription.js";

// https://www.restapitutorial.com/httpstatuscodes.html
export const getPosts = async (req, res) => {
  try {
    const postMessages = await PostMessage.find();
    // console.log(postMessages);
    res.status(200).json(postMessages);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  const post = req.body;
  const newPost = new PostMessage({
    ...post,
    creator: req.userId,
    createdAt: new Date().toISOString(),
  });

  try {
    await newPost.save();

    webpush.setVapidDetails(
      "mailto:rossstephensongill@gmail.com",
      "BH3ZQxUdEIciu6Kz6Tiq7udXG1LiBMgEELig2eMNQzaJnHbLv8Nd0zbgquA7XP-N6SW8gCXFQWl_9NmK2OP1BRQ", // public key
      "3YESRcm6ngaRwm2Pbay7GsfNgAmHuMR9FJ4NRAOjWPg" // private key
    );

    const query = await Subscription.find().lean();

    console.log("Query: ", query);

    for await (const sub of query) {
      console.log("sub: ", sub);
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys.auth,
          p256dh: sub.keys.p256dh,
        },
      };

      console.log("Push config:", pushConfig);

      webpush
        .sendNotification(
          pushConfig,
          JSON.stringify({
            title: "New Post",
            content: "New Post Added!",
            openUrl: "/",
          })
        )
        .catch((err) => {
          console.log(err);
        });
    }

    res.status(201).json(newPost);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// http://localhost:5000/posts/123
export const updatePost = async (req, res) => {
  const { id: _id } = req.params;
  const post = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(404).send(`No post with the id ${_id}`);

  const updatedPost = await PostMessage.findByIdAndUpdate(
    _id,
    { ...post, _id },
    {
      new: true,
    }
  );

  res.json(updatedPost);
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with the id ${id}`);

  await PostMessage.findByIdAndRemove(id);

  res.json({ message: "Post deleted" });
};

export const likePost = async (req, res) => {
  const { id } = req.params;

  // Populated userId property from middleware previously caled to authenticate user
  if (!req.userId) return res.json({ message: "User is not authenticated" });

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post found with the id ${id}`);

  const post = await PostMessage.findById(id);

  // Checking if user has already liked post
  const index = post.likes.findIndex((id) => id === String(req.userId));

  if (index === -1) {
    // Like the post
    post.likes.push(req.userId);
  } else {
    // Undo like because they already liked it
    console.log("User already liked post");
    post.likes = post.likes.filter((id) => id !== String(req.userId));
  }

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {
    new: true,
  });

  res.status(200).json(updatedPost);
};
