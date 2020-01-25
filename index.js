const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";
const TYPE = "";
const RADIUS = 2000;
const LOCATION = "45.4642,9.1900";
const KEYWORD = "centro diagnostico";
const CITY = "Milan";
const STATE = "Lombardy";

const getPlaceIds = async () => {
  const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?key=${process.env.GOOGLE_PLACES_API_KEY}&location=${LOCATION}&radius=${RADIUS}&keyword=${KEYWORD}`;
  const response = await axios.get(url);
  return response.data.results.map(result => result.place_id);
};

const getPlaceById = async placeId => {
  const url = `${GOOGLE_PLACES_BASE_URL}/details/json?key=${process.env.GOOGLE_PLACES_API_KEY}&place_id=${placeId}`;
  const response = await axios.get(url);
  const { name, reviews } = response.data.result;
  return { name, reviews };
};

const runScript = async () => {
  const placeIds = [(await getPlaceIds())[0]];
  const places = placeIds.map(async placeId => await getPlaceById(placeId));

  console.log(places);
};

runScript();
