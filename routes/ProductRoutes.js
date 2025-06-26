const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/auth");
const { updateQuantityOnly } = require("../controllers/productController");

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// POST: Add Product
router.post(
  "/",
  upload.fields([
    { name: "mainPhoto", maxCount: 1 },
    { name: "galleryPhotos", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        titleSub,
        description,
        about,
        categoryId,
        price1,
        price2,
        price3,
        quantity,
        status,
        specifications,
      } = req.body;

      const mainPhoto = req.files?.mainPhoto?.[0]?.filename || null;
      const gallery = req.files?.galleryPhotos || [];
      const videos = req.files?.videos || [];

      const imageUrls = gallery.map((file) => file.filename);
      const videoUrls = videos.map((file) => file.filename);

      const product = await Product.create({
        title,
        titleSub,
        description,
        about,
        categoryId,
        price1,
        price2,
        price3,
        quantity,
        status,
        mainPhoto,
        imageUrls,
        videoUrls,
        specifications: JSON.parse(specifications || "[]"),
      });

      res.status(201).json(product);
    } catch (err) {
      console.error("❌ Save failed:", err);
      res.status(500).json({ error: "Saving product failed." });
    }
  }
);

// GET /api/products - get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /api/products/:id - update status
router.patch("/:id", authMiddleware, async (req, res) => {
  if (req.user.role === "store") {
    return res
      .status(403)
      .json({ message: "Unauthorized: Store users cannot update status" });
  }
  const { id } = req.params;
  const { status } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.status = status;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get single product by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user=req.user.role;
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    
    res.json(product ,user);
  } catch (error) {
    console.error("❌ Error fetching product by ID:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// PUBLIC: Get single product for LearnMorePage
router.get("/public/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product); // Just return product, no auth
  } catch (error) {
    console.error("❌ Error fetching public product by ID:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// PUT: Update Product
router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "mainPhoto", maxCount: 1 },
    { name: "galleryPhotos", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  async (req, res) => {
    if (req.user.role === "store") {
      return res
        .status(403)
        .json({
          message: "Unauthorized: Store users cannot update full product",
        });
    }

    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const {
        title,
        titleSub,
        description,
        about,
        categoryId,
        price1,
        price2,
        price3,
        quantity,
        status,
        specifications,
        removeImages,
        removeVideos, // Add these to handle removals
      } = req.body;

      const newGallery = req.files?.galleryPhotos || [];
      const newVideos = req.files?.videos || [];
      const newMainPhoto = req.files?.mainPhoto?.[0]?.filename;

      // Map uploaded file names
      const newImageFilenames = newGallery.map((file) => file.filename);
      const newVideoFilenames = newVideos.map((file) => file.filename);

      // Get existing arrays
      let existingImages = product.imageUrls || [];
      let existingVideos = product.videoUrls || [];

      // Handle removals if specified
      if (removeImages) {
        const imagesToRemove = JSON.parse(removeImages);
        existingImages = existingImages.filter(
          (img) => !imagesToRemove.includes(img)
        );
      }
      if (removeVideos) {
        const videosToRemove = JSON.parse(removeVideos);
        existingVideos = existingVideos.filter(
          (vid) => !videosToRemove.includes(vid)
        );
      }

      // Merge with new uploads
      const mergedImages = [...existingImages, ...newImageFilenames];
      const mergedVideos = [...existingVideos, ...newVideoFilenames];

      let parsedSpecs = [];
      try {
        parsedSpecs =
          typeof specifications === "string"
            ? JSON.parse(specifications)
            : specifications;
      } catch (e) {
        console.error("❌ Failed to parse specifications:", e);
      }

      await product.update({
        title,
        titleSub,
        description,
        about,
        categoryId,
        price1,
        price2,
        price3,
        quantity,
        status,
        specifications: parsedSpecs,
        mainPhoto: newMainPhoto || product.mainPhoto,
        imageUrls: mergedImages,
        videoUrls: mergedVideos,
      });

      return res.status(200).json({
        message: "Product updated successfully",
        product: await Product.findByPk(req.params.id), // Return fresh data
      });
    } catch (error) {
      console.error("❌ Error updating product:", error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// DELETE product
router.delete("/:id", authMiddleware, async (req, res) => {
  if (req.user.role === "store") {
    return res
      .status(403)
      .json({ message: "Unauthorized: Store users cannot delete products" });
  }
  const { id } = req.params;

  try {
    const deletedProduct = await Product.destroy({
      where: { id: id },
    });

    if (deletedProduct) {
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

// PUT: Update Product Quantity (allowed for admin + store)
router.put("/:id/quantity", authMiddleware, async (req, res) => {
  const role = req.user.role;
  const { quantity } = req.body;

  if (!quantity && quantity !== 0) {
    return res.status(400).json({ message: "Quantity is required" });
  }

  // Allow only quantity update for store
  if (role !== "admin" && role !== "store") {
    return res
      .status(403)
      .json({
        message: "Unauthorized: Only admin or store can update quantity",
      });
  }

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.update({ quantity });

    return res.status(200).json({
      message: "Quantity updated successfully",
      quantity: product.quantity,
    });
  } catch (error) {
    console.error("❌ Error updating quantity:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
