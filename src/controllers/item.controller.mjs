import Item from "../models/item.model.mjs";

// @route   POST /api/item/add
// @desc    Create a new item
// @access  Private
export const createItem = async (req, res) => {
  const { name, pic, category, quantity } = req.body;
  const { id } = req.user;
  const errors = [];

  if (!name) {
    errors.push({ message: "Name is required" });
  }

  if (!category) {
    errors.push({ message: "Category is required" });
  }

  if (!quantity) {
    errors.push({ message: "Quantity is required" });
  }

  if (!pic) {
    errors.push({ message: "Image is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    // Create a new item
    const item = new Item({
      name,
      pic,
      category,
      quantity,
      createdBy: id,
    });

    // Save the item to the database
    await item.save();

    // Send the item as a response
    return res
      .status(201)
      .json({ success: true, message: "Item added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/item/all
// @desc    Show all items
// @access  Private
export const getItems = async (req, res) => {
  const { id } = req.user;
  try {
    const items = await Item.find({
      quantity: { $gt: 0 },
      createdBy: { $eq: id },
    });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/item/:id/show
// @desc    Show a single item
// @access  Private
export const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/item/:id/update
// @desc    Update a single item
// @access  Private
export const updateItem = async (req, res) => {
  const { name, category, quantity } = req.body;
  const errors = [];

  if (!name) {
    errors.push({ message: "Name is required" });
  }

  if (!category) {
    errors.push({ message: "Category is required" });
  }

  if (!quantity) {
    errors.push({ message: "Quantity is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    // Find the item and update it
    await Item.findByIdAndUpdate(
      req.params.id,
      { name, category, quantity },
      { new: true }
    );

    // Send the updated item as a response
    return res
      .status(200)
      .json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   Patch /api/item/:id/update-image
// @desc    Update item image
// @access  Private
export const updateItemImage = async (req, res) => {
  try {
    // Find the item and update its image
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { pic: req.body.pic },
      { new: true }
    );

    // Send the updated item as a response
    return res
      .status(200)
      .json({ success: true, message: "Item image updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/item/:id/delete
// @desc    Delete a single item
// @access  Private
export const deleteItem = async (req, res) => {
  try {
    // Find the item and delete it
    await Item.findByIdAndDelete(req.params.id);

    // Send a success message as a response
    return res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
