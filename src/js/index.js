global.jQuery = require('jquery');
const $ = global.jQuery;
require('bootstrap');
require('bootstrap-toggle');
require('bootstrap-progressbar/bootstrap-progressbar.js');
const iot = require('iot-js-sdk');
const settings = require('../settings/settings.json');

document.addEventListener('DOMContentLoaded', () => {

  $('.progress .progress-bar').progressbar({display_text: 'fill'});
  const conn = new iot.Connection(settings);
  const fillLevelHandler = new iot.FillLevelController(conn);
  const toggle = $('#toggle-one');
  toggle.bootstrapToggle();
  toggle.change(() => {
    fillLevelHandler.getFillLevel('1')
      .then(result => {
        console.debug('result', result);
        const $pb = $('.progress .progress-bar');
        $pb.attr('data-transitiongoal', result.fillLevel).progressbar({display_text: 'fill'});
      })
      .catch(error => {
        console.debug('error', error);
      });
  });
});

