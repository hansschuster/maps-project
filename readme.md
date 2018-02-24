# Maps Project [Udacity FSND](https://www.udacity.com/course/full-stack-web-developer-nanodegree--nd004)

Building a single page app with a map of a neighborhood, including
functionality like highlighted locations, third-party data about places and
a list view with filter function. The result can be seen here:
[maps-project.netlify.com](https://maps-project.netlify.com/).

## Setup

- make sure [node.js](http://nodejs.org) is at version >= `6`
- `npm i spike -g`
- clone this repo down and `cd` into the folder
- run `npm install`
- run `spike watch` or `spike compile`

## Build with:

- [Google Maps API](https://developers.google.com/maps/) for map, markers
  and so on
- [Foursquare Places API](https://developer.foursquare.com/places-api) for
  data and images of places
- [Knockout.js](http://knockoutjs.com/index.html) as MVVM framework
- [Spike](https://www.spike.cf/) as Static Site Generator
- [GraphCool](https://www.graph.cool/) as BaaS and GraphQL backend development
  framework
- [Netlify](https://www.netlify.com/) for easy continuous deployment
- [Serverless Framework](https://serverless.com/) with
  [AWS](https://aws.amazon.com/) to schedule update of GraphCool backend via
  serverless function

## Spike file structure

- Client-side JavaScript, CSS and images can be found in `assets/`
- HTML can be found in `views/`
- The completed build can be found in `public/`
- `app.js` includes the configuration for spike (Thin layer above webpack
  configuration)

## Backend / Foursquare API

[GraphCool](https://www.graph.cool/) is used to save the Foursquare places data
in a GraphQL database. GraphCool uses a serverless function to fetch data from
the Foursquare API. This function gets called when a place is updated or
added to the database. Another scheduled serverless function from AWS
(Serverless Framework) triggers an update for all Fourquare places every 6
hours. This in return triggers GraphCool's serverless function to fetch data
from the Foursquare API. (Scheduled function invocation is not possible in
GraphCool alone)

## Notes on GraphCool

- Serverless function to fetch data can be found in
  `graphcool/src/fetch-foursquare.js`
- Data model can be found in `graphcool/types.graphql`
- `graphcool__no-secrets.yml` has been included instead of
  `graphcool.yml` to not store any secrets on GitHub

## Notes on Serverless Framework

- Function that triggers GraphCool update of Foursquare places can be found in
  `serverless/handler.js`
- `serverless__no-secrets.yml` has been included instead of `serverless.yml`
  to not store any secrets on GitHub
