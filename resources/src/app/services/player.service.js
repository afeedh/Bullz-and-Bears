(function() {

  'use strict';

  var services = angular.module('AppServices');

  services.factory('PlayerService', function($resource) {
    return $resource('./api/player', {}, {
      get: {
        method: 'POST',
        cache: false,
        isArray: false
      },
      getTimeLeft : {
          method: 'GET',
          cache: false,
          isArray: false,
          url : './api/secsleft'
      }


    });
  });


})();
