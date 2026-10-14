if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
const express =require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
// const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const port = 8080;

const atlasDbUrl = process.env.ATLASDB_URL;

async function main() {
    if (!atlasDbUrl) {
        throw new Error("ATLASDB_URL is not set. Add your MongoDB Atlas connection string to the environment.");
    }

    await mongoose.connect(atlasDbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB Atlas");
    app.listen(port, () => {
        console.log(`Server is listening to Port ${port}`);
    });
}

main().catch((err) => {
    console.error("MongoDB startup error:", err.message || err);
    process.exitCode = 1;
});
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public"))); 



const sessionOptions = {
    secret:  "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now()+ 7 * 24 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 1000,
        httpOnly: true,
    },
};

app.get("/", (req, res) => {
    res.redirect("/listings");
});



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demoUser", async (req,res)=>{
//     let fakeUser =  new User({
//         email: "student@gmail.com",
//         username : "deltaStudent"
//     });

//     let registerUser =  await User.register(fakeUser,"hello world");
//     res.send(registerUser);
// });


app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/", userRouter)

//ERROR Handle
app.all("/{*splat}", (req,res,next)=>{
    next(new ExpressError(404,"page not found!"));
});

app.use((err,req,res,next)=>{
    let { statusCode=500 , message= "something went wrong" } = err;
    res.status(statusCode).render("error.ejs",{ err: { message } });
});


