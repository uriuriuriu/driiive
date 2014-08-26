(function( window, undefined ) {
	var CAN_LOAD_TIME = 1000 * 60 * 20; // 20min
/*
	localStrage setting
	- localStorage.team_k001 = "大島優子";
	or
	- localStorage.setItem("team_k001", "大島優子");
	- log(localStorage.getItem("team_k001"));

	localStrage setting

*/
function Strg(){
	this.flgChromeStrg = true;
}
Strg.prototype.get = function(key, callback){
	if(this.flgChromeStrg){
		chrome.storage.sync.get(key, function(obj) {
			callback(obj);
		});
	}else{
		// var obj = localStorage.getItem(key);
		// callback(obj);
	}
};
Strg.prototype.set = function(key, value){
	if(this.flgChromeStrg){
		chrome.storage.sync.set({key: value}, function() {
			console.log('Settings saved');
		});
	}else{
		// localStorage.setItem(key, value);
	}
};
var strg = new Strg();



function CachedDribbbleData(){
	this.lastAPICheckTime = "";
	this.lastWLChangeTime = "";			// デバイス間で共有するwatchLaterデータの整合性のための、このデバイスの最新watchLater更新日時
	this.canLoadTime = CAN_LOAD_TIME;
}
CachedDribbbleData.prototype.canLoadCashed = function(){
	var dt = this.getCached();
	if (dt === null) return false;
	return true;
};
CachedDribbbleData.prototype.isOverLoadCashedTime = function(){
	// canLoadTime(20分)を経過してるかcheack
	var canLoad = this.canLoadCashed();
	if (!canLoad) return false;
	var dt = this.getCached();
	this.lastAPICheckTime = new Date();
	var cashedDate = new Date(dt.lastTime);
	return (cashedDate.getTime() + this.canLoadTime < this.lastAPICheckTime.getTime());
};
CachedDribbbleData.prototype.setCached = function(pre_data){
	var dt = {lastTime:this.lastAPICheckTime, shots:pre_data};
	localStorage.setItem("cachedDribbbleApiData", JSON.stringify(dt));
};
CachedDribbbleData.prototype.haveWatchLater = function(pre_data){
	var dt = this.getWatchLater();
	if(dt === null) return false;
	if(_.findWhere(dt, {id : pre_data.id}) === undefined){
		return false;
	}
	return true;
};
CachedDribbbleData.prototype.watchLaterCnt = function(){
	var dt = this.getWatchLater();
	if(dt === null) return 0;
	return dt.length;
};
CachedDribbbleData.prototype.pushWatchLater = function(pre_data){
	var dt = this.getWatchLater();
	this.lastWLChangeTime = new Date();
	if(dt === null){
		dt = [pre_data];
	}else{
		if(_.findWhere(dt, {id : pre_data.id}) === undefined){
			dt.push(pre_data);
		}
	}
	var saveDt = {lastTime:this.lastWLChangeTime, shots:dt};
	localStorage.setItem("cachedDribbbleWatchLater", JSON.stringify(saveDt));
};
CachedDribbbleData.prototype.removeWatchLater = function(pre_data){
	var dt = this.getWatchLater();
	this.lastWLChangeTime = new Date();
	if(dt === null)return;
	if(_.findWhere(dt, {id : pre_data.id}) === undefined)return;
	// remove watchlater
	var removeDt = _.reject(dt, function(shot){
		return shot.id === pre_data.id;
	});
	var saveDt = {lastTime:this.lastWLChangeTime, shots:removeDt};
	localStorage.setItem("cachedDribbbleWatchLater", JSON.stringify(saveDt));
};
CachedDribbbleData.prototype.getCached = function(){
	var cached = localStorage.getItem("cachedDribbbleApiData");
	if(cached !== null){
		cached = JSON.parse(cached);
	}
	return cached;
};
CachedDribbbleData.prototype.getWatchLater = function(){
	var cached = localStorage.getItem("cachedDribbbleWatchLater");
	if(cached !== null){
		cached = JSON.parse(cached).shots;
	}
	return cached;
};

// sync
CachedDribbbleData.prototype.syncWatchLater = function(callback_origin){
	var self = this;
	var getSyncWatchLater = function(callback){
		strg.get("cachedDribbbleWatchLater", function(cached){
			if(cached.toString != "function toString() { [native code] }"){
				cached = JSON.parse(cached);
			}
			callback(cached);
		});
	};
	var setSyncWatchLater = function(){
		strg.set("cachedDribbbleWatchLater", localStorage.getItem("cachedDribbbleWatchLater"));
	};
	var updateThis = function(dt){
		this.lastWLChangeTime = dt.lastTime;
		var saveDt = {lastTime:this.lastWLChangeTime, shots:dt};
		localStorage.setItem("cachedDribbbleWatchLater", JSON.stringify(saveDt));
	};
	var updateSync = function(){
		setSyncWatchLater();
	};

	getSyncWatchLater(function(dt){
		if(dt.toString == "function toString() { [native code] }"){
			// syncに無く
			if(self.lastWLChangeTime !== ""){
				// このdeviceにある場合
				updateSync();
			}
		}else{
			// syncに有り
			var syncDeviceLastTime = new Date(dt.lastTime);
			if(self.lastWLChangeTime !== ""){
				// このdeviceにも場合
				var thisDeviceLastTime = new Date(self.lastWLChangeTime);
				if(thisDeviceLastTime !== syncDeviceLastTime){
					// 両値が一致していない場合
					if(thisDeviceLastTime < syncDeviceLastTime){
						// このdeviceが新しい
						updateSync();
					}else{
						// このdeviceが古い
						updateThis(dt);
					}
				}
			}else{
				// このdeviceには無い場合
				updateThis(dt);
			}
		}
		callback_origin();
	});

};

window.cachedDribbbleData = new CachedDribbbleData();


})( window );
