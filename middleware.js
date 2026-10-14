const Listing  = require("./models/listing");
const Review  = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema,reviewSchema } = require("./schema.js");


module.exports.isLoggedIn = (req,res,next)=>{
   //rediectUrlsave
    req.session.redirectUrl = req.originalUrl;
     if(!req.isAuthenticated()){
        req.flash("error", "You must be logged in to create listings");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req,res,next)=>{
    res.locals.redirectUrl = req.session.redirectUrl || "/listings";
    next();
};

module.exports.isOwner = async (req,res,next)=>{
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "The requested Haven does not exist!");
        return res.redirect("/listings");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }


    next();
};
module.exports.isReviewAuthor = async (req,res,next)=>{
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "The requested Haven does not exist!");
        return res.redirect("/listings");
    }
    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }


    next();
};

module.exports.validateListing = (req,res,next)=>{
    const { error, value } = listingSchema.validate(req.body ?? {});
    if (error) {
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}

module.exports.validateReview = (req,res,next)=>{
    const { error, value } = reviewSchema.validate(req.body ?? {});
    if (error) {
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}
