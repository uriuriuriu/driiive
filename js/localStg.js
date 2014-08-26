(function( window, undefined ) {
	var CAN_LOAD_TIME = 1000 * 60 * 20; // 20min
/*
	localStrage setting
	- localStorage.team_k001 = "大島優子";
	- log(localStorage.getItem("team_k001"));
*/
var CachedDribbbleData = function(){
	this.lastCheckTime = "";
	this.canLoadTime = CAN_LOAD_TIME;
};
CachedDribbbleData.prototype.canLoadCashed = function(){
	var dt = this.getCached();
	if (dt === null) return false;
	return true;
};
CachedDribbbleData.prototype.isOverLoadCashedTime = function(){
	// canLoadTime(20分)を経過してるかcheck
	var canLoad = this.canLoadCashed();
	if (!canLoad) return false;
	var dt = this.getCached();
	this.lastCheckTime = new Date();
	var cashedDate = new Date(dt.lastLoadTime);
	return (cashedDate.getTime() + this.canLoadTime < this.lastCheckTime.getTime());
};
CachedDribbbleData.prototype.setCachedCheckTime = function(){
	this.lastCheckTime = new Date();
};
CachedDribbbleData.prototype.setCached = function(pre_data){
	var dt = {lastLoadTime:this.lastCheckTime, shots:pre_data};
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
	if(dt === null){
		dt = [pre_data];
		localStorage.setItem("cachedDribbbleWatchLater", JSON.stringify(dt));
	}else{
		if(_.findWhere(dt, {id : pre_data.id}) === undefined){
			dt.push(pre_data);
			localStorage.setItem("cachedDribbbleWatchLater", JSON.stringify(dt));
		}
	}
};
CachedDribbbleData.prototype.removeWatchLater = function(pre_data){
	var dt = this.getWatchLater();
	if(dt === null)return;
	if(_.findWhere(dt, {id : pre_data.id}) === undefined)return;
	// remove watchlater
	var removeDt = _.reject(dt, function(shot){
		return shot.id === pre_data.id;
	});
	dt = removeDt;
	localStorage.setItem("cachedDribbbleWatchLater", JSON.stringify(dt));
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
		cached = JSON.parse(cached);
	}
	return cached;
};


window.cachedDribbbleData = new CachedDribbbleData;


})( window );
