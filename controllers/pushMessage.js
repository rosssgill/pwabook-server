import Subscription from "../models/subscription.js";

export const createSubscription = async (req, res) => {
  const sub = req.body;

  console.log("New sub: ", sub);

  const newSubscription = new Subscription({
    ...sub,
  });

  try {
    await newSubscription.save();
    res.status(201).json(newSubscription);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
