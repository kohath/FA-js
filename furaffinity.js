// ==UserScript==
// @include http://www.furaffinity.net/view/*
// @include http://www.furaffinity.net/msg/submissions/*
// @include http://www.furaffinity.net/controls/
// @include http://sfw.furaffinity.net/view/*
// @include http://sfw.furaffinity.net/msg/submissions/*
// @include http://sfw.furaffinity.net/controls/
// ==/UserScript==

// for the expanded version:
// given a starting and an ending reference,
//  load that page
//    if it's within the date range,
//      and we get the score,
//        and the score is includable,
//          add the copiable code to the appropriate place in a separate frame holding the list
//          and go to the next url;
//        if it's not includable;
//          just go to the next url.
//      if we don't get the score, 
//        it's either an error, and we reload and try again,
//        or it's been removed, and we go to the next url.
//    if it's not within the date range,
//      and if it's older than the date range,
//        go to the next url.
//      but if it's newer than the date range,
//        stop.
//        

if (location.href.match(/^http:\/\/[sw][fw]w.furaffinity.net\/view\//)) {
document.addEventListener('DOMContentLoaded', function ()
{
        // Kill the 503.
        //   but not too much
        if (document.title == "Error 503 -- Fur Affinity [dot] net") {
        	window.setTimeout("window.location.reload()", 3000);
        };

	// determine image score.
		// num of favs
	var indexOfFavs = document.body.innerHTML.indexOf("Favorites:") + 15;
	if (page_data["lower"] == "kohath")
	{	indexOfFavs = document.body.innerHTML.indexOf("/favslist/");
		indexOfFavs = document.body.innerHTML.indexOf(">", indexOfFavs) + 1;
	}
	var endIndexOfFavs = document.body.innerHTML.indexOf("<", indexOfFavs);
	var numOfFavs = document.body.innerHTML.substring(indexOfFavs, endIndexOfFavs) * 1;
		// date.  form is: August 30th, 2008 08:30 PM
	var calendar = {
		"January": 0,
		"February": 1,
		"March": 2,
		"April": 3,
		"May": 4,
		"June": 5,
		"July": 6,
		"August": 7,
		"September": 8,
		"October": 9,
		"November": 10,
		"December": 11
	};
	var indexOfDate = document.body.innerHTML.indexOf("popup_date") + 12;
	var endIndexOfDate = document.body.innerHTML.indexOf("<", indexOfDate);
	var postedDate = document.body.innerHTML.substring(indexOfDate, endIndexOfDate);
	var dateArray = postedDate.split(" ");
	var thenDate = new Date(dateArray[2] * 1, calendar[dateArray[0]] * 1, dateArray[1].substring(0, dateArray[1].length - 3) * 1);
		// date comparison
	var now = new Date();
	var nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	var aDay = 1000 * 60 * 60 * 24;
	var diff = (nowDate.getTime() - thenDate.getTime()) / aDay;
	
		// and the scores
	var score = -6;
	while	(numOfFavs >= favThreshold(score, diff + 1)) {
		score++;
	};
	score--;
	
	// image rating
	var rating = "General";
	if (document.body.innerHTML.indexOf("alt=\"Adult rating\"") > -1) 
	{	rating = "Adult";
		score--;
	} else if (document.body.innerHTML.indexOf("alt=\"Mature rating\"") > -1) 
	{	rating = "Mature";
	} else score++;

	// Close lesser stuff automatically for faster digesting (Saturdays)
	if (getCookie("mtDigest") == "true") {
		if (score < 8 || rating == "Adult" || rating == "Mature") window.close();
	};

	// Score color
	switch (true) {
		case (score < 8): color = "red"; break;
		case (score == 8 || score == 9): color = "yellow"; break;
		case (score > 9): color = "lightgreen"; break;
		default: color = "black"; break;
	}
	
	// title and author
	var titleLine = document.title;
	var title = titleLine.substring(0, titleLine.lastIndexOf(" by ")).split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split("\"").join("&#x22;");

	// Count comments for highlights.
	var indexOfComments = document.body.innerHTML.indexOf("Comments:") + 14;
	var endIndexOfComments = document.body.innerHTML.indexOf("<", indexOfComments);
	var numOfComments = document.body.innerHTML.substring(indexOfComments, endIndexOfComments) * 1;
		
	// Count mentions of me~
	var numOfMukes = document.body.innerHTML.match(/(kohath|muke|moriarty|myces)/ig).length;

	// Watch for comments/mentions of friends
	var SpecialMention = document.body.innerHTML.match(/spyketyranno/ig);
		
	// emit copiable form.
	var digestBox = document.createElement("li");
	digestBox.setAttribute("id", "fadigester");
	// following line is when we used to have ratings done separately.
//	digestBox.innerHTML = "<big><b>"+score+"</b></big> <input type=\"text\" value=\"<li>("+rating+") <a HREF=&#x22;"+document.location+"&#x22; onClick=&#x22;pageTracker._trackEvent('FA Digest Jumps', '"+page_data["lower"]+"', '"+page_data["submission_id"]+"');&#x22;>"+title+"</a> &mdash; by <a HREF=&#x22;http://www.furaffinity.net/user/"+page_data["lower"]+"&#x22; onClick=&#x22;pageTracker._trackEvent('FA Digest Jumps', '"+page_data["lower"]+"', '"+page_data["lower"]+"');&#x22;>"+page_data["username"]+"</a>: %INSERT DESCRIPTION% </li>\">"
	digestBox.innerHTML = "<a name=\"score\"><big style=\"background: "+color+"; color: black; font-weight:bold; padding: 0px 2px\">"+score+"</big> <input style=\"width: 25px\" type=\"text\" value=\"<li><a HREF=&#x22;"+document.location+"&#x22; onClick=&#x22;pageTracker._trackEvent('FA Digest Jumps', '"+page_data["lower"]+"', '"+page_data["submission_id"]+"');&#x22;>"+title+"</a> &mdash; by <a HREF=&#x22;http://www.furaffinity.net/user/"+page_data["lower"]+"&#x22; onClick=&#x22;pageTracker._trackEvent('FA Digest Jumps', '"+page_data["lower"]+"', '"+page_data["lower"]+"');&#x22;>"+page_data["username"]+"</a>: %INSERT DESCRIPTION% </li>\"></a>"
	
	if (SpecialMention != null) {
        	digestBox.innerHTML = "<big style=\"background: blue; color: white; font-weight:bold; padding: 0px 2px\">SM</big> " + digestBox.innerHTML;
	};

	if (numOfMukes > 5) {
        	digestBox.innerHTML = "<big style=\"background: lightgreen; color: black; font-weight:bold; padding: 0px 2px\">MT</big> " + digestBox.innerHTML;
	};

	if (numOfComments == 0) {
        	digestBox.innerHTML = "<big style=\"background: yellow; color: black; font-weight:bold; padding: 0px 2px\">NC</big> " + digestBox.innerHTML;
	};
	
	if (numOfFavs == 0) {
        	digestBox.innerHTML = "<big style=\"background: red; color: black; font-weight:bold; padding: 0px 2px\">NF</big> " + digestBox.innerHTML;
	};
	
	var omgToolTip = document.getElementById("my-username").parentNode;
//	omgToolTip.appendChild(digestBox);
	omgToolTip.parentNode.insertBefore(digestBox, omgToolTip);
	
	
	// TODO: make these cookied settings for control panel so I don't have to mod them here
	

	// Get that darn banner out of the way!
	// TODO: Fix this so it doesn't depend on whether they're showing ads or not.
	var afterImage = document.getElementsByTagName("div")[10];
	var banner = document.getElementsByClassName("block-banners")[0];
	var news = document.getElementById("news");
	banner.parentNode.removeChild(banner);
	news.parentNode.removeChild(news);
}, false); }
else if (location.href.match(/^http:\/\/[sw][fw]w.furaffinity.net\/controls\//)) {
document.addEventListener('DOMContentLoaded', function ()
{	maintable = $$(".maintable")[2];

	newControls = document.createElement("div")
	newControls.setAttribute("id", "mukescontrols");
	newControls.setAttribute("align", "left");
	newControls.setAttribute("style", "border: solid lightgrey 2px; margin: 0px; padding: 5px");
	newControls.innerHTML = "<p align=\"center\"><b>Muke's controls</b></p><br>";
	
	var mtCheck = document.createElement("input");
	mtCheck.type = "checkbox";
	mtCheck.id = "mtCheck";
	if (getCookie("mtDigest") == "true") {
		mtCheck.setAttribute("checked", "checked");
	};
	mtCheck.onclick = function () { 
		document.cookie="mtDigest="+document.getElementById("mtCheck").checked+"; path=/"
	};
	
	var mtCheckLabel = document.createElement("label");
	mtCheckLabel.setAttribute("for", "mtCheck");
	mtCheckLabel.innerHTML = "Digest Mode";
	newControls.appendChild(mtCheck);
	newControls.appendChild(mtCheckLabel);

	maintable.appendChild(newControls);
}, false); } 
else if (location.href.match(/^http:\/\/[sw][fw]w.furaffinity.net\/msg\/submissions\//)) {
document.addEventListener('DOMContentLoaded', function ()
{	
	if (getCookie("mtDigest") == "true") {
		var subs = new Array();
		var moreLink
		j = 0;
		for(i = 0; i < document.links.length; i++) 
  	{
  		addy = document.links[i];
  		if(addy.href.match(/\/view\//))
  		{
				subs[j] = addy.href;
  			j++;
  		};
  		if(addy.innerText.match(/>>> 60 more >>>/))
  		{
  			moreLink = addy.href;
  		}
  	}
  	
		for(i = 0; i < subs.length; i++) 
		{
  		setTimeout("newTabFor(\""+subs[i]+"\")", 7000*i); // was 3000 but getting freezes
  	}
  	
  	if(document.body.innerHTML.match(/<h3 class="date-divider">Today/) == null)
  	{
  		setTimeout("newTabFor(\""+moreLink+"\")", 7000*subs.length); // was 3000 but getting freezes
  		setTimeout("window.close()", 7000*subs.length+500); // was 3000 but getting freezes
  	}
  };
}, false); }

function newTabFor(addy) {
	window.open(addy, '_blank');
}

function favThreshold(score, days) {
	phi = (1 + Math.sqrt(5)) / 2
	psi = (1 - Math.sqrt(5)) / 2
	score = score + 5
	days = Math.min(score, days)
	return Math.round((Math.pow(psi, (score-days+3)) + Math.pow(phi, (score+3)) - Math.pow(psi, (score+3)) - Math.pow(phi, (score-days+3)))/(phi - psi))
}


