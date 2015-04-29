/* @preserve
 *
 * angular-slidezilla
 * https://github.com/itslenny/angular-slidezilla
 *
 * Version: 0.1.3 - 02/21/2015
 * License: MIT
 */

'use strict';

//init module
angular.module('angular-slidezilla', [])

  //config
    .constant('angularSlidezillaConfig', {
      min: 0,
      max: 100,
      step: 5
    })

  //controller
    .controller('AngularSlidezillaController', ['angularSlidezillaConfig', '$scope', function (angularSlidezillaConfig, $scope) {
      //set default scope values
      $scope.min = angularSlidezillaConfig.min || 0;
      $scope.max = angularSlidezillaConfig.max || 100;
      $scope.step = angularSlidezillaConfig.step || 5;
    }])

  //slider directive
    .directive('slider', function () {
      return {
        scope: {
          'model': '=ngModel',
          'handleColor': '='
        },
        restrict: 'E',
        require: ['ngModel'],
        controller: 'AngularSlidezillaController',
        link: function (scope, element, attrs, ctrls) {

          scope.handleStyle = {'background-color':scope.handleColor, left: 0};
          var unbind = scope.$watch('handleColor', function(){
            scope.handleStyle['background-color'] = scope.handleColor;
          });
          scope.$on('$destroy', unbind);

          //process attributes and watch for changes
          if (attrs.min) {
            scope.min = scope.$parent.$eval(attrs.min);
            scope.$parent.$watch(attrs.min, function (newVal) {
              scope.min = newVal;
              ctrls[0].$render();
            });
          }
          if (attrs.max) {
            scope.max = scope.$parent.$eval(attrs.max);
            scope.$parent.$watch(attrs.max, function (newVal) {
              scope.max = newVal;
              ctrls[0].$render();
            });
          }
          if (attrs.step) {
            scope.step = scope.$parent.$eval(attrs.step);
            scope.$parent.$watch(attrs.step, function (newVal) {
              scope.step = newVal;
              ctrls[0].$render();
            });
          }

          //init dom objects
          var handles = element[0].querySelectorAll('.slider-handle');
          var track = element[0].querySelector('.slider-track');
          var selection = element[0].querySelector('.slider-selection');

          //drag state variable
          var dragging = false;

          //// model -> UI ////////////////////////////////////
          ctrls[0].$render = function () {
            var hPos1, hPos2;
            //ensure model value is in range
            clampModelValue();
            //update view value
            ctrls[0].$setViewValue(scope.model);
            //update display to match model value
            hPos1 = 0;
            hPos2 = 100 / (scope.max - scope.min) * (scope.model - scope.max) + 100;
            scope.handleStyle.left = hPos2 + '%';
            angular.element(selection).css('left', hPos1 + '%').css('width', (hPos2 - hPos1 + 1) + '%');
          };


          //// ui->model ////////////////////////////////////

          //bind mouse down event (track) - increment by step
          angular.element(track).bind('mousedown', function (e) {
            e.preventDefault();
            if (dragging) return;
            var newVal = parseInt(scope.model);
            var offsetX = e.offsetX || e.layerX;

            if (offsetX > handles[0].offsetLeft) {
              newVal += scope.step;
            } else {
              newVal -= scope.step;
            }
            scope.$apply(function () {
              scope.model = newVal;
              ctrls[0].$render();
            });
          });

          // Bind mousedown event (drag handles) -- start drag
          angular.element(handles).bind('mousedown', function (e) {
            e.preventDefault();
            //store data about currently dragging handle
            dragging = {
              sx: e.clientX - e.target.offsetLeft,
              sy: e.clientY - e.target.offsetTop,
              w: e.target.offsetWidth,
              h: e.target.offsetHeight,
              element: e.target,
              index: e.target == 0,
              container: e.target.parentElement.getBoundingClientRect()
            };

            //listen for movement / mouse up
            angular.element(document).bind('mousemove', mousemove);
            angular.element(document).bind('mouseup', mouseup);
          });

          // mousemove event (document) -- update drag handle to position
          function mousemove(e) {
            if (!dragging) return;
            dragging.y = e.clientY - dragging.sy;
            dragging.x = e.clientX - dragging.sx;
            //contain drag within track
            if (dragging.x < 0) {
              dragging.x = 0;
            } else if (dragging.x > dragging.container.right - dragging.container.left) {
              dragging.x = dragging.container.right - dragging.container.left;
            }

            //compute slider value based on handle position
            var percentVal = Math.max(0, Math.min(100, parseInt((dragging.x / (dragging.container.right - dragging.container.left)) * 100)));
            var normalizedVal = ((percentVal / 100) * (scope.max - scope.min)) + scope.min;
            normalizedVal = parseFloat(normalizedVal.toFixed(3));
            var rounded = roundToStep(normalizedVal, scope.step);
            //pass value to model
            scope.$apply(function () {
              scope.model = rounded;
              ctrls[0].$render();
            });
          }

          // mouse up event (document) -- stop drag
          function mouseup(e) {
            angular.element(document).unbind('mousemove', mousemove);
            angular.element(document).unbind('mouseup', mouseup);
            dragging = false;
          }


          //// helpers ////////////////////////////////////

          //rounds value to step
          function roundToStep(val, step) {
            return (val >= 0 ) ? val + step / 2 - (val + step / 2) % step : val - step / 2 - (val + step / 2) % step;
          }

          //clamps model values. Keeps sliders within track and keeps them in index order
          function clampModelValue() {
            if (scope.model > scope.max) {
              scope.model = scope.max;
            } else if (scope.model < scope.min) {
              scope.model = scope.min;
            }
          }

          ctrls[0].$render();
        },
        template: '<div class="slider-container">'
          //+ '<div class="slider-cell">{{min}}</div>'
        + '<div class="slider-cell slider-spacer-left"></div>'
        + '<div class="slider-cell slider slider-horizontal">'
        + '<div class="slider-track">'
        + '<div class="slider-selection"></div>'
        + '<div ng-style="handleStyle" class="slider-handle">{{model}}</div>'
        + '</div>'
        + '</div>'
        + '<div style="min-width:{{10 * max.toString().length}}px;" class="slider-cell"></div>'
          //+ '<div class="slider-cell">{{max}}</div>'
          //+ '<input type="text"ng-model="model" class="form-control slider-cell slider-input"/>'
        + '</div>',
        replace: true
      };
    });
