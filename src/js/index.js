global.jQuery = require('jquery');
const $ = global.jQuery;
require('bootstrap');
require('bootstrap-toggle');
require('bootstrap-progressbar/bootstrap-progressbar.js');
require('./jquery.timer');
require('chart.js');
const json = require('json-string');
const iot = require('iot-js-sdk');
const settings = require('../settings/settings.json');
const conn = new iot.Connection(settings);
const containerHandler = new iot.ContainerController(conn);
const historyHandler = new iot.HistoryController(conn);
let containerMarkerDict = [];
let containerArray = [];
let directionsService;
let markersOnMap = [];
let infoWindow;
let currentPos;
let chartCounter = 0;
let lastTimeStamp;

let nearContainerInterval = $.timer(function () {
  return getNearContainers();
  //.then(putContainerMarkers);
}, 2000, false);

let allContainerInterval = $.timer(function () {
  return getAllContainers();
  //.then(putContainerMarkers);
}, 2000, false);

function getLocation() {
  return new Promise((resolve, reject) => {
    infoWindow = new google.maps.InfoWindow({
      maxWidth: 300
    });
    directionsService = new google.maps.DirectionsService;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(resolve);
    } else {
      $('#google-map').html("Geolocation is not supported by this browser.");
    }
  })
    .then(position => {
      initMap(position);
      return Promise.resolve();
    });
}

function getNearContainers() {
  return containerHandler.getContainersNearMe(currentPos.coords.latitude, currentPos.coords.longitude)
    .then(containers => {
      containerArray = [];
      containers.map(container => {
        if (container.id === "prototype_container1") {
          if (container.lastUpdated !== lastTimeStamp) {
            lastTimeStamp = container.lastUpdated;
            addData(window.localChart, chartCounter++, container.fillLevel);
          }
          const bar = $('#local-container');
          bar.css('background-color', getColorMapForPercentage(container.fillLevel / 100));
          bar.attr('data-transitiongoal', container.fillLevel).progressbar({display_text: 'fill'});
        }
        containerArray.push(container);
      });
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
        if (container.id === "prototype_container1") {
          if (container.lastUpdated !== lastTimeStamp) {
            lastTimeStamp = container.lastUpdated;
            addData(window.localChart, chartCounter++, container.fillLevel);
          }
          const bar = $('#local-container');
          bar.css('background-color', getColorMapForPercentage(container.fillLevel / 100));
          bar.attr('data-transitiongoal', container.fillLevel).progressbar({display_text: 'fill'});
        }
        containerArray.push(container);
      })
    })
    .catch(error => {
      console.debug('Caught error', error);
    });
}
function putContainerMarkers() {
  containerMarkerDict = [];
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
      <strong>Email:</strong> <input id="input-email" type="text"/>
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
    containerMarkerDict.push({marker: marker, container: container});
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
  const localContainerButton = $('#local-container-button');
  const routeButton = $('#calc-route-button');
  google.maps.event.addDomListener(window, 'load', () => {
    getLocation()
      .then(() => {
        nearContainerInterval.play();
        homeButton.click(() => {
          homeButton.addClass('active');
          containerButton.removeClass('active');
          overviewButton.removeClass('active');
          localContainerButton.removeClass('active');

          $('#home-div').show();
          $('#map-div').hide();
          $('#route-button-div').hide();
          $('#local-container-div').hide();
        });
        containerButton.click(() => {
          containerButton.addClass('active');
          homeButton.removeClass('active');
          overviewButton.removeClass('active');
          localContainerButton.removeClass('active');

          $('#home-div').hide();
          $('#local-container-div').hide();
          $('#map-div').show(0, () => {
            const center = window.googleMap.getCenter();
            google.maps.event.trigger(window.googleMap, 'resize');
            window.googleMap.setCenter(center);
            allContainerInterval.stop();
            getNearContainers()
              .then(putContainerMarkers)
              .then(() => {
                nearContainerInterval.play(true)
              });
          });
          $('#route-button-div').hide();
          window.directionsDisplay.setDirections({routes: []});
        });
        overviewButton.click(() => {
          overviewButton.addClass('active');
          homeButton.removeClass('active');
          containerButton.removeClass('active');
          localContainerButton.removeClass('active');

          $('#home-div').hide();
          $('#local-container-div').hide();
          $('#map-div').show(0, () => {
            const center = window.googleMap.getCenter();
            google.maps.event.trigger(window.googleMap, 'resize');
            window.googleMap.setCenter(center);
            nearContainerInterval.stop();
            getAllContainers()
              .then(putContainerMarkers)
              .then(() => {
                allContainerInterval.play(true);
              });
          });
          $('#route-button-div').show();
        });

        localContainerButton.click(() => {
          localContainerButton.addClass('active');
          overviewButton.removeClass('active');
          homeButton.removeClass('active');
          containerButton.removeClass('active');

          $('#home-div').hide();
          $('#map-div').hide();
          $('#route-button-div-div').hide();
          $('#local-container-div').show();
        });

        $(document).on('submit', '#map-form', () => {
          containerHandler.subscribeToContainer($('#input-id').val(), $('#input-email').val());
        });
        routeButton.click(() => {
          calculateRoute();
        });

        window.directionsDisplay = new google.maps.DirectionsRenderer({
          map: window.googleMap,
          suppressMarkers: true,
          suppressInfoWindows: true
        });

        const ctx = document.getElementById("chart").getContext('2d');
        window.localChart = new Chart(ctx, {
          type: 'line',
          responsive: true,
          data: {
            datasets: [{
              label: 'Fill level',
              data: [80, 40],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255,99,132,1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
          }
        });

        return getAllContainers()
          .then(putContainerMarkers)
          .then(getHistoryOfLocalContainer);
      });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  setupEnvironment();
});

function getHistoryOfLocalContainer() {
  return historyHandler.getHistory("prototype_container1")
    .then(historyArray => historyArray.map(historyEntry => {
      addData(window.localChart, chartCounter++, historyEntry.fillLevel);
    }));
}

function getColorForPercentage(pct) {
  if (pct > 50 && pct < 80) {
    return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
  }
  else if (pct > 80 && pct <= 100) {
    return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
  else return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
}

const percentColors = [
  {pct: 0.0, color: {r: 0, g: 255, b: 0}},
  {pct: 0.5, color: {r: 255, g: 165, b: 0}},
  {pct: 1.0, color: {r: 255, g: 0, b: 0}}];

function getColorMapForPercentage(pct) {
  let i;
  for (i = 1; i < percentColors.length - 1; i++) {
    if (pct < percentColors[i].pct) {
      break;
    }
  }
  const lower = percentColors[i - 1];
  const upper = percentColors[i];
  const range = upper.pct - lower.pct;
  const rangePct = (pct - lower.pct) / range;
  const pctLower = 1 - rangePct;
  const pctUpper = rangePct;
  const color = {
    r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
    g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
    b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
  };
  return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
}

function calculateRoute() {
  const cordsArray = [];
  markersOnMap.map(mark => {
    containerMarkerDict.map(entry => {
      if (entry.marker.title === mark.title) {
        if (entry.container.fillLevel > 50) {
          cordsArray.push({location: mark.position});
        }
      }
    });
  });

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
      window.directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}

function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
}



