import * as fetch from 'isomorphic-fetch';

// Serverless function that GraphCool uses to fetch data from Foursquare API.
// Gets called right before new place is added to DB and by different
// serverless function that uses AWS schedule to update data every 6 hours.
export default async function fetchFoursquareData (event) {
  const endpoint = 'https://api.foursquare.com/v2/venues/' +
    event.data.fsId +
    '?client_id=' + process.env['CLIENT_ID'] +
    '&client_secret=' + process.env['CLIENT_SECRET'] +
    '&v=' + process.env['VERSION'];

  const returnObject = await fetch(endpoint)
    .then(response => {
      // Catch errors when accessing Foursquare server
      if (response.status >= 400) {
        console.log(response.statusText);
        console.log(response.headers.raw());
        console.log(response.headers.get('content-type'));
        throw new Error('Bad response from server');
      }
      return response.json();
    })
    .then(payload => {
      // Catch erros send by Foursquare
      if (payload.meta.code != 200) {
        throw new Error(payload.meta.errorDetail);
      }

      // Add data to object that gets passed to DB
      const data = payload.response.venue;
      if (data.name) {
        event.data.name = data.name;
      }
      if (data.bestPhoto) {
        event.data.photo300 = data.bestPhoto.prefix + '300x300' +
          data.bestPhoto.suffix;
      } else if (data.photos) {
        try {
          event.data.photo300 = data.photos.groups[0].items[0].prefix + '300x300' +
            data.photos.groups[0].items[0].suffix;
        } catch (error) {
          console.log('No (new) photo could be loaded. Probably none available on Foursquare. Error: ', error);
        }
      }
      if (data.canonicalUrl) {
        event.data.url = data.canonicalUrl;
      }
      if (data.hours) {
        try {
          let hoursArray = [];
          data.hours.timeframes.forEach(timeframe => {
            let openOnDay = [];
            timeframe.open.forEach(open => {
              openOnDay.push(open.renderedTime);
            })
            hoursArray.push(timeframe.days + ': ' + openOnDay.join(', '));
          })
          event.data.hours = hoursArray;
        } catch (error) {
          console.log('Status for hours is not available. Error: ', error);
        }
      }
      if (data.rating) {
        event.data.rating = data.rating;
      }
      if (data.location.lat && data.location.lng) {
        event.data.location = {lat: data.location.lat, lng: data.location.lng};
        console.log(event.data.location);
      }

      return { data: event.data };
    })
    .catch(error => {
      console.log('Error: ', error);
      return { error: error };
    });

  // Pass updated object to DB for creation/update of DB entry
  return returnObject;
}
