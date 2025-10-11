const ProductType = require('../../models/ProductType');
const Products = require('../../models/Products');
const ProductVariant = require('../../models/productVariant');
const Review = require('../../models/Review');
const Fit = require('../../models/Fit');
const Colour = require('../../models/Colour');
const productVariant = require('../../models/productVariant');
const User=require('../../models/userModel');
const mongoose = require('mongoose');
const Offers = require("../../models/Offers");
 

// Get first variant with images for product IDs
async function getFirstVariantsForProducts(productIds) {
  // Fetch variants for multiple products at once
  const variants = await ProductVariant.find({
    productId: { $in: productIds },
    isActive: true,
    images: { $exists: true, $ne: [] }
  }).lean();

  // Map productId to variant (first one found)
  const variantMap = new Map();
  for (const variant of variants) {
    if (!variantMap.has(variant.productId.toString())) {
      variantMap.set(variant.productId.toString(), variant);
    }
  }
  return variantMap;
}

// Helper: Calculate average rating for products
async function getAvgRatingsForProducts(products) {
  const ratings = {};

  // Fetch all reviews for given product IDs at once
  const productIds = products.map(p => p._id);
  const reviews = await Review.aggregate([
    { $match: { productId: { $in: productIds } } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  for (const { _id, avgRating } of reviews) {
    ratings[_id.toString()] = avgRating;
  }

  return ratings;
}

exports.getHomePage = async (req, res) => {
  try {
    const genders = ['male', 'female'];
    const categoryData = {};
    const topTrends = {};
    const newArrivals = {};

    for (const gender of genders) {
      const categories = await ProductType.find({ isActive: true });

      // Find one product per category matching gender
      const productsByCategory = await Promise.all(
        categories.map(cat =>
          Products.findOne({
            productTypeId: cat._id,
            genderId: gender,
            isActive: true
          })
        )
      );

      // Filter valid products
      const validProducts = productsByCategory.filter(Boolean);
      const productIds = validProducts.map(p => p._id.toString());

      // Get variants for those products
      const variantMap = await getFirstVariantsForProducts(productIds);

      // Build categoryData with image fallback
      categoryData[gender] = categories
        .map(cat => {
          const product = validProducts.find(p => p.productTypeId.toString() === cat._id.toString());
          if (!product) return null;
          const variant = variantMap.get(product._id.toString());
          if (!variant || !variant.images.length) return null;
          return {
            categoryId: cat._id.toString(), 
            categoryName: cat.name,
            image: variant.images[0]
          };
        })
        .filter(Boolean);

      // === TOP TRENDS ===
      const products = await Products.find({ genderId: gender, isActive: true }).lean();
      const avgRatings = await getAvgRatingsForProducts(products);

      // Attach avgRating to products
      const productsWithRatings = products
        .map(p => ({
          ...p,
          avgRating: avgRatings[p._id.toString()] || 0
        }))
        .filter(p => p.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 10);

      const trendProductIds = productsWithRatings.map(p => p._id.toString());
      const trendVariantMap = await getFirstVariantsForProducts(trendProductIds);

      topTrends[gender] = productsWithRatings
        .map(p => {
          const variant = trendVariantMap.get(p._id.toString());
          if (!variant || !variant.images.length) return null;
          return {
            productName: p.name,
            image: variant.images[0]
          };
        })
        .filter(Boolean);

      // === NEW ARRIVALS ===
      const newestProducts = await Products.find({ genderId: gender, isActive: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const newestProductIds = newestProducts.map(p => p._id.toString());
      const newestVariantMap = await getFirstVariantsForProducts(newestProductIds);

      newArrivals[gender] = newestProducts
        .map(p => {
          const variant = newestVariantMap.get(p._id.toString());
          if (!variant || !variant.images.length) return null;
          return {
             id: p._id.toString(),
            productName: p.name,
            image: variant.images[0]
          };
        })
        .filter(Boolean);
    }

     let user = null;
    if (req.session && req.session.user) {
      user = await User.findById(req.session.user._id);
    }
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    res.render('user/home', {
      categories: categoryData,
      trends: topTrends,
      arrivals: newArrivals, cartCount,wishlistCount
    });
  } catch (err) {
    console.error('Error in getHomePage:', err);
    res.status(500).send('Internal Server Error');
  }
};


exports.getProductPage = async (req, res) => {
  try {
    const genderParam = req.params.gender || 'all';
    const allowedGenders = ['men', 'women', 'all'];
    if (!allowedGenders.includes(genderParam)) {
      return res.status(404).render('error/404');
    }

    const genderMap = {
      women: 'female',
      men: 'male',
    };
    const gender = genderMap[genderParam] || null;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search ? req.query.search.trim() : null; // ✅ Added search support

    // ====== Fetch categories ======
    const categoriesQuery = { isActive: true };
    if (gender === 'female' || gender === 'male') categoriesQuery.gender = gender;

    let categories;
    if (!gender) {
      const categoryIds = await Products.distinct('productTypeId', { isActive: true });
      categories = await ProductType.find({ isActive: true }).lean();
    } else {
      const categoryIds = await Products.distinct('productTypeId', {
        genderId: gender,
        isActive: true,
      });
      categories = await ProductType.find({
        _id: { $in: categoryIds },
        isActive: true,
      });
    }

    const fit = await Fit.find({ isActive: true });
    const colors = await Colour.find({ isActive: true });
    const sort = req.query.sort || null;

    // ====== Parse filter params ======
    const selectedCategories =
      typeof req.query.category === 'string'
        ? req.query.category.split(',')
        : Array.isArray(req.query.category)
        ? req.query.category
        : req.query.category
        ? [req.query.category]
        : [];

    const selectedFits =
      typeof req.query.fit === 'string'
        ? req.query.fit.split(',')
        : Array.isArray(req.query.fit)
        ? req.query.fit
        : req.query.fit
        ? [req.query.fit]
        : [];

    const selectedColors =
      typeof req.query.color === 'string'
        ? req.query.color.split(',')
        : Array.isArray(req.query.color)
        ? req.query.color
        : req.query.color
        ? [req.query.color]
        : [];

    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null;

    // ====== Variant filter query ======
    const variantQuery = { isActive: true };
    if (selectedFits.length > 0) variantQuery.fitId = { $in: selectedFits };
    if (selectedColors.length > 0) variantQuery.colorId = { $in: selectedColors };
    if (maxPrice) variantQuery.discountPrice = { $lte: maxPrice };

    const matchedVariants = await ProductVariant.find(variantQuery).lean();
    const matchedProductIds = [...new Set(matchedVariants.map((v) => v.productId.toString()))];

    // ====== Product main query ======
    const productQuery = { isActive: true };
    if (gender) productQuery.genderId = gender;
    if (selectedCategories.length > 0) productQuery.productTypeId = { $in: selectedCategories };
    if (matchedProductIds.length > 0) productQuery._id = { $in: matchedProductIds };

    // ✅ Include search in query
    if (searchQuery) {
  productQuery.$or = [
    { name: { $regex: searchQuery, $options: 'i' } },
    { description: { $regex: searchQuery, $options: 'i' } },
  ];
}
              

    // ====== Handle no matching variants ======
    if (
      selectedCategories.length === 0 &&
      selectedFits.length + selectedColors.length === 0 &&
      !maxPrice
    ) {
      // no extra filtering
    } else {
      if (matchedProductIds.length === 0) {
        return res.render('user/allProducts', {
          categories,
          fit,
          colour: colors,
          products: [],
          selectedFits,
          selectedColors,
          selectedCategories,
          maxPrice,
          currentPage: page,
          totalPages: 1,
          sort,
          genderParam,
          queryParams: { ...req.query },
          searchQuery,
          formAction: genderParam === 'all' ? '/products' : `/products/${genderParam}`,
        });
      }
    }

    // ====== Fetch & prepare products ======
    const allProducts = await Products.find(productQuery)
      .sort({ createdAt: -1 })
      .lean();

    const productIds = allProducts.map((p) => p._id);
    const variants = await ProductVariant.find({
      productId: { $in: productIds },
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .lean();

    const variantMap = {};
    variants.forEach((variant) => {
      const pid = variant.productId.toString();
      if (!variantMap[pid]) {
        variantMap[pid] = {
          firstImage: variant.images?.[0],
          basePrices: [variant.basePrice],
          discountPrices: [variant.discountPrice],
        };
      } else {
        variantMap[pid].basePrices.push(variant.basePrice);
        variantMap[pid].discountPrices.push(variant.discountPrice);
      }
    });

    let actualProducts = allProducts.map((product) => {
      const pid = product._id.toString();
      const variantInfo = variantMap[pid] || {};
      return {
        ...product,
        firstImage: variantInfo.firstImage,
        minPrice: variantInfo.discountPrices
          ? Math.min(...variantInfo.discountPrices)
          : 0,
        maxPrice: variantInfo.basePrices ? Math.max(...variantInfo.basePrices) : 0,
      };
    });

    // ====== Apply sorting BEFORE pagination ======
    if (sort === 'LowToHigh') {
      actualProducts.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sort === 'HighToLow') {
      actualProducts.sort((a, b) => b.minPrice - a.minPrice);
    }

    // ====== Pagination AFTER sorting ======
    const totalProducts = actualProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
    actualProducts = actualProducts.slice(skip, skip + limit);

    // ====== Preserve all query params ======
    const queryParams = { ...req.query };
    delete queryParams.page;
    if (req.query.search) queryParams.search = req.query.search; // ✅ preserve search param

    //find the count of cart and wishlist
    const user=await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;

    res.render('user/allProducts', {
      categories,
      fit,
      colour: colors,
      products: actualProducts,
      selectedFits,
      selectedColors,
      selectedCategories,
      maxPrice,
      currentPage: page,
      totalPages,
      sort,
      genderParam,
      queryParams,
      searchQuery, // ✅ pass search to view,
      cartCount,wishlistCount
    });
  } catch (err) {
    console.error('Error loading product page with filters:', err);
    res.status(500).send('Server Error');
  }
};




exports.getProductDetails = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Products.findOne({ _id: id }).lean();
    const gender=product.genderId;
    if (!product) return res.redirect('/products');
    const type=await ProductType.findById(product.productTypeId);
    //finding the offers available for a product
    const offers=await Offers.find({category:type.name,isActive:true});

    const variants = await productVariant.find({ productId: id }).populate('colorId fitId size').lean();

    const relatedProducts = await Products.find({
      productTypeId: product.productTypeId,
      genderId:gender,
      _id: { $ne: id },
      isActive: true
    }).limit(4).lean();

     const relatedDatas = await Promise.all(
      relatedProducts.map(async (prod) => {
      const firstVariant = await ProductVariant.findOne({
        productId: prod._id,
        isActive: true
      })
      .sort({ createdAt: 1 })
      .lean();

      return {
        ...prod,
        firstVariantImages: firstVariant ? firstVariant.images : [],
        basePrice:firstVariant ? firstVariant.basePrice :0,
        discountPrice:firstVariant ? firstVariant.discountPrice : 0
      };
    })
  );

    const reviews=await Review.find({productId:product._id})
                .populate("userId","name");
    let avgRating = 0;
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      avgRating = (total / reviews.length).toFixed(1); // 1 decimal place
    }
    
    const count=reviews.length;
    
    const images = variants[0]?.images || [];
    const basePrice = variants[0]?.basePrice || 0;
    const discountPrice = variants[0]?.discountPrice || 0;

    const user=await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    res.render('user/productDetails', {
      product,
      variants,
      images, basePrice,
      discountPrice,
       relatedProducts: relatedDatas,
       reviews,
       avgRating,count,offers,
       cartCount,
       wishlistCount
    });
  } catch (err) {
    console.error('Product Details Error:', err.message);
    res.status(500).render('error/500');
  }
};

exports.getFirstVariant=async (req, res) => {
  try {
    const variants = await productVariant.find({ productId: req.params.productId });
    res.json({ success: true, variants });
  } catch (err) {
    console.error(err);
    res.json({ success: false, variants: [] });
  }
};


// controllers/productController.js

exports.searchProducts = async (req, res) => {
  try {
    const search = req.query.q ? req.query.q.trim() : null;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    if (!search) {
      return res.redirect('/products');
    }

    // Find products matching search
    const products = await Products.find({
      isActive: true,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Products.countDocuments({
      isActive: true,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });

    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

    // Get variants for prices & images
    const productIds = products.map(p => p._id);
    const variants = await ProductVariant.find({
      productId: { $in: productIds },
      isActive: true
    })
      .sort({ createdAt: 1 })
      .lean();

    const variantMap = {};
    variants.forEach(variant => {
      const pid = variant.productId.toString();
      if (!variantMap[pid]) {
        variantMap[pid] = {
          firstImage: variant.images?.[0],
          basePrices: [variant.basePrice],
          discountPrices: [variant.discountPrice]
        };
      } else {
        variantMap[pid].basePrices.push(variant.basePrice);
        variantMap[pid].discountPrices.push(variant.discountPrice);
      }
    });

    const actualProducts = products.map(product => {
      const pid = product._id.toString();
      const variantInfo = variantMap[pid] || {};
      return {
        ...product,
        firstImage: variantInfo.firstImage,
        minPrice: variantInfo.discountPrices ? Math.min(...variantInfo.discountPrices) : 0,
        maxPrice: variantInfo.basePrices ? Math.max(...variantInfo.basePrices) : 0
      };
    });

    const user=await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    res.render('user/allProducts', {
      products: actualProducts,
      search,
      categories: [],   // optional if  want to reuse filters here
      fit: [],
      colour: [],
      selectedFits: [],
      selectedColors: [],
      selectedCategories: [],
      maxPrice: null,
      currentPage: page,
      totalPages,
      sort: null,
      genderParam: "all",
      queryParams: req.query,
      cartCount,
      wishlistCount
    });

  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).render('error/500');
  }
};








