const axios = require("axios");
const dotenv = require("dotenv");
const { Parser } = require("json2csv");

dotenv.config();

const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";
const TYPE = "";
const RADIUS = 10000;
const LOCATION = "45.4642,9.1900";
const KEYWORD = "centro diagnostico";
const MAX_NUM_PLACES = 10;

const getPlaceIds = async (placeIds = [], pageToken = null) => {
  const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?key=${process.env.GOOGLE_PLACES_API_KEY}&location=${LOCATION}&radius=${RADIUS}&keyword=${KEYWORD}&page_token=${pageToken}`;
  const response = await axios.get(url);
  const { results, next_page_token } = response.data;
  const newPlaceIds = results.map(result => result.place_id);
  const allPlaceIds = placeIds.concat(newPlaceIds);

  // Call function recursively
  return next_page_token && placeIds.length < MAX_NUM_PLACES
    ? getPlaceIds(allPlaceIds, next_page_token)
    : allPlaceIds;
};

const getPlaceById = async placeId => {
  const url = `${GOOGLE_PLACES_BASE_URL}/details/json?key=${process.env.GOOGLE_PLACES_API_KEY}&place_id=${placeId}`;
  return axios.get(url);
};

const runScript = async () => {
  // Request places from API
  try {
    const placeIds = await getPlaceIds();
    const places = await Promise.all(
      placeIds.map(placeId => getPlaceById(placeId))
    );

    // Format places
    const placesFormatted = places.map(place => {
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
    const reviewsFormatted = places.reduce((accumulator, place) => {
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
    try {
      const json2csvParser = new Parser();

      const csvPlaces = json2csvParser.parse(placesFormatted);
      const csvReviews = json2csvParser.parse(reviewsFormatted);

      console.log(csvPlaces);
      console.log(csvReviews);
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
};

runScript();
