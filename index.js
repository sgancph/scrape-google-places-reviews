const axios = require("axios");
const dotenv = require("dotenv");

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

const formatPlaces = places =>
  places.map(place => {
    const {
      name,
      rating,
      user_ratings_total,
      reviews,
      website
    } = place.data.result;
    return { name, rating, user_ratings_total, reviews, website };
  });

const runScript = async () => {
  const placeIds = await getPlaceIds();
  const places = await Promise.all(
    placeIds.map(placeId => getPlaceById(placeId))
  );
  const placesFormatted = formatPlaces(places);

  console.dir(placesFormatted, { depth: null });
};

runScript();
