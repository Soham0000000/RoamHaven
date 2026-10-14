const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKAN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const defaultImageUrl = "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80";
const normalizeListingData = (listingData) => {
    const safeListing = { ...listingData };

    if (!safeListing.image || !safeListing.image.url || !safeListing.image.url.trim()) {
        safeListing.image = { url: defaultImageUrl, filename: "listingimage" };
    }

    return safeListing;
};

module.exports.index = async (req,res)=>{
    let { category, search } = req.query;
    let query = {};
    if (category && category !== "All") {
        query.category = category;
    }
    if (search && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [
            { title: regex },
            { location: regex },
            { country: regex }
        ];
    }
    let allListings = await Listing.find(query);
    res.render("./listings/index.ejs", { 
        allListings, 
        currentCategory: category || "All", 
        searchQuery: search || "" 
    });
}

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async(req,res)=>{
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({path:"reviews",populate: { path: "author"}}).populate("owner");
    
    if (!listing) {
        req.flash("error","The requested Haven does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async(req,res,next)=>{
    let geometry = { type: 'Point', coordinates: [77.2090, 28.6139] };
    try {
        if (mapToken) {
            let response = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            }).send();
            if (response && response.body && response.body.features && response.body.features.length > 0) {
                geometry = response.body.features[0].geometry;
            }
        }
    } catch (err) {
        console.error("Geocoding failed, using fallback coordinates:", err.message);
    }

    const safeListing = normalizeListingData(req.body.listing);
    const newListing = new Listing(safeListing);
    newListing.owner = req.user._id;
    newListing.geometry = geometry;
    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    let savedListing = await newListing.save();

    req.flash("success","New Haven Created Successfully!");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req,res)=>{
    let { id } = req.params;
    const listing =  await Listing.findById(id); 
    if (!listing) {
        req.flash("error","The requested Haven does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    if (originalImageUrl) {
        originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    }
    res.render("listings/edit.ejs",{ listing, originalImageUrl });
}

module.exports.updateListing = async(req,res)=>{
    let { id } = req.params;
    const safeListing = { ...req.body.listing };
    let listing = await Listing.findByIdAndUpdate(id, safeListing);
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }
    req.flash("success","Haven updated successfully!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req,res)=>{
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success","Haven deleted successfully!");
    res.redirect("/listings");
}