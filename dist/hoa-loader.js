"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isNan = require("babel-runtime/core-js/number/is-nan");

var _isNan2 = _interopRequireDefault(_isNan);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

////////////////
/* HOA LOADER */
////////////////

var HOAloader = function () {
    function HOAloader(context, order, url, callback) {
        (0, _classCallCheck3.default)(this, HOAloader);

        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        var nChGroups = Math.ceil(url.slice(url.lastIndexOf("_") + 1, url.lastIndexOf(".")));
        this.nChGroups = (0, _isNan2.default)(nChGroups) ? Math.ceil(this.nCh / 8) : nChGroups;
        this.buffers = new Array();
        this.loadCount = 0;
        this.loaded = false;
        this.onLoad = callback;
        this.urls = new Array(this.nChGroups);
        this.fileExt = url.slice(url.lastIndexOf(".") + 1, url.length);

        var chPerFile = this.nCh / this.nChGroups;
        var currCh = 1;

        for (var i = 0; i < this.nChGroups; i++) {
            this.urls[i] = url.slice(0, url.lastIndexOf(".")) + "_" + pad(currCh, 2) + "-" + pad(currCh + chPerFile - 1, 2) + "." + this.fileExt;
            currCh = currCh + chPerFile;
        }

        console.log("URL's:", this.urls);
        console.log("Number of channels:", this.nCh);
        console.log("Number of channel groups:", this.nChGroups);

        function pad(num, size) {
            return ('000000000' + num).substr(-size);
        }
    }

    (0, _createClass3.default)(HOAloader, [{
        key: "load",
        value: function load() {
            for (var i = 0; i < this.nChGroups; ++i) {
                this.loadBuffers(this.urls[i], i);
            }
        }
    }, {
        key: "loadBuffers",
        value: function loadBuffers(url, index) {
            // Load buffer asynchronously
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";

            var scope = this;

            request.onload = function () {
                // Asynchronously decode the audio file data in request.response
                scope.context.decodeAudioData(request.response, function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    scope.buffers[index] = buffer;
                    scope.loadCount++;
                    if (scope.loadCount == scope.nChGroups) {
                        scope.loaded = true;
                        scope.concatBuffers();
                        console.log("HOAloader: all buffers loaded and concatenated");
                        scope.onLoad(scope.concatBuffer);
                    }
                }, function (error) {
                    alert("Browser cannot decode audio data:  " + url + "\n\nError: " + error + "\n\n(If you re using Safari and get a null error, this is most likely due to Apple's shady plan going on to stop the .ogg format from easing web developer's life :)");
                });
            };

            request.onerror = function () {
                alert('HOAloader: XHR error');
            };

            request.send();
        }
    }, {
        key: "concatBuffers",
        value: function concatBuffers() {

            if (!this.loaded) return;

            var nCh = this.nCh;
            var nChGroups = this.nChGroups;

            var length = this.buffers[0].length;
            this.buffers.forEach(function (b) {
                length = Math.max(length, b.length);
            });
            var srate = this.buffers[0].sampleRate;

            // Detect if the 8-ch audio file is OGG, then remap 8-channel files to the correct
            // order cause Chrome and Firefox messes it up when loading. Other browsers have not
            // been tested with OGG files. 8ch Wave files work fine for both browsers.
            var remap8ChanFile = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            if (this.fileExt.toLowerCase() == "ogg") {
                console.log("Loading of 8chan OGG files [Chrome/Firefox]: remap channels to correct order!");
                remap8ChanFile = [1, 3, 2, 7, 8, 5, 6, 4];
                //remap8ChanFile = [1,3,2,8,6,7,4,5];
            }
            console.log("Create audio buffer, number of channels:" + nCh + ", buffer size sample frames:" + length + ", sample rate:" + srate);
            this.concatBuffer = this.context.createBuffer(nCh, length, srate);
            var bufferChannels = 8;
            for (var i = 0; i < nChGroups; i++) {
                bufferChannels = this.buffers[i].numberOfChannels;
                console.log("For audio buffer: " + i + ", number of buffer channels: " + bufferChannels);
                for (var j = 0; j < bufferChannels; j++) {
                    console.log("Get channel data for: " + (i * bufferChannels + j));
                    var chData = this.concatBuffer.getChannelData(i * bufferChannels + j);
                    console.log("Get channeldata:", chData);
                    console.log("Set channel data, remap:", this.buffers[i], ", remap:", remap8ChanFile[j] - 1);
                    this.concatBuffer.getChannelData(i * bufferChannels + j).set(this.buffers[i].getChannelData(remap8ChanFile[j] - 1));
                }
            }
        }
    }]);
    return HOAloader;
}();

exports.default = HOAloader;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvYS1sb2FkZXIuanMiXSwibmFtZXMiOlsiSE9BbG9hZGVyIiwiY29udGV4dCIsIm9yZGVyIiwidXJsIiwiY2FsbGJhY2siLCJuQ2giLCJuQ2hHcm91cHMiLCJNYXRoIiwiY2VpbCIsInNsaWNlIiwibGFzdEluZGV4T2YiLCJidWZmZXJzIiwiQXJyYXkiLCJsb2FkQ291bnQiLCJsb2FkZWQiLCJvbkxvYWQiLCJ1cmxzIiwiZmlsZUV4dCIsImxlbmd0aCIsImNoUGVyRmlsZSIsImN1cnJDaCIsImkiLCJwYWQiLCJjb25zb2xlIiwibG9nIiwibnVtIiwic2l6ZSIsInN1YnN0ciIsImxvYWRCdWZmZXJzIiwiaW5kZXgiLCJyZXF1ZXN0IiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwicmVzcG9uc2VUeXBlIiwic2NvcGUiLCJvbmxvYWQiLCJkZWNvZGVBdWRpb0RhdGEiLCJyZXNwb25zZSIsImJ1ZmZlciIsImFsZXJ0IiwiY29uY2F0QnVmZmVycyIsImNvbmNhdEJ1ZmZlciIsImVycm9yIiwib25lcnJvciIsInNlbmQiLCJmb3JFYWNoIiwiYiIsIm1heCIsInNyYXRlIiwic2FtcGxlUmF0ZSIsInJlbWFwOENoYW5GaWxlIiwidG9Mb3dlckNhc2UiLCJjcmVhdGVCdWZmZXIiLCJidWZmZXJDaGFubmVscyIsIm51bWJlck9mQ2hhbm5lbHMiLCJqIiwiY2hEYXRhIiwiZ2V0Q2hhbm5lbERhdGEiLCJzZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7SUFFcUJBLFM7QUFDakIsdUJBQVlDLE9BQVosRUFBcUJDLEtBQXJCLEVBQTRCQyxHQUE1QixFQUFpQ0MsUUFBakMsRUFBMkM7QUFBQTs7QUFDdkMsYUFBS0gsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0csR0FB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QUFhVSxDQUFiLENBQXhDLEVBQXlELFVBQXpELEVBQXFFNkIsZUFBZUssQ0FBZixJQUFrQixDQUF2RjtBQUNBLHlCQUFLZCxZQUFMLENBQWtCZ0IsY0FBbEIsQ0FBaUNwQyxJQUFJZ0MsY0FBSixHQUFxQkUsQ0FBdEQsRUFBeURHLEdBQXpELENBQTZELEtBQUsvQyxPQUFMLENBQWFVLENBQWIsRUFBZ0JvQyxjQUFoQixDQUErQlAsZUFBZUssQ0FBZixJQUFrQixDQUFqRCxDQUE3RDtBQUNIO0FBQ0o7QUFDSjs7Ozs7a0JBakhnQnZELFMiLCJmaWxlIjoiaG9hLWxvYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0Fsb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCB1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICBsZXQgbkNoR3JvdXBzID0gTWF0aC5jZWlsKHVybC5zbGljZSh1cmwubGFzdEluZGV4T2YoXCJfXCIpICsgMSwgdXJsLmxhc3RJbmRleE9mKFwiLlwiKSkpO1xuICAgICAgICB0aGlzLm5DaEdyb3VwcyA9IE51bWJlci5pc05hTihuQ2hHcm91cHMpID8gTWF0aC5jZWlsKHRoaXMubkNoIC8gOCkgOiBuQ2hHcm91cHM7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLmxvYWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Mb2FkID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMudXJscyA9IG5ldyBBcnJheSh0aGlzLm5DaEdyb3Vwcyk7XG4gICAgICAgIHRoaXMuZmlsZUV4dCA9IHVybC5zbGljZSh1cmwubGFzdEluZGV4T2YoXCIuXCIpICsgMSwgdXJsLmxlbmd0aCk7XG5cbiAgICAgICAgbGV0IGNoUGVyRmlsZSA9IHRoaXMubkNoIC8gdGhpcy5uQ2hHcm91cHM7XG4gICAgICAgIGxldCBjdXJyQ2ggPSAxO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sYXN0SW5kZXhPZihcIi5cIikpICsgXCJfXCIgKyBwYWQoY3VyckNoLCAyKSArIFwiLVwiICsgcGFkKGN1cnJDaCArIGNoUGVyRmlsZSAtIDEsIDIpICsgXCIuXCIgKyB0aGlzLmZpbGVFeHQ7XG4gICAgICAgICAgICBjdXJyQ2ggPSBjdXJyQ2ggKyBjaFBlckZpbGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhcIlVSTCdzOlwiLCB0aGlzLnVybHMpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIk51bWJlciBvZiBjaGFubmVsczpcIiwgdGhpcy5uQ2gpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIk51bWJlciBvZiBjaGFubmVsIGdyb3VwczpcIiwgdGhpcy5uQ2hHcm91cHMpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHBhZChudW0sIHNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiAoJzAwMDAwMDAwMCcgKyBudW0pLnN1YnN0cigtc2l6ZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGxvYWQoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkQnVmZmVycyh0aGlzLnVybHNbaV0sIGkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbG9hZEJ1ZmZlcnModXJsLCBpbmRleCkge1xuICAgICAgICAvLyBMb2FkIGJ1ZmZlciBhc3luY2hyb25vdXNseVxuICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG5cbiAgICAgICAgdmFyIHNjb3BlID0gdGhpcztcblxuICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQXN5bmNocm9ub3VzbHkgZGVjb2RlIHRoZSBhdWRpbyBmaWxlIGRhdGEgaW4gcmVxdWVzdC5yZXNwb25zZVxuICAgICAgICAgICAgc2NvcGUuY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5yZXNwb25zZSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdlcnJvciBkZWNvZGluZyBmaWxlIGRhdGE6ICcgKyB1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmJ1ZmZlcnNbaW5kZXhdID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5sb2FkQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLmxvYWRDb3VudCA9PSBzY29wZS5uQ2hHcm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5jb25jYXRCdWZmZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkhPQWxvYWRlcjogYWxsIGJ1ZmZlcnMgbG9hZGVkIGFuZCBjb25jYXRlbmF0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uTG9hZChzY29wZS5jb25jYXRCdWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcIkJyb3dzZXIgY2Fubm90IGRlY29kZSBhdWRpbyBkYXRhOiAgXCIgKyAgdXJsICsgXCJcXG5cXG5FcnJvcjogXCIgKyBlcnJvciArIFwiXFxuXFxuKElmIHlvdSByZSB1c2luZyBTYWZhcmkgYW5kIGdldCBhIG51bGwgZXJyb3IsIHRoaXMgaXMgbW9zdCBsaWtlbHkgZHVlIHRvIEFwcGxlJ3Mgc2hhZHkgcGxhbiBnb2luZyBvbiB0byBzdG9wIHRoZSAub2dnIGZvcm1hdCBmcm9tIGVhc2luZyB3ZWIgZGV2ZWxvcGVyJ3MgbGlmZSA6KVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnSE9BbG9hZGVyOiBYSFIgZXJyb3InKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgIH1cblxuICAgIGNvbmNhdEJ1ZmZlcnMoKSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBuQ2ggPSB0aGlzLm5DaDtcbiAgICAgICAgdmFyIG5DaEdyb3VwcyA9IHRoaXMubkNoR3JvdXBzO1xuXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmJ1ZmZlcnNbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMuZm9yRWFjaCgoYikgPT4ge1xuICAgICAgICAgICAgbGVuZ3RoID0gTWF0aC5tYXgobGVuZ3RoLCBiLmxlbmd0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgc3JhdGUgPSB0aGlzLmJ1ZmZlcnNbMF0uc2FtcGxlUmF0ZTtcblxuICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIDgtY2ggYXVkaW8gZmlsZSBpcyBPR0csIHRoZW4gcmVtYXAgOC1jaGFubmVsIGZpbGVzIHRvIHRoZSBjb3JyZWN0XG4gICAgICAgIC8vIG9yZGVyIGNhdXNlIENocm9tZSBhbmQgRmlyZWZveCBtZXNzZXMgaXQgdXAgd2hlbiBsb2FkaW5nLiBPdGhlciBicm93c2VycyBoYXZlIG5vdFxuICAgICAgICAvLyBiZWVuIHRlc3RlZCB3aXRoIE9HRyBmaWxlcy4gOGNoIFdhdmUgZmlsZXMgd29yayBmaW5lIGZvciBib3RoIGJyb3dzZXJzLlxuICAgICAgICB2YXIgcmVtYXA4Q2hhbkZpbGUgPSBbMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTZdO1xuICAgICAgICBpZiAodGhpcy5maWxlRXh0LnRvTG93ZXJDYXNlKCkgPT0gXCJvZ2dcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJMb2FkaW5nIG9mIDhjaGFuIE9HRyBmaWxlcyBbQ2hyb21lL0ZpcmVmb3hdOiByZW1hcCBjaGFubmVscyB0byBjb3JyZWN0IG9yZGVyIVwiKVxuICAgICAgICAgICAgcmVtYXA4Q2hhbkZpbGUgPSBbMSwzLDIsNyw4LDUsNiw0XTtcbiAgICAgICAgICAgIC8vcmVtYXA4Q2hhbkZpbGUgPSBbMSwzLDIsOCw2LDcsNCw1XTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0ZSBhdWRpbyBidWZmZXIsIG51bWJlciBvZiBjaGFubmVsczpcIiArIG5DaCArIFwiLCBidWZmZXIgc2l6ZSBzYW1wbGUgZnJhbWVzOlwiICsgbGVuZ3RoICsgXCIsIHNhbXBsZSByYXRlOlwiICsgc3JhdGUpO1xuICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBsZW5ndGgsIHNyYXRlKTtcbiAgICAgICAgbGV0IGJ1ZmZlckNoYW5uZWxzID0gODtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuQ2hHcm91cHM7IGkrKykge1xuICAgICAgICAgICAgYnVmZmVyQ2hhbm5lbHMgPSB0aGlzLmJ1ZmZlcnNbaV0ubnVtYmVyT2ZDaGFubmVscztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRm9yIGF1ZGlvIGJ1ZmZlcjogXCIgKyBpICsgXCIsIG51bWJlciBvZiBidWZmZXIgY2hhbm5lbHM6IFwiICsgYnVmZmVyQ2hhbm5lbHMpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBidWZmZXJDaGFubmVsczsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZXQgY2hhbm5lbCBkYXRhIGZvcjogXCIgKyAoaSAqIGJ1ZmZlckNoYW5uZWxzICsgaikpXG4gICAgICAgICAgICAgICAgbGV0IGNoRGF0YSA9IHRoaXMuY29uY2F0QnVmZmVyLmdldENoYW5uZWxEYXRhKGkgKiBidWZmZXJDaGFubmVscyArIGopO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2V0IGNoYW5uZWxkYXRhOlwiLCBjaERhdGEpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2V0IGNoYW5uZWwgZGF0YSwgcmVtYXA6XCIsIHRoaXMuYnVmZmVyc1tpXSwgXCIsIHJlbWFwOlwiLCByZW1hcDhDaGFuRmlsZVtqXS0xKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlci5nZXRDaGFubmVsRGF0YShpICogYnVmZmVyQ2hhbm5lbHMgKyBqKS5zZXQodGhpcy5idWZmZXJzW2ldLmdldENoYW5uZWxEYXRhKHJlbWFwOENoYW5GaWxlW2pdLTEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0iXX0=