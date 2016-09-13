// client-side js
// run by the browser each time your view template is loaded

// protip: you can rename this to use .coffee if you prefer

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

(function ($) {
  $(function() {
  
    $('[data-zoom]').each(function () {
      
      hqImageState = 'unloaded';
      
      $container = $('<div class="jsZoom"/>');
      $mouseZoom = $('<div class="jsZoomMouse"/>');
      $image = $(this);
      //$hqImage = $('<img class="jsZoomHqImage" src="' + $(this).attr('data-zoom') + "'/>");

      $container.css({
        display: 'inline-block',
        position: 'relative',
        width: $image.width(),
        height: $image.height(),
        'background-repeat': 'no-repeat'
      });
      if ('ontouchstart' in document.documentElement) {
        $container.addClass("jsZoomTouch");
      }
      $mouseZoom.css({
        display: 'none',
        position: 'absolute',
        height: '300px',
        width: '300px',
        'z-index': '9999',
        'border-radius': '200px',
        'background-size': ($image.width() * 6) + 'px ' + ($image.height() * 6) + 'px',
        'background-repeat': 'no-repeat'
      });
      $image.css({
        position: 'relative'
      });
      
      $image.wrap($container);

      // Update references to actual DOM elements
      $container = $image.closest('.jsZoom');
      
      $container.append($mouseZoom);
      $mouseZoom = $container.find('.jsZoomMouse');
      
      $image.css({
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      });


      
      function ensureHqImage() {
        if (hqImageState == 'unloaded') {
          hqImageState = 'loading';
          
          $container.css({
            'background-image': 'url(' + $image.attr('src') + ')'
          });
          $mouseZoom.css({
            'background-image': 'url(' + $image.attr('src') + ')'
          });
          
          var img = new Image();

          img.onload = function() {
              $container.css({
                'background-image': 'url(' + $image.attr('data-zoom') + ')'
              });
              $mouseZoom.css({
                'background-image': 'url(' + $image.attr('data-zoom') + ')'
              });
              hqImageState = 'loaded';
          };
      
          img.src = $image.attr('data-zoom');
        }
      }
      
      $container.on('mousemove', function (e) {
        ensureHqImage();
        
        $image.show();

        var offset = $container.offset();
        var x = e.pageX - offset.left;
        var y = e.pageY - offset.top;

        if (x < 0 || x > $container.width() ||
            y < 0 || y > $container.height()) {
              $mouseZoom.hide();
              return;
            }
        
        $mouseZoom.css({
            'top': y - ($mouseZoom.height() / 2),
            'left': x - ($mouseZoom.width() / 2),
            'background-position': (x / $container.width() * 100) + '% ' + (y / $container.height() * 100) + '%'
          });
        $mouseZoom.show();
      });
      
      
      function dst(x1, x2, y1, y2) {
        var x = x1 - x2;
        if (x < 0) { x *= -1; }
        var y = y1 - y2;
        if (y < 0) { y *= -1; }
        return Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
      }
      function center(x1, x2, y1, y2) {
        var x = x1 - ((x1 - x2) / 2);
        var y = y1 - ((y1 - y2) / 2);
        return [x, y];
      }
      
      var touch = {
        startPinch: 0,
        startZoom: 1,
        startPan: [0,0],
        startPosition: [0,0],
        currentZoom: 1,
        currentPosition: [0,0]
      };
      $container.on("touchstart touchmove touchend", function(e){
        var offset = $container.offset();
        var currentPan;
        var originalPosition = touch.currentPosition.slice();
  
        if(e.originalEvent.touches.length == 2) {
          currentPan = center(
            e.originalEvent.touches[0].pageX - offset.left, e.originalEvent.touches[1].pageX - offset.left,
            e.originalEvent.touches[0].pageY - offset.top, e.originalEvent.touches[1].pageY - offset.top);
          
          if (e.type === 'touchstart') {
            ensureHqImage();
            $image.hide();
  
            touch.startPinch = dst(
              e.originalEvent.touches[0].pageX, e.originalEvent.touches[1].pageX,
              e.originalEvent.touches[0].pageY, e.originalEvent.touches[1].pageY);
              
            touch.startZoom = touch.currentZoom;
            touch.startPan = currentPan;
            
          } else if (e.type === 'touchmove') {
            var preZoomX = (touch.currentPosition[0] + currentPan[0]) / ($container.width() * touch.currentZoom);
            var preZoomY = (touch.currentPosition[1] + currentPan[1]) / ($container.height() * touch.currentZoom);
            
            var distance = dst(
                e.originalEvent.touches[0].pageX, e.originalEvent.touches[1].pageX,
                e.originalEvent.touches[0].pageY, e.originalEvent.touches[1].pageY);
    
            touch.currentZoom = touch.startZoom * (distance / touch.startPinch);
            if (touch.currentZoom < 1) {
              touch.currentZoom = 1;
            }
            if (touch.currentZoom > 10) {
              touch.currentZoom = 10;
            }
            
            touch.currentPosition[0] = preZoomX * $container.width() * touch.currentZoom - currentPan[0];
            touch.currentPosition[1] = preZoomY * $container.height() * touch.currentZoom - currentPan[1];
            
            $container.css({
              
            });
          }
          
        } else if (e.originalEvent.touches.length == 1) {
          currentPan = [e.originalEvent.touches[0].pageX - offset.left, e.originalEvent.touches[0].pageY - offset.top];
          
          if (e.type === 'touchstart') {
            ensureHqImage();
            $image.hide();
            touch.startPan = currentPan;
            touch.startPosition = touch.currentPosition.slice();
            
          } else if (e.type === 'touchmove') {
            touch.currentPosition[0] = touch.startPosition[0] + (touch.startPan[0] - currentPan[0]);
            touch.currentPosition[1] = touch.startPosition[1] + (touch.startPan[1] - currentPan[1]);
          }
        }
        
        if (e.type === 'touchmove') {
          var zoomWidth = $container.width() * touch.currentZoom;
          var zoomHeight = $container.height() * touch.currentZoom;
          
          if (touch.currentPosition[0] < 0) { touch.currentPosition[0] = 0; }
          if (touch.currentPosition[0] + $container.width() > zoomWidth) { touch.currentPosition[0] = zoomWidth - $container.width(); }
          if (touch.currentPosition[1] < 0) { touch.currentPosition[1] = 0; }
          if (touch.currentPosition[1] + $container.height() > zoomHeight) { touch.currentPosition[1] = zoomHeight - $container.height(); }
        }
        
        $container.css({
          'background-size': (touch.currentZoom * 100) + '%',
          'background-position': -touch.currentPosition[0] + 'px ' + -touch.currentPosition[1] + 'px'
        });
        
        if (touch.currentPosition[0] != originalPosition[0] || touch.currentPosition[1] != originalPosition[1]) {
          e.preventDefault();
        }
        
        $mouseZoom.hide();
      });
      
    });
  
  });
})(jQuery);
