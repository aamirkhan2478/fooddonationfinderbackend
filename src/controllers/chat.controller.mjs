import User from "../models/user.model.mjs";
import Chat from "../models/chat.model.mjs";

// @route   POST /api/chat
// @desc    Access a chat
// @access  Private
export const accessChat =  async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      return res
        .status(400)
        .json({ error: "UserId params not sent with request!" });
    }
  
    var isChat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");
  
    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
  
    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        users: [req.user._id, userId],
      };
    }

    try {
        const createdChat = await Chat.create(chatData);
        const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
          "users",
          "-password"
        );
    
        res.status(200).send(FullChat);
      } catch (err) {
        res.status(500).send("Server Error");
      }
};

// @route   GET /api/chat
// @desc    Fetch all chats
// @access  Private
export const fetchChats = async (req, res) => {
    try {
      Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
        .populate("users", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .then(async (results) => {
          results = await User.populate(results, {
            path: "latestMessage.sender",
            select: "name pic email",
          });
  
          res.status(200).send(results);
        });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  };