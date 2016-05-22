var hotels = [];
var collections = [];
var users = [];
var map;
var marker;

//Map functions
var initMap = function() {
  map = L.map("map").setView([40.45, -3.69], 11);
  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
  }).addTo(map);
}

var centerMapFocus = function(hotel) {
  map.zoomIn(6, {animate: true});
  map.panTo({lat: hotel.lat, lon: hotel.long}, {animate: true, duration: 2});
  marker = new L.marker([hotel.lat, hotel.long]);
  map.addLayer(marker);
  marker.bindPopup(hotel.title).openPopup();
}

var resetMap = function () {
  map.setZoom(11, {animate: true});
  map.removeLayer(marker);
}

//Carousel functions
var initCarousel = function (carouselId, photos) {
  $("#" + carouselId + " .carousel-indicators").text("");
  $("#" + carouselId + " .carousel-inner").text("");
  for (var i = 0; i < photos.length; i++) {
    if (i === 0) {
      $("#" + carouselId + " .carousel-indicators")
        .append("<li class='active' data-target='#" + carouselId + "' data-slide-to='0'></li>");
      $("#" + carouselId + " .carousel-inner")
        .append("<div class='item active'><img src='" + photos[i].url + "'></img></div>");
    } else {
      $("#" + carouselId + " .carousel-indicators")
        .append("<li data-target='#" + carouselId + "' data-slide-to='" + i + "'></li>");
      $("#" + carouselId + " .carousel-inner")
        .append("<div class='item'><img src='" + photos[i].url + "'></img></div>");
    }
  }
  $("#" + carouselId).carousel();
}

//Hotels info functions
var getAccomodations = function() {
  $.getJSON("../json/alojamientos.json")
    .done(function (data) {
      var accomodations = data.serviceList.service;

      $("#get-hotels").hide();
      $("#hotels-list .list").append("<h4>" + accomodations.length + " hoteles encontrados:</h4>");
      $("#hotels-list .list").append("<ul></ul>");
      var hotel;
      for (var i = 0; i < accomodations.length; i++) {
        hotel = accomodations[i];
        hotels[i] = {
          "title": hotel.basicData.title,
          "body": hotel.basicData.body,
          "address": hotel.geoData.address,
          "long": hotel.geoData.longitude,
          "lat": hotel.geoData.latitude,
          "users": []
        }
        if (hotel.multimedia) {
          hotels[i]["photos"] = hotel.multimedia.media;
        } else {
          hotels[i]["photos"] = null;
        }
        $("#hotels-list .list ul").append("<li id='" + i + "'>" + hotel.basicData.title + "</li>");
      }
      //Drag and drop
      $("#hotels-list li").draggable({
        cancel: "a.ui-icon",
        revert: "invalid",
        containment: "document",
        helper: "clone",
        cursor: "move"
      });

      $("#collection").droppable({
        accept: "#hotels-list li",
        activeClass: "selected",
        drop: function(event, ui) {
          storeItem(ui.draggable);
        }
      });

      $("#hotels-list").droppable({
        accept: "#collection li",
        activeClass: "selected",
        drop: function(event, ui) {
          removeItem(ui.draggable);
        }
      });

      $("#hotels-list .list ul li, #collection ul li").click(function (event) {
        $("#hotels-list .list ul li.selected").removeClass("selected");
        $("#collection ul li.selected").removeClass("selected");
        $(event.target).addClass("selected");
        localStorage.setItem("hotel", JSON.stringify({
          'id': event.target.id,
          'info': hotels[event.target.id]
        }));
        getHotelInfo();
      });
    })
    .fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Request Failed: " + err );
    });
}

var getHotelInfo = function() {
  var hotel = JSON.parse(localStorage.getItem('hotel'));
  var element = $(".hotel-profile .profile p");
  element.text("");
  element.append("<h4>" + hotel.info.title + "</h4>");
  element.append("<p class='address'>" + hotel.info.address + "</p>");
  element.append(hotel.info.body);
  $(".hotel-profile").attr('id', hotel.id);

  if (marker) {
    resetMap();
  }
  centerMapFocus(hotel.info);
  initCarousel("myCarousel", hotel.info.photos);
  getPhotos(hotel.info.address);

  $("#get-clients").show();
  $('#google-clients-list').text("");
}

//Drag and drop functions
var storeItem = function (item) {
  collections[$("#collection ul").attr("id").split("showncoll")[1]]["hotels"]
    .push($(item).attr("id"));
  $("#collection ul").append(item);
}

var removeItem = function (item) {
  var collectedHotels = collections[$("#collection ul").attr("id").split("showncoll")[1]]["hotels"];
  collectedHotels.splice(collectedHotels.indexOf($(item).attr("id")), 1);
  $("#hotels-list ul").prepend(item);
}

//Collections
var showCollectedHotels = function (collectedHotels) {
  returnHotels();
  for (var i = 0; i < collectedHotels.length; i++) {
    $("#hotels-list .list #" + collectedHotels[i]).appendTo("#collection ul");
  }
}

var createCollection = function () {
  var collectionName = $("#collections-form").val();
  collections[collections.length] = {"name": collectionName, "hotels": []};
  showCollectionsList();
}

var showCollection = function (collection) {
  var colName = collection.innerHTML;
  $("#collection h4").remove();
  $("#collection p").hide();
  $("#collection ul").show();
  $("#collection h3").after("<h4>" + colName + "</h4>");
  $("#collection ul").attr("id", "shown" + collection.id);
  var id = collection.id.split("coll")[1];
  showCollectedHotels(collections[id].hotels);
}

var showCollectionsList = function () {
  $("#collections-list").text("");
  for (var i = 0; i < collections.length; i++) {
    $("#collections-list")
      .append("<li id='coll" + i + "'>Colección: " + collections[i].name + "</li>");
  }
  if ($("#collection ul").attr("id")) {
    var selectedColl = $("#collection ul").attr("id").split("shown")[1];
  }
  $("#collections-list li#" + selectedColl).addClass("selected");
  $("#collections-list li").click(function (event) {
    $("#collections-list li.selected").removeClass("selected");
    $(event.target).addClass("selected");
    showCollection(event.target);
  });
}

var returnHotels = function () {
  $("#collection li").appendTo("#hotels-list ul");
}

//Google+ API

var apiKey = 'AIzaSyCLe2Eq3PuXi4emXsm__HpoWhyrQ_xBSQc';

var handleClientLoad = function(id) {
  var hotelID = $(".hotel-profile").attr('id');
  if (!hotelID) {
    $("#google-clients-list").text("");
    $("#google-clients-list").append("<h3>Debes seleccionar un hotel para el cliente</h3>");
  } else {
    if (!users[hotelID]) {
      users[hotelID] = [];
    }

    users[hotelID].push(id);
    showUsers(hotelID);
  }
}

var makeApiCall = function(id){
  gapi.client.setApiKey(apiKey);
  gapi.client.load('plus', 'v1', function() {
    var request = gapi.client.plus.people.get({
      'userId': id
    });
    request.execute(function(resp) {
      var heading = document.createElement('li');
      var image = document.createElement('img');
      image.src = resp.image.url;
      heading.appendChild(image);
      heading.appendChild(document.createTextNode(resp.displayName));

      $("#google-clients-list").append(heading);
    });
  });
}

var showUsers = function (hotelID) {
  $("#google-clients-list").text("");
  if (users[hotelID]) {
    $("#get-clients").hide();
  } else {
    $("#google-clients-list").append("<h3>No hay clientes registrados en este hotel</h3>");
  }
  for (var i = 0; i < users[hotelID].length; i++) {
    makeApiCall(users[hotelID][i]);
  }
}

//Github API
var saveData = function (event) {
  event.preventDefault();
	var userName = $("#git-user").val();
	var repoName = $("#git-repo").val();
	var fileName = $("#git-file").val();

  hello.init({
	  github : "e41c07d05730864eea5b"
  },{
	  redirect_uri : '/redirect.html',
	  oauth_proxy : "https://auth-server.herokuapp.com/proxy"
  });
  access = hello("github");
  access.login({response_type: 'code'}).then( function(){
	  var auth = hello("github").getAuthResponse();
  	var token = auth.access_token;
  	var github = new Github({
  	  token: token,
  	  auth: "oauth"
	  });

    var repo = github.getRepo(userName, repoName);
    var data = JSON.stringify({"users": users, "collections": collections})
    repo.write("master", fileName, utf8_encode(data), "Saving data...", function (err) {
      if (err) {
        alert("Hubo un error al guardar los datos: " + err);
      } else {
        alert("Datos guardados.");
      }
    });

  }, function( e ){
	  alert('Signin error: ' + e.error.message);
  });
}

var loadData = function (event) {
  event.preventDefault();
	var userName = $("#git-user-load").val();
	var repoName = $("#git-repo-load").val();
	var fileName = $("#git-file-load").val();

  hello.init({
	  github : "e41c07d05730864eea5b"
  },{
	  redirect_uri : '/redirect.html',
	  oauth_proxy : "https://auth-server.herokuapp.com/proxy"
  });
  access = hello("github");
  access.login({response_type: 'code'}).then( function(){
	  var auth = hello("github").getAuthResponse();
  	var token = auth.access_token;
  	var github = new Github({
  	  token: token,
  	  auth: "oauth"
	  });
    var repo = github.getRepo(userName, repoName);
    repo.read("master", fileName, function (err, data) {
      if (err) {
        alert("No se pudieron cargar los datos");
      } else {
        var json = JSON.parse(data);
        collections = collections.concat(json.collections);
        showCollectionsList();
        //Attach click event on collections 'li' elements
        $("#collections-list li").click(function (event) {
          $(event.target).addClass("selected");
          showCollection(event.target);
        });
        users = users.concat(json.users);
        alert("Datos cargados con exito.");
      }
    });

  }, function( e ){
	  alert('Signin error: ' + e.error.message);
  });
}

//Flickr API
var getPhotos = function(tag) {
  var flickrAPI = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?"
  $.getJSON( flickrAPI, {
    tags: tag,
    tagmode: "any",
    format: "json"
  })
    .done(function (data, textStatus, jqXHR) {
      $('#flickr-photos').text("");
      var photos = data.items;
      if (photos.length === 0 ) {
        $('#flickr .message').show();
      } else {
        $('#flickr .message').hide();
        for (var i = 0; i < photos.length; i++) {
          var div = document.createElement("div");
          div.className = 'col-md-4 col-sm-4 col-xs-4';
          div.innerHTML = photos[i].description;
          $('#flickr-photos').append(div);
        }
      }
    })
    .fail(function (data, textStatus, jqXHR) {
      console.log("Could not load flickr photos");
    });
}

$(document).ready(function() {
  //Save data
  $("#save-data").click(function () {
    $("#github-form").show();
  });
  $("#github-submit").click(saveData);

  //Load data
  $("#load-data").click(function () {
    $("#github-form-load").show();
  });
  $("#github-submit-load").click(loadData);

  initMap();
  $("#tabs").tabs();
  $("#tabs").css("height","auto");

  //Hotels
  $("#get-hotels").click(getAccomodations);

  //Collections
  $("#collections-form").on("keypress", function(event) {
    if (event.which === 13) {
      createCollection();
    }
  });

  //Clients
  $("#clientForm").on("keypress", function(event) {
    if (event.which === 13) {
      handleClientLoad($("#clientForm").val());
    }
  });

  $("#get-clients").click(function () {
    showUsers($(".hotel-profile").attr('id'));
  });

  //Show and hide common rows
  $("#link-1").click(function () {
    $("#lists").show();
    $("#profile").show();
  });
  $("#link-2").click(function () {
    $("#lists").show();
    $("#profile").hide();
  });
  $("#link-3").click(function () {
    $("#lists").hide();
    $("#profile").show();
  });
});
