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
const cont1 = {
  id: "1",
  fillLevel: 20
};
const cont2= {
  id: "2",
  fillLevel: 10
};
const cont3 ={
  id: "3",
  fillLevel: 50
};
const containers = [cont1,cont2,cont3];
document.addEventListener('DOMContentLoaded', () => {
  drawContainers();
  setInterval(updateContainers, 5000);
  setInterval(() =>{
    if(cont1.fillLevel >= 90){cont1.fillLevel = 0}
    if(cont2.fillLevel >= 90){cont2.fillLevel = 0}
    if(cont3.fillLevel >= 90){cont3.fillLevel = 0}
    cont1.fillLevel = cont1.fillLevel + 5;
    cont2.fillLevel += 8;
    cont3.fillLevel += 3;
  }, 3000);
});

function drawContainers() {
  containers.map(v => {
      const containerClass = new ProgressComponent(v.id);
      const drawnContainer = containerClass.draw();
      const bootstrapBar = $(drawnContainer.firstChild.firstChild);
      containerDict[v.id] = bootstrapBar;
      const IDtext = document.createElement('div');
      IDtext.innerHTML = v.id;
      $(drawnContainer).append(IDtext);
      $("#content").append(drawnContainer);
      updateContainers();
    });
}

function updateContainers() {
  return containers.map(v => {
      const bar = $(containerDict[v.id]);
      bar.attr('data-transitiongoal', v.fillLevel).progressbar({display_text: 'center'});
    });
}


