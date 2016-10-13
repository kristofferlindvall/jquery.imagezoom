// Github repo: https://github.com/jansson/jquery.imagezoom

(function ($) {

  $.fn.zoom = function (action) {
    var touchStateKey = 'zoomTouchState';

    var mouseMoveHandler = function (e) {
      e.stopPropagation();
      
      var $mouseZoom = $(this).find('.jsZoomMouse');
      var $image = $(this).find('img');

      loadHqImage($(this));

      $image.css({ visibility: 'visible' });
      resetTouch($(this));

      var offset = $(this).offset();
      var x = e.pageX - offset.left;
      var y = e.pageY - offset.top;

      if (x < 0 || x > $(this).width() ||
        y < 0 || y > $(this).height()) {
        $mouseZoom.hide();
        return;
      }

      $mouseZoom.css({
        'top': y - ($mouseZoom.height() / 2),
        'left': x - ($mouseZoom.width() / 2),
        'background-position': (x / $(this).width() * 100) + '% ' + (y / $(this).height() * 100) + '%',
        'background-size': ($(this).width() * 6) + 'px ' + ($(this).height() * 6) + 'px'
      });
      
      // Make sure this is the only zoom shown on page (in case there are multiple pages)
      $('.jsZoomMouse').hide();
      $mouseZoom.show();
    };
    
    var touchStartHandler = function (e) {
      var $container = $(this);
      var $image = $(this).find('img');
      var $mouseZoom = $(this).find('.jsZoomMouse');
      var offset = $container.offset();
      var touchState = $container.data(touchStateKey);
      
      loadHqImage($container);
      
      $mouseZoom.hide();
      $image.css({ visibility: 'hidden' });
      
      if (e.originalEvent.touches.length == 2) {
        
        $image.css({ visibility: 'hidden' });

        touchState.startPinch = distance(
          toPoint(e.originalEvent.touches[0]),
          toPoint(e.originalEvent.touches[1])
          );

        touchState.startPan = toPoint(
          e.originalEvent.touches[0].pageX - offset.left,
          e.originalEvent.touches[0].pageY - offset.top
          );
        touchState.startZoom = touchState.currentZoom;
        
      } else if (e.originalEvent.touches.length == 1) {
        
        touchState.startPan = toPoint(
          e.originalEvent.touches[0].pageX - offset.left,
          e.originalEvent.touches[0].pageY - offset.top
          );
        touchState.startPosition = copyPoint(touchState.currentPosition);
        
      }
      
      applyTouch($container);
    };
    
    var touchEndHandler = function (e) {
      var $container = $(this);
      var offset = $container.offset();
      var touchState = $container.data(touchStateKey);
      
      // Prevent touch from simulating mouseclick/move
      if (e.cancelable) {
        e.preventDefault();
      }
      
      if (e.originalEvent.touches.length == 1) {
        
        touchState.startPan = toPoint(
          e.originalEvent.touches[0].pageX - offset.left,
          e.originalEvent.touches[0].pageY - offset.top
          );
        touchState.startPosition = copyPoint(touchState.currentPosition);
        
      }
      
      applyTouch($container);
    };
    
    var touchMoveHandler = function (e) {
      var $container = $(this);
      var $mouseZoom = $(this).find('.jsZoomMouse');
      var $image = $(this).find('img');
      var touchState = $container.data(touchStateKey);
      var offset = $container.offset();
      var originalPosition = copyPoint(touchState.currentPosition);
      
      var currentPan = toPoint(
          e.originalEvent.touches[0].pageX - offset.left,
          e.originalEvent.touches[0].pageY - offset.top
          );

      if (e.originalEvent.touches.length == 2) {

        var preZoom = toPoint(
          (touchState.currentPosition.x + currentPan.x) / ($container.width() * touchState.currentZoom),
          (touchState.currentPosition.y + currentPan.y) / ($container.height() * touchState.currentZoom)
          );

        var dst = distance(toPoint(e.originalEvent.touches[0]), toPoint(e.originalEvent.touches[1]));

        touchState.currentZoom = touchState.startZoom * (dst / touchState.startPinch);
        if (touchState.currentZoom < 1) {
          touchState.currentZoom = 1;
        }
        if (touchState.currentZoom > 10) {
          touchState.currentZoom = 10;
        }

        touchState.currentPosition = toPoint(
          preZoom.x * $container.width() * touchState.currentZoom - currentPan.x,
          preZoom.y * $container.height() * touchState.currentZoom - currentPan.y
          );

      } else if (e.originalEvent.touches.length == 1) {

        touchState.currentPosition = toPoint(
          touchState.currentPosition.x = touchState.startPosition.x + (touchState.startPan.x - currentPan.x),
          touchState.currentPosition.y = touchState.startPosition.y + (touchState.startPan.y - currentPan.y)
          );
      }

      var zoomWidth = $container.width() * touchState.currentZoom;
      var zoomHeight = $container.height() * touchState.currentZoom;

      if (touchState.currentPosition.x < 0) { touchState.currentPosition.x = 0; }
      if (touchState.currentPosition.x + $container.width() > zoomWidth) { touchState.currentPosition.x = zoomWidth - $container.width(); }
      if (touchState.currentPosition.y < 0) { touchState.currentPosition.y = 0; }
      if (touchState.currentPosition.y + $container.height() > zoomHeight) { touchState.currentPosition.y = zoomHeight - $container.height(); }

      applyTouch($container);

      if (touchState.currentZoom > 1) {
        e.stopPropagation();
        e.preventDefault();
      }

    };
    
    var resetTouch = function ($container) {
      var touchState = $container.data(touchStateKey);
      
      if (touchState) {
        touchState.startPinch = 0;
        touchState.startZoom = 1;
        touchState.startPan = toPoint(0,0);
        touchState.startPosition = toPoint(0,0);
        touchState.currentZoom = 1;
        touchState.currentPosition = toPoint(0,0);
        
        applyTouch($container);
      }
    };
    
    var applyTouch = function ($container) {
      var touchState = $container.data(touchStateKey);
      
      if (touchState.currentZoom > 1) {
        $container.addClass('jsZoomTouchZoomed');
      } else {
        $container.removeClass('jsZoomTouchZoomed');
      }
      
      $container.css({
        'background-size': (touchState.currentZoom * 100) + '%',
        'background-position': -touchState.currentPosition.x + 'px ' + -touchState.currentPosition.y + 'px'
      });
    }
    
    var loadHqImage = function ($target) {
      var $mouseZoom = $target.find('.jsZoomMouse');
      var $image = $target.find('img');

      if (!$target.hasClass('jsZoomHqLoaded')) {
        $target.addClass('jsZoomHqLoaded');

        $target.css({
          'background-image': 'url(' + $image.attr('src') + ')'
        });
        $mouseZoom.css({
          'background-image': 'url(' + $image.attr('src') + ')'
        });

        var hqImage = $target.attr('data-zoom');
        if (hqImage) {
          var img = new Image();
  
          img.onload = function () {
            $target.css({
              'background-image': 'url(' + hqImage + ')'
            });
            $mouseZoom.css({
              'background-image': 'url(' + hqImage + ')'
            });
            hqImageState = 'loaded';
          };
  
          img.src = $target.attr('data-zoom');
        }
      }
    };
    
    var toPoint = function (obj1, obj2) {
      if (typeof obj1.pageX === 'number' && typeof obj1.pageY === 'number') {
        return { x: obj1.pageX, y: obj1.pageY };
      } else if (typeof obj1 === 'number' && typeof obj2 === 'number') {
        return { x: obj1, y: obj2 };
      }

      throw 'Could not convert to point. Unrecognized object: ' + obj1;
    };
    
    var copyPoint = function (point) {
      return { x: point.x, y: point.y }
    };
    
    /**
     * Calculates the distance between two points
     */
    var distance = function (point1, point2) {
      var x = point1.x - point2.x;
      if (x < 0) { x *= -1; }
      var y = point1.y - point2.y;
      if (y < 0) { y *= -1; }
      return Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    };
    
    /**
     * Calculates the center point between two points
     */
    var center = function (point1, point2) {
      var x = point1.x - ((point1.x - point2.x) / 2);
      var y = point1.y - ((point1.y - point2.y) / 2);
      return [x, y];
    };
    
    
    
    if (action === 'reset') {
      this.each((idx, elem) => { resetTouch($(elem)); });
    } else {
      
      this.css({
        'position': 'relative',
        'background-repeat': 'no-repeat'
      });
      this.addClass('jsZoom');
      if ('ontouchstart' in document.documentElement) {
        this.addClass("jsZoomTouch");
      }
      this.find('img').css({'display': 'block'});
    
      this.append($('<div class="jsZoomMouse" style="display: none; position: absolute; height: 300px; width: 300px; z-index: 9999; border-radius: 200px; background-repeat: no-repeat;"/>'));
    
      this.each((idx, elem) => {
        $(elem).data(touchStateKey, {
          startPinch: 0,
          startZoom: 1,
          startPan: toPoint(0,0),
          startPosition: toPoint(0,0),
          currentZoom: 1,
          currentPosition: toPoint(0,0)
        });
      });
    
      this.on('mousemove', mouseMoveHandler);
      this.on("touchstart", touchStartHandler);
      this.on("touchend", touchEndHandler);
      this.on("touchmove", touchMoveHandler);
      
      $(document).on('mousemove', function () {
        $('.jsZoomMouse').hide();
      });
      
    }
  }
})(jQuery);