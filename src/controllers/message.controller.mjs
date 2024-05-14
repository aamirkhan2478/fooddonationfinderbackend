import Chat from "../models/chat.model.mjs";
import Message from "../models/message.model.mjs";
import User from "../models/user.model.mjs";

export const sendMessage = async (req, res) => {
    const { content, chatId } = req.body;
    if (!content || !chatId)
      res.status(400).json({ error: "Please enter all required fields" });
  
    var newMessage = {
      sender: req.user._id,
      content: content,
      chat: chatId,
    };
  
    try {
      var message = await Message.create(newMessage);
      message = await message.populate("sender", "name pic");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.users",
        select: "name email",
      });
      await Chat.findByIdAndUpdate(req.body.chatId, {
        latestMessage: message,
      });
  
      res.json(message);
    } catch (error) {
      res.status(500).send("Server Error: " + error.message);
    }
  };
  
  export const allMessages = async (req, res) => {
    try {
      const messages = await Message.find({ chat: req.params.id })
        .populate("sender", "name email pic")
        .populate("chat");
  
      res.json(messages);
    } catch (error) {
      res.status(500).send("Server Error: " + error.message);
    }
  };