const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const async = require("async");
const { Parser } = require("json2csv");

dotenv.config();

const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

const getPlaceIds = async (keyword, location, radius) => {
  const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?key=${process.env.GOOGLE_PLACES_API_KEY}&location=${location}&radius=${radius}&keyword=${keyword}`;
  return axios(url);
};

const getPlaceById = async placeId => {
  const url = `${GOOGLE_PLACES_BASE_URL}/details/json?key=${process.env.GOOGLE_PLACES_API_KEY}&place_id=${placeId}`;
  return axios.get(url);
};

const runScript = async () => {
  try {
    // Keywords and locations
    const keywords = [
      "AMBULATORIO DIAGNOSTICO",
      "POLIAMBULATORIO",
      "CENTRO MEDICO",
      "STUDIO ASSOCIATO MEDICI",
      "VISITE SANITARIE SPECIALISTICHE PRIVATE",
      "CENTRO MEDICO SPECIALISTICO"
    ];
    const locations = [
      { location: "41.1171,16.8719", radius: 5000 },
      { location: "45.6983,9.6773", radius: 4000 },
      { location: "44.4949,11.3426", radius: 4000 },
      { location: "43.7696,11.2558", radius: 4000 },
      { location: "40.3515,18.1750", radius: 3000 },
      { location: "45.4642,9.1900", radius: 6000 },
      { location: "45.4064,11.8768", radius: 4000 },
      { location: "45.0526, 9.6930", radius: 3000 },
      { location: "43.7228,10.4017", radius: 3000 },
      { location: "41.9028,12.4964", radius: 8000 },
      { location: "45.4384,10.9916", radius: 6000 }
    ];

    // Combinations
    const combinations = keywords.flatMap(keyword =>
      locations.map(location =>
        getPlaceIds(keyword, location.location, location.radius)
      )
    );

    // Request places from API
    const requests = await Promise.all(combinations);

    // Place IDs
    const placeIds = requests.reduce(
      (accumulator, request) =>
        accumulator.concat(request.data.results.map(result => result.place_id)),
      []
    );

    // Request place details
    const places = await Promise.all(
      placeIds.map(placeId => getPlaceById(placeId))
    );

    // Clean
    const placesCleaned = places.filter(
      place =>
        !!place.data.result &&
        place.data.result.reviews &&
        place.data.result.reviews.length
    );

    console.log(placeIds);

    // Format places
    const placesFormatted = placesCleaned.map(place => {
      const {
        place_id,
        name,
        rating,
        user_ratings_total,
        website
      } = place.data.result;
      return { place_id, name, rating, user_ratings_total, website };
    });

    // Format reviews
    const reviewsFormatted = placesCleaned.reduce((accumulator, place) => {
      const { place_id, name, reviews } = place.data.result;
      return accumulator.concat(
        reviews.map(review => {
          return {
            place_id,
            name,
            author: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time
          };
        })
      );
    }, []);

    // Convert to CSV
    if (placesFormatted.length && reviewsFormatted.length) {
      // Parsers
      const json2csvParserPlaces = new Parser();
      const json2csvParserReviews = new Parser();

      // Parse
      const csvPlaces = json2csvParserPlaces.parse(placesFormatted);
      const csvReviews = json2csvParserReviews.parse(reviewsFormatted);

      // Write
      await async.parallel([
        () => {
          fs.writeFile("reviews.csv", csvReviews, () =>
            console.log("reviews saved")
          );
        },
        () => {
          fs.writeFile("places.csv", csvPlaces, () =>
            console.log("places saved")
          );
        }
      ]);
    } else {
      console.log(placeIds);
      console.log(placesCleaned);
      console.log(
        `${placesFormatted.length} places and ${reviewsFormatted.length} reviews`
      );
    }
  } catch (err) {
    console.log(err);
  }
};

runScript();
