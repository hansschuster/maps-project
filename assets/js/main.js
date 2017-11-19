/* global google */
import * as ko from 'knockout/build/output/knockout-latest'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'

// Foursquare Client ID
const fsClientId = 'QSFH1BQ4KIIKNJCJWQIHNUF4WFHS2YSMPQU2SWS51LVNSM4O'

// Initialise Apollo Client for GraphCool API (our backend)
const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.graph.cool/simple/v1/cja5eo2br00300181q6fvklxm'
  }),
  cache: new InMemoryCache()
})
// Send request for Foursquare places to GraphCool API
// Store promise for later use
const query = gql`
  {
    allFoursquarePlaces {
      name
      fsId
      photo300
      url
      rating
      hours
      location
    }
  }
`
let responsePromise = apolloClient.query({ query: query })

// Invoke initViewModel only when Google Maps API has finished loading
let initViewModel = function () {
  // Define class for Foursquare places
  let Place = function (data) {
    let self = this
    this.name = data.name // String
    this.fsId = data.fsId // String: Foursquare ID
    this.photo300 = data.photo300 // String: Photo url 300x300
    this.url = data.url + '?ref=' + fsClientId // String: Url to Foursquare page + Client ID
    this.rating = data.rating // Float
    this.hours = data.hours ? data.hours : [] // Array: Human readable opening hours
    this.location = data.location // Object: lat and lng Floats
    this.gMapsMarker = new google.maps.Marker({
      position: {
        lat: self.location.lat,
        lng: self.location.lng
      },
      map: appViewModel.map,
      title: self.name,
      animation: google.maps.Animation.DROP
    })
    // Controls visibility of place in list and as map marker
    this.visible = ko.computed(function () {
      let match = appViewModel.regExpFilter().test(self.name)
      if (match && !self.gMapsMarker.getMap()) {
        self.gMapsMarker.setMap(appViewModel.map)
      } else if (!match) {
        self.gMapsMarker.setMap(null)
      }
      return match
    })
    // Select place when clicking on respective marker
    this.gMapsMarker.addListener('click', function () {
      appViewModel.selectPlace(self)
    })
  }

  // ViewModel for the complete app
  let AppViewModel = function () {
    let self = this

    // Knockout Variables
    self.places = ko.observableArray([])
    self.filter = ko.observable('')
    self.selectedPlaceFsId = ko.observable('')
    self.regExpFilter = ko.computed(function () {
      return new RegExp(self.filter(), 'i')
    })
    self.sidebarOpen = ko.observable(false)

    // Set Up Elements for Info Window
    self.infoElem = document.createElement('div')
    self.infoElem.setAttribute('class', 'info-window-custom')
    self.infoHeadingElem = document.createElement('h3')
    self.infoTextElem = document.createElement('p')
    self.imgElem = document.createElement('img')
    self.imgElem.setAttribute('width', '300')
    self.imgElem.setAttribute('height', '300')
    self.loaderElem = document.createElement('div')
    self.loaderElem.setAttribute('class', 'info-window-loader')
    self.imgElem.addEventListener('load', function () {
      self.loaderElem.style.display = 'none'
    })
    self.hoursElem = document.createElement('ul')
    self.linkElem = document.createElement('a')
    self.linkElem.innerText = 'Visit on Foursquare'
    self.linkElem.setAttribute('target', '_blank')
    self.poweredByElem = document.createElement('img')
    self.poweredByElem.setAttribute('width', '210')
    self.poweredByElem.setAttribute('height', '35')
    self.poweredByElem.setAttribute('src',
      'img/powered-by-foursquare-one-color.png')
    self.infoElem.appendChild(self.infoHeadingElem)
    self.infoElem.appendChild(self.infoTextElem)
    self.infoElem.appendChild(self.imgElem)
    self.infoElem.appendChild(self.loaderElem)
    self.infoElem.appendChild(self.hoursElem)
    self.infoElem.appendChild(self.linkElem)
    self.infoElem.appendChild(self.poweredByElem)

    // Operations
    self.openInfoWindow = function (place) {
      self.infoHeadingElem.textContent = place.name
      self.infoTextElem.textContent = 'Rating: ' +
        (place.rating ? place.rating : '-') + '/10'
      self.imgElem.setAttribute('src', '')
      self.loaderElem.style.display = 'block'
      self.imgElem.setAttribute('src', place.photo300)
      self.hoursElem.innerHTML = ''
      for (let i = 0; i < place.hours.length; i++) {
        self.hoursElem.innerHTML += '<li>' + place.hours[i] + '</li>'
      }
      self.linkElem.setAttribute('href', place.url)
      self.infoWindow.open(self.map, place.gMapsMarker)
    }
    self.animateMarker = function (place) {
      let marker = place.gMapsMarker
      marker.setAnimation(4) // Not officially documented, but works. Might not want to use in production.
    }
    self.selectPlace = function (place) {
      self.selectedPlaceFsId(place.fsId)
      self.animateMarker(place)
      self.openInfoWindow(place)
    }
    self.toggleSidebarOpen = function () {
      self.sidebarOpen(!self.sidebarOpen())
    }

    // Initialise map
    self.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 47.265739, lng: 11.394169},
      zoom: 14
    })
    // Use the same infoWindow for all markers (change content in infoElem)
    self.infoWindow = new google.maps.InfoWindow({
      content: self.infoElem
    })

    // Use promise from API call after ViewModel is set up
    // Create Place instances and populate places Array
    responsePromise
      .then(response => {
        for (let i = 0; i < response.data.allFoursquarePlaces.length; i++) {
          let place = response.data.allFoursquarePlaces[i]
          self.places.push(
            new Place({
              name: place.name,
              fsId: place.fsId,
              photo300: place.photo300,
              url: place.url,
              rating: place.rating,
              hours: place.hours,
              location: place.location
            })
          )
        }
      })
      .catch(reason => {
        console.log(reason)
        window.alert('Places could not be loaded. Please try to reload page.')
      })
  }

  // Apply bindings of ViewModel
  // View = complete document (because no root element is specified)
  let appViewModel = new AppViewModel()
  ko.applyBindings(appViewModel)
}

// Wait (Check) for Google Maps API to load
// When Maps API is ready call initViewModel
if (typeof google === 'undefined') {
  document.getElementById('maps-script').addEventListener('load',
    initViewModel)
  if (typeof google !== 'undefined') {
    initViewModel()
  }
} else {
  initViewModel()
}
