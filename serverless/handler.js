'use strict';
const { request, GraphQLClient } = require('graphql-request');

module.exports.triggerGraphCoolFoursquareUpdate = (event, context) => {
  const endpoint = 'https://api.graph.cool/simple/v1/cja5eo2br00300181q6fvklxm';

  const token = process.env.GRAPHCOOL_ROOTTOKEN;
  const authHeader = 'Bearer ' + token;

  const client = new GraphQLClient(endpoint, {
    headers: {
      Authorization: authHeader
    }
  });

  // Query to fetch all current Foursquare places in database
  let query = `
    {
      allFoursquarePlaces {
        id
        fsId
      }
    }
  `;

  // Build mutation query that gets send in request to GraphCool update places
  let buildMutations = function (data) {
    let placesArray = data.allFoursquarePlaces;
    let mutationsArray = placesArray.map((place, index) => `
      ${'alias' + index}: updateFoursquarePlace(id: "${place.id}", fsId: "${place.fsId}") {
        id
        updatedAt
      }
    `);
    return mutationsArray.join('');
  }

  // First request all GraphCool and Fourquare IDs currently in database
  let returnPayload = client.request(query)
    // Then use these IDs to trigger an update for all places in database
    .then(data => {
      let mutations = `
        mutation {
          ${buildMutations(data)}
        }
      `;
      return client.request(mutations);
    })
    // The return places which have been updated
    .then(data => {
      console.log('Updates done:\r\n', data);
      return data;
    })
    .catch(error => console.error(error););

  return returnPayload;
}
