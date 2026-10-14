const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.ATLASDB_URL;
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKAN });

const initDB = async () => {
    if (!process.env.MAP_TOKAN) {
        throw new Error("MAP_TOKAN is missing from the project .env file");
    }

    await mongoose.connect(MONGO_URL);

    const listingsWithGeometry = [];
    for (const listing of initData.data) {
        const response = await geocodingClient.forwardGeocode({
            query: `${listing.location}, ${listing.country}`,
            limit: 1,
        }).send();
        const feature = response.body.features[0];
        if (!feature) {
            throw new Error(`Mapbox could not find coordinates for ${listing.location}, ${listing.country}`);
        }

        listingsWithGeometry.push({
            ...listing,
            geometry: feature.geometry,
        });
    }

    await Listing.deleteMany({});
    await Listing.insertMany(listingsWithGeometry);
    console.log("Listings were initialized with map coordinates");
};

initDB()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });