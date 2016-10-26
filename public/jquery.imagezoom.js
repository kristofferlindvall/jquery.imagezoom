/// <reference path="../typings/jquery/jquery.d.ts" />
// Github repo: https://github.com/jansson/jquery.imagezoom
var JQueryImageZoom;
(function (JQueryImageZoom) {
    var ZoomTouchState = (function () {
        function ZoomTouchState() {
            this.startPinch = 0;
            this.startZoom = 0;
            this.startPan = { x: 0, y: 0 };
            this.startPosition = { x: 0, y: 0 };
        }
        return ZoomTouchState;
    }());
    var ZoomState = (function () {
        function ZoomState() {
            this.touch = new ZoomTouchState();
            this.currentZoom = 1;
            this.currentPosition = { x: 0, y: 0 };
        }
        return ZoomState;
    }());
    var Plugin = (function () {
        function Plugin($, container, options) {
            var _this = this;
            this.$ = $;
            this.container = container;
            this.state = new ZoomState();
            this.options = $.extend({
                zoomOnHover: true
            }, options);
            this.image = container.find('img');
            container.css({
                'position': 'relative',
                'background-repeat': 'no-repeat'
            });
            container.addClass('jsZoom');
            if ('ontouchstart' in document.documentElement) {
                container.addClass("jsZoom-Touch");
            }
            else {
                container.addClass("jsZoom-NoTouch");
            }
            container.find('img').css({ 'display': 'block' });
            container.on('mousemove', function (e) { return _this.mouseMoveHandler(e); });
            container.on("touchstart", function (e) { return _this.touchStartHandler(e); });
            container.on("touchend", function (e) { return _this.touchEndHandler(e); });
            container.on("touchmove", function (e) { return _this.touchMoveHandler(e); });
            $(document).on('mousemove', function () {
                if (_this.options.zoomOnHover) {
                    _this.state.currentZoom = 1;
                    _this.update();
                }
            });
        }
        Plugin.prototype.toPoint = function (obj1, obj2) {
            if (typeof obj1.pageX === 'number' && typeof obj1.pageY === 'number') {
                return { x: obj1.pageX, y: obj1.pageY };
            }
            else if (typeof obj1 === 'number' && typeof obj2 === 'number') {
                return { x: obj1, y: obj2 };
            }
            throw 'Could not convert to point. Unrecognized object: ' + obj1;
        };
        ;
        Plugin.prototype.mouseMoveHandler = function (e) {
            if (this.options.zoomOnHover) {
                this.state.currentZoom = 6;
            }
            if (this.state.currentZoom <= 1) {
                return;
            }
            e.stopPropagation();
            var offset = this.container.offset();
            this.state.currentPosition = this.calculateZoomPosition({
                x: e.pageX - offset.left,
                y: e.pageY - offset.top
            });
            this.update();
        };
        ;
        Plugin.prototype.calculateZoomPosition = function (point) {
            // Caluclate relative position of mouse in percentages
            var xP = point.x / this.container.width();
            var yP = point.y / this.container.height();
            // Translate percentage to absolute position of zoom layer
            var xZoom = (this.container.width() * this.state.currentZoom) * xP;
            var yZoom = (this.container.height() * this.state.currentZoom) * yP;
            // Translate to relative position of zoom layer
            return {
                x: xZoom - point.x,
                y: yZoom - point.y
            };
        };
        Plugin.prototype.touchStartHandler = function (e) {
            var img = this.image;
            var offset = this.container.offset();
            var s = this.state;
            img.css({ visibility: 'hidden' });
            if (e.originalEvent.touches.length == 2) {
                img.css({ visibility: 'hidden' });
                s.touch.startPinch = this.distance(this.toPoint(e.originalEvent.touches[0]), this.toPoint(e.originalEvent.touches[1]));
                s.touch.startPan = this.toPoint(e.originalEvent.touches[0].pageX - offset.left, e.originalEvent.touches[0].pageY - offset.top);
                s.touch.startZoom = s.currentZoom;
            }
            else if (e.originalEvent.touches.length == 1) {
                s.touch.startPan = this.toPoint(e.originalEvent.touches[0].pageX - offset.left, e.originalEvent.touches[0].pageY - offset.top);
                s.touch.startPosition = this.copyPoint(s.currentPosition);
            }
            this.update();
        };
        ;
        Plugin.prototype.touchEndHandler = function (e) {
            var offset = this.container.offset();
            var s = this.state;
            // Prevent touch from simulating mouseclick/move
            if (e.cancelable) {
                e.preventDefault();
            }
            if (e.originalEvent.touches.length == 1) {
                s.touch.startPan = this.toPoint(e.originalEvent.touches[0].pageX - offset.left, e.originalEvent.touches[0].pageY - offset.top);
                s.touch.startPosition = this.copyPoint(s.currentPosition);
            }
            this.update();
        };
        ;
        Plugin.prototype.touchMoveHandler = function (e) {
            var c = this.container;
            var s = this.state;
            var offset = c.offset();
            var currentPan = this.toPoint(e.originalEvent.touches[0].pageX - offset.left, e.originalEvent.touches[0].pageY - offset.top);
            if (e.originalEvent.touches.length == 2) {
                var preZoom = this.toPoint((s.currentPosition.x + currentPan.x) / (c.width() * s.currentZoom), (s.currentPosition.y + currentPan.y) / (c.height() * s.currentZoom));
                var dst = this.distance(this.toPoint(e.originalEvent.touches[0]), this.toPoint(e.originalEvent.touches[1]));
                s.currentZoom = s.touch.startZoom * (dst / s.touch.startPinch);
                if (s.currentZoom < 1) {
                    s.currentZoom = 1;
                }
                if (s.currentZoom > 10) {
                    s.currentZoom = 10;
                }
                s.currentPosition = this.toPoint(preZoom.x * c.width() * s.currentZoom - currentPan.x, preZoom.y * c.height() * s.currentZoom - currentPan.y);
            }
            else if (e.originalEvent.touches.length == 1) {
                s.currentPosition = this.toPoint(s.currentPosition.x = s.touch.startPosition.x + (s.touch.startPan.x - currentPan.x), s.currentPosition.y = s.touch.startPosition.y + (s.touch.startPan.y - currentPan.y));
            }
            var zoomWidth = c.width() * s.currentZoom;
            var zoomHeight = c.height() * s.currentZoom;
            if (s.currentPosition.x < 0) {
                s.currentPosition.x = 0;
            }
            if (s.currentPosition.x + c.width() > zoomWidth) {
                s.currentPosition.x = zoomWidth - c.width();
            }
            if (s.currentPosition.y < 0) {
                s.currentPosition.y = 0;
            }
            if (s.currentPosition.y + c.height() > zoomHeight) {
                s.currentPosition.y = zoomHeight - c.height();
            }
            this.update();
            if (s.currentZoom > 1) {
                e.stopPropagation();
                e.preventDefault();
            }
        };
        ;
        Plugin.prototype.resetZoom = function () {
            this.state = new ZoomState();
            this.update();
        };
        ;
        Plugin.prototype.setZoom = function (level) {
            this.state.currentZoom = level;
            // Set focus to center
            this.state.currentPosition = this.calculateZoomPosition({
                x: this.container.width() / 2,
                y: this.container.height() / 2
            });
            this.update();
        };
        Plugin.prototype.getZoomLevel = function () {
            return this.state.currentZoom;
        };
        Plugin.prototype.update = function () {
            if (this.state.currentZoom !== 1) {
                this.loadHqImage();
                this.container.addClass('jsZoom-Zoomed');
                this.image.css({ 'visibility': 'hidden' });
            }
            else {
                this.container.removeClass('jsZoom-Zoomed');
                this.image.css({ 'visibility': 'visible' });
            }
            this.container.css({
                'background-size': (this.container.width() * this.state.currentZoom) + 'px ' + (this.container.height() * this.state.currentZoom) + 'px',
                'background-position': -this.state.currentPosition.x + 'px ' + -this.state.currentPosition.y + 'px'
            });
        };
        Plugin.prototype.loadHqImage = function () {
            var _this = this;
            if (!this.container.hasClass('jsZoom-HqLoaded')) {
                this.container.addClass('jsZoom-HqLoaded');
                this.container.css({
                    'background-image': 'url(' + this.image.attr('src') + ')'
                });
                var hqImage = this.container.attr('data-zoom');
                if (hqImage) {
                    var tmpImg = new Image();
                    tmpImg.onload = function () {
                        _this.container.css({
                            'background-image': 'url(' + hqImage + ')'
                        });
                    };
                    tmpImg.src = this.container.attr('data-zoom');
                }
            }
        };
        ;
        Plugin.prototype.copyPoint = function (point) {
            return { x: point.x, y: point.y };
        };
        ;
        /**
         * Calculates the distance between two points
         */
        Plugin.prototype.distance = function (point1, point2) {
            var x = point1.x - point2.x;
            if (x < 0) {
                x *= -1;
            }
            var y = point1.y - point2.y;
            if (y < 0) {
                y *= -1;
            }
            return Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
        };
        ;
        /**
         * Calculates the center point between two points
         */
        Plugin.prototype.center = function (point1, point2) {
            var x = point1.x - ((point1.x - point2.x) / 2);
            var y = point1.y - ((point1.y - point2.y) / 2);
            return [x, y];
        };
        ;
        return Plugin;
    }());
    JQueryImageZoom.Plugin = Plugin;
})(JQueryImageZoom || (JQueryImageZoom = {}));
(function ($) {
    $.fn.zoom = function (options) {
        if (typeof options === 'function') {
            this.each(function (idx, elem) {
                options($(elem).data("zoomObject"));
            });
        }
        else {
            this.each(function (idx, elem) {
                $(elem).data("zoomObject", new JQueryImageZoom.Plugin($, $(elem), options));
            });
        }
    };
})(jQuery);
