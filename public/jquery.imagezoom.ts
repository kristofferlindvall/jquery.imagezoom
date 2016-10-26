/// <reference path="../typings/jquery/jquery.d.ts" />

// Github repo: https://github.com/jansson/jquery.imagezoom

module JQueryImageZoom {
    export interface PluginOptions {

    }

    interface Point {
        x: number;
        y: number;
    }

    class ZoomTouchState {
        startPinch: number = 0;
        startZoom: number = 0;
        startPan: Point = { x: 0, y: 0 };
        startPosition: Point = { x: 0, y: 0 };
    }

    class ZoomState {
        touch = new ZoomTouchState();

        currentZoom: number = 1;
        currentPosition: Point = { x: 0, y: 0 };
    }

    export class Plugin {

        private image: JQuery;
        private state: ZoomState = new ZoomState();

        constructor (private $: JQueryStatic, private container: JQuery, private options: PluginOptions) {
            options = $.extend({
                autoMouseZoom: true
            }, options);

            this.image = container.find('img');

            container.css({
                'position': 'relative',
                'background-repeat': 'no-repeat'
            });
            container.addClass('jsZoom');
            if ('ontouchstart' in document.documentElement) {
                container.addClass("jsZoomTouch");
            }
            container.find('img').css({ 'display': 'block' });

            container.append($('<div class="jsZoomMouse" style="visibiliy: none; position: absolute; z-index: 9999; background-repeat: no-repeat;"/>'));

            container.on('mousemove', (e) => this.mouseMoveHandler(e));
            container.on("touchstart", (e) => this.touchStartHandler(e));
            container.on("touchend", (e) => this.touchEndHandler(e));
            container.on("touchmove", (e) => this.touchMoveHandler(e));

            $(document).on('mousemove', function () {
                $('.jsZoomMouse').hide();
            });
        }


        private toPoint (obj1, obj2?): Point {
            if (typeof obj1.pageX === 'number' && typeof obj1.pageY === 'number') {
                return { x: obj1.pageX, y: obj1.pageY };
            } else if (typeof obj1 === 'number' && typeof obj2 === 'number') {
                return { x: obj1, y: obj2 };
            }

            throw 'Could not convert to point. Unrecognized object: ' + obj1;
        };

        private mouseMoveHandler (e) {
            var $mouseZoom = this.container.find('.jsZoomMouse');
            var img = this.image;

            this.state.currentZoom = 6;

            if (this.state.currentZoom <= 1) {
                return;
            }

            e.stopPropagation();

            this.loadHqImage(this.container);

            var offset = this.container.offset();
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;

            // Caluclate relative position of mouse in percentages
            var xP = x / this.container.width();
            var yP = y / this.container.height();

            // Translate percentage to absolute position of zoom layer
            var xZoom = (this.container.width() * this.state.currentZoom) * xP;
            var yZoom = (this.container.height() * this.state.currentZoom) * yP;

            // Translate to relative position of zoom layer
            this.state.currentPosition = {
                x: xZoom - x,
                y: yZoom - y
            }

            this.update();
        };

        private touchStartHandler (e) {
            var $container = this.container;
            var $image = this.image;
            var $mouseZoom = this.container.find('.jsZoomMouse');
            var offset = $container.offset();
            var s = this.state;

            this.loadHqImage($container);

            $mouseZoom.hide();
            $image.css({ visibility: 'hidden' });

            if (e.originalEvent.touches.length == 2) {

                $image.css({ visibility: 'hidden' });

                s.touch.startPinch = this.distance(
                  this.toPoint(e.originalEvent.touches[0]),
                  this.toPoint(e.originalEvent.touches[1])
                  );

                s.touch.startPan = this.toPoint(
                  e.originalEvent.touches[0].pageX - offset.left,
                  e.originalEvent.touches[0].pageY - offset.top
                  );
                s.touch.startZoom = s.currentZoom;

            } else if (e.originalEvent.touches.length == 1) {

                s.touch.startPan = this.toPoint(
                  e.originalEvent.touches[0].pageX - offset.left,
                  e.originalEvent.touches[0].pageY - offset.top
                  );
                s.touch.startPosition = this.copyPoint(s.currentPosition);

            }

            this.update();
        };

        private touchEndHandler (e) {
            var $container = this.container;
            var offset = $container.offset();
            var touchState = this.state;

            // Prevent touch from simulating mouseclick/move
            if (e.cancelable) {
                e.preventDefault();
            }

            if (e.originalEvent.touches.length == 1) {

                touchState.touch.startPan = this.toPoint(
                  e.originalEvent.touches[0].pageX - offset.left,
                  e.originalEvent.touches[0].pageY - offset.top
                  );
                touchState.touch.startPosition = this.copyPoint(touchState.currentPosition);

            }

            this.update();
        };

        private touchMoveHandler (e) {
            var $container = this.container;
            var $mouseZoom = this.container.find('.jsZoomMouse');
            var $image = this.image;
            var touchState = this.state;
            var offset = $container.offset();
            var originalPosition = this.copyPoint(touchState.currentPosition);

            var currentPan = this.toPoint(
                e.originalEvent.touches[0].pageX - offset.left,
                e.originalEvent.touches[0].pageY - offset.top
                );

            if (e.originalEvent.touches.length == 2) {

                var preZoom = this.toPoint(
                  (touchState.currentPosition.x + currentPan.x) / ($container.width() * touchState.currentZoom),
                  (touchState.currentPosition.y + currentPan.y) / ($container.height() * touchState.currentZoom)
                  );

                var dst = this.distance(this.toPoint(e.originalEvent.touches[0]), this.toPoint(e.originalEvent.touches[1]));

                touchState.currentZoom = touchState.touch.startZoom * (dst / touchState.touch.startPinch);
                if (touchState.currentZoom < 1) {
                    touchState.currentZoom = 1;
                }
                if (touchState.currentZoom > 10) {
                    touchState.currentZoom = 10;
                }

                touchState.currentPosition = this.toPoint(
                  preZoom.x * $container.width() * touchState.currentZoom - currentPan.x,
                  preZoom.y * $container.height() * touchState.currentZoom - currentPan.y
                  );

            } else if (e.originalEvent.touches.length == 1) {

                touchState.currentPosition = this.toPoint(
                  touchState.currentPosition.x = touchState.touch.startPosition.x + (touchState.touch.startPan.x - currentPan.x),
                  touchState.currentPosition.y = touchState.touch.startPosition.y + (touchState.touch.startPan.y - currentPan.y)
                  );
            }

            var zoomWidth = $container.width() * touchState.currentZoom;
            var zoomHeight = $container.height() * touchState.currentZoom;

            if (touchState.currentPosition.x < 0) { touchState.currentPosition.x = 0; }
            if (touchState.currentPosition.x + $container.width() > zoomWidth) { touchState.currentPosition.x = zoomWidth - $container.width(); }
            if (touchState.currentPosition.y < 0) { touchState.currentPosition.y = 0; }
            if (touchState.currentPosition.y + $container.height() > zoomHeight) { touchState.currentPosition.y = zoomHeight - $container.height(); }

            this.update();

            if (touchState.currentZoom > 1) {
                e.stopPropagation();
                e.preventDefault();
            }

        };

        public resetTouch ($container) {
            this.state = new ZoomState();
            this.update();
        };

        private update () {

            if (this.state.currentZoom > 1) {
                this.container.addClass('jsZoom-Zoomed');
                this.image.css({'visibility': 'hidden'});
            } else {
                this.container.removeClass('jsZoom-Zoomed');
                this.image.css({'visibility': 'visible'});
            }

            this.container.css({
                'background-size': (this.container.width() * this.state.currentZoom) + 'px ' + (this.container.height() * this.state.currentZoom)  + 'px',
                'background-position': -this.state.currentPosition.x + 'px ' + -this.state.currentPosition.y + 'px'
            });
        }

        private loadHqImage ($target) {
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
                    };

                    img.src = $target.attr('data-zoom');
                }
            }
        };

        private copyPoint (point) {
            return { x: point.x, y: point.y }
        };

        /**
         * Calculates the distance between two points
         */
        private distance (point1, point2) {
            var x = point1.x - point2.x;
            if (x < 0) { x *= -1; }
            var y = point1.y - point2.y;
            if (y < 0) { y *= -1; }
            return Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
        };

        /**
         * Calculates the center point between two points
         */
        private center (point1, point2) {
            var x = point1.x - ((point1.x - point2.x) / 2);
            var y = point1.y - ((point1.y - point2.y) / 2);
            return [x, y];
        };

    }
}

(function ($) {

    $.fn.zoom = function (options) {

        if (typeof options === 'function') {
            this.each(function (idx, elem) {
                options($(elem).data("zoomObject"));
            });
        } else {
            this.each(function (idx, elem) {
                $(elem).data("zoomObject", new JQueryImageZoom.Plugin($, $(elem), options));
            });
        }
    }
})(jQuery);
