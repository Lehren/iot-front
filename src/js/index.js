global.jQuery = require('jquery');
const $ = global.jQuery;
require('bootstrap');
require('bootstrap-toggle');
require('bootstrap-progressbar/bootstrap-progressbar.js');
const json = require('json-string');
const iot = require('iot-js-sdk');
const settings = require('../settings/settings.json');
const conn = new iot.Connection(settings);
const containerHandler = new iot.ContainerController(conn);
const containerMarkerDict = {};
let containerArray = [];
let directionsService;
let markersOnMap = [];
let infoWindow;
let currentPos;
function getLocation() {
  infoWindow = new google.maps.InfoWindow({
    maxWidth: 300
  });
  directionsService = new google.maps.DirectionsService;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(initMap);
  } else {
    $('#google-map').html("Geolocation is not supported by this browser.");
  }
}

function getNearContainers() {
  return containerHandler.getContainersNearMe(currentPos.coords.latitude, currentPos.coords.longitude)
    .then(containers => {
      containerArray = [];
      containers.map(container => {
        containerArray.push(container);
      })
    })
    .catch(error => {
      console.debug('Caught error', error);
    });
}

function getAllContainers() {
  return containerHandler.getAllContainers()
    .then(containers => {
      containerArray = [];
      containers.map(container => {
        containerArray.push(container);
      })
    })
    .catch(error => {
      console.debug('Caught error', error);
    });
}
function putContainerMarkers() {
  markersOnMap.map(marker => {
    marker.setMap(null);
  });
  markersOnMap = [];
  containerArray.map(container => {
    const contentString = `
      <div id="content">
      <div id="siteNotice">
      </div>
      <p id="container-id"><strong>${container.id}</strong></p>
      <hr/>
      <div id="bodyContent">
      <p>
      <strong>Coordinates:</strong> ${container.latitude}, ${container.longitude}
      </p>
      <p>
      <strong>FillLevel:</strong> ${container.fillLevel}%
      </p>
      <form id='map-form'>
      Email: <input id="input-email" type="text"/>
      <input id="input-id" type="text" value=${container.id} hidden>
      <input type="submit" id='map-submit' value='Subscribe'/>
      </form>
      </div>
      </div>
      `;
    const marker = new google.maps.Marker({
      position: {lat: container.latitude, lng: container.longitude},
      map: window.googleMap,
      title: container.id,
      icon: getColorForPercentage(container.fillLevel)
    });
    marker.addListener('click', function () {
      infoWindow.setContent(contentString);
      infoWindow.open(window.googleMap, marker);
    });
    markersOnMap.push(marker);
    containerMarkerDict.container = marker;
  });
}

function initMap(position) {
  currentPos = position;
  return new Promise((resolve) => {
    const mapCanvas = document.getElementById('google-map');
    const mapOptions = {
      center: new google.maps.LatLng(currentPos.coords.latitude, currentPos.coords.longitude),
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    window.googleMap = new google.maps.Map(mapCanvas, mapOptions);
    resolve();
  });
}

function setupEnvironment() {
  const homeButton = $('#home-button');
  const containerButton = $('#containers-button');
  const overviewButton = $('#overview-button');
  const routeButton = $('#calc-route-button');
  google.maps.event.addDomListener(window, 'load', () => {
    getLocation();
    homeButton.click(() => {
      homeButton.addClass('active');
      containerButton.removeClass('active');
      overviewButton.removeClass('active');

      $('#home-div').show();
      $('#map-div').hide();
      $('#route-button-div').hide();
    });
    containerButton.click(() => {
      containerButton.addClass('active');
      homeButton.removeClass('active');
      overviewButton.removeClass('active');

      $('#home-div').hide();
      $('#map-div').show(0, () => {
        const center = window.googleMap.getCenter();
        google.maps.event.trigger(window.googleMap, 'resize');
        window.googleMap.setCenter(center);
        return getNearContainers()
          .then(putContainerMarkers)
          .catch(error => {
            console.debug('Caught error', error);
          });
      });
      $('#route-button-div').hide();
    });
    overviewButton.click(() => {
      overviewButton.addClass('active');
      homeButton.removeClass('active');
      containerButton.removeClass('active');

      $('#home-div').hide();
      $('#map-div').show(0, () => {
        const center = window.googleMap.getCenter();
        google.maps.event.trigger(window.googleMap, 'resize');
        window.googleMap.setCenter(center);
        return getAllContainers()
          .then(putContainerMarkers)
          .catch(error => {
            console.debug('Caught error', error);
          });
      });
      $('#route-button-div').show();
    });
    $(document).on('submit', '#map-form', () => {
      containerHandler.subscribeToContainer($('#input-id').val(), $('#input-email').val());
    });
    routeButton.click(() => {
      calculateRoute()
    });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  setupEnvironment();
});

function getColorForPercentage(pct) {
  if (pct > 50 && pct < 80) {
    return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
  }
  else if (pct > 80 && pct <= 100) {
    return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
  else return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
}

function calculateRoute() {
  const cordsArray = markersOnMap.map(mark => {return {location: mark.position}});
  directionsService.route({
    origin: markersOnMap[0].position,
    destination: markersOnMap[0].position,
    waypoints: cordsArray,
    optimizeWaypoints: true,
    travelMode: 'DRIVING'
  }, function (response, status) {
    // Route the directions and pass the response to a function to create
    // markers for each step.
    if (status === 'OK') {
      new google.maps.DirectionsRenderer({
        map: window.googleMap,
        directions: response,
        suppressMarkers: true,
        suppressInfoWindows: true
      });
      console.debug('kurwa', response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}



