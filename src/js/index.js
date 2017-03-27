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
    .then(data => {
      data.map(dataEntry => {
        const bar = $(containerDict[dataEntry.id]);
        bar.css('background-color', getColorForPercentage(dataEntry.fillLevel / 100));
        bar.attr('data-transitiongoal', dataEntry.fillLevel).progressbar({display_text: 'center'});
      });
      fillJsonPanel($("#json-panel"), data);
    });
}

const percentColors = [
  {pct: 0.0, color: {r: 0, g: 255, b: 0}},
  {pct: 0.5, color: {r: 255, g: 255, b: 0}},
  {pct: 1.0, color: {r: 255, g: 0, b: 0}}];

function getColorForPercentage(pct) {
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
  // or output as hex if preferred
}


