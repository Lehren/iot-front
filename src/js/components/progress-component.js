global.jQuery = require('jquery');
const $ = global.jQuery;

module.exports = class ProgressComponent {

  constructor(containerId) {
    this.containerId = containerId;
  }

  /**
   * Draw
   * <div class="progress vertical bottom" >
   *    <div class="progress-bar" role="progressbar" data-transitiongoal="0"></div>
   * </div>
   */
  draw() {
    const rowContainer = document.createElement('div');
    rowContainer.className = 'row progress-row';

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress vertical bottom';

    const progressBar = document.createElement('div');
    progressBar.id = 'iot-container-' + this.containerId;
    progressBar.className = 'progress-bar';
    progressBar.role = 'progressbar';
    $(progressBar).attr('data-transitiongoal', 0);

    rowContainer.appendChild(progressContainer);
    progressContainer.appendChild(progressBar);
    return rowContainer;
  }
};
