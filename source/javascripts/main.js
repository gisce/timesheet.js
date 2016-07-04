/* global Lib, Timesheet */

(function(){
  'use strict';
  
  Lib.ready(function() {
    console.log('ads');
    
    /* jshint -W031 */
    new Timesheet('timesheet', 1990, 2016, 600, 2, '-', [
     ['1990-07-01', '2010-05-31', '1', 'default'],
     ['2010-06-01', '2013-05-31', '2', 'lorem'],
     ['2013-06-01', '2014-10-31', '3', 'ipsum'],
     ['2014-11-01', '2015-09-30', '4', 'dolor'],
     ['2015-10-01', '2016-09-30', '5', 'sit'],
    ]);

    document.querySelector('#switch-dark').addEventListener('click', function() {
      document.querySelector('body').className = 'index black';
    });

    document.querySelector('#switch-light').addEventListener('click', function() {
      document.querySelector('body').className = 'index white';
    });
  });
})();
