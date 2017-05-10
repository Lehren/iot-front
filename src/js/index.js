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
const containersNearMe = [];
const markersOnMap = [];
let infoWindow;
function getLocation() {
  infoWindow = new google.maps.InfoWindow({
    maxWidth: 300
  });
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(initMap);
  } else {
    $('#google-map').html("Geolocation is not supported by this browser.");
  }
}

function getNearContainers(position) {
  return containerHandler.getContainersNearMe(position.coords.latitude, position.coords.longitude)
    .then(containers => {
      containers.map(container => {
        containersNearMe.push(container);
      })
    })
    .catch(error => {
      console.debug('Caught error', error);
    });
}
function putContainerMarkers() {
  $(document).on('submit', '#map-form', () =>{
    containerHandler.subscribeToContainer($('#input-id').val(), $('#input-email').val());
    //return false;
  });
  containersNearMe.map(container => {
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
  return new Promise((resolve) => {
    const mapCanvas = document.getElementById('google-map');
    const mapOptions = {
      center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    window.googleMap = new google.maps.Map(mapCanvas, mapOptions);
    resolve();
  }).then(() => getNearContainers(position))
    .then(() => {
      putContainerMarkers();
    })
    .catch(error => {
      console.debug('Caught error', error);
    });
}

function pollContainers() {

}

function setupEnvironment() {
  google.maps.event.addDomListener(window, 'load', getLocation);
  setInterval(() => {
    pollContainers()
  }, 3000);
  const homeButton = $('#home-button');
  const containerButton = $('#containers-button');
  const overviewButton = $('#overview-button');
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
    });
    $('#route-button-div').show();
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


