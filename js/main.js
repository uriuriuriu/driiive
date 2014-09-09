//$(function(){
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-46580403-4']);
  _gaq.push(['_trackPageview']);

  (function () {
      var ga = document.createElement('script');
      ga.type = 'text/javascript';
      ga.async = true;
      ga.src = 'https://ssl.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(ga, s);
  })();

	var WRAPPER_COL_CNT = 3;
	var LIMIT_PAGE_CNT = 10;
	var BPM = 60;
	var DEBUG_MODE = true;

/*
	utils
*/
	var log  = function(pre_txt){
		if(DEBUG_MODE){
			console.log(pre_txt);
			$("#logger").prepend("<p>" + pre_txt + "</p>");
		}
	};



/*
	viewer
*/
	function Viewer(pre_$wrapper){
		this.$ele = pre_$wrapper;
		this.createCol = _.template($("#col_template").text());			// use underscore.js
		this.createShot = _.template($("#shot_template").text());		// use underscore.js
		this.createWatchLaterShot = _.template($("#watchLaterShot_template").text());		// use underscore.js
		this.shotClassName = ".anim_img";
		this.addCnt = 0;
		this.appendWrappers = [];
		this.watchLaterWrapper = $("#watchLaters");
	}
	Viewer.prototype.initSwitchWrapper = function(pre_wrapCnt){
		var width = 100 / pre_wrapCnt;
		for (var i = 0; i < pre_wrapCnt; i++) {
			var html = this.getColHtml(width + "%", (width*i) + "%");
			var $html = $(html);
			this.$ele.append($html);
			this.appendWrappers.push($html);
		}
	};
	Viewer.prototype.addNextItem = function(pre_data) {
		var w = this.$ele.width() / this.appendWrappers.length;
		var h = (w/pre_data.width)*pre_data.height;
		var flgWatchLater = cachedDribbbleData.haveWatchLater(pre_data);
		var html = this.getShotHtml(pre_data.id,pre_data.image_url,h,flgWatchLater);

		var settingNum = this.addCnt % this.appendWrappers.length;
		this.appendWrappers[settingNum].append(html);
		$(this.shotClassName +":last-child").animate(
			{height:h+"px"},
			{duration: 400, easing: 'easeInOutQuint'}
		);
		this.addCnt++;
	};
	Viewer.prototype.removeViewTopItem = function() {
		$(this.shotClassName + ":first-child").remove();
	};
	Viewer.prototype.canRemoveViewTopItem = function() {
		return (50 < $(this.shotClassName).length);
	};
	Viewer.prototype.addWatchLaterItem = function(pre_data) {
		var w = this.watchLaterWrapper.width();
		var h = (w/pre_data.width)*pre_data.height;
		var html = this.getWatchLaterShotHtml(pre_data.id,pre_data.image_url,h,pre_data.url);
		this.watchLaterWrapper.prepend(html);
	};
	Viewer.prototype.getShotHtml = function(id,url,h,flgWatchLater){
		var watchLater = (flgWatchLater)?" watchLater":"";
		return this.createShot({"id":id,"url":url,"h":h,"watchLater":watchLater});
	};
	Viewer.prototype.getWatchLaterShotHtml = function(id,url,h,page_url){
		return this.createWatchLaterShot({"id":id,"url":url,"h":h,"page_url":page_url});
	};
	Viewer.prototype.getColHtml = function(width,left){
		return this.createCol({"width":width,"left":left});
	};



/*
	Api Data
*/
	function ApiData(pre_baseUrl, pre_item){
		this.url = pre_baseUrl;
		this.callback = "&callback=?&q=%23jquery";
		this.pager = 0;
		this.item = pre_item;
	}
	ApiData.prototype.getNextURL = function(){
		this.pager++;
		return this.url + "?per_page=30&page=" + this.pager + this.callback;
	};
	ApiData.prototype.loadApiData = function(pre_endCallback){
		var self = this;
		var url = self.getNextURL();
		log(url);
		$.getJSON(url, function(data){
			cachedDribbbleData.setCachedCheckTime();  // 最終取得時間の更新
			var cnts = self.item.receiveData(data);
			// local starage更新
			cachedDribbbleData.setCached(shots.shotList);
			// 継続確認
			var flgHaveNewRead = (cnts.readCnt !== 0);
			var flgNotMaxReadPage = (self.pager < LIMIT_PAGE_CNT);
			if(flgNotMaxReadPage && flgHaveNewRead){
				// read api continue
				self.loadApiData(pre_endCallback);
			}else{
				// finish load
				self.pager = 0;    // 次回から最新のものを取得させる
				pre_endCallback();
			}
		}).success(function(json) {
			log("success loaded " + json.page + " page.");
		}).error(function(jqXHR, textStatus, errorThrown) {
			log("error" + textStatus);
			log("error msg：" + jqXHR.responseText);
		}).complete(function() {
			log("load end");
		});
	};



/*
	Shots Data
*/
	function Shots(){
		this.shotList = [];	// cachedDribbbleDataに保存するのはこれだけ
		this.yetLoadShots = [];
		this.loadedShots = [];
		this.tempShots = [];
		this.maxShotListCnt = 500;
	}
	Shots.prototype.getShot = function(pre_id){
		return _.findWhere(this.shotList, {id : pre_id});
	};
	Shots.prototype.receiveData = function(data){
		var self = this;
		var shots;
		if(data.shots === undefined){
			shots = data;
		}else{
			shots = data.shots;
		}
		var cnts = {"cnt":shots.length, "readCnt":0, "watchLaterCnt":0};
		shots.forEach(function(shot){
			var id = shot.id;
			if (cachedDribbbleData.haveWatchLater(shot)) {
				cnts.watchLaterCnt++;
			}
			if (self.getShot(id) === undefined) {
				self.shotList.push(shot);
				self.yetLoadShots.push(shot);
				cnts.readCnt++;
				if(self.maxShotListCnt < self.shotList.length){
					// 保存最大件数に達した場合は、安全なデータを削除
					self.shiftSafeData();
				}
			}
		});
		log(cnts);
		return cnts;
	};
	Shots.prototype.shiftSafeData = function(){
		// 頭から
		// watchLaterに入って無いデータを削除
	};
	Shots.prototype.loadImageData = function(){
		var self = this;
		var imgUrls = _.pluck(this.yetLoadShots, "image_url");
		this.yetLoadShots = [];
		$.imgpreload(imgUrls, {
			each: function() {
				if($(this).data('loaded')){
					self.loadedShots.push(_.findWhere(self.shotList, {image_url : this.src}));
				}else{
					log("can't load " + this.src);
				}
			},
			all: function(){}
		});
	};
	Shots.prototype.getNextLoadedShot = function(){
		var shot = this.loadedShots.shift();
		this.tempShots.push(shot);
		return shot;
	};
	Shots.prototype.setTempShot = function(){
		var shot = this.tempShots.shift();
		this.loadedShots.push(shot);
		return shot;
	};
	Shots.prototype.canLoadImageData = function(){
		return (this.yetLoadShots != []);
	};
	Shots.prototype.haveImageData = function(){
		return (0 < this.loadedShots.length);
	};
	Shots.prototype.doUseTempShots = function(){
		if(this.tempShots.length < 10) return false;
		return (this.yetLoadShots.length < 10);
	};




/*
	main
*/
	var wlCnt = cachedDribbbleData.watchLaterCnt();
	$("#watchLaterNum").text(wlCnt);
	var viewer = new Viewer($('#shotWrapper'));
	viewer.initSwitchWrapper(WRAPPER_COL_CNT);
	var shots = new Shots();
	if(0 < wlCnt){
		var wlShotsData = cachedDribbbleData.getWatchLater();
		shots.receiveData(wlShotsData);
	}
	var url = "https://api.dribbble.com/shots/popular";
	var apiData = new ApiData(url, shots);
	if(cachedDribbbleData.canLoadCashed()){
		// there cashed
		log("!! let's load cached data. !!");
		var shotsData = cachedDribbbleData.getCached();
		shots.receiveData(shotsData);
	}
	if(cachedDribbbleData.isOverLoadCashedTime()){
		log("!! let's load API data. !!");
		apiData.loadApiData(function(){
			log("!! api load complete !!");
			cachedDribbbleData.setCached(shots.shotList);
		});
	}
	var flgOpeningEnd = false;
	$(".pageload-overlay").css("top", -(Math.random() * 6 * window.innerHeight));

	// white mask hidden func
	var openingAnimation = function(){
		setTimeout( function() {
			$("#loader").removeClass("show");
		}, 800 );
	};


	var beat = new beatJs({bpm:BPM, repeat:true});
	beat.push(function(){
		if(beat.cnt % 100 === 0){
			log("check can get api!");
			if(!cachedDribbbleData.canLoadCashed() || cachedDribbbleData.isOverLoadCashedTime()){
				log("!! [angain!!] let's load API data. !!");
				apiData.loadApiData(function(){
					log("!! [angain!!] api load complete !!");
					cachedDribbbleData.setCached(shots.shotList);
				});
			}
		}
		if(shots.canLoadImageData()){
			shots.loadImageData();
		}
		if(shots.doUseTempShots()){
//			log("use temp data!!");
			shots.setTempShot();
		}
		if(shots.haveImageData()){
			if(!flgOpeningEnd){
				flgOpeningEnd = true;
				openingAnimation();
			}
			// create html
			var shot = shots.getNextLoadedShot();
			viewer.addNextItem(shot);
			if(viewer.canRemoveViewTopItem()){
				// 軽量化のため削除
				viewer.removeViewTopItem();
			}
		}
	});
	beat.run();


	var openWatchLater = function(){
		$("#shotWrapper").addClass("outFoucus").removeClass("onFoucus");
		$("#watchLaterBox").css({"left":"0", "opacity":"1", "position":"absolute"});
		$("#watchLaterFixBg").css({"left":"0"});
		var cnt = cachedDribbbleData.watchLaterCnt();
		var arDispWl = [];
		var dispWl = $(".watchLaterShot");
		for (var j = 0; j < dispWl.length; j++) {
			arDispWl.push(parseInt(dispWl[j].dataset.shotId));
		}
		if(0 < cnt){
			var wl = cachedDribbbleData.getWatchLater();
			for (var i = 0; i < cnt; i++) {
				var flgShowen = _.find(arDispWl, function(num){
					return num == wl[i].id;
				});
				if(flgShowen === undefined){
					viewer.addWatchLaterItem(wl[i]);
				}
			}
		}
	};
	var closeWatchLater = function(){
		$("#shotWrapper").addClass("onFoucus").removeClass("outFoucus");
		$("#watchLaterBox").css({"left":"-120%", "opacity":"0", "position":"fixed"});
		$("#watchLaterFixBg").css({"left":"-120%"});
	};

	$("#stopBtn").click(function(){
		if(beat.isRun){
			beat.stop();
			$(this).text("run.");
		}else{
			beat.run();
			$(this).text("stop.");
			closeWatchLater();
		}
	});

	$("#watchLaterBtn").click(function(){
		if($("#shotWrapper").hasClass("onFoucus")){
			// let's watch later
			beat.stop();
			$("#stopBtn").text("run.");
			openWatchLater();
		}else{
			// close watch later
			beat.run();
			$("#stopBtn").text("stop.");
			closeWatchLater();
		}
	});

	// watch Later
	$(document).on("click", ".anim_img", function(){
		log($(this).css("background-image"));
		var shotId = parseInt(this.dataset.shotId);
		var shot = shots.getShot(shotId);
		log("shotId:" + shotId);
		if($(this).hasClass("watchLater")){
			$(this).removeClass("watchLater");
			cachedDribbbleData.removeWatchLater(shot);
		}else{
			$(this).addClass("watchLater");
			cachedDribbbleData.pushWatchLater(shot);
		}
		$("#watchLaterNum").text(cachedDribbbleData.watchLaterCnt());
	});
