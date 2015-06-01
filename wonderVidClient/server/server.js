var base_url;
Meteor.startup(function () {
  ServiceConfiguration.configurations.upsert({
    service: "google"
  },{
    $set : {
      service: "google",
      clientId: "1017109112095-0f5c5pm9ko8bsojihiq17o0dgfmbhmac.apps.googleusercontent.com",
      loginStyle: "redirect",
      secret: "VBFRTPKgrck5cNSRh7Kv-DdQ"
    }
  });
  if(Meteor.absoluteUrl() == 'http://localhost:3000/') 
    base_url = "http://localhost:5000";
  else 
    base_url = "https://wondervid.herokuapp.com";
  
  updateAll();
  var minutes = 30, the_interval = minutes * 60 * 1000;
  Meteor.setInterval(updateAll, the_interval);
});

var updateAll = function() {
  updateThis('/videos', TopVideos);
  updateThis('/live', LiveVideos);
  updateThis('/emerging', EmergingVideos);
  updateThis('/allstars', AllStarVideos);
}

var updateThis = function(url, collection) {
  Meteor.http.get(base_url + url, function(err, res) {
    _.forEach(res.data, function(node, index) {
      node.rank = index + 1;
      var video = collection.findOne({rank:node.rank})
      if(video && video.videoId != node.videoId) {
        delete node._id;
        collection.update({rank:node.rank}, node, {upsert:true});
      } else {
        delete node._id;
        collection.update({rank:node.rank}, node, {upsert:true});
      }
    })    
  })
}

TopVideos = new Mongo.Collection('videos');
LiveVideos = new Mongo.Collection('live');
EmergingVideos = new Mongo.Collection('emerging');
AllStarVideos = new Mongo.Collection('allStar');

Meteor.publish('videos', function(type) {
  if (type == "topVideos") {
    return TopVideos.find({}, {sort:{rank:1}});
  } else if (type == 'live') {
    return LiveVideos.find({}, {sort:{rank:1}});
  } else if (type == 'emerging') {
    return EmergingVideos.find({}, {sort:{rank:1}});
  } else if (type == 'allStar') {
    return AllStarVideos.find({}, {sort:{rank:1}});
  }
  return [];
});

Meteor.publish("userData", function () {
  if (this.userId) {
    return Meteor.users.find({_id: this.userId});
  } else {
    this.ready();
  }
});

Meteor.methods({
  likeVideo: function(id, like) {
    var apiKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
    Meteor.http.post('https://www.googleapis.com/youtube/v3/videos/rate?id='+id+'&rating=' + like + '&key{'+apiKey+'}&access_token='+Meteor.user().services.google.accessToken); 
  },
  likedVideos: function() {
    var apiKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
    var likeList = Meteor.http.get('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&key={{'+apiKey+'}&access_token='+Meteor.user().services.google.accessToken)
    var likePlaylist = Meteor.http.get('https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&maxResults=50&playlistId=' + likeList.data.items[0].contentDetails.relatedPlaylists.likes + '&key={{'+apiKey+'}&access_token='+Meteor.user().services.google.accessToken)
    likePlaylist.data.items = _.map(likePlaylist.data.items, function(item, index) {
      item.title = item.snippet.title;
      item.videoId = item.contentDetails.videoId
      item.thumbnail = {};
      item.thumbnail.high = {},
      item.rank = index + 1;
      if(item.snippet.thumbnails)
        item.thumbnail.high.url  = item.snippet.thumbnails.high.url;

      return item;
    });
    if (likePlaylist.data.items)
      return likePlaylist.data.items;
    else
      return [];
  }
});