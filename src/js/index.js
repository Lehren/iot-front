global.jQuery = require('jquery');
const $ = global.jQuery;
require('bootstrap');
require('bootstrap-toggle');
require('bootstrap-progressbar/bootstrap-progressbar.js');
const iot = require('iot-js-sdk');
const settings = require('../settings/settings.json');
const ProgressComponent = require('./components/progress-component');

const conn = new iot.Connection(settings);
const fillLevelHandler = new iot.FillLevelController(conn);
const containerDict = {};

document.addEventListener('DOMContentLoaded', () => {
  drawContainers();
  setInterval(updateContainers, 5000);
});

function drawContainers() {
  fillLevelHandler.getFillLevels()
    .then(fillLevel => fillLevel.map(v => {
      const containerClass = new ProgressComponent(v.id);
      const drawnContainer = containerClass.draw();
      containerDict[v.id] = $(drawnContainer.firstChild.firstChild);
      const IDtext = document.createElement('div');
      IDtext.innerHTML = v.id;
      $(drawnContainer).append(IDtext);
      $("#content").append(drawnContainer);
      updateContainers();
    }));
}

function updateContainers() {
  return fillLevelHandler.getFillLevels()
    .then(fillLevel => fillLevel.map(v => {
      const bar = $(containerDict[v.id]);
      bar.attr('data-transitiongoal', v.fillLevel).progressbar({display_text: 'center'});
    }));
}


