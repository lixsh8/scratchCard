function ScratchCard(id, cover, coverType, width, height, drawPercentCallback) {
    this.conId = id; //containerId 容器的id
    this.conNode = document.getElementById(this.conId); 
    this.cover = cover; //覆盖层
    this.coverType = coverType; // 1、image:图片覆盖(图片src)；2、color:颜色覆盖  
    this.background = null;
    this.backCtx = null;
    this.mask = null;
    this.maskCtx = null;
    this.scratchCard = null;
    this.scratchCardType = 'image';
    this.width = width || 300;  // canvas宽度
    this.height = height || 100; // canvas高度
    this.clientRect = null;
    this.drawPercentCallback = drawPercentCallback;  // 百分比回调函数
}

ScratchCard.prototype = {
    createElement: function (tagName, attributes) {
        var ele = document.createElement(tagName);
        for (var key in attributes) {
            ele.setAttribute(key, attributes[key]);
        }
        return ele;
    },
    getTransparentPercent: function (ctx, width, height) {
        var imgData = ctx.getImageData(0, 0, width, height),
            pixles = imgData.data,
            transPixs = [];
        for (var i = 0, j = pixles.length; i < j; i += 4) {
            var a = pixles[i + 3];
            if (a < 128) {
                transPixs.push(i);
            }
        }
        return (transPixs.length / (pixles.length / 4) * 100).toFixed(2);
    },
    resizeCanvas: function (canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').clearRect(0, 0, width, height);
    },
    drawPoint: function (x, y) {
        var percent = this.getTransparentPercent(this.maskCtx, this.width, this.height);
        console.log('percent:' + percent);
        this.maskCtx.beginPath();
        var radgrad = this.maskCtx.createRadialGradient(x, y, 0, x, y, 30);
        radgrad.addColorStop(0, 'rgba(0,0,0,0.6)');
        radgrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.maskCtx.fillStyle = radgrad;
        if (percent < 50) {
            this.maskCtx.arc(x, y, 30, 0, Math.PI * 2, true);
            this.maskCtx.fill();
        } else {
            this.maskCtx.fillStyle = 'rgba(255,0,0,1)';
            this.maskCtx.fillRect(0, 0, this.width, this.height);
        }

        if (this.drawPercentCallback) {
            this.drawPercentCallback.call(null, this.getTransparentPercent(this.maskCtx, this.width, this.height));
        }
    },
    bindEvent: function () {
        var _this = this;
        // var device = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
        var device = "ontouchend" in document ? true : false;
        var clickEvtName = device ? 'touchstart' : 'mousedown';
        var moveEvtName = device ? 'touchmove' : 'mousemove';
        if (!device) {
            var isMouseDown = false;
            document.addEventListener('mouseup', function (e) {
                isMouseDown = false;
            }, false);
        } else {
            document.addEventListener("touchmove", function (e) {
                if (isMouseDown) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener('touchend', function (e) {
                isMouseDown = false;
            }, false);
        }
        this.mask.addEventListener(clickEvtName, function (e) {
            isMouseDown = true;
            var docEle = document.documentElement;
            if (!_this.clientRect) {
                _this.clientRect = {
                    left: 0,
                    top: 0
                };
            }
            var x = (device ? e.touches[0].clientX : e.clientX) - _this.clientRect.left + docEle.scrollLeft - docEle.clientLeft;
            var y = (device ? e.touches[0].clientY : e.clientY) - _this.clientRect.top + docEle.scrollTop - docEle.clientTop;
            _this.drawPoint(x, y);
        }, false);

        this.mask.addEventListener(moveEvtName, function (e) {
            if (!device && !isMouseDown) {
                return false;
            }
            var docEle = document.documentElement;
            if (!_this.clientRect) {
                _this.clientRect = {
                    left: 0,
                    top: 0
                };
            }
            var x = (device ? e.touches[0].clientX : e.clientX) - _this.clientRect.left + docEle.scrollLeft - docEle.clientLeft;
            var y = (device ? e.touches[0].clientY : e.clientY) - _this.clientRect.top + docEle.scrollTop - docEle.clientTop;
            _this.drawPoint(x, y);
        }, false);
    },
    drawScratchCard: function () {
        this.background = this.background || this.createElement('canvas', {
            style: 'position:absolute;left:0;top:0;' + 'width:' + this.width + 'px;height:' + this.height + 'px'
        });
        this.mask = this.mask || this.createElement('canvas', {
            style: 'position:absolute;left:0;top:0;' + 'width:' + this.width + 'px;height:' + this.height + 'px'
        });

        if (!this.conNode.innerHTML.replace(/[\w\W]| /g, '')) {
            this.conNode.appendChild(this.background);
            this.conNode.appendChild(this.mask);
            this.clientRect = this.conNode ? this.conNode.getBoundingClientRect() : null;
            this.bindEvent();
        }

        this.backCtx = this.backCtx || this.background.getContext('2d');
        this.maskCtx = this.maskCtx || this.mask.getContext('2d');
        if (this.scratchCardType == 'image') {
            var image = new Image(),
                _this = this;
            image.onload = function () {
                _this.width = this.width;
                _this.height = this.height;
                _this.resizeCanvas(_this.background, this.width, this.height);
                _this.backCtx.drawImage(this, 0, 0);
                _this.drawMask();
            }
            image.src = this.scratchCard;
        } else if (this.scratchCardType == 'text') {
            this.width = this.width;
            this.height = this.height;
            this.resizeCanvas(this.background, this.width, this.height);
            this.backCtx.save();
            this.backCtx.fillStyle = '#FFF';
            this.backCtx.fillRect(0, 0, this.width, this.height);
            this.backCtx.restore();
            this.backCtx.save();

            var fontSize = parseFloat( $('html').css('font-size')) * 1.5;
            this.backCtx.font = 'Bold ' + fontSize + 'px Arial';
            this.backCtx.textAlign = 'center';
            this.backCtx.fillStyle = '#F60';
            var texts = this.scratchCard;
            var len = texts.length;
            var textTotalLength = 0;
            var arr = [];
            for (var i = 0; i < len; i++) {
                var tl = this.backCtx.measureText(texts[i]).width;
                arr.push(tl);
                textTotalLength += tl;
            }
            if (textTotalLength > this.width-20) {
                var maxIndexArr=[], maxLen = 0, j = 0;
                for (var i = 0; i < arr.length; i++) {
                    maxLen += arr[i];
                    if (maxLen >= this.width * (j + 1)) {
                        maxIndexArr[j] = i - 1;
                        j++;
                    }
                }
                var n = 0;
                for (var k = 0; k < maxIndexArr.length + 1; k++) {
                    var txt = texts.substring(n, maxIndexArr[k]);
                    this.backCtx.fillText(txt, this.width / 2, fontSize * (k + 1)*1.2);
                    n += maxIndexArr[k];
                }
            } else {
                this.backCtx.fillText(this.scratchCard, this.width / 2, this.height / 2 + fontSize / 2);
            }

            this.backCtx.restore();
            this.drawMask();
        }
    },
    drawMask: function () {
        this.resizeCanvas(this.mask, this.width, this.height);
        if (this.coverType == 'color') {
            this.maskCtx.fillStyle = this.cover;
            this.maskCtx.fillRect(0, 0, this.width, this.height);

            this.maskCtx.font = "Bold 30px Arial";
            this.maskCtx.textAlign = "center";
            this.maskCtx.fillStyle = '#999999';
            this.maskCtx.fillText("刮一刮", this.width / 2, this.height / 2 + 10);

            this.maskCtx.globalCompositeOperation = 'destination-out';
        } else if (this.coverType == 'image') {
            var image = new Image(),
                _this = this;
            image.onload = function () {
                _this.maskCtx.drawImage(this, 0, 0);

                _this.maskCtx.globalCompositeOperation = 'destination-out';
            }
            image.src = this.cover;
        }

    },
    init: function (scratchCard, scratchCardType) {
        this.scratchCard = scratchCard;
        this.scratchCardType = scratchCardType || 'image';
        this.drawScratchCard();
    }
}
